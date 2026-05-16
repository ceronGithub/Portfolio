// OrdersClient.tsx — Orders table with filter tabs + inline status management.
"use client";

import { useState } from "react";

type OrderStatus = "PAID" | "PENDING" | "FAILED";

interface Order {
  id:              string;
  status:          OrderStatus;
  amountPaid:      number | null;
  paymongoOrderId: string | null;
  createdAt:       Date;
  user:            { name: string | null; email: string };
  product:         { name: string };
}

interface Props { orders: Order[]; }

type FilterTab = "ALL" | OrderStatus;

const filterTabs: { label: string; value: FilterTab }[] = [
  { label: "All",     value: "ALL"     },
  { label: "Paid",    value: "PAID"    },
  { label: "Pending", value: "PENDING" },
  { label: "Failed",  value: "FAILED"  },
];

const STATUS_COLORS: Record<OrderStatus, string> = {
  PAID:    "#68d391",
  PENDING: "#f6ad55",
  FAILED:  "#fc8181",
};

// ── Status selector dropdown ──────────────────────────────────────────
function StatusSelector({
  orderId, current, onUpdate, disabled,
}: {
  orderId: string; current: OrderStatus;
  onUpdate: (id: string, status: OrderStatus) => void;
  disabled: boolean;
}) {
  const [open, setOpen] = useState(false);

  const options: OrderStatus[] = ["PAID", "PENDING", "FAILED"];

  return (
    <div className="ordStatusWrap">
      <button
        className={`ordStatusBtn ordStatusBtn--${current.toLowerCase()}`}
        onClick={() => setOpen(o => !o)}
        disabled={disabled}
        title="Click to change status"
      >
        <span className="ordStatusDot" style={{ background: STATUS_COLORS[current] }} />
        {current}
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <div className="ordStatusDropdown">
          {options.filter(s => s !== current).map(s => (
            <button
              key={s}
              className={`ordStatusOption ordStatusOption--${s.toLowerCase()}`}
              onClick={() => { onUpdate(orderId, s); setOpen(false); }}
            >
              <span className="ordStatusDot" style={{ background: STATUS_COLORS[s] }} />
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────
export default function OrdersClient({ orders: initialOrders }: Props) {
  const [orders, setOrders]     = useState<Order[]>(initialOrders);
  const [activeFilter, setFilter] = useState<FilterTab>("ALL");
  const [pendingId, setPending]  = useState<string | null>(null);
  const [toast, setToast]        = useState<{ msg: string; type: "ok"|"err" } | null>(null);

  const filtered = activeFilter === "ALL"
    ? orders
    : orders.filter(o => o.status === activeFilter);

  function showToast(msg: string, type: "ok"|"err") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }

  async function handleStatusUpdate(orderId: string, newStatus: OrderStatus) {
    setPending(orderId);
    const res = await fetch(`/api/admin/orders/${orderId}`, {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ status: newStatus }),
    });
    if (res.ok) {
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
      showToast(`Order updated to ${newStatus}.`, "ok");
    } else {
      showToast("Failed to update order.", "err");
    }
    setPending(null);
  }

  return (
    <div className="adminOrdersContent">

      {/* Toast */}
      {toast && (
        <div className={`ordToast ordToast--${toast.type}`}>{toast.msg}</div>
      )}

      {/* Filter tabs */}
      <div className="adminOrdersFilterTabs">
        {filterTabs.map(tab => (
          <button
            key={tab.value}
            className={`adminOrdersFilterTab${activeFilter === tab.value ? " adminOrdersFilterTabActive" : ""}`}
            onClick={() => setFilter(tab.value)}
          >
            {tab.label}
            <span className="adminOrdersFilterCount">
              {tab.value === "ALL" ? orders.length : orders.filter(o => o.status === tab.value).length}
            </span>
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="adminOrdersTableWrap">
        <div className="adminOrdersTableHeader">
          <span>Order ID</span>
          <span>Customer</span>
          <span>Product</span>
          <span>Status</span>
          <span>Amount</span>
          <span>Date</span>
        </div>

        {filtered.length === 0 && (
          <p className="adminEmptyNote">No orders match this filter.</p>
        )}

        {filtered.map(order => (
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
              <StatusSelector
                orderId={order.id}
                current={order.status}
                onUpdate={handleStatusUpdate}
                disabled={pendingId === order.id}
              />
            </span>
            <span className="adminOrdersCell adminOrdersCellMono">
              {order.amountPaid
                ? `₱${(order.amountPaid / 100).toLocaleString()}`
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