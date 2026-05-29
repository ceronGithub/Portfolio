export const dynamic = 'force-dynamic';
// POST /api/checkout/[productId] — Create order + PayMongo payment link.
// Supports both Product (3D assets) and System catalog items.
// Returns { checkoutUrl } — client redirects buyer to PayMongo hosted page.
import { NextRequest, NextResponse }  from "next/server";
import { getServerSession }           from "next-auth";
import { authOptions }                from "@/lib/auth";
import { prisma }                     from "@/lib/prisma";
import { createPaymentLink }          from "@/lib/paymongo";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ productId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId              = (session.user as any).id as string;
  const { productId } = await context.params;
  const body                = await req.json();
  const { method, total, grantedTier } = body;

  if (!productId)
    return NextResponse.json({ error: "productId required" }, { status: 400 });
  if (!["gcash", "card", "bank"].includes(method))
    return NextResponse.json({ error: "Invalid payment method" }, { status: 400 });
  if (typeof total !== "number" || total <= 0)
    return NextResponse.json({ error: "Invalid total" }, { status: 400 });

  // ── Resolve item — check Product first, then System ──────────────────────
  let itemName   = "";
  let isSystem   = false;

  const product = await prisma.product.findUnique({
    where:  { id: productId },
    select: { id: true, price: true, name: true, isActive: true },
  });

  if (product && product.isActive) {
    itemName = product.name;
  } else {
    const system = await (prisma as any).system.findUnique({
      where:  { id: productId },
      select: { id: true, basePrice: true, title: true, isActive: true },
    });
    if (!system || !system.isActive)
      return NextResponse.json({ error: "Product not found or inactive" }, { status: 404 });
    itemName  = system.title;
    isSystem  = true;
  }

  const downpayment = Math.round(total * 0.30);
  const appUrl      = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  try {
    // Create PENDING order — use correct FK field based on type
    let orderData: any;
    if (isSystem) {
      orderData = {
        userId,
        systemId: productId,
        status: "PENDING",
        amountPaid: downpayment,
        deliveryNote: `tier:${grantedTier ?? "mesh_only"}`,
      };
    } else {
      orderData = {
        userId,
        productId,
        status: "PENDING",
        amountPaid: downpayment,
        deliveryNote: `tier:${grantedTier ?? "mesh_only"}`,
      };
    }

    const order = await prisma.order.create({
      data: orderData,
    });

    // Create PayMongo payment link
    // downpayment is in centavos; createPaymentLink expects PHP (it multiplies by 100 internally)
    const link = await createPaymentLink({
      amount:      downpayment / 100,
      description: `Downpayment — ${itemName}`,
      remarks:     `Order ${order.id} · 30% downpayment`,
      referenceId: order.id,
      successUrl:  `${appUrl}/checkout/success?orderId=${order.id}`,
      failedUrl:   `${appUrl}/checkout/failed?orderId=${order.id}`,
    });

    // Store PayMongo link ID on the order
    await prisma.order.update({
      where: { id: order.id },
      data:  { paymongoOrderId: link.id },
    });

    return NextResponse.json({ checkoutUrl: link.checkoutUrl, orderId: order.id }, { status: 201 });
  } catch (err: any) {
    console.error("[POST /api/checkout/[productId]]", err?.message);
    return NextResponse.json({ error: err?.message ?? "Server error" }, { status: 500 });
  }
}