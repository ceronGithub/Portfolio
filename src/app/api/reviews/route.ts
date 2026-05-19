// api/reviews/route.ts — GET all reviews (public) + POST new review (auth required).
// GET: returns all reviews with user name + product name.
// POST: validates auth, rating (1–5), comment max 500 chars, one review per product per user.

import { NextRequest, NextResponse } from "next/server";
import { getServerSession }          from "next-auth";
import { authOptions }               from "@/lib/auth";
import { prisma }                    from "@/lib/prisma";

// ── GET — fetch all reviews ───────────────────────────────────────────────
export async function GET() {
  const reviews = await prisma.review.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      user:    { select: { name: true, email: true } },
      product: { select: { name: true } },
    },
  });

  return NextResponse.json(reviews.map((r: any) => ({
    id:          r.id,
    rating:      r.rating,
    comment:     r.comment ?? "",
    createdAt:   r.createdAt.toISOString(),
    userName:    r.user.name ?? r.user.email.split("@")[0],
    productId:   r.productId,
    productName: r.product.name,
  })));
}

// ── POST — submit a review ────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as any).id as string;
  const body   = await req.json();
  const { productId, rating, comment } = body;

  // Validation
  if (!productId || typeof productId !== "string") {
    return NextResponse.json({ error: "productId required" }, { status: 400 });
  }
  if (!rating || typeof rating !== "number" || rating < 1 || rating > 5) {
    return NextResponse.json({ error: "rating must be 1–5" }, { status: 400 });
  }
  if (comment && typeof comment === "string" && comment.length > 500) {
    return NextResponse.json({ error: "comment max 500 chars" }, { status: 400 });
  }

  // One review per user per product
  const existing = await prisma.review.findUnique({
    where: { userId_productId: { userId, productId } },
  });
  if (existing) {
    return NextResponse.json({ error: "Already reviewed" }, { status: 409 });
  }

  const review = await prisma.review.create({
    data: {
      userId,
      productId,
      rating,
      comment: comment ?? null,
    },
    include: {
      user:    { select: { name: true, email: true } },
      product: { select: { name: true } },
    },
  });

  return NextResponse.json({
    id:          review.id,
    rating:      review.rating,
    comment:     review.comment ?? "",
    createdAt:   review.createdAt.toISOString(),
    userName:    review.user.name ?? review.user.email.split("@")[0],
    productId:   review.productId,
    productName: review.product.name,
  }, { status: 201 });
}
