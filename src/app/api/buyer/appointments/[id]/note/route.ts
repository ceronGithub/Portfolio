export const dynamic = "force-dynamic";
// POST /api/buyer/appointments/[id]/note
// Buyer posts a standalone root-level note on their own appointment.
// role = "BUYER", parentId = null (top-level note, admin can reply to it).
// Body: { content: string }

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

  const userId        = (session.user as any).id as string;
  const { id: appointmentId } = await context.params;
  const body    = await req.json().catch(() => ({}));
  const content = (body.content as string)?.trim();

  if (!content) return NextResponse.json({ error: "content required" }, { status: 400 });

  // Verify the appointment belongs to this buyer
  const appointment = await prisma.appointment.findFirst({ where: { id: appointmentId, userId } });
  if (!appointment) return NextResponse.json({ error: "Appointment not found" }, { status: 404 });

  // Create root-level BUYER note (parentId null)
  const comment = await prisma.appointmentComment.create({
    data: { appointmentId, role: "BUYER", content, parentId: null },
  });

  return NextResponse.json({
    comment: {
      id:            comment.id,
      role:          comment.role,
      content:       comment.content,
      parentId:      comment.parentId,
      createdAt:     comment.createdAt.toISOString(),
      replies:       [],
    },
  });
}
