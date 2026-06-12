// POST /api/paymongo/webhook — Handles PayMongo webhook events.
// On link.payment.paid:
//   1. Finds all orders with matching paymongoOrderId (link ID)
//   2. Updates each order status to PAID
//   3. Upserts Ownership ONLY for product orders (productId non-null)
//      System orders (systemId set, productId null) are skipped — no Ownership row needed.
//   4. Revalidates /buyer/downloads and /buyer/orders
import { NextRequest, NextResponse } from "next/server";
import { prisma }                    from "@/lib/prisma";
import { verifyWebhookSignature }    from "@/lib/paymongo";
import { revalidatePath }            from "next/cache";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const rawBody   = await req.text();
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

  // ── link.payment.paid / payment.paid ────────────────────────────────────
  // PayMongo may send either event type depending on API version and webhook config.
  if (eventType === "link.payment.paid" || eventType === "payment.paid") {
    // linkId may be at different paths depending on event type
    const linkId: string | undefined =
      event?.data?.attributes?.data?.id ??
      event?.data?.attributes?.data?.attributes?.links?.[0] ??
      event?.data?.attributes?.payment?.links?.[0]?.href?.split("/").pop();
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
      orders.map(async (order: {
        id: string; userId: string;
        productId: string | null; systemId: string | null;
        deliveryNote: string | null;
      }) => {
        // Parse tier from deliveryNote (format: "tier:full_pack")
        const tierMatch   = (order.deliveryNote ?? "").match(/^tier:(.+)$/);
        const grantedTier = tierMatch?.[1] ?? "mesh_only";

        // Mark order as PAID
        await prisma.order.update({
          where: { id: order.id },
          data:  { status: "PAID" },
        });

        // Auto-unlock Ownership for product orders, activate MaintenanceOrder for maintenance orders
        if (order.productId) {
          await (prisma.ownership as any).upsert({
            where:  { userId_productId: { userId: order.userId, productId: order.productId } },
            update: { grantedTier },
            create: { userId: order.userId, productId: order.productId, grantedTier },
          });
          console.log(
            `[PayMongo Webhook] Unlocked product ${order.productId} for user ${order.userId} at tier ${grantedTier}`
          );
        } else if (order.deliveryNote?.startsWith("maintenance:")) {
          // Maintenance order — activate a MaintenanceOrder for this buyer
          const packageType = order.deliveryNote.replace("maintenance:", "");
          const expiresAt   = new Date();
          expiresAt.setDate(expiresAt.getDate() + 30);

          // Expire any non-active maintenance orders for this buyer
          await prisma.maintenanceOrder.updateMany({
            where: { userId: order.userId, status: { not: "ACTIVE" } },
            data:  { status: "EXPIRED" },
          });

          // Create new MaintenanceOrder only if none is already active (idempotent)
          const existing = await prisma.maintenanceOrder.findFirst({
            where: { userId: order.userId, status: "ACTIVE" },
          });
          if (!existing) {
            await prisma.maintenanceOrder.create({
              data: { userId: order.userId, package: packageType, expiresAt },
            });
          }

          revalidatePath("/buyer/maintenance", "layout");
          revalidatePath("/admin/maintenance", "layout");
          console.log(
            `[PayMongo Webhook] Maintenance order ${order.id} activated for user ${order.userId} — package: ${packageType}`
          );
        } else {
          console.log(
            `[PayMongo Webhook] System order ${order.id} marked PAID — no Ownership row needed`
          );
        }
      })
    );

    revalidatePath("/buyer/downloads",       "layout");
    revalidatePath("/buyer/orders",          "layout");
    revalidatePath("/buyer/pending-payments", "layout");
    revalidatePath("/admin/orders",          "layout");

    return NextResponse.json({ ok: true, unlocked: orders.length });
  }

  // ── link.payment.failed / payment.failed ────────────────────────────────
  if (eventType === "link.payment.failed" || eventType === "payment.failed") {
    const linkId: string | undefined =
      event?.data?.attributes?.data?.id ??
      event?.data?.attributes?.payment?.links?.[0]?.href?.split("/").pop();
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