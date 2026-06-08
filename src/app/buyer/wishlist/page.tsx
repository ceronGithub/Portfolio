// buyer/wishlist/page.tsx — Standalone wishlist page.
// Renders all wishlisted items in a full-page grid layout.
// Uses the same useWishlist hook and localStorage persistence as the drawer.
// Wired to checkout — each card has a "Buy Now" link and a remove button.
"use client";

import { useMemo }        from "react";
import Link               from "next/link";
import { useWishlist }    from "./useWishlist";
import "./wishlist-page.css";

// ── Accent palette — mirrors BuyerDashboardClient static map ─────────
const CATEGORY_ACCENT: Record<string, string> = {
  character: "#c9a96e",
  weapon:    "#e07b54",
  interior:  "#7ec8e3",
  exterior:  "#a8d8a8",
  system:    "#b794f4",
};

// ── Standalone page ───────────────────────────────────────────────────
export default function WishlistPage() {
  const { wishlistIds, toggleWishlist, clearWishlist, hydrated } = useWishlist();

  // Convert Set to array for rendering — order preserved by insertion
  const ids = useMemo(() => [...wishlistIds], [wishlistIds]);

  // Parse id prefix to determine category and build checkout href
  function resolveEntry(id: string): {
    category: string; accent: string; checkoutHref: string;
  } {
    const lower = id.toLowerCase();
    if (lower.startsWith("sys_") || lower.includes("system")) {
      return { category: "System", accent: CATEGORY_ACCENT.system, checkoutHref: `/checkout/${id}` };
    }
    // Single product checkout — use bundle URL so tier picker shows
    return {
      category: "Asset",
      accent:   CATEGORY_ACCENT.character,
      checkoutHref: `/checkout/bundle?ids=${id}`,
    };
  }

  return (
    <div className="wlPage">

      {/* ── Header ── */}
      <div className="wlPageHeader">
        <div className="wlPageHeaderLeft">
          <Link href="/buyer" className="wlPageBackLink">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
            Back to Dashboard
          </Link>
          <div className="wlPageTitleRow">
            <h1 className="wlPageTitle">Wishlist</h1>
            {hydrated && ids.length > 0 && (
              <span className="wlPageCount">{ids.length}</span>
            )}
          </div>
          <p className="wlPageSub">Your saved assets and systems, ready to purchase.</p>
        </div>
        {hydrated && ids.length > 0 && (
          <button className="wlPageClearBtn" onClick={clearWishlist}>
            Clear all
          </button>
        )}
      </div>

      {/* ── Loading skeleton ── */}
      {!hydrated && (
        <div className="wlPageGrid">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="wlPageSkeleton" />
          ))}
        </div>
      )}

      {/* ── Empty state ── */}
      {hydrated && ids.length === 0 && (
        <div className="wlPageEmpty">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
          <p className="wlPageEmptyTitle">Your wishlist is empty</p>
          <p className="wlPageEmptySub">Heart any asset or system to save it here.</p>
          <Link href="/buyer" className="wlPageEmptyBtn">Browse Assets →</Link>
        </div>
      )}

      {/* ── Wishlist grid ── */}
      {hydrated && ids.length > 0 && (
        <div className="wlPageGrid">
          {ids.map(id => {
            const { category, accent, checkoutHref } = resolveEntry(id);
            return (
              <div key={id} className="wlPageCard">
                {/* Placeholder thumbnail */}
                <div className="wlPageCardThumb" style={{ borderColor: accent + "33" }}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth="1.3" opacity="0.5">
                    <rect x="3" y="3" width="18" height="18" rx="3"/>
                    <circle cx="8.5" cy="8.5" r="1.5"/>
                    <polyline points="21 15 16 10 5 21"/>
                  </svg>
                </div>

                <div className="wlPageCardBody">
                  <span className="wlPageCardCategory" style={{ color: accent }}>{category}</span>
                  <p className="wlPageCardId">{id}</p>
                </div>

                <div className="wlPageCardActions">
                  <a href={checkoutHref} className="wlPageBuyBtn" style={{ background: accent, color: "#0d0d0d" }} target="_blank" rel="noopener noreferrer">
                    Buy Now
                  </a>
                  <button
                    className="wlPageRemoveBtn"
                    onClick={() => toggleWishlist(id)}
                    title="Remove from wishlist"
                  >
                    <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <line x1="1" y1="1" x2="13" y2="13"/><line x1="13" y1="1" x2="1" y2="13"/>
                    </svg>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}