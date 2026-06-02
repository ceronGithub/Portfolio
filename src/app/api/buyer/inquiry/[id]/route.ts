export const dynamic = 'force-dynamic';
// api/buyer/inquiry/[id]/route.ts
// DELETE — Buyer deletes their own inquiry. Removes the row from DB.
// PATCH  — Buyer updates the description or buyerComment on their own inquiry.
// Both are buyer-only; verifies ownership before mutating.

import { NextRequest, NextResponse } from "next/server";
import { getServerSession }          from "next-auth";
import { authOptions }               from "@/lib/auth";
import { prisma }                    from "@/lib/prisma";

// ── Guard: returns session user ID or null ─────────────────────────────────────
async function requireBuyer() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  return (session.user as any).id as string;
}

// ── DELETE /api/buyer/inquiry/[id] ────────────────────────────────────────────
// Deletes the inquiry only if it belongs to the authenticated buyer.
export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const userId = await requireBuyer();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await context.params;

  // Verify ownership before deletion
  const existing = await prisma.inquiry.findUnique({
    where:  { id },
    select: { userId: true },
  });

  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (existing.userId !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.inquiry.delete({ where: { id } });
  return NextResponse.json({ deleted: true });
}

// ── PATCH /api/buyer/inquiry/[id] ─────────────────────────────────────────────
// Allows buyer to update description and/or buyerComment on their own inquiry.
export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const userId = await requireBuyer();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id }  = await context.params;
  const body     = await req.json().catch(() => ({}));

  // Verify ownership
  const existing = await prisma.inquiry.findUnique({
    where:  { id },
    select: { userId: true },
  });

  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (existing.userId !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const updateData: Record<string, unknown> = {};

  if (typeof body.description  === "string") updateData.description  = body.description.trim();
  if (typeof body.buyerComment === "string") updateData.buyerComment = body.buyerComment.trim();

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }

  const updated = await prisma.inquiry.update({ where: { id }, data: updateData });
  return NextResponse.json({ inquiry: updated });
}
