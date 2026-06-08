export const dynamic = 'force-dynamic';
// PATCH /api/admin/orders/[id] — update status, deliveryNote, estimatedAt
// Admin-only.
import { NextRequest, NextResponse } from "next/server";
import { getServerSession }          from "next-auth";
import { authOptions }               from "@/lib/auth";
import { prisma }                    from "@/lib/prisma";

const VALID_STATUSES = [
  "PAID", "PENDING", "FAILED",
  "IN_DEVELOPMENT", "IN_TESTING", "DELIVERED",
] as const;

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const body = await req.json();

  // Build update payload — only include provided fields
  const data: Record<string, any> = {};

  if (body.status !== undefined) {
    if (!VALID_STATUSES.includes(body.status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }
    data.status = body.status;
  }

  if (body.deliveryNote !== undefined) {
    data.deliveryNote = body.deliveryNote ?? null;
  }

  if (body.estimatedAt !== undefined) {
    data.estimatedAt = body.estimatedAt ? new Date(body.estimatedAt) : null;
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  const order = await prisma.order.update({ where: { id }, data });
  return NextResponse.json({ order });
}
// ── DELETE /api/admin/orders/[id] — removes the order record from DB ─────────
// Admin-only. Hard delete — no cascade needed (Order has no child relations).
export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;

  try {
    await prisma.order.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    // P2025 = record not found
    if (err?.code === "P2025") {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }
    return NextResponse.json({ error: err?.message ?? "Server error" }, { status: 500 });
  }
}
