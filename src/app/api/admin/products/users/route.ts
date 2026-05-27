export const dynamic = 'force-dynamic';
// GET /api/admin/users — Returns all BUYER accounts for admin grant modals.
// Protected: ADMIN only.
import { NextResponse }    from "next/server";
import { getServerSession } from "next-auth";
import { authOptions }      from "@/lib/auth";
import { prisma }           from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const buyers = await prisma.user.findMany({
    where:   { role: "BUYER" },
    select:  { id: true, name: true, email: true, isActive: true, isBanned: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ buyers });
}