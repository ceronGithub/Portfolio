// ArchitectureBuySection — Interior / Exterior buying section.
// Preview cards removed. Selected asset video plays as section background.
// Browse → Select → video fills the left bg of the section.
// Tabs are DB-fetched per category (same pattern as AssetBuySection).
// Browse modal has search, sort, and price range filter controls.

"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { sanitize }    from "@/lib/utils";
import { useToast }    from "../shared/useToast";
import ToastStack      from "../shared/ToastStack";
import "./architecture-buy-section.css";

interface ArchAssetItem {
  id:       string;
  label:    string;
  category: "Interior" | "Exterior";
  videoSrc: string;
  price:    number;
}

interface Props {
  ownedAssetIds?: Set<string>;
  onAddToWishlist?: (id: string) => void;
  wishlistIds?: Set<string>;
  onAddToCart?: (ids: string[]) => void;
  onRegisterAddToCart?: (fn: (ids: string[]) => void) => void;
  onTrackView?: (item: { id: string; label: string; category: string; price: number }) => void;
}

function getBundleDiscount(count: number): number {
  if (count >= 5) return 0.15;
  if (count >= 3) return 0.10;
  if (count >= 2) return 0.05;
  return 0;
}

function discountLabel(count: number): string {
  if (count >= 5) return "15% off";
  if (count >= 3) return "10% off";
  if (count >= 2) return "5% off";
  return "";
}

function fmt(p: number): string {
  return "₱" + p.toLocaleString("en-PH", { minimumFractionDigits: 0 });
}

