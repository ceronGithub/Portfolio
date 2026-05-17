// AssetBuySection — Character / Weapon buying section.
// TASK 2: Bundle pricing — select multiple assets, get tiered discount.
//   2 items = 5% off, 3–4 items = 10% off, 5+ items = 15% off.
//   Cart lives in local state; total updates live as assets are toggled.
// TASK 3: Owned asset state — ownedAssetIds prop marks owned assets.
//   Owned items show "✓ Owned" badge instead of Select/Buy.
// Layout: orc-blue bg left, content right.
// BUY button → checkout with selected bundle. Browse button → modal.
// Select in modal → closes modal → auto-plays selected asset video in card 2.

"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import "./asset-buy-section.css";

const SB = "https://ktuahohvysmjxumekaov.supabase.co/storage/v1/object/public/videos";

interface AssetItem {
  id:       string;
  label:    string;
  category: "Character" | "Weapon";
  videoSrc: string;
  price:    number;
}

interface Props {
  ownedAssetIds?: Set<string>;
  onAddToWishlist?: (id: string) => void;
  wishlistIds?: Set<string>;
}

const ALL_ASSETS: AssetItem[] = [
  { id:"orc-01", label:"Orc 01 — Warrior",     category:"Character", videoSrc:`${SB}/character/orc-01-animation.mp4`, price:5500 },
  { id:"orc-02", label:"Orc 02 — Fighter",      category:"Character", videoSrc:`${SB}/character/orc-02-animation.mp4`, price:5500 },
  { id:"orc-03", label:"Orc 03 — Red Skin",     category:"Character", videoSrc:`${SB}/character/orc-03-animation.mp4`, price:5500 },
  { id:"orc-04", label:"Orc 04 — Armored",      category:"Character", videoSrc:`${SB}/character/orc-04-animation.mp4`, price:5500 },
  { id:"orc-05", label:"Orc 05 — Shaman",       category:"Character", videoSrc:`${SB}/character/orc-05-animation.mp4`, price:5500 },
  { id:"orc-06", label:"Orc 06 — Berserker",    category:"Character", videoSrc:`${SB}/character/orc-06-animation.mp4`, price:5500 },
  { id:"orc-07", label:"Orc 07 — Heavy",        category:"Character", videoSrc:`${SB}/character/orc-07-animation.mp4`, price:5500 },
  { id:"orc-08", label:"Orc 08 — Scout",        category:"Character", videoSrc:`${SB}/character/orc-08-animation.mp4`, price:5500 },
  { id:"orc-09", label:"Orc 09 — Elite",        category:"Character", videoSrc:`${SB}/character/orc-09-animation.mp4`, price:5500 },
  { id:"orc-11", label:"Orc 11 — Warlord",      category:"Character", videoSrc:`${SB}/character/orc-11-animation.mp4`, price:5500 },
  { id:"axe-01", label:"Axe 01 — Battle Axe",   category:"Weapon",    videoSrc:`${SB}/weapon/axe-01-animation.mp4`,    price:3500 },
  { id:"axe-02", label:"Axe 02 — War Axe",      category:"Weapon",    videoSrc:`${SB}/weapon/axe-02-animation.mp4`,    price:3500 },
  { id:"axe-03", label:"Axe 03 — Runic Axe",    category:"Weapon",    videoSrc:`${SB}/weapon/axe-03-animation.mp4`,    price:3500 },
  { id:"axe-04", label:"Axe 04 — Viking Axe",   category:"Weapon",    videoSrc:`${SB}/weapon/axe-04-animation.mp4`,    price:3500 },
  { id:"axe-05", label:"Axe 05 — Ornate Axe",   category:"Weapon",    videoSrc:`${SB}/weapon/axe-05-animation.mp4`,    price:3500 },
  { id:"axe-07", label:"Axe 07 — Bloodied Axe", category:"Weapon",    videoSrc:`${SB}/weapon/axe-07-animation.mp4`,    price:3500 },
];

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
}: Props) {
  const [browseOpen,    setBrowseOpen]    = useState(false);
  const [browseTab,     setBrowseTab]     = useState<"Character" | "Weapon">("Character");
  const [browseSearch,  setBrowseSearch]  = useState("");
  const [browseSort,    setBrowseSort]    = useState<"default" | "price-asc" | "price-desc" | "name">("default");
  const [selectedAsset, setSelectedAsset] = useState<AssetItem | null>(null);
  const [cartIds,       setCartIds]       = useState<Set<string>>(new Set());
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
    let list = ALL_ASSETS.filter(a => a.category === browseTab);
    if (browseSearch.trim())
      list = list.filter(a => a.label.toLowerCase().includes(browseSearch.toLowerCase()));
    if (browseSort === "price-asc")  list = [...list].sort((a, b) => a.price - b.price);
    if (browseSort === "price-desc") list = [...list].sort((a, b) => b.price - a.price);
    if (browseSort === "name")       list = [...list].sort((a, b) => a.label.localeCompare(b.label));
    return list;
  }, [browseTab, browseSearch, browseSort]);
  const cartItems      = ALL_ASSETS.filter(a => cartIds.has(a.id));
  const rawTotal       = cartItems.reduce((sum, a) => sum + a.price, 0);
  const discountRate   = getBundleDiscount(cartItems.length);
  const discountAmount = Math.round(rawTotal * discountRate);
  const finalTotal     = rawTotal - discountAmount;

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
                className={"assetBuyBtn" + (cartItems.length === 0 ? " assetBuyBtnDisabled" : "")}
                disabled={cartItems.length === 0}
                onClick={() => {}}
                title={cartItems.length === 0 ? "Select assets first" : `Buy ${cartItems.length} item${cartItems.length > 1 ? "s" : ""}`}
              >
                {cartItems.length > 0 ? `BUY (${cartItems.length})` : "BUY"}
              </button>
              <button className="assetBrowseBtn" onClick={() => setBrowseOpen(true)}>Browse</button>
            </div>
          </div>

          {/* Bundle pricing bar */}
          {cartItems.length >= 2 && (
            <div className="assetBundleBar">
              <div className="assetBundleBarLeft">
                <span className="assetBundleTag">{discountLabel(cartItems.length)}</span>
                <span className="assetBundleInfo">Bundle — {cartItems.length} items</span>
              </div>
              <div className="assetBundleBarRight">
                {discountAmount > 0 && (
                  <span className="assetBundleSaving">−{fmt(discountAmount)}</span>
                )}
                <span className="assetBundleTotal">{fmt(finalTotal)}</span>
              </div>
            </div>
          )}

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
            <div className="assetBuyCard">
              {selectedAsset ? (
                <video
                  ref={videoCardRef}
                  src={selectedAsset.videoSrc}
                  className="assetBuyCardVideo"
                  autoPlay muted loop playsInline
                />
              ) : (
                <div className="assetBuyCardInner">
                  <span className="assetBuyCardIcon">🎬</span>
                  <p className="assetBuyCardLabel">Mp4 animation here</p>
                </div>
              )}
            </div>
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
            </div>

            <div className="assetModalList">
              {filteredAssets.map(asset => {
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
                      <video src={asset.videoSrc} autoPlay muted loop playsInline className="assetModalThumbVideo" />
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
                  {cartItems.length === 0 ? "Select assets to build a bundle" : `${cartItems.length} item${cartItems.length > 1 ? "s" : ""} selected`}
                </p>
                {cartItems.length === 1 && (
                  <p className="assetModalBundleHint">Add 1 more for 5% bundle discount</p>
                )}
                {cartItems.length >= 2 && discountRate > 0 && (
                  <p className="assetModalBundleHint assetModalBundleHintActive">
                    {discountLabel(cartItems.length)} applied — saving {fmt(discountAmount)}
                  </p>
                )}
              </div>
              {cartItems.length > 0 && (
                <button className="assetModalBuyBtn">
                  Buy Bundle — {fmt(finalTotal)}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}