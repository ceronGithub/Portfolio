// PATCH /api/admin/users/[id] — ban | unban | deactivate | activate
// DELETE /api/admin/users/[id] — permanently delete user
// Both write a UserActionLog record automatically.
// Admin-only.
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

  const { action, reason }: { action: Action; reason?: string } = await req.json();
  if (!action) return NextResponse.json({ error: "action required" }, { status: 400 });

  // Fetch target user for log
  const target = await prisma.user.findUnique({ where: { id: params.id } });
  if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 });

  // Map action → data update
  const dataMap: Record<Action, { isBanned?: boolean; isActive?: boolean }> = {
    ban:        { isBanned: true,  isActive: false },
    unban:      { isBanned: false },
    deactivate: { isActive: false },
    activate:   { isActive: true,  isBanned: false },
  };

  // Map action → UserAction enum
  const enumMap: Record<Action, "BAN" | "UNBAN" | "DEACTIVATE" | "ACTIVATE"> = {
    ban:        "BAN",
    unban:      "UNBAN",
    deactivate: "DEACTIVATE",
    activate:   "ACTIVATE",
  };

  const [user] = await prisma.$transaction([
    prisma.user.update({ where: { id: params.id }, data: dataMap[action] }),
    prisma.userActionLog.create({
      data: {
        action:        enumMap[action],
        targetUserId:  target.id,
        targetEmail:   target.email,
        targetName:    target.name,
        adminId:       (session.user as any).id ?? "unknown",
        adminEmail:    session.user?.email ?? "unknown",
        reason:        reason ?? null,
      },
    }),
  ]);

  return NextResponse.json({ user });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const target = await prisma.user.findUnique({ where: { id: params.id } });
  if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const reason: string | undefined = body?.reason;

  // Log first (before deleting — user still exists)
  await prisma.userActionLog.create({
    data: {
      action:       "DELETE",
      targetUserId: target.id,
      targetEmail:  target.email,
      targetName:   target.name,
      adminId:      (session.user as any).id ?? "unknown",
      adminEmail:   session.user?.email ?? "unknown",
      reason:       reason ?? null,
    },
  });

  // Cascade delete
  await prisma.ownership.deleteMany({ where: { userId: params.id } });
  await prisma.order.deleteMany({ where: { userId: params.id } });
  await prisma.user.delete({ where: { id: params.id } });

  return NextResponse.json({ deleted: true });
}
