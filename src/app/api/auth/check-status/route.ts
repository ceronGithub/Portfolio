// GET /api/auth/check-status
// Called client-side on every buyer page load.
// Returns { banned: true } or { deactivated: true } if the session user
// is banned or inactive in DB — so the client can force signOut immediately.
import { NextRequest, NextResponse } from "next/server";
import { getServerSession }          from "next-auth";
import { authOptions }               from "@/lib/auth";
import { prisma }                    from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ ok: true }); // not logged in, nothing to do

  const userId = (session.user as any).id as string;
  const user   = await prisma.user.findUnique({
    where:  { id: userId },
    select: { isBanned: true, isActive: true },
  });

  if (!user)             return NextResponse.json({ banned: true });
  if (user.isBanned)     return NextResponse.json({ banned: true });
  if (!user.isActive)    return NextResponse.json({ deactivated: true });

  return NextResponse.json({ ok: true });
}