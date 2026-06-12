export const dynamic = 'force-dynamic';
// POST /api/checkout/bundle — Create bundle orders + PayMongo payment link.
// Returns { checkoutUrl } — client redirects buyer to PayMongo hosted page.
// On payment success, /api/paymongo/webhook auto-unlocks all products.
import { NextRequest, NextResponse } from "next/server";
import { getServerSession }          from "next-auth";
import { authOptions }               from "@/lib/auth";
import { prisma }                    from "@/lib/prisma";
import { createPaymentLink }         from "@/lib/paymongo";

interface BundleItem { productId: string; price: number; tier?: string; }

function getTierPrice(product: { priceMeshOnly: number; priceStandard: number; priceFullPack: number }, tier: string): number {
  if (tier === "mesh_only") return product.priceMeshOnly;
  if (tier === "standard")  return product.priceStandard;
  return product.priceFullPack;
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as any).id as string;
  const body   = await req.json();
  const { items, method, total, grantedTier } = body;

  if (!Array.isArray(items) || items.length === 0)
    return NextResponse.json({ error: "items must be a non-empty array" }, { status: 400 });
  if (!["gcash", "card", "bank"].includes(method))
    return NextResponse.json({ error: "Invalid payment method" }, { status: 400 });
  if (typeof total !== "number" || total <= 0)
    return NextResponse.json({ error: "Invalid total" }, { status: 400 });

  const productIds = items.map((i: BundleItem) => i.productId);
  const products   = await prisma.product.findMany({
    where:  { id: { in: productIds }, isActive: true },
    select: { id: true, priceMeshOnly: true, priceStandard: true, priceFullPack: true, name: true },
  });
  if (products.length !== productIds.length)
    return NextResponse.json({ error: "One or more products not found or inactive" }, { status: 404 });

  const appUrl      = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const tier        = grantedTier ?? "mesh_only";

  try {
    // Create one Order per product — use the tier-resolved price from each item
    const orders = await Promise.all(
      products.map((p: { id: string; priceMeshOnly: number; priceStandard: number; priceFullPack: number; name: string }) => {
        const item     = items.find((i: BundleItem) => i.productId === p.id);
        const itemTier = item?.tier ?? grantedTier ?? "mesh_only";
        const itemPrice = (item?.price && item.price > 0)
          ? item.price
          : getTierPrice(p, itemTier);

        return prisma.order.create({
          data: {
            userId,
            productId:    p.id,
            status:       "PENDING",
            amountPaid:   itemPrice,          // PHP, tier-resolved
            deliveryNote: `tier:${itemTier}`,
          },
        });
      })
    );

    // Use first orderId as reference, store all orderIds joined in remarks
    const primaryOrderId = orders[0].id;
    const allOrderIds    = orders.map(o => o.id).join(",");

    const link = await createPaymentLink({
      amount:      total,  // total is PHP; createPaymentLink converts to centavos internally
      description: `Bundle Purchase — ${products.length} items`,
      remarks:     `Order: ${allOrderIds[0]}`,
      referenceId: primaryOrderId,
      successUrl:  `${appUrl}/checkout/success?bundle=1&orders=${encodeURIComponent(allOrderIds)}`,
      failedUrl:   `${appUrl}/checkout/failed?bundle=1&orders=${encodeURIComponent(allOrderIds)}`,
    });

    // Store PayMongo link ID on all orders
    await Promise.all(
      orders.map(o =>
        prisma.order.update({
          where: { id: o.id },
          data:  { paymongoOrderId: link.id },
        })
      )
    );

    return NextResponse.json({ checkoutUrl: link.checkoutUrl, orderIds: orders.map(o => o.id) }, { status: 201 });
  } catch (err: any) {
    console.error("[POST /api/checkout/bundle]", err?.message);
    return NextResponse.json({ error: err?.message ?? "Server error" }, { status: 500 });
  }
}