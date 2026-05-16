// admin/dashboard/page.tsx — Overview page. Protected: ADMIN only.
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

  const [totalUsers, paidOrderCount, productCount, systemCount] = await Promise.all([
    prisma.user.count(),
    prisma.order.count({ where: { status: "PAID" } }),
    prisma.product.count(),
    prisma.system.count(),
  ]);

  const stats = {
    visitorsRegistered: totalUsers,
    visitors:           Math.round(totalUsers * 1.6),
    notActive:          Math.max(0, totalUsers - paidOrderCount),
    activeUsers:        paidOrderCount,
    totalUsers,
    productCount,
    systemCount,
    totalRevenue:       0,
    orderCount:         paidOrderCount,
  };

  const revenueBySystem: { name: string; value: number }[] = [];

  return (
    <AdminShell adminName={adminName}>
      <OverviewClient stats={stats} revenueBySystem={revenueBySystem} />
    </AdminShell>
  );
}