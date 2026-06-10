// SystemsClient — Ultra-premium dark carousel card design.
// Animated conic border, DM Mono labels, Instrument Serif price,
// Configure button opens DemoModal with add-on selector and Schedule Appointment CTA.
// InlineCheckout removed — systems use appointment-first consultation flow.

"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import "./systems.css";
import AppointmentModal from "./AppointmentModal";

/* ─── Types ──────────────────────────────────────────────────────────── */
interface AddonItem {
  id: string; label: string; desc: string;
  price: number; category: string; weeks: number;
}
interface DesignTierItem {
  id: string; name: string; slug: string; tagline: string;
  priceModifier: number; demoVideoUrl: string | null; liveUrl: string | null; sortOrder: number;
}
interface SystemItem {
  id: string; name: string; tag: string; accent: string;
  description: string; basePrice: number; timeline: string;
  features: string[];
  demoVideoUrl: string | null; bgVideoUrl: string | null; owned: boolean; addons: AddonItem[];
  displayStatus: string; // "visible" | "coming_soon" | "ongoing" | "hidden"
  designTiers: DesignTierItem[];
}
interface Props {
  items: SystemItem[];
  buyerEmail:        string;
  buyerName:         string;
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

/* ─── buildDriveEmbedUrl ─────────────────────────────────────────────────
   Converts any Google Drive share/view link into the /preview embed format.
   Handles: /file/d/FILE_ID/view, /file/d/FILE_ID/edit, open?id=FILE_ID,
   and already-converted /preview links. Returns the original URL unchanged
   if no Drive file ID can be extracted.
─────────────────────────────────────────────────────────────────────── */
function buildDriveEmbedUrl(url: string): string {
  // Already a /preview URL — return as-is
  if (url.includes("drive.google.com/file/d/") && url.includes("/preview")) return url;

  // Extract file ID from /file/d/FILE_ID/...
  const filePathMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (filePathMatch) return `https://drive.google.com/file/d/${filePathMatch[1]}/preview`;

  // Extract file ID from open?id=FILE_ID
  const openIdMatch = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (openIdMatch) return `https://drive.google.com/file/d/${openIdMatch[1]}/preview`;

  // Fallback — return original URL unchanged
  return url;
}

/* ─── Demo Modal ─────────────────────────────────────────────────────── */
function DemoModal({ item, buyerEmail, buyerName, onClose }: { item: SystemItem; buyerEmail: string; buyerName: string; onClose: () => void }) {
  const grouped = groupBy(item.addons, "category");
  const [selectedAddons,   setSelectedAddons]   = useState<Record<string, boolean>>({});
  const [appointmentOpen,  setAppointmentOpen]  = useState(false);
  // Design tier selection — default to first tier (index 0) if tiers exist
  const [selectedTierIdx,  setSelectedTierIdx]  = useState<number>(0);
  const activeTier = item.designTiers?.[selectedTierIdx] ?? null;
  const tierPriceBonus = activeTier?.priceModifier ?? 0;

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
  const totalPrice      = item.basePrice + addonsTotal + tierPriceBonus;
  const addonWeeksExtra = Math.round(selectedList.length * 0.3 * 2) / 2;
  const [baseMin, baseMax] = item.timeline
    ? item.timeline.replace(" weeks","").split("–").map(Number)
    : [6, 8];
  const deliveryEstimate = item.timeline
    ? `${baseMin + addonWeeksExtra}–${baseMax + addonWeeksExtra} weeks`
    : "";

  return (
    <>
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
              {/* ── Design Tier Selector ── shown only for systems with website tiers */}
              {item.designTiers?.length > 0 && (
                <div className="demoDesignTiers">
                  <p className="demoModalSectionLabel">Website Design Style</p>
                  <div className="demoDesignTierGrid">
                    {item.designTiers.map((tier, idx) => {
                      const isActive = selectedTierIdx === idx;
                      return (
                        <button
                          key={tier.id}
                          className={"demoDesignTierCard" + (isActive ? " demoDesignTierCardActive" : "")}
                          style={isActive ? { borderColor: item.accent, background: item.accent + "12" } : {}}
                          onClick={() => setSelectedTierIdx(idx)}
                        >
                          <div className="demoDesignTierTop">
                            <span className="demoDesignTierName" style={isActive ? { color: item.accent } : {}}>{tier.name}</span>
                            {tier.priceModifier > 0 && (
                              <span className="demoDesignTierPrice" style={{ color: item.accent }}>+{fmt(tier.priceModifier)}</span>
                            )}
                            {tier.priceModifier === 0 && (
                              <span className="demoDesignTierPriceIncluded">Included</span>
                            )}
                          </div>
                          {tier.tagline && (
                            <p className="demoDesignTierTagline">{tier.tagline}</p>
                          )}
                          {isActive && (
                            <div className="demoDesignTierCheck" style={{ background: item.accent }}>
                              <svg width="9" height="9" viewBox="0 0 10 10" fill="none">
                                <path d="M2 5l2.5 2.5L8 3" stroke="#000" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                  {/* Live demo link for selected tier */}
                  {activeTier?.liveUrl && (
                    <a
                      href={activeTier.liveUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="demoDesignTierLiveLink"
                      style={{ borderColor: item.accent + "44", color: item.accent }}
                    >
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/>
                        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                      </svg>
                      View Live Demo — {activeTier.name}
                    </a>
                  )}
                </div>
              )}

              <p className="demoModalSectionLabel">Walkthrough Video</p>
              <div className="demoModalVideoWrap">
                {item.demoVideoUrl ? (
                  <iframe
                    src={buildDriveEmbedUrl(item.demoVideoUrl)}
                    className="demoModalDriveEmbed"
                    allow="autoplay"
                    allowFullScreen
                    title={`${item.name} demo`}
                  />
                ) : (
                  <div className="demoModalPlaceholder">
                    <span className="demoModalPlaceholderIcon">🎬</span>
                    <p className="demoModalPlaceholderText">Demo coming soon</p>
                    <p className="demoModalPlaceholderSub">Video available once the system is delivered.</p>
                  </div>
                )}
              </div>
              {/* Watch on Drive fallback — shown only when a demo URL exists */}
              {item.demoVideoUrl && (
                <a
                  href={item.demoVideoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="demoModalDriveLink"
                  style={{ borderColor: item.accent + "44", color: item.accent }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                    <polyline points="15 3 21 3 21 9"/>
                    <line x1="10" y1="14" x2="21" y2="3"/>
                  </svg>
                  Watch on Google Drive
                </a>
              )}

              {/* Live price + delivery */}
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
                    {(addonsTotal + tierPriceBonus) > 0 && (
                      <span className="demoModalMetaExtra"> +{fmt(addonsTotal + tierPriceBonus)}</span>
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

              {/* CTA — Schedule Appointment */}
              <div className="demoModalCta">
                {item.owned ? (
                  <span className="demoModalOwned">✓ You own this system</span>
                ) : (
                  <button
                    className="demoModalBuyBtn"
                    onClick={() => setAppointmentOpen(true)}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: "0.5rem" }}>
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                    </svg>
                    Schedule Appointment — {fmt(totalPrice)}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Appointment modal — rendered outside the demo modal overlay */}
      {appointmentOpen && (
        <AppointmentModal
          item={item}
          totalPrice={totalPrice}
          buyerEmail={buyerEmail}
          buyerName={buyerName}
          selectedAddons={selectedList.map(a => ({ id: a.id, label: a.label, price: a.price }))}
          selectedTier={activeTier ? { name: activeTier.name, priceModifier: activeTier.priceModifier } : null}
          onClose={() => setAppointmentOpen(false)}
        />
      )}
    </>
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
  // displayStatus controls what's shown on the card
  const isComingSoon = item.displayStatus === "coming_soon";
  const isOngoing    = item.displayStatus === "ongoing";
  const isLocked     = isComingSoon || isOngoing; // disable buy/configure when locked

  return (
    <div
      className={"vSysCarouselCard" + (isActive ? " vSysCarouselCardActive" : "") + (isLocked ? " vSysCarouselCardLocked" : "")}
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
              {onToggleWishlist && !isLocked && (
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
              {/* displayStatus badge */}
              {isComingSoon && (
                <span className="vSysCardStatusBadge vSysCardStatusBadgeComingSoon">Coming Soon</span>
              )}
              {isOngoing && (
                <span className="vSysCardStatusBadge vSysCardStatusBadgeOngoing">In Development</span>
              )}
              {!isLocked && (
                <span
                  className="vSysCardDeployBadge"
                  style={{ color: item.accent, borderColor: item.accent + "44", background: item.accent + "12" }}
                >
                  WEB / IIS
                </span>
              )}
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

        {/* Browser preview mockup — hidden when locked */}
        {!isLocked && (
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
        )}

        {/* Locked placeholder — shown instead of preview when coming_soon or ongoing */}
        {isLocked && (
          <div className="vSysCardLockedPreview" style={{ borderColor: item.accent + "22" }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={item.accent} strokeWidth="1.2" strokeLinecap="round" opacity="0.4">
              {isComingSoon
                ? <><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>
                : <><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></>
              }
            </svg>
            <p className="vSysCardLockedLabel" style={{ color: item.accent + "99" }}>
              {isComingSoon ? "Launching soon" : "Currently in development"}
            </p>
          </div>
        )}

        {/* Price + buttons */}
        <div className="vSysCardFooter">
          <div className="vSysCardPriceBlock">
            <span className="vSysCardPriceLabel">Starts at</span>
            <span className="vSysCardPrice" style={{ color: item.accent }}>{fmt(item.basePrice)}</span>
            <span className="vSysCardPriceSub">one-time license</span>
          </div>
          <div className="vSysCardBtns">
            {isLocked ? (
              <span className="vSystemBtn vSystemBtnLocked">
                {isComingSoon ? "Coming Soon" : "In Development"}
              </span>
            ) : (
              <>
                <button
                  className="vSystemBtn vSystemBtnGhost"
                  onClick={e => { e.stopPropagation(); if (isActive) onPreviewClick(); }}
                >
                  Configure
                </button>
                {item.owned && (
                  <span className="vSystemBtn vSystemBtnOwned">✓ Owned</span>
                )}
              </>
            )}
          </div>
        </div>

        {/* Payment terms — only show when purchasable */}
        {!isLocked && (
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
        )}

        {/* Policy */}
        {!isLocked && (
          <div className="vSysCardPolicy">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}>
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
            Live demo access granted before purchase. Full source code ownership transferred upon completion.
          </div>
        )}

      </div>
    </div>
  );
}

/* ─── Main ───────────────────────────────────────────────────────────── */
export default function SystemsClient({ items, buyerEmail, buyerName, wishlistIds, onToggleWishlist }: Props) {
  const [modalItem,   setModalItem]   = useState<SystemItem | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const vpRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  const CARD_W = 400;
  const GAP    = 28;
  const total  = items.length;

  const clamp = useCallback((i: number) => Math.max(0, Math.min(i, total - 1)), [total]);

  // goTo: update active index and scroll the card into center
  const goTo = useCallback((i: number) => {
    const idx = clamp(i);
    setActiveIndex(idx);
    const card = cardRefs.current[idx];
    const vp   = vpRef.current;
    if (!card || !vp) return;
    // Scroll so the card center aligns with the viewport center
    const vpW    = vp.offsetWidth;
    const cardW  = card.offsetWidth;
    const target = card.offsetLeft - (vpW - cardW) / 2;
    vp.scrollTo({ left: target, behavior: "smooth" });
  }, [clamp]);

  // Sync activeIndex when user manually scrolls (snap)
  useEffect(() => {
    const vp = vpRef.current;
    if (!vp) return;
    function onScroll() {
      if (!vp) return;
      const vpCenter = vp.scrollLeft + vp.offsetWidth / 2;
      let closest = 0;
      let minDist = Infinity;
      cardRefs.current.forEach((card, i) => {
        if (!card) return;
        const cardCenter = card.offsetLeft + card.offsetWidth / 2;
        const dist = Math.abs(vpCenter - cardCenter);
        if (dist < minDist) { minDist = dist; closest = i; }
      });
      setActiveIndex(closest);
    }
    vp.addEventListener("scroll", onScroll, { passive: true });
    return () => vp.removeEventListener("scroll", onScroll);
  }, []);

  // Center first card on mount
  useEffect(() => {
    goTo(0);
  }, []);

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
          >
            <div className="vSysCarouselTrack">
              {items.map((item, index) => (
                <div
                  key={item.id}
                  ref={(el: HTMLDivElement | null) => { cardRefs.current[index] = el; }}
                  className="vSysCarouselSnapItem"
                >
                  <SystemCard
                    item={item}
                    index={index}
                    isActive={index === activeIndex}
                    onClick={() => goTo(index)}
                    onPreviewClick={() => setModalItem(item)}
                    isWishlisted={wishlistIds?.has(item.id) ?? false}
                    onToggleWishlist={onToggleWishlist}
                  />
                </div>
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

      {modalItem && <DemoModal item={modalItem} buyerEmail={buyerEmail} buyerName={buyerName} onClose={() => setModalItem(null)} />}
    </div>
  );
}