// POST /api/checkout/[productId] — Create a single product order.
// Creates an Order record and grants Ownership to the buyer.
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as any).id as string;
  const { productId } = await params;

  const body = await req.json();
  const { method, total } = body;

  // Validate input
  if (!productId) {
    return NextResponse.json({ error: "productId required" }, { status: 400 });
  }
  if (!["gcash", "card", "bank"].includes(method)) {
    return NextResponse.json({ error: "Invalid payment method" }, { status: 400 });
  }
  if (typeof total !== "number" || total <= 0) {
    return NextResponse.json({ error: "Invalid total" }, { status: 400 });
  }

  // Verify product exists and is active
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { id: true, price: true, name: true, isActive: true },
  });

  if (!product || !product.isActive) {
    return NextResponse.json({ error: "Product not found or inactive" }, { status: 404 });
  }

  // Verify total matches product price (prevent client-side manipulation)
  if (total !== product.price) {
    return NextResponse.json(
      { error: `Total mismatch: expected ₱${product.price}, got ₱${total}` },
      { status: 400 }
    );
  }

  try {
    // Create Order record
    const order = await prisma.order.create({
      data: {
        userId,
        productId,
        status: "PENDING",
        // paymongoOrderId would be set here when payment gateway is ready
      },
    });

    // Grant Ownership to buyer
    await prisma.ownership.upsert({
      where: { userId_productId: { userId, productId } },
      update: {}, // If already owned, don't change anything
      create: { userId, productId },
    });

    revalidatePath("/buyer/orders", "layout");
    revalidatePath("/buyer/downloads", "layout");

    return NextResponse.json(
      {
        message: `Order placed for "${product.name}"`,
        orderId: order.id,
        total: product.price,
        method,
      },
      { status: 201 }
    );
  } catch (err: any) {
    console.error("[POST /api/checkout/[productId]]", err?.message);
    return NextResponse.json({ error: err?.message ?? "Server error" }, { status: 500 });
  }
}