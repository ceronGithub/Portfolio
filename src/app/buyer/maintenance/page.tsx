// buyer/maintenance/page.tsx — Server Component.
// Fetches buyer's active maintenance order + all related data.
// If no active order, shows package selection to avail.

export const dynamic = "force-dynamic";
import { getServerSession } from "next-auth";
import { authOptions }      from "@/lib/auth";
import { prisma }           from "@/lib/prisma";
import { redirect }         from "next/navigation";
import MaintenanceClient    from "./MaintenanceClient";

export default async function MaintenancePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const userId = (session.user as any).id as string;

  const order = await prisma.maintenanceOrder.findFirst({
    where:   { userId, status: "ACTIVE" },
    include: {
      vcSchedules: { orderBy: { createdAt: "desc" } },
      bugReports:  { orderBy: { createdAt: "desc" } },
      tasks:       { orderBy: { updatedAt: "desc" } },
    },
  });

  return <MaintenanceClient order={order as any} />;
}
