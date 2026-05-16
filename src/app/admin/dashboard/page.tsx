// admin/dashboard/page.tsx — Overview page.
// Two parallax scroll panels: Panel 1 (donut + bar + stat cards),
// Panel 2 (two stacked bar charts + stat cards).
// Protected: ADMIN only.
import { prisma }           from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions }      from "@/lib/auth";
import { redirect }         from "next/navigation";
import AdminShell           from "@/components/AdminShell";
import OverviewClient       from "./OverviewClient";
import "./dashboard.css";

export default async function AdminDashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== "ADMIN") redirect("/login");

  const adminName = session.user?.name ?? session.user?.email ?? "Admin";

  const [userCount, productCount, orderCount, revenue, activeUsers, systemRevenue] =
    await Promise.all([
      prisma.user.count(),
      prisma.product.count(),
      prisma.order.count({ where: { status: "PAID" } }),
      prisma.order.aggregate({ where: { status: "PAID" }, _sum: { amountPaid: true } }),
      // Active = has at least one ownership
      prisma.user.count({ where: { ownership: { some: {} } } }),
      // Revenue per product (for donut chart)
      prisma.order.groupBy({
        by: ["productId"],
        where: { status: "PAID" },
        _sum: { amountPaid: true },
        orderBy: { _sum: { amountPaid: "desc" } },
        take: 4,
      }),
    ]);

  // Resolve product names for chart data
  const systemRevenueWithNames = await Promise.all(
    systemRevenue.map(async (row: { productId: string; _sum: { amountPaid: number | null } }) => {
      const product = await prisma.product.findUnique({
        where: { id: row.productId }, select: { name: true },
      });
      return { name: product?.name ?? "Other", value: (row._sum.amountPaid ?? 0) / 100 };
    })
  );

  const totalRevenue  = (revenue._sum.amountPaid ?? 0) / 100;
  const visitors      = userCount * 3;  // estimated visitors (3x registered)
  const notActive     = userCount - activeUsers;

  const stats = {
    visitorsRegistered: userCount,
    visitors,
    notActive,
    activeUsers,
    totalUsers: userCount,
    totalRevenue,
    productCount,
    orderCount,
  };

  return (
    <AdminShell adminName={adminName}>
      <OverviewClient stats={stats} revenueBySystem={systemRevenueWithNames} />
    </AdminShell>
  );
}
