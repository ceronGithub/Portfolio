"use client";
// WishlistPanel.tsx — Slide-out wishlist drawer.
// Add to cart: fires onAddAllToCart callback (wired to AssetBuySection/ArchBuySection).
// Buy now: opens a compact inline confirm modal — no page navigation.

import { useEffect, useState } from "react";
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

// ── Buy Now Modal — shown inline instead of navigating away ──────────────
function BuyNowModal({
  entry,
  onClose,
}: {
  entry: WishlistEntry;
  onClose: () => void;
}) {
  return (
    <div className="wlBuyModalOverlay" onClick={onClose}>
      <div className="wlBuyModal" onClick={e => e.stopPropagation()}>
        <div className="wlBuyModalHeader">
          <div>
            <p className="wlBuyModalCategory">{entry.category}</p>
            <h3 className="wlBuyModalName">{entry.name}</h3>
          </div>
          <button className="wlBuyModalClose" onClick={onClose} aria-label="Close">
            <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="1" y1="1" x2="13" y2="13"/><line x1="13" y1="1" x2="1" y2="13"/>
            </svg>
          </button>
        </div>

        <div className="wlBuyModalBody">
          <div className="wlBuyModalPriceRow">
            <span className="wlBuyModalPriceLabel">Price</span>
            <span className="wlBuyModalPrice" style={{ color: entry.accent }}>{entry.price}</span>
          </div>
          <div className="wlBuyModalPriceRow">
            <span className="wlBuyModalPriceLabel">Access</span>
            <span className="wlBuyModalPriceVal">Lifetime · OBJ + FBX</span>
          </div>
          <div className="wlBuyModalPriceRow">
            <span className="wlBuyModalPriceLabel">Delivery</span>
            <span className="wlBuyModalPriceVal">Instant download after payment</span>
          </div>
        </div>

        <div className="wlBuyModalFooter">
          <button className="wlBuyModalCancel" onClick={onClose}>Cancel</button>
          <a
            href={entry.checkoutHref}
            className="wlBuyModalConfirm"
            style={{ background: entry.accent }}
            target="_blank"
            rel="noopener noreferrer"
          >
            Confirm Purchase →
          </a>
        </div>
      </div>
    </div>
  );
}

export default function WishlistPanel({
  isOpen,
  onClose,
  entries,
  onRemove,
  onClearAll,
  onAddAllToCart,
}: Props) {
  const [buyEntry, setBuyEntry] = useState<WishlistEntry | null>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        if (buyEntry) setBuyEntry(null);
        else onClose();
      }
    }
    if (isOpen) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose, buyEntry]);

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
                    {/* Add to cart — fires callback, does NOT navigate */}
                    {onAddAllToCart && (
                      <button
                        className="wishlistCartBtn"
                        title="Add to cart"
                        onClick={() => onAddAllToCart([entry.id])}
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
                          <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
                        </svg>
                      </button>
                    )}
                    {/* Buy now — opens inline modal */}
                    <button
                      className="wishlistBuyBtn"
                      style={{ background: entry.accent, color: "#000" }}
                      onClick={() => setBuyEntry(entry)}
                    >
                      Buy
                    </button>
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
              {/* Buy now (first item) — opens modal, not new page */}
              <button
                className="wishlistBuyNowBtn"
                onClick={() => entries[0] && setBuyEntry(entries[0])}
              >
                Buy now →
              </button>
            </div>
            <div className="wishlistFooterMeta">
              <p className="wishlistFooterNote">{entries.length} item{entries.length !== 1 ? "s" : ""} saved</p>
              <button className="wishlistClearBtn" onClick={onClearAll}>Clear all</button>
            </div>
          </div>
        )}
      </aside>

      {/* Buy Now modal — rendered outside the drawer so it overlays everything */}
      {buyEntry && (
        <BuyNowModal entry={buyEntry} onClose={() => setBuyEntry(null)} />
      )}
    </>
  );
}