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

import { useState, useRef, useEffect, useCallback } from "react";
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
  const [selectedAsset, setSelectedAsset] = useState<AssetItem | null>(null);
  const [cartIds,       setCartIds]       = useState<Set<string>>(new Set());
  const videoCardRef = useRef<HTMLVideoElement>(null);

  const filteredAssets = ALL_ASSETS.filter(a => a.category === browseTab);
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
                    onClick={() => setBrowseTab(tab)}
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