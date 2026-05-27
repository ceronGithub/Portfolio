export const dynamic = 'force-dynamic';
// GET /api/admin/user-logs?action=BAN|UNBAN|DEACTIVATE|ACTIVATE|DELETE
// Admin-only. Returns UserActionLog records newest-first.
import { NextRequest, NextResponse } from "next/server";
import { getServerSession }          from "next-auth";
import { authOptions }               from "@/lib/auth";
import { prisma }                    from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const action = searchParams.get("action");

  const logs = await prisma.userActionLog.findMany({
    where: action ? { action: action as any } : undefined,
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return NextResponse.json({ logs });
}
