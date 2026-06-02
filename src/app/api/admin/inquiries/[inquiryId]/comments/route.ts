export const dynamic = "force-dynamic";
// api/admin/inquiries/[inquiryId]/comments/route.ts
// POST — Admin adds a comment (role=ADMIN) or admin posts a buyer reply (role=BUYER, parentId=<adminCommentId>).
// DELETE ?commentId=<id> — Delete a specific comment (and its replies via cascade).

import { NextRequest, NextResponse } from "next/server";
import { getServerSession }          from "next-auth";
import { authOptions }               from "@/lib/auth";
import { prisma }                    from "@/lib/prisma";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== "ADMIN") return null;
  return session;
}

// ── POST /api/admin/inquiries/[inquiryId]/comments ─────────────────────────
// Body: { role: "ADMIN"|"BUYER", content: string, parentId?: string }
export async function POST(req: NextRequest, { params }: { params: { inquiryId: string } }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { inquiryId } = params;
  const body = await req.json().catch(() => ({}));

  const role     = body.role as string;
  const content  = (body.content as string)?.trim();
  const parentId = (body.parentId as string | undefined) ?? null;

  if (!["ADMIN", "BUYER"].includes(role) || !content) {
    return NextResponse.json({ error: "role and content required" }, { status: 400 });
  }

  // If buyer reply, parentId must reference an existing ADMIN comment on this inquiry
  if (role === "BUYER" && parentId) {
    const parent = await prisma.inquiryComment.findFirst({
      where: { id: parentId, inquiryId, role: "ADMIN" },
    });
    if (!parent) return NextResponse.json({ error: "Parent comment not found" }, { status: 404 });
  }

  const comment = await prisma.inquiryComment.create({
    data: { inquiryId, role, content, parentId },
  });

  return NextResponse.json({ comment: {
    id:        comment.id,
    role:      comment.role,
    content:   comment.content,
    parentId:  comment.parentId,
    createdAt: comment.createdAt.toISOString(),
    replies:   [],
  }});
}

// ── DELETE /api/admin/inquiries/[inquiryId]/comments?commentId=<id> ────────
export async function DELETE(req: NextRequest, { params }: { params: { inquiryId: string } }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const commentId = req.nextUrl.searchParams.get("commentId");
  if (!commentId) return NextResponse.json({ error: "commentId required" }, { status: 400 });

  await prisma.inquiryComment.delete({ where: { id: commentId } });
  return NextResponse.json({ success: true });
}
