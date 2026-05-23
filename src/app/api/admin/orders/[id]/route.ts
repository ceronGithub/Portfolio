// api/admin/orders/[id]/route.ts — PATCH order status, deliveryNote, estimatedAt.
// Protected: ADMIN only.
import { prisma }           from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions }      from "@/lib/auth";
import { NextResponse }     from "next/server";

const VALID_STATUSES = [
  "PAID", "PENDING", "FAILED",
  "IN_DEVELOPMENT", "IN_TESTING", "DELIVERED",
] as const;

type Params = { params: { id: string } };

export async function PATCH(req: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const data: Record<string, any> = {};

  if ("status" in body) {
    if (!VALID_STATUSES.includes(body.status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }
    data.status = body.status;
  }

  if ("deliveryNote" in body) {
    data.deliveryNote = typeof body.deliveryNote === "string" && body.deliveryNote.trim()
      ? body.deliveryNote.trim()
      : null;
  }

  if ("estimatedAt" in body) {
    if (body.estimatedAt === null || body.estimatedAt === "") {
      data.estimatedAt = null;
    } else {
      const d = new Date(body.estimatedAt);
      data.estimatedAt = isNaN(d.getTime()) ? null : d;
    }
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  try {
    const order = await prisma.order.update({
      where: { id: params.id },
      data,
    });
    return NextResponse.json({ order });
  } catch {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }
}