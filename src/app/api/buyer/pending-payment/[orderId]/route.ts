export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse }        from "next/server";
import { getServerSession }                 from "next-auth";
import { authOptions }                      from "@/lib/auth";
import { prisma }                           from "@/lib/prisma";
import { getPaymentLink, createPaymentLink } from "@/lib/paymongo";

// Mirrors the multiplier in checkout/bundle/page.tsx and pending-payments/page.tsx.
// Returns the correct price for the given tier directly from product fields
function getTierPrice(product: { priceMeshOnly: number; priceStandard: number; priceFullPack: number }, tier: string): number {
  if (tier === "mesh_only") return product.priceMeshOnly;
  if (tier === "standard")  return product.priceStandard;
  return product.priceFullPack; // full_pack
}

// Extract tier from deliveryNote (stored as "tier:mesh_only" etc.)
function extractTier(deliveryNote: string | null): string {
  if (!deliveryNote) return "full_pack";
  const match = deliveryNote.match(/tier:(\S+)/);
  return match?.[1] ?? "full_pack";
}

/**
 * GET /api/buyer/pending-payment/[orderId]
 *
 * Returns a checkout URL for a PENDING order.
 *
 * Price is ALWAYS computed from product.price × tier multiplier — never hardcoded,
 * never trusts a potentially stale amountPaid value.
 *
 * Strategy:
 *  1. Load order + product.price + deliveryNote from DB.
 *  2. Recompute the correct PHP amount from product.price + tier.
 *  3. Try to re-use the existing PayMongo link if still "unpaid".
 *  4. If expired or missing, create a fresh link at the correct price
 *     and persist the new link ID to the order row.
 */
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ orderId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id as string;
    const { orderId } = await context.params;

    // Fetch order + product so we can recompute the correct price from DB
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id:              true,
        userId:          true,
        status:          true,
        paymongoOrderId: true,
        deliveryNote:    true,
        product: {
          select: { id: true, name: true, priceMeshOnly: true, priceStandard: true, priceFullPack: true },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }
    if (order.userId !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    if (order.status !== "PENDING") {
      return NextResponse.json({ error: "Order is not pending" }, { status: 400 });
    }
    if (!order.product) {
      return NextResponse.json({ error: "Product not found for this order" }, { status: 404 });
    }

    // Recompute correct amount — always from DB tier price, never hardcoded
    const tier      = extractTier(order.deliveryNote);
    const amountPHP = getTierPrice(order.product, tier);

    if (amountPHP <= 0) {
      return NextResponse.json(
        { error: "Could not determine order amount. Contact support." },
        { status: 422 }
      );
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

    // ── 1. Try to re-use existing PayMongo link if still valid ───────────
    if (order.paymongoOrderId) {
      try {
        const existing   = await getPaymentLink(order.paymongoOrderId);
        const checkoutUrl = existing?.attributes?.checkout_url as string | undefined;
        const linkStatus  = existing?.attributes?.status as string | undefined;

        if (checkoutUrl && linkStatus === "unpaid") {
          return NextResponse.json({ checkoutUrl, orderId: order.id, amount: amountPHP });
        }
      } catch {
        // Link retrieval failed — fall through to create a new one
      }
    }

    // ── 2. Create a fresh PayMongo link at the correct DB-derived price ──
    const newLink = await createPaymentLink({
      amount:      amountPHP,   // PHP — createPaymentLink converts to centavos internally
      description: `Retry Payment — ${order.product.name}`,
      remarks:     `Order: ${order.id} | Tier: ${tier}`,
      referenceId: order.id,
      successUrl:  `${appUrl}/checkout/success?orders=${encodeURIComponent(order.id)}`,
      failedUrl:   `${appUrl}/checkout/failed?orders=${encodeURIComponent(order.id)}`,
    });

    // Persist new link ID and correct amountPaid back to DB
    await prisma.order.update({
      where: { id: order.id },
      data:  {
        paymongoOrderId: newLink.id,
        amountPaid:      amountPHP,   // correct the stored amount too
      },
    });

    return NextResponse.json({
      checkoutUrl: newLink.checkoutUrl,
      orderId:     order.id,
      amount:      amountPHP,
    });

  } catch (err) {
    console.error("[GET /api/buyer/pending-payment]", err);
    return NextResponse.json(
      { error: "Failed to retrieve payment link" },
      { status: 500 }
    );
  }
}
