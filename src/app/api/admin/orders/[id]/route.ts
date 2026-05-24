// PATCH /api/admin/users/[id] — ban | unban | deactivate | activate
// DELETE /api/admin/users/[id] — permanently delete user
// Admin-only.
import { NextRequest, NextResponse } from "next/server";
import { getServerSession }          from "next-auth";
import { authOptions }               from "@/lib/auth";
import { prisma }                    from "@/lib/prisma";

type Action = "ban" | "unban" | "deactivate" | "activate";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const { action }: { action: Action; reason?: string } = await req.json();
  if (!action) return NextResponse.json({ error: "action required" }, { status: 400 });

  // Verify target user exists
  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 });

  // Map action → data update
  const dataMap: Record<Action, { isBanned?: boolean; isActive?: boolean }> = {
    ban:        { isBanned: true,  isActive: false },
    unban:      { isBanned: false },
    deactivate: { isActive: false },
    activate:   { isActive: true,  isBanned: false },
  };

  const user = await prisma.user.update({ where: { id }, data: dataMap[action] });
  return NextResponse.json({ user });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 });

  // Cascade delete owned relations before removing user
  await prisma.ownership.deleteMany({ where: { userId: id } });
  await prisma.order.deleteMany({ where: { userId: id } });
  await prisma.user.delete({ where: { id } });

  return NextResponse.json({ deleted: true });
}