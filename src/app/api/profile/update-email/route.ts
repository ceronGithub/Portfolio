export const dynamic = 'force-dynamic';
// PATCH /api/profile/update-email — Update the authenticated user's email.
// Validates format, checks for duplicate, then updates.
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
  const { email } = body;

  if (!email || typeof email !== "string") {
    return NextResponse.json({ error: "email is required" }, { status: 400 });
  }

  const trimmed = email.trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmed)) {
    return NextResponse.json({ error: "Invalid email format" }, { status: 400 });
  }

  // Check if email is already taken by another user
  const existing = await prisma.user.findFirst({
    where: { email: trimmed, NOT: { id: userId } },
    select: { id: true },
  });

  if (existing) {
    return NextResponse.json({ error: "Email is already in use" }, { status: 409 });
  }

  try {
    const user = await prisma.user.update({
      where: { id: userId },
      data: { email: trimmed },
      select: { id: true, name: true, email: true },
    });

    return NextResponse.json({ message: "Email updated", user });
  } catch (err: any) {
    console.error("[PATCH /api/profile/update-email]", err?.message);
    return NextResponse.json({ error: err?.message ?? "Server error" }, { status: 500 });
  }
}