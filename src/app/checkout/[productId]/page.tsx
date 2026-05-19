// checkout/[productId]/page.tsx — Server Component.
// Fetches product by ID (System or Product table).
// Renders CheckoutClient with product data.
// No payment gateway — UI only.

import { getServerSession } from "next-auth";
import { authOptions }      from "@/lib/auth";
import { prisma }           from "@/lib/prisma";
import { redirect }         from "next/navigation";
import { notFound }         from "next/navigation";
import CheckoutClient       from "./CheckoutClient";

interface Props {
  params: Promise<{ productId: string }>;
}

export default async function CheckoutPage({ params }: Props) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const { productId } = await params;

  // Try System table first, then Product table
  const system = await prisma.system.findUnique({
    where: { id: productId },
    select: { id: true, title: true, basePrice: true, description: true, timeline: true },
  });

  if (system) {
    return (
      <CheckoutClient
        checkoutProductId={system.id}
        productName={system.title}
        price={system.basePrice}
        description={system.description ?? ""}
        timeline={system.timeline ?? ""}
      />
    );
  }

  // Fall back to Product table (assets) — resolve by cuid id OR slug (e.g. "orc-01")
  const product = await prisma.product.findFirst({
    where: { OR: [{ id: productId }, { slug: productId }] },
    select: { id: true, name: true, price: true, description: true },
  });

  if (!product) notFound();

  return (
    <CheckoutClient
      checkoutProductId={product.id}
      productName={product.name}
      price={product.price}
      description={product.description ?? ""}
      timeline=""
    />
  );
}