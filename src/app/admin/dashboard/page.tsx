// admin/dashboard/page.tsx — Overview page.
// Fetches accurate revenue and stats from DB for all admin widgets.
// Protected: ADMIN only.
export const dynamic = "force-dynamic";
import { prisma }           from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions }      from "@/lib/auth";
import { redirect }         from "next/navigation";
import AdminShell           from "@/components/AdminShell";
import OverviewClient       from "./OverviewClient";
import "./dashboard.css";

// Returns label for last N months e.g. ["Dec","Jan","Feb"...]
function getLastNMonths(n: number): { label: string; year: number; month: number }[] {
  const result = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    result.push({
      label: d.toLocaleString("en-PH", { month: "short" }),
      year:  d.getFullYear(),
      month: d.getMonth() + 1,
    });
  }
  return result;
}

// Returns label for last N weeks e.g. ["Wk1","Wk2"...]
function getLastNWeeks(n: number): { label: string; start: Date; end: Date }[] {
  const result = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const end   = new Date(now);
    end.setDate(now.getDate() - i * 7);
    const start = new Date(end);
    start.setDate(end.getDate() - 6);
    result.push({ label: `Wk${n - i}`, start, end });
  }
  return result;
}

// Compute correct price from deliveryNote tier + product price columns.
// Mirrors logic in pending-payments/page.tsx — single source of truth.
function computeOrderRevenue(order: {
  amountPaid:   number | null;
  deliveryNote: string | null;
  systemId:     string | null;
  product: { priceMeshOnly: number; priceStandard: number; priceFullPack: number } | null;
}): number {
  // System orders — trust amountPaid (no tier columns on System model)
  if (order.systemId) return order.amountPaid ?? 0;

  // Product orders — recompute from product price + tier in deliveryNote
  if (!order.product) return order.amountPaid ?? 0;
  const tierMatch = (order.deliveryNote ?? "").match(/tier:(\S+)/);
  const tier      = tierMatch?.[1] ?? "full_pack";
  if (tier === "mesh_only") return order.product.priceMeshOnly;
  if (tier === "standard")  return order.product.priceStandard;
  return order.product.priceFullPack;
}

