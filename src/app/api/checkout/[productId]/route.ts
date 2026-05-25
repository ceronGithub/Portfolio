// POST /api/checkout/[productId] — Create order + PayMongo payment link.
// Returns { checkoutUrl } — client redirects buyer to PayMongo hosted page.
// On payment success, /api/paymongo/webhook fires and auto-unlocks files.
import { NextRequest, NextResponse }  from "next/server";
import { getServerSession }           from "next-auth";
import { authOptions }                from "@/lib/auth";
import { prisma }                     from "@/lib/prisma";
import { createPaymentLink }          from "@/lib/paymongo";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId              = (session.user as any).id as string;
  const { productId }       = await params;
  const body                = await req.json();
  const { method, total, grantedTier } = body;

  // Validate
  if (!productId)
    return NextResponse.json({ error: "productId required" }, { status: 400 });
  if (!["gcash", "card", "bank"].includes(method))
    return NextResponse.json({ error: "Invalid payment method" }, { status: 400 });
  if (typeof total !== "number" || total <= 0)
    return NextResponse.json({ error: "Invalid total" }, { status: 400 });

  // Verify product
  const product = await prisma.product.findUnique({
    where:  { id: productId },
    select: { id: true, price: true, name: true, isActive: true },
  });
  if (!product || !product.isActive)
    return NextResponse.json({ error: "Product not found or inactive" }, { status: 404 });

  // Downpayment is 30% of total
  const downpayment = Math.round(total * 0.30);

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  try {
    // Create PENDING order first so we have an orderId for the reference
    const order = await prisma.order.create({
      data: { userId, productId, status: "PENDING" },
    });

    // Create PayMongo payment link
    const link = await createPaymentLink({
      amount:      downpayment,
      description: `Downpayment — ${product.name}`,
      remarks:     `Order ${order.id} · 30% downpayment`,
      referenceId: order.id,
      successUrl:  `${appUrl}/checkout/success?orderId=${order.id}`,
      failedUrl:   `${appUrl}/checkout/failed?orderId=${order.id}`,
    });

    // Store PayMongo link ID on the order
    await prisma.order.update({
      where: { id: order.id },
      data:  {
        paymongoOrderId: link.id,
        amountPaid:      downpayment,
        // Store buyer's tier selection as a delivery note until webhook fires
        deliveryNote:    `tier:${grantedTier ?? "mesh_only"}`,
      },
    });

    return NextResponse.json({ checkoutUrl: link.checkoutUrl, orderId: order.id }, { status: 201 });
  } catch (err: any) {
    console.error("[POST /api/checkout/[productId]]", err?.message);
    return NextResponse.json({ error: err?.message ?? "Server error" }, { status: 500 });
  }
}