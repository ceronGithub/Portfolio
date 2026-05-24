// POST /api/checkout/bundle — Create bundle orders for multiple products.
// For each product in the bundle, creates an Order record and grants Ownership to the buyer.
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

interface BundleItem {
  productId: string;
  price: number;
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as any).id as string;
  const body = await req.json();
  const { items, method, total } = body;

  // Validate input
  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: "items must be a non-empty array" }, { status: 400 });
  }
  if (!["gcash", "card", "bank"].includes(method)) {
    return NextResponse.json({ error: "Invalid payment method" }, { status: 400 });
  }
  if (typeof total !== "number" || total <= 0) {
    return NextResponse.json({ error: "Invalid total" }, { status: 400 });
  }

  // Extract product IDs from bundle items
  const productIds = items.map((item: BundleItem) => item.productId);
  if (productIds.length === 0) {
    return NextResponse.json({ error: "No products in bundle" }, { status: 400 });
  }

  // Verify all products exist and are active
  const products = await prisma.product.findMany({
    where: { id: { in: productIds }, isActive: true },
    select: { id: true, price: true },
  });

  if (products.length !== productIds.length) {
    return NextResponse.json({ error: "One or more products not found or inactive" }, { status: 404 });
  }

  // Verify total matches sum of product prices (prevent client-side manipulation)
  const expectedTotal = products.reduce((sum, p) => sum + p.price, 0);
  if (total !== expectedTotal) {
    return NextResponse.json(
      { error: `Total mismatch: expected ₱${expectedTotal}, got ₱${total}` },
      { status: 400 }
    );
  }

  try {
    // Create one Order for each product, and grant Ownership
    const createdOrders = await Promise.all(
      products.map((product) =>
        prisma.order.create({
          data: {
            userId,
            productId: product.id,
            status: "PENDING",
            // paymongoOrderId would be set here when payment gateway is ready
          },
        })
      )
    );

    // Grant Ownership records for all products
    await Promise.all(
      products.map((product) =>
        prisma.ownership.upsert({
          where: { userId_productId: { userId, productId: product.id } },
          update: {}, // If already owned, don't change anything
          create: { userId, productId: product.id },
        })
      )
    );

    revalidatePath("/buyer/orders", "layout");
    revalidatePath("/buyer/downloads", "layout");

    return NextResponse.json(
      {
        message: `Bundle order placed for ${createdOrders.length} product${createdOrders.length > 1 ? "s" : ""}`,
        orderIds: createdOrders.map((o) => o.id),
        total: expectedTotal,
        method,
      },
      { status: 201 }
    );
  } catch (err: any) {
    console.error("[POST /api/checkout/bundle]", err?.message);
    return NextResponse.json({ error: err?.message ?? "Server error" }, { status: 500 });
  }
}