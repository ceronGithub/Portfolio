// api/admin/reviews/route.ts — Admin-only: GET all reviews + DELETE by id.
// GET returns all reviews joined with user + assetId.
// DELETE requires ?id=<reviewId> query param.

import { NextRequest, NextResponse } from "next/server";
import { getServerSession }          from "next-auth";
import { authOptions }               from "@/lib/auth";
import { prisma }                    from "@/lib/prisma";

// ── Guard: Admin only ─────────────────────────────────────────────────────────
async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== "ADMIN") return null;
  return session;
}

// ── GET /api/admin/reviews — fetch all reviews newest-first ──────────────────
export async function GET() {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const reviews = await prisma.review.findMany({
    orderBy: { createdAt: "desc" },
    include: { user: { select: { name: true, email: true } } },
  });

  return NextResponse.json(reviews.map((r: any) => ({
    id:        r.id,
    rating:    r.rating,
    comment:   r.comment ?? "",
    assetId:   r.assetId,
    createdAt: r.createdAt.toISOString(),
    buyerName: r.user.name ?? r.user.email.split("@")[0],
    email:     r.user.email,
  })));
}

// ── DELETE /api/admin/reviews?id=<reviewId> — remove a review ────────────────
export async function DELETE(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const reviewId = req.nextUrl.searchParams.get("id");
  if (!reviewId) return NextResponse.json({ error: "id required" }, { status: 400 });

  await prisma.review.delete({ where: { id: reviewId } });
  return NextResponse.json({ success: true });
}