// BuyerDashboardClient.tsx — Client wrapper for the entire buyer dashboard.
// Owns wishlist state (useWishlist hook). Passes wishlistIds + toggleWishlist
// down to AssetBuySection.
// Renders the floating wishlist button and WishlistPanel drawer.
// All data (items, ownedIds) comes from the Server Component via props.
// Architecture Studio sections included below AssetCompareTool.

"use client";

import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { useWishlist }           from "./wishlist/useWishlist";
import { useCart }               from "./cart/useCart";
import WishlistPanel             from "./wishlist/WishlistPanel";
import CartDrawer                from "./cart/CartDrawer";
import SystemsClient             from "./system/SystemsClient";
import SystemsInfoSections       from "./system/SystemsInfoSections";
import AISection                 from "./ai/AISection";
import InquirySection            from "./inquiries/InquirySection";
import AIAssetsIntro             from "./ai-weapon-character/AIAssetsIntro";
import NewAssetSection           from "./ai-weapon-character/NewAssetSection";
import AssetBuySection           from "./ai-weapon-character/AssetBuySection";
import RecentlyViewedRow         from "./ai-weapon-character/RecentlyViewedRow";
import { useRecentlyViewed }     from "./ai-weapon-character/useRecentlyViewed";
import AssetCompareTool          from "./ai-assets/AssetCompareTool";
import ArchitectureAssetsIntro   from "./architecture-assets/ArchitectureAssetsIntro";
import NewArchitectureSection    from "./architecture-assets/NewArchitectureSection";
import ArchitectureBuySection    from "./architecture-assets/ArchitectureBuySection";
import ReviewSection             from "./reviews/ReviewSection";
import CustomRequestBuilder      from "./custom-request/CustomRequestBuilder";
import "./wishlist/wishlist-panel.css";
import "./cart/cart-drawer.css";
import "./buyer-dashboard-client.css";

/* ─── Types ─────────────────────────────────────────────────────────── */
interface AddonItem {
  id: string; label: string; desc: string;
  price: number; category: string; weeks: number;
}

interface SystemItem {
  id: string; name: string; tag: string; accent: string;
  description: string; basePrice: number; timeline: string;
  features: string[];
  demoVideoUrl: string | null; bgVideoUrl: string | null;
  owned: boolean; addons: AddonItem[];
}

interface Props {
  items:         SystemItem[];
  ownedAssetIds: string[];
  ownedProducts: { id: string; name: string }[];
}

// ── Static asset metadata map for wishlist panel display ─────────────────────
// Populated from ALL_ASSETS + ALL_ARCH_ASSETS in the buy sections.
// Kept here to avoid re-importing the full asset arrays; extend as content grows.
const ASSET_META: Record<string, { name: string; category: string; price: string; accent: string }> = {
  // Characters
  "orc-01": { name: "Orc 01 — Warrior",     category: "Character", price: "₱5,500", accent: "#22c55e" },
  "orc-02": { name: "Orc 02 — Fighter",      category: "Character", price: "₱5,500", accent: "#22c55e" },
  "orc-03": { name: "Orc 03 — Red Skin",     category: "Character", price: "₱5,500", accent: "#22c55e" },
  "orc-04": { name: "Orc 04 — Armored",      category: "Character", price: "₱5,500", accent: "#22c55e" },
  "orc-05": { name: "Orc 05 — Shaman",       category: "Character", price: "₱5,500", accent: "#22c55e" },
  "orc-06": { name: "Orc 06 — Berserker",    category: "Character", price: "₱5,500", accent: "#22c55e" },
  "orc-07": { name: "Orc 07 — Heavy",        category: "Character", price: "₱5,500", accent: "#22c55e" },
  "orc-08": { name: "Orc 08 — Scout",        category: "Character", price: "₱5,500", accent: "#22c55e" },
  "orc-09": { name: "Orc 09 — Elite",        category: "Character", price: "₱5,500", accent: "#22c55e" },
  "orc-10": { name: "Orc 10 — Destroyer",    category: "Character", price: "₱5,500", accent: "#22c55e" },
  "orc-11": { name: "Orc 11 — Warlord",      category: "Character", price: "₱5,500", accent: "#22c55e" },
  "orc-12": { name: "Orc 12",                category: "Character", price: "₱5,500", accent: "#22c55e" },
  "orc-13": { name: "Orc 13",                category: "Character", price: "₱5,500", accent: "#22c55e" },
  // Weapons
  "axe-01": { name: "Axe 01 — Battle Axe",   category: "Weapon",    price: "₱3,500", accent: "#c9935e" },
  "axe-02": { name: "Axe 02 — War Axe",       category: "Weapon",    price: "₱3,500", accent: "#c9935e" },
  "axe-03": { name: "Axe 03 — Runic Axe",     category: "Weapon",    price: "₱3,500", accent: "#c9935e" },
  "axe-04": { name: "Axe 04 — Viking Axe",    category: "Weapon",    price: "₱3,500", accent: "#c9935e" },
  "axe-05": { name: "Axe 05 — Ornate Axe",    category: "Weapon",    price: "₱3,500", accent: "#c9935e" },
  "axe-06": { name: "Axe 06 — Broad Axe",     category: "Weapon",    price: "₱3,500", accent: "#c9935e" },
  "axe-07": { name: "Axe 07 — Bloodied Axe",  category: "Weapon",    price: "₱3,500", accent: "#c9935e" },
  "axe-08": { name: "Axe 08 — Dark Axe",      category: "Weapon",    price: "₱3,500", accent: "#c9935e" },
  // Architecture — Interior
  "int-01": { name: "Interior 01 — Suite",    category: "Interior",  price: "₱7,500", accent: "#60a5fa" },
  "int-02": { name: "Interior 02 — Living",   category: "Interior",  price: "₱7,500", accent: "#60a5fa" },
  "int-03": { name: "Interior 03 — Kitchen",  category: "Interior",  price: "₱7,500", accent: "#60a5fa" },
  "int-04": { name: "Interior 04 — Bedroom",  category: "Interior",  price: "₱7,500", accent: "#60a5fa" },
  "int-05": { name: "Interior 05 — Lobby",    category: "Interior",  price: "₱7,500", accent: "#60a5fa" },
  "int-06": { name: "Interior 06 — Office",   category: "Interior",  price: "₱7,500", accent: "#60a5fa" },
  "int-07": { name: "Interior 07 — Luxury",   category: "Interior",  price: "₱7,500", accent: "#60a5fa" },
  // Architecture — Exterior
  "ext-drone-01": { name: "Drone Reveal 01",  category: "Exterior",  price: "₱8,500", accent: "#a78bfa" },
  "ext-drone-02": { name: "Drone Reveal 02",  category: "Exterior",  price: "₱8,500", accent: "#a78bfa" },
  "ext-proj-01":  { name: "Project 01",       category: "Exterior",  price: "₱8,500", accent: "#a78bfa" },
  "ext-proj-02":  { name: "Project 02",       category: "Exterior",  price: "₱8,500", accent: "#a78bfa" },
  "ext-proj-03":  { name: "Project 03",       category: "Exterior",  price: "₱8,500", accent: "#a78bfa" },
  "ext-proj-04":  { name: "Project 04",       category: "Exterior",  price: "₱8,500", accent: "#a78bfa" },
  "ext-proj-05":  { name: "Project 05",       category: "Exterior",  price: "₱8,500", accent: "#a78bfa" },
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
        checkoutHref: `/checkout/bundle?ids=${id}`,
      });
    }
  }

  return entries;
}

