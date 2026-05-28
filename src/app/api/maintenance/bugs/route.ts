export const dynamic = 'force-dynamic';
// POST /api/maintenance/bugs — Buyer submits a bug report.
// Requires active maintenance order. Increments bugsUsed counter.
// GET  /api/maintenance/bugs — Returns buyer's bug report history.
import { NextRequest, NextResponse } from "next/server";
import { getServerSession }          from "next-auth";
import { authOptions }               from "@/lib/auth";
import { prisma }                    from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== "BUYER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as any).id;
  const body   = await req.json();
  const { title, description } = body;

  if (!title || !description) {
    return NextResponse.json({ error: "Title and description are required." }, { status: 400 });
  }

  // Get active maintenance order
  const order = await prisma.maintenanceOrder.findFirst({
    where: { userId, status: "ACTIVE" },
  });

  if (!order) {
    return NextResponse.json({ error: "No active maintenance package found." }, { status: 404 });
  }

  // Determine bug limit based on package
  const bugLimit = order.package === "BASIC" ? 3 : order.package === "PRIORITY" ? 6 : 10;

  if (order.bugsUsed >= bugLimit) {
    return NextResponse.json({ error: "Bug report limit reached for your package." }, { status: 409 });
  }

  // Create bug report and increment counter in a transaction
  const [bug] = await prisma.$transaction([
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

  return NextResponse.json({ bug });
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== "BUYER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as any).id;

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
