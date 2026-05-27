export const dynamic = 'force-dynamic';
// PATCH /api/profile/update-name — Update the authenticated user's name.
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as any).id as string;
  const body = await req.json();
  const { name } = body;

  // Validate input
  if (!name || typeof name !== "string") {
    return NextResponse.json({ error: "name is required and must be a string" }, { status: 400 });
  }

  const trimmed = name.trim();
  if (trimmed.length === 0 || trimmed.length > 100) {
    return NextResponse.json(
      { error: "name must be 1-100 characters" },
      { status: 400 }
    );
  }

  try {
    const user = await prisma.user.update({
      where: { id: userId },
      data: { name: trimmed },
      select: { id: true, name: true, email: true },
    });

    return NextResponse.json({
      message: "Profile updated",
      user,
    });
  } catch (err: any) {
    console.error("[PATCH /api/profile/update-name]", err?.message);
    return NextResponse.json({ error: err?.message ?? "Server error" }, { status: 500 });
  }
}