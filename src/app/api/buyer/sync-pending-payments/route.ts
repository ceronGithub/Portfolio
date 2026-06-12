export const dynamic = "force-dynamic";
// POST /api/buyer/sync-pending-payments
// Auto-recovery route — called on buyer/orders page load.
// For every PENDING order belonging to the buyer, checks PayMongo link status.
// If PayMongo confirms the link is "paid" but the webhook has not yet updated the DB,
// this route fulfills the order immediately — preventing orders from being stuck PENDING
// due to webhook delivery failures (e.g. low signal, localtunnel downtime, retries).
// Idempotent: already-PAID orders are skipped safely.

import { NextRequest, NextResponse } from "next/server";
import { getServerSession }          from "next-auth";
import { authOptions }               from "@/lib/auth";
import { prisma }                    from "@/lib/prisma";
import { getPaymentLink }            from "@/lib/paymongo";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as any).id as string;

  // Fetch all PENDING orders with a PayMongo link ID for this buyer
  const pendingOrders = await prisma.order.findMany({
    where: {
      userId,
      status:          "PENDING",
      paymongoOrderId: { not: null },
    },
    select: {
      id:              true,
      productId:       true,
      deliveryNote:    true,
      paymongoOrderId: true,
      paymentStatus:   true,
    },
  });

  if (pendingOrders.length === 0)
    return NextResponse.json({ ok: true, synced: 0 });

  let syncedCount = 0;

  await Promise.all(
    pendingOrders.map(async (order: {
      id: string;
      productId: string | null;
      deliveryNote: string | null;
      paymongoOrderId: string | null;
      paymentStatus: string | null;
    }) => {
      // ── Step 1: Check if webhook already set paymentStatus ──────────────
      // If webhook already fired but fulfill hasn't run yet, use DB status.
      const confirmedByWebhook = order.paymentStatus === "paid";

      if (!confirmedByWebhook) {
        // ── Step 2: Query PayMongo directly to check link status ───────────
        try {
          const link       = await getPaymentLink(order.paymongoOrderId!);
          const linkStatus = link?.attributes?.status as string | undefined;

          // Link not paid yet — skip this order
          if (linkStatus !== "paid") return;
        } catch {
          // PayMongo unreachable — skip silently, will retry on next page load
          return;
        }
      }

      // ── Step 3: Mark order PAID ──────────────────────────────────────────
      await prisma.order.update({
        where: { id: order.id },
        data:  { status: "PAID" },
      });

      // ── Step 4: Parse tier from deliveryNote (format: "tier:mesh_only") ──
      const tierMatch   = (order.deliveryNote ?? "").match(/^tier:(.+)$/);
      const grantedTier = tierMatch?.[1] ?? "mesh_only";

      // ── Step 5: Upsert Ownership for product orders only ─────────────────
      if (order.productId) {
        await (prisma.ownership as any).upsert({
          where:  { userId_productId: { userId, productId: order.productId } },
          update: { grantedTier },
          create: { userId, productId: order.productId, grantedTier },
        });
      }

      // ── Step 6: Handle maintenance orders ────────────────────────────────
      // deliveryNote format: "maintenance:BASIC" / "maintenance:PRIORITY" / "maintenance:FULL"
      if (typeof order.deliveryNote === "string" && order.deliveryNote.startsWith("maintenance:")) {
        const packageType = order.deliveryNote.replace("maintenance:", "");
        // Expire any existing active maintenance order for this user first
        await prisma.maintenanceOrder.updateMany({
          where: { userId, status: "ACTIVE" },
          data:  { status: "EXPIRED" },
        });
        // Create new active maintenance order
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 30);
        await prisma.maintenanceOrder.create({
          data: { userId, package: packageType, status: "ACTIVE", expiresAt },
        });
      }

      syncedCount++;
    })
  );

  return NextResponse.json({ ok: true, synced: syncedCount });
}
