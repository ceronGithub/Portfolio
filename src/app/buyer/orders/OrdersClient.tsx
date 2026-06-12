// OrdersClient.tsx — Buyer order history with vertical purchase timeline.
// Each order card shows: product name, amount, status badge, delivery note,
// estimated date, and a 5-stage progress stepper.
// Filter tabs: All / Active / Delivered / Cancelled.

"use client";

import { useState, useMemo, useCallback } from "react";
import "./orders.css";

type OrderStatus =
  | "PENDING"
  | "PAID"
  | "IN_DEVELOPMENT"
  | "IN_TESTING"
  | "DELIVERED"
  | "FAILED"
  | "LINK_EXPIRED";

interface Order {
  id:           string;
  productId:    string | null;
  productName:  string;
  amount:       number;
  status:       OrderStatus;
  deliveryNote: string | null;
  estimatedAt:  string | null;
  deliveredAt:  string | null;
  createdAt:    string;
}

interface Props {
  orders:          Order[];
  ownedProductIds: string[];
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
  LINK_EXPIRED:   -1,
};

const STATUS_META: Record<OrderStatus, { label: string; color: string }> = {
  PENDING:        { label: "Pending",     color: "#f59e0b" },
  PAID:           { label: "Paid",        color: "#3b82f6" },
  IN_DEVELOPMENT: { label: "In Dev",      color: "#6366f1" },
  IN_TESTING:     { label: "Testing",     color: "#a855f7" },
  DELIVERED:      { label: "Delivered",   color: "#22c55e" },
  FAILED:         { label: "Cancelled",   color: "#ef4444" },
  LINK_EXPIRED:   { label: "Expired",     color: "#9ca3af" },
};

type FilterTab = "All" | "Active" | "Delivered" | "Cancelled" | "Expired";

function fmt(p: number) {
  return "₱" + p.toLocaleString("en-PH", { minimumFractionDigits: 0 });
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-PH", {
    year: "numeric", month: "short", day: "numeric",
  });
}

