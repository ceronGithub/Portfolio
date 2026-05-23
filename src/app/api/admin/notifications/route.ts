// GET /api/admin/notifications
// Admin-only. Returns unread counts for orders, inquiries, reviews, messages.
// Unread definitions:
//   orders   → status PENDING
//   messages → ContactMessage status "new"
//   inquiries → status "pending"
//   reviews  → created within last 7 days (no read flag)
// Polled every 30 s by the navbar badge.

import { NextResponse }     from "next/server";
import { getServerSession }  from "next-auth";
import { authOptions }       from "@/lib/auth";
import { prisma }            from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [orders, messages, inquiries, reviews] = await Promise.all([
    prisma.order.count({ where: { status: "PENDING" } }),
    (prisma as any).contactMessage.count({ where: { status: "new" } }).catch(() => 0),
    prisma.inquiry.count({ where: { status: "pending" } }),
    prisma.review.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
  ]);

  return NextResponse.json({
    total: orders + messages + inquiries + reviews,
    orders,
    messages,
    inquiries,
    reviews,
  });
}