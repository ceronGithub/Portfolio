// admin/orders/page.tsx — Orders management page.
// Lists all orders with status, customer, product, amount, and date.
// Revenue is recomputed from product price + tier — never trusts stale amountPaid.
// Protected: ADMIN only.
import { prisma }           from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions }      from "@/lib/auth";
import { redirect }         from "next/navigation";
import AdminShell           from "@/components/AdminShell";
import OrdersClient         from "./OrdersClient";
import "./orders.css";

// Mirrors computeOrderRevenue in admin/dashboard/page.tsx.
// System orders trust amountPaid; product orders recompute from tier + price columns.
function computeOrderRevenue(order: {
  amountPaid:   number | null;
  deliveryNote: string | null;
  systemId:     string | null;
  product: { priceMeshOnly: number; priceStandard: number; priceFullPack: number } | null;
}): number {
  if (order.systemId) return order.amountPaid ?? 0;
  if (!order.product) return order.amountPaid ?? 0;
  const tierMatch = (order.deliveryNote ?? "").match(/tier:(\S+)/);
  const tier      = tierMatch?.[1] ?? "full_pack";
  if (tier === "mesh_only") return order.product.priceMeshOnly;
  if (tier === "standard")  return order.product.priceStandard;
  return order.product.priceFullPack;
}

export default async function AdminOrdersPage() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== "ADMIN") redirect("/login");

  const adminName = session.user?.name ?? session.user?.email ?? "Admin";

  // Fetch all orders newest-first, with user, product price columns, and system details
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
      systemId:        true,
      userId:          true,
      user:    { select: { name: true, email: true } },
      product: { select: { id: true, name: true, priceMeshOnly: true, priceStandard: true, priceFullPack: true } },
      system:  { select: { id: true, title: true } },
    },
  });

  // Accurate revenue — recomputed per paid order from product/tier price
  const paidOrders   = orders.filter((o: typeof orders[0]) => o.status === "PAID");
  const totalRevenue = paidOrders.reduce(
    (sum: number, o: typeof orders[0]) => sum + computeOrderRevenue(o),
    0
  );

  const paidCount    = paidOrders.length;
  const pendingCount = orders.filter((o: typeof orders[0]) => o.status === "PENDING").length;
  const failedCount  = orders.filter((o: typeof orders[0]) => o.status === "FAILED").length;

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

        <OrdersClient orders={orders.map((o: typeof orders[number]) => ({
          ...o,
          // Pass correct computed amount for each order to the client
          amountPaid:  computeOrderRevenue(o),
          createdAt:   o.createdAt.toISOString(),
          estimatedAt: o.estimatedAt ? o.estimatedAt.toISOString() : null,
        }))} />

      </div>
    </AdminShell>
  );
}