// CheckoutClient.tsx — Checkout page UI.
// Shows product summary, full price payment breakdown,
// payment method selector (GCash / Credit Card / Bank Transfer).
// On Place Order: calls API → gets PayMongo checkoutUrl → redirects buyer.

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import "./checkout.css";

type PaymentMethod = "gcash" | "card" | "bank";

interface Props {
  checkoutProductId: string;
  productName:  string;
  price:        number;
  description:  string;
  timeline:     string;
  grantedTier?: string;  // tier buyer selected on the product page
}

function fmt(p: number) {
  return "₱" + p.toLocaleString("en-PH", { minimumFractionDigits: 0 });
}

export default function CheckoutClient({
  checkoutProductId,
  productName,
  price,
  description,
  timeline,
  grantedTier = "mesh_only",
}: Props) {
  const router = useRouter();
  const [method,  setMethod]  = useState<PaymentMethod>("gcash");
  const [placing, setPlacing] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  // ── Price breakdown ──────────────────────────────────────────────────────
  // Full price is charged upfront — no DP split.

  // ── Place order → get PayMongo URL → redirect ────────────────────────────
  async function handlePlaceOrder() {
    if (placing) return;
    setPlacing(true);
    setError(null);

    try {
      const res = await fetch(`/api/checkout/${checkoutProductId}`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ method, total: price, grantedTier }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Order failed");
      }

      const { checkoutUrl } = await res.json();
      // Open PayMongo hosted payment page in a new tab
      window.open(checkoutUrl, "_blank", "noopener,noreferrer");
    } catch (err: any) {
      console.error("[CheckoutClient]", err?.message);
      setError(err?.message ?? "Something went wrong. Please try again.");
      setPlacing(false);
    }
  }

  return (
    <div className="checkoutPage">
      <div className="checkoutWrap">

        {/* ── Left — Product summary ── */}
        <div className="checkoutLeft">
          <p className="checkoutEyebrow">Order Summary</p>

          <div className="checkoutProduct">
            <div className="checkoutProductIcon">🖥️</div>
            <div className="checkoutProductInfo">
              <p className="checkoutProductName">{productName}</p>
              {description && (
                <p className="checkoutProductDesc">{description}</p>
              )}
              {timeline && (
                <p className="checkoutProductTimeline">⏱ {timeline} delivery</p>
              )}
            </div>
          </div>

          {/* Price breakdown */}
          <div className="checkoutBreakdown">
            <div className="checkoutBreakdownRow">
              <span>Base price</span>
              <span>{fmt(price)}</span>
            </div>
            <div className="checkoutBreakdownDivider" />
            <div className="checkoutBreakdownRow checkoutBreakdownDown">
              <span>Total due</span>
              <span className="checkoutBreakdownDownAmt">{fmt(price)}</span>
            </div>
          </div>

          {/* Terms */}
          <div className="checkoutTerms">
            <p>✓ One-time payment — no subscriptions</p>
            <p>✓ Full source code transferred on delivery</p>
            <p>✓ Free revisions during testing phase</p>
          </div>
        </div>

        {/* ── Right — Payment method + CTA ── */}
        <div className="checkoutRight">
          <p className="checkoutEyebrow">Payment Method</p>
          <p className="checkoutPayNote">
            Select your preferred payment channel for the{" "}
            <strong>{fmt(price)}</strong> total.
          </p>

          {/* Method options */}
          <div className="checkoutMethods">

            <button
              className={`checkoutMethod ${method === "gcash" ? "checkoutMethodActive" : ""}`}
              onClick={() => setMethod("gcash")}
            >
              <div className="checkoutMethodIcon checkoutMethodGcash">G</div>
              <div className="checkoutMethodInfo">
                <p className="checkoutMethodName">GCash</p>
                <p className="checkoutMethodDesc">Instant · 0% fee</p>
              </div>
              <div className={`checkoutMethodRadio ${method === "gcash" ? "checkoutMethodRadioActive" : ""}`} />
            </button>

            <button
              className={`checkoutMethod ${method === "card" ? "checkoutMethodActive" : ""}`}
              onClick={() => setMethod("card")}
            >
              <div className="checkoutMethodIcon checkoutMethodCard">💳</div>
              <div className="checkoutMethodInfo">
                <p className="checkoutMethodName">Credit / Debit Card</p>
                <p className="checkoutMethodDesc">Visa, Mastercard · 2.5% fee</p>
              </div>
              <div className={`checkoutMethodRadio ${method === "card" ? "checkoutMethodRadioActive" : ""}`} />
            </button>

            <button
              className={`checkoutMethod ${method === "bank" ? "checkoutMethodActive" : ""}`}
              onClick={() => setMethod("bank")}
            >
              <div className="checkoutMethodIcon checkoutMethodBank">🏦</div>
              <div className="checkoutMethodInfo">
                <p className="checkoutMethodName">Bank Transfer</p>
                <p className="checkoutMethodDesc">BPI / BDO · 1–2 business days</p>
              </div>
              <div className={`checkoutMethodRadio ${method === "bank" ? "checkoutMethodRadioActive" : ""}`} />
            </button>

          </div>

          {/* Total due */}
          <div className="checkoutDueRow">
            <span className="checkoutDueLabel">Due now</span>
            <span className="checkoutDueAmount">{fmt(price)}</span>
          </div>

          {/* Error */}
          {error && (
            <p className="checkoutError">{error}</p>
          )}

          {/* CTA */}
          <button
            className={`checkoutPlaceBtn ${placing ? "checkoutPlaceBtnLoading" : ""}`}
            onClick={handlePlaceOrder}
            disabled={placing}
          >
            {placing ? (
              <><span className="checkoutBtnSpinner" /> Redirecting to PayMongo…</>
            ) : (
              <>Pay {fmt(price)} via {method === "gcash" ? "GCash" : method === "card" ? "Card" : "Bank Transfer"}</>
            )}
          </button>

          <p className="checkoutDisclaimer">
            One-time full payment. Access is granted immediately after payment confirmation.
          </p>
        </div>

      </div>
    </div>
  );
}