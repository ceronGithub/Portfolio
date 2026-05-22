// BundleCheckoutClient.tsx — Bundle checkout UI.
// Shows all selected assets, bundle discount breakdown, payment method,
// and place order CTA. Mirrors the style of CheckoutClient.

"use client";

import { useState } from "react";
import "./bundle-checkout.css";

type PaymentMethod = "gcash" | "card" | "bank";

interface BundleItem {
  id:       string;
  label:    string;
  category: string;
  price:    number;
}

interface Props {
  items:          BundleItem[];
  rawTotal:       number;
  discountRate:   number;
  discountAmount: number;
  finalTotal:     number;
}

// ── Format peso amount ────────────────────────────────────────────────────────
function fmt(p: number): string {
  return "₱" + p.toLocaleString("en-PH", { minimumFractionDigits: 0 });
}

// ── Discount badge label ──────────────────────────────────────────────────────
function discountLabel(rate: number): string {
  if (rate === 0.15) return "15% bundle discount";
  if (rate === 0.10) return "10% bundle discount";
  if (rate === 0.05) return "5% bundle discount";
  return "";
}

// ── Category icon map ─────────────────────────────────────────────────────────
function categoryIcon(category: string): string {
  if (category === "Character") return "🧟";
  if (category === "Weapon")    return "⚔️";
  if (category === "Interior")  return "🏠";
  if (category === "Exterior")  return "🏗️";
  return "📦";
}

export default function BundleCheckoutClient({
  items,
  rawTotal,
  discountRate,
  discountAmount,
  finalTotal,
}: Props) {
  const [method,  setMethod]  = useState<PaymentMethod>("gcash");
  const [placing, setPlacing] = useState(false);
  const [placed,  setPlaced]  = useState(false);

  // ── Simulate place order ──────────────────────────────────────────────────
  // Replace with actual POST /api/checkout/bundle when payment gateway is ready
  function handlePlaceOrder() {
    if (placing || placed) return;
    setPlacing(true);
    setTimeout(() => {
      setPlacing(false);
      setPlaced(true);
    }, 1800);
  }

  // ── Success state ─────────────────────────────────────────────────────────
  if (placed) {
    return (
      <div className="bundlePage">
        <div className="bundleSuccess">
          <div className="bundleSuccessIcon">✓</div>
          <h2 className="bundleSuccessTitle">Order Placed!</h2>
          <p className="bundleSuccessDesc">
            Your bundle of <strong>{items.length} asset{items.length > 1 ? "s" : ""}</strong> has been received.
            You'll be contacted shortly with download instructions.
          </p>
          <a href="/buyer" className="bundleSuccessBtn">Back to Shop →</a>
        </div>
      </div>
    );
  }

  return (
    <div className="bundlePage">
      <div className="bundleWrap">

        {/* ── Left — Order summary ── */}
        <div className="bundleLeft">
          <p className="bundleEyebrow">Bundle Order Summary</p>

          {/* Asset list */}
          <div className="bundleItemList">
            {items.map(item => (
              <div key={item.id} className="bundleItemRow">
                <div className="bundleItemIcon">{categoryIcon(item.category)}</div>
                <div className="bundleItemInfo">
                  <p className="bundleItemLabel">{item.label}</p>
                  <p className="bundleItemCategory">{item.category}</p>
                </div>
                <p className="bundleItemPrice">{fmt(item.price)}</p>
              </div>
            ))}
          </div>

          {/* Price breakdown */}
          <div className="bundleBreakdown">
            <div className="bundleBreakdownRow">
              <span>{items.length} item{items.length > 1 ? "s" : ""}</span>
              <span>{fmt(rawTotal)}</span>
            </div>

            {discountRate > 0 && (
              <>
                <div className="bundleBreakdownDivider" />
                <div className="bundleBreakdownRow bundleBreakdownDiscount">
                  <span>
                    {discountLabel(discountRate)}{" "}
                    <span className="bundleBreakdownPct">({Math.round(discountRate * 100)}% off)</span>
                  </span>
                  <span>− {fmt(discountAmount)}</span>
                </div>
              </>
            )}

            <div className="bundleBreakdownDivider" />
            <div className="bundleBreakdownRow bundleBreakdownTotal">
              <span>Total</span>
              <span className="bundleBreakdownTotalAmt">{fmt(finalTotal)}</span>
            </div>
          </div>

          {/* Terms */}
          <div className="bundleTerms">
            <p>✓ One-time payment — no subscriptions</p>
            <p>✓ Lifetime access to all purchased assets</p>
            <p>✓ OBJ / FBX files with 4K PBR textures</p>
          </div>
        </div>

        {/* ── Right — Payment method + CTA ── */}
        <div className="bundleRight">
          <p className="bundleEyebrow">Payment Method</p>
          <p className="bundlePayNote">
            Select your preferred payment channel for the full amount of{" "}
            <strong>{fmt(finalTotal)}</strong>.
          </p>

          {/* Method options */}
          <div className="bundleMethods">

            <button
              className={`bundleMethod ${method === "gcash" ? "bundleMethodActive" : ""}`}
              onClick={() => setMethod("gcash")}
            >
              <div className="bundleMethodIcon bundleMethodGcash">G</div>
              <div className="bundleMethodInfo">
                <p className="bundleMethodName">GCash</p>
                <p className="bundleMethodDesc">Instant · 0% fee</p>
              </div>
              <div className={`bundleMethodRadio ${method === "gcash" ? "bundleMethodRadioActive" : ""}`} />
            </button>

            <button
              className={`bundleMethod ${method === "card" ? "bundleMethodActive" : ""}`}
              onClick={() => setMethod("card")}
            >
              <div className="bundleMethodIcon bundleMethodCard">💳</div>
              <div className="bundleMethodInfo">
                <p className="bundleMethodName">Credit / Debit Card</p>
                <p className="bundleMethodDesc">Visa, Mastercard · 2.5% fee</p>
              </div>
              <div className={`bundleMethodRadio ${method === "card" ? "bundleMethodRadioActive" : ""}`} />
            </button>

            <button
              className={`bundleMethod ${method === "bank" ? "bundleMethodActive" : ""}`}
              onClick={() => setMethod("bank")}
            >
              <div className="bundleMethodIcon bundleMethodBank">🏦</div>
              <div className="bundleMethodInfo">
                <p className="bundleMethodName">Bank Transfer</p>
                <p className="bundleMethodDesc">BPI / BDO · 1–2 business days</p>
              </div>
              <div className={`bundleMethodRadio ${method === "bank" ? "bundleMethodRadioActive" : ""}`} />
            </button>

          </div>

          {/* Total due */}
          <div className="bundleDueRow">
            <span className="bundleDueLabel">Total due</span>
            <span className="bundleDueAmount">{fmt(finalTotal)}</span>
          </div>

          {/* CTA */}
          <button
            className={`bundlePlaceBtn ${placing ? "bundlePlaceBtnLoading" : ""}`}
            onClick={handlePlaceOrder}
            disabled={placing}
          >
            {placing ? (
              <><span className="bundleBtnSpinner" /> Processing…</>
            ) : (
              <>Place Order — {fmt(finalTotal)}</>
            )}
          </button>

          <p className="bundleDisclaimer">
            Asset files will be delivered to your registered email upon payment confirmation.
          </p>
        </div>

      </div>
    </div>
  );
}
