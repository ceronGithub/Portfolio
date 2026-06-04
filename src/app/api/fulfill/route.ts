export const dynamic = "force-dynamic";
// POST /api/checkout/fulfill — Called by the success page after PayMongo redirects.
// Marks all orders in the list as PAID and upserts Ownership for product orders.
// This ensures fulfillment works on localhost where PayMongo webhooks cannot reach.
// On production, the webhook handles this; this route is a safe idempotent fallback.
import { NextRequest, NextResponse } from "next/server";
import { getServerSession }          from "next-auth";
import { authOptions }               from "@/lib/auth";
import { prisma }                    from "@/lib/prisma";
import { revalidatePath }            from "next/cache";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as any).id as string;
  const { orderIds } = await req.json();

  if (!Array.isArray(orderIds) || orderIds.length === 0)
    return NextResponse.json({ error: "orderIds required" }, { status: 400 });

  // Fetch orders — only allow the requesting user's own orders
  const orders = await prisma.order.findMany({
    where: {
      id:     { in: orderIds },
      userId,
    },
  });

  if (orders.length === 0)
    return NextResponse.json({ error: "No matching orders" }, { status: 404 });

  // Process each order — idempotent: skip if already PAID
  await Promise.all(
    orders.map(async (order: {
      id: string; userId: string; status: string;
      productId: string | null; deliveryNote: string | null;
    }) => {
      if (order.status === "PAID") return; // already fulfilled

      // Mark order as PAID
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
    })
  );

  revalidatePath("/buyer/downloads", "layout");
  revalidatePath("/buyer/orders",    "layout");

  return NextResponse.json({ ok: true, fulfilled: orders.length });
}