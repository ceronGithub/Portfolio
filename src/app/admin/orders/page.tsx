// admin/orders/page.tsx — Orders management page.
// Lists all orders with status, customer, product, amount, and date.
// Supports filtering by status via client component.
// Protected: ADMIN only.
import { prisma }           from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions }      from "@/lib/auth";
import { redirect }         from "next/navigation";
import AdminShell           from "@/components/AdminShell";
import OrdersClient         from "./OrdersClient";
import "./orders.css";

export default async function AdminOrdersPage() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== "ADMIN") redirect("/login");

  const adminName = session.user?.name ?? session.user?.email ?? "Admin";

  // Fetch all orders newest-first, with user and product details
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id:              true,
      status:          true,
      amountPaid:      true,
      paymongoOrderId: true,
      createdAt:       true,
      deliveryNote:    true,
      estimatedAt:     true,
      userId:          true,
      user:    { select: { name: true, email: true } },
      product: { select: { id: true, name: true } },
    },
  });

  const totalRevenue = orders
    .filter((o: { status: string }) => o.status === "PAID")
    .reduce((sum: number, o: { amountPaid: number | null }) => sum + (o.amountPaid ?? 0), 0) / 100;

  const paidCount    = orders.filter((o: { status: string }) => o.status === "PAID").length;
  const pendingCount = orders.filter((o: { status: string }) => o.status === "PENDING").length;
  const failedCount  = orders.filter((o: { status: string }) => o.status === "FAILED").length;

  return (
    <AdminShell adminName={adminName}>
      <div className="adminOrdersPage">

        <div className="adminPageHeader">
          <div>
            <h1 className="adminPageTitle">Orders</h1>
            <p className="adminPageSubtitle">{orders.length} total order{orders.length !== 1 ? "s" : ""}</p>
          </div>
        </div>

        {/* Quick stats strip */}
        <div className="adminOrdersStrip">
          <div className="adminOrdersStripItem">
            <span className="adminOrdersStripValue adminOrdersStripValuePaid">{paidCount}</span>
            <span className="adminOrdersStripLabel">Paid</span>
          </div>
          <div className="adminOrdersStripDivider" />
          <div className="adminOrdersStripItem">
            <span className="adminOrdersStripValue adminOrdersStripValuePending">{pendingCount}</span>
            <span className="adminOrdersStripLabel">Pending</span>
          </div>
          <div className="adminOrdersStripDivider" />
          <div className="adminOrdersStripItem">
            <span className="adminOrdersStripValue adminOrdersStripValueFailed">{failedCount}</span>
            <span className="adminOrdersStripLabel">Failed</span>
          </div>
          <div className="adminOrdersStripDivider" />
          <div className="adminOrdersStripItem">
            <span className="adminOrdersStripValue adminOrdersStripValueRevenue">
              &#8369;{totalRevenue.toLocaleString()}
            </span>
            <span className="adminOrdersStripLabel">Total Revenue</span>
          </div>
        </div>

        <OrdersClient orders={orders} />

      </div>
    </AdminShell>
  );
}