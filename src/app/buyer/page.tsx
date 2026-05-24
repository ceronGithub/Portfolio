// buyer/page.tsx — Server Component.
// Fetches session + systems (with addons) + ownership from DB.
// Passes data to BuyerDashboardClient (Client Component) which owns:
//   - Wishlist state (Task 1)
//   - Bundle pricing (Task 2) via AssetBuySection + ArchitectureBuySection
//   - Owned asset state (Task 3)
//   - Architecture Asset Studio sections (Task 4)


// force-dynamic ensures this page re-fetches from DB on every request
// so isLatest changes from admin (via revalidatePath) are reflected immediately.
export const dynamic = "force-dynamic";

import { getServerSession } from "next-auth";
import { authOptions }      from "@/lib/auth";
import { prisma }           from "@/lib/prisma";
import { redirect }         from "next/navigation";
import DashboardHero        from "./DashboardHero";
import BuyerDashboardClient from "./BuyerDashboardClient";

export default async function BuyerPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const userName = session.user?.name ?? session.user?.email ?? "Buyer";
  const userId   = (session.user as any).id as string;

  const [systems, ownerships, latestProducts] = await Promise.all([
    prisma.system.findMany({
      where:   { isActive: true },
      orderBy: { createdAt: "asc" },
      include: { addons: { orderBy: [{ category: "asc" }, { label: "asc" }] } },
    }),
    prisma.ownership.findMany({
      where:  { userId },
      select: { productId: true },
    }),
    prisma.product.findMany({
      where:   { isLatest: true, isActive: true },
      select:  { id: true, name: true, price: true, category: true, packageTier: true, previewVideoUrl: true, facePngUrl: true },
    }),
  ]);

  const ownedProductIds = ownerships.map((o: any) => o.productId);

  // Fetch product names separately — safe even if Product table is empty
  const ownedProductRecords = ownedProductIds.length > 0
    ? await prisma.product.findMany({
        where:  { id: { in: ownedProductIds } },
        select: { id: true, name: true },
      })
    : [];

  const ownedSet = new Set(ownedProductIds);

  // Fallback maps for systems whose video URLs haven't been set in the DB yet.
  // Once admin sets demoVideoUrl / bgVideoUrl via the System Full Editor,
  // the DB value takes precedence and these fallbacks are ignored.
  const demoVideoFallbacks: Record<string, string> = {
    Restaurant: "/videos/restaurant-demo.mp4",
  };

  const bgVideoFallbacks: Record<string, string> = {
    Restaurant:    "/videos/restaurant-bg.mp4",
    Finance:       "/videos/finance-bg.mp4",
    Booking:       "/videos/booking-bg.mp4",
    CRM:           "/videos/crm-bg.mp4",
    Warehouse:     "/videos/warehouse-bg.mp4",
    "E-commerce":  "/videos/ecommerce-bg.mp4",
    Education:     "/videos/education-bg.mp4",
    Inventory:     "/videos/inventory-bg.mp4",
    Construction:  "/videos/construction-bg.mp4",
    HR:            "/videos/hr-bg.mp4",
  };

  const items = systems.map((s: any) => ({
    id:           s.id,
    name:         s.title,
    tag:          s.tag,
    accent:       s.accent,
    description:  s.description ?? "",
    basePrice:    s.basePrice,
    timeline:     s.timeline ?? "",
    features:     s.features ?? [],
    demoVideoUrl: s.demoVideoUrl ?? demoVideoFallbacks[s.tag] ?? null,
    bgVideoUrl:   s.bgVideoUrl   ?? bgVideoFallbacks[s.tag]   ?? null,
    owned:        ownedSet.has(s.id),
    addons:       s.addons.map((a: any) => ({
      id:       a.id,
      label:    a.label,
      desc:     a.description ?? "",
      price:    a.price,
      category: a.category,
      weeks:    0,
    })),
  }));

  // Pass all owned IDs (system + asset) to the client
  const ownedAssetIds  = ownedProductIds;
  const ownedProducts  = ownedProductRecords.map((p: any) => ({ id: p.id, name: p.name }));

  // Group latest products by category for the Latest Drop sections
  const latestCharacter  = latestProducts.find((p: any) => p.category === "character") ?? null;
  const latestWeapon     = latestProducts.find((p: any) => p.category === "weapon")    ?? null;
  const latestInterior   = latestProducts.find((p: any) => p.category === "interior")  ?? null;
  const latestExterior   = latestProducts.find((p: any) => p.category === "exterior")  ?? null;

  return (
    <div className="dashboardLanding">
      <DashboardHero userName={userName} />
      <BuyerDashboardClient
        items={items}
        ownedAssetIds={ownedAssetIds}
        ownedProducts={ownedProducts}
        latestCharacter={latestCharacter}
        latestWeapon={latestWeapon}
        latestInterior={latestInterior}
        latestExterior={latestExterior}
      />
    </div>
  );
}