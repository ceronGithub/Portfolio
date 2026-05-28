export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getPaymentLink } from "@/lib/paymongo";

/**
 * GET /api/buyer/pending-payment/[orderId]
 * Fetch PayMongo payment link for a pending order
 */
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ orderId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id as string;
    const { orderId } = await context.params;

    // Verify order belongs to user and is pending
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        userId: true,
        status: true,
        paymongoOrderId: true,
        amountPaid: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (order.userId !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    if (order.status !== "PENDING") {
      return NextResponse.json(
        { error: "Order is not pending" },
        { status: 400 }
      );
    }

    if (!order.paymongoOrderId) {
      return NextResponse.json(
        { error: "No PayMongo order found" },
        { status: 404 }
      );
    }

    // Retrieve payment link from PayMongo using order ID
    const link = await getPaymentLink(order.paymongoOrderId);
    const checkoutUrl = link?.attributes?.checkout_url as string | undefined;

    if (!checkoutUrl) {
      return NextResponse.json(
        { error: "Payment link is no longer available" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      checkoutUrl,
      orderId: order.id,
      amount: order.amountPaid,
    });
  } catch (err) {
    console.error("[GET /api/buyer/pending-payment]", err);
    return NextResponse.json(
      { error: "Failed to retrieve payment link" },
      { status: 500 }
    );
  }
}