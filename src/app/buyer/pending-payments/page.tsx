// buyer/pending-payments/page.tsx — Server Component.
// Fetches all pending orders (status = PENDING) for the logged-in buyer.
// Renders PendingPaymentsClient with order data.

import { getServerSession } from "next-auth";
import { authOptions }      from "@/lib/auth";
import { prisma }           from "@/lib/prisma";
import { redirect }         from "next/navigation";
import PendingPaymentsClient from "./PendingPaymentsClient";

export default async function PendingPaymentsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const userId = (session.user as any).id as string;

  const pendingOrders = await prisma.order.findMany({
    where:   { userId, status: "PENDING" },
    orderBy: { createdAt: "desc" },
    select: {
      id:              true,
      status:          true,
      amountPaid:      true,
      deliveryNote:    true,
      createdAt:       true,
      paymongoOrderId: true,
      product: { select: { name: true, price: true, category: true } },
    },
  });

  return (
    <PendingPaymentsClient
      orders={pendingOrders.map((o: any) => ({
        id:               o.id,
        productName:      o.product.name,
        productCategory:  o.product.category,
        amount:           o.amountPaid ?? o.product.price,
        paymongoOrderId:  o.paymongoOrderId ?? null,
        createdAt:        o.createdAt.toISOString(),
      }))}
    />
  );
}

