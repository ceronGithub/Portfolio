// api/testimonials/route.ts — Public GET (approved only) + Public POST (new submission).
// GET: returns only isApproved=true testimonials for the visitor page carousel.
// POST: saves a new testimonial with isApproved=false (pending admin review).

import { NextRequest, NextResponse } from "next/server";
import { prisma }                    from "@/lib/prisma";

const ACCENT_COLORS = [
  "#7dc9a0", "#7eb8d4", "#c4b5fd", "#f9a8d4",
  "#67e8f9", "#fcd34d", "#fdba74", "#86efac",
];

// ── Helper: derive initials from a name ───────────────────────────────────────
function getInitials(name: string): string {
  return name.split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2);
}

// ── GET /api/testimonials — approved testimonials for the visitor carousel ────
export async function GET() {
  try {
    const testimonials = await (prisma as any).testimonial.findMany({
      where:   { isApproved: true },
      orderBy: { createdAt: "asc" },
    });
    return NextResponse.json(testimonials);
  } catch {
    return NextResponse.json([], { status: 200 });
  }
}

// ── POST /api/testimonials — submit a new testimonial (pending approval) ──────
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { name, project, rate, comment } = body;

  if (!name?.trim() || !project?.trim() || !comment?.trim()) {
    return NextResponse.json({ error: "name, project, and comment required" }, { status: 400 });
  }
  if (typeof rate !== "number" || rate < 1 || rate > 100) {
    return NextResponse.json({ error: "rate must be 1–100" }, { status: 400 });
  }

  try {
    // ── Count existing to assign a consistent accent color ──────────────────
    const count = await (prisma as any).testimonial.count();
    const accent = ACCENT_COLORS[count % ACCENT_COLORS.length];

    const testimonial = await (prisma as any).testimonial.create({
      data: {
        name:     name.trim(),
        project:  project.trim(),
        rate,
        comment:  comment.trim(),
        initials: getInitials(name.trim()),
        accent,
        isApproved: false,
      },
    });

    return NextResponse.json({ id: testimonial.id }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Migration pending — run npx prisma migrate deploy" }, { status: 503 });
  }
}