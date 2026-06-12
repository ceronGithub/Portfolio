// buyer/pending-payments/page.tsx — Server Component.
// Fetches all pending orders (status = PENDING | PAID) for the logged-in buyer.
// Handles both digital product orders (productId set) and maintenance package
// orders (productId null, deliveryNote starts with "maintenance:").

export const dynamic = "force-dynamic";
import { getServerSession }  from "next-auth";
import { authOptions }       from "@/lib/auth";
import { prisma }            from "@/lib/prisma";
import { redirect }          from "next/navigation";
import PendingPaymentsClient from "./PendingPaymentsClient";

// Source of truth: product.price × tier = amount due.
function getTierPrice(product: { priceMeshOnly: number; priceStandard: number; priceFullPack: number }, tier: string): number {
  if (tier === "mesh_only") return product.priceMeshOnly;
  if (tier === "standard")  return product.priceStandard;
  return product.priceFullPack;
}

// Extract tier from deliveryNote field (stored as "tier:mesh_only", "tier:full_pack", etc.)
function extractTier(deliveryNote: string | null): string {
  if (!deliveryNote) return "full_pack";
  const match = deliveryNote.match(/tier:(\S+)/);
  return match?.[1] ?? "full_pack";
}

// Map maintenance package key to display name
const MAINTENANCE_PKG_NAMES: Record<string, string> = {
  BASIC:    "Basic Maintenance",
  PRIORITY: "Priority Support",
  FULL:     "Full Maintenance",
};

// Extract maintenance package type from deliveryNote (e.g. "maintenance:PRIORITY" → "PRIORITY")
function extractMaintenancePkg(deliveryNote: string | null): string {
  if (!deliveryNote) return "";
  const match = deliveryNote.match(/^maintenance:(\S+)/);
  return match?.[1] ?? "";
}

export default async function PendingPaymentsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const userId = (session.user as any).id as string;

  const pendingOrders = await prisma.order.findMany({
    where:   { userId, status: { in: ["PENDING", "PAID"] } },
    orderBy: { createdAt: "desc" },
    select: {
      id:              true,
      status:          true,
      amountPaid:      true,
      deliveryNote:    true,
      createdAt:       true,
      paymongoOrderId: true,
      product: { select: { name: true, priceMeshOnly: true, priceStandard: true, priceFullPack: true, category: true } },
    },
  });

  const mappedOrders = pendingOrders
    .map((o: any) => {
      const isMaintenanceOrder =
        o.product == null &&
        typeof o.deliveryNote === "string" &&
        o.deliveryNote.startsWith("maintenance:");

      // ── Maintenance package order ──────────────────────────────────
      if (isMaintenanceOrder) {
        const pkg    = extractMaintenancePkg(o.deliveryNote as string);
        const name   = MAINTENANCE_PKG_NAMES[pkg] ?? "Maintenance Package";
        return {
          id:              o.id,
          productName:     name,
          productCategory: "maintenance" as const,
          amount:          o.amountPaid as number,
          tier:            null,
          paymongoOrderId: o.paymongoOrderId ?? null,
          createdAt:       o.createdAt.toISOString(),
          status:          o.status,
        };
      }

      // ── Digital product order ──────────────────────────────────────
      if (o.product == null) return null; // unknown order type — skip
      const tier          = extractTier(o.deliveryNote as string | null);
      const correctAmount = getTierPrice(o.product, tier);
      return {
        id:              o.id,
        productName:     o.product.name,
        productCategory: o.product.category,
        amount:          correctAmount,
        tier,
        paymongoOrderId: o.paymongoOrderId ?? null,
        createdAt:       o.createdAt.toISOString(),
        status:          o.status,
      };
    })
    .filter(Boolean);

  return <PendingPaymentsClient orders={mappedOrders as any} />;
}