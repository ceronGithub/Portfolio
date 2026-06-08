export const dynamic = "force-dynamic";
// GET  /api/admin/appointments/[id]/comments — Fetch threaded comments. Admin only.
// POST /api/admin/appointments/[id]/comments — Admin posts root comment or replies to buyer's root.

import { NextRequest, NextResponse } from "next/server";
import { getServerSession }          from "next-auth";
import { authOptions }               from "@/lib/auth";
import { prisma }                    from "@/lib/prisma";

// ── GET ───────────────────────────────────────────────────────────────────
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== "ADMIN")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await context.params;

  const comments = await prisma.appointmentComment.findMany({
    where:   { appointmentId: id },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({ comments });
}

// ── POST ──────────────────────────────────────────────────────────────────
export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== "ADMIN")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await context.params;

  const appointment = await prisma.appointment.findUnique({ where: { id } });
  if (!appointment)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { content, parentId } = await req.json();
  if (!content?.trim())
    return NextResponse.json({ error: "content is required" }, { status: 400 });

  // If replying, parent must be a BUYER root comment on this appointment
  if (parentId) {
    const parent = await prisma.appointmentComment.findUnique({ where: { id: parentId } });
    if (!parent || parent.appointmentId !== id || parent.role !== "BUYER" || parent.parentId !== null)
      return NextResponse.json({ error: "Invalid parentId" }, { status: 400 });
  }

  const comment = await prisma.appointmentComment.create({
    data: {
      appointmentId: id,
      role:          "ADMIN",
      content:       content.trim(),
      parentId:      parentId ?? null,
    },
  });

  return NextResponse.json({ ok: true, comment }, { status: 201 });
}
