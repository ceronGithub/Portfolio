"use client";
// WishlistPanel.tsx — Slide-out wishlist drawer for buyer dashboard.
// Shows wishlisted systems and assets with price, Add all to cart, and Buy now CTA.

import { useEffect }  from "react";
import Link           from "next/link";
import "./wishlist-panel.css";

interface WishlistEntry {
  id:           string;
  name:         string;
  category:     string;
  price:        string;
  accent:       string;
  checkoutHref: string;
}

interface Props {
  isOpen:          boolean;
  onClose:         () => void;
  entries:         WishlistEntry[];
  onRemove:        (id: string) => void;
  onClearAll:      () => void;
  onAddAllToCart?: (ids: string[]) => void;
}

export default function WishlistPanel({
  isOpen,
  onClose,
  entries,
  onRemove,
  onClearAll,
  onAddAllToCart,
}: Props) {

  // Close on Escape key
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    if (isOpen) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  return (
    <>
      {/* Backdrop */}
      <div
        className={"wishlistBackdrop" + (isOpen ? " wishlistBackdropVisible" : "")}
        onClick={onClose}
      />

      {/* Drawer */}
      <aside className={"wishlistDrawer" + (isOpen ? " wishlistDrawerOpen" : "")}>

        {/* Header */}
        <div className="wishlistDrawerHeader">
          <div>
            <p className="wishlistDrawerLabel">Saved Items</p>
            <h2 className="wishlistDrawerTitle">
              Wishlist
              {entries.length > 0 && (
                <span className="wishlistDrawerCount">{entries.length}</span>
              )}
            </h2>
          </div>
          <button className="wishlistCloseBtn" onClick={onClose} aria-label="Close wishlist">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="1" y1="1" x2="13" y2="13" />
              <line x1="13" y1="1" x2="1" y2="13" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="wishlistDrawerBody">
          {entries.length === 0 ? (
            <div className="wishlistEmpty">
              <span className="wishlistEmptyIcon">♡</span>
              <p className="wishlistEmptyTitle">Nothing saved yet</p>
              <p className="wishlistEmptySub">Hit the ♡ on any system or asset to save it here.</p>
            </div>
          ) : (
            <div className="wishlistItemList">
              {entries.map(entry => (
                <div key={entry.id} className="wishlistItem">
                  <div className="wishlistItemAccent" style={{ background: entry.accent }} />
                  <div className="wishlistItemInfo">
                    <span className="wishlistItemCategory">{entry.category}</span>
                    <p className="wishlistItemName">{entry.name}</p>
                    <p className="wishlistItemPrice" style={{ color: entry.accent }}>{entry.price}</p>
                  </div>
                  <div className="wishlistItemActions">
                    <Link
                      href={entry.checkoutHref}
                      className="wishlistBuyBtn"
                      style={{ background: entry.accent }}
                      onClick={onClose}
                    >
                      Buy
                    </Link>
                    <button
                      className="wishlistRemoveBtn"
                      onClick={() => onRemove(entry.id)}
                      aria-label={`Remove ${entry.name} from wishlist`}
                    >
                      <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <line x1="1" y1="1" x2="13" y2="13" />
                        <line x1="13" y1="1" x2="1" y2="13" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {entries.length > 0 && (
          <div className="wishlistDrawerFooter">
            <div className="wishlistFooterActions">
              {onAddAllToCart && (
                <button
                  className="wishlistAddAllBtn"
                  onClick={() => { onAddAllToCart(entries.map(e => e.id)); onClose(); }}
                >
                  Add all to cart
                </button>
              )}
              <Link
                href={entries[0]?.checkoutHref ?? "#"}
                className="wishlistBuyNowBtn"
                onClick={onClose}
              >
                Buy now →
              </Link>
            </div>
            <div className="wishlistFooterMeta">
              <p className="wishlistFooterNote">{entries.length} item{entries.length !== 1 ? "s" : ""} saved</p>
              <button className="wishlistClearBtn" onClick={onClearAll}>Clear all</button>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}