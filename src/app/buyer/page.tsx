// buyer/page.tsx — Server Component.
// Fetches session + systems (with addons) + ownership from DB.
// Passes data to BuyerDashboardClient (Client Component) which owns:
//   - Wishlist state (Task 1)
//   - Bundle pricing (Task 2) via AssetBuySection + ArchitectureBuySection
//   - Owned asset state (Task 3)
//   - Architecture Asset Studio sections (Task 4)

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

  const [systems, ownerships] = await Promise.all([
    prisma.system.findMany({
      where:   { isActive: true },
      orderBy: { createdAt: "asc" },
      include: { addons: { orderBy: [{ category: "asc" }, { label: "asc" }] } },
    }),
    prisma.ownership.findMany({
      where:  { userId },
      select: { productId: true, product: { select: { name: true } } },
    }),
  ]);

  const ownedSet = new Set(ownerships.map((o: any) => o.productId));

  const demoVideos: Record<string, string> = {
    Restaurant: "/videos/restaurant-demo.mp4",
  };

  const bgVideos: Record<string, string> = {
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
    demoVideoUrl: demoVideos[s.tag] ?? null,
    bgVideoUrl:   bgVideos[s.tag]   ?? null,
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
  const ownedAssetIds  = ownerships.map((o: any) => o.productId);
  const ownedProducts  = ownerships.map((o: any) => ({ id: o.productId, name: o.product.name }));

  return (
    <div className="dashboardLanding">
      <DashboardHero userName={userName} />
      <BuyerDashboardClient
        items={items}
        ownedAssetIds={ownedAssetIds}
        ownedProducts={ownedProducts}
      />
    </div>
  );
}