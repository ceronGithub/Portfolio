// buyer/page.tsx — Server Component.
// Fetches session + System table (with addons) + ownership.
// Field names match prisma schema exactly.

import { getServerSession } from "next-auth";
import { authOptions }      from "@/lib/auth";
import { prisma }           from "@/lib/prisma";
import { redirect }         from "next/navigation";
import DashboardHero        from "./DashboardHero";
import SystemsClient        from "./system/SystemsClient";
import AISection            from "./ai/AISection";
import InquirySection       from "./inquiries/InquirySection";
import AIAssetsIntro       from "./ai-assets/AIAssetsIntro";
import NewAssetSection      from "./ai-assets/NewAssetSection";
import AssetBuySection      from "./ai-assets/AssetBuySection";

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
      select: { productId: true },
    }),
  ]);

  const ownedSet = new Set(ownerships.map(o => o.productId));

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

  const items = systems.map(s => ({
    id:          s.id,
    name:        s.title,
    tag:         s.tag,
    accent:      s.accent,
    description: s.description ?? "",
    basePrice:   s.basePrice,
    timeline:    s.timeline ?? "",
    demoVideoUrl: demoVideos[s.tag] ?? null,
    bgVideoUrl:   bgVideos[s.tag] ?? null,
    owned:       ownedSet.has(s.id),
    addons:      s.addons.map(a => ({
      id:       a.id,
      label:    a.label,
      desc:     a.description ?? "",
      price:    a.price,
      category: a.category,
      weeks:    0,
    })),
  }));

  return (
    <div className="dashboardLanding">
      <DashboardHero userName={userName} />
      <SystemsClient items={items} />
      <AISection />
      <AIAssetsIntro />
      <NewAssetSection />
      <AssetBuySection />      
      <InquirySection />
    </div>
  );
}