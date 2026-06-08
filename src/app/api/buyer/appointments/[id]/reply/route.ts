export const dynamic = "force-dynamic";
// POST /api/buyer/appointments/[id]/reply
// Buyer posts a reply to a specific admin comment on their appointment.
// Body: { parentId: string, content: string }
// Verifies: appointment belongs to buyer, parentId is an ADMIN comment on the same appointment.

import { NextRequest, NextResponse } from "next/server";
import { getServerSession }          from "next-auth";
import { authOptions }               from "@/lib/auth";
import { prisma }                    from "@/lib/prisma";

// ── POST ──────────────────────────────────────────────────────────────────────
export async function POST(
  req:     NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId              = (session.user as any).id as string;
  const { id: appointmentId } = await context.params;
  const body      = await req.json().catch(() => ({}));
  const parentId  = (body.parentId as string)?.trim();
  const content   = (body.content  as string)?.trim();

  if (!parentId || !content) {
    return NextResponse.json({ error: "parentId and content required" }, { status: 400 });
  }

  // Verify appointment ownership
  const appointment = await prisma.appointment.findFirst({ where: { id: appointmentId, userId } });
  if (!appointment) return NextResponse.json({ error: "Appointment not found" }, { status: 404 });

  // Verify parentId is an ADMIN comment on this appointment
  const parent = await prisma.appointmentComment.findFirst({
    where: { id: parentId, appointmentId, role: "ADMIN" },
  });
  if (!parent) return NextResponse.json({ error: "Parent comment not found" }, { status: 404 });

  const comment = await prisma.appointmentComment.create({
    data: { appointmentId, role: "BUYER", content, parentId },
  });

  return NextResponse.json({
    comment: {
      id:        comment.id,
      role:      comment.role,
      content:   comment.content,
      parentId:  comment.parentId,
      createdAt: comment.createdAt.toISOString(),
    },
  });
}
