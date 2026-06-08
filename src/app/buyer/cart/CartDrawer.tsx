"use client";
// CartDrawer.tsx — Unified cart slide-out drawer.
// Lists all items added across sections (character, weapon, architecture).
// Buy Bundle → /checkout/bundle?ids=...  Remove individual items. Clear all.

import { useEffect } from "react";
import "./cart-drawer.css";

// Same ASSET_META shape used in BuyerDashboardClient / WishlistPanel
interface CartEntry {
  id:       string;
  name:     string;
  category: string;
  price:    number;   // numeric for total calc
  priceStr: string;   // formatted display
  accent:   string;
}

interface Props {
  isOpen:   boolean;
  onClose:  () => void;
  entries:  CartEntry[];
  onRemove: (id: string) => void;
  onClear:  () => void;
}

function fmt(p: number) {
  return "₱" + p.toLocaleString("en-PH", { minimumFractionDigits: 0 });
}

export default function CartDrawer({ isOpen, onClose, entries, onRemove, onClear }: Props) {
  const total = entries.reduce((s, e) => s + e.price, 0);

  // Build bundle checkout URL — passes all IDs as query params
  const bundleHref = entries.length > 0
    ? `/checkout/bundle?ids=${entries.map(e => e.id).join(",")}`
    : "#";

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    if (isOpen) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  return (
    <>
      <div className={"cartBackdrop" + (isOpen ? " cartBackdropVisible" : "")} onClick={onClose} />

      <aside className={"cartDrawer" + (isOpen ? " cartDrawerOpen" : "")}>

        {/* Header */}
        <div className="cartDrawerHeader">
          <div>
            <p className="cartDrawerLabel">Your Cart</p>
            <h2 className="cartDrawerTitle">
              Bundle
              {entries.length > 0 && <span className="cartDrawerCount">{entries.length}</span>}
            </h2>
          </div>
          <button className="cartCloseBtn" onClick={onClose} aria-label="Close cart">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="1" y1="1" x2="13" y2="13"/><line x1="13" y1="1" x2="1" y2="13"/>
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="cartDrawerBody">
          {entries.length === 0 ? (
            <div className="cartEmpty">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" className="cartEmptyIcon">
                <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
              </svg>
              <p className="cartEmptyTitle">Your cart is empty</p>
              <p className="cartEmptySub">Add assets from any section to build a bundle.</p>
            </div>
          ) : (
            <div className="cartItemList">
              {entries.map(entry => (
                <div key={entry.id} className="cartItem">
                  <div className="cartItemAccent" style={{ background: entry.accent }} />
                  <div className="cartItemInfo">
                    <span className="cartItemCategory">{entry.category}</span>
                    <p className="cartItemName">{entry.name}</p>
                    <p className="cartItemPrice" style={{ color: entry.accent }}>{entry.priceStr}</p>
                  </div>
                  <button className="cartItemRemove" onClick={() => onRemove(entry.id)} aria-label="Remove">
                    <svg width="11" height="11" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <line x1="1" y1="1" x2="13" y2="13"/><line x1="13" y1="1" x2="1" y2="13"/>
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {entries.length > 0 && (
          <div className="cartDrawerFooter">
            {/* Discount hint */}
            {entries.length >= 2 && (
              <p className="cartDiscountHint">
                {entries.length >= 5 ? "15% bundle discount applied" :
                 entries.length >= 3 ? "10% bundle discount applied" :
                 "5% bundle discount applied"}
              </p>
            )}

            {/* Total row */}
            <div className="cartTotalRow">
              <span className="cartTotalLabel">Total</span>
              <span className="cartTotalVal">{fmt(total)}</span>
            </div>

            {/* CTAs */}
            <a href={bundleHref} className="cartCheckoutBtn" target="_blank" rel="noopener noreferrer" onClick={() => { onClose(); onClear(); }}>
              Checkout Bundle →
            </a>

            <div className="cartFooterMeta">
              <p className="cartFooterNote">{entries.length} item{entries.length !== 1 ? "s" : ""}</p>
              <button className="cartClearBtn" onClick={onClear}>Clear all</button>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}