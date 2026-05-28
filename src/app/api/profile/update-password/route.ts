export const dynamic = 'force-dynamic';
// PATCH /api/profile/update-password — Update the authenticated user's password.
// Verifies current password with bcrypt, then hashes and saves the new one.
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as any).id as string;
  const body = await req.json();
  const { currentPassword, newPassword } = body;

  if (!currentPassword || !newPassword) {
    return NextResponse.json({ error: "All password fields are required" }, { status: 400 });
  }

  if (newPassword.length < 8) {
    return NextResponse.json({ error: "New password must be at least 8 characters" }, { status: 400 });
  }

  // Fetch user with hashed password
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, password: true },
  });

  if (!user?.password) {
    return NextResponse.json({ error: "Password update not available for this account" }, { status: 400 });
  }

  // Verify current password
  const isMatch = await bcrypt.compare(currentPassword, user.password);
  if (!isMatch) {
    return NextResponse.json({ error: "Current password is incorrect" }, { status: 401 });
  }

  // Hash and save new password
  const hashed = await bcrypt.hash(newPassword, 12);

  try {
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashed },
    });

    return NextResponse.json({ message: "Password updated successfully" });
  } catch (err: any) {
    console.error("[PATCH /api/profile/update-password]", err?.message);
    return NextResponse.json({ error: err?.message ?? "Server error" }, { status: 500 });
  }
}