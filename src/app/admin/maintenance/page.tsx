// admin/maintenance/page.tsx — Server Component.
// Fetches all active maintenance orders with buyer info, tasks, bugs, VC schedules.
import { getServerSession } from "next-auth";
import { authOptions }      from "@/lib/auth";
import { prisma }           from "@/lib/prisma";
import { redirect }         from "next/navigation";
import AdminMaintenanceClient from "./AdminMaintenanceClient";

export default async function AdminMaintenancePage() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== "ADMIN") redirect("/login");

  const orders = await prisma.maintenanceOrder.findMany({
    where:   { status: "ACTIVE" },
    include: {
      user:        { select: { id: true, name: true, email: true } },
      vcSchedules: { orderBy: { createdAt: "desc" } },
      bugReports:  { orderBy: { createdAt: "desc" } },
      tasks:       { orderBy: { createdAt: "desc" } },
    },
    orderBy: { createdAt: "desc" },
  });

  return <AdminMaintenanceClient orders={orders as any} />;
}
