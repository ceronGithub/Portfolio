// SystemsClient — Ultra-premium dark carousel card design.
// Animated conic border, DM Mono labels, Instrument Serif price,
// shine sweep Buy Now, staggered feature list, browser preview mockup.

"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Link from "next/link";
import "./systems.css";

/* ─── Types ──────────────────────────────────────────────────────────── */
interface AddonItem {
  id: string; label: string; desc: string;
  price: number; category: string; weeks: number;
}
interface SystemItem {
  id: string; name: string; tag: string; accent: string;
  description: string; basePrice: number; timeline: string;
  features: string[];
  demoVideoUrl: string | null; bgVideoUrl: string | null; owned: boolean; addons: AddonItem[];
}
interface Props {
  items: SystemItem[];
  wishlistIds?:      Set<string>;
  onToggleWishlist?: (id: string) => void;
}

const fmt = (p: number) =>
  "₱" + p.toLocaleString("en-PH", { minimumFractionDigits: 0 });

function groupBy<T>(arr: T[], key: keyof T): Record<string, T[]> {
  return arr.reduce((acc, item) => {
    const k = String(item[key]);
    (acc[k] ??= []).push(item);
    return acc;
  }, {} as Record<string, T[]>);
}

/* ─── Demo Modal ─────────────────────────────────────────────────────── */
function DemoModal({ item, onClose }: { item: SystemItem; onClose: () => void }) {
  const grouped = groupBy(item.addons, "category");
  const [selectedAddons, setSelectedAddons] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [onClose]);

  function toggleAddon(id: string) {
    setSelectedAddons(prev => ({ ...prev, [id]: !prev[id] }));
  }

  // Live computed values
  const selectedList    = item.addons.filter(a => selectedAddons[a.id]);
  const addonsTotal     = selectedList.reduce((s, a) => s + a.price, 0);
  const totalPrice      = item.basePrice + addonsTotal;
  const addonWeeksExtra = Math.round(selectedList.length * 0.3 * 2) / 2;
  const [baseMin, baseMax] = item.timeline
    ? item.timeline.replace(" weeks","").split("–").map(Number)
    : [6, 8];
  const deliveryEstimate = item.timeline
    ? `${baseMin + addonWeeksExtra}–${baseMax + addonWeeksExtra} weeks`
    : "";

  return (
    <div className="demoModalOverlay" onClick={onClose}>
      <div className="demoModal demoModalWide" onClick={e => e.stopPropagation()}>
        <div className="demoModalHeader">
          <div className="demoModalHeaderLeft">
            <span
              className="demoModalTag"
              style={{ color: item.accent, borderColor: item.accent + "44", background: item.accent + "12" }}
            >
              {item.tag}
            </span>
            <p className="demoModalTitle">{item.name}</p>
          </div>
          <button className="demoModalClose" onClick={onClose}>✕</button>
        </div>
        <div className="demoModalBody">
          <div className="demoModalLeft">
            <p className="demoModalSectionLabel">Walkthrough Video</p>
            <div className="demoModalVideoWrap">
              {item.demoVideoUrl ? (
                <video src={item.demoVideoUrl} controls autoPlay className="demoModalVideo" />
              ) : (
                <div className="demoModalPlaceholder">
                  <span className="demoModalPlaceholderIcon">🎬</span>
                  <p className="demoModalPlaceholderText">Demo coming soon</p>
                  <p className="demoModalPlaceholderSub">Video available once the system is delivered.</p>
                </div>
              )}
            </div>

            {/* Live price + delivery — updates as addons are toggled */}
            <div className="demoModalMeta">
              {item.timeline && (
                <div className="demoModalMetaItem">
                  <span className="demoModalMetaLabel">Est. Delivery</span>
                  <span className="demoModalMetaValue" style={{ color: item.accent }}>
                    {deliveryEstimate}
                    {addonWeeksExtra > 0 && (
                      <span className="demoModalMetaExtra"> (+{addonWeeksExtra}w)</span>
                    )}
                  </span>
                </div>
              )}
              <div className="demoModalMetaItem">
                <span className="demoModalMetaLabel">Total Price</span>
                <span className="demoModalMetaValue" style={{ color: item.accent }}>
                  {fmt(totalPrice)}
                  {addonsTotal > 0 && (
                    <span className="demoModalMetaExtra"> +{fmt(addonsTotal)}</span>
                  )}
                </span>
              </div>
            </div>

            {/* Selected addons summary */}
            {selectedList.length > 0 && (
              <div className="demoModalSelectedSummary">
                <p className="demoModalSectionLabel" style={{ marginBottom: "0.5rem" }}>Selected Add-ons</p>
                {selectedList.map(a => (
                  <div key={a.id} className="demoModalSelectedItem">
                    <span>{a.label}</span>
                    <span style={{ color: item.accent }}>+{fmt(a.price)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="demoModalRight">
            <p className="demoModalSectionLabel">Available Add-ons — click to select</p>
            {item.addons.length === 0 ? (
              <p className="demoModalNoAddons">No add-ons available yet.</p>
            ) : (
              <div className="demoModalAddons">
                {Object.entries(grouped).map(([cat, addons]) => (
                  <div key={cat} className="demoModalAddonGroup">
                    <p className="demoModalAddonCat" style={{ color: item.accent }}>{cat}</p>
                    {addons.map(a => {
                      const isOn = !!selectedAddons[a.id];
                      return (
                        <button
                          key={a.id}
                          className={"demoModalAddonRow demoModalAddonRowBtn" + (isOn ? " demoModalAddonRowOn" : "")}
                          style={isOn ? { borderColor: item.accent + "55", background: item.accent + "0e" } : {}}
                          onClick={() => toggleAddon(a.id)}
                        >
                          <div className="demoModalAddonCheck" style={isOn ? { background: "#22c55e", borderColor: "#22c55e" } : {}}>
                            {isOn && (
                              <svg width="9" height="9" viewBox="0 0 10 10" fill="none">
                                <path d="M2 5l2.5 2.5L8 3" stroke="#000" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            )}
                          </div>
                          <div className="demoModalAddonInfo">
                            <span className="demoModalAddonLabel">{a.label}</span>
                            {a.desc && <span className="demoModalAddonDesc">{a.desc}</span>}
                          </div>
                          <span className="demoModalAddonPrice" style={{ color: isOn ? "#22c55e" : item.accent }}>+{fmt(a.price)}</span>
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
            )}
            <div className="demoModalCta">
              {item.owned ? (
                <span className="demoModalOwned">✓ You own this system</span>
              ) : (
                <Link href={`/checkout/${item.id}`} className="demoModalBuyBtn">
                  Buy Now — {fmt(totalPrice)}
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Card ───────────────────────────────────────────────────────────── */
function SystemCard({
  item, index, isActive, onClick, onPreviewClick, isWishlisted, onToggleWishlist,
}: {
  item: SystemItem; index: number; isActive: boolean;
  onClick: () => void; onPreviewClick: () => void;
  isWishlisted?: boolean; onToggleWishlist?: (id: string) => void;
}) {
  return (
    <div
      className={"vSysCarouselCard" + (isActive ? " vSysCarouselCardActive" : "")}
      style={{ "--acc": item.accent } as React.CSSProperties}
      onClick={() => !isActive && onClick()}
    >
      <div className="vSysCardInner">
        <div className="vSysCardPad">

          {/* Top row */}
          <div className="vSysCardTopRow">
            <span className="vSysCardNum">{String(index + 1).padStart(2, "0")}</span>
            <div className="vSysCardTopRight">
              {/* Wishlist heart */}
              {onToggleWishlist && (
                <button
                  className={"vSysCardWishlistBtn" + (isWishlisted ? " vSysCardWishlistBtnActive" : "")}
                  onClick={e => { e.stopPropagation(); onToggleWishlist(item.id); }}
                  aria-label={isWishlisted ? "Remove from wishlist" : "Save to wishlist"}
                  title={isWishlisted ? "Remove from wishlist" : "Save to wishlist"}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill={isWishlisted ? "#e55" : "none"} stroke={isWishlisted ? "#e55" : "currentColor"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                  </svg>
                </button>
              )}
              <span
                className="vSysCardDeployBadge"
                style={{ color: item.accent, borderColor: item.accent + "44", background: item.accent + "12" }}
              >
                WEB / IIS
              </span>
            </div>
          </div>

          {/* Tag + title */}
          <span className="vSysCardTag" style={{ color: item.accent }}>{item.tag}</span>
          <h3 className="vSysCardTitle">{item.name}</h3>
          <p className="vSysCardDesc">{item.description}</p>

          {/* Delivery pill */}
          {item.timeline && (
            <div className="vSysCardTimeline">
              <div className="vSysCardTimelineDot" style={{ background: item.accent }} />
              Est. delivery · {item.timeline}
            </div>
          )}

          {/* Features */}
          {item.features.length > 0 && (
            <ul className="vSysCardFeatures">
              {item.features.map((f, i) => (
                <li key={i} className="vSysCardFeatureItem">
                  <span className="vSysCardFeatureDot" style={{ background: item.accent }} />
                  {f}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Browser preview mockup */}
        <div className="vSysCardPreview" onClick={e => { e.stopPropagation(); if (isActive) onPreviewClick(); }}>
          <div className="vSysCardPreviewBg" />
          <div className="vSysCardPreviewGrid" />
          <div className="vSysCardBrowserBar">
            <div className="vSysCardBrowserDot" style={{ background: "#ff5f57" }} />
            <div className="vSysCardBrowserDot" style={{ background: "#febc2e" }} />
            <div className="vSysCardBrowserDot" style={{ background: "#28c840" }} />
          </div>
          <div className="vSysCardPreviewScan" />
          <div className="vSysCardPreviewCenter">
            <div className="vSysCardPlayBtn">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={item.accent} strokeWidth="2">
                <polygon points="5 3 19 12 5 21 5 3" fill={item.accent} stroke="none"/>
              </svg>
            </div>
            <span className="vSysCardPreviewLabel">Watch Live Preview</span>
          </div>
        </div>

        {/* Price + buttons */}
        <div className="vSysCardFooter">
          <div className="vSysCardPriceBlock">
            <span className="vSysCardPriceLabel">Starts at</span>
            <span className="vSysCardPrice" style={{ color: item.accent }}>{fmt(item.basePrice)}</span>
            <span className="vSysCardPriceSub">one-time license</span>
          </div>
          <div className="vSysCardBtns">
            <button
              className="vSystemBtn vSystemBtnGhost"
              onClick={e => { e.stopPropagation(); if (isActive) onPreviewClick(); }}
            >
              Preview Demo
            </button>
            {item.owned ? (
              <span className="vSystemBtn vSystemBtnOwned">✓ Owned</span>
            ) : (
              <Link
                href={`/checkout/${item.id}`}
                className="vSystemBtn vSystemBtnGreen"
                style={{ background: item.accent }}
                onClick={e => e.stopPropagation()}
              >
                Buy Now →
              </Link>
            )}
          </div>
        </div>

        {/* Payment terms */}
        <div className="vSysCardTermsRow">
          <div className="vSysCardTerm">
            <span className="vSysCardTermNum" style={{ color: item.accent }}>30%</span>
            <span className="vSysCardTermLabel">downpayment</span>
          </div>
          <div className="vSysCardTermDivider" />
          <div className="vSysCardTerm">
            <span className="vSysCardTermNum" style={{ color: item.accent }}>70%</span>
            <span className="vSysCardTermLabel">on delivery</span>
          </div>
          <div className="vSysCardTermDivider" />
          <div className="vSysCardTerm">
            <span className="vSysCardTermNum" style={{ color: item.accent }}>100%</span>
            <span className="vSysCardTermLabel">source code</span>
          </div>
        </div>

        {/* Policy */}
        <div className="vSysCardPolicy">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}>
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
          Live demo access granted before purchase. Full source code ownership transferred upon completion.
        </div>

      </div>
    </div>
  );
}

/* ─── Main ───────────────────────────────────────────────────────────── */
export default function SystemsClient({ items, wishlistIds, onToggleWishlist }: Props) {
  const [modalItem,   setModalItem]   = useState<SystemItem | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isDragging,  setIsDragging]  = useState(false);
  const [dragStartX,  setDragStartX]  = useState(0);
  const [dragDelta,   setDragDelta]   = useState(0);
  const vpRef    = useRef<HTMLDivElement>(null);
  const [vpWidth, setVpWidth] = useState(0);

  const CARD_W = 400;
  const GAP    = 28;
  const total  = items.length;

  useEffect(() => {
    const update = () => { if (vpRef.current) setVpWidth(vpRef.current.offsetWidth); };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const clamp = useCallback((i: number) => Math.max(0, Math.min(i, total - 1)), [total]);
  const goTo  = useCallback((i: number) => setActiveIndex(clamp(i)), [clamp]);

  const centerOffset = (vpWidth - CARD_W) / 2;
  const translateX   = centerOffset - activeIndex * (CARD_W + GAP) + dragDelta;

  function onMouseDown(e: React.MouseEvent) { setIsDragging(true); setDragStartX(e.clientX); setDragDelta(0); }
  function onMouseMove(e: React.MouseEvent) { if (!isDragging) return; setDragDelta(e.clientX - dragStartX); }
  function onMouseUp() {
    if (!isDragging) return;
    setIsDragging(false);
    if (dragDelta < -60) goTo(activeIndex + 1);
    else if (dragDelta > 60) goTo(activeIndex - 1);
    setDragDelta(0);
  }
  function onTouchStart(e: React.TouchEvent) { setDragStartX(e.touches[0].clientX); setDragDelta(0); }
  function onTouchEnd(e: React.TouchEvent) {
    const d = e.changedTouches[0].clientX - dragStartX;
    if (d < -60) goTo(activeIndex + 1); else if (d > 60) goTo(activeIndex - 1);
    setDragDelta(0);
  }

  const activeBgVideo = items[activeIndex]?.bgVideoUrl ?? null;

  return (
    <div className="systemsPageBuyer">

      <section id="systems" className="systemsBuyerSection">

        {/* ── Section background video — scoped inside systemsBuyerSection ── */}
        <div className={"systemsPageBgVideoWrap" + (activeBgVideo ? " systemsPageBgVideoWrapVisible" : "")}>
          {activeBgVideo && (
            <video
              key={activeBgVideo}
              src={activeBgVideo}
              autoPlay
              muted
              loop
              playsInline
              className="systemsPageBgVideo"
            />
          )}
          <div className="systemsPageBgVideoOverlay" />
        </div>

        <div className="systemsBuyerHeader">
          <p className="systemsBuyerLabel">Available Systems</p>
          <h2 className="systemsBuyerTitle">Choose your system.</h2>
          <p className="systemsBuyerSub">One-time payment. No subscriptions. Yours forever.</p>
        </div>

        <div className="vSysCarouselWrap">
          <div
            ref={vpRef}
            className="vSysCarouselViewport"
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseUp}
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
          >
            <div
              className="vSysCarouselTrack"
              style={{
                transform:  `translate3d(${translateX}px, 0, 0)`,
                transition: isDragging ? "none" : "transform 0.48s cubic-bezier(0.25,1,0.5,1)",
              }}
            >
              {items.map((item, index) => (
                <SystemCard
                  key={item.id}
                  item={item}
                  index={index}
                  isActive={index === activeIndex}
                  onClick={() => goTo(index)}
                  onPreviewClick={() => setModalItem(item)}
                  isWishlisted={wishlistIds?.has(item.id) ?? false}
                  onToggleWishlist={onToggleWishlist}
                />
              ))}
            </div>
          </div>

          <div className="vSysCarouselControls">
            <button className="vSysCarouselArrow" onClick={() => goTo(activeIndex - 1)} disabled={activeIndex === 0} aria-label="Previous">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 3L5 8L10 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
            <div className="vSysCarouselDots">
              {items.map((item, i) => (
                <button
                  key={i}
                  className={"vSysCarouselDot" + (i === activeIndex ? " vSysCarouselDotActive" : "")}
                  style={i === activeIndex ? { background: item.accent, boxShadow: `0 0 8px ${item.accent}88` } : {}}
                  onClick={() => goTo(i)}
                  aria-label={`Go to card ${i + 1}`}
                />
              ))}
            </div>
            <button className="vSysCarouselArrow" onClick={() => goTo(activeIndex + 1)} disabled={activeIndex === total - 1} aria-label="Next">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M6 3L11 8L6 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
          </div>
          <p className="vSysCarouselCount">{activeIndex + 1} / {total}</p>
        </div>

      </section>

      {modalItem && <DemoModal item={modalItem} onClose={() => setModalItem(null)} />}
    </div>
  );
}