export default async function AdminDashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== "ADMIN") redirect("/login");

  const adminName = session.user?.name ?? session.user?.email ?? "Admin";

  const months = getLastNMonths(6);
  const weeks  = getLastNWeeks(6);

  // ── Core stats ────────────────────────────────────────────────────
  const [
    userCount, productCount, orderCount, activeUsers,
    systemCount, siteVisitCount, appointmentCount, pendingAppointments,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.product.count(),
    // Accurate paid order count — counts each paid order (not unique users)
    prisma.order.count({ where: { status: "PAID" } }),
    prisma.user.count({ where: { ownership: { some: {} } } }),
    prisma.system.count(),
    prisma.siteVisit.count(),
    prisma.appointment.count(),
    prisma.appointment.findMany({
      where:   { status: "PENDING" },
      orderBy: { createdAt: "desc" },
      take:    5,
      select:  { id: true, referenceNo: true, buyerName: true, systemTitle: true, quotedPrice: true, scheduledDate: true, status: true },
    }),
  ]);

  // ── All paid orders with full data — used for revenue + chart splits ──
  // systemId used to classify system vs product orders (reliable — no name heuristic).
  // product price columns used to recompute accurate revenue per order.
  const paidOrders = await prisma.order.findMany({
    where:  { status: "PAID" },
    select: {
      amountPaid:   true,
      createdAt:    true,
      systemId:     true,
      deliveryNote: true,
      product: { select: { priceMeshOnly: true, priceStandard: true, priceFullPack: true } },
    },
  });

  // ── Accurate total revenue — recomputed per order, never from stale amountPaid ──
  const totalRevenue = paidOrders.reduce(
    (sum: number, o: typeof paidOrders[0]) => sum + computeOrderRevenue(o),
    0
  );

  // ── Monthly revenue — systems ─────────────────────────────────────
  const monthlyRevenueSystems = months.map(m => {
    const total = paidOrders
      .filter((o: typeof paidOrders[0]) => {
        const d = new Date(o.createdAt);
        return d.getFullYear() === m.year && d.getMonth() + 1 === m.month && o.systemId != null;
      })
      .reduce((sum: number, o: typeof paidOrders[0]) => sum + computeOrderRevenue(o), 0);
    return { label: m.label, value: total };
  });

  // ── Monthly revenue — products ────────────────────────────────────
  const monthlyRevenueProducts = months.map(m => {
    const total = paidOrders
      .filter((o: typeof paidOrders[0]) => {
        const d = new Date(o.createdAt);
        return d.getFullYear() === m.year && d.getMonth() + 1 === m.month && o.systemId == null;
      })
      .reduce((sum: number, o: typeof paidOrders[0]) => sum + computeOrderRevenue(o), 0);
    return { label: m.label, value: total };
  });

  // ── Weekly revenue — systems ──────────────────────────────────────
  const weeklyRevenueSystems = weeks.map(w => {
    const total = paidOrders
      .filter((o: typeof paidOrders[0]) => {
        const d = new Date(o.createdAt);
        return d >= w.start && d <= w.end && o.systemId != null;
      })
      .reduce((sum: number, o: typeof paidOrders[0]) => sum + computeOrderRevenue(o), 0);
    return { label: w.label, value: total };
  });

  // ── Weekly revenue — products ─────────────────────────────────────
  const weeklyRevenueProducts = weeks.map(w => {
    const total = paidOrders
      .filter((o: typeof paidOrders[0]) => {
        const d = new Date(o.createdAt);
        return d >= w.start && d <= w.end && o.systemId == null;
      })
      .reduce((sum: number, o: typeof paidOrders[0]) => sum + computeOrderRevenue(o), 0);
    return { label: w.label, value: total };
  });

  const notActive = userCount - activeUsers;

  // ── Site visit trend — daily unique visits for last 14 days ──────
  const fourteenDaysAgo = new Date(Date.now() - 13 * 24 * 60 * 60 * 1000);
  const rawVisits = await prisma.siteVisit.findMany({
    where:  { createdAt: { gte: fourteenDaysAgo } },
    select: { date: true },
  });

  const dailyVisitMap = new Map<string, number>();
  for (let i = 13; i >= 0; i--) {
    const d   = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    dailyVisitMap.set(key, 0);
  }
  for (const v of rawVisits) {
    if (dailyVisitMap.has(v.date)) dailyVisitMap.set(v.date, (dailyVisitMap.get(v.date) ?? 0) + 1);
  }
  const dailySiteVisits: { label: string; value: number }[] = [];
  for (const [dateStr, count] of dailyVisitMap.entries()) {
    const d = new Date(dateStr + "T00:00:00");
    const label = d.toLocaleDateString("en-PH", { month: "short", day: "numeric" });
    dailySiteVisits.push({ label, value: count });
  }

  // ── Conversion funnel — visits → registered → paid orders ────────
  // "paid" = total count of paid orders (not unique users) for accurate funnel.
  const conversionFunnel = {
    visits:     siteVisitCount,
    registered: userCount,
    paid:       orderCount,   // total paid orders — matches orderCount stat card
  };

  const stats = {
    visitorsRegistered: userCount,
    visitors:    siteVisitCount,
    notActive,
    activeUsers,
    totalUsers:  userCount,
    totalRevenue,
    productCount,
    orderCount,
    systemCount,
    appointmentCount,
  };

  return (
    <AdminShell adminName={adminName}>
      <OverviewClient
        stats={stats}
        monthlyRevenueSystems={monthlyRevenueSystems}
        monthlyRevenueProducts={monthlyRevenueProducts}
        weeklyRevenueSystems={weeklyRevenueSystems}
        weeklyRevenueProducts={weeklyRevenueProducts}
        dailySiteVisits={dailySiteVisits}
        conversionFunnel={conversionFunnel}
        pendingAppointments={pendingAppointments}
      />
    </AdminShell>
  );
}