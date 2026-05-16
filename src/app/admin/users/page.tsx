// admin/users/page.tsx — User Management page.
// Lists all users: name, email, role, join date, owned products.
// Allows admin to manually grant product ownership to any user.
// Protected: ADMIN only.
import { prisma }            from "@/lib/prisma";
import { getServerSession }  from "next-auth";
import { authOptions }       from "@/lib/auth";
import { redirect }          from "next/navigation";
import AdminShell            from "@/components/AdminShell";
import ManualUnlockButton    from "@/components/ManualUnlockButton";
import "./users.css";

export default async function AdminUsersPage() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== "ADMIN") redirect("/login");

  const adminName = session.user?.name ?? session.user?.email ?? "Admin";

  const [users, products] = await Promise.all([
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      include: { ownership: { include: { product: true } } },
    }),
    prisma.product.findMany({ where: { isActive: true } }),
  ]);

  return (
    <AdminShell adminName={adminName}>
      <div className="adminUsersPage">

        <div className="adminPageHeader">
          <div>
            <h1 className="adminPageTitle">User Management</h1>
            <p className="adminPageSubtitle">{users.length} registered account{users.length !== 1 ? "s" : ""}</p>
          </div>
        </div>

        <div className="adminUsersTableWrap">
          {/* Table header */}
          <div className="adminUsersTableHeader">
            <span>Name</span>
            <span>Email</span>
            <span>Role</span>
            <span>Joined</span>
            <span>Owned Systems</span>
            <span>Manual Unlock</span>
          </div>

          {/* Table rows */}
          {users.map((user: (typeof users)[0]) => (
            <div key={user.id} className="adminUsersTableRow">
              <span className="adminUsersCell adminUsersCellName">
                {user.name ?? <span className="adminCellEmpty">—</span>}
              </span>
              <span className="adminUsersCell adminUsersCellEmail">{user.email}</span>
              <span className="adminUsersCell">
                <span className={`adminRoleBadge adminRoleBadge${user.role.toLowerCase()}`}>
                  {user.role}
                </span>
              </span>
              <span className="adminUsersCell adminUsersCellMuted">
                {new Date(user.createdAt).toLocaleDateString("en-PH", {
                  year: "numeric", month: "short", day: "numeric",
                })}
              </span>
              <span className="adminUsersCell adminUsersCellOwned">
                {user.ownership.length === 0
                  ? <span className="adminCellEmpty">None</span>
                  : user.ownership.map((o: { productId: string; product: { name: string } }) => (
                      <span key={o.productId} className="adminOwnedTag">{o.product.name}</span>
                    ))
                }
              </span>
              <span className="adminUsersCell">
                <ManualUnlockButton
                  userId={user.id}
                  products={products}
                  ownedIds={user.ownership.map((o: { productId: string }) => o.productId)}
                />
              </span>
            </div>
          ))}

          {users.length === 0 && (
            <p className="adminEmptyNote">No users registered yet.</p>
          )}
        </div>

      </div>
    </AdminShell>
  );
}
