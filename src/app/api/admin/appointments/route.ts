export const dynamic = "force-dynamic";
// PATCH /api/admin/appointments/[id] — Update appointment status and/or adminNote. Admin only.
// POST  /api/admin/appointments/[id] — Admin posts a comment thread entry on the appointment.
// DELETE /api/admin/appointments/[id] — Hard-delete an appointment record. Admin only.

import { NextRequest, NextResponse } from "next/server";
import { getServerSession }          from "next-auth";
import { authOptions }               from "@/lib/auth";
import { prisma }                    from "@/lib/prisma";

// ── Auth guard helper ─────────────────────────────────────────────────────────
async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== "ADMIN") return null;
  return session;
}

// ── PATCH — update status and/or adminNote ────────────────────────────────────
export async function PATCH(
  req:     NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  if (!await requireAdmin())
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id }                = await context.params;
  const { status, adminNote } = await req.json();

  const validStatuses = ["PENDING", "SCHEDULED", "COMPLETED", "CANCELLED"];
  if (status && !validStatuses.includes(status))
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });

  const updated = await prisma.appointment.update({
    where: { id },
    data:  {
      ...(status    !== undefined && { status }),
      ...(adminNote !== undefined && { adminNote }),
    },
  });

  return NextResponse.json({ ok: true, appointment: updated });
}

// ── POST — admin posts a comment on an appointment ────────────────────────────
// Body: { content: string, parentId?: string }
// parentId null = root admin comment; parentId = reply to a buyer note
export async function POST(
  req:     NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  if (!await requireAdmin())
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: appointmentId } = await context.params;
  const body     = await req.json().catch(() => ({}));
  const content  = (body.content  as string)?.trim();
  const parentId = (body.parentId as string | undefined) ?? null;

  if (!content) return NextResponse.json({ error: "content required" }, { status: 400 });

  // Verify appointment exists
  const appointment = await prisma.appointment.findUnique({ where: { id: appointmentId } });
  if (!appointment) return NextResponse.json({ error: "Appointment not found" }, { status: 404 });

  // If parentId provided, verify it is a BUYER root note on this appointment
  if (parentId) {
    const parent = await prisma.appointmentComment.findFirst({
      where: { id: parentId, appointmentId, role: "BUYER" },
    });
    if (!parent) return NextResponse.json({ error: "Parent comment not found" }, { status: 404 });
  }

  const comment = await prisma.appointmentComment.create({
    data: { appointmentId, role: "ADMIN", content, parentId },
  });

  return NextResponse.json({
    comment: {
      id:        comment.id,
      role:      comment.role,
      content:   comment.content,
      parentId:  comment.parentId,
      createdAt: comment.createdAt.toISOString(),
      replies:   [],
    },
  });
}

// ── DELETE — hard-delete an appointment ───────────────────────────────────────
export async function DELETE(
  _req:    NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  if (!await requireAdmin())
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await context.params;

  // AppointmentComment rows cascade-delete via FK (onDelete: Cascade)
  await prisma.appointment.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
