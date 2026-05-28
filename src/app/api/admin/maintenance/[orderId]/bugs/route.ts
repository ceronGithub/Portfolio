export const dynamic = 'force-dynamic';
// GET /api/admin/maintenance/[orderId]/bugs — Returns all bug reports for an order.
import { NextRequest, NextResponse } from "next/server";
import { getServerSession }          from "next-auth";
import { authOptions }               from "@/lib/auth";
import { prisma }                    from "@/lib/prisma";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== "ADMIN") return null;
  return session;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { orderId } = await params;

  const bugs = await prisma.bugReport.findMany({
    where:   { maintenanceOrderId: orderId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ bugs });
}
