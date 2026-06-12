export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse }        from "next/server";
import { getServerSession }                 from "next-auth";
import { authOptions }                      from "@/lib/auth";
import { prisma }                           from "@/lib/prisma";
import { getPaymentLink, createPaymentLink } from "@/lib/paymongo";

// Returns the correct price for the given tier directly from product fields
function getTierPrice(product: { priceMeshOnly: number; priceStandard: number; priceFullPack: number }, tier: string): number {
  if (tier === "mesh_only") return product.priceMeshOnly;
  if (tier === "standard")  return product.priceStandard;
  return product.priceFullPack;
}

// Extract tier from deliveryNote (stored as "tier:mesh_only" etc.)
function extractTier(deliveryNote: string | null): string {
  if (!deliveryNote) return "full_pack";
  const match = deliveryNote.match(/tier:(\S+)/);
  return match?.[1] ?? "full_pack";
}

// Returns true if the order is a maintenance package (productId is null, deliveryNote starts with "maintenance:")
function isMaintenanceOrder(deliveryNote: string | null): boolean {
  return typeof deliveryNote === "string" && deliveryNote.startsWith("maintenance:");
}

/**
 * GET /api/buyer/pending-payment/[orderId]
 *
 * Returns a checkout URL for a PENDING order.
 * Handles both digital product orders and maintenance package orders.
 *
 * Strategy:
 *  1. Load order from DB.
 *  2. Determine order type (product vs maintenance).
 *  3. Recompute the correct PHP amount.
 *  4. Try to re-use the existing PayMongo link if still "unpaid".
 *  5. If expired or missing, create a fresh link and persist new link ID.
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

    // Fetch order + product (product may be null for maintenance orders)
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id:              true,
        userId:          true,
        status:          true,
        amountPaid:      true,
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

    const isMaint = isMaintenanceOrder(order.deliveryNote);

    // ── Resolve amount ────────────────────────────────────────────────────────
    let amountPHP: number;
    let itemDescription: string;

    if (isMaint) {
      // Maintenance orders: use amountPaid stored at checkout creation time
      amountPHP       = order.amountPaid as number;
      itemDescription = "Retry Payment — Maintenance Package";
    } else {
      if (!order.product) {
        return NextResponse.json({ error: "Product not found for this order" }, { status: 404 });
      }
      const tier  = extractTier(order.deliveryNote);
      amountPHP       = getTierPrice(order.product, tier);
      itemDescription = `Retry Payment — ${order.product.name}`;
    }

    if (!amountPHP || amountPHP <= 0) {
      return NextResponse.json(
        { error: "Could not determine order amount. Contact support." },
        { status: 422 }
      );
    }

    const appUrl      = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const successBase = `${appUrl}/checkout/success?orders=${encodeURIComponent(order.id)}`;
    // Maintenance orders must include type=maintenance so the success page redirects correctly
    const successUrl  = isMaint ? `${successBase}&type=maintenance` : successBase;
    const failedUrl   = `${appUrl}/checkout/failed?orders=${encodeURIComponent(order.id)}`;

    // ── 1. Try to re-use existing PayMongo link if still valid ───────────────
    // If the link is already "paid", the buyer has already completed payment —
    // return alreadyPaid so the UI triggers fulfill instead of opening a new checkout.
    if (order.paymongoOrderId) {
      try {
        const existing    = await getPaymentLink(order.paymongoOrderId);
        const checkoutUrl = existing?.attributes?.checkout_url as string | undefined;
        const linkStatus  = existing?.attributes?.status as string | undefined;

        if (checkoutUrl && linkStatus === "unpaid") {
          return NextResponse.json({ checkoutUrl, orderId: order.id, amount: amountPHP });
        }

        if (linkStatus === "paid") {
          return NextResponse.json({ alreadyPaid: true, orderId: order.id });
        }
      } catch {
        // Link retrieval failed — fall through to create a new one
      }
    }

    // ── 2. Create a fresh PayMongo link ──────────────────────────────────────
    const newLink = await createPaymentLink({
      amount:      amountPHP,
      description: itemDescription,
      remarks:     `Order: ${order.id}`,
      referenceId: order.id,
      successUrl,
      failedUrl,
    });

    // Persist new link ID back to DB
    await prisma.order.update({
      where: { id: order.id },
      data:  { paymongoOrderId: newLink.id },
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