// api/admin/testimonials/route.ts — Admin-only testimonials moderation.
// GET: all testimonials (approved + pending).
// PATCH: approve a testimonial by id.
// DELETE: delete a testimonial by id.

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

// ── GET /api/admin/testimonials — all testimonials for admin moderation ────────
export async function GET() {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const testimonials = await prisma.testimonial.findMany({
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(testimonials.map((t: any) => ({
    id:         t.id,
    name:       t.name,
    project:    t.project,
    rate:       t.rate,
    comment:    t.comment,
    initials:   t.initials,
    accent:     t.accent,
    isApproved: t.isApproved,
    createdAt:  t.createdAt.toISOString(),
  })));
}

// ── PATCH /api/admin/testimonials?id=<id> — approve a testimonial ─────────────
export async function PATCH(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const testimonialId = req.nextUrl.searchParams.get("id");
  if (!testimonialId) return NextResponse.json({ error: "id required" }, { status: 400 });

  const updated = await prisma.testimonial.update({
    where: { id: testimonialId },
    data:  { isApproved: true },
  });

  return NextResponse.json({ id: updated.id, isApproved: updated.isApproved });
}

// ── DELETE /api/admin/testimonials?id=<id> — delete a testimonial ─────────────
export async function DELETE(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const testimonialId = req.nextUrl.searchParams.get("id");
  if (!testimonialId) return NextResponse.json({ error: "id required" }, { status: 400 });

  await prisma.testimonial.delete({ where: { id: testimonialId } });
  return NextResponse.json({ success: true });
}
