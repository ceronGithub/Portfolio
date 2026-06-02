export const dynamic = 'force-dynamic';
// api/admin/reviews/route.ts — Admin: GET all reviews, PATCH (hide/highlight/pin/reply), DELETE.

import { NextRequest, NextResponse } from "next/server";
import { getServerSession }          from "next-auth";
import { authOptions }               from "@/lib/auth";
import { prisma }                    from "@/lib/prisma";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== "ADMIN") return null;
  return session;
}

// ── GET /api/admin/reviews ─────────────────────────────────────────────────
export async function GET() {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const reviews = await prisma.review.findMany({
    orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
    include: { user: { select: { name: true, email: true } } },
  });

  return NextResponse.json(reviews.map((r: any) => ({
    id:            r.id,
    rating:        r.rating,
    comment:       r.comment ?? "",
    assetId:       r.assetId,
    createdAt:     r.createdAt.toISOString(),
    buyerName:     r.user.name ?? r.user.email.split("@")[0],
    email:         r.user.email,
    isHidden:      r.isHidden,
    isHighlighted: r.isHighlighted,
    isPinned:      r.isPinned,
    adminReply:    r.adminReply ?? null,
  })));
}

// ── PATCH /api/admin/reviews?id=<id> — toggle hide/highlight/pin, set adminReply ──
export async function PATCH(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const reviewId = req.nextUrl.searchParams.get("id");
  if (!reviewId) return NextResponse.json({ error: "id required" }, { status: 400 });

  const body = await req.json().catch(() => ({}));
  const updateData: Record<string, unknown> = {};

  if (body.isHidden      !== undefined) updateData.isHidden      = Boolean(body.isHidden);
  if (body.isHighlighted !== undefined) updateData.isHighlighted = Boolean(body.isHighlighted);
  if (body.isPinned      !== undefined) updateData.isPinned      = Boolean(body.isPinned);
  if (body.adminReply    !== undefined) updateData.adminReply    = body.adminReply !== null ? String(body.adminReply).trim() : null;

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  const updated = await prisma.review.update({ where: { id: reviewId }, data: updateData });
  return NextResponse.json({ id: updated.id, ...updateData });
}

// ── DELETE /api/admin/reviews?id=<id> ─────────────────────────────────────
export async function DELETE(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const reviewId = req.nextUrl.searchParams.get("id");
  if (!reviewId) return NextResponse.json({ error: "id required" }, { status: 400 });

  await prisma.review.delete({ where: { id: reviewId } });
  return NextResponse.json({ success: true });
}
