// admin/dashboard/page.tsx — Overview page.
// Fetches real monthly + weekly revenue for Systems and Products from DB.
// Protected: ADMIN only.
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

export default async function AdminDashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== "ADMIN") redirect("/login");

  const adminName = session.user?.name ?? session.user?.email ?? "Admin";

  const months = getLastNMonths(6);
  const weeks  = getLastNWeeks(6);

  // ── Core stats ────────────────────────────────────────────────────
  const [userCount, productCount, orderCount, revenue, activeUsers, systemCount, siteVisitCount] =
    await Promise.all([
      prisma.user.count(),
      prisma.product.count(),
      prisma.order.count({ where: { status: "PAID" } }),
      prisma.order.aggregate({ where: { status: "PAID" }, _sum: { amountPaid: true } }),
      prisma.user.count({ where: { ownership: { some: {} } } }),
      prisma.system.count(),
      prisma.siteVisit.count(),
    ]);

  // ── All paid orders with date — used to compute monthly/weekly splits ──
  const paidOrders = await prisma.order.findMany({
    where: { status: "PAID" },
    select: { amountPaid: true, createdAt: true, productId: true },
  });

  // All products with their system tag (to classify orders as System vs Product)
  const allProducts = await prisma.product.findMany({ select: { id: true, name: true } });
  const allSystems  = await prisma.system.findMany({ select: { id: true, tag: true, title: true } });

  // Build a set of systemTags that match product names (best effort join)
  const systemTitles = new Set(allSystems.map((s: { title: string }) => s.title.toLowerCase()));
  const productIdIsSystem = new Map<string, boolean>();
  for (const p of allProducts) {
    productIdIsSystem.set(p.id, systemTitles.has(p.name.toLowerCase()));
  }

  // ── Monthly revenue — systems ─────────────────────────────────────
  const monthlyRevenueSystems = months.map(m => {
    const total = paidOrders
      .filter((o: { amountPaid: number | null; createdAt: Date; productId: string }) => {
        const d = new Date(o.createdAt);
        return d.getFullYear() === m.year && d.getMonth() + 1 === m.month
          && productIdIsSystem.get(o.productId) === true;
      })
      .reduce((sum: number, o: { amountPaid: number | null }) => sum + (o.amountPaid ?? 0), 0);
    return { label: m.label, value: Math.round(total / 100) };
  });

  // ── Monthly revenue — products ────────────────────────────────────
  const monthlyRevenueProducts = months.map(m => {
    const total = paidOrders
      .filter((o: { amountPaid: number | null; createdAt: Date; productId: string }) => {
        const d = new Date(o.createdAt);
        return d.getFullYear() === m.year && d.getMonth() + 1 === m.month
          && productIdIsSystem.get(o.productId) !== true;
      })
      .reduce((sum: number, o: { amountPaid: number | null }) => sum + (o.amountPaid ?? 0), 0);
    return { label: m.label, value: Math.round(total / 100) };
  });

  // ── Weekly revenue — systems ──────────────────────────────────────
  const weeklyRevenueSystems = weeks.map(w => {
    const total = paidOrders
      .filter((o: { amountPaid: number | null; createdAt: Date; productId: string }) => {
        const d = new Date(o.createdAt);
        return d >= w.start && d <= w.end
          && productIdIsSystem.get(o.productId) === true;
      })
      .reduce((sum: number, o: { amountPaid: number | null }) => sum + (o.amountPaid ?? 0), 0);
    return { label: w.label, value: Math.round(total / 100) };
  });

  // ── Weekly revenue — products ─────────────────────────────────────
  const weeklyRevenueProducts = weeks.map(w => {
    const total = paidOrders
      .filter((o: { amountPaid: number | null; createdAt: Date; productId: string }) => {
        const d = new Date(o.createdAt);
        return d >= w.start && d <= w.end
          && productIdIsSystem.get(o.productId) !== true;
      })
      .reduce((sum: number, o: { amountPaid: number | null }) => sum + (o.amountPaid ?? 0), 0);
    return { label: w.label, value: Math.round(total / 100) };
  });

  const totalRevenue = (revenue._sum.amountPaid ?? 0) / 100;
  const notActive    = userCount - activeUsers;

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
  };

  return (
    <AdminShell adminName={adminName}>
      <OverviewClient
        stats={stats}
        monthlyRevenueSystems={monthlyRevenueSystems}
        monthlyRevenueProducts={monthlyRevenueProducts}
        weeklyRevenueSystems={weeklyRevenueSystems}
        weeklyRevenueProducts={weeklyRevenueProducts}
      />
    </AdminShell>
  );
}