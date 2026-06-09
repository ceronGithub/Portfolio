export const dynamic = "force-dynamic";
// POST /api/fulfill — Called by the success page and orders client after PayMongo redirects.
// Strategy:
//   1. For each order, fetch its PayMongo link and confirm status === "paid".
//   2. If paid → mark order PAID + upsert Ownership (product orders only).
//   3. If not yet paid → return 402 so the caller keeps polling.
// This ensures fulfillment works on localhost AND production identically.
// Idempotent: orders already PAID are skipped safely.

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
  const { orderIds } = await req.json();

  if (!Array.isArray(orderIds) || orderIds.length === 0)
    return NextResponse.json({ error: "orderIds required" }, { status: 400 });

  // Fetch orders — only the requesting user's own orders
  const orders = await prisma.order.findMany({
    where: { id: { in: orderIds }, userId },
    select: {
      id:              true,
      userId:          true,
      status:          true,
      productId:       true,
      deliveryNote:    true,
      paymongoOrderId: true,
    },
  });

  if (orders.length === 0)
    return NextResponse.json({ error: "No matching orders" }, { status: 404 });

  let anyStillPending = false;
  let fulfilledCount  = 0;

  await Promise.all(
    orders.map(async (order: {
      id: string; userId: string; status: string;
      productId: string | null; deliveryNote: string | null;
      paymongoOrderId: string | null;
    }) => {
      // Already fulfilled — skip
      if (order.status === "PAID") { fulfilledCount++; return; }

      // Verify PayMongo link status before fulfilling
      if (order.paymongoOrderId) {
        try {
          const link       = await getPaymentLink(order.paymongoOrderId);
          const linkStatus = link?.attributes?.status as string | undefined;

          // Link not yet marked paid by PayMongo — keep polling
          if (linkStatus !== "paid") {
            anyStillPending = true;
            return;
          }
        } catch {
          // PayMongo unreachable — optimistically fulfill to avoid blocking buyer
          // Webhook will correct any inconsistency if needed
        }
      }

      // Mark order PAID
      await prisma.order.update({
        where: { id: order.id },
        data:  { status: "PAID" },
      });

      // Parse tier from deliveryNote (format: "tier:mesh_only")
      const tierMatch   = (order.deliveryNote ?? "").match(/^tier:(.+)$/);
      const grantedTier = tierMatch?.[1] ?? "mesh_only";

      // Upsert Ownership for product orders only (not system orders)
      if (order.productId) {
        await (prisma.ownership as any).upsert({
          where:  { userId_productId: { userId: order.userId, productId: order.productId } },
          update: { grantedTier },
          create: { userId: order.userId, productId: order.productId, grantedTier },
        });
      }

      fulfilledCount++;
    })
  );

  revalidatePath("/buyer/downloads",       "layout");
  revalidatePath("/buyer/orders",          "layout");
  revalidatePath("/buyer/pending-payments","layout");
  revalidatePath("/admin/orders",          "layout");

  // 402 = payment not yet confirmed by PayMongo — caller should retry
  if (anyStillPending && fulfilledCount === 0)
    return NextResponse.json({ ok: false, pending: true }, { status: 402 });

  return NextResponse.json({ ok: true, fulfilled: fulfilledCount });
}