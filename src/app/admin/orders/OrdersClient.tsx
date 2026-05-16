// OrdersClient.tsx — Client component for Admin Orders page.
// Renders orders table with filter tabs (All / Paid / Pending / Failed).
"use client";

import { useState } from "react";

type OrderStatus = "PAID" | "PENDING" | "FAILED";

interface Order {
  id: string;
  status: OrderStatus;
  amountPaid: number | null;
  paymongoOrderId: string | null;
  createdAt: Date;
  user: { name: string | null; email: string };
  product: { name: string };
}

interface Props {
  orders: Order[];
}

type FilterTab = "ALL" | OrderStatus;

const filterTabs: { label: string; value: FilterTab }[] = [
  { label: "All",     value: "ALL"     },
  { label: "Paid",    value: "PAID"    },
  { label: "Pending", value: "PENDING" },
  { label: "Failed",  value: "FAILED"  },
];

export default function OrdersClient({ orders }: Props) {
  const [activeFilter, setActiveFilter] = useState<FilterTab>("ALL");

  // Filters orders by selected tab
  const filteredOrders = activeFilter === "ALL"
    ? orders
    : orders.filter(o => o.status === activeFilter);

  return (
    <div className="adminOrdersContent">

      {/* ── Filter tabs ───────────────────────────── */}
      <div className="adminOrdersFilterTabs">
        {filterTabs.map(tab => (
          <button
            key={tab.value}
            className={`adminOrdersFilterTab${activeFilter === tab.value ? " adminOrdersFilterTabActive" : ""}`}
            onClick={() => setActiveFilter(tab.value)}
          >
            {tab.label}
            <span className="adminOrdersFilterCount">
              {tab.value === "ALL"
                ? orders.length
                : orders.filter(o => o.status === tab.value).length}
            </span>
          </button>
        ))}
      </div>

      {/* ── Orders table ──────────────────────────── */}
      <div className="adminOrdersTableWrap">
        <div className="adminOrdersTableHeader">
          <span>Order ID</span>
          <span>Customer</span>
          <span>Product</span>
          <span>Status</span>
          <span>Amount</span>
          <span>Date</span>
        </div>

        {filteredOrders.length === 0 && (
          <p className="adminEmptyNote">No orders match this filter.</p>
        )}

        {filteredOrders.map(order => (
          <div key={order.id} className="adminOrdersTableRow">
            <span className="adminOrdersCell adminOrdersCellId">
              #{order.id.slice(-6).toUpperCase()}
            </span>
            <span className="adminOrdersCell adminOrdersCellName">
              <span className="adminOrdersCellNameMain">
                {order.user.name ?? order.user.email}
              </span>
              {order.user.name && (
                <span className="adminOrdersCellNameEmail">{order.user.email}</span>
              )}
            </span>
            <span className="adminOrdersCell adminOrdersCellMuted">{order.product.name}</span>
            <span className="adminOrdersCell">
              <span className={`adminStatusBadge adminStatusBadge${order.status}`}>
                {order.status}
              </span>
            </span>
            <span className="adminOrdersCell adminOrdersCellMono">
              {order.amountPaid
                ? `\u20B1${(order.amountPaid / 100).toLocaleString()}`
                : <span className="adminCellEmpty">—</span>}
            </span>
            <span className="adminOrdersCell adminOrdersCellMuted">
              {new Date(order.createdAt).toLocaleDateString("en-PH", {
                year: "numeric", month: "short", day: "numeric",
              })}
            </span>
          </div>
        ))}
      </div>

    </div>
  );
}
