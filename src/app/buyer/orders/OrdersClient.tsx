// OrdersClient.tsx — Buyer order history with vertical purchase timeline.
// Each order card shows: product name, amount, status badge, delivery note,
// estimated date, and a 5-stage progress stepper.
// Filter tabs: All / Active / Delivered / Cancelled.

"use client";

import { useState, useMemo } from "react";
import "./orders.css";

type OrderStatus =
  | "PENDING"
  | "PAID"
  | "IN_DEVELOPMENT"
  | "IN_TESTING"
  | "DELIVERED"
  | "FAILED";

interface Order {
  id:           string;
  productName:  string;
  amount:       number;
  status:       OrderStatus;
  deliveryNote: string | null;
  estimatedAt:  string | null;
  deliveredAt:  string | null;
  createdAt:    string;
}

interface Props {
  orders: Order[];
}

// ── Stage definitions ──────────────────────────────────────────────────────
const STAGES: { key: OrderStatus; label: string }[] = [
  { key: "PENDING",        label: "Inquiry"     },
  { key: "PAID",           label: "Downpayment" },
  { key: "IN_DEVELOPMENT", label: "Dev"         },
  { key: "IN_TESTING",     label: "Testing"     },
  { key: "DELIVERED",      label: "Delivered"   },
];

const STAGE_INDEX: Record<OrderStatus, number> = {
  PENDING:        0,
  PAID:           1,
  IN_DEVELOPMENT: 2,
  IN_TESTING:     3,
  DELIVERED:      4,
  FAILED:         -1,
};

const STATUS_META: Record<OrderStatus, { label: string; color: string }> = {
  PENDING:        { label: "Pending",     color: "#f59e0b" },
  PAID:           { label: "Paid",        color: "#3b82f6" },
  IN_DEVELOPMENT: { label: "In Dev",      color: "#6366f1" },
  IN_TESTING:     { label: "Testing",     color: "#a855f7" },
  DELIVERED:      { label: "Delivered",   color: "#22c55e" },
  FAILED:         { label: "Cancelled",   color: "#ef4444" },
};

type FilterTab = "All" | "Active" | "Delivered" | "Cancelled";

function fmt(p: number) {
  return "₱" + p.toLocaleString("en-PH", { minimumFractionDigits: 0 });
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-PH", {
    year: "numeric", month: "short", day: "numeric",
  });
}

// ── Single order timeline card ─────────────────────────────────────────────
function OrderCard({ order }: { order: Order }) {
  const activeIndex = STAGE_INDEX[order.status];
  const isFailed    = order.status === "FAILED";
  const meta        = STATUS_META[order.status];

  return (
    <div className={`ohCard ${isFailed ? "ohCardFailed" : ""}`}>

      {/* Header row */}
      <div className="ohCardHeader">
        <div className="ohCardInfo">
          <p className="ohCardName">{order.productName}</p>
          <p className="ohCardMeta">
            Ordered {fmtDate(order.createdAt)}
            {order.estimatedAt && !isFailed && (
              <> · Est. {fmtDate(order.estimatedAt)}</>
            )}
            {order.deliveredAt && (
              <> · Delivered {fmtDate(order.deliveredAt)}</>
            )}
          </p>
        </div>
        <div className="ohCardRight">
          <p className="ohCardAmount">{fmt(order.amount)}</p>
          <span
            className="ohCardBadge"
            style={{ color: meta.color, borderColor: meta.color + "33", background: meta.color + "11" }}
          >
            {meta.label}
          </span>
        </div>
      </div>

      {/* Timeline stepper */}
      {!isFailed && (
        <div className="ohTimeline">
          {STAGES.map((stage, i) => {
            const isPast   = i < activeIndex;
            const isActive = i === activeIndex;
            const stateClass = isPast ? "ohStagePast" : isActive ? "ohStageActive" : "ohStageFuture";

            return (
              <div key={stage.key} className="ohStageWrap">
                <div className={`ohStage ${stateClass}`}>
                  <div className="ohStageNode">
                    {isPast && (
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                        <path d="M1.5 5L4 7.5L8.5 2.5" stroke="#000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                    {isActive && <span className="ohStageActiveDot" />}
                    {!isPast && !isActive && <span className="ohStageFutureDot" />}
                  </div>
                  <p className="ohStageLabel">{stage.label}</p>
                </div>
                {/* Connector — not after last */}
                {i < STAGES.length - 1 && (
                  <div className={`ohConnector ${isPast ? "ohConnectorFilled" : ""}`} />
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Delivery note */}
      {order.deliveryNote && (
        <div className="ohNote">
          <span className="ohNoteIcon">💬</span>
          <p className="ohNoteText">{order.deliveryNote}</p>
        </div>
      )}

      {isFailed && (
        <div className="ohFailedNote">
          <span>✕</span>
          <p>This order was cancelled or payment failed.</p>
        </div>
      )}
    </div>
  );
}

// ── Main export ────────────────────────────────────────────────────────────
export default function OrdersClient({ orders }: Props) {
  const [tab, setTab] = useState<FilterTab>("All");

  const filtered = useMemo(() => {
    if (tab === "All")       return orders;
    if (tab === "Delivered") return orders.filter(o => o.status === "DELIVERED");
    if (tab === "Cancelled") return orders.filter(o => o.status === "FAILED");
    // Active = anything not delivered or failed
    return orders.filter(o => o.status !== "DELIVERED" && o.status !== "FAILED");
  }, [orders, tab]);

  const tabCounts: Record<FilterTab, number> = {
    All:       orders.length,
    Active:    orders.filter(o => o.status !== "DELIVERED" && o.status !== "FAILED").length,
    Delivered: orders.filter(o => o.status === "DELIVERED").length,
    Cancelled: orders.filter(o => o.status === "FAILED").length,
  };

  return (
    <div className="ohPage">

      {/* Header */}
      <div className="ohHeader">
        <p className="ohEyebrow">Purchase History</p>
        <h1 className="ohTitle">Your Orders</h1>
        <p className="ohSub">{orders.length} order{orders.length !== 1 ? "s" : ""} · All time</p>
      </div>

      {/* Filter tabs */}
      <div className="ohTabs">
        {(["All", "Active", "Delivered", "Cancelled"] as FilterTab[]).map(t => (
          <button
            key={t}
            className={`ohTab ${tab === t ? "ohTabActive" : ""}`}
            onClick={() => setTab(t)}
          >
            {t}
            <span className="ohTabCount">{tabCounts[t]}</span>
          </button>
        ))}
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="ohEmpty">
          <p className="ohEmptyIcon">{tab === "All" ? "🛒" : "📭"}</p>
          <p className="ohEmptyText">
            {tab === "All" ? "No orders yet." : `No ${tab.toLowerCase()} orders.`}
          </p>
          {tab === "All" && (
            <p className="ohEmptyHint">Browse the catalog and place your first order.</p>
          )}
        </div>
      )}

      {/* Order list */}
      {filtered.length > 0 && (
        <div className="ohList">
          {filtered.map(order => (
            <OrderCard key={order.id} order={order} />
          ))}
        </div>
      )}
    </div>
  );
}
