// api/admin/orders/[id]/route.ts — PATCH order status. Protected: ADMIN only.
import { prisma }           from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions }      from "@/lib/auth";
import { NextResponse }     from "next/server";

type Params = { params: { id: string } };

export async function PATCH(req: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { status } = await req.json();
  if (!["PAID", "PENDING", "FAILED"].includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  try {
    const order = await prisma.order.update({
      where: { id: params.id },
      data:  { status },
    });
    return NextResponse.json({ order });
  } catch {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }
}
