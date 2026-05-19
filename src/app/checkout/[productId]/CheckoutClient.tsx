// CheckoutClient.tsx — Checkout page UI.
// Shows product summary, price breakdown (downpayment 30% + remainder),
// payment method selector (GCash / Credit Card / Bank Transfer),
// and a place order CTA. No payment gateway — UI only.

"use client";

import { useState } from "react";
import "./checkout.css";

type PaymentMethod = "gcash" | "card" | "bank";

interface Props {
  checkoutProductId: string;
  productName: string;
  price:       number;
  description: string;
  timeline:    string;
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
}: Props) {
  const [method,   setMethod]   = useState<PaymentMethod>("gcash");
  const [placing,  setPlacing]  = useState(false);
  const [placed,   setPlaced]   = useState(false);

  // ── Price breakdown ──────────────────────────────────────────────────────
  const downpayment = Math.round(price * 0.30);
  const remainder   = price - downpayment;

  // ── Simulate place order ─────────────────────────────────────────────────
  // Replace with actual POST /api/checkout/create when payment gateway is ready
  function handlePlaceOrder() {
    if (placing || placed) return;
    setPlacing(true);
    setTimeout(() => {
      setPlacing(false);
      setPlaced(true);
    }, 1800);
  }

  // ── Success state ────────────────────────────────────────────────────────
  if (placed) {
    return (
      <div className="checkoutPage">
        <div className="checkoutSuccess">
          <div className="checkoutSuccessIcon">✓</div>
          <h2 className="checkoutSuccessTitle">Order Placed!</h2>
          <p className="checkoutSuccessDesc">
            Your inquiry for <strong>{productName}</strong> has been received.
            You'll be contacted within 24 hours with downpayment instructions.
          </p>
          <a href="/buyer/orders" className="checkoutSuccessBtn">
            View Order Status →
          </a>
        </div>
      </div>
    );
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
              <span>
                Downpayment <span className="checkoutBreakdownPct">(30%)</span>
              </span>
              <span className="checkoutBreakdownDownAmt">{fmt(downpayment)}</span>
            </div>
            <div className="checkoutBreakdownRow checkoutBreakdownRem">
              <span>
                Remainder <span className="checkoutBreakdownPct">(due on delivery)</span>
              </span>
              <span>{fmt(remainder)}</span>
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
            <strong>{fmt(downpayment)}</strong> downpayment.
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
            <span className="checkoutDueAmount">{fmt(downpayment)}</span>
          </div>

          {/* CTA */}
          <button
            className={`checkoutPlaceBtn ${placing ? "checkoutPlaceBtnLoading" : ""}`}
            onClick={handlePlaceOrder}
            disabled={placing}
          >
            {placing ? (
              <><span className="checkoutBtnSpinner" /> Processing…</>
            ) : (
              <>Place Order — {fmt(downpayment)}</>
            )}
          </button>

          <p className="checkoutDisclaimer">
            By placing this order you agree to the 30/70 payment terms.
            Remainder is due upon project delivery.
          </p>
        </div>

      </div>
    </div>
  );
}