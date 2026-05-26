// POST /api/paymongo/webhook — Handles PayMongo webhook events.
// On link.payment.paid:
//   1. Finds all orders with matching paymongoOrderId (link ID)
//   2. Updates each order status to PAID
//   3. Upserts Ownership with grantedTier from the order's deliveryNote
//   4. Revalidates /buyer/downloads and /buyer/orders
import { NextRequest, NextResponse } from "next/server";
import { prisma }                    from "@/lib/prisma";
import { verifyWebhookSignature }    from "@/lib/paymongo";
import { revalidatePath }            from "next/cache";

// PayMongo requires raw body for signature verification
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const rawBody  = await req.text();
  const sigHeader = req.headers.get("paymongo-signature") ?? "";

  // Verify signature (skip in dev if secret not set)
  const isProd = process.env.NODE_ENV === "production";
  if (isProd || process.env.PAYMONGO_WEBHOOK_SECRET) {
    const valid = await verifyWebhookSignature(rawBody, sigHeader);
    if (!valid) {
      console.warn("[PayMongo Webhook] Invalid signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }
  }

  let event: any;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const eventType = event?.data?.attributes?.type;
  console.log("[PayMongo Webhook] Event:", eventType);

  // ── link.payment.paid ────────────────────────────────────────────────────
  if (eventType === "link.payment.paid") {
    const linkId = event?.data?.attributes?.data?.id as string | undefined;
    if (!linkId) {
      return NextResponse.json({ error: "No link ID in event" }, { status: 400 });
    }

    // Find all orders tied to this PayMongo link
    const orders = await prisma.order.findMany({
      where: { paymongoOrderId: linkId },
    });

    if (orders.length === 0) {
      console.warn("[PayMongo Webhook] No orders found for link:", linkId);
      return NextResponse.json({ ok: true, warning: "No matching orders" });
    }

    // Process each order
    await Promise.all(
      orders.map(async (order: { id: string; userId: string; productId: string | null; deliveryNote: string | null }) => {
        // Parse tier from deliveryNote (format: "tier:full_pack")
        const tierMatch  = (order.deliveryNote ?? "").match(/^tier:(.+)$/);
        const grantedTier = tierMatch?.[1] ?? "mesh_only";

        // Mark order as PAID
        await prisma.order.update({
          where: { id: order.id },
          data:  { status: "PAID" },
        });

        // Auto-unlock: upsert Ownership with buyer's chosen tier
        await (prisma.ownership as any).upsert({
          where:  { userId_productId: { userId: order.userId, productId: order.productId } },
          update: { grantedTier },
          create: { userId: order.userId, productId: order.productId, grantedTier },
        });

        console.log(
          `[PayMongo Webhook] Unlocked product ${order.productId} for user ${order.userId} at tier ${grantedTier}`
        );
      })
    );

    revalidatePath("/buyer/downloads", "layout");
    revalidatePath("/buyer/orders",    "layout");

    return NextResponse.json({ ok: true, unlocked: orders.length });
  }

  // ── link.payment.failed ──────────────────────────────────────────────────
  if (eventType === "link.payment.failed") {
    const linkId = event?.data?.attributes?.data?.id as string | undefined;
    if (linkId) {
      await prisma.order.updateMany({
        where: { paymongoOrderId: linkId },
        data:  { status: "FAILED" },
      });
      console.log("[PayMongo Webhook] Marked orders as FAILED for link:", linkId);
    }
    return NextResponse.json({ ok: true });
  }

  // Unhandled event types — acknowledge so PayMongo doesn't retry
  return NextResponse.json({ ok: true, ignored: eventType });
}