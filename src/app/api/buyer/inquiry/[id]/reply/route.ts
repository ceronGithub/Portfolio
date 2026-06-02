export const dynamic = "force-dynamic";
// api/buyer/inquiry/[id]/reply/route.ts
// POST — Buyer posts a reply to a specific admin comment on their own inquiry.
// Body: { parentId: string, content: string }
// Verifies: inquiry belongs to buyer, parentId is an ADMIN comment on the same inquiry.

import { NextRequest, NextResponse } from "next/server";
import { getServerSession }          from "next-auth";
import { authOptions }               from "@/lib/auth";
import { prisma }                    from "@/lib/prisma";

async function requireBuyer() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  return (session.user as any).id as string;
}

// ── POST /api/buyer/inquiry/[id]/reply ────────────────────────────────────────
export async function POST(
  req:     NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const userId = await requireBuyer();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: inquiryId } = await context.params;
  const body = await req.json().catch(() => ({}));

  const parentId = (body.parentId as string)?.trim();
  const content  = (body.content  as string)?.trim();

  if (!parentId || !content) {
    return NextResponse.json({ error: "parentId and content required" }, { status: 400 });
  }

  // Verify inquiry ownership
  const inquiry = await prisma.inquiry.findFirst({ where: { id: inquiryId, userId } });
  if (!inquiry) return NextResponse.json({ error: "Inquiry not found" }, { status: 404 });

  // Verify parentId is an ADMIN comment on this inquiry
  const parent = await prisma.inquiryComment.findFirst({
    where: { id: parentId, inquiryId, role: "ADMIN" },
  });
  if (!parent) return NextResponse.json({ error: "Parent comment not found" }, { status: 404 });

  // Prevent duplicate buyer reply on the same admin comment
  const existingReply = await prisma.inquiryComment.findFirst({
    where: { parentId, role: "BUYER" },
  });
  if (existingReply) {
    return NextResponse.json({ error: "You already replied to this comment." }, { status: 409 });
  }

  const comment = await prisma.inquiryComment.create({
    data: { inquiryId, role: "BUYER", content, parentId },
  });

  return NextResponse.json({ comment: {
    id:        comment.id,
    role:      comment.role,
    content:   comment.content,
    parentId:  comment.parentId,
    createdAt: comment.createdAt.toISOString(),
  }});
}
