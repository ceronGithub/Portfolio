// buyer/orders/page.tsx — Server Component.
// Fetches all orders for the logged-in buyer, newest first.
// Renders OrdersClient with full order + product data + owned product IDs.

export const dynamic = "force-dynamic";
import { getServerSession } from "next-auth";
import { authOptions }      from "@/lib/auth";
import { prisma }           from "@/lib/prisma";
import { redirect }         from "next/navigation";
import OrdersClient         from "./OrdersClient";
import { getPaymentLink }    from "@/lib/paymongo";

export default async function OrdersPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const userId = (session.user as any).id as string;

  // ── Auto-recovery: sync any PENDING orders that were paid but webhook missed ──
  // For each PENDING order with a PayMongo link, check PayMongo status directly.
  // If paid, mark as PAID and upsert Ownership — prevents stuck PENDING orders
  // caused by webhook delivery failures (low signal, tunnel downtime, retries).
  try {
    const pendingOrders = await (prisma.order as any).findMany({
      where:  { userId, status: "PENDING", paymongoOrderId: { not: null } },
      select: { id: true, productId: true, deliveryNote: true, paymongoOrderId: true, paymentStatus: true },
    });

    await Promise.all(pendingOrders.map(async (order: any) => {
      const confirmedByWebhook = order.paymentStatus === "paid";
      if (!confirmedByWebhook) {
        try {
          const link = await getPaymentLink(order.paymongoOrderId);
          if (link?.attributes?.status !== "paid") return;
        } catch { return; }
      }

      await (prisma.order as any).update({ where: { id: order.id }, data: { status: "PAID" } });

      const tierMatch   = (order.deliveryNote ?? "").match(/^tier:(.+)$/);
      const grantedTier = tierMatch?.[1] ?? "mesh_only";

      if (order.productId) {
        await (prisma.ownership as any).upsert({
          where:  { userId_productId: { userId, productId: order.productId } },
          update: { grantedTier },
          create: { userId, productId: order.productId, grantedTier },
        });
      }

      if (typeof order.deliveryNote === "string" && order.deliveryNote.startsWith("maintenance:")) {
        const packageType = order.deliveryNote.replace("maintenance:", "");
        await prisma.maintenanceOrder.updateMany({ where: { userId, status: "ACTIVE" }, data: { status: "EXPIRED" } });
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 30);
        await prisma.maintenanceOrder.create({ data: { userId, package: packageType, status: "ACTIVE", expiresAt } });
      }
    }));
  } catch { /* Silent fail — non-blocking */ }

  const [orders, ownerships] = await Promise.all([
    prisma.order.findMany({
      where:   { userId },
      orderBy: { createdAt: "desc" },
      select: {
        id:           true,
        status:       true,
        amountPaid:   true,
        deliveryNote: true,
        estimatedAt:  true,
        deliveredAt:  true,
        createdAt:    true,
        product: { select: { id: true, name: true, priceMeshOnly: true, priceStandard: true, priceFullPack: true } },
      },
    }),
    prisma.ownership.findMany({
      where:  { userId },
      select: { productId: true },
    }),
  ]);

  const ownedProductIds = ownerships.map((o: { productId: string }) => o.productId);

  return (
    <OrdersClient
      ownedProductIds={ownedProductIds}
      orders={orders.map((o: any) => ({
        id:           o.id,
        productId:    o.product?.id ?? null,
        productName:  o.product?.name ?? (() => {
          // Derive display name for maintenance orders from deliveryNote (format: "maintenance:BASIC")
          if (typeof o.deliveryNote === "string" && o.deliveryNote.startsWith("maintenance:")) {
            const packageType = o.deliveryNote.replace("maintenance:", "");
            const packageLabels: Record<string, string> = {
              BASIC:    "Maintenance — Basic",
              PRIORITY: "Maintenance — Priority",
              FULL:     "Maintenance — Full",
            };
            return packageLabels[packageType] ?? `Maintenance — ${packageType}`;
          }
          return "Unknown";
        })(),
        amount:       o.amountPaid ?? (o.product?.priceFullPack || o.product?.priceStandard || o.product?.priceMeshOnly || 0),
        status:       o.status,
        deliveryNote: (o.deliveryNote as string | null) ?? null,
        estimatedAt:  o.estimatedAt ? (o.estimatedAt as Date).toISOString() : null,
        deliveredAt:  o.deliveredAt ? (o.deliveredAt as Date).toISOString() : null,
        createdAt:    o.createdAt.toISOString(),
      }))}
    />
  );
}