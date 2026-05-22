// ArchitectureBuySection — Interior / Exterior buying section.
// Preview cards removed. Selected asset video plays as section background.
// Browse → Select → video fills the left bg of the section.

"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useToast }  from "../shared/useToast";
import ToastStack    from "../shared/ToastStack";
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
  // Pushes selected IDs into the global CartDrawer
  onAddToCart?: (ids: string[]) => void;
  onRegisterAddToCart?: (fn: (ids: string[]) => void) => void;
}

const GD = (id: string) => `/api/drive-video?id=${id}`;

const ALL_ARCH_ASSETS: ArchAssetItem[] = [
  // ── Exterior ──
  { id:"ext-drone-01", label:"Drone Reveal 01",  category:"Exterior", videoSrc:GD("1QKCGiJCNzSbpkVsQPN073ws6WbZMwrZC"), price:8500 },
  { id:"ext-drone-02", label:"Drone Reveal 02",  category:"Exterior", videoSrc:GD("1hIAB7FrCEnn8cfrGSCplccHkZ4Gonnxu"), price:8500 },
  { id:"ext-proj-01",  label:"Project 01",        category:"Exterior", videoSrc:GD("1kp23x5YBnWovDamPDT2FS00d1ID9SB0k"), price:8500 },
  { id:"ext-proj-02",  label:"Project 02",        category:"Exterior", videoSrc:GD("10CfcifgZBQMoxK2L_ANH8TJ8vUj7v26T"), price:8500 },
  { id:"ext-proj-03",  label:"Project 03",        category:"Exterior", videoSrc:GD("1uK7a0BedMTfGWeZ17WxJt-YYKAJL3bZJ"), price:8500 },
  { id:"ext-proj-04",  label:"Project 04",        category:"Exterior", videoSrc:GD("1On-oICTEgx81tNSRyW7DZYk3IOEDBiAT"), price:8500 },
  // ── Interior ──
  { id:"int-01", label:"Interior 01 — Suite",    category:"Interior", videoSrc:GD("16IlbksfqFgAsIUlIbSnfG1k0miktYC0d"), price:7500 },
  { id:"int-02", label:"Interior 02 — Living",   category:"Interior", videoSrc:GD("1cHTTgKBilMBXIrIGuSqB2tAb4A9WdobJ"), price:7500 },
  { id:"int-03", label:"Interior 03 — Kitchen",  category:"Interior", videoSrc:GD("1A9sgWrWpi_Jq2NWZIH5mkh2XP491_2Ce"), price:7500 },
  { id:"int-04", label:"Interior 04 — Bedroom",  category:"Interior", videoSrc:GD("1sr1O1HBL-q0oFZ2mfhgI3Zf3Y_AWmOzl"), price:7500 },
  { id:"int-05", label:"Interior 05 — Lobby",    category:"Interior", videoSrc:GD("1wQtULgqst4SX2imqwdEhnqYRgzcPWJiu"), price:7500 },
  { id:"int-06", label:"Interior 06 — Office",   category:"Interior", videoSrc:GD("1iqOFR1-0gO4v-Wk7PzBKZ2TsSeL0qoOW"), price:7500 },
  { id:"int-07", label:"Interior 07 — Luxury",   category:"Interior", videoSrc:GD("1p34uCYAykKSH9c5fHXh1PuRn_S5XS3sG"), price:7500 },
];

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
}: Props) {
  const [browseOpen,    setBrowseOpen]    = useState(false);
  const [browseTab,     setBrowseTab]     = useState<"Interior" | "Exterior">("Interior");
  const [selectedAsset, setSelectedAsset] = useState<ArchAssetItem | null>(null);
  const [cartIds,       setCartIds]       = useState<Set<string>>(new Set());
  const [cycleIndex,    setCycleIndex]    = useState(0);
  const [bgSrc,         setBgSrc]         = useState<string>("");
  const { toasts, showToast, dismissToast } = useToast();
  const bgVideoRef = useRef<HTMLVideoElement>(null);

  const filteredAssets = ALL_ARCH_ASSETS.filter(a => a.category === browseTab);
  const cartItems      = ALL_ARCH_ASSETS.filter(a => cartIds.has(a.id));
  const rawTotal       = cartItems.reduce((sum, a) => sum + a.price, 0);
  const discountRate   = getBundleDiscount(cartItems.length);
  const discountAmount = Math.round(rawTotal * discountRate);
  const finalTotal     = rawTotal - discountAmount;

  // Step 1 — derive bgSrc from cartIds + cycleIndex
  useEffect(() => {
    const items = ALL_ARCH_ASSETS.filter(a => cartIds.has(a.id));
    if (items.length === 0) { setBgSrc(""); return; }
    setBgSrc(items[cycleIndex % items.length].videoSrc);
  }, [cartIds, cycleIndex]);

  // Step 2 — play the video whenever bgSrc changes
  useEffect(() => {
    const video = bgVideoRef.current;
    if (!video || !bgSrc) return;
    video.load();
    video.play().catch(() => {});
  }, [bgSrc]);

  // Register addToCartMany so parent (e.g. WishlistPanel) can populate this cart externally
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
  }

  return (
    <>
      <section className="archBuySection">

        {/* Left background — cycles through all selected asset videos */}
        <div className="archBuyBgLeft">
          {bgSrc ? (
            <video
              ref={bgVideoRef}
              src={bgSrc}
              className="archBuyBgVideo"
              muted playsInline
              loop={cartItems.length === 1}
              onEnded={cartItems.length > 1 ? () => setCycleIndex(prev => prev + 1) : undefined}
            />
          ) : (
            <div className="archBuyBgPlaceholder" />
          )}
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
                  const ids = cartItems.map(a => a.id).join(",");
                  window.location.href = `/checkout/bundle?ids=${ids}`;
                }}
              >
                {cartItems.length > 0 ? `BUY (${cartItems.length})` : "BUY"}
              </button>
              <button className="archBrowseBtn" onClick={() => setBrowseOpen(true)}>Browse</button>
            </div>
          </div>

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
                  {cartItems.length === 0 ? "Select assets to add to cart" : `${cartItems.length} item${cartItems.length > 1 ? "s" : ""} selected`}
                </p>
              </div>
              <button
                className={"archModalAddCartBtn" + (cartItems.length === 0 ? " archModalAddCartBtnDisabled" : "")}
                disabled={cartItems.length === 0}
                onClick={() => {
                  if (cartItems.length === 0) return;
                  // Push selected IDs to global CartDrawer
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