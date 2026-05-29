export const dynamic = 'force-dynamic';
// GET /api/admin/maintenance — Returns all maintenance orders with user info.
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
  _req: NextRequest
) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const orders = await prisma.maintenanceOrder.findMany({
    include: {
      user:       { select: { id: true, name: true, email: true } },
      tasks:      true,
      bugReports: true,
      vcSchedules: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ orders });
}