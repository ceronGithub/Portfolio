export const dynamic = "force-dynamic";
// GET  /api/appointments/[id]/comments — Fetch threaded comments for an appointment.
// POST /api/appointments/[id]/comments — Buyer posts a new root comment or replies to admin's.

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
  if (!session?.user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as any).id as string;
  const { id } = await context.params;

  const appointment = await prisma.appointment.findUnique({ where: { id } });
  if (!appointment)
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (appointment.userId !== userId)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

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
  if (!session?.user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as any).id as string;
  const { id } = await context.params;

  const appointment = await prisma.appointment.findUnique({ where: { id } });
  if (!appointment)
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (appointment.userId !== userId)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { content, parentId } = await req.json();
  if (!content?.trim())
    return NextResponse.json({ error: "content is required" }, { status: 400 });

  // If replying, parent must exist and be an ADMIN root comment on this appointment
  if (parentId) {
    const parent = await prisma.appointmentComment.findUnique({ where: { id: parentId } });
    if (!parent || parent.appointmentId !== id || parent.role !== "ADMIN" || parent.parentId !== null)
      return NextResponse.json({ error: "Invalid parentId" }, { status: 400 });
  }

  const comment = await prisma.appointmentComment.create({
    data: {
      appointmentId: id,
      role:          "BUYER",
      content:       content.trim(),
      parentId:      parentId ?? null,
    },
  });

  return NextResponse.json({ ok: true, comment }, { status: 201 });
}
