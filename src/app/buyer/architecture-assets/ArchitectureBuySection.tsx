// ArchitectureBuySection — Interior / Exterior buying section.
// Same pattern as AssetBuySection but for architecture asset types.
// Bundle pricing + owned state baked in from the start.
// Asset list blank for now — IDs and srcs TBD.

"use client";

import { useState, useRef, useEffect, useCallback } from "react";
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
}

// Blank asset list — populate when content is ready
const ALL_ARCH_ASSETS: ArchAssetItem[] = [];

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
}: Props) {
  const [browseOpen,    setBrowseOpen]    = useState(false);
  const [browseTab,     setBrowseTab]     = useState<"Interior" | "Exterior">("Interior");
  const [selectedAsset, setSelectedAsset] = useState<ArchAssetItem | null>(null);
  const [cartIds,       setCartIds]       = useState<Set<string>>(new Set());
  const videoCardRef = useRef<HTMLVideoElement>(null);

  const filteredAssets = ALL_ARCH_ASSETS.filter(a => a.category === browseTab);
  const cartItems      = ALL_ARCH_ASSETS.filter(a => cartIds.has(a.id));
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

  function handleSelectAsset(asset: ArchAssetItem) {
    setSelectedAsset(asset);
    if (!ownedAssetIds.has(asset.id)) {
      setCartIds(prev => new Set([...prev, asset.id]));
    }
    setBrowseOpen(false);
  }

  return (
    <>
      <section className="archBuySection">

        {/* Left background — blank for now */}
        <div className="archBuyBgLeft">
          <div className="archBuyBgPlaceholder" />
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
                className={"archBuyBtn" + (cartItems.length === 0 ? " archBuyBtnDisabled" : "")}
                disabled={cartItems.length === 0}
                onClick={() => {}}
                title={cartItems.length === 0 ? "Select assets first" : `Buy ${cartItems.length} item${cartItems.length > 1 ? "s" : ""}`}
              >
                {cartItems.length > 0 ? `BUY (${cartItems.length})` : "BUY"}
              </button>
              <button className="archBrowseBtn" onClick={() => setBrowseOpen(true)}>Browse</button>
            </div>
          </div>

          {/* Bundle bar */}
          {cartItems.length >= 2 && (
            <div className="archBundleBar">
              <div className="archBundleBarLeft">
                <span className="archBundleTag">{discountLabel(cartItems.length)}</span>
                <span className="archBundleInfo">Bundle — {cartItems.length} items</span>
              </div>
              <div className="archBundleBarRight">
                {discountAmount > 0 && (
                  <span className="archBundleSaving">−{fmt(discountAmount)}</span>
                )}
                <span className="archBundleTotal">{fmt(finalTotal)}</span>
              </div>
            </div>
          )}

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

          {/* Two preview cards */}
          <div className="archBuyCards">
            <div className="archBuyCard">
              <div className="archBuyCardInner">
                <span className="archBuyCardIcon">🏠</span>
                <p className="archBuyCardLabel">Architecture render here</p>
              </div>
            </div>
            <div className="archBuyCard">
              {selectedAsset ? (
                <video
                  ref={videoCardRef}
                  src={selectedAsset.videoSrc}
                  className="archBuyCardVideo"
                  autoPlay muted loop playsInline
                />
              ) : (
                <div className="archBuyCardInner">
                  <span className="archBuyCardIcon">🎬</span>
                  <p className="archBuyCardLabel">Preview animation here</p>
                </div>
              )}
            </div>
          </div>
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
                    onClick={() => setBrowseTab(tab)}
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

            <div className="archModalList">
              {filteredAssets.length === 0 ? (
                <div className="archModalEmpty">
                  <span className="archModalEmptyIcon">🏗️</span>
                  <p className="archModalEmptyText">Assets coming soon</p>
                  <p className="archModalEmptySub">Interior & Exterior catalog is being built.</p>
                </div>
              ) : (
                filteredAssets.map(asset => {
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
                        <video src={asset.videoSrc} autoPlay muted loop playsInline className="archModalThumbVideo" />
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
                })
              )}
            </div>

            <div className="archModalFooter">
              <div className="archModalFooterLeft">
                <p className="archModalFooterNote">
                  {cartItems.length === 0 ? "Select assets to build a bundle" : `${cartItems.length} item${cartItems.length > 1 ? "s" : ""} selected`}
                </p>
                {cartItems.length === 1 && (
                  <p className="archModalBundleHint">Add 1 more for 5% bundle discount</p>
                )}
                {cartItems.length >= 2 && discountRate > 0 && (
                  <p className="archModalBundleHint archModalBundleHintActive">
                    {discountLabel(cartItems.length)} applied — saving {fmt(discountAmount)}
                  </p>
                )}
              </div>
              {cartItems.length > 0 && (
                <button className="archModalBuyBtn">
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
