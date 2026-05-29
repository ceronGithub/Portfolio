export const dynamic = 'force-dynamic';
// POST /api/admin/maintenance/[orderId]/tasks — Admin adds a task for a client.
// GET  /api/admin/maintenance/[orderId]/tasks — Returns all tasks for that order.
import { NextRequest, NextResponse } from "next/server";
import { getServerSession }          from "next-auth";
import { authOptions }               from "@/lib/auth";
import { prisma }                    from "@/lib/prisma";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== "ADMIN") return null;
  return session;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { orderId } = await params;
  const body        = await req.json();
  const { title, description, type } = body;

  if (!title) return NextResponse.json({ error: "Title is required." }, { status: 400 });

  // Create task and increment revisionsUsed if type is REVISION
  const [task] = await prisma.$transaction([
    prisma.maintenanceTask.create({
      data: {
        maintenanceOrderId: orderId,
        title,
        description: description ?? null,
        type:        type ?? "OTHER",
      },
    }),
    ...(type === "REVISION"
      ? [prisma.maintenanceOrder.update({
          where: { id: orderId },
          data:  { revisionsUsed: { increment: 1 } },
        })]
      : []),
  ]);

  return NextResponse.json({ task });
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { orderId } = await params;

  const tasks = await prisma.maintenanceTask.findMany({
    where:   { maintenanceOrderId: orderId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ tasks });
}