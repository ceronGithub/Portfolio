export const dynamic = 'force-dynamic';
// PATCH  /api/admin/users/[id] — Ban, unban, deactivate, or activate a user.
// DELETE /api/admin/users/[id] — Permanently delete a user and all their data.
// Both write a UserActionLog record for the audit trail.
// Protected: ADMIN only. Admin cannot act on their own account.
import { NextRequest, NextResponse } from "next/server";
import { getServerSession }          from "next-auth";
import { authOptions }               from "@/lib/auth";
import { prisma }                    from "@/lib/prisma";
import { revalidatePath }            from "next/cache";

type Params = { params: Promise<{ id: string }> };

// ── Action → enum string mapping ─────────────────────────────────────────────
const ACTION_ENUM: Record<string, string> = {
  ban:        "BAN",
  unban:      "UNBAN",
  deactivate: "DEACTIVATE",
  activate:   "ACTIVATE",
};

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id }    = await params;
  const adminId   = (session.user as any).id   as string;
  const adminEmail = session.user?.email ?? "unknown";

  if (id === adminId) {
    return NextResponse.json({ error: "Cannot modify your own account" }, { status: 400 });
  }

  const { action, reason } = await req.json();
  const validActions = Object.keys(ACTION_ENUM);
  if (!action || !validActions.includes(action)) {
    return NextResponse.json({ error: `action must be one of: ${validActions.join(", ")}` }, { status: 400 });
  }

  const target = await prisma.user.findUnique({
    where:  { id },
    select: { id: true, email: true, name: true },
  });
  if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const data: Record<string, boolean> = {};
  if (action === "ban")        { data.isBanned = true;  data.isActive = false; }
  if (action === "unban")      { data.isBanned = false; data.isActive = true;  }
  if (action === "deactivate") { data.isActive = false; }
  if (action === "activate")   { data.isActive = true;  data.isBanned = false; }

  try {
    const [updated] = await prisma.$transaction([
      prisma.user.update({ where: { id }, data }),
      prisma.userActionLog.create({
        data: {
          action:       ACTION_ENUM[action],
          targetUserId: target.id,
          targetEmail:  target.email,
          targetName:   target.name ?? null,
          adminId,
          adminEmail,
          reason:       reason ?? null,
        },
      }),
    ]);
    revalidatePath("/admin/users", "layout");
    return NextResponse.json({ user: updated });
  } catch (err: any) {
    console.error("[PATCH /api/admin/users/[id]]", err?.message);
    return NextResponse.json({ error: err?.message ?? "Server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id }     = await params;
  const adminId    = (session.user as any).id   as string;
  const adminEmail = session.user?.email ?? "unknown";

  if (id === adminId) {
    return NextResponse.json({ error: "Cannot delete your own account" }, { status: 400 });
  }

  const target = await prisma.user.findUnique({
    where:  { id },
    select: { id: true, email: true, name: true },
  });
  if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const body = await req.json().catch(() => ({}));

  try {
    // Write log BEFORE cascade delete so target still exists for reference
    await prisma.userActionLog.create({
      data: {
        action:       "DELETE",
        targetUserId: target.id,
        targetEmail:  target.email,
        targetName:   target.name ?? null,
        adminId,
        adminEmail,
        reason:       body?.reason ?? null,
      },
    });

    // Cascade delete: orders, ownership, reviews, inquiries, then user
    await prisma.order.deleteMany({ where: { userId: id } });
    await prisma.ownership.deleteMany({ where: { userId: id } });
    await prisma.review.deleteMany({ where: { userId: id } });
    await prisma.inquiry.deleteMany({ where: { userId: id } });
    await prisma.user.delete({ where: { id } });

    revalidatePath("/admin/users", "layout");
    return NextResponse.json({ message: `User ${target.email} deleted` });
  } catch (err: any) {
    console.error("[DELETE /api/admin/users/[id]]", err?.message);
    return NextResponse.json({ error: err?.message ?? "Server error" }, { status: 500 });
  }
}