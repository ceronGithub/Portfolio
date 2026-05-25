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
  // Video URLs migrated to Google Drive (Matthew Studio/videos/).
  // Format: https://drive.google.com/uc?export=download&id=FILE_ID
  const demoVideoFallbacks: Record<string, string> = {
    Restaurant: "",
  };

  const bgVideoFallbacks: Record<string, string> = {
    Restaurant:    "https://drive.google.com/uc?export=download&id=17x0seirDAhR5DcYKfasH4NkQ28kgoBXH",
    Finance:       "https://drive.google.com/uc?export=download&id=1I2cLsuCZR-FJfIE0mE6rlmS3oOeCZpZE",
    Booking:       "https://drive.google.com/uc?export=download&id=1yURLOEx0mV6BXXm02u6zmHG0WDCLuDYT",
    CRM:           "https://drive.google.com/uc?export=download&id=1FLK2lFf6WRZ3eJi-2SMLAr0llwYoKTB9",
    Warehouse:     "https://drive.google.com/uc?export=download&id=1hwuP1wh-Ejf6P4RSyvMO1Fu5Vgd9MjyZ",
    "E-commerce":  "https://drive.google.com/uc?export=download&id=1dj3DsiiB4bSmazvpHQon8ahRoPhZAegi",
    Education:     "https://drive.google.com/uc?export=download&id=1j4i91U6MQosO0Z04qmW2ROlyiYkd6IvM",
    Inventory:     "https://drive.google.com/uc?export=download&id=1NHJ7IorWgs_AxzhT1PjTKIu1yUlGS7wb",
    Construction:  "https://drive.google.com/uc?export=download&id=1FRr9D3Lrgo-RAd_LPRFc26OHlPjkHMwd",
    HR:            "https://drive.google.com/uc?export=download&id=1CEr8Z0xe4W4k5_Mvxf6r6iAFbiQ989TI",
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