// admin/users/page.tsx — User Management page.
// 3 user cards + 1 action log card (4 tabs: Ban / Delete / Deactivate / Activate).
// Protected: ADMIN only.
import { prisma }           from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions }      from "@/lib/auth";
import { redirect }         from "next/navigation";
import AdminShell           from "@/components/AdminShell";
import UsersClient          from "./UsersClient";
import "./users.css";

export default async function AdminUsersPage() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== "ADMIN") redirect("/login");

  const adminName = session.user?.name ?? session.user?.email ?? "Admin";

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    include: { ownership: { include: { product: { select: { name: true } } } } },
  });

  // Guard: userActionLog table may not exist yet if migration hasn't run.
  // Page loads normally — logs card shows empty until migration is applied.
  let logs: any[] = [];
  try {
    logs = await (prisma as any).userActionLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 200,
    });
  } catch {
    logs = [];
  }

  // Fetch all products so the manual unlock modal can list them.
  const products = await prisma.product.findMany({
    select: { id: true, name: true, previewVideoUrl: true, facePngUrl: true },
    orderBy: { name: "asc" },
  });

  return (
    <AdminShell adminName={adminName}>
      <UsersClient initialUsers={users} initialLogs={logs} products={products} />
    </AdminShell>
  );
}