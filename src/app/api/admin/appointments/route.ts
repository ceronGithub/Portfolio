export const dynamic = "force-dynamic";
// GET /api/admin/appointments — Returns all appointments. Admin only.
// Query param: ?status=PENDING|SCHEDULED|COMPLETED|CANCELLED (optional filter)

import { NextRequest, NextResponse } from "next/server";
import { getServerSession }          from "next-auth";
import { authOptions }               from "@/lib/auth";
import { prisma }                    from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== "ADMIN")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const status = req.nextUrl.searchParams.get("status") ?? undefined;

  const appointments = await prisma.appointment.findMany({
    where:   status ? { status: status as any } : undefined,
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { name: true, email: true } },
    },
  });

  return NextResponse.json({ appointments });
}
