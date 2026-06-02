export const dynamic = 'force-dynamic';
// api/admin/inquiries/route.ts — Admin: PATCH inquiry status + adminQuote.
// PATCH ?type=custom&id=<id> — update Inquiry status and/or adminQuote
// PATCH ?type=contact&id=<id> — update ContactMessage status
// Valid custom statuses: pending | read | quoted | replied
// Valid contact statuses: new | read | replied

import { NextRequest, NextResponse } from "next/server";
import { getServerSession }          from "next-auth";
import { authOptions }               from "@/lib/auth";
import { prisma }                    from "@/lib/prisma";

// ── Guard: Admin only ──────────────────────────────────────────────────────────
async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== "ADMIN") return null;
  return session;
}

// ── PATCH /api/admin/inquiries?type=custom|contact&id=<id> ────────────────────
export async function PATCH(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const inquiryId   = req.nextUrl.searchParams.get("id");
  const inquiryType = req.nextUrl.searchParams.get("type"); // "custom" | "contact"
  if (!inquiryId || !inquiryType) {
    return NextResponse.json({ error: "id and type required" }, { status: 400 });
  }

  const body = await req.json().catch(() => ({}));

  if (inquiryType === "custom") {
    const validCustomStatuses = ["pending", "read", "quoted", "replied"];
    const updateData: Record<string, any> = {};

    // Status update — optional
    if (body.status !== undefined) {
      if (!validCustomStatuses.includes(body.status)) {
        return NextResponse.json({ error: "Invalid status" }, { status: 400 });
      }
      updateData.status = body.status;
    }

    // adminQuote update — optional, can be set or cleared (null)
    if (body.adminQuote !== undefined) {
      updateData.adminQuote = body.adminQuote !== null ? Number(body.adminQuote) : null;
    }

    // adminComment update — optional, can be set or cleared
    if (body.adminComment !== undefined) {
      updateData.adminComment = body.adminComment !== null ? String(body.adminComment).trim() : null;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    await prisma.inquiry.update({ where: { id: inquiryId }, data: updateData });

  } else if (inquiryType === "contact") {
    const validContactStatuses = ["new", "read", "replied"];
    if (!validContactStatuses.includes(body.status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }
    await (prisma as any).contactMessage.update({
      where: { id: inquiryId },
      data:  { status: body.status },
    });

  } else {
    return NextResponse.json({ error: "type must be custom or contact" }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
