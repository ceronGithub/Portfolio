export const dynamic = 'force-dynamic';
// PATCH /api/admin/maintenance/[orderId]/vc/[vcId]
// Admin confirms, reschedules, or marks VC call as done/cancelled.
import { NextRequest, NextResponse } from "next/server";
import { getServerSession }          from "next-auth";
import { authOptions }               from "@/lib/auth";
import { prisma }                    from "@/lib/prisma";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== "ADMIN") return null;
  return session;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ orderId: string; vcId: string }> }
) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { vcId } = await params;
  const body     = await req.json();

  const allowed = ["status", "confirmedDate", "adminNote"];
  const data: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in body) data[key] = body[key];
  }

  if (body.confirmedDate) data.confirmedDate = new Date(body.confirmedDate);

  try {
    const vc = await prisma.vCSchedule.update({ where: { id: vcId }, data });
    return NextResponse.json({ vc });
  } catch {
    return NextResponse.json({ error: "VC schedule not found." }, { status: 404 });
  }
}
