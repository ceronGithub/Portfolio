export const dynamic = 'force-dynamic';
// GET /api/buyer/notifications
// Buyer-only. Returns unread counts relevant to the logged-in buyer.
// pendingOrders  → buyer orders still in PENDING status (awaiting downpayment)
// activeOrders   → orders in PAID / IN_DEVELOPMENT / IN_TESTING (in progress)
// recentDelivered → orders marked DELIVERED in last 7 days
// confirmedVc    → VCSchedule rows with status CONFIRMED (upcoming calls)
// resolvedBugs   → BugReport rows resolved in last 7 days
// total          → sum of all above

import { NextResponse }    from "next/server";
import { getServerSession } from "next-auth";
import { authOptions }      from "@/lib/auth";
import { prisma }           from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId       = (session.user as any).id as string;
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [pendingOrders, activeOrders, recentDelivered, confirmedVc, resolvedBugs] =
    await Promise.all([
      prisma.order.count({ where: { userId, status: "PENDING" } }),
      prisma.order.count({ where: { userId, status: { in: ["PAID", "IN_DEVELOPMENT", "IN_TESTING"] } } }),
      prisma.order.count({ where: { userId, status: "DELIVERED", deliveredAt: { gte: sevenDaysAgo } } }),
      prisma.vCSchedule.count({
        where: { status: "CONFIRMED", order: { userId } },
      }),
      prisma.bugReport.count({
        where: { status: "RESOLVED", resolvedAt: { gte: sevenDaysAgo }, order: { userId } },
      }),
    ]);

  const total = pendingOrders + activeOrders + recentDelivered + confirmedVc + resolvedBugs;

  return NextResponse.json({ total, pendingOrders, activeOrders, recentDelivered, confirmedVc, resolvedBugs });
}
