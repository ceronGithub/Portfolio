export const dynamic = "force-dynamic";
// PATCH /api/admin/appointments/[id] — Update appointment status and/or adminNote. Admin only.

import { NextRequest, NextResponse }                from "next/server";
import { getServerSession }                         from "next-auth";
import { authOptions }                              from "@/lib/auth";
import { prisma }                                   from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== "ADMIN")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id }              = await context.params;
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
