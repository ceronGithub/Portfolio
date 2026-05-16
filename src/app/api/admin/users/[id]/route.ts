// PATCH /api/admin/users/[id]
// Admin-only. Applies an action to a user: ban | deactivate | activate | unban
// DELETE /api/admin/users/[id] — permanently deletes a user.
import { NextRequest, NextResponse } from "next/server";
import { getServerSession }          from "next-auth";
import { authOptions }               from "@/lib/auth";
import { prisma }                    from "@/lib/prisma";

type Action = "ban" | "unban" | "deactivate" | "activate";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { action }: { action: Action } = await req.json();
  if (!action) return NextResponse.json({ error: "action required" }, { status: 400 });

  let data: { isBanned?: boolean; isActive?: boolean } = {};
  if (action === "ban")        data = { isBanned: true,  isActive: false };
  if (action === "unban")      data = { isBanned: false };
  if (action === "deactivate") data = { isActive: false };
  if (action === "activate")   data = { isActive: true,  isBanned: false };

  const user = await prisma.user.update({ where: { id: params.id }, data });
  return NextResponse.json({ user });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Delete related records first to avoid FK constraint errors
  await prisma.ownership.deleteMany({ where: { userId: params.id } });
  await prisma.order.deleteMany({ where: { userId: params.id } });
  await prisma.user.delete({ where: { id: params.id } });

  return NextResponse.json({ deleted: true });
}
