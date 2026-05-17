// /buyer/profile/page.tsx — Server Component.
// Task 2: Also fetches ownedItems for system history section.

import { getServerSession } from "next-auth";
import { authOptions }      from "@/lib/auth";
import { prisma }           from "@/lib/prisma";
import { redirect }         from "next/navigation";
import ProfileClient        from "./ProfileClient";

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const userId = (session.user as any).id as string;

  const [user, orders, ownerships] = await Promise.all([
    prisma.user.findUnique({
      where:  { id: userId },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    }),
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
        product: { select: { name: true, price: true } },
      },
    }),
    prisma.ownership.findMany({
      where:   { userId },
      orderBy: { grantedAt: "desc" },
      include: { product: { select: { name: true } } },
    }),
  ]);

  if (!user) redirect("/login");

  return (
    <ProfileClient
      user={{
        id:          user.id,
        name:        user.name ?? "",
        email:       user.email,
        role:        user.role,
        memberSince: user.createdAt.toISOString(),
      }}
      orders={orders.map(o => ({
        id:           o.id,
        productName:  o.product.name,
        amount:       o.amountPaid ?? o.product.price,
        status:       o.status,
        deliveryNote: (o.deliveryNote as string | null) ?? null,
        estimatedAt:  o.estimatedAt ? (o.estimatedAt as Date).toISOString() : null,
        deliveredAt:  o.deliveredAt ? (o.deliveredAt as Date).toISOString() : null,
        createdAt:    o.createdAt.toISOString(),
      }))}
      ownedCount={ownerships.length}
      ownedItems={ownerships.map(o => ({
        productId:   o.productId,
        productName: o.product.name,
        grantedAt:   o.grantedAt.toISOString(),
      }))}
    />
  );
}