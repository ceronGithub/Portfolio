export const dynamic = "force-dynamic";
// api/reviews/[id]/route.ts — PATCH: buyer edits their own review (rating + comment).
// Only the review owner can edit. isHidden/isPinned/adminReply are preserved.

import { NextRequest, NextResponse } from "next/server";
import { getServerSession }          from "next-auth";
import { authOptions }               from "@/lib/auth";
import { prisma }                    from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId   = (session.user as any).id as string;
  const reviewId = params.id;
  const body     = await req.json();
  const { rating, comment } = body;

  if (!rating || typeof rating !== "number" || rating < 1 || rating > 5) {
    return NextResponse.json({ error: "rating must be 1–5" }, { status: 400 });
  }
  if (comment && comment.length > 500) {
    return NextResponse.json({ error: "comment max 500 chars" }, { status: 400 });
  }

  // Verify the review belongs to this buyer
  const existing = await prisma.review.findUnique({ where: { id: reviewId } });
  if (!existing) {
    return NextResponse.json({ error: "Review not found" }, { status: 404 });
  }
  if (existing.userId !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const updated = await prisma.review.update({
    where:   { id: reviewId },
    data:    { rating, comment: comment ?? null },
    include: { user: { select: { name: true, email: true } } },
  });

  return NextResponse.json({
    id:        updated.id,
    rating:    updated.rating,
    comment:   updated.comment ?? "",
    createdAt: updated.createdAt.toISOString(),
    userName:  updated.user.name ?? updated.user.email.split("@")[0],
    assetId:   updated.assetId,
  });
}
