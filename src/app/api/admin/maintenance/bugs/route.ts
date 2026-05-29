export const dynamic = 'force-dynamic';
// POST /api/maintenance/bugs — Buyer submits a bug report.
// Requires active maintenance order. Increments bugsUsed counter.
// GET  /api/maintenance/bugs — Returns buyer's bug report history.
import { NextRequest, NextResponse } from "next/server";
import { getServerSession }          from "next-auth";
import { authOptions }               from "@/lib/auth";
import { prisma }                    from "@/lib/prisma";

// Auth guard — session + id required. Role not checked: middleware already enforces /buyer/* access.
async function requireBuyer() {
  const session = await getServerSession(authOptions);
  const userId  = (session?.user as any)?.id;
  if (!session || !userId) return null;
  return { session, userId };
}

export async function POST(req: NextRequest) {
  const auth = await requireBuyer();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { userId } = auth;
  const body        = await req.json();
  const { title, description } = body;

  if (!title || !description) {
    return NextResponse.json({ error: "Title and description are required." }, { status: 400 });
  }

  const order = await prisma.maintenanceOrder.findFirst({
    where: { userId, status: "ACTIVE" },
  });

  if (!order) {
    return NextResponse.json({ error: "No active maintenance package found." }, { status: 404 });
  }

  const bugLimit = order.package === "BASIC" ? 3 : order.package === "PRIORITY" ? 6 : 10;

  if (order.bugsUsed >= bugLimit) {
    return NextResponse.json({ error: "Bug report limit reached for your package." }, { status: 409 });
  }

  const [bugReport] = await prisma.$transaction([
    prisma.bugReport.create({
      data: {
        maintenanceOrderId: order.id,
        title,
        description,
      },
    }),
    prisma.maintenanceOrder.update({
      where: { id: order.id },
      data:  { bugsUsed: { increment: 1 } },
    }),
  ]);

  return NextResponse.json({ bugReport });
}

export async function GET(_req: NextRequest) {
  const auth = await requireBuyer();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { userId } = auth;

  const order = await prisma.maintenanceOrder.findFirst({
    where: { userId, status: "ACTIVE" },
  });

  if (!order) return NextResponse.json({ bugs: [] });

  const bugs = await prisma.bugReport.findMany({
    where:   { maintenanceOrderId: order.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ bugs });
}