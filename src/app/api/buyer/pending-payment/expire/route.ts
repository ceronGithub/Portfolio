export const dynamic = "force-dynamic";
// api/buyer/pending-payment/expire/route.ts
// POST — Marks a PENDING order as LINK_EXPIRED when the 24h payment window has passed.
// Only transitions PENDING → LINK_EXPIRED. Called by the buyer pending-payments page
// on mount when a link is detected as expired.

import { NextRequest, NextResponse } from "next/server";
import { getServerSession }          from "next-auth";
import { authOptions }               from "@/lib/auth";
import { prisma }                    from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as any).id as string;
  const { orderId } = await req.json().catch(() => ({}));

  if (!orderId) return NextResponse.json({ error: "orderId required" }, { status: 400 });

  // Verify order belongs to buyer and is still PENDING
  const order = await prisma.order.findUnique({
    where:  { id: orderId },
    select: { id: true, userId: true, status: true, createdAt: true },
  });

  if (!order || order.userId !== userId) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  if (order.status !== "PENDING") {
    return NextResponse.json({ error: "Order is not pending" }, { status: 400 });
  }

  // Only mark expired if >24h have passed
  const hoursElapsed = (Date.now() - new Date(order.createdAt).getTime()) / (1000 * 60 * 60);
  if (hoursElapsed < 24) {
    return NextResponse.json({ error: "Link has not expired yet" }, { status: 400 });
  }

  await prisma.order.update({
    where: { id: orderId },
    data:  { status: "LINK_EXPIRED" },
  });

  return NextResponse.json({ success: true });
}
