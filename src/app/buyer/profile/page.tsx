// /buyer/profile/page.tsx — Server Component.
// Fetches orders + ownerships; merges manually-granted items into order history.

export const dynamic = "force-dynamic";
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
        product: { select: { id: true, name: true, priceMeshOnly: true } },
      },
    }),
    prisma.ownership.findMany({
      where:   { userId },
      orderBy: { grantedAt: "desc" },
      include: { product: { select: { id: true, name: true } } },
    }),
  ]);

  if (!user) redirect("/login");

  // Build order rows from real orders
  const orderRows = orders.map((o: any) => ({
    id:           o.id,
    productName:  o.product.name,
    amount:       o.amountPaid ?? o.product.priceMeshOnly,
    status:       o.status as string,
    deliveryNote: (o.deliveryNote as string | null) ?? null,
    estimatedAt:  o.estimatedAt ? (o.estimatedAt as Date).toISOString() : null,
    deliveredAt:  o.deliveredAt ? (o.deliveredAt as Date).toISOString() : null,
    createdAt:    o.createdAt.toISOString(),
    isGranted:    false,
  }));

  // Manually-granted ownerships (no matching order) → synthetic order rows
  const orderedProductIds = new Set(orders.map((o: any) => o.product.id));
  const grantedRows = ownerships
    .filter((o: any) => !orderedProductIds.has(o.product.id))
    .map((o: any) => ({
      id:           `grant-${o.productId}`,
      productName:  o.product.name,
      amount:       0,
      status:       "GRANTED",
      deliveryNote: null,
      estimatedAt:  null,
      deliveredAt:  null,
      createdAt:    o.grantedAt.toISOString(),
      isGranted:    true,
    }));

  return (
    <ProfileClient
      user={{
        id:          user.id,
        name:        user.name ?? "",
        email:       user.email,
        role:        user.role,
        memberSince: user.createdAt.toISOString(),
      }}
      orders={[...orderRows, ...grantedRows]}
      ownedCount={ownerships.length}
      ownedItems={ownerships.map((o: any) => ({
        productId:   o.productId,
        productName: o.product.name,
        grantedAt:   o.grantedAt.toISOString(),
      }))}
    />
  );
}