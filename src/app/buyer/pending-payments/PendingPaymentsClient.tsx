// PendingPaymentsClient.tsx — Pending payments list with retry action.
// Shows orders waiting for payment with resume checkout link.

"use client";

import { useState, useEffect } from "react";
import "./pending-payments.css";
import { useToast }  from "@/app/buyer/shared/useToast";
import ToastStack    from "@/app/buyer/shared/ToastStack";

type CategoryType = "character" | "weapon" | "interior" | "exterior" | "system";

interface PendingOrder {
  id:              string;
  productName:     string;
  productCategory: CategoryType;
  amount:          number;
  paymongoOrderId: string | null;
  createdAt:       string;
}

interface Props {
  orders: PendingOrder[];
}

/**
 * Format peso amount with peso symbol and proper locale formatting
 */
function fmt(p: number): string {
  return "₱" + p.toLocaleString("en-PH", { minimumFractionDigits: 0 });
}

/**
 * Normalize category enum to display string
 */
function toDisplayCategory(cat: CategoryType): string {
  const map: Record<CategoryType, string> = {
    character: "Character",
    weapon:    "Weapon",
    interior:  "Interior",
    exterior:  "Exterior",
    system:    "System",
  };
  return map[cat] ?? cat;
}

/**
 * Get accent color for category
 */
function categoryAccent(cat: CategoryType): string {
  const map: Record<CategoryType, string> = {
    character: "var(--accent-green)",
    weapon:    "var(--accent-amber)",
    interior:  "var(--accent-blue)",
    exterior:  "var(--accent-purple)",
    system:    "var(--accent-orange)",
  };
  return map[cat] ?? "rgba(255,255,255,0.4)";
}

/**
 * Category icon component
 */
function CategoryIcon({ category }: { category: CategoryType }) {
  if (category === "character") {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="8" r="4" />
        <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
      </svg>
    );
  }
  if (category === "weapon") {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14.5 2.5l7 7-14 14-3-1-1-3 14-14z" />
        <path d="M2 22l4-4" />
      </svg>
    );
  }
  if (category === "interior") {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z" />
        <path d="M9 21V12h6v9" />
      </svg>
    );
  }
  if (category === "exterior") {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="7" width="20" height="14" rx="2" />
        <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
        <line x1="12" y1="12" x2="12" y2="16" />
        <line x1="10" y1="14" x2="14" y2="14" />
      </svg>
    );
  }
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="9" height="9" rx="2" />
      <rect x="13" y="3" width="9" height="9" rx="2" />
      <rect x="2" y="13" width="9" height="9" rx="2" />
      <rect x="13" y="13" width="9" height="9" rx="2" />
    </svg>
  );
}

/**
 * Format date to readable string
 */
