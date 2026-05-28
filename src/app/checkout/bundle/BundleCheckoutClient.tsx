// BundleCheckoutClient.tsx — Bundle checkout UI.
// Shows all selected assets (with real cuid product IDs), bundle discount breakdown,
// payment method, and place order CTA. Protocol Rule 17 compliant design.
// Each item.id is the real product cuid — ready for order creation API.

"use client";

import { useState, useEffect, useRef } from "react";
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

// ── SVG category icons — inline, consistent strokeWidth=1.6 ──────────────────
// No emoji allowed in UI chrome per Rule 17.3
function IconCharacter() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
    </svg>
  );
}

function IconWeapon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.5 2.5l7 7-14 14-3-1-1-3 14-14z" />
      <path d="M2 22l4-4" />
    </svg>
  );
}

function IconInterior() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z" />
      <path d="M9 21V12h6v9" />
    </svg>
  );
}

function IconExterior() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="7" width="20" height="14" rx="2" />
      <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
      <line x1="12" y1="12" x2="12" y2="16" />
      <line x1="10" y1="14" x2="14" y2="14" />
    </svg>
  );
}

function IconAsset() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="9" height="9" rx="2" />
      <rect x="13" y="3" width="9" height="9" rx="2" />
      <rect x="2" y="13" width="9" height="9" rx="2" />
      <rect x="13" y="13" width="9" height="9" rx="2" />
    </svg>
  );
}

// ── SVG payment icons — inline per Rule 17.3 ─────────────────────────────────
function IconGcash() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="5" width="20" height="14" rx="3" />
      <path d="M12 10v4M10 12h4" />
    </svg>
  );
}

function IconCard() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <line x1="2" y1="10" x2="22" y2="10" />
    </svg>
  );
}

function IconBank() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11M8 10v11M12 10v11M16 10v11M20 10v11" />
    </svg>
  );
}

// ── Map category string to icon component ────────────────────────────────────
function CategoryIcon({ category }: { category: string }) {
  if (category === "Character") return <IconCharacter />;
  if (category === "Weapon")    return <IconWeapon />;
  if (category === "Interior")  return <IconInterior />;
  if (category === "Exterior")  return <IconExterior />;
  return <IconAsset />;
}

// ── Category accent color — used for icon tint only ──────────────────────────
function categoryAccent(category: string): string {
  if (category === "Character") return "var(--accent-green)";
  if (category === "Weapon")    return "var(--accent-amber)";
  if (category === "Interior")  return "var(--accent-blue)";
  if (category === "Exterior")  return "var(--accent-purple)";
  return "rgba(255,255,255,0.4)";
}

// ── Entrance animation hook — IntersectionObserver per Rule 17.5 ─────────────
// Adds .isVisible class when element enters viewport
function useEntranceAnimation(ref: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) el.classList.add("isVisible"); },
      { threshold: 0.08 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [ref]);
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
  const [error,   setError]   = useState<string | null>(null);

  // Entrance animation refs per Rule 17.5
  const leftRef  = useRef<HTMLDivElement>(null);
  const rightRef = useRef<HTMLDivElement>(null);
  useEntranceAnimation(leftRef);
  useEntranceAnimation(rightRef);

  // ── Place order → get PayMongo URL → redirect ──────────────────────────
  async function handlePlaceOrder() {
    if (placing) return;
    setPlacing(true);
    setError(null);

    try {
      const res = await fetch("/api/checkout/bundle", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items:       items.map(item => ({ productId: item.id, price: item.price })),
          method,
          total:       finalTotal,
          grantedTier: "full_pack",   // bundle buyers always get full_pack
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Order failed");
      }

      const { checkoutUrl } = await res.json();
      window.location.href = checkoutUrl;
    } catch (err: any) {
      console.error("[BundleCheckout]", err?.message);
      setError(err?.message ?? "Something went wrong. Please try again.");
      setPlacing(false);
    }
  }

  // ── Success state — handled by /checkout/success page after PayMongo redirect ──

  return (
    <div className="bundlePage">
      <div className="bundleWrap">

        {/* ── Left — Order summary ── */}
        <div className="bundleLeft bundleEnter" ref={leftRef}>
          <p className="bundleEyebrow">Bundle Order Summary</p>

          {/* Asset list */}
          <div className="bundleItemList">
            {items.map(item => (
              <div key={item.id} className="bundleItemRow">
                <div
                  className="bundleItemIcon"
                  style={{ color: categoryAccent(item.category) }}
                >
                  <CategoryIcon category={item.category} />
                </div>
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
            <div className="bundleTermsItem">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              One-time payment — no subscriptions
            </div>
            <div className="bundleTermsItem">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              Lifetime access to all purchased assets
            </div>
            <div className="bundleTermsItem">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              OBJ / FBX files with 4K PBR textures
            </div>
          </div>
        </div>

        {/* ── Right — Payment method + CTA ── */}
        <div className="bundleRight bundleEnter bundleEnterDelay" ref={rightRef}>
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
              <div className="bundleMethodIcon bundleMethodGcash"><IconGcash /></div>
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
              <div className="bundleMethodIcon bundleMethodCard"><IconCard /></div>
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
              <div className="bundleMethodIcon bundleMethodBank"><IconBank /></div>
              <div className="bundleMethodInfo">
                <p className="bundleMethodName">Bank Transfer</p>
                <p className="bundleMethodDesc">BPI / BDO · 1–2 business days</p>
              </div>
              <div className={`bundleMethodRadio ${method === "bank" ? "bundleMethodRadioActive" : ""}`} />
            </button>

          </div>

          {/* Total due */}
          <div className="bundleDueRow">
            <span className="bundleDueLabel">Total Due</span>
            <span className="bundleDueAmount">{fmt(finalTotal)}</span>
          </div>

          {/* Error */}
          {error && (
            <p className="bundleError">{error}</p>
          )}

          {/* CTA */}
          <button
            className={`bundlePlaceBtn ${placing ? "bundlePlaceBtnLoading" : ""}`}
            onClick={handlePlaceOrder}
            disabled={placing}
          >
            {placing ? (
              <><span className="bundleBtnSpinner" /> Redirecting to PayMongo…</>
            ) : (
              <>Pay {fmt(finalTotal)} Now</>
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