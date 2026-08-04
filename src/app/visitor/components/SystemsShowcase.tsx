/**
 * FILE: visitor/components/SystemsShowcase.tsx
 * ROLE: Visitor — public, no auth required
 *
 * PURPOSE:
 * The "Systems" section of the landing page: the informational
 * Service Tiers cards (ServiceTiersBlock) and the interactive systems
 * carousel + pricing configurator modal (SystemsCarousel), which
 * fetches live system/add-on data from /api/systems. Extracted from
 * page.tsx — this was the single largest block in that file.
 */
"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { DesignTierEntry, ServiceTierEntry, VisitorSystemEntry } from "../lib/visitorData";

type ConfigSystem = {
  tag: string; title: string; base: number; accent: string;
  setupFee: number | null; monthlyFee: number | null;
  baseFeatures: string[];
  timeline?: string;
  designTiers: DesignTierEntry[];
};

// configuratorSystems is built from DB data at runtime in SystemsCarousel.
// The hardcoded array has been removed — all system data comes from /api/systems.
const configuratorSystems: ConfigSystem[] = [];

// Payment terms text per tier — sourced from the agreement's Section 4
// (Payment Terms — Detailed, 4A-4D). Each tier has a genuinely different
// structure, not a single "30% / 70%" split applied everywhere:
//   Tier 1 (Managed Rental)  — no deposit/balance split at all, just setup + monthly
//   Tier 2 (Full Buyout)     — 50% deposit / 50% on delivery
//   Tier 3 (Build-to-Own)    — no upfront deposit, first month starts the work
//   Tier 4 (Full Custom)     — 50% deposit / 50% on delivery
const TIER_PAYMENT_TERMS: Record<string, string> = {
  "managed-rental": "Setup fee due at signing · billed monthly on the 1st",
  "full-buyout":    "50% deposit · 50% on delivery",
  "build-to-own":   "No deposit · first month's payment starts development",
  "full-custom":    "50% deposit · 50% on delivery",
};

/* ServiceTiersBlock — informational-only cards explaining Basic/Standard/Premium
   service levels. Deliberately has no click/select behavior and no price math —
   it exists purely so visitors understand what each tier roughly covers before
   they inquire. Actual pricing math lives entirely in the configurator modal above. */
