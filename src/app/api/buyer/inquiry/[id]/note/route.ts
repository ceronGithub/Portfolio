export const dynamic = "force-dynamic";
// api/buyer/inquiry/[id]/note/route.ts
// POST — Buyer adds a standalone note (root-level BUYER comment) to their own inquiry.
// No parentId — this is a top-level buyer note, not a reply to an admin comment.
// Body: { content: string }

import { NextRequest, NextResponse } from "next/server";
import { getServerSession }          from "next-auth";
import { authOptions }               from "@/lib/auth";
import { prisma }                    from "@/lib/prisma";

async function requireBuyer() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  return (session.user as any).id as string;
}

// ── POST /api/buyer/inquiry/[id]/note ─────────────────────────────────────────
// Creates a root-level BUYER comment (no parentId). Admin can reply to it.
export async function POST(
  req:     NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const userId = await requireBuyer();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: inquiryId } = await context.params;
  const body    = await req.json().catch(() => ({}));
  const content = (body.content as string)?.trim();

  if (!content) {
    return NextResponse.json({ error: "content required" }, { status: 400 });
  }

  // Verify inquiry ownership
  const inquiry = await prisma.inquiry.findFirst({ where: { id: inquiryId, userId } });
  if (!inquiry) return NextResponse.json({ error: "Inquiry not found" }, { status: 404 });

  // Create root-level BUYER comment (parentId null = standalone note)
  const comment = await prisma.inquiryComment.create({
    data: { inquiryId, role: "BUYER", content, parentId: null },
  });

  return NextResponse.json({
    comment: {
      id:        comment.id,
      role:      comment.role,
      content:   comment.content,
      parentId:  comment.parentId,
      createdAt: comment.createdAt.toISOString(),
      replies:   [],
    },
  });
}
