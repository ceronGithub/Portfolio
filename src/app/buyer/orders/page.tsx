// buyer/orders/page.tsx — Server Component.
// Fetches all orders for the logged-in buyer, newest first.
// Renders OrdersClient with full order + product data.

import { getServerSession } from "next-auth";
import { authOptions }      from "@/lib/auth";
import { prisma }           from "@/lib/prisma";
import { redirect }         from "next/navigation";
import OrdersClient         from "./OrdersClient";

export default async function OrdersPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const userId = (session.user as any).id as string;

  const orders = await prisma.order.findMany({
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
      product: { select: { name: true, price: true } },
    },
  });

  return (
    <OrdersClient
      orders={orders.map((o: any) => ({
        id:           o.id,
        productName:  o.product.name,
        amount:       o.amountPaid ?? o.product.price,
        status:       o.status,
        deliveryNote: (o.deliveryNote as string | null) ?? null,
        estimatedAt:  o.estimatedAt ? (o.estimatedAt as Date).toISOString() : null,
        deliveredAt:  o.deliveredAt ? (o.deliveredAt as Date).toISOString() : null,
        createdAt:    o.createdAt.toISOString(),
      }))}
    />
  );
}
