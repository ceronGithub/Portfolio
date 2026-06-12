export const dynamic = "force-dynamic";
// POST /api/maintenance/fulfill
// Called by checkout/success page and PendingPaymentsClient after PayMongo redirects.
// Strategy (Rule 30.3):
//   1. Check Order.paymentStatus === "paid" OR Order.status === "PAID" (set by webhook).
//   2. If confirmed → mark Order PAID + create/activate MaintenanceOrder.
//   3. Only fall back to PayMongo link check if webhook hasn't fired yet.
// Idempotent: safe to call multiple times.

import { NextRequest, NextResponse } from "next/server";
import { getServerSession }          from "next-auth";
import { authOptions }               from "@/lib/auth";
import { prisma }                    from "@/lib/prisma";
import { getPaymentLink }            from "@/lib/paymongo";
import { revalidatePath }            from "next/cache";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as any).id as string;
  const { orderId } = await req.json();

  if (!orderId)
    return NextResponse.json({ error: "orderId required" }, { status: 400 });

  // Fetch the order — must belong to this buyer and be a maintenance order
  const order = await (prisma as any).order.findFirst({
    where: { id: orderId, userId },
    select: {
      id:                true,
      userId:            true,
      status:            true,
      deliveryNote:      true,
      paymongoOrderId:   true,
      paymentStatus:     true,  // set by webhook (Rule 30.2)
    },
  });

  if (!order)
    return NextResponse.json({ error: "Order not found" }, { status: 404 });

  // Must be a maintenance order
  if (!order.deliveryNote?.startsWith("maintenance:"))
    return NextResponse.json({ error: "Not a maintenance order" }, { status: 400 });

  // Already fulfilled — return success immediately (idempotent)
  if (order.status === "PAID")
    return NextResponse.json({ ok: true, already: true });

  // ── Rule 30.3: Check DB payment status first (set by webhook) ──────────────
  // If webhook already fired and saved paymentStatus = "paid", proceed immediately.
  // Only fall back to PayMongo API query if webhook hasn't fired yet.
  const confirmedByWebhook = order.paymentStatus === "paid";

  if (!confirmedByWebhook && order.paymongoOrderId) {
    try {
      const link       = await getPaymentLink(order.paymongoOrderId);
      const linkStatus = link?.attributes?.status as string | undefined;
      if (linkStatus !== "paid") {
        return NextResponse.json({ ok: false, pending: true }, { status: 402 });
      }
    } catch {
      // PayMongo unreachable — optimistically proceed (webhook will reconcile)
    }
  }

  // Extract package type from deliveryNote (format: "maintenance:BASIC")
  const packageType = order.deliveryNote.replace("maintenance:", "");

  // Mark order as PAID
  await (prisma as any).order.update({
    where: { id: order.id },
    data:  { status: "PAID" },
  });

  // Create or reactivate MaintenanceOrder for this buyer
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30);

  // Expire any existing non-active orders for this buyer first
  await prisma.maintenanceOrder.updateMany({
    where:  { userId, status: { not: "ACTIVE" } },
    data:   { status: "EXPIRED" },
  });

  // Check if there's already an active one (idempotency)
  const existingActive = await prisma.maintenanceOrder.findFirst({
    where: { userId, status: "ACTIVE" },
  });

  if (!existingActive) {
    await prisma.maintenanceOrder.create({
      data: {
        userId,
        package:   packageType,
        expiresAt,
      },
    });
  }

  revalidatePath("/buyer/maintenance", "layout");
  revalidatePath("/admin/maintenance", "layout");

  return NextResponse.json({ ok: true });
}