function formatDate(isoStr: string): string {
  const date = new Date(isoStr);
  return date.toLocaleDateString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/**
 * Calculate days since order creation
 */
function daysSince(isoStr: string): number {
  const created = new Date(isoStr).getTime();
  const now = Date.now();
  return Math.floor((now - created) / (1000 * 60 * 60 * 24));
}

/**
 * Calculate hours elapsed since order creation
 */
function hoursSince(isoStr: string): number {
  const created = new Date(isoStr).getTime();
  const now = Date.now();
  return (now - created) / (1000 * 60 * 60);
}

/**
 * PayMongo payment links expire after 24 hours.
 * Returns true if the link is no longer usable.
 */
function isLinkExpired(isoStr: string): boolean {
  return hoursSince(isoStr) >= 24;
}

/**
 * Returns a human-readable label showing how much time is left on the payment link,
 * or a notice that it has expired.
 */
function linkAvailabilityLabel(isoStr: string): string {
  const elapsed = hoursSince(isoStr);
  if (elapsed >= 24) return "Payment link expired";
  const hoursLeft = Math.floor(24 - elapsed);
  const minutesLeft = Math.floor(((24 - elapsed) - hoursLeft) * 60);
  if (hoursLeft === 0) return `Link expires in ${minutesLeft}m`;
  if (minutesLeft === 0) return `Link expires in ${hoursLeft}h`;
  return `Link expires in ${hoursLeft}h ${minutesLeft}m`;
}

export default function PendingPaymentsClient({ orders = [] }: Props) {
  const { toasts, showToast, dismissToast } = useToast();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  // ── Auto-mark expired orders on mount ───────────────────────────────
  // For every order whose payment link has passed the 24h window, silently
  // call the expire endpoint so admin sees LINK_EXPIRED status immediately.
  useEffect(() => {
    orders.forEach(order => {
      if (isLinkExpired(order.createdAt)) {
        fetch("/api/buyer/pending-payment/expire", {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({ orderId: order.id }),
        }).catch(() => { /* silent — best-effort */ });
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Retry payment — fetch PayMongo link and redirect to checkout
   */
  async function handleRetryPayment(order: PendingOrder) {
    if (loadingId) return;
    setLoadingId(order.id);

    try {
      const res = await fetch(`/api/buyer/pending-payment/${order.id}`);

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Failed to retrieve payment link");
      }

      const { checkoutUrl } = await res.json();
      showToast("✓ Redirecting to payment page…", "success");
      window.open(checkoutUrl, "_blank", "noopener,noreferrer");
    } catch (err: any) {
      console.error("[PendingPayments] retry failed:", err);
      showToast(err?.message ?? "✕ Failed to retrieve payment link.", "error");
      setLoadingId(null);
    }
  }

  return (
    <div className="pendingPaymentsPage">
      <ToastStack toasts={toasts} onDismiss={dismissToast} />
      <div className="pendingPaymentsContainer">
        <div className="pendingPaymentsHeader">
          <h1 className="pendingPaymentsTitle">Pending Payments</h1>
          <p className="pendingPaymentsSubtitle">
            {orders.length === 0
              ? "You have no pending payments. All orders are settled!"
              : `You have ${orders.length} payment${orders.length !== 1 ? "s" : ""} waiting for completion.`}
          </p>
        </div>

        {orders.length === 0 ? (
          <div className="pendingPaymentsEmpty">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 1v22M17.5 5.5h.01M6.5 5.5h.01M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0z" />
            </svg>
            <p className="pendingPaymentsEmptyText">No pending payments</p>
          </div>
        ) : (
          <div className="pendingPaymentsList">
            {orders.map(order => {
              const days      = daysSince(order.createdAt);
              const isOverdue = days > 7;
              const expired   = isLinkExpired(order.createdAt);
              const linkLabel = linkAvailabilityLabel(order.createdAt);

              return (
                <div
                  key={order.id}
                  className={`pendingPaymentRow ${isOverdue ? "pendingPaymentRowOverdue" : ""} ${expired ? "pendingPaymentRowExpired" : ""}`}
                >
                  {/* Icon + Product Info */}
                  <div className="pendingPaymentLeft">
                    <div
                      className="pendingPaymentIcon"
                      style={{ color: categoryAccent(order.productCategory) }}
                    >
                      <CategoryIcon category={order.productCategory} />
                    </div>
                    <div className="pendingPaymentInfo">
                      <p className="pendingPaymentProductName">{order.productName}</p>
                      <p className="pendingPaymentCategory">
                        {toDisplayCategory(order.productCategory)}
                      </p>
                      <p className="pendingPaymentDate">
                        Order placed {formatDate(order.createdAt)} ({days} day{days !== 1 ? "s" : ""} ago)
                      </p>
                      <p className={`pendingPaymentLinkStatus ${expired ? "pendingPaymentLinkStatusExpired" : "pendingPaymentLinkStatusActive"}`}>
                        {linkLabel}
                      </p>
                    </div>
                  </div>

                  {/* Amount + Status + Action */}
                  <div className="pendingPaymentRight">
                    <div className="pendingPaymentAmount">
                      <p className="pendingPaymentAmountLabel">Amount Due</p>
                      <p className="pendingPaymentAmountValue">{fmt(order.amount)}</p>
                    </div>

                    {expired && (
                      <div className="pendingPaymentBadgeExpired">Link Expired</div>
                    )}

                    {!expired && isOverdue && (
                      <div className="pendingPaymentBadgeOverdue">7+ days</div>
                    )}

                    <button
                      className={`pendingPaymentRetryBtn ${expired ? "pendingPaymentRetryBtnExpired" : ""} ${loadingId === order.id ? "pendingPaymentRetryBtnLoading" : ""}`}
                      onClick={() => handleRetryPayment(order)}
                      disabled={loadingId !== null || expired}
                      title={expired ? "This payment link has expired. Please contact support." : undefined}
                    >
                      {expired
                        ? "Link Expired"
                        : loadingId === order.id
                        ? "Processing…"
                        : "Retry Payment"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}