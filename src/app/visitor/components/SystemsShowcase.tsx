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

type AddOn = {
  id: string; label: string; category: string; desc?: string; weeks?: number;
  pricingType: "fixed" | "range"; price: number; priceMin: number | null; priceMax: number | null;
};
type ConfigSystem = {
  tag: string; title: string; base: number; accent: string;
  setupFee: number | null; monthlyFee: number | null;
  baseFeatures: string[]; addons: AddOn[];
  timeline?: string;
  designTiers: DesignTierEntry[];
};

// configuratorSystems is built from DB data at runtime in SystemsCarousel.
// The hardcoded array has been removed — all system/addon data comes from /api/systems.
const configuratorSystems: ConfigSystem[] = [];

const CATEGORY_COLORS: Record<string, string> = {
  "Dashboard":      "#7eb8d4",
  "Data Analysis":  "#86efac",
  "Invoices":       "#c4b5fd",
  "Core Invoice":   "#c4b5fd",
  "Email":          "#fcd34d",
  "Payments":       "#f9a8d4",
  "Accounting":     "#67e8f9",
  "AI":             "#c4b5fd",
  "AI & Automation":"#fcd34d",
  "Automation":     "#fcd34d",
  "Finance":        "#f9a8d4",
  "Operations":     "#7dc9a0",
  "HR":             "#67e8f9",
  "Portal":         "#b8a0d4",
  "E-commerce":     "#fdba74",
  "Core POS":       "#fdba74",
  "Delivery":       "#67e8f9",
  "CRM":            "#fcd34d",
  "Core CRM":       "#fcd34d",
  "Sales":          "#fcd34d",
  "Marketing":      "#f9a8d4",
  "Support":        "#67e8f9",
  "Analytics":      "#86efac",
  "ERP":            "#7eb8d4",
  "Planning":       "#7eb8d4",
  "Core":           "#8fc99a",
  "Barcode & RFID": "#f9a8d4",
  "Orders":         "#67e8f9",
  "Shipping":       "#7eb8d4",
  "Procurement":    "#fcd34d",
  "Security":       "#c4b5fd",
  "Mobile":         "#fdba74",
  "Core Modules":   "#7dc9a0",
  "Estimation":     "#86efac",
  "Scheduling":     "#7eb8d4",
  "BIM":            "#f9a8d4",
  "Workforce":      "#67e8f9",
  "Field & Mobile": "#fdba74",
  "Enterprise":     "#c4b5fd",
  "Compliance":     "#b8a0d4",
  "Equipment":      "#7dc9a0",
  "IoT":            "#86efac",
  "Integrations":   "#f9a8d4",
  "Scanning":       "#fcd34d",
  "Logistics":      "#67e8f9",
  "Inventory":      "#8fc99a",
  "Payroll":        "#67e8f9",
  "Attendance":     "#7dc9a0",
  "HR Mgmt":        "#b8a0d4",
  "Recruitment":    "#fcd34d",
  "Performance":    "#86efac",
  "Academic":       "#86efac",
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
          addons:       s.addons.map(a => ({
            id:          a.id,
            label:       a.label,
            category:    a.category,
            desc:        a.description ?? undefined,
            pricingType: a.pricingType ?? "fixed",
            price:       a.price,
            priceMin:    a.priceMin,
            priceMax:    a.priceMax,
          })),
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
  const [selected,  setSelected]  = useState<Record<string, boolean>>({});
  const [activeCat, setActiveCat] = useState("All");
  // Design tier selection — reset to 0 when modal opens
  const [selectedTierIdx, setSelectedTierIdx] = useState<number>(0);
  // Pricing mode toggle — "one_time" (base price) vs "subscription" (setup fee + monthly fee).
  // Subscription mode is only offered when the system has both setupFee and monthlyFee set.
  const [pricingMode, setPricingMode] = useState<"one_time" | "subscription">("one_time");
  const activeTier     = modalSys?.designTiers?.[selectedTierIdx] ?? null;
  const tierPriceBonus = activeTier?.priceModifier ?? 0;

  /* Open modal — match carousel system tag to DB configurator data,
     then pre-check any add-on whose label fuzzy-matches a carousel feature */
  function openModal(s: VisitorSystemEntry) {
    const cfg = activeConfigSystems.find(c => c.tag === s.tag) ?? null;
    if (!cfg) return;

    // Pre-check add-ons whose label matches any of the carousel card features
    const preChecked: Record<string, boolean> = {};
    cfg.addons.forEach(addon => {
      const addonLower = addon.label.toLowerCase();
      const matches = s.features.some(feat => {
        const featLower = feat.toLowerCase();
        // Match if either contains key words of the other
        return addonLower.includes(featLower) ||
               featLower.includes(addonLower) ||
               addonLower.split(" ").some(w => w.length > 3 && featLower.includes(w)) ||
               featLower.split(" ").some(w => w.length > 3 && addonLower.includes(w));
      });
      if (matches) preChecked[addon.id] = true;
    });

    setSelected(preChecked);
    setSelectedTierIdx(0);
    setActiveCat("All");
    setPricingMode("one_time");
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

  /* Toggle add-on */
  function toggle(id: string) {
    setSelected(prev => ({ ...prev, [id]: !prev[id] }));
  }

  /* Live price */
  const selectedAddons = modalSys?.addons.filter(a => selected[a.id]) ?? [];
  const categories   = modalSys ? ["All", ...Array.from(new Set(modalSys.addons.map(a => a.category)))] : [];
  const visibleAddons = modalSys ? (activeCat === "All" ? modalSys.addons : modalSys.addons.filter(a => a.category === activeCat)) : [];

  // Whether this system offers a subscription option — needs both setupFee and monthlyFee.
  const hasSubscriptionOption = !!(modalSys?.setupFee != null && modalSys?.monthlyFee != null);
  // Effective pricing mode — falls back to one_time if subscription isn't available for this system.
  const effectivePricingMode = hasSubscriptionOption ? pricingMode : "one_time";

  // Add-ons total: fixed add-ons contribute an exact amount to both min and max.
  // Ranged add-ons (quote-based) contribute priceMin to the min side and priceMax (or
  // stay open-ended, flagged via hasOpenEndedAddon) to the max side.
  let addonsMin = 0;
  let addonsMax = 0;
  let hasRangeAddon = false;
  let hasOpenEndedAddon = false;
  selectedAddons.forEach(a => {
    if (a.pricingType === "range") {
      hasRangeAddon = true;
      addonsMin += a.priceMin ?? 0;
      if (a.priceMax != null) addonsMax += a.priceMax;
      else { hasOpenEndedAddon = true; addonsMax += a.priceMin ?? 0; }
    } else {
      addonsMin += a.price;
      addonsMax += a.price;
    }
  });
  // Used only for the exact (non-range) CTA subtext — equals addonsMin/addonsMax when no ranged add-on is selected.
  const addonsTotal = addonsMin;

  // Base cost depends on pricing mode: one-time base price, or setup fee (monthly fee shown separately).
  const baseCost = effectivePricingMode === "subscription" ? (modalSys?.setupFee ?? 0) : (modalSys?.base ?? 0);
  const totalMin = baseCost + addonsMin + tierPriceBonus;
  const totalMax = baseCost + addonsMax + tierPriceBonus;
  // Only show an estimated range when a ranged add-on is actually selected — otherwise show the exact total as before.
  const showEstimatedRange = hasRangeAddon;
  const totalPrice = totalMin; // exact total when no ranged add-on is selected (totalMin === totalMax in that case)

  /* Delivery estimate: pulled directly from system timeline, addons stack on top */
  const [baseMinWks, baseMaxWks] = modalSys?.timeline
    ? modalSys.timeline.replace(" weeks","").split("–").map(Number)
    : [6, 8];
  const addonWeeks = Math.round(selectedAddons.length * 0.3 * 2) / 2;
  const minWks = baseMinWks + addonWeeks;
  const maxWks = baseMaxWks + addonWeeks;
  const deliveryEst = `${minWks % 1 === 0 ? minWks : minWks.toFixed(1)}–${maxWks % 1 === 0 ? maxWks : maxWks.toFixed(1)} weeks`;

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
                      Website Design Style
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
                              {tier.priceModifier > 0 ? (
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

                {/* Pricing mode toggle — only shown when this system offers a subscription option */}
                {hasSubscriptionOption && (
                  <div className="vPricingModeToggle">
                    <button
                      className={"vPricingModeBtn" + (effectivePricingMode === "one_time" ? " active" : "")}
                      style={effectivePricingMode === "one_time" ? { borderColor: modalSys.accent, color: modalSys.accent, background: modalSys.accent + "12" } : {}}
                      onClick={() => setPricingMode("one_time")}
                    >
                      One-time
                    </button>
                    <button
                      className={"vPricingModeBtn" + (effectivePricingMode === "subscription" ? " active" : "")}
                      style={effectivePricingMode === "subscription" ? { borderColor: modalSys.accent, color: modalSys.accent, background: modalSys.accent + "12" } : {}}
                      onClick={() => setPricingMode("subscription")}
                    >
                      Subscription
                    </button>
                  </div>
                )}

                {/* Base features — locked/pre-checked */}
                <div className="vConfigModalSection">
                  <p className="vConfigModalSectionLabel">
                    {effectivePricingMode === "subscription" ? (
                      <>Base package — ₱{(modalSys.setupFee ?? 0).toLocaleString()} setup + ₱{(modalSys.monthlyFee ?? 0).toLocaleString()}/mo <span className="vConfigModalIncluded">included</span></>
                    ) : (
                      <>Base package — ₱{modalSys.base.toLocaleString()} <span className="vConfigModalIncluded">included</span></>
                    )}
                  </p>
                  <div className="vConfigModalBaseList">
                    {modalSys.baseFeatures.map((f, i) => (
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

                {/* Category filter */}
                <div className="vConfigModalCats">
                  {categories.map(cat => (
                    <button
                      key={cat}
                      className={"vConfigModalCat" + (activeCat === cat ? " active" : "")}
                      style={activeCat === cat ? { borderColor: modalSys.accent, color: modalSys.accent } : {}}
                      onClick={() => setActiveCat(cat)}
                    >{cat}</button>
                  ))}
                </div>

                {/* Add-ons */}
                <div className="vConfigModalAddons">
                  {visibleAddons.map(addon => {
                    const isOn = !!selected[addon.id];
                    const catColor = CATEGORY_COLORS[addon.category] || "#fff";
                    return (
                      <button
                        key={addon.id}
                        className={"vConfigModalAddon" + (isOn ? " on" : "")}
                        style={isOn ? { borderColor: modalSys.accent + "60", background: modalSys.accent + "0d" } : {}}
                        onClick={() => toggle(addon.id)}
                      >
                        <div className="vConfigModalAddonLeft">
                          <div className={"vConfigModalCheck" + (isOn ? " on" : "")}
                            style={isOn ? { background: "#22c55e", borderColor: "#22c55e" } : {}}>
                            {isOn && (
                              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                                <path d="M2 5l2.5 2.5L8 3" stroke="#000" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            )}
                          </div>
                          <div>
                            <span className="vConfigModalAddonLabel">{addon.label}</span>
                            <span className="vConfigModalAddonCat" style={{ color: catColor }}>{addon.category}</span>
                            {addon.desc && <span className="vConfigModalAddonDesc">{addon.desc}</span>}
                          </div>
                        </div>
                        <span className="vConfigModalAddonPrice">
                          {addon.pricingType === "range"
                            ? `₱${(addon.priceMin ?? 0).toLocaleString()}–₱${addon.priceMax != null ? addon.priceMax.toLocaleString() : ""}${addon.priceMax == null ? "+" : ""}`
                            : `+₱${addon.price.toLocaleString()}`}
                        </span>
                      </button>
                    );
                  })}
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
                  {effectivePricingMode === "subscription" ? (
                    <>
                      <div className="vConfigModalRow">
                        <span>Setup fee</span>
                        <span>₱{(modalSys.setupFee ?? 0).toLocaleString()}</span>
                      </div>
                      <div className="vConfigModalRow vConfigModalRowAddon">
                        <span>Monthly fee</span>
                        <span>₱{(modalSys.monthlyFee ?? 0).toLocaleString()}/mo</span>
                      </div>
                    </>
                  ) : (
                    <div className="vConfigModalRow">
                      <span>Base system</span>
                      <span>₱{modalSys.base.toLocaleString()}</span>
                    </div>
                  )}
                  {activeTier && tierPriceBonus > 0 && (
                    <div className="vConfigModalRow vConfigModalRowAddon">
                      <span>+ {activeTier.name} design</span>
                      <span>₱{tierPriceBonus.toLocaleString()}</span>
                    </div>
                  )}
                  {selectedAddons.length > 0 && (
                    <div className="vConfigModalAddonRows">
                      {selectedAddons.map(a => (
                        <div key={a.id} className="vConfigModalRow vConfigModalRowAddon">
                          <span>+ {a.label}</span>
                          <span>
                            {a.pricingType === "range"
                              ? `₱${(a.priceMin ?? 0).toLocaleString()}–₱${a.priceMax != null ? a.priceMax.toLocaleString() : ""}${a.priceMax == null ? "+" : ""}`
                              : `₱${a.price.toLocaleString()}`}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                  {selectedAddons.length === 0 && (
                    <p className="vConfigModalEmpty">No add-ons yet.<br/>Select features on the left.</p>
                  )}
                  <div className="vConfigModalDivider" />
                  <div className="vConfigModalTotal">
                    <span>{showEstimatedRange ? "Estimated total" : "Total"}</span>
                    <span className="vConfigModalTotalPrice" style={{ color: modalSys.accent }}>
                      {showEstimatedRange
                        ? `₱${totalMin.toLocaleString()} – ₱${totalMax.toLocaleString()}${hasOpenEndedAddon ? "+" : ""}`
                        : `₱${totalPrice.toLocaleString()}`}
                    </span>
                  </div>
                  {effectivePricingMode === "subscription" && (
                    <p className="vConfigModalTerms">+ ₱{(modalSys.monthlyFee ?? 0).toLocaleString()}/month recurring</p>
                  )}
                  {showEstimatedRange && (
                    <p className="vConfigModalTerms">Quote-based add-ons — final price confirmed after scoping</p>
                  )}
                  <p className="vConfigModalTerms">30% downpayment · 70% on delivery</p>
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
                    {selectedAddons.length > 0 && (
                      <span className="vConfigModalDeliveryNote">+{(addonWeeks).toFixed(1)} wks from {selectedAddons.length} add-on{selectedAddons.length !== 1 ? "s" : ""}</span>
                    )}
                  </div>
                </div>
                </div>{/* end vConfigModalResultScroll */}

                {/* Sticky footer — always visible */}
                <div className="vConfigModalResultFooter">
                  <a
                    href={`/register`}
                    className="vConfigModalCta"
                  >
                    Start This Build →
                  </a>
                  <p className="vConfigModalCtaSub">
                    {selectedAddons.length} add-on{selectedAddons.length !== 1 ? "s" : ""} selected
                    {showEstimatedRange
                      ? ` · +₱${addonsMin.toLocaleString()}–₱${addonsMax.toLocaleString()}${hasOpenEndedAddon ? "+" : ""}`
                      : ` · +₱${addonsTotal.toLocaleString()}`}
                  </p>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}
    </>
  );
}
