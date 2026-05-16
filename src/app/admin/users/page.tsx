// admin/users/page.tsx — User Management page.
// Protected: ADMIN only.
// Requires migration: npx prisma migrate dev --name add_user_active_banned
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
    select: {
      id:        true,
      name:      true,
      email:     true,
      role:      true,
      isActive:  true,
      isBanned:  true,
      createdAt: true,
      ownership: {
        select: {
          id:        true,
          productId: true,
          userId:    true,
          grantedAt: true,
          product:   { select: { name: true } },
        },
      },
    },
  });

  return (
    <AdminShell adminName={adminName}>
      <div className="adminUsersPage">
        <div className="adminPageHeader">
          <div>
            <h1 className="adminPageTitle">User Management</h1>
            <p className="adminPageSubtitle">
              {users.length} total &middot;{" "}
              {users.filter((u) => u.isActive && !u.isBanned).length} active &middot;{" "}
              {users.filter((u) => !u.isActive || u.isBanned).length} non-active
            </p>
          </div>
        </div>
        <UsersClient initialUsers={users} />
      </div>
    </AdminShell>
  );
}