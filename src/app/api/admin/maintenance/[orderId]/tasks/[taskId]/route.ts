export const dynamic = 'force-dynamic';
// PATCH  /api/admin/maintenance/[orderId]/tasks/[taskId] — Update task status/title/desc.
// DELETE /api/admin/maintenance/[orderId]/tasks/[taskId] — Delete a task.
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
  { params }: { params: Promise<{ orderId: string; taskId: string }> }
) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { taskId } = await params;
  const body       = await req.json();
  const allowed    = ["title", "description", "status", "type"];
  const data: Record<string, unknown> = {};

  for (const key of allowed) {
    if (key in body) data[key] = body[key];
  }

  // Set completedAt when marked DONE
  if (body.status === "DONE") data.completedAt = new Date();

  try {
    const task = await prisma.maintenanceTask.update({ where: { id: taskId }, data });
    return NextResponse.json({ task });
  } catch {
    return NextResponse.json({ error: "Task not found." }, { status: 404 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ orderId: string; taskId: string }> }
) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { taskId } = await params;

  try {
    await prisma.maintenanceTask.delete({ where: { id: taskId } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Task not found." }, { status: 404 });
  }
}