export default function ArchitectureBuySection({
  ownedAssetIds = new Set(),
  onAddToWishlist,
  wishlistIds = new Set(),
  onAddToCart,
  onRegisterAddToCart,
  onTrackView,
}: Props) {
  const [browseOpen,    setBrowseOpen]    = useState(false);
  const [browseTab,     setBrowseTab]     = useState<"Interior" | "Exterior">("Interior");
  const [browseSearch,  setBrowseSearch]  = useState("");
  const [browseSort,    setBrowseSort]    = useState<"default" | "price-asc" | "price-desc" | "name">("default");
  const [priceMin,      setPriceMin]      = useState<number | null>(null);
  const [priceMax,      setPriceMax]      = useState<number | null>(null);
  const [selectedAsset, setSelectedAsset] = useState<ArchAssetItem | null>(null);
  const [cartIds,       setCartIds]       = useState<Set<string>>(new Set());
  const [cycleIndex,    setCycleIndex]    = useState(0);
  const [bgSrc,         setBgSrc]         = useState<string>("");
  const { toasts, showToast, dismissToast } = useToast();
  const bgVideoRef = useRef<HTMLVideoElement>(null);

  // DB-fetched assets per tab — cached after first fetch
  const [interiorAssets, setInteriorAssets] = useState<ArchAssetItem[]>([]);
  const [exteriorAssets, setExteriorAssets] = useState<ArchAssetItem[]>([]);
  const [assetsLoading,  setAssetsLoading]  = useState(false);

  // Fetch first interior asset on mount to show a default background video
  useEffect(() => {
    fetch("/api/products?category=interior")
      .then(r => r.json())
      .then(data => {
        const firstVideo = (data.products ?? []).find((p: any) => p.previewVideoUrl)?.previewVideoUrl;
        if (firstVideo) setBgSrc(firstVideo);
      })
      .catch(() => {});
  }, []);

  // Fetch from /api/products when modal opens or tab switches
  useEffect(() => {
    if (!browseOpen) return;
    const category     = browseTab === "Interior" ? "interior" : "exterior";
    const alreadyLoaded = category === "interior" ? interiorAssets.length > 0 : exteriorAssets.length > 0;
    if (alreadyLoaded) return;

    setAssetsLoading(true);
    fetch(`/api/products?category=${category}`)
      .then(r => r.json())
      .then(data => {
        const mapped: ArchAssetItem[] = (data.products ?? []).map((p: any) => ({
          id:       p.id,
          label:    p.name,
          category: browseTab,
          videoSrc: p.previewVideoUrl ?? "",
          // Interior/Exterior have a single flat price — no tier selection.
          // Use priceFullPack as the canonical price (set by admin).
          // Fall back down the chain if a field is 0 / unset.
          price:    p.priceFullPack || p.priceStandard || p.priceMeshOnly || 0,
        }));
        if (category === "interior") setInteriorAssets(mapped);
        else                         setExteriorAssets(mapped);
      })
      .catch(() => {})
      .finally(() => setAssetsLoading(false));
  }, [browseOpen, browseTab]);

  // All fetched assets combined — for cart item resolution
  const allFetchedAssets = useMemo(
    () => [...interiorAssets, ...exteriorAssets],
    [interiorAssets, exteriorAssets]
  );

  // Filtered + sorted list for the active tab
  const filteredAssets = useMemo(() => {
    let list = browseTab === "Interior" ? interiorAssets : exteriorAssets;
    if (browseSearch.trim())
      list = list.filter(a => a.label.toLowerCase().includes(browseSearch.toLowerCase()));
    if (priceMin !== null) list = list.filter(a => a.price >= priceMin);
    if (priceMax !== null) list = list.filter(a => a.price <= priceMax);
    if (browseSort === "price-asc")  list = [...list].sort((a, b) => a.price - b.price);
    if (browseSort === "price-desc") list = [...list].sort((a, b) => b.price - a.price);
    if (browseSort === "name")       list = [...list].sort((a, b) => a.label.localeCompare(b.label));
    return list;
  }, [browseTab, interiorAssets, exteriorAssets, browseSearch, browseSort, priceMin, priceMax]);

  const cartItems      = allFetchedAssets.filter(a => cartIds.has(a.id));
  const rawTotal       = cartItems.reduce((sum, a) => sum + a.price, 0);
  const discountRate   = getBundleDiscount(cartItems.length);
  const discountAmount = Math.round(rawTotal * discountRate);
  const finalTotal     = rawTotal - discountAmount;

  // bgSrc: cycle through cart items
  useEffect(() => {
    if (cartItems.length === 0) { setBgSrc(""); return; }
    setBgSrc(cartItems[cycleIndex % cartItems.length].videoSrc);
  }, [cartIds, cycleIndex, allFetchedAssets]);

  // Play bgVideo whenever bgSrc changes
  useEffect(() => {
    const video = bgVideoRef.current;
    if (!video || !bgSrc) return;
    video.load();
    video.play().catch(() => {});
  }, [bgSrc]);

  // Register addToCartMany so WishlistPanel can populate this cart externally
  useEffect(() => {
    onRegisterAddToCart?.((ids: string[]) => {
      setCartIds(prev => {
        const next = new Set(prev);
        ids.forEach(id => {
          if (!ownedAssetIds.has(id)) next.add(id);
        });
        return next;
      });
    });
  }, [onRegisterAddToCart, ownedAssetIds]);

  const toggleCart = useCallback((id: string) => {
    if (ownedAssetIds.has(id)) return;
    setCycleIndex(0);
    setCartIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, [ownedAssetIds]);

  function handleSelectAsset(asset: ArchAssetItem) {
    setSelectedAsset(asset);
    toggleCart(asset.id);
    onTrackView?.({ id: asset.id, label: asset.label, category: asset.category, price: asset.price });
  }

  return (
    <>
      <section className="archBuySection">

        {/* Left background — cycles through all selected asset videos */}
        <div className="archBuyBgLeft">
          <video
            ref={bgVideoRef}
            src={bgSrc || undefined}
            className="archBuyBgVideo"
            style={{ opacity: bgSrc ? 1 : 0 }}
            autoPlay
            muted
            playsInline
            loop={cartItems.length <= 1}
            onEnded={cartItems.length > 1 ? () => setCycleIndex(prev => prev + 1) : undefined}
          />
          {!bgSrc && <div className="archBuyBgPlaceholder" />}
          <div className="archBuyBgFade" />
        </div>

        <div className="archBuyContent">
          <div className="archBuyHeaderRow">
            <div>
              <p className="archBuyLabel">Interior & Exterior</p>
              <h2 className="archBuyTitle">Architecture Assets.<br />Lifetime access</h2>
            </div>
            <div className="archBuyActions">
              <button
                className="archBuyBtn"
                onClick={() => {
                  if (cartItems.length === 0) {
                    showToast("No items selected. Browse and select assets first.", "warning");
                    return;
                  }
                  // Interior/Exterior = flat price, always full_pack tier
                  const items = cartItems.map(a => `${a.id}:full_pack`).join(",");
                  window.open(`/checkout/bundle?items=${items}`, "_blank", "noopener,noreferrer");
                }}
              >
                {cartItems.length > 0 ? `BUY (${cartItems.length})` : "BUY"}
              </button>
              <button
                className={"archCartIconBtn" + (cartItems.length === 0 ? " archCartIconBtnDisabled" : "")}
                disabled={cartItems.length === 0}
                onClick={() => {
                  if (cartItems.length === 0) return;
                  // Interior/Exterior = flat price, always full_pack tier
                  const items = cartItems.map(a => `${a.id}:full_pack`).join(",");
                  window.open(`/checkout/bundle?items=${items}`, "_blank", "noopener,noreferrer");
                }}
                title={cartItems.length > 0 ? `Checkout (${cartItems.length} items)` : "No items selected"}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
                  <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
                </svg>
                {cartItems.length > 0 && (
                  <span className="archCartIconBadge">{cartItems.length}</span>
                )}
              </button>
              <button className="archBrowseBtn" onClick={() => setBrowseOpen(true)}>Browse</button>
            </div>
          </div>

          {/* Owned assets summary — shown when buyer already owns architecture assets */}
          {(() => {
            const ownedInArch = [...interiorAssets, ...exteriorAssets].filter(a => ownedAssetIds.has(a.id));
            if (ownedInArch.length === 0) return null;
            return (
              <div className="assetOwnedBanner">
                <span className="assetOwnedBannerIcon">✓</span>
                <span className="assetOwnedBannerText">
                  You already own {ownedInArch.length} asset{ownedInArch.length !== 1 ? "s" : ""}
                  {" "}({ownedInArch.map(a => a.label).join(", ")})
                </span>
                <button
                  className="assetOwnedBannerLink"
                  onClick={() => setBrowseOpen(true)}
                >
                  Browse more →
                </button>
              </div>
            );
          })()}

          {/* Cart pills */}
          {cartItems.length > 0 && (
            <div className="archCartPills">
              {cartItems.map(item => (
                <div key={item.id} className="archCartPill">
                  <span className="archCartPillLabel">{item.label}</span>
                  <span className="archCartPillPrice">{fmt(item.price)}</span>
                  <button className="archCartPillRemove" onClick={() => toggleCart(item.id)}>×</button>
                </div>
              ))}
            </div>
          )}

        </div>
      </section>

      {/* Browse Modal */}
      {browseOpen && (
        <div className="archModalOverlay" onClick={() => setBrowseOpen(false)}>
          <div className="archModal" onClick={e => e.stopPropagation()}>

            <div className="archModalHeader">
              <div className="archModalTabs">
                {(["Interior", "Exterior"] as const).map(tab => (
                  <button
                    key={tab}
                    className={`archModalTab ${browseTab === tab ? "archModalTabActive" : ""}`}
                    onClick={() => { setBrowseTab(tab); setBrowseSearch(""); }}
                  >
                    {tab}
                  </button>
                ))}
              </div>
              {cartItems.length > 0 && (
                <span className="archModalCartBadge">
                  {cartItems.length} in bundle{discountRate > 0 ? ` · ${discountLabel(cartItems.length)}` : ""}
                </span>
              )}
              <button className="archModalClose" onClick={() => setBrowseOpen(false)}>✕</button>
            </div>

            {/* ── Search + Sort + Price filter controls ── */}
            <div className="archModalControls">
              <div className="archModalSearchWrap">
                <input
                  className="archModalSearch"
                  type="text"
                  placeholder="Search assets…"
                  value={browseSearch}
                  onChange={e => setBrowseSearch(sanitize(e.target.value))}
                />
                {browseSearch && (
                  <button className="archModalSearchClear" onClick={() => setBrowseSearch("")}>✕</button>
                )}
              </div>
              <select
                className="archModalSort"
                value={browseSort}
                onChange={e => setBrowseSort(e.target.value as typeof browseSort)}
              >
                <option value="default">Default</option>
                <option value="price-asc">Price: Low → High</option>
                <option value="price-desc">Price: High → Low</option>
                <option value="name">Name A–Z</option>
              </select>
              <div className="archModalPriceFilter">
                <span className="archModalPriceFilterLabel">₱</span>
                <input
                  className="archModalPriceInput"
                  type="number"
                  placeholder="Min"
                  min={0}
                  value={priceMin ?? ""}
                  onChange={e => setPriceMin(e.target.value ? Number(e.target.value) : null)}
                />
                <span className="archModalPriceFilterSep">–</span>
                <input
                  className="archModalPriceInput"
                  type="number"
                  placeholder="Max"
                  min={0}
                  value={priceMax ?? ""}
                  onChange={e => setPriceMax(e.target.value ? Number(e.target.value) : null)}
                />
                {(priceMin !== null || priceMax !== null) && (
                  <button
                    className="archModalPriceClear"
                    onClick={() => { setPriceMin(null); setPriceMax(null); }}
                    title="Clear price filter"
                  >✕</button>
                )}
              </div>
            </div>

            <div className="archModalList">
              {/* Loading skeleton */}
              {assetsLoading && (
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="archModalRowSkeleton">
                    <div className="archModalSkeletonThumb" />
                    <div className="archModalSkeletonInfo">
                      <div className="archModalSkeletonLine archModalSkeletonLineLong" />
                      <div className="archModalSkeletonLine archModalSkeletonLineShort" />
                    </div>
                  </div>
                ))
              )}
              {/* Empty state */}
              {!assetsLoading && filteredAssets.length === 0 && (
                <div className="archModalEmpty">
                  <span className="archModalEmptyIcon">🏗️</span>
                  <p className="archModalEmptyText">No {browseTab.toLowerCase()} assets found.</p>
                  <p className="archModalEmptySub">Try adjusting your search or filters.</p>
                </div>
              )}
              {!assetsLoading && filteredAssets.map(asset => {
                const isOwned      = ownedAssetIds.has(asset.id);
                const isInCart     = cartIds.has(asset.id);
                const isWishlisted = wishlistIds.has(asset.id);
                return (
                  <div
                    key={asset.id}
                    className={[
                      "archModalRow",
                      selectedAsset?.id === asset.id ? "archModalRowActive"  : "",
                      isInCart  ? "archModalRowInCart" : "",
                      isOwned   ? "archModalRowOwned"  : "",
                    ].join(" ")}
                    onClick={() => !isOwned && setSelectedAsset(asset)}
                  >
                    <div className="archModalThumb">
                      <video src={asset.videoSrc} autoPlay muted loop playsInline preload="none" className="archModalThumbVideo" />
                    </div>
                    <div className="archModalRowInfo">
                      <p className="archModalRowLabel">{asset.label}</p>
                      <p className="archModalRowCategory">{asset.category}</p>
                    </div>
                    <div className="archModalRowRight">
                      <p className="archModalRowPrice">{fmt(asset.price)}</p>
                      {isOwned ? (
                        <span className="archModalOwnedBadge">✓ Owned</span>
                      ) : (
                        <div className="archModalRowBtns">
                          {onAddToWishlist && (
                            <button
                              className={"archModalWishlistBtn" + (isWishlisted ? " archModalWishlistBtnActive" : "")}
                              onClick={e => { e.stopPropagation(); onAddToWishlist(asset.id); }}
                              aria-label="Save to wishlist"
                            >
                              {isWishlisted ? "♥" : "♡"}
                            </button>
                          )}
                          <button
                            className={"archModalSelectBtn" + (isInCart ? " archModalSelectBtnActive" : "")}
                            onClick={e => { e.stopPropagation(); handleSelectAsset(asset); }}
                          >
                            {isInCart ? "✓ Added" : "Select"}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="archModalFooter">
              <div className="archModalFooterLeft">
                <p className="archModalFooterNote">
                  {cartItems.length === 0 ? "Select assets to add to cart" : `${cartItems.length} item${cartItems.length > 1 ? "s" : ""} selected`}
                </p>
              </div>
              <button
                className={"archModalAddCartBtn" + (cartItems.length === 0 ? " archModalAddCartBtnDisabled" : "")}
                disabled={cartItems.length === 0}
                onClick={() => {
                  if (cartItems.length === 0) return;
                  onAddToCart?.(cartItems.map(a => a.id));
                  setBrowseOpen(false);
                  showToast(`${cartItems.length} item${cartItems.length > 1 ? "s" : ""} added to cart`, "success");
                }}
              >
                {cartItems.length === 0 ? "Add to Cart" : `Add ${cartItems.length} to Cart`}
              </button>
            </div>
          </div>
        </div>
      )}
      <ToastStack toasts={toasts} onDismiss={dismissToast} />
    </>
  );
}