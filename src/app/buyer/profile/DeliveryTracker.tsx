// DeliveryTracker.tsx — Per-order delivery status timeline.
// Shows 5 stages: Downpayment → Development → Testing → Delivered.
// Active stage glows with accent color. Past stages are filled.
// Admin sets status via DB; this component is read-only for buyers.
// Used inside /buyer/profile and anywhere orders are displayed.

"use client";

import "./delivery-tracker.css";

type OrderStatus =
  | "PENDING"
  | "PAID"
  | "IN_DEVELOPMENT"
  | "IN_TESTING"
  | "DELIVERED"
  | "FAILED";

interface TrackerOrder {
  id:           string;
  productName:  string;
  status:       OrderStatus;
  deliveryNote: string | null;
  estimatedAt:  string | null;
  deliveredAt:  string | null;
  createdAt:    string;
  amount:       number;
}

interface Props {
  orders: TrackerOrder[];
}

// ── Stage definitions ───────────────────────────────────────────────────────
const STAGES: { key: OrderStatus; label: string; icon: string; desc: string }[] = [
  {
    key:   "PENDING",
    label: "Inquiry",
    icon:  "📋",
    desc:  "Order received. Awaiting downpayment.",
  },
  {
    key:   "PAID",
    label: "Downpayment",
    icon:  "💳",
    desc:  "30% payment confirmed. Development queued.",
  },
  {
    key:   "IN_DEVELOPMENT",
    label: "Development",
    icon:  "⚙️",
    desc:  "Actively being built by the team.",
  },
  {
    key:   "IN_TESTING",
    label: "Testing",
    icon:  "🧪",
    desc:  "QA and UAT phase. Almost ready.",
  },
  {
    key:   "DELIVERED",
    label: "Delivered",
    icon:  "✅",
    desc:  "Handed over. Full source code transferred.",
  },
];

// Stage index lookup (FAILED is treated as stuck at its last stage)
const STAGE_INDEX: Record<OrderStatus, number> = {
  PENDING:        0,
  PAID:           1,
  IN_DEVELOPMENT: 2,
  IN_TESTING:     3,
  DELIVERED:      4,
  FAILED:         -1,
};

function fmt(p: number) {
  return "₱" + p.toLocaleString("en-PH", { minimumFractionDigits: 0 });
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-PH", {
    year: "numeric", month: "short", day: "numeric",
  });
}

function OrderTracker({ order }: { order: TrackerOrder }) {
  const isFailed     = order.status === "FAILED";
  const activeIndex  = isFailed ? -1 : (STAGE_INDEX[order.status] ?? 0);

  return (
    <div className={"dtOrder" + (isFailed ? " dtOrderFailed" : "")}>

      {/* Order header */}
      <div className="dtOrderHeader">
        <div className="dtOrderInfo">
          <p className="dtOrderName">{order.productName}</p>
          <p className="dtOrderMeta">
            Ordered {fmtDate(order.createdAt)}
            {order.estimatedAt && !isFailed && order.status !== "DELIVERED" && (
              <> · Est. {fmtDate(order.estimatedAt)}</>
            )}
            {order.deliveredAt && order.status === "DELIVERED" && (
              <> · Delivered {fmtDate(order.deliveredAt)}</>
            )}
          </p>
        </div>
        <div className="dtOrderRight">
          <p className="dtOrderAmount">{fmt(order.amount)}</p>
          {isFailed && <span className="dtFailedBadge">Cancelled</span>}
        </div>
      </div>

      {/* Timeline */}
      {!isFailed && (
        <div className="dtTimeline">
          {STAGES.map((stage, i) => {
            const isPast   = i < activeIndex;
            const isActive = i === activeIndex;
            const isFuture = i > activeIndex;

            return (
              <div key={stage.key} className="dtStageWrap">

                {/* Connector line (not before first) */}
                {i > 0 && (
                  <div className={"dtConnector" + (isPast || isActive ? " dtConnectorFilled" : "")} />
                )}

                {/* Stage node */}
                <div
                  className={[
                    "dtStage",
                    isPast   ? "dtStagePast"   : "",
                    isActive ? "dtStageActive" : "",
                    isFuture ? "dtStageFuture" : "",
                  ].join(" ")}
                >
                  <div className="dtStageNode">
                    {isPast ? (
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    ) : isActive ? (
                      <div className="dtStageActiveDot" />
                    ) : (
                      <div className="dtStageFutureDot" />
                    )}
                  </div>
                  <p className="dtStageLabel">{stage.label}</p>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Admin delivery note */}
      {order.deliveryNote && (
        <div className="dtNote">
          <span className="dtNoteIcon">💬</span>
          <p className="dtNoteText">{order.deliveryNote}</p>
        </div>
      )}

    </div>
  );
}

export default function DeliveryTracker({ orders }: Props) {
  // Only show orders that are active (not FAILED, not just PENDING with no progress)
  const activeOrders = orders.filter(o => o.status !== "FAILED");
  const failedOrders = orders.filter(o => o.status === "FAILED");

  if (orders.length === 0) return null;

  return (
    <div className="deliveryTracker">
      <div className="dtHeader">
        <p className="dtLabel">Delivery Tracker</p>
        <span className="dtCount">{activeOrders.length} active</span>
      </div>

      <div className="dtList">
        {activeOrders.map(order => (
          <OrderTracker key={order.id} order={order} />
        ))}
        {failedOrders.map(order => (
          <OrderTracker key={order.id} order={order} />
        ))}
      </div>
    </div>
  );
}
