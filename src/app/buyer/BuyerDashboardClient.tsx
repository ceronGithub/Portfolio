// BuyerDashboardClient.tsx — Client wrapper for the entire buyer dashboard.
// Owns wishlist state (useWishlist hook). Passes wishlistIds + toggleWishlist
// down to AssetBuySection and ArchitectureBuySection.
// Renders the floating wishlist button and WishlistPanel drawer.
// All data (items, ownedIds) comes from the Server Component via props.

"use client";

import { useState, useCallback, useMemo } from "react";
import { useWishlist }           from "./wishlist/useWishlist";
import WishlistPanel             from "./wishlist/WishlistPanel";
import SystemsClient             from "./system/SystemsClient";
import AISection                 from "./ai/AISection";
import InquirySection            from "./inquiries/InquirySection";
import AIAssetsIntro             from "./ai-assets/AIAssetsIntro";
import NewAssetSection           from "./ai-assets/NewAssetSection";
import AssetBuySection           from "./ai-assets/AssetBuySection";
import ArchitectureAssetsIntro   from "./architecture-assets/ArchitectureAssetsIntro";
import NewArchitectureSection    from "./architecture-assets/NewArchitectureSection";
import ArchitectureBuySection    from "./architecture-assets/ArchitectureBuySection";
import "./wishlist/wishlist-panel.css";
import "./buyer-dashboard-client.css";

/* ─── Types ─────────────────────────────────────────────────────────── */
interface AddonItem {
  id: string; label: string; desc: string;
  price: number; category: string; weeks: number;
}

interface SystemItem {
  id: string; name: string; tag: string; accent: string;
  description: string; basePrice: number; timeline: string;
  demoVideoUrl: string | null; bgVideoUrl: string | null;
  owned: boolean; addons: AddonItem[];
}

interface Props {
  items:        SystemItem[];
  ownedAssetIds: string[];   // asset/product IDs the buyer already owns
}

// ── Static asset metadata map for wishlist panel display ─────────────────────
// Populated from ALL_ASSETS + ALL_ARCH_ASSETS in the buy sections.
// Kept here to avoid re-importing the full asset arrays; extend as content grows.
const ASSET_META: Record<string, { name: string; category: string; price: string; accent: string }> = {
  // Characters
  "orc-01": { name: "Orc 01 — Warrior",     category: "Character", price: "₱5,500",  accent: "#22c55e" },
  "orc-02": { name: "Orc 02 — Fighter",      category: "Character", price: "₱5,500",  accent: "#22c55e" },
  "orc-03": { name: "Orc 03 — Red Skin",     category: "Character", price: "₱5,500",  accent: "#22c55e" },
  "orc-04": { name: "Orc 04 — Armored",      category: "Character", price: "₱5,500",  accent: "#22c55e" },
  "orc-05": { name: "Orc 05 — Shaman",       category: "Character", price: "₱5,500",  accent: "#22c55e" },
  "orc-06": { name: "Orc 06 — Berserker",    category: "Character", price: "₱5,500",  accent: "#22c55e" },
  "orc-07": { name: "Orc 07 — Heavy",        category: "Character", price: "₱5,500",  accent: "#22c55e" },
  "orc-08": { name: "Orc 08 — Scout",        category: "Character", price: "₱5,500",  accent: "#22c55e" },
  "orc-09": { name: "Orc 09 — Elite",        category: "Character", price: "₱5,500",  accent: "#22c55e" },
  "orc-11": { name: "Orc 11 — Warlord",      category: "Character", price: "₱5,500",  accent: "#22c55e" },
  // Weapons
  "axe-01": { name: "Axe 01 — Battle Axe",   category: "Weapon",    price: "₱3,500",  accent: "#c9935e" },
  "axe-02": { name: "Axe 02 — War Axe",       category: "Weapon",    price: "₱3,500",  accent: "#c9935e" },
  "axe-03": { name: "Axe 03 — Runic Axe",     category: "Weapon",    price: "₱3,500",  accent: "#c9935e" },
  "axe-04": { name: "Axe 04 — Viking Axe",    category: "Weapon",    price: "₱3,500",  accent: "#c9935e" },
  "axe-05": { name: "Axe 05 — Ornate Axe",    category: "Weapon",    price: "₱3,500",  accent: "#c9935e" },
  "axe-07": { name: "Axe 07 — Bloodied Axe",  category: "Weapon",    price: "₱3,500",  accent: "#c9935e" },
};

// ── Build wishlist entries for the panel ─────────────────────────────────────
function buildWishlistEntries(
  wishlistIds: Set<string>,
  systemItems: SystemItem[]
): {
  id: string; name: string; category: string;
  price: string; accent: string; checkoutHref: string;
}[] {
  const entries: ReturnType<typeof buildWishlistEntries> = [];

  for (const id of wishlistIds) {
    // Check if it's a system
    const sys = systemItems.find(s => s.id === id);
    if (sys) {
      entries.push({
        id,
        name:         sys.name,
        category:     "System",
        price:        "₱" + sys.basePrice.toLocaleString("en-PH"),
        accent:       sys.accent,
        checkoutHref: `/checkout/${sys.id}`,
      });
      continue;
    }
    // Check if it's an asset
    const meta = ASSET_META[id];
    if (meta) {
      entries.push({
        id,
        name:         meta.name,
        category:     meta.category,
        price:        meta.price,
        accent:       meta.accent,
        checkoutHref: `/checkout/asset/${id}`,
      });
    }
  }

  return entries;
}

export default function BuyerDashboardClient({ items, ownedAssetIds }: Props) {
  const { wishlistIds, toggleWishlist, clearWishlist } = useWishlist();
  const [wishlistOpen, setWishlistOpen] = useState(false);

  const ownedSet = useMemo(() => new Set(ownedAssetIds), [ownedAssetIds]);

  const handleRemoveFromWishlist = useCallback((id: string) => {
    toggleWishlist(id);
  }, [toggleWishlist]);

  const wishlistEntries = useMemo(
    () => buildWishlistEntries(wishlistIds, items),
    [wishlistIds, items]
  );

  return (
    <>
      {/* ── Floating Wishlist Button ── */}
      <button
        className="buyerWishlistFloatBtn"
        onClick={() => setWishlistOpen(true)}
        aria-label="Open wishlist"
        title="Your wishlist"
      >
        {/* Heart SVG */}
        <svg
          width="18" height="18" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
        >
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
        </svg>

        {/* Count badge */}
        {wishlistIds.size > 0 && (
          <span className="buyerWishlistFloatCount">{wishlistIds.size}</span>
        )}
      </button>

      {/* ── Wishlist Drawer ── */}
      <WishlistPanel
        isOpen={wishlistOpen}
        onClose={() => setWishlistOpen(false)}
        entries={wishlistEntries}
        onRemove={handleRemoveFromWishlist}
        onClearAll={clearWishlist}
      />

      {/* ── Dashboard Sections ── */}
      <SystemsClient
        items={items}
        wishlistIds={wishlistIds}
        onToggleWishlist={toggleWishlist}
      />
      <AISection />

      {/* Character & Weapon Studio */}
      <AIAssetsIntro />
      <NewAssetSection />
      <AssetBuySection
        ownedAssetIds={ownedSet}
        wishlistIds={wishlistIds}
        onAddToWishlist={toggleWishlist}
      />

      {/* Architecture Studio */}
      <ArchitectureAssetsIntro />
      <NewArchitectureSection />
      <ArchitectureBuySection
        ownedAssetIds={ownedSet}
        wishlistIds={wishlistIds}
        onAddToWishlist={toggleWishlist}
      />

      <InquirySection />
    </>
  );
}