export const dynamic = "force-dynamic";
// DELETE /api/appointments/[id]
// Buyer can soft-delete their OWN PENDING appointment.
// Sets deletedAt timestamp — admin still sees it but buyer list hides it.
// Cancelled / Scheduled / Completed appointments cannot be removed.

import { NextRequest, NextResponse } from "next/server";
import { getServerSession }          from "next-auth";
import { authOptions }               from "@/lib/auth";
import { prisma }                    from "@/lib/prisma";

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId    = (session.user as any).id as string;
  const { id }    = await context.params;

  // Verify ownership and fetch current status
  const appointment = await prisma.appointment.findUnique({ where: { id } });

  if (!appointment)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (appointment.userId !== userId)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  if (appointment.status !== "PENDING")
    return NextResponse.json(
      { error: "Only PENDING appointments can be removed." },
      { status: 422 }
    );

  if (appointment.deletedAt)
    return NextResponse.json({ error: "Already removed." }, { status: 409 });

  await prisma.appointment.update({
    where: { id },
    data:  { deletedAt: new Date() },
  });

  return NextResponse.json({ ok: true });
}
