export const dynamic = 'force-dynamic';
// api/reviews/route.ts — GET all reviews + POST new review.
// Uses asset slug IDs (e.g. "orc-01") — no Product table dependency.

import { NextRequest, NextResponse } from "next/server";
import { getServerSession }          from "next-auth";
import { authOptions }               from "@/lib/auth";
import { prisma }                    from "@/lib/prisma";

export async function GET() {
  try {
    const reviews = await prisma.review.findMany({
      where:   { isHidden: false },
      orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
      include: { user: { select: { name: true, email: true } } },
    });

    return NextResponse.json(reviews.map((r: any) => ({
      id:            r.id,
      rating:        r.rating,
      comment:       r.comment ?? "",
      createdAt:     r.createdAt.toISOString(),
      userName:      r.user.name ?? r.user.email.split("@")[0],
      assetId:       r.assetId,
      isHighlighted: r.isHighlighted ?? false,
      isPinned:      r.isPinned      ?? false,
      adminReply:    r.adminReply    ?? null,
    })));
  } catch {
    return NextResponse.json([], { status: 200 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as any).id as string;
  const body   = await req.json();
  const { assetId, rating, comment } = body;

  if (!assetId || typeof assetId !== "string") {
    return NextResponse.json({ error: "assetId required" }, { status: 400 });
  }
  if (!rating || typeof rating !== "number" || rating < 1 || rating > 5) {
    return NextResponse.json({ error: "rating must be 1–5" }, { status: 400 });
  }
  if (comment && comment.length > 500) {
    return NextResponse.json({ error: "comment max 500 chars" }, { status: 400 });
  }

  // Verify buyer owns this product. assetId is either:
  // - A cuid (for new products)
  // - A slug like "orc-01" (for legacy assets)
  // Try to find product by slug first, fallback to cuid.
  const product = await prisma.product.findFirst({
    where: {
      OR: [
        { slug: assetId },      // Try slug match first
        { id: assetId },        // Fallback to cuid
      ],
    },
    select: { id: true, slug: true },
  });

  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  // Check ownership using product cuid
  const ownership = await prisma.ownership.findUnique({
    where: { userId_productId: { userId, productId: product.id } },
  });
  if (!ownership) {
    return NextResponse.json({ error: "You don't own this product" }, { status: 403 });
  }

  // Check if already reviewed using the original assetId
  const existing = await prisma.review.findUnique({
    where: { userId_assetId: { userId, assetId } },
  });
  if (existing) {
    return NextResponse.json({ error: "Already reviewed" }, { status: 409 });
  }

  const review = await prisma.review.create({
    data:    { userId, assetId, rating, comment: comment ?? null },
    include: { user: { select: { name: true, email: true } } },
  });

  return NextResponse.json({
    id:        review.id,
    rating:    review.rating,
    comment:   review.comment ?? "",
    createdAt: review.createdAt.toISOString(),
    userName:  review.user.name ?? review.user.email.split("@")[0],
    assetId:   review.assetId,
  }, { status: 201 });
}