export function ServiceTiersBlock({ tiers }: { tiers: ServiceTierEntry[] }) {
  return (
    <div className="vServiceTiersWrap">
      <p className="vServiceTiersEyebrow">Service Levels — General Guide</p>
      <div className="vServiceTiersGrid">
        {tiers.map(tier => (
          <div key={tier.id} className="vServiceTierCard">
            <span className="vServiceTierName">{tier.name}</span>
            {tier.tagline && <p className="vServiceTierTagline">{tier.tagline}</p>}
            {tier.priceLabel && <p className="vServiceTierPrice">{tier.priceLabel}</p>}
            {tier.features.length > 0 && (
              <ul className="vServiceTierFeatures">
                {tier.features.map((f, i) => (
                  <li key={i} className="vServiceTierFeatureItem">
                    <span className="vServiceTierFeatureDot" />
                    {f}
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export function SystemsCarousel() {
  const [current, setCurrent] = useState(0);
  const trackRef = useRef<HTMLDivElement>(null);

  // All system data fetched from DB — replaces hardcoded systems + configuratorSystems arrays
  const [dbSystems,            setDbSystems]            = useState<VisitorSystemEntry[]>([]);
  const [dbConfigSystems,      setDbConfigSystems]      = useState<ConfigSystem[]>([]);
  const [dbServiceTiers,       setDbServiceTiers]       = useState<ServiceTierEntry[]>([]);

  const [systemsLoaded,        setSystemsLoaded]        = useState(false);

  useEffect(() => {
    // Fetch full system data from DB — price, features, addons, displayStatus all live
    fetch("/api/systems", { cache: "no-store" })
      .then(r => r.json())
      .then(data => {
        const rows: VisitorSystemEntry[] = data.systems ?? [];
        console.log("[SystemsCarousel] systems:", rows.map(s => ({ tag: s.tag, displayStatus: s.displayStatus })));

        // Set carousel systems state — was missing, causing empty carousel + no displayStatus
        setDbSystems(rows);
        setDbServiceTiers((data.serviceTiers ?? []) as ServiceTierEntry[]);



        // Build configurator modal data from DB addons
        const cfgSystems: ConfigSystem[] = rows.map(s => ({
          tag:          s.tag,
          title:        s.title,
          base:         s.basePrice,
          accent:       s.accent,
          setupFee:     s.setupFee,
          monthlyFee:   s.monthlyFee,
          timeline:     s.timeline,
          baseFeatures: s.features,
          designTiers:  (s.designTiers ?? []) as DesignTierEntry[],
        }));
        setDbConfigSystems(cfgSystems);
        setSystemsLoaded(true);
      })
      .catch(() => { setSystemsLoaded(true); });
  }, []);

  // Use DB data — fall back to empty while loading
  const activeSystems      = dbSystems;
  const activeConfigSystems = dbConfigSystems;

  // Filter out hidden systems — while loading, show empty (avoids stale flash)
  const visibleSystems = activeSystems.filter(s => s.displayStatus !== "hidden");

  const total = visibleSystems.length;

  /* ── Modal state ─────────────────────────────────────────────────── */
  const [modalSys,  setModalSys]  = useState<ConfigSystem | null>(null);
  // Design tier selection — reset to 0 when modal opens
  const [selectedTierIdx, setSelectedTierIdx] = useState<number>(0);
  const activeTier     = modalSys?.designTiers?.[selectedTierIdx] ?? null;
  const tierPriceBonus = activeTier?.priceModifier ?? 0;

  /* Open modal — match carousel system tag to DB configurator data */
  function openModal(s: VisitorSystemEntry) {
    const cfg = activeConfigSystems.find(c => c.tag === s.tag) ?? null;
    if (!cfg) return;

    setSelectedTierIdx(0);
    setModalSys(cfg);
    document.body.style.overflow = "hidden";
  }

  function closeModal() {
    setModalSys(null);
    document.body.style.overflow = "";
  }

  /* Escape key */
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") closeModal(); }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Pricing now comes straight from the selected tier's pricingType — this is
  // the real column the live DB uses, not an inferred heuristic.
  const isMonthlyTier     = activeTier?.pricingType === "monthly";
  const isInstallmentTier = activeTier?.pricingType === "installment";

  // "Total today":
  //   monthly     → the setup fee (if any) due at signing
  //   installment → the first installment (no separate deposit — Section 4C)
  //   one-time    → the tier's own basePrice if set, else system base + modifier (legacy fallback)
  const totalPrice = isMonthlyTier
    ? (activeTier?.setupFee ?? 0)
    : isInstallmentTier
    ? (activeTier?.installmentAmount ?? 0)
    : (activeTier?.basePrice ?? ((modalSys?.base ?? 0) + tierPriceBonus));

  // Package details shown below the tier selector — the selected tier's own list when it
  // has one, otherwise this system's shared feature list (covers tiers not yet filled in).
  const activeTierFeatures =
    activeTier && activeTier.features.length > 0 ? activeTier.features : (modalSys?.baseFeatures ?? []);

  /* Delivery estimate: pulled directly from system timeline */
  const [baseMinWks, baseMaxWks] = modalSys?.timeline
    ? modalSys.timeline.replace(" weeks","").split("–").map(Number)
    : [6, 8];
  const deliveryEst = `${baseMinWks}–${baseMaxWks} weeks`;

  /* Carousel navigation */
  const goTo = (idx: number) => {
    const wrapped = ((idx % total) + total) % total;
    setCurrent(wrapped);
  };

  useEffect(() => {
    if (!trackRef.current) return;
    const CARD_W = 380;
    const GAP = 24;
    trackRef.current.style.transform = `translateX(-${current * (CARD_W + GAP)}px)`;
  }, [current]);

  return (
    <>
      {/* ── Carousel ──────────────────────────────────────────────── */}
      {/* Loading skeleton while DB systems fetch completes */}
      {!systemsLoaded && (
        <div className="vSysLoadingSkeleton">
          {[1, 2, 3].map(n => (
            <div key={n} className="vSysLoadingCard" />
          ))}
        </div>
      )}
      <div className="vSysCarouselWrap" style={!systemsLoaded ? { display: "none" } : {}}>
        <div className="vSysCarouselViewport">
          <div className="vSysCarouselTrack" ref={trackRef}>
            {visibleSystems.map((s, i) => {
              const displayStatus  = s.displayStatus ?? "visible";
              const isComingSoon   = displayStatus === "coming_soon";
              const isOngoing      = displayStatus === "ongoing";
              const isLocked       = isComingSoon || isOngoing;
              return (
              <div
                key={s.tag}
                className={"vSysCarouselCard" + (i === current ? " vSysCarouselCardActive" : "") + (isLocked ? " vSysCarouselCardLocked" : "")}
                onClick={() => goTo(i)}
                style={{ "--acc": s.accent } as React.CSSProperties}
              >
                {/* Top row */}
                <div className="vSysCardTopRow">
                  <span className="vSysCardNum">{String(i + 1).padStart(2, "0")}</span>
                  <div style={{ display: "flex", gap: "0.4rem", alignItems: "center" }}>
                    {isComingSoon && (
                      <span className="vSysCardStatusBadge vSysCardStatusBadgeComingSoon">Coming Soon</span>
                    )}
                    {isOngoing && (
                      <span className="vSysCardStatusBadge vSysCardStatusBadgeOngoing">In Development</span>
                    )}
                    {!isLocked && (
                      <span className="vSysCardDeployBadge" style={{ color: s.accent, borderColor: s.accent + "40", background: s.accent + "12" }}>
                        {s.deploy}
                      </span>
                    )}
                  </div>
                </div>
                <div className="vSysCardRule" />
                <span className="vSysCardTag" style={{ color: s.accent }}>{s.tag}</span>
                <h3 className="vSysCardTitle">{s.title}</h3>
                <p className="vSysCardDesc">{s.description}</p>
                <div className="vSysCardTimeline">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
                  </svg>
                  <span>Est. delivery: <strong>{s.timeline}</strong></span>
                </div>
                <ul className="vSysCardFeatures">
                  {s.features.map((f, fi) => (
                    <li key={fi} className="vSysCardFeatureItem">
                      <span className="vSysCardFeatureDot" style={{ background: s.accent }} />
                      {f}
                    </li>
                  ))}
                </ul>

                {/* ── Locked footer — replaces pricing + button when coming_soon or ongoing ── */}
                {isLocked ? (
                  <div className="vSysCardLockedFooter" style={{ borderColor: s.accent + "28" }}>
                    <div className="vSysCardLockedFooterIcon" style={{ color: s.accent }}>
                      {isComingSoon ? (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                          <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                        </svg>
                      ) : (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                          <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
                        </svg>
                      )}
                    </div>
                    <div className="vSysCardLockedFooterText">
                      <span className="vSysCardLockedFooterLabel" style={{ color: s.accent }}>
                        {isComingSoon ? "Launching Soon" : "Currently in Development"}
                      </span>
                      <span className="vSysCardLockedFooterSub">
                        {isComingSoon ? "Pricing will be available upon launch." : "This system is being actively built. Check back soon."}
                      </span>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="vSysCardFooter">
                      <div className="vSysCardPriceBlock">
                        <span className="vSysCardPriceLabel">Starts at</span>
                        <span className="vSysCardPrice" style={{ color: s.accent }}>{"₱" + s.basePrice.toLocaleString("en-PH")}</span>
                      </div>
                      <button
                        className="vSystemBtn vSystemBtnGreen"
                        onClick={(e) => { e.stopPropagation(); openModal(s); }}
                      >
                        Configure →
                      </button>
                    </div>
                    <div className="vSysCardIncluded">
                      <div className="vSysCardIncludedItem">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                        Domain deployment included
                      </div>
                      <div className="vSysCardIncludedItem">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                        Responsive design included
                      </div>
                    </div>
                    <div className="vSysCardPolicy">
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      Live demo provided. Full access granted only upon complete payment.
                    </div>
                  </>
                )}
              </div>
              );
            })}
          </div>
        </div>

        <div className="vSysCarouselControls">
          <button className="vSysCarouselArrow" onClick={() => goTo(current - 1)} aria-label="Previous">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 3L5 8L10 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
          <div className="vSysCarouselDots">
            {visibleSystems.map((s, i) => (
              <button
                key={i}
                className={"vSysCarouselDot" + (i === current ? " vSysCarouselDotActive" : "")}
                style={i === current ? { background: s.accent, boxShadow: `0 0 8px ${s.accent}88` } : {}}
                onClick={() => goTo(i)}
                aria-label={`Go to card ${i + 1}`}
              />
            ))}
          </div>
          <button className="vSysCarouselArrow" onClick={() => goTo(current + 1)} aria-label="Next">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M6 3L11 8L6 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
        </div>
        <p className="vSysCarouselCount">{current + 1} / {total}</p>
      </div>

      {/* ── Service Tiers (informational only — not tied to checkout) ── */}
      {systemsLoaded && dbServiceTiers.length > 0 && (
        <ServiceTiersBlock tiers={dbServiceTiers} />
      )}

      {/* ── Configure & Price Live Modal ───────────────────────────── */}
      {modalSys && (
        <div className="vConfigModal" onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}>
          <div className="vConfigModalBox" style={{ "--acc": modalSys.accent } as React.CSSProperties}>

            {/* Header */}
            <div className="vConfigModalHeader">
              <div>
                <span className="vConfigModalTag" style={{ color: modalSys.accent, borderColor: modalSys.accent + "44", background: modalSys.accent + "15" }}>
                  {modalSys.tag}
                </span>
                <h2 className="vConfigModalTitle">Configure &amp; price live.</h2>
                <p className="vConfigModalSub">{modalSys.title} — Start with the base. Add only what you need.</p>
              </div>
              <button className="vConfigModalClose" onClick={closeModal} aria-label="Close">✕</button>
            </div>

            <div className="vConfigModalBody">

              {/* Left — base features + add-ons */}
              <div className="vConfigModalLeft">

                {/* ── Design Tier Selector ── only for systems with tiers */}
                {(modalSys.designTiers?.length ?? 0) > 0 && (
                  <div className="vDesignTiers">
                    <p className="vConfigModalSectionLabel" style={{ marginBottom: "0.5rem" }}>
                      Service Tier
                    </p>
                    <div className="vDesignTierGrid">
                      {modalSys.designTiers.map((tier, idx) => {
                        const isActive = selectedTierIdx === idx;
                        return (
                          <button
                            key={tier.id}
                            className={"vDesignTierCard" + (isActive ? " vDesignTierCardActive" : "")}
                            style={isActive ? { borderColor: modalSys.accent, background: modalSys.accent + "12" } : {}}
                            onClick={() => setSelectedTierIdx(idx)}
                          >
                            <div className="vDesignTierTop">
                              <span className="vDesignTierName" style={isActive ? { color: modalSys.accent } : {}}>{tier.name}</span>
                              {tier.pricingType === "monthly" ? (
                                <span className="vDesignTierPrice" style={{ color: modalSys.accent }}>₱{(tier.monthlyFee ?? 0).toLocaleString()}/mo</span>
                              ) : tier.pricingType === "installment" ? (
                                <span className="vDesignTierPrice" style={{ color: modalSys.accent }}>₱{(tier.installmentAmount ?? 0).toLocaleString()}/mo × {tier.installmentMonths ?? 0}</span>
                              ) : tier.basePrice != null && modalSys.base != null && tier.basePrice > modalSys.base ? (
                                <span className="vDesignTierPrice" style={{ color: modalSys.accent }}>₱{tier.basePrice.toLocaleString()}</span>
                              ) : tier.basePrice != null ? (
                                <span className="vDesignTierIncluded">Included</span>
                              ) : tier.priceModifier > 0 ? (
                                <span className="vDesignTierPrice" style={{ color: modalSys.accent }}>+₱{tier.priceModifier.toLocaleString()}</span>
                              ) : (
                                <span className="vDesignTierIncluded">Included</span>
                              )}
                            </div>
                            {tier.tagline && <p className="vDesignTierTagline">{tier.tagline}</p>}
                            {isActive && (
                              <div className="vDesignTierCheck" style={{ background: modalSys.accent }}>
                                <svg width="9" height="9" viewBox="0 0 10 10" fill="none">
                                  <path d="M2 5l2.5 2.5L8 3" stroke="#000" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                    {activeTier?.liveUrl && (
                      <a
                        href={activeTier.liveUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="vDesignTierLiveLink"
                        style={{ borderColor: modalSys.accent + "44", color: modalSys.accent }}
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

                {/* Package details — this is the SELECTED TIER's own list, not a
                    shared "included in every tier" list. Falls back to the
                    system's general feature list only when the active tier
                    hasn't had its own package details filled in yet. */}
                <div className="vConfigModalSection">
                  <p className="vConfigModalSectionLabel">
                    {activeTier ? (
                      <>Package details — {activeTier.name}</>
                    ) : (
                      <>Base package — ₱{modalSys.base.toLocaleString()} <span className="vConfigModalIncluded">included</span></>
                    )}
                  </p>
                  <div className="vConfigModalBaseList">
                    {activeTierFeatures.map((f, i) => (
                      <div key={i} className="vConfigModalBaseItem">
                        <div className="vConfigModalCheck vConfigModalCheckLocked" style={{ background: modalSys.accent, borderColor: modalSys.accent }}>
                          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                            <path d="M2 5l2.5 2.5L8 3" stroke="#000" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </div>
                        <span className="vConfigModalBaseLabel">{f}</span>
                        <span className="vConfigModalLockIcon">🔒</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right — live price summary */}
              <div className="vConfigModalResult">

                {/* Scrollable content area */}
                <div className="vConfigModalResultScroll">
                  <div className="vConfigModalResultHead">
                    <span className="vConfigModalResultLabel">Your Build</span>
                    <span className="vConfigModalResultTag" style={{ color: modalSys.accent, borderColor: modalSys.accent + "40", background: modalSys.accent + "12" }}>{modalSys.tag}</span>
                  </div>
                  {isMonthlyTier ? (
                    <>
                      {activeTier?.setupFee != null && (
                        <div className="vConfigModalRow">
                          <span>Setup fee</span>
                          <span>₱{activeTier.setupFee.toLocaleString()}</span>
                        </div>
                      )}
                      <div className="vConfigModalRow vConfigModalRowAddon">
                        <span>Monthly fee</span>
                        <span>₱{(activeTier?.monthlyFee ?? 0).toLocaleString()}/mo</span>
                      </div>
                    </>
                  ) : isInstallmentTier ? (
                    <div className="vConfigModalRow vConfigModalRowAddon">
                      <span>Monthly installment</span>
                      <span>₱{(activeTier?.installmentAmount ?? 0).toLocaleString()}/mo</span>
                    </div>
                  ) : (
                    <>
                      <div className="vConfigModalRow">
                        <span>Base system</span>
                        <span>₱{(activeTier?.basePrice ?? modalSys.base).toLocaleString()}</span>
                      </div>
                      {activeTier && tierPriceBonus > 0 && (
                        <div className="vConfigModalRow vConfigModalRowAddon">
                          <span>+ {activeTier.name}</span>
                          <span>₱{tierPriceBonus.toLocaleString()}</span>
                        </div>
                      )}
                    </>
                  )}
                  <div className="vConfigModalDivider" />
                  <div className="vConfigModalTotal">
                    <span>{isMonthlyTier || isInstallmentTier ? "Total today" : "Total"}</span>
                    <span className="vConfigModalTotalPrice" style={{ color: modalSys.accent }}>
                      ₱{totalPrice.toLocaleString()}
                    </span>
                  </div>
                  {isMonthlyTier && (
                    <p className="vConfigModalTerms">
                      + ₱{(activeTier?.monthlyFee ?? 0).toLocaleString()}/month recurring
                      {activeTier?.minMonthsLock ? ` · ${activeTier.minMonthsLock}-month minimum` : ""}
                    </p>
                  )}
                  {isInstallmentTier && (
                    <p className="vConfigModalTerms">
                      Then ₱{(activeTier?.installmentAmount ?? 0).toLocaleString()}/mo for {(activeTier?.installmentMonths ?? 1) - 1} more months
                    </p>
                  )}
                  <p className="vConfigModalTerms">
                    {activeTier && TIER_PAYMENT_TERMS[activeTier.slug]
                      ? TIER_PAYMENT_TERMS[activeTier.slug]
                      : "50% deposit · 50% on delivery"}
                  </p>
                  <div className="vConfigModalDelivery">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, opacity: 0.5 }}>
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5"/>
                    <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                  <div style={{ flex: 1 }}>
                    <span className="vConfigModalDeliveryLabel">EST. DELIVERY</span>
                    <div className="vConfigModalDeliveryRow">
                      <span className="vConfigModalDeliveryVal" style={{ color: modalSys.accent }}>{deliveryEst}</span>
                      {/* +2 wks QA buffer badge with tooltip */}
                      <div className="vConfigModalQaBadge">
                        <span className="vConfigModalQaTag" style={{ color: modalSys.accent, borderColor: modalSys.accent + "44", background: modalSys.accent + "15" }}>
                          +2 wks
                        </span>
                        <div className="vConfigModalQaTooltip">
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>
                          </svg>
                          <span className="vConfigModalQaTip">
                            +2 weeks already included for QA testing, debugging, and error trapping. Card shows base timeline; modal shows base + 2 wks QA.
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                </div>{/* end vConfigModalResultScroll */}

                {/* Sticky footer — always visible */}
                <div className="vConfigModalResultFooter">
                  <a
                    href={`/register`}
                    className="vConfigModalCta"
                  >
                    Proceed →
                  </a>
                  {activeTier && (
                    <p className="vConfigModalCtaSub">{activeTier.name} design selected</p>
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>
      )}
    </>
  );
}
