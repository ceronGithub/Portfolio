// PATCH /api/admin/systems/[id]
// Admin-only. Updates basePrice (and optionally isActive) on a System.
import { NextRequest, NextResponse } from "next/server";
import { getServerSession }          from "next-auth";
import { authOptions }               from "@/lib/auth";
import { prisma }                    from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const data: { basePrice?: number; isActive?: boolean } = {};

  if (typeof body.basePrice === "number" && body.basePrice >= 0) {
    data.basePrice = Math.round(body.basePrice); // always store as integer PHP
  }
  if (typeof body.isActive === "boolean") {
    data.isActive = body.isActive;
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  const system = await prisma.system.update({ where: { id: params.id }, data });
  return NextResponse.json({ system });
}