export const dynamic = 'force-dynamic';
// PATCH /api/admin/maintenance/[orderId]/bugs/[bugId]
// Admin classifies bug category, updates status, sets admin note, flags extra charge.
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
  { params }: { params: Promise<{ orderId: string; bugId: string }> }
) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { bugId } = await params;
  const body      = await req.json();

  const allowed = ["category", "status", "adminNote", "isExtraCharge", "extraChargeAmount"];
  const data: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in body) data[key] = body[key];
  }

  if (body.status === "RESOLVED") data.resolvedAt = new Date();
  if (body.isExtraCharge)         data.status     = "EXTRA_CHARGE";

  try {
    const bug = await prisma.bugReport.update({ where: { id: bugId }, data });
    return NextResponse.json({ bug });
  } catch {
    return NextResponse.json({ error: "Bug report not found." }, { status: 404 });
  }
}
