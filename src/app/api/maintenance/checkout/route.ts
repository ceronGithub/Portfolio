export const dynamic = "force-dynamic";
// POST /api/maintenance/checkout
// Creates a PayMongo payment link for a maintenance package purchase.
// Same flow as digital product checkout — creates a PENDING Order,
// attaches PayMongo link ID, redirects buyer to PayMongo hosted page.
// On payment success, /api/maintenance/fulfill activates the MaintenanceOrder.

import { NextRequest, NextResponse } from "next/server";
import { getServerSession }          from "next-auth";
import { authOptions }               from "@/lib/auth";
import { prisma }                    from "@/lib/prisma";
import { createPaymentLink }         from "@/lib/paymongo";

const PKG_NAMES: Record<string, string> = {
  BASIC:    "Basic Maintenance",
  PRIORITY: "Priority Support",
  FULL:     "Full Maintenance",
};

async function getPkgPrice(pkg: string): Promise<number> {
  try {
    const rows = await prisma.$queryRaw<{ price: number }[]>`
      SELECT price FROM "MaintenancePlan" WHERE package = ${pkg} LIMIT 1
    `;
    return rows[0]?.price ?? 0;
  } catch {
    // Fallback defaults if table not yet migrated
    const fallback: Record<string, number> = { BASIC: 4500, PRIORITY: 8500, FULL: 15000 };
    return fallback[pkg] ?? 0;
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as any).id as string;
  const body   = await req.json();
  const { packageType } = body;

  if (!["BASIC", "PRIORITY", "FULL"].includes(packageType))
    return NextResponse.json({ error: "Invalid package type" }, { status: 400 });

  // Prevent duplicate active maintenance orders
  const existing = await prisma.maintenanceOrder.findFirst({
    where: { userId, status: "ACTIVE" },
  });
  if (existing)
    return NextResponse.json({ error: "You already have an active maintenance package." }, { status: 409 });

  // Prevent duplicate PENDING checkout orders (buyer clicked twice)
  const pendingOrder = await (prisma as any).order.findFirst({
    where: { userId, deliveryNote: `maintenance:${packageType}`, status: "PENDING" },
  });
  if (pendingOrder)
    return NextResponse.json({ checkoutUrl: null, alreadyPending: true }, { status: 200 });

  const amount    = await getPkgPrice(packageType);
  const itemName  = PKG_NAMES[packageType];
  const appUrl    = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  // PayMongo minimum is ₱20
  if (amount < 20)
    return NextResponse.json({ error: `Package price (₱${amount}) is below the minimum allowed amount. Please update the price in Admin → Maintenance.` }, { status: 400 });

  try {
    // Create PENDING Order — no productId/systemId, uses deliveryNote to identify type
    const order = await (prisma as any).order.create({
      data: {
        userId,
        productId:    null,
        systemId:     null,
        status:       "PENDING",
        amountPaid:   amount,
        deliveryNote: `maintenance:${packageType}`,
      },
    });

    // Create PayMongo payment link
    const link = await createPaymentLink({
      amount,
      description: `${itemName} — 1 month`,
      remarks:     `Order: ${order.id}`,
      referenceId: order.id,
      successUrl:  `${appUrl}/checkout/success?orders=${encodeURIComponent(order.id)}&type=maintenance`,
      failedUrl:   `${appUrl}/checkout/failed?orders=${encodeURIComponent(order.id)}`,
    });

    // Store PayMongo link ID on the order
    await (prisma as any).order.update({
      where: { id: order.id },
      data:  { paymongoOrderId: link.id },
    });

    return NextResponse.json({ checkoutUrl: link.checkoutUrl, orderId: order.id }, { status: 201 });
  } catch (err: any) {
    console.error("[POST /api/maintenance/checkout]", err?.message);
    return NextResponse.json({ error: err?.message ?? "Server error" }, { status: 500 });
  }
}