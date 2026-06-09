// GET /api/buyer/pending-payment/statuses?ids=id1,id2,...
// Returns the current status of each order ID for the logged-in buyer.
// Used by PendingPaymentsClient to poll for payment confirmation in real time.

export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession }          from "next-auth";
import { authOptions }               from "@/lib/auth";
import { prisma }                    from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId  = (session.user as any).id as string;
    const rawIds  = req.nextUrl.searchParams.get("ids") ?? "";
    const orderIds = rawIds.split(",").map((id) => id.trim()).filter(Boolean);

    if (orderIds.length === 0) {
      return NextResponse.json({ statuses: {} });
    }

    // Fetch only orders that belong to this user — never expose other users' data
    const orders = await prisma.order.findMany({
      where:  { id: { in: orderIds }, userId },
      select: { id: true, status: true },
    });

    // Build { orderId → status } map
    const statuses: Record<string, string> = {};
    for (const order of orders) {
      statuses[order.id] = order.status;
    }

    return NextResponse.json({ statuses });
  } catch (err) {
    console.error("[GET /api/buyer/pending-payment/statuses]", err);
    return NextResponse.json({ error: "Failed to fetch statuses" }, { status: 500 });
  }
}