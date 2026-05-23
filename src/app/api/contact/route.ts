// api/contact/route.ts — Save general Get-in-Touch contact form to DB.
// No auth required — public endpoint. Stores ContactMessage for admin history.

import { NextRequest, NextResponse } from "next/server";
import { prisma }                    from "@/lib/prisma";

// ── POST /api/contact — save a general contact message ───────────────────────
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { contactName, email, subject, message } = body;

  if (!contactName?.trim() || !email?.trim() || !message?.trim()) {
    return NextResponse.json({ error: "contactName, email, and message required" }, { status: 400 });
  }

  const record = await (prisma as any).contactMessage.create({
    data: {
      contactName: contactName.trim(),
      email:       email.trim(),
      subject:     subject?.trim() || null,
      message:     message.trim(),
    },
  });

  return NextResponse.json({ id: record.id }, { status: 201 });
}