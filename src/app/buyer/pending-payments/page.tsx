// buyer/pending-payments/page.tsx — Server Component.
// Fetches all pending orders (status = PENDING) for the logged-in buyer.
// Price is always recomputed from product.price + tier stored in deliveryNote —
// never trusts a stale or incorrectly stored amountPaid value.

import { getServerSession }  from "next-auth";
import { authOptions }       from "@/lib/auth";
import { prisma }            from "@/lib/prisma";
import { redirect }          from "next/navigation";
import PendingPaymentsClient from "./PendingPaymentsClient";

// Mirrors the multiplier logic in checkout/bundle/page.tsx and AssetBuySection.tsx.
// Source of truth: product.price (base) × tier multiplier = amount due.
function applyTierMultiplier(basePrice: number, tier: string): number {
  if (tier === "mesh_only") return Math.round(basePrice * 0.45);
  if (tier === "standard")  return Math.round(basePrice * 0.75);
  return basePrice; // full_pack = base price, no multiplier
}

// Extract tier from deliveryNote field (stored as "tier:mesh_only", "tier:full_pack", etc.)
function extractTier(deliveryNote: string | null): string {
  if (!deliveryNote) return "full_pack";
  const match = deliveryNote.match(/tier:(\S+)/);
  return match?.[1] ?? "full_pack";
}

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
      orders={pendingOrders
        .filter((o: any) => o.product != null)
        .map((o: any) => {
          const tier          = extractTier(o.deliveryNote as string | null);
          const correctAmount = applyTierMultiplier(o.product.price, tier);

          return {
            id:              o.id,
            productName:     o.product.name,
            productCategory: o.product.category,
            // Always recompute from product.price + tier — never trust stale amountPaid
            amount:          correctAmount,
            tier,
            paymongoOrderId: o.paymongoOrderId ?? null,
            createdAt:       o.createdAt.toISOString(),
          };
        })}
    />
  );
}