// ── Single order timeline card ─────────────────────────────────────────────
function OrderCard({ order, isOwned }: { order: Order; isOwned: boolean }) {
  const activeIndex  = STAGE_INDEX[order.status];
  const isFailed     = order.status === "FAILED";
  const isExpired    = order.status === "LINK_EXPIRED";
  const isDelivered  = order.status === "DELIVERED";
  const isPending    = order.status === "PENDING";
  const isTerminal   = isFailed || isExpired;
  const meta         = STATUS_META[order.status];

  // ── Payment check state ────────────────────────────────────────────
  const [checkState, setCheckState] = useState<"idle" | "loading" | "paid" | "unpaid" | "error">("idle");
  const [payUrl,     setPayUrl]     = useState<string | null>(null);

  const handleCheckPayment = useCallback(async () => {
    setCheckState("loading");
    // Open blank window BEFORE async — avoids popup blocker
    const payWin = window.open("", "_blank");
    try {
      // ── Step 1: Check DB status first — webhook may have already fired ──
      const statusRes = await fetch(
        `/api/buyer/pending-payment/statuses?ids=${encodeURIComponent(order.id)}`
      );
      if (statusRes.ok) {
        const { statuses } = await statusRes.json() as { statuses: Record<string, string> };
        if (statuses[order.id] === "PAID") {
          payWin?.close();
          setCheckState("paid");
          setTimeout(() => { window.location.reload(); }, 1500);
          return;
        }
      }

      // ── Step 2: Still PENDING — get checkout URL and open in new tab ────
      const res  = await fetch(`/api/buyer/pending-payment/${order.id}`);
      const data = await res.json();
      if (!res.ok) { payWin?.close(); setCheckState("error"); return; }
      if (data.checkoutUrl) {
        setPayUrl(data.checkoutUrl);
        setCheckState("unpaid");
        if (payWin) payWin.location.href = data.checkoutUrl;
        else window.open(data.checkoutUrl, "_blank", "noopener,noreferrer");
        // Poll DB status after opening — auto-refresh when paid
        let attempts = 0;
        const pollId = setInterval(async () => {
          attempts++;
          try {
            const pollRes = await fetch(
              `/api/buyer/pending-payment/statuses?ids=${encodeURIComponent(order.id)}`
            );
            if (pollRes.ok) {
              const { statuses } = await pollRes.json() as { statuses: Record<string, string> };
              if (statuses[order.id] === "PAID") {
                clearInterval(pollId);
                setCheckState("paid");
                setTimeout(() => { window.location.reload(); }, 1500);
              }
            }
          } catch { /* keep polling */ }
          if (attempts >= 36) clearInterval(pollId);
        }, 5000);
      } else {
        payWin?.close();
        setCheckState("paid");
        setTimeout(() => { window.location.reload(); }, 1500);
      }
    } catch {
      payWin?.close();
      setCheckState("error");
    }
  }, [order.id]);

  return (
    <div className={`ohCard ${isFailed ? "ohCardFailed" : ""} ${isExpired ? "ohCardExpired" : ""}`}>

      {/* Header row */}
      <div className="ohCardHeader">
        <div className="ohCardInfo">
          <p className="ohCardName">{order.productName}</p>
          <p className="ohCardMeta">
            Ordered {fmtDate(order.createdAt)}
            {order.estimatedAt && !isTerminal && (
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
          {isDelivered && isOwned && (
            <span className="ohOwnedBadge">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              Owned
            </span>
          )}
          {isDelivered && !isOwned && (
            <span className="ohNotOwnedBadge">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              Not in Downloads
            </span>
          )}
        </div>
      </div>

      {/* Timeline stepper — only for non-terminal statuses */}
      {!isTerminal && (
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

      {isExpired && (
        <div className="ohExpiredNote">
          <span>⏱</span>
          <p>Payment link expired. Contact support to reissue a new payment link.</p>
        </div>
      )}

      {/* ── Payment check — PENDING orders only ── */}
      {isPending && (
        <div className="ohPayCheck">
          {checkState === "idle" && (
            <button className="ohPayCheckBtn" onClick={handleCheckPayment}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
              Check if Paid
            </button>
          )}
          {checkState === "loading" && (
            <div className="ohPayCheckLoading">
              <span className="ohPayCheckSpinner" />
              Checking payment…
            </div>
          )}
          {checkState === "paid" && (
            <div className="ohPayCheckResult ohPayCheckResultPaid">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              Payment confirmed — processing your order.
            </div>
          )}
          {checkState === "unpaid" && (
            <div className="ohPayCheckResult ohPayCheckResultUnpaid">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              Not yet paid.
              {payUrl && (
                <a className="ohPayCheckLink" href={payUrl} target="_blank" rel="noopener noreferrer">
                  Pay now →
                </a>
              )}
              <button className="ohPayCheckRetry" onClick={() => setCheckState("idle")}>Check again</button>
            </div>
          )}
          {checkState === "error" && (
            <div className="ohPayCheckResult ohPayCheckResultError">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <line x1="15" y1="9" x2="9" y2="15"/>
                <line x1="9" y1="9" x2="15" y2="15"/>
              </svg>
              Could not verify payment. Try again.
              <button className="ohPayCheckRetry" onClick={() => setCheckState("idle")}>Retry</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main export ────────────────────────────────────────────────────────────
export default function OrdersClient({ orders, ownedProductIds }: Props) {
  const [tab, setTab] = useState<FilterTab>("All");

  const filtered = useMemo(() => {
    if (tab === "All")       return orders;
    if (tab === "Delivered") return orders.filter(o => o.status === "DELIVERED");
    if (tab === "Cancelled") return orders.filter(o => o.status === "FAILED");
    if (tab === "Expired")   return orders.filter(o => o.status === "LINK_EXPIRED");
    // Active = anything not terminal
    return orders.filter(o => o.status !== "DELIVERED" && o.status !== "FAILED" && o.status !== "LINK_EXPIRED");
  }, [orders, tab]);

  const tabCounts: Record<FilterTab, number> = {
    All:       orders.length,
    Active:    orders.filter(o => o.status !== "DELIVERED" && o.status !== "FAILED" && o.status !== "LINK_EXPIRED").length,
    Delivered: orders.filter(o => o.status === "DELIVERED").length,
    Cancelled: orders.filter(o => o.status === "FAILED").length,
    Expired:   orders.filter(o => o.status === "LINK_EXPIRED").length,
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
        {(["All", "Active", "Delivered", "Cancelled", "Expired"] as FilterTab[]).map(t => (
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
            <OrderCard
              key={order.id}
              order={order}
              isOwned={order.productId != null && ownedProductIds.includes(order.productId)}
            />
          ))}
        </div>
      )}
    </div>
  );
}