export default function BuyerDashboardClient({ items, ownedAssetIds, ownedProducts }: Props) {
  const { wishlistIds, toggleWishlist, clearWishlist, hydrated } = useWishlist();
  const { cartIds, addToCart, removeFromCart, clearCart, hydrated: cartHydrated } = useCart();
  const [wishlistOpen, setWishlistOpen] = useState(false);
  const [cartOpen,     setCartOpen]     = useState(false);

  const ownedSet = useMemo(() => new Set(ownedAssetIds), [ownedAssetIds]);

  // Refs to register add-to-cart callbacks from each section
  const addAllToCartRef     = useRef<((ids: string[]) => void) | null>(null);
  const addAllToCartArchRef = useRef<((ids: string[]) => void) | null>(null);

  // Called by WishlistPanel "Add to cart" — routes to correct section cart by asset ID prefix
  const handleAddAllToCart = useCallback((ids: string[]) => {
    const charWeaponIds = ids.filter(id => id.startsWith("orc-") || id.startsWith("axe-"));
    const archIds       = ids.filter(id => id.startsWith("int-") || id.startsWith("ext-"));
    if (charWeaponIds.length > 0) addAllToCartRef.current?.(charWeaponIds);
    if (archIds.length > 0)       addAllToCartArchRef.current?.(archIds);
    // Also add to unified cart for CartDrawer display
    addToCart(ids);
  }, [addToCart]);

  const handleRemoveFromWishlist = useCallback((id: string) => {
    toggleWishlist(id);
  }, [toggleWishlist]);

  const { recentItems, trackView, clearRecent } = useRecentlyViewed();
  const [browseOpenId, setBrowseOpenId] = useState<string | null>(null);
  const [recentOpen,   setRecentOpen]   = useState(false);

  // Records asset view — popup stays closed until buyer manually clicks the button
  const handleTrackView = useCallback((item: Parameters<typeof trackView>[0]) => {
    trackView(item);
  }, [trackView]);

  const wishlistEntries = useMemo(
    () => buildWishlistEntries(wishlistIds, items),
    [wishlistIds, items]
  );

  // Build cart entries — resolved from DB via /api/products/by-ids so cuid IDs work correctly.
  // Falls back to ASSET_META for any ID not found in the DB response (legacy slug-based IDs).
  const [resolvedCartEntries, setResolvedCartEntries] = useState<{
    id: string; name: string; category: string; price: number; priceStr: string; accent: string;
  }[]>([]);

  useEffect(() => {
    if (cartIds.size === 0) { setResolvedCartEntries([]); return; }
    const ids = [...cartIds].join(",");
    fetch(`/api/products/by-ids?ids=${ids}`)
      .then(r => r.json())
      .then(data => {
        const fromDb = new Map(
          (data.products ?? []).map((p: any) => [p.id, p])
        );
        const entries = [...cartIds].flatMap(id => {
          const db = fromDb.get(id) as any;
          if (db) return [{ id, name: db.name, category: db.category, price: db.price, priceStr: db.priceStr, accent: db.accent }];
          const meta = ASSET_META[id];
          if (meta) {
            const priceNum = parseInt(meta.price.replace(/[^\d]/g, ""), 10) || 0;
            return [{ id, name: meta.name, category: meta.category, price: priceNum, priceStr: meta.price, accent: meta.accent }];
          }
          return [];
        });
        setResolvedCartEntries(entries);
      })
      .catch(() => {});
  }, [cartIds]);

  const cartEntries = resolvedCartEntries;

  return (
    <>
      {/* ── Floating Cart Button ── */}
      <button
        className="buyerCartFloatBtn"
        onClick={() => setCartOpen(true)}
        aria-label="Open cart"
        title="Your cart"
      >
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
          <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
        </svg>
        {cartHydrated && cartIds.size > 0 && (
          <span className="buyerCartFloatCount">{cartIds.size}</span>
        )}
      </button>

      {/* ── Floating Wishlist Button ── */}
      <button
        className="buyerWishlistFloatBtn"
        onClick={() => setWishlistOpen(true)}
        aria-label="Open wishlist"
        title="Your wishlist"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
        </svg>
        {hydrated && wishlistIds.size > 0 && (
          <span className="buyerWishlistFloatCount">{wishlistIds.size}</span>
        )}
      </button>

      {/* ── Cart Drawer ── */}
      <CartDrawer
        isOpen={cartOpen}
        onClose={() => setCartOpen(false)}
        entries={cartEntries}
        onRemove={id => { removeFromCart(id); }}
        onClear={clearCart}
      />

      {/* ── Wishlist Drawer ── */}
      <WishlistPanel
        isOpen={wishlistOpen}
        onClose={() => setWishlistOpen(false)}
        entries={wishlistEntries}
        onRemove={handleRemoveFromWishlist}
        onClearAll={clearWishlist}
        onAddAllToCart={handleAddAllToCart}
      />

      {/* ── Systems ── */}
      <SystemsClient
        items={items}
        wishlistIds={wishlistIds}
        onToggleWishlist={toggleWishlist}
      />
      <SystemsInfoSections />

      {/* ── Character & Weapon Studio ── */}
      <AISection />
      <AIAssetsIntro />
      <AssetBuySection
        ownedAssetIds={ownedSet}
        wishlistIds={wishlistIds}
        onAddToWishlist={toggleWishlist}
        onAddToCart={addToCart}
        onRegisterAddToCart={fn => { addAllToCartRef.current = fn; }}
        onTrackView={handleTrackView}
        openToId={browseOpenId}
        onOpenToIdConsumed={() => setBrowseOpenId(null)}
      />
      <NewAssetSection />
      <AssetCompareTool ownedAssetIds={ownedSet} />

      {/* ── Architecture Studio ── */}
      <ArchitectureAssetsIntro />
      <ArchitectureBuySection
        wishlistIds={wishlistIds}
        onAddToWishlist={toggleWishlist}
        onAddToCart={addToCart}
        onRegisterAddToCart={fn => { addAllToCartArchRef.current = fn; }}
        onTrackView={handleTrackView}
      />
      <NewArchitectureSection />

      {/* ── Reviews ── */}
      <ReviewSection
        ownedProductIds={ownedAssetIds}
        ownedProducts={ownedProducts}
      />

      {/* ── Contact ── */}
      <InquirySection />
      <CustomRequestBuilder />

      {/* ── Floating Recently Viewed Button + Popup ── */}
      {recentItems.length > 0 && (
        <>
          <button
            className="buyerRecentFloatBtn"
            onClick={() => setRecentOpen(prev => !prev)}
            aria-label="Recently viewed"
            title="Recently Viewed"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
            <span className="buyerRecentFloatCount">{recentItems.length}</span>
          </button>

          {recentOpen && (
            <div className="buyerRecentPopup">
              <div className="buyerRecentPopupHeader">
                <span className="buyerRecentPopupTitle">Recently Viewed</span>
                <button className="buyerRecentPopupClear" onClick={() => { clearRecent(); setRecentOpen(false); }}>Clear</button>
              </div>
              <div className="buyerRecentPopupList">
                {recentItems.map(item => (
                  <div key={item.id} className="buyerRecentPopupItem">
                    <div className="buyerRecentPopupItemInfo">
                      <span className="buyerRecentPopupItemCat">{item.category}</span>
                      <p className="buyerRecentPopupItemLabel">{item.label}</p>
                      <p className="buyerRecentPopupItemPrice">{"₱" + item.price.toLocaleString("en-PH")}</p>
                    </div>
                    <button
                      className="buyerRecentPopupViewBtn"
                      onClick={() => { setBrowseOpenId(item.id); setRecentOpen(false); }}
                    >
                      View
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </>
  );
}