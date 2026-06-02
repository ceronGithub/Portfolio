export const dynamic = 'force-dynamic';
// api/admin/testimonials/route.ts — Admin testimonials moderation.
// GET: all. PATCH: approve, hide, highlight, pin, adminReply. DELETE: remove.

import { NextRequest, NextResponse } from "next/server";
import { getServerSession }          from "next-auth";
import { authOptions }               from "@/lib/auth";
import { prisma }                    from "@/lib/prisma";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== "ADMIN") return null;
  return session;
}

// ── GET ───────────────────────────────────────────────────────────────────────
export async function GET() {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const testimonials = await (prisma as any).testimonial.findMany({
      orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
    });
    return NextResponse.json(testimonials.map((t: any) => ({
      id:            t.id,
      name:          t.name,
      project:       t.project,
      rate:          t.rate,
      comment:       t.comment,
      initials:      t.initials,
      accent:        t.accent,
      isApproved:    t.isApproved,
      isHidden:      t.isHidden      ?? false,
      isHighlighted: t.isHighlighted ?? false,
      isPinned:      t.isPinned      ?? false,
      adminReply:    t.adminReply    ?? null,
      createdAt:     t.createdAt.toISOString(),
    })));
  } catch {
    return NextResponse.json([], { status: 200 });
  }
}

// ── PATCH ?id=<id> — approve, hide, highlight, pin, adminReply ────────────────
export async function PATCH(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const testimonialId = req.nextUrl.searchParams.get("id");
  if (!testimonialId) return NextResponse.json({ error: "id required" }, { status: 400 });

  const body = await req.json().catch(() => ({}));
  const updateData: Record<string, unknown> = {};

  if (body.isApproved    !== undefined) updateData.isApproved    = Boolean(body.isApproved);
  if (body.isHidden      !== undefined) updateData.isHidden      = Boolean(body.isHidden);
  if (body.isHighlighted !== undefined) updateData.isHighlighted = Boolean(body.isHighlighted);
  if (body.isPinned      !== undefined) updateData.isPinned      = Boolean(body.isPinned);
  if (body.adminReply    !== undefined) updateData.adminReply    = body.adminReply !== null ? String(body.adminReply).trim() : null;

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  try {
    const updated = await (prisma as any).testimonial.update({
      where: { id: testimonialId },
      data:  updateData,
    });
    return NextResponse.json({ id: updated.id, ...updateData });
  } catch {
    return NextResponse.json({ error: "Failed to update testimonial" }, { status: 500 });
  }
}

// ── DELETE ?id=<id> ───────────────────────────────────────────────────────────
export async function DELETE(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const testimonialId = req.nextUrl.searchParams.get("id");
  if (!testimonialId) return NextResponse.json({ error: "id required" }, { status: 400 });

  try {
    await (prisma as any).testimonial.delete({ where: { id: testimonialId } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete testimonial" }, { status: 500 });
  }
}
