// AssetBuySection — Character / Weapon buying section.
// BUY → direct checkout (warns if nothing selected).
// Browse modal → Add to Cart button → toast notification.
// Discount removed — coupon system handled by admin separately.

"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useToast }  from "../shared/useToast";
import ToastStack    from "../shared/ToastStack";
import "./asset-buy-section.css";
const GD = (id: string) => `/api/drive-video?id=${id}`;

interface AssetItem {
  id:       string;
  label:    string;
  category: "Character" | "Weapon";
  videoSrc: string;
  price:    number;
}

interface Props {
  ownedAssetIds?:       Set<string>;
  onAddToWishlist?:     (id: string) => void;
  wishlistIds?:         Set<string>;
  // Pushes selected IDs into the global CartDrawer
  onAddToCart?:         (ids: string[]) => void;
  onRegisterAddToCart?: (fn: (ids: string[]) => void) => void;
  onTrackView?:         (item: { id: string; label: string; category: string; price: number }) => void;
}

// Characters + Weapons — Google Drive proxy URLs.
// Assets are fetched from /api/products?category= per tab — see fetchAssets() below.

// Bundle discount tiers: 2 items = 5%, 3–4 = 10%, 5+ = 15%
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

export default function AssetBuySection({
  ownedAssetIds = new Set(),
  onAddToWishlist,
  wishlistIds = new Set(),
  onAddToCart,
  onRegisterAddToCart,
  onTrackView,
}: Props) {
  const [browseOpen,    setBrowseOpen]    = useState(false);
  const [browseTab,     setBrowseTab]     = useState<"Character" | "Weapon">("Character");
  const [browseSearch,  setBrowseSearch]  = useState("");
  const [browseSort,    setBrowseSort]    = useState<"default" | "price-asc" | "price-desc" | "name">("default");
  const [priceMin,      setPriceMin]      = useState<number | null>(null);
  const [priceMax,      setPriceMax]      = useState<number | null>(null);
  const [selectedAsset, setSelectedAsset] = useState<AssetItem | null>(null);
  const [cartIds,       setCartIds]       = useState<Set<string>>(new Set());
  const [cycleIndex,    setCycleIndex]    = useState(0);
  const { toasts, showToast, dismissToast } = useToast();

  // DB-fetched assets per tab — cached after first fetch per category
  const [characterAssets, setCharacterAssets] = useState<AssetItem[]>([]);
  const [weaponAssets,    setWeaponAssets]    = useState<AssetItem[]>([]);
  const [assetsLoading,   setAssetsLoading]   = useState(false);

  // Fetch assets from DB when browse modal opens or tab switches
  useEffect(() => {
    if (!browseOpen) return;
    const category = browseTab === "Character" ? "character" : "weapon";
    const alreadyLoaded = category === "character" ? characterAssets.length > 0 : weaponAssets.length > 0;
    if (alreadyLoaded) return;

    setAssetsLoading(true);
    fetch(`/api/products?category=${category}`)
      .then(r => r.json())
      .then(data => {
        // Map DB product shape → AssetItem shape
        const mapped: AssetItem[] = (data.products ?? []).map((p: any) => ({
          id:       p.id,
          label:    p.name,
          category: browseTab,
          videoSrc: p.previewVideoUrl ?? "",
          price:    p.price,
        }));
        if (category === "character") setCharacterAssets(mapped);
        else                          setWeaponAssets(mapped);
      })
      .catch(() => {})
      .finally(() => setAssetsLoading(false));
  }, [browseOpen, browseTab]);

  // Task 3: expose addToCartMany so WishlistPanel "Add all to cart" can populate this cart
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
  // Quick View modal — shown before buyer commits to checkout
  const [previewAsset,  setPreviewAsset]  = useState<AssetItem | null>(null);
  const videoCardRef = useRef<HTMLVideoElement>(null);
  const fogCanvasRef = useRef<HTMLCanvasElement>(null);
  const fogRafRef    = useRef<number>(0);

  // ── Ground fog canvas — rises from bottom of the section ─────────────────
  useEffect(() => {
    const canvas = fogCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    interface FogWisp {
      x: number; y: number; vx: number; vy: number;
      swayAmp: number; swayFreq: number; swayOff: number;
      rx: number; ry: number;
      life: number; maxLife: number; opacity: number; layer: number;
    }

    function resize() {
      canvas!.width  = canvas!.offsetWidth;
      canvas!.height = canvas!.offsetHeight;
    }
    resize();
    window.addEventListener("resize", resize);

    function spawn(): FogWisp {
      const layer   = Math.floor(Math.random() * 3);
      const rs      = [2.1, 1.45, 0.9][layer];
      const speed   = [0.14, 0.25, 0.38][layer];
      const opacity = [0.30, 0.22, 0.15][layer] * (Math.random() * 0.25 + 0.88);
      return {
        x: Math.random() * canvas!.width * 1.3 - canvas!.width * 0.15,
        y: canvas!.height + Math.random() * 60,
        vx: (Math.random() - 0.5) * 0.22,
        vy: -(Math.random() * speed + 0.08),
        swayAmp: Math.random() * 25 + 8,
        swayFreq: Math.random() * 0.003 + 0.001,
        swayOff: Math.random() * Math.PI * 2,
        rx: (Math.random() * 200 + 160) * rs,
        ry: (Math.random() * 62 + 40) * rs,
        life: 0, maxLife: Math.random() * 480 + 340,
        opacity, layer,
      };
    }

    const wisps: FogWisp[] = [];
    for (let i = 0; i < 28; i++) {
      const w = spawn();
      w.life  = Math.random() * w.maxLife * 0.65;
      w.y     = canvas.height + 80 + w.vy * w.life;
      wisps.push(w);
    }

    function draw() {
      const cw = canvas!.width, ch = canvas!.height;
      ctx!.clearRect(0, 0, cw, ch);
      if (wisps.length < 34 && Math.random() < 0.5) wisps.push(spawn());
      for (let i = wisps.length - 1; i >= 0; i--) {
        if (wisps[i].life >= wisps[i].maxLife) { wisps.splice(i, 1); continue; }
      }
      wisps.sort((a, b) => a.layer - b.layer);
      for (const p of wisps) {
        p.life += 1;
        p.x    += p.vx + Math.sin(p.life * p.swayFreq + p.swayOff) * 0.3;
        p.y    += p.vy;
        const ratio   = p.life / p.maxLife;
        const fadeIn  = Math.min(1, ratio / 0.15);
        const fadeOut = ratio > 0.78 ? Math.max(0, 1 - (ratio - 0.78) / 0.22) : 1;
        const alpha   = p.opacity * fadeIn * fadeOut;
        if (alpha < 0.003) continue;
        const r = p.layer === 0 ? 185 : p.layer === 1 ? 205 : 222;
        const g = p.layer === 0 ? 200 : p.layer === 1 ? 215 : 225;
        const b = p.layer === 0 ? 230 : p.layer === 1 ? 228 : 230;
        ctx!.save();
        ctx!.translate(p.x, p.y);
        ctx!.scale(1, p.ry / p.rx);
        const grad = ctx!.createRadialGradient(0, 0, 0, 0, 0, p.rx);
        grad.addColorStop(0,    `rgba(${r},${g},${b},${alpha})`);
        grad.addColorStop(0.42, `rgba(${r},${g},${b},${alpha * 0.58})`);
        grad.addColorStop(0.76, `rgba(${r},${g},${b},${alpha * 0.18})`);
        grad.addColorStop(1,    `rgba(${r},${g},${b},0)`);
        ctx!.beginPath();
        ctx!.arc(0, 0, p.rx, 0, Math.PI * 2);
        ctx!.fillStyle = grad;
        ctx!.fill();
        ctx!.restore();
      }
      fogRafRef.current = requestAnimationFrame(draw);
    }
    fogRafRef.current = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(fogRafRef.current); window.removeEventListener("resize", resize); };
  }, []);

  const filteredAssets = useMemo(() => {
    // Use the correct fetched array per active tab
    let list = browseTab === "Character" ? characterAssets : weaponAssets;
    if (browseSearch.trim())
      list = list.filter(a => a.label.toLowerCase().includes(browseSearch.toLowerCase()));
    // Price range filter
    if (priceMin !== null) list = list.filter(a => a.price >= priceMin);
    if (priceMax !== null) list = list.filter(a => a.price <= priceMax);
    if (browseSort === "price-asc")  list = [...list].sort((a, b) => a.price - b.price);
    if (browseSort === "price-desc") list = [...list].sort((a, b) => b.price - a.price);
    if (browseSort === "name")       list = [...list].sort((a, b) => a.label.localeCompare(b.label));
    return list;
  }, [browseTab, characterAssets, weaponAssets, browseSearch, browseSort, priceMin, priceMax]);

  // Build cart items from both fetched arrays combined
  const allFetchedAssets = useMemo(() => [...characterAssets, ...weaponAssets], [characterAssets, weaponAssets]);
  const cartItems      = allFetchedAssets.filter(a => cartIds.has(a.id));
  const rawTotal       = cartItems.reduce((sum, a) => sum + a.price, 0);
  const discountRate   = getBundleDiscount(cartItems.length);
  const discountAmount = Math.round(rawTotal * discountRate);
  const finalTotal     = rawTotal - discountAmount;

  // Reset cycle index when cart composition changes
  const prevCartKey = useRef("");
  const cartKey = [...cartIds].sort().join(",");
  if (cartKey !== prevCartKey.current) {
    prevCartKey.current = cartKey;
    if (cycleIndex !== 0) setCycleIndex(0);
  }

  const toggleCart = useCallback((id: string) => {
    if (ownedAssetIds.has(id)) return;
    setCartIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, [ownedAssetIds]);

  useEffect(() => {
    if (!browseOpen && selectedAsset && videoCardRef.current) {
      const video = videoCardRef.current;
      video.load();
      video.play().catch(() => {});
    }
  }, [browseOpen, selectedAsset]);

  function handleSelectAsset(asset: AssetItem) {
    setSelectedAsset(asset);
    if (!ownedAssetIds.has(asset.id)) {
      setCartIds(prev => new Set([...prev, asset.id]));
    }
    setBrowseOpen(false);
  }

  return (
    <>
      <section className="assetBuySection">
        <div className="assetBuyBgOrc">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/orc-blue.png" alt="" className="assetBuyBgOrcImg" />
          <div className="assetBuyBgOrcFade" />
        </div>

        {/* ── Ground fog — rises from bottom of section ── */}
        <canvas ref={fogCanvasRef} className="assetBuyFogCanvas" />

        <div className="assetBuyContent">
          <div className="assetBuyHeaderRow">
            <div>
              <p className="assetBuyLabel">Character & Weapon</p>
              <h2 className="assetBuyTitle">One time Purchase.<br />Lifetime access</h2>
            </div>
            <div className="assetBuyActions">
              <button
                className="assetBuyBtn"
                onClick={() => {
                  if (cartItems.length === 0) {
                    showToast("No items selected. Browse and select assets first.", "warning");
                    return;
                  }
                  const ids = cartItems.map(a => a.id).join(",");
                  window.location.href = `/checkout/bundle?ids=${ids}`;
                }}
              >
                {cartItems.length > 0 ? `BUY (${cartItems.length})` : "BUY"}
              </button>
              <button className="assetBrowseBtn" onClick={() => setBrowseOpen(true)}>Browse</button>
            </div>
          </div>

          {/* Cart pills */}
          {cartItems.length > 0 && (
            <div className="assetCartPills">
              {cartItems.map(item => (
                <div key={item.id} className="assetCartPill">
                  <span className="assetCartPillLabel">{item.label}</span>
                  <span className="assetCartPillPrice">{fmt(item.price)}</span>
                  <button
                    className="assetCartPillRemove"
                    onClick={() => toggleCart(item.id)}
                    aria-label={`Remove ${item.label}`}
                  >×</button>
                </div>
              ))}
            </div>
          )}

          <div className="assetBuyCards">
            <div className="assetBuyCard">
              <div className="assetBuyCardInner">
                <span className="assetBuyCardIcon">📦</span>
                <p className="assetBuyCardLabel">3D obj file here</p>
              </div>
            </div>

            {/* Animation preview — cycles through all selected items one by one */}
            {cartItems.length === 0 ? (
              <div className="assetBuyCard assetBuyCardVideoWrap">
                <div className="assetBuyCardInner">
                  <span className="assetBuyCardIcon">🎬</span>
                  <p className="assetBuyCardLabel">Mp4 animation here</p>
                </div>
              </div>
            ) : (
              <div className="assetBuyCard assetBuyCardVideoWrap">
                <video
                  ref={videoCardRef}
                  key={cartItems[cycleIndex % cartItems.length]?.id}
                  src={cartItems[cycleIndex % cartItems.length]?.videoSrc}
                  className="assetBuyCardVideo"
                  autoPlay muted playsInline
                  loop={cartItems.length === 1}
                  onEnded={cartItems.length > 1 ? () => setCycleIndex(prev => prev + 1) : undefined}
                />
                {cartItems.length > 1 && (
                  <div className="assetBuyCycleLabel">
                    {cartItems[cycleIndex % cartItems.length]?.label}
                    <span className="assetBuyCycleDots">
                      {cartItems.map((_, i) => (
                        <span
                          key={i}
                          className={`assetBuyCycleDot ${i === cycleIndex % cartItems.length ? "assetBuyCycleDotActive" : ""}`}
                        />
                      ))}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {browseOpen && (
        <div className="assetModalOverlay" onClick={() => setBrowseOpen(false)}>
          <div className="assetModal" onClick={e => e.stopPropagation()}>
            <div className="assetModalHeader">
              <div className="assetModalTabs">
                {(["Character", "Weapon"] as const).map(tab => (
                  <button
                    key={tab}
                    className={`assetModalTab ${browseTab === tab ? "assetModalTabActive" : ""}`}
                    onClick={() => { setBrowseTab(tab); setBrowseSearch(""); }}
                  >
                    {tab}
                  </button>
                ))}
              </div>
              {cartItems.length > 0 && (
                <span className="assetModalCartBadge">
                  {cartItems.length} in bundle{discountRate > 0 ? ` · ${discountLabel(cartItems.length)}` : ""}
                </span>
              )}
              <button className="assetModalClose" onClick={() => setBrowseOpen(false)}>✕</button>
            </div>

            {/* ── Search + Sort controls ── */}
            <div className="assetModalControls">
              <div className="assetModalSearchWrap">
                <input
                  className="assetModalSearch"
                  type="text"
                  placeholder="Search assets…"
                  value={browseSearch}
                  onChange={e => setBrowseSearch(e.target.value)}
                />
                {browseSearch && (
                  <button className="assetModalSearchClear" onClick={() => setBrowseSearch("")}>✕</button>
                )}
              </div>
              <select
                className="assetModalSort"
                value={browseSort}
                onChange={e => setBrowseSort(e.target.value as typeof browseSort)}
              >
                <option value="default">Default</option>
                <option value="price-asc">Price: Low → High</option>
                <option value="price-desc">Price: High → Low</option>
                <option value="name">Name A–Z</option>
              </select>

              {/* Task 2 — Price range filter */}
              <div className="assetModalPriceFilter">
                <span className="assetModalPriceFilterLabel">₱</span>
                <input
                  className="assetModalPriceInput"
                  type="number"
                  placeholder="Min"
                  min={0}
                  value={priceMin ?? ""}
                  onChange={e => setPriceMin(e.target.value ? Number(e.target.value) : null)}
                />
                <span className="assetModalPriceFilterSep">–</span>
                <input
                  className="assetModalPriceInput"
                  type="number"
                  placeholder="Max"
                  min={0}
                  value={priceMax ?? ""}
                  onChange={e => setPriceMax(e.target.value ? Number(e.target.value) : null)}
                />
                {(priceMin !== null || priceMax !== null) && (
                  <button
                    className="assetModalPriceClear"
                    onClick={() => { setPriceMin(null); setPriceMax(null); }}
                    title="Clear price filter"
                  >✕</button>
                )}
              </div>
            </div>

            <div className="assetModalList">
              {/* Loading skeleton */}
              {assetsLoading && (
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="assetModalRowSkeleton">
                    <div className="assetModalSkeletonThumb" />
                    <div className="assetModalSkeletonInfo">
                      <div className="assetModalSkeletonLine assetModalSkeletonLineLong" />
                      <div className="assetModalSkeletonLine assetModalSkeletonLineShort" />
                    </div>
                  </div>
                ))
              )}
              {/* Empty state */}
              {!assetsLoading && filteredAssets.length === 0 && (
                <div className="assetModalEmpty">
                  <p>No {browseTab.toLowerCase()} assets found.</p>
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
                      "assetModalRow",
                      selectedAsset?.id === asset.id ? "assetModalRowActive" : "",
                      isInCart  ? "assetModalRowInCart" : "",
                      isOwned   ? "assetModalRowOwned"  : "",
                    ].join(" ")}
                    onClick={() => !isOwned && setSelectedAsset(asset)}
                  >
                    <div className="assetModalThumb">
                      <video src={asset.videoSrc} autoPlay muted loop playsInline preload="none" className="assetModalThumbVideo" />
                    </div>
                    <div className="assetModalRowInfo">
                      <p className="assetModalRowLabel">{asset.label}</p>
                      <p className="assetModalRowCategory">{asset.category}</p>
                    </div>
                    <div className="assetModalRowRight">
                      <p className="assetModalRowPrice">{fmt(asset.price)}</p>
                      {isOwned ? (
                        <span className="assetModalOwnedBadge">✓ Owned</span>
                      ) : (
                        <div className="assetModalRowBtns">
                          {onAddToWishlist && (
                            <button
                              className={"assetModalWishlistBtn" + (isWishlisted ? " assetModalWishlistBtnActive" : "")}
                              onClick={e => { e.stopPropagation(); onAddToWishlist(asset.id); }}
                              aria-label="Save to wishlist"
                            >
                              {isWishlisted ? "♥" : "♡"}
                            </button>
                          )}
                          {/* Quick View — fullscreen preview before buying */}
                          <button
                            className="assetModalQuickViewBtn"
                            onClick={e => {
                              e.stopPropagation();
                              setPreviewAsset(asset);
                              onTrackView?.({ id: asset.id, label: asset.label, category: asset.category, price: asset.price });
                            }}
                            aria-label="Quick view"
                          >
                            Quick View
                          </button>
                          <button
                            className={"assetModalSelectBtn" + (isInCart ? " assetModalSelectBtnActive" : "")}
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

            <div className="assetModalFooter">
              <div className="assetModalFooterLeft">
                <p className="assetModalFooterNote">
                  {cartItems.length === 0 ? "Select assets to add to cart" : `${cartItems.length} item${cartItems.length > 1 ? "s" : ""} selected`}
                </p>
              </div>
              <button
                className={"assetModalAddCartBtn" + (cartItems.length === 0 ? " assetModalAddCartBtnDisabled" : "")}
                disabled={cartItems.length === 0}
                onClick={() => {
                  if (cartItems.length === 0) return;
                  // Push selected IDs to global CartDrawer
                  onAddToCart?.(cartItems.map(a => a.id));
                  setBrowseOpen(false);
                  showToast(`${cartItems.length} item${cartItems.length > 1 ? "s" : ""} added to cart`, "success");
                }}
              >
                {cartItems.length === 0
                  ? "Add to Cart"
                  : `Add ${cartItems.length} to Cart`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Asset Quick View — fullscreen preview modal ── */}
      {previewAsset && (
        <div className="assetQuickViewOverlay" onClick={() => setPreviewAsset(null)}>
          <div className="assetQuickViewModal" onClick={e => e.stopPropagation()}>

            {/* Close */}
            <button className="assetQuickViewClose" onClick={() => setPreviewAsset(null)}>✕</button>

            {/* Full video */}
            <div className="assetQuickViewVideoWrap">
              <video
                key={previewAsset.id}
                src={previewAsset.videoSrc}
                autoPlay muted loop playsInline
                className="assetQuickViewVideo"
              />
              <div className="assetQuickViewVideoLabel">Animation Preview</div>
            </div>

            {/* Info panel */}
            <div className="assetQuickViewInfo">
              <p className="assetQuickViewCategory">{previewAsset.category}</p>
              <h2 className="assetQuickViewTitle">{previewAsset.label}</h2>
              <p className="assetQuickViewPrice">{fmt(previewAsset.price)}</p>

              {/* Stats */}
              <div className="assetQuickViewStats">
                <div className="assetQuickViewStat">
                  <span className="assetQuickViewStatLabel">Format</span>
                  <span className="assetQuickViewStatValue">OBJ / FBX</span>
                </div>
                <div className="assetQuickViewStat">
                  <span className="assetQuickViewStatLabel">Textures</span>
                  <span className="assetQuickViewStatValue">4K PBR</span>
                </div>
                <div className="assetQuickViewStat">
                  <span className="assetQuickViewStatLabel">Rig</span>
                  <span className="assetQuickViewStatValue">Full rig included</span>
                </div>
                <div className="assetQuickViewStat">
                  <span className="assetQuickViewStatLabel">Access</span>
                  <span className="assetQuickViewStatValue">Lifetime</span>
                </div>
              </div>

              {/* Texture preview thumbnails */}
              <div className="assetQuickViewTextures">
                <p className="assetQuickViewTexturesLabel">Texture Maps</p>
                <div className="assetQuickViewTextureList">
                  {["Albedo", "Normal", "Roughness", "Metallic"].map(mapName => (
                    <div key={mapName} className="assetQuickViewTextureThumb">
                      <div className="assetQuickViewThumbPlaceholder" />
                      <span className="assetQuickViewThumbLabel">{mapName}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* CTA */}
              {ownedAssetIds.has(previewAsset.id) ? (
                <div className="assetQuickViewOwned">✓ You own this asset</div>
              ) : (
                <button
                  className={"assetQuickViewBuyBtn" + (cartIds.has(previewAsset.id) ? " assetQuickViewBuyBtnAdded" : "")}
                  onClick={() => {
                    handleSelectAsset(previewAsset);
                    setPreviewAsset(null);
                  }}
                >
                  {cartIds.has(previewAsset.id) ? "✓ Added to Bundle" : `Buy — ${fmt(previewAsset.price)}`}
                </button>
              )}
            </div>

          </div>
        </div>
      )}

      <ToastStack toasts={toasts} onDismiss={dismissToast} />
    </>
  );
}