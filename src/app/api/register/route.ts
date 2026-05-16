// POST /api/register
// Creates a new BUYER user. Validates email uniqueness and hashes password.
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  const { name, email, age, password } = await req.json();

  if (!name || !email || !age || !password) {
    return NextResponse.json({ error: "All fields are required." }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "Email already in use." }, { status: 409 });
  }

  const hashed = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: { name, email, age, password: hashed, role: "BUYER" },
  });

  return NextResponse.json({ id: user.id, email: user.email });
}