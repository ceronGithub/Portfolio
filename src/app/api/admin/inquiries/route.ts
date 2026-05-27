export const dynamic = 'force-dynamic';
// api/admin/inquiries/route.ts — Admin: PATCH inquiry status (custom requests + contact messages).
// PATCH ?type=custom&id=<id> — update Inquiry status (pending → read → replied)
// PATCH ?type=contact&id=<id> — update ContactMessage status (new → read → replied)

import { NextRequest, NextResponse } from "next/server";
import { getServerSession }          from "next-auth";
import { authOptions }               from "@/lib/auth";
import { prisma }                    from "@/lib/prisma";

// ── Guard: Admin only ─────────────────────────────────────────────────────────
async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== "ADMIN") return null;
  return session;
}

// ── PATCH /api/admin/inquiries?type=custom|contact&id=<id> — update status ───
export async function PATCH(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const inquiryId   = req.nextUrl.searchParams.get("id");
  const inquiryType = req.nextUrl.searchParams.get("type"); // "custom" | "contact"
  if (!inquiryId || !inquiryType) {
    return NextResponse.json({ error: "id and type required" }, { status: 400 });
  }

  const body   = await req.json().catch(() => ({}));
  const status = body.status as string;
  if (!["pending", "read", "replied", "new"].includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  if (inquiryType === "custom") {
    await prisma.inquiry.update({ where: { id: inquiryId }, data: { status } });
  } else if (inquiryType === "contact") {
    await (prisma as any).contactMessage.update({ where: { id: inquiryId }, data: { status } });
  } else {
    return NextResponse.json({ error: "type must be custom or contact" }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}