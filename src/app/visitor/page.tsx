// Visitor landing page — cinematic premium enterprise aesthetic.
// Apple x Linear x Stripe x luxury architecture studio.
// Sections: Hero, Trust, Systems, Process, About, CTA, Footer.
"use client";

import "./visitor.css";
import { useEffect, useRef, useState } from "react";
import { motion, useScroll, useTransform, useInView } from "framer-motion";
import Link from "next/link";
import { ArchitectureIntroSection, ArchitectureVideosSection } from "./architecture";
import { ModelingIntro, ModelingMagazine }                     from "./modeling";
import { sanitize }       from "@/lib/utils";
import { useTrackVisit }  from "./useTrackVisit";

/* ─── Data ─────────────────────────────────────────────────────────── */

const techStack = [
  "Next.js", "PostgreSQL", "Prisma ORM", "GSAP", "Framer Motion",
  "AI Visual Systems", "Enterprise Infrastructure", "TypeScript",
];

// Systems data is now fetched from DB inside SystemsCarousel via /api/systems.
// This type is used for the carousel cards and the configurator modal.
type VisitorSystemEntry = {
  id: string; tag: string; title: string; basePrice: number; accent: string;
  description: string; timeline: string; deploy: string;
  features: string[]; displayStatus: string;
  addons: { id: string; addonKey: string; label: string; price: number; category: string; description: string | null }[];
};

const process = [
  { step: "01", title: "Discover", desc: "Deep dive into your operations. We map every workflow, constraint, and growth objective before writing a line of code." },
  { step: "02", title: "Architect", desc: "System design with precision. Database schemas, API contracts, and UI frameworks defined before build begins." },
  { step: "03", title: "Build", desc: "Engineered with enterprise-grade standards. Clean code, full test coverage, and cinematic UI execution." },
  { step: "04", title: "Deploy", desc: "Zero-downtime deployments on global edge infrastructure. Monitored from day one." },
  { step: "05", title: "Scale", desc: "Systems that grow with your business. Architecture built for the next decade, not just the next quarter." },
];

const DRIVE_INTERIOR = "https://drive.google.com/drive/folders/1TWaOJivk0HuAfGZY9qcYZL6agqHNibtr?usp=drive_link";
const DRIVE_EXTERIOR = "https://drive.google.com/drive/folders/1qsx8USrcKU37ljmD2WoABr2uyYCsri0_?usp=drive_link";
const DRIVE_WEAPONS  = ""; // files delivered via email after purchase — not publicly accessible

/* ─── Google Drive /preview — only reliable embeddable video src ─────── */
const drivePreview = (id: string) => `https://drive.google.com/file/d/${id}/preview`;

/* ── Section 3: 3D Animation — Blender axe animations ───────────────── */
const animationCards = [
  {
    id: "anim-1",
    title: "Battle Axe I",
    category: "3D Animation",
    desc: "Full Blender animation of a hand-modelled battle axe — cinematic camera orbit, studio lighting, and procedural metal shading.",
    accent: "#4ade80",
    gradient: "linear-gradient(135deg, #061a0e 0%, #0e2a18 40%, #0d0c0b 100%)",
    videoFileId: "1NrTbKznn-3pcIC9q-BqBa2lUfMUsGKa8",
  },
  {
    id: "anim-2",
    title: "Battle Axe II",
    category: "3D Animation",
    desc: "Viking battle axe with knotwork engravings — slow 360° turntable render with HDRI environment and subsurface metal material.",
    accent: "#4ade80",
    gradient: "linear-gradient(135deg, #061a0e 0%, #0e2a18 40%, #0d0c0b 100%)",
    videoFileId: "1db1EOrzdG2phPiaJ8DJV9Tz1-bfYwB67",
  },
  {
    id: "anim-3",
    title: "Battle Axe III",
    category: "3D Animation",
    desc: "Precision-modelled poll axe with dynamic lighting pass — edge highlights, shadow casting, and cinematic depth of field.",
    accent: "#4ade80",
    gradient: "linear-gradient(135deg, #061a0e 0%, #0e2a18 40%, #0d0c0b 100%)",
    videoFileId: "1ZPhiN56sAU9EQIlrrTPY3OSDBhijtHld",
  },
];

/* ── Section 4: ORC 3D Animation — Blender orc animations ──────────── */
const orcCards = [
  {
    id: "orc-1",
    title: "ORC Character I",
    category: "3D Character Animation",
    desc: "Full Blender character animation of an orc model — cinematic lighting, procedural skin shader, and dynamic camera movement.",
    accent: "#86efac",
    gradient: "linear-gradient(135deg, #061a0a 0%, #0e2a12 40%, #0d0c0b 100%)",
    videoFileId: "1ApEQgnNAza_uRL9NRRPtCMOurPqKj1VP",
  },
  {
    id: "orc-2",
    title: "ORC Character II",
    category: "3D Character Animation",
    desc: "Orc warrior with detailed armor and weapon — slow orbit render with dramatic rim lighting and subsurface skin scattering.",
    accent: "#86efac",
    gradient: "linear-gradient(135deg, #061a0a 0%, #0e2a12 40%, #0d0c0b 100%)",
    videoFileId: "1SaHl7fGvD2uoy34clB1p2UWT-knWENwl",
  },
  {
    id: "orc-3",
    title: "ORC Character III",
    category: "3D Character Animation",
    desc: "High-poly orc sculpt animated with cinematic depth of field, HDRI environment lighting, and full shadow pass.",
    accent: "#86efac",
    gradient: "linear-gradient(135deg, #061a0a 0%, #0e2a12 40%, #0d0c0b 100%)",
    videoFileId: "1L_mshqNnDK3rfTHrcds3yApBiY-Wt55i",
  },
];

/* ─── Mixed carousel — interior + exterior interleaved ──────────────── */
const carouselVideos = [
  { id: "1MJR8A38OCNRDxb_jRheBdRgexnAOugZf", label: "Interior" },
  { id: "1QKCGiJCNzSbpkVsQPN073ws6WbZMwrZC", label: "Exterior" },
  { id: "1cHTTgKBilMBXIrIGuSqB2tAb4A9WdobJ", label: "Interior" },
  { id: "1hIAB7FrCEnn8cfrGSCplccHkZ4Gonnxu", label: "Exterior" },
  { id: "1A9sgWrWpi_Jq2NWZIH5mkh2XP491_2Ce", label: "Interior" },
  { id: "1kp23x5YBnWovDamPDT2FS00d1ID9SB0k", label: "Exterior" },
  { id: "1sr1O1HBL-q0oFZ2mfhgI3Zf3Y_AWmOzl", label: "Interior" },
  { id: "10CfcifgZBQMoxK2L_ANH8TJ8vUj7v26T", label: "Exterior" },
  { id: "1wQtULgqst4SX2imqwdEhnqYRgzcPWJiu", label: "Interior" },
  { id: "1uK7a0BedMTfGWeZ17WxJt-YYKAJL3bZJ", label: "Exterior" },
  { id: "16IlbksfqFgAsIUlIbSnfG1k0miktYC0d", label: "Interior" },
  { id: "1On-oICTEgx81tNSRyW7DZYk3IOEDBiAT", label: "Exterior" },
  { id: "1iqOFR1-0gO4v-Wk7PzBKZ2TsSeL0qoOW", label: "Interior" },
  { id: "1p34uCYAykKSH9c5fHXh1PuRn_S5XS3sG", label: "Interior" },
  { id: "1NrTbKznn-3pcIC9q-BqBa2lUfMUsGKa8", label: "Animation" },
  { id: "1db1EOrzdG2phPiaJ8DJV9Tz1-bfYwB67", label: "Animation" },
  { id: "1ZPhiN56sAU9EQIlrrTPY3OSDBhijtHld", label: "Animation" },
  { id: "1ApEQgnNAza_uRL9NRRPtCMOurPqKj1VP", label: "Character" },
  { id: "1SaHl7fGvD2uoy34clB1p2UWT-knWENwl", label: "Character" },
  { id: "1L_mshqNnDK3rfTHrcds3yApBiY-Wt55i", label: "Character" },
];






/* ─── Reveal wrapper ────────────────────────────────────────────────── */
function Reveal({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 36 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.75, delay, ease: [0.25, 0.1, 0.25, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ─── Marquee ───────────────────────────────────────────────────────── */
function Marquee({ items }: { items: string[] }) {
  const doubled = [...items, ...items];
  return (
    <div className="vMarqueeOuter">
      <div className="vMarqueeTrack">
        {doubled.map((t, i) => (
          <span key={i} className="vMarqueeItem">
            {t} <span className="vMarqueeDot">·</span>
          </span>
        ))}
      </div>
    </div>
  );
}

/* ─── Single video player — controlled by active card ───────────────── */
function ActiveVideoPlayer({ videoFileId, gradient, accent }: {
  videoFileId: string; gradient: string; accent: string;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.src = drivePreview(videoFileId);
    v.currentTime = 0;
    v.play().catch(() => { });
  }, [videoFileId]);

  return (
    <div className="vAiPreview" style={{ background: gradient }}>
      <video
        ref={videoRef}
        className="vAiDriveEmbed"
        muted loop playsInline autoPlay
      />
      <div className="vAiVideoGrade" />
      <div className="vAiCornerMark">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M1 19V1h18" stroke={accent} strokeWidth="1" strokeOpacity="0.5" />
        </svg>
      </div>
    </div>
  );
}

/* ─── Vertical sliding stack — top card always active ───────────────── */
type SlideCard = {
  id: string; title: string; category: string;
  desc: string; accent: string; gradient: string; videoFileId: string;
};

function SlideStack({ cards, accent }: { cards: SlideCard[]; accent: string }) {
  const [order, setOrder] = useState(cards.map((_, i) => i));

  // Rotates the entire order array — down shifts top to bottom, up shifts bottom to top
  const rotate = (direction: "up" | "down") => {
    setOrder((prev) => {
      const next = [...prev];
      if (direction === "down") {
        const top = next.shift()!;
        next.push(top);
      } else {
        const bottom = next.pop()!;
        next.unshift(bottom);
      }
      return next;
    });
  };

  const activeCard = cards[order[0]];

  return (
    <div className="vSlideStack">

      {/* Up arrow — sits ABOVE the active card, outside */}
      <div className="vSlideOuterArrow vSlideOuterArrowTop">
        <button
          className="vSlideArrowBtn"
          onClick={() => rotate("up")}
          aria-label="Previous video"
          style={{ color: accent, borderColor: accent + "44" }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M2 10L7 4L12 10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <span className="vSlideArrowCount" style={{ color: accent }}>
          {order[0] + 1} / {cards.length}
        </span>
      </div>

      {/* Active — top card */}
      <motion.div
        key={`active-${activeCard.id}`}
        layout
        className="vSlideCard vSlideCardActive"
        style={{ borderColor: accent + "40" }}
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="vSlideCardThumb" style={{ background: activeCard.gradient }}>
          {/* iframe /preview — only reliable Drive video playback */}
          <iframe
            key={activeCard.videoFileId}
            src={drivePreview(activeCard.videoFileId)}
            className="vAiDriveEmbed"
            allow="autoplay"
            allowFullScreen
            title={activeCard.title}
          />
          <span className="vSlideActiveBadge" style={{ color: accent, borderColor: accent + "44" }}>
            Now Playing
          </span>
          {/* Overlay covers Drive's external-link icon in the top-right corner of the iframe */}
          <div className="vDriveIconOverlay">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/favicon.png" alt="Matthew Studio" className="vDriveOverlayLogo" />
          </div>
        </div>
        <div className="vSlideCardInfo">
          <span className="vAiCardCategory" style={{ color: accent }}>{activeCard.category}</span>
          <p className="vSlideCardTitle">{activeCard.title}</p>
          <p className="vSlideCardDesc">{activeCard.desc}</p>
        </div>
      </motion.div>

      {/* Down arrow — sits below the active card */}
      <div className="vSlideOuterArrow vSlideOuterArrowBottom">
        <button
          className="vSlideArrowBtn"
          onClick={() => rotate("down")}
          aria-label="Next video"
          style={{ color: accent, borderColor: accent + "44" }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M2 4L7 10L12 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

    </div>
  );
}

/* ─── Magazine split section — text left, slide stack right ─────────── */
function MagazineSection({
  label, labelAccent, title, titleAccent, italicLine,
  desc, accent, gradient, cards, ctaLabel, delay,
}: {
  label: string; labelAccent: string; title: string;
  titleAccent: string; italicLine: string;
  desc: string; accent: string; gradient: string;
  cards: SlideCard[]; ctaLabel: string; delay: number;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <motion.div
      ref={ref}
      className="vMagSection"
      initial={{ opacity: 0, y: 48 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.9, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Left — text + steps + CTA */}
      <div className="vMagLeft" style={{ background: gradient }}>
        <div className="vMagLeftInner">
          <span className="vAiCardCategory" style={{ color: accent }}>{label}</span>
          <h3 className="vMagTitle">
            {title}<br />
            <em className="vMagItalic" style={{ color: accent }}>{italicLine}</em>
          </h3>
          <p className="vMagDesc">{desc}</p>
          <div className="vAiSteps">
            <div className="vAiStep">
              <span className="vAiStepNum" style={{ color: accent }}>01</span>
              <div>
                <strong>Create an account</strong>
                <p>Register with your email. Free, 30 seconds.</p>
              </div>
            </div>
            <div className="vAiStep">
              <span className="vAiStepNum" style={{ color: accent }}>02</span>
              <div>
                <strong>Purchase the collection</strong>
                <p>One-time payment. No subscription, no renewal.</p>
              </div>
            </div>
            <div className="vAiStep">
              <span className="vAiStepNum" style={{ color: accent }}>03</span>
              <div>
                <strong>Download forever</strong>
                <p>Instant access. Re-download anytime from your dashboard.</p>
              </div>
            </div>
          </div>
          <a href="/register" className="vAiGetAccessBtn" style={{ background: accent }}>
            {ctaLabel}
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
              <path d="M1 12L12 1M12 1H6M12 1v6" stroke="#0d0c0b" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </a>
        </div>
      </div>

      {/* Right — vertical slide stack */}
      <div className="vMagRight">
        <SlideStack cards={cards} accent={accent} />
      </div>
    </motion.div>
  );
}


/* ─── Systems Carousel ──────────────────────────────────────────────── */
/* ConfigSystem type kept for modal state — now built from DB data at runtime */
type AddOn = { id: string; label: string; price: number; weeks?: number; category: string; desc?: string };
type ConfigSystem = {
  tag: string; title: string; base: number; accent: string;
  baseFeatures: string[]; addons: AddOn[];
  timeline?: string;
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

function SystemsCarousel() {
  const [current, setCurrent] = useState(0);
  const trackRef = useRef<HTMLDivElement>(null);

  // All system data fetched from DB — replaces hardcoded systems + configuratorSystems arrays
  const [dbSystems,            setDbSystems]            = useState<VisitorSystemEntry[]>([]);
  const [dbConfigSystems,      setDbConfigSystems]      = useState<ConfigSystem[]>([]);

  const [systemsLoaded,        setSystemsLoaded]        = useState(false);

  useEffect(() => {
    // Fetch full system data from DB — price, features, addons, displayStatus all live
    fetch("/api/systems")
      .then(r => r.json())
      .then(data => {
        const rows: VisitorSystemEntry[] = data.systems ?? [];
        console.log("[SystemsCarousel] systems:", rows.map(s => ({ tag: s.tag, displayStatus: s.displayStatus })));

        // Set carousel systems state — was missing, causing empty carousel + no displayStatus
        setDbSystems(rows);



        // Build configurator modal data from DB addons
        const cfgSystems: ConfigSystem[] = rows.map(s => ({
          tag:          s.tag,
          title:        s.title,
          base:         s.basePrice,
          accent:       s.accent,
          timeline:     s.timeline,
          baseFeatures: s.features,
          addons:       s.addons.map(a => ({
            id:       a.id,
            label:    a.label,
            price:    a.price,
            category: a.category,
            desc:     a.description ?? undefined,
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
    setActiveCat("All");
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
  const addonsTotal  = modalSys ? modalSys.addons.filter(a => selected[a.id]).reduce((s, a) => s + a.price, 0) : 0;
  const totalPrice   = (modalSys?.base ?? 0) + addonsTotal;
  const selectedAddons = modalSys?.addons.filter(a => selected[a.id]) ?? [];
  const categories   = modalSys ? ["All", ...Array.from(new Set(modalSys.addons.map(a => a.category)))] : [];
  const visibleAddons = modalSys ? (activeCat === "All" ? modalSys.addons : modalSys.addons.filter(a => a.category === activeCat)) : [];

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
                    <div className="vSysCardTermsRow">
                      <div className="vSysCardTerm">
                        <span className="vSysCardTermNum" style={{ color: s.accent }}>30%</span>
                        <span className="vSysCardTermLabel">downpayment to start</span>
                      </div>
                      <div className="vSysCardTermDivider" />
                      <div className="vSysCardTerm">
                        <span className="vSysCardTermNum" style={{ color: s.accent }}>70%</span>
                        <span className="vSysCardTermLabel">on final delivery</span>
                      </div>
                      <div className="vSysCardTermDivider" />
                      <div className="vSysCardTerm">
                        <span className="vSysCardTermNum" style={{ color: s.accent }}>100%</span>
                        <span className="vSysCardTermLabel">source code yours</span>
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

                {/* Base features — locked/pre-checked */}
                <div className="vConfigModalSection">
                  <p className="vConfigModalSectionLabel">
                    Base package — ₱{modalSys.base.toLocaleString()} <span className="vConfigModalIncluded">included</span>
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
                        <span className="vConfigModalAddonPrice">+₱{addon.price.toLocaleString()}</span>
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
                  <div className="vConfigModalRow">
                    <span>Base system</span>
                    <span>₱{modalSys.base.toLocaleString()}</span>
                  </div>
                  {selectedAddons.length > 0 && (
                    <div className="vConfigModalAddonRows">
                      {selectedAddons.map(a => (
                        <div key={a.id} className="vConfigModalRow vConfigModalRowAddon">
                          <span>+ {a.label}</span>
                          <span>₱{a.price.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {selectedAddons.length === 0 && (
                    <p className="vConfigModalEmpty">No add-ons yet.<br/>Select features on the left.</p>
                  )}
                  <div className="vConfigModalDivider" />
                  <div className="vConfigModalTotal">
                    <span>Total</span>
                    <span className="vConfigModalTotalPrice" style={{ color: modalSys.accent }}>
                      ₱{totalPrice.toLocaleString()}
                    </span>
                  </div>
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
                  <p className="vConfigModalCtaSub">{selectedAddons.length} add-on{selectedAddons.length !== 1 ? "s" : ""} selected · +₱{addonsTotal.toLocaleString()}</p>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}
    </>
  );
}


/* ─── Testimonials ──────────────────────────────────────────────────── */

type Testimonial = {
  id: string;
  name: string;
  project: string;
  rate: number;
  comment: string;
  initials: string;
  accent: string;
};

const accentColors = ["#7dc9a0", "#7eb8d4", "#c4b5fd", "#f9a8d4", "#67e8f9", "#fcd34d", "#fdba74", "#86efac"];

function getInitials(name: string) {
  return name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
}

// Testimonials are now DB-backed via /api/testimonials.
// loadTestimonials and saveTestimonials removed — replaced by fetch calls.

function RateBar({ rate, accent }: { rate: number; accent: string }) {
  return (
    <div className="tRateWrap">
      <div className="tRateTrack">
        <div className="tRateFill" style={{ width: `${rate}%`, background: accent }} />
      </div>
      <span className="tRateNum" style={{ color: accent }}>{rate}%</span>
    </div>
  );
}

function PhoneCard({ t }: { t: Testimonial }) {
  return (
    <div className="tPhoneCard">
      <div className="tPhoneCardHeader">
        <div className="tPhoneAvatar" style={{ background: t.accent + "33", color: t.accent }}>
          {t.initials}
        </div>
        <div>
          <p className="tPhoneCardName">{t.name}</p>
          <p className="tPhoneCardProject">{t.project}</p>
        </div>
      </div>
      <RateBar rate={t.rate} accent={t.accent} />
      <p className="tPhoneCardComment">&ldquo;{t.comment}&rdquo;</p>
    </div>
  );
}

function TestimonialsSection() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [active, setActive] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", project: "", rate: 80, comment: "" });
  const [submitted, setSubmitted] = useState(false);

  // ── Fetch approved testimonials from DB on mount ──────────────────────────
  useEffect(() => {
    fetch("/api/testimonials")
      .then(res => res.json())
      .then((data: Testimonial[]) => {
        if (Array.isArray(data) && data.length > 0) {
          setTestimonials(data);
        }
        // If DB has no approved testimonials yet, carousel stays empty — no fake seeds
      })
      .catch(() => {});
  }, []);

  const total = testimonials.length;

  const prev = () => setActive(a => ((a - 1) + total) % total);
  const next = () => setActive(a => (a + 1) % total);

  // ── Submit testimonial to DB (pending admin approval) ──────────────────────
  async function handleSubmit() {
    if (!form.name.trim() || !form.project.trim() || !form.comment.trim()) return;
    try {
      await fetch("/api/testimonials", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          name:    form.name.trim(),
          project: form.project.trim(),
          rate:    form.rate,
          comment: form.comment.trim(),
        }),
      });
    } catch { /* fire and forget — submission is best-effort */ }
    setForm({ name: "", project: "", rate: 80, comment: "" });
    setSubmitted(true);
    setTimeout(() => { setSubmitted(false); setShowForm(false); }, 2000);
  }

  if (total === 0) return null;

  const activeT = testimonials[active];

  // Compute indices for side cards
  const leftIdx = ((active - 1) + total) % total;
  const rightIdx = (active + 1) % total;
  const leftT = testimonials[leftIdx];
  const rightT = testimonials[rightIdx];

  return (
    <section className="vTestimonials" id="testimonials">
      <div className="vTestimonialsInner">

        <div className="vSprintHeader">
          <Reveal>
            <span className="vSectionEyebrow">Client Reviews</span>
          </Reveal>
          <Reveal delay={0.1}>
            <h2 className="vSectionTitle">What clients say.</h2>
          </Reveal>
          <Reveal delay={0.2}>
            <p className="vSectionSub">Real feedback from real clients. Every system. Every sprint.</p>
          </Reveal>
        </div>

        {/* ── Carousel ── */}
        <div className="tCarouselWrap">

          {/* Left side card */}
          {total > 1 && (
            <button className="tSideCard tSideCardLeft" onClick={prev} aria-label="Previous">
              <div className="tSideCardInner">
                <div className="tSideAvatar" style={{ background: leftT.accent + "33", color: leftT.accent }}>
                  {leftT.initials}
                </div>
                <div className="tSideInfo">
                  <p className="tSideName">{leftT.name}</p>
                  <p className="tSideProject">{leftT.project}</p>
                </div>
                <div className="tSideRate" style={{ color: leftT.accent }}>{leftT.rate}%</div>
              </div>
            </button>
          )}

          {/* Phone mockup */}
          <div className="tPhoneMockup">
            {/* Phone shell */}
            <div className="tPhoneShell">
              <div className="tPhoneNotch" />
              <div className="tPhoneScreen">
                {/* Instagram-style header */}
                <div className="tPhoneInstaHeader">
                  <div className="tPhoneInstaStories">
                    {testimonials.map((t, i) => (
                      <button
                        key={t.id}
                        className={"tPhoneInstaStory" + (i === active ? " tPhoneInstaStoryActive" : "")}
                        onClick={() => setActive(i)}
                        style={{ borderColor: i === active ? t.accent : "transparent" }}
                      >
                        <span style={{ background: t.accent + "44", color: t.accent, fontSize: 8, fontWeight: 700, width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "50%" }}>
                          {t.initials}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
                {/* Active card inside screen */}
                <div className="tPhoneScreenContent">
                  <motion.div
                    key={activeT.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <PhoneCard t={activeT} />
                  </motion.div>
                </div>
                {/* Instagram-style actions */}
                <div className="tPhoneInstaActions">
                  <div className="tPhoneInstaAction">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    <span>{activeT.rate}</span>
                  </div>
                  <div className="tPhoneInstaAction">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  </div>
                  <div className="tPhoneInstaAction">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  </div>
                </div>
              </div>
              <div className="tPhoneHomeBar" />
            </div>
          </div>

          {/* Right side card */}
          {total > 1 && (
            <button className="tSideCard tSideCardRight" onClick={next} aria-label="Next">
              <div className="tSideCardInner">
                <div className="tSideAvatar" style={{ background: rightT.accent + "33", color: rightT.accent }}>
                  {rightT.initials}
                </div>
                <div className="tSideInfo">
                  <p className="tSideName">{rightT.name}</p>
                  <p className="tSideProject">{rightT.project}</p>
                </div>
                <div className="tSideRate" style={{ color: rightT.accent }}>{rightT.rate}%</div>
              </div>
            </button>
          )}

        </div>

        {/* Dot indicators */}
        <div className="tDots">
          {testimonials.map((_, i) => (
            <button key={i} className={"tDot" + (i === active ? " tDotActive" : "")}
              style={i === active ? { background: activeT.accent } : {}}
              onClick={() => setActive(i)} aria-label={`Go to testimonial ${i + 1}`}
            />
          ))}
        </div>

        {/* Add testimonial */}
        <div className="tAddWrap">
          {!showForm ? (
            <button className="tAddBtn" onClick={() => setShowForm(true)}>
              + Leave a review
            </button>
          ) : (
            <div className="tForm">
              <h3 className="tFormTitle">Share your experience</h3>
              <div className="tFormGrid">
                <div className="tFormField">
                  <label className="tFormLabel">Your name</label>
                  <input className="tFormInput" placeholder="e.g. Juan dela Cruz" value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: sanitize(e.target.value) }))} />
                </div>
                <div className="tFormField">
                  <label className="tFormLabel">Project / System</label>
                  <input className="tFormInput" placeholder="e.g. Inventory Control System" value={form.project}
                    onChange={e => setForm(f => ({ ...f, project: sanitize(e.target.value) }))} />
                </div>
              </div>
              <div className="tFormField">
                <label className="tFormLabel">Satisfaction rate — <span style={{ color: accentColors[testimonials.length % accentColors.length] }}>{form.rate}%</span></label>
                <input type="range" min={1} max={100} value={form.rate} className="tFormRange"
                  onChange={e => setForm(f => ({ ...f, rate: Number(e.target.value) }))} />
              </div>
              <div className="tFormField">
                <label className="tFormLabel">Your comment</label>
                <textarea className="tFormTextarea" rows={3} placeholder="Tell us about your experience..."
                  value={form.comment} onChange={e => setForm(f => ({ ...f, comment: sanitize(e.target.value) }))} />
              </div>
              <div className="tFormActions">
                <button className="tFormCancel" onClick={() => setShowForm(false)}>Cancel</button>
                <button className="tFormSubmit" onClick={handleSubmit}>
                  {submitted ? "✓ Submitted!" : "Submit Review"}
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </section>
  );
}

/* ─── FAQ ───────────────────────────────────────────────────────────── */

const faqs = [
  {
    category: "Timeline",
    accent: "#c9a96e",
    q: "How long does it take to build a system?",
    a: (<>Depends on scope, but most systems ship in <strong>4–8 weeks</strong> from discovery call to final deployment. Smaller systems (Booking, Invoice, CRM) typically land in 3–4 weeks. Larger builds (Payroll, POS + E-commerce, Warehouse) run 6–10 weeks. You'll see a sprint-by-sprint timeline — with exact delivery dates — before we write a single line of code.</>),
  },
  {
    category: "Revisions",
    accent: "#7dc9a0",
    q: "Do you do revisions?",
    a: (<>Yes — revisions are built into every sprint. After each sprint delivery, you review the working module and we address feedback before moving to the next one. Post-launch, we include <strong>2 rounds of revisions</strong> within 30 days. Anything beyond that is covered under a support agreement.</>),
  },
  {
    category: "Tech Stack",
    accent: "#7eb8d4",
    q: "What tech stack do you use?",
    a: (<>We build across multiple stacks depending on deployment target:<br /><br />
      <strong>Public / Web Deployment</strong> — <strong>Laravel</strong> (PHP) for backend APIs and server-side logic, <strong>ReactJS</strong> for the frontend. Hosted on cloud infrastructure with full source code handover.<br /><br />
      <strong>IIS / Enterprise Intranet Deployment</strong> — <strong>ASP.NET + C#</strong>, deployed on Windows Server via IIS. Ideal for companies running internal networks, government setups, or corporate environments that require on-premise hosting.<br /><br />
      <strong>Desktop Applications</strong> — <strong>C# Windows Forms (WFA)</strong> for standalone desktop systems. No browser required — runs directly on Windows machines.<br /><br />
      All systems are handed over with full source code, database schema, and deployment documentation. No lock-in, no recurring license fees.</>),
  },
  {
    category: "Payment",
    accent: "#c4b5fd",
    q: "What are the payment terms?",
    a: (<><strong>30% downpayment to start, 70% on final delivery.</strong> The 30% downpayment locks in your sprint schedule and covers the discovery call, full roadmap, architecture planning, and the first sprint. The remaining 70% is due upon delivery of the final system. <strong>Note:</strong> if full payment is not received within 3 days of delivery, the demo will be temporarily shut down until payment is settled. We accept GCash, Maya, bank transfer, and PayMongo.</>),
  },
  {
    category: "Ownership",
    accent: "#f9a8d4",
    q: "Do I own the source code?",
    a: (<>Yes — <strong>full source code ownership</strong> is transferred on final payment. You get the entire codebase, database schema, deployment configuration, and documentation. No license fees, no vendor lock-in. The system is yours to host, modify, and scale however you need.</>),
  },
  {
    category: "Support",
    accent: "#67e8f9",
    q: "What happens after launch?",
    a: (<>Every system includes <strong>30 days of post-launch support</strong> — bug fixes, minor tweaks, and deployment assistance. After that, we offer optional monthly support retainers for ongoing maintenance, feature additions, or priority response. Details are agreed per project.</>),
  },
  {
    category: "AI Visuals",
    accent: "#86efac",
    q: "What are the AI Visual files — what format and resolution?",
    a: (<>All AI interior, exterior, 3D animation, and character animation videos are delivered as <strong>MP4 files at 1080p full resolution</strong>, rendered at cinematic quality. Once purchased, they're available permanently in your dashboard — re-downloadable anytime. They're cleared for commercial use in presentations, proposals, and marketing.</>),
  },
];

function FaqSection() {
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  const toggle = (i: number) => setOpenIdx(prev => (prev === i ? null : i));

  return (
    <section className="vFaq" id="faq">
      <div className="vFaqInner">
        <div className="vSectionHeader" style={{ textAlign: "left" }}>
          <Reveal>
            <span className="vSectionEyebrow">FAQ</span>
          </Reveal>
          <Reveal delay={0.1}>
            <h2 className="vSectionTitle">Common questions.</h2>
          </Reveal>
          <Reveal delay={0.2}>
            <p className="vSectionSub">Everything you need to know before starting a project.</p>
          </Reveal>
        </div>

        <div className="vFaqList">
          {faqs.map((faq, i) => (
            <Reveal key={i} delay={i * 0.04}>
              <div className={`vFaqItem${openIdx === i ? " vFaqOpen" : ""}`}>
                <button className="vFaqTrigger" onClick={() => toggle(i)}>
                  <span className="vFaqQ">{faq.q}</span>
                  <span className="vFaqIcon">
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                    </svg>
                  </span>
                </button>
                <div className="vFaqBody">
                  <div className="vFaqBodyInner">
                    <p className="vFaqA">{faq.a}</p>
                  </div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Page ──────────────────────────────────────────────────────────── */
export default function VisitorPage() {
  useTrackVisit();

  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroY = useTransform(scrollYProgress, [0, 1], ["0%", "18%"]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  return (
    <div className="vPage">

      {/* ── Hero ────────────────────────────────────────────────────── */}
      <section className="vHero" ref={heroRef}>
        <motion.div className="vHeroBg" style={{ y: heroY }}>
          <video
            className="vHeroVideo"
            src="/hero-bg.mp4"
            autoPlay muted loop playsInline
          />
          <div className="vHeroOverlay" />
          {/* Grain texture */}
          <div className="vHeroGrain" />
        </motion.div>

        <motion.div className="vHeroContent" style={{ opacity: heroOpacity }}>
          <motion.p
            className="vHeroEyebrow"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
          >
            Digital Infrastructure · Enterprise Systems
          </motion.p>

          <motion.h1
            className="vHeroTitle"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
          >
            Systems built for<br />
            <em className="vHeroItalic">modern business.</em>
          </motion.h1>

          <motion.p
            className="vHeroSub"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.45 }}
          >
            Warehouse, construction, inventory, and operational systems<br />
            engineered with cinematic precision.
          </motion.p>

          <motion.div
            className="vHeroActions"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.65 }}
          >
            <Link href="/register" className="vHeroBtnPrimary">Start a Project</Link>
            <Link href="#systems" className="vHeroBtnSecondary">
              Explore Systems
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M1 7h12M8 3l5 4-5 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </Link>
          </motion.div>

          {/* Scroll indicator */}
          {/* <motion.div
            className="vScrollHint"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5, duration: 1 }}
          >
            <div className="vScrollLine" />
            <span>scroll</span>
          </motion.div> */}
        </motion.div>
      </section>

      {/* ── Trust marquee ───────────────────────────────────────────── */}
      <section className="vTrust">
        <Reveal>
          <p className="vTrustLabel">Built with enterprise-grade technology</p>
        </Reveal>
        <Marquee items={techStack} />
      </section>

      {/* ── Systems ─────────────────────────────────────────────────── */}
      <section className="vSystems" id="systems">
        <div className="vSectionHeader">
          <Reveal>
            <span className="vSectionEyebrow">Systems Showcase</span>
          </Reveal>
          <Reveal delay={0.1}>
            <h2 className="vSectionTitle">Choose your infrastructure.</h2>
          </Reveal>
          <Reveal delay={0.2}>
            <p className="vSectionSub">Built once. Owned forever. Engineered to outlast your competition.</p>
          </Reveal>
        </div>

        <SystemsCarousel />

        {/* Sprint & Agile Methodology */}
        <div className="vSprintInner">


          <div className="vSprintHeader">
            <Reveal>
              <span className="vSectionEyebrow">How We Build</span>
            </Reveal>
            <Reveal delay={0.1}>
              <h2 className="vSectionTitle">Sprint & Agile methodology.</h2>
            </Reveal>
            <Reveal delay={0.2}>
              <p className="vSectionSub">
                Every system we build follows a structured agile process — from your first call to your final approval before a single line of code is written.
              </p>
            </Reveal>
          </div>

          <div className="vSprintTrack">

            {/* Connector line */}
            <div className="vSprintLine" />

            {/* Step 1 */}
            <Reveal delay={0.0}>
              <div className="vSprintStep">
                <div className="vSprintStepNum">01</div>
                <div className="vSprintStepIcon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" fill="currentColor" />
                  </svg>
                </div>
                <div className="vSprintStepBody">
                  <h3 className="vSprintStepTitle">Discovery Call (VC)</h3>
                  <p className="vSprintStepDesc">
                    We start with a video call — no forms, no guesswork. You walk us through your business, your pain points, and what you need the system to do. We listen, ask the right questions, and capture every requirement in detail.
                  </p>
                  <ul className="vSprintStepList">
                    <li>Understand your business workflow</li>
                    <li>Identify pain points & bottlenecks</li>
                    <li>Record all feature requirements</li>
                    <li>Define scope and priorities</li>
                  </ul>
                </div>
              </div>
            </Reveal>

            {/* Step 2 */}
            <Reveal delay={0.1}>
              <div className="vSprintStep">
                <div className="vSprintStepNum">02</div>
                <div className="vSprintStepIcon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <div className="vSprintStepBody">
                  <h3 className="vSprintStepTitle">Feature Recording & Backlog</h3>
                  <p className="vSprintStepDesc">
                    Every feature discussed in the call is documented into a structured backlog — broken down into user stories, modules, and sprint tasks. Nothing gets lost, nothing gets assumed.
                  </p>
                  <ul className="vSprintStepList">
                    <li>All features logged as user stories</li>
                    <li>Modules broken into sprint tasks</li>
                    <li>Priority ranking per feature</li>
                    <li>Effort estimation per task</li>
                  </ul>
                </div>
              </div>
            </Reveal>

            {/* Step 3 */}
            <Reveal delay={0.2}>
              <div className="vSprintStep">
                <div className="vSprintStepNum">03</div>
                <div className="vSprintStepIcon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <div className="vSprintStepBody">
                  <h3 className="vSprintStepTitle">Full Project Roadmap</h3>
                  <p className="vSprintStepDesc">
                    We build a complete project roadmap — sprint by sprint, milestone by milestone. You see exactly what gets built, when it ships, and what the final system looks like before we write a single line of code.
                  </p>
                  <ul className="vSprintStepList">
                    <li>Sprint-by-sprint delivery plan</li>
                    <li>Milestone & deadline mapping</li>
                    <li>Database & system architecture</li>
                    <li>UI/UX wireframe overview</li>
                  </ul>
                </div>
              </div>
            </Reveal>

            {/* Step 4 */}
            <Reveal delay={0.3}>
              <div className="vSprintStep">
                <div className="vSprintStepNum">04</div>
                <div className="vSprintStepIcon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <div className="vSprintStepBody">
                  <h3 className="vSprintStepTitle">Client Approval</h3>
                  <p className="vSprintStepDesc">
                    The full roadmap is sent to you for review. You approve every feature, every sprint, and every milestone. No surprises, no scope creep. We don't start building until you sign off.
                  </p>
                  <ul className="vSprintStepList">
                    <li>Roadmap sent via email & VC</li>
                    <li>Client reviews all features</li>
                    <li>Revisions handled before coding</li>
                    <li>Formal sign-off required</li>
                  </ul>
                </div>
              </div>
            </Reveal>

            {/* Step 5 */}
            <Reveal delay={0.4}>
              <div className="vSprintStep vSprintStepLast">
                <div className="vSprintStepNum">05</div>
                <div className="vSprintStepIcon vSprintStepIconActive">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <div className="vSprintStepBody">
                  <h3 className="vSprintStepTitle">Sprint Execution & Delivery</h3>
                  <p className="vSprintStepDesc">
                    Once approved, we execute — sprint by sprint, with regular progress updates. Each sprint delivers a working slice of the system. You see real progress every week, not just a final dump at the end.
                  </p>
                  <ul className="vSprintStepList">
                    <li>Agile sprint cycles (1–2 weeks)</li>
                    <li>Weekly progress updates</li>
                    <li>Testing per sprint before next</li>
                    <li>Final UAT & deployment</li>
                  </ul>
                </div>
              </div>
            </Reveal>

          </div>

          {/* Bottom CTA */}
          <Reveal delay={0.3}>
            <div className="vSprintCta">
              <p className="vSprintCtaText">Ready to start your discovery call?</p>
              <a href="/register" className="vHeroBtnPrimary">Book a VC Call</a>
            </div>
          </Reveal>


        </div>
      </section>

      {/* ── Comparison Table ─────────────────────────────────────────── */}
      <section className="vCompare" id="compare">
        <div className="vCompareInner">
          <div className="vSectionHeader">
            <Reveal><span className="vSectionEyebrow">Why Matthew Studio</span></Reveal>
            <Reveal delay={0.1}>
              <h2 className="vSectionTitle">Compare your options.</h2>
            </Reveal>
            <Reveal delay={0.2}>
              <p className="vSectionSub">Not all solutions are equal. Here's how we stack up against the alternatives.</p>
            </Reveal>
          </div>

          <Reveal delay={0.15}>
            <div className="vCompareTable">
              {/* Column headers */}
              <div className="vCompareHeader">
                <div className="vCompareHeaderCell vCompareFeatureCol">Feature</div>
                <div className="vCompareHeaderCell vCompareUs">
                  <span className="vCompareUsLabel">Matthew Studio</span>
                  <span className="vCompareUsBadge">Recommended</span>
                </div>
                <div className="vCompareHeaderCell">Agency</div>
                <div className="vCompareHeaderCell">Template</div>
              </div>

              {/* Rows */}
              {[
                { feature: "Custom to your business",  us: true,  agency: true,  template: false },
                { feature: "Fixed price upfront",       us: true,  agency: false, template: true  },
                { feature: "Source code ownership",     us: true,  agency: false, template: false },
                { feature: "1 month free support",      us: true,  agency: false, template: false },
                { feature: "Sprint-based delivery",     us: true,  agency: true,  template: false },
                { feature: "Lifetime access",           us: true,  agency: false, template: true  },
                { feature: "Philippine peso pricing",   us: true,  agency: false, template: false },
                { feature: "No monthly fees",           us: true,  agency: false, template: true  },
                { feature: "Dedicated project manager", us: true,  agency: true,  template: false },
                { feature: "Ready in 2–6 weeks",        us: true,  agency: false, template: true  },
                { feature: "Scalable architecture",     us: true,  agency: true,  template: false },
                { feature: "BIR / PH compliance built-in", us: true, agency: false, template: false },
              ].map((row, i) => (
                <div key={row.feature} className={"vCompareRow" + (i % 2 === 0 ? " vCompareRowAlt" : "")}>
                  <div className="vCompareCell vCompareFeatureCol">
                    <span className="vCompareFeatureText">{row.feature}</span>
                  </div>
                  <div className="vCompareCell vCompareUs">
                    {row.us
                      ? <span className="vCompareTick vCompareTickUs"><svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 7l3.5 3.5L12 3" stroke="#7dc9a0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg></span>
                      : <span className="vCompareCross"><svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 2l8 8M10 2l-8 8" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" strokeLinecap="round"/></svg></span>
                    }
                  </div>
                  <div className="vCompareCell">
                    {row.agency
                      ? <span className="vCompareTick"><svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 7l3.5 3.5L12 3" stroke="rgba(255,255,255,0.3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg></span>
                      : <span className="vCompareCross"><svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 2l8 8M10 2l-8 8" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" strokeLinecap="round"/></svg></span>
                    }
                  </div>
                  <div className="vCompareCell">
                    {row.template
                      ? <span className="vCompareTick"><svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 7l3.5 3.5L12 3" stroke="rgba(255,255,255,0.3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg></span>
                      : <span className="vCompareCross"><svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 2l8 8M10 2l-8 8" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" strokeLinecap="round"/></svg></span>
                    }
                  </div>
                </div>
              ))}

              {/* Price row */}
              <div className="vCompareRow vComparePriceRow">
                <div className="vCompareCell vCompareFeatureCol">
                  <span className="vCompareFeatureText">Typical price range</span>
                </div>
                <div className="vCompareCell vCompareUs">
                  <span className="vComparePriceUs">₱2,999 – ₱15,000</span>
                </div>
                <div className="vCompareCell">
                  <span className="vComparePriceOther">₱50,000 – ₱300,000+</span>
                </div>
                <div className="vCompareCell">
                  <span className="vComparePriceOther">₱500 – ₱5,000 + monthly fees</span>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── How We Build ─────────────────────────────────────────── */}
      {/* ── Process ─────────────────────────────────────────────────── */}
      <section className="vPriceSection" id="pricing">
        <div className="vPriceSectionInner">

          {/* Header */}
          <div className="vSectionHeader">
            <Reveal><span className="vSectionEyebrow">Pricing Transparency</span></Reveal>
            <Reveal delay={0.1}>
              <h2 className="vSectionTitle">What actually drives cost.</h2>
            </Reveal>
            <Reveal delay={0.2}>
              <p className="vSectionSub">
                No hidden fees. No vague quotes. Here's exactly what moves the number up or down.
              </p>
            </Reveal>
          </div>

          {/* 3 factor cards */}
          <div className="vPriceFactors">
            {[
              {
                num: "01",
                label: "Complexity",
                accent: "#7dc9a0",
                icon: (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ),
                desc: "The number of modules, user roles, and business rules directly determines how much architecture and engineering is required.",
                low: { label: "Simple", detail: "1–2 modules, single role, basic CRUD", price: "₱5,000 – ₱8,000" },
                high: { label: "Complex", detail: "5+ modules, multi-role, advanced logic", price: "₱15,000 – ₱35,000+" },
                factors: ["Number of modules", "User roles & permissions", "Business rule complexity", "Data relationships"],
              },
              {
                num: "02",
                label: "Integrations",
                accent: "#7eb8d4",
                icon: (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                    <path d="M18 20V10M12 20V4M6 20v-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ),
                desc: "Every third-party service — payment gateways, SMS APIs, email providers, government portals — adds development and maintenance overhead.",
                low: { label: "None", detail: "Standalone system, no external APIs", price: "No added cost" },
                high: { label: "Multiple", detail: "PayMongo, BIR, SMS, email, maps, etc.", price: "+₱3,000 – ₱8,000 each" },
                factors: ["Payment gateways (PayMongo)", "Government APIs (BIR, SSS)", "SMS & email providers", "Third-party data feeds"],
              },
              {
                num: "03",
                label: "Timeline",
                accent: "#c4b5fd",
                icon: (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5"/>
                    <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ),
                desc: "Rush projects require parallel sprint execution and dedicated resources. Standard timelines allow for proper planning, testing, and delivery.",
                low: { label: "Standard", detail: "4–8 weeks, planned sprints", price: "Base rate" },
                high: { label: "Rush", detail: "Under 2 weeks, expedited delivery", price: "+20% – +40% premium" },
                factors: ["Delivery deadline", "Sprint parallelism required", "Testing & QA time", "Client review cycles"],
              },
            ].map((f, i) => (
              <Reveal key={f.label} delay={i * 0.1}>
                <div className="vPriceCard" style={{ "--acc": f.accent } as React.CSSProperties}>
                  <div className="vPriceCardGlow" />
                  <div className="vPriceCardTop">
                    <span className="vPriceNum">{f.num}</span>
                    <div className="vPriceIcon" style={{ color: f.accent, borderColor: f.accent + "33", background: f.accent + "12" }}>
                      {f.icon}
                    </div>
                  </div>
                  <h3 className="vPriceLabel" style={{ color: f.accent }}>{f.label}</h3>
                  <p className="vPriceDesc">{f.desc}</p>

                  {/* Low / High range */}
                  <div className="vPriceRange">
                    <div className="vPriceRangeRow">
                      <span className="vPriceRangeBadge" style={{ color: f.accent, borderColor: f.accent + "33", background: f.accent + "10" }}>Low</span>
                      <div className="vPriceRangeBody">
                        <span className="vPriceRangeDetail">{f.low.detail}</span>
                        <span className="vPriceRangePrice" style={{ color: f.accent }}>{f.low.price}</span>
                      </div>
                    </div>
                    <div className="vPriceRangeDivider" />
                    <div className="vPriceRangeRow">
                      <span className="vPriceRangeBadge" style={{ color: f.accent, borderColor: f.accent + "33", background: f.accent + "10" }}>High</span>
                      <div className="vPriceRangeBody">
                        <span className="vPriceRangeDetail">{f.high.detail}</span>
                        <span className="vPriceRangePrice" style={{ color: f.accent }}>{f.high.price}</span>
                      </div>
                    </div>
                  </div>

                  {/* What factors in */}
                  <div className="vPriceFactorList">
                    <span className="vPriceFactorLabel">Factors in:</span>
                    <ul className="vPriceFactorItems">
                      {f.factors.map((item) => (
                        <li key={item} className="vPriceFactorItem">
                          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ flexShrink: 0 }}>
                            <path d="M1.5 5l2.5 2.5 4.5-4.5" stroke={f.accent} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>

          {/* Bottom note */}
          <Reveal delay={0.3}>
            <div className="vPriceNote">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, opacity: 0.5 }}>
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              <p>
                Every project starts with a <strong>free discovery call</strong> where we scope your requirements and give you a fixed price — no surprises mid-build.{" "}
                <a href="/register" className="vPriceNoteLink">Book your call →</a>
              </p>
            </div>
          </Reveal>

        </div>
      </section>

      {/* ── Testimonials ─────────────────────────────────────────── */}
      {/* ── Testimonials — social proof while still warm ────────────── */}
      <TestimonialsSection />

      {/* ── About ───────────────────────────────────────────────────── */}
      <section className="vAbout" id="about">
        <div className="vAboutInner">
          <div className="vAboutLeft">
            <Reveal><span className="vSectionEyebrow">About</span></Reveal>
            <Reveal delay={0.1}>
              <h2 className="vAboutTitle">
                We architect systems that<br />
                <em>think ahead.</em>
              </h2>
            </Reveal>
          </div>
          <div className="vAboutRight">
            <Reveal delay={0.15}>
              <p className="vAboutP">
                Matthew Studio is a digital systems company operating at the intersection of enterprise infrastructure and cinematic design. We don't build templates — we engineer precision tools for businesses that demand more than off-the-shelf software.
              </p>
            </Reveal>
            <Reveal delay={0.25}>
              <p className="vAboutP">
                Every system we deliver is architected for scale, built with enterprise-grade standards, and designed with the kind of visual precision usually reserved for luxury products. The result is infrastructure that performs and impresses.
              </p>
            </Reveal>
            <Reveal delay={0.35}>
              <div className="vAboutStats">
                <div className="vAboutStat">
                  <span className="vAboutStatNum">3+</span>
                  <span className="vAboutStatLabel">System Types</span>
                </div>
                <div className="vAboutStat">
                  <span className="vAboutStatNum">100%</span>
                  <span className="vAboutStatLabel">Custom Built</span>
                </div>
                <div className="vAboutStat">
                  <span className="vAboutStatNum">∞</span>
                  <span className="vAboutStatLabel">Lifetime Access</span>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── Guarantee ────────────────────────────────────────────── */}
      {/* ── Guarantee / Trust Badges ─────────────────────────────────── */}
      <section className="vTrustBadges" id="guarantee">
        <div className="vTrustBadgesInner">
          <Reveal>
            <span className="vSectionEyebrow">Our Guarantee</span>
          </Reveal>
          <Reveal delay={0.1}>
            <h2 className="vSectionTitle">Built with confidence. Backed by commitment.</h2>
          </Reveal>
          <Reveal delay={0.2}>
            <p className="vSectionSub">Every system we deliver comes with these guarantees — no asterisks, no fine print.</p>
          </Reveal>

          <div className="vBadgeGrid">
            {[
              {
                accent: "#7dc9a0",
                icon: (
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ),
                title: "1 Month Free Support",
                desc: "After delivery, we stay. Bug fixes, questions, and minor tweaks — all covered free for 30 days. No ticket system. Direct access.",
                tag: "Post-delivery",
              },
              {
                accent: "#7eb8d4",
                icon: (
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ),
                title: "Source Code Included",
                desc: "You own 100% of the codebase. Full repository access, no lock-in, no licensing fees. Take it anywhere, modify anything.",
                tag: "Full ownership",
              },
              {
                accent: "#c4b5fd",
                icon: (
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                    <path d="M12 2L2 7l10 5 10-5-10-5z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ),
                title: "Lifetime Access",
                desc: "Your dashboard, your assets, your system — forever. No subscriptions, no renewals, no expiry. One payment, infinite access.",
                tag: "No subscriptions",
              },
              {
                accent: "#fcd34d",
                icon: (
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5"/>
                    <path d="M12 8v4l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                ),
                title: "Fixed Price. No Surprises.",
                desc: "We quote before we build. Scope, timeline, and price are locked in writing before a single line of code is written.",
                tag: "Transparent billing",
              },
              {
                accent: "#86efac",
                icon: (
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ),
                title: "Dedicated Project Manager",
                desc: "A single point of contact throughout every sprint. Weekly updates, direct communication, and zero ambiguity on project status.",
                tag: "Dedicated contact",
              },
              {
                accent: "#fdba74",
                icon: (
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ),
                title: "Sprint-Based Delivery",
                desc: "You see working software every 1–2 weeks — not a mystery box at the end. Each sprint is reviewed, approved, and signed off by you.",
                tag: "Agile process",
              },
            ].map((b, i) => (
              <Reveal key={b.title} delay={i * 0.07}>
                <div className="vBadgeCard" style={{ "--acc": b.accent } as React.CSSProperties}>
                  <div className="vBadgeCardGlow" />
                  <div className="vBadgeTop">
                    <div className="vBadgeIcon" style={{ color: b.accent, background: b.accent + "14", borderColor: b.accent + "33" }}>
                      {b.icon}
                    </div>
                    <span className="vBadgeTag" style={{ color: b.accent, borderColor: b.accent + "33", background: b.accent + "10" }}>{b.tag}</span>
                  </div>
                  <h3 className="vBadgeTitle">{b.title}</h3>
                  <p className="vBadgeDesc">{b.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Maintenance Fee ──────────────────────────────────────────── */}
      <section className="vMaintenance" id="maintenance">
        <div className="vMaintenanceInner">
          <div className="vSprintHeader">
            <Reveal><span className="vSectionEyebrow">Optional but Recommended</span></Reveal>
            <Reveal delay={0.1}><h2 className="vSectionTitle">Maintenance & Support.</h2></Reveal>
            <Reveal delay={0.2}>
              <p className="vSectionSub">
                Keep your system running at peak performance after launch. Most freelancers skip this — smart ones don&apos;t.
                This is where recurring income is built.
              </p>
            </Reveal>
          </div>

          {/* Tier cards */}
          <div className="vMaintenanceTiers">
            {[
              {
                label: "Basic",
                price: "₱4,500",
                period: "/month",
                color: "#7dc9a0",
                includes: ["Bug fixing & minor revisions", "Email support (48hr response)", "Monthly system health check", "Uptime monitoring"],
              },
              {
                label: "Priority Support",
                price: "₱8,500",
                period: "/month",
                color: "#7eb8d4",
                includes: ["Everything in Basic", "Priority response (24hrs)", "Security patches & updates", "Performance monitoring", "Database backups"],
                highlight: false,
              },
              {
                label: "Full Maintenance",
                price: "₱15,000",
                period: "/month",
                color: "#c4b5fd",
                includes: ["Everything in Priority", "Server monitoring & auto-backups", "Minor feature updates (up to 8hrs/month)", "Monthly performance report", "Dedicated support channel"],
                highlight: true,
              },
            ].map((tier, i) => (
              <Reveal key={i} delay={i * 0.1}>
                <div className={"vMaintenanceTier" + (tier.highlight ? " vMaintenanceTierHighlight" : "")}
                  style={{ "--mt-color": tier.color } as React.CSSProperties}>
                  <div className="vMtHeader">
                    <span className="vMtLabel" style={{ color: tier.color }}>{tier.label}</span>
                    <div className="vMtPrice">
                      <span className="vMtAmount">{tier.price}</span>
                      <span className="vMtPeriod">{tier.period}</span>
                    </div>
                  </div>
                  <ul className="vMtFeatures">
                    {tier.includes.map((f, fi) => (
                      <li key={fi} className="vMtFeature">
                        <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                          <path d="M1 7l3.5 3.5L12 2" stroke={tier.color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        {f}
                      </li>
                    ))}
                  </ul>
                  <a href="/register" className="vMtBtn" style={{ background: tier.highlight ? tier.color : "transparent",
                    borderColor: tier.color, color: tier.highlight ? "#000" : tier.color }}>
                    Get Started
                  </a>
                </div>
              </Reveal>
            ))}
          </div>

          {/* Note */}
          <Reveal delay={0.3}>
            <div className="vMaintenanceNote vMaintenanceNoteEmphasis">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, marginTop: 1 }}>
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" stroke="#f59e0b" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                <line x1="12" y1="9" x2="12" y2="13" stroke="#f59e0b" strokeWidth="1.8" strokeLinecap="round"/>
                <line x1="12" y1="17" x2="12.01" y2="17" stroke="#f59e0b" strokeWidth="2.2" strokeLinecap="round"/>
              </svg>
              <span>
                Maintenance does <strong>not</strong> include major new features.{" "}
                <strong>New features are scoped and quoted separately as a new project.</strong>
              </span>
            </div>
          </Reveal>
        </div>
      </section>



      {/* ── AI Visual Systems ─────────────────────────────────────────────── */}
      {/* ── AI Visual Systems — Header only, contained ── */}
      <section className="vAiSection" id="ai-visuals">
        <div className="vAiSectionInner">
          <div className="vAiHeader">
            <Reveal>
              <span className="vSectionEyebrow">AI Visual Systems</span>
            </Reveal>
            <Reveal delay={0.1}>
              <h2 className="vAiMainTitle">
                Spaces that don&apos;t exist.<br />
                <em className="vHeroItalic">Until they do.</em>
              </h2>
            </Reveal>
            <Reveal delay={0.2}>
              <p className="vAiHeaderSub">
                AI-generated interior and exterior design films — cinematic, full-resolution,
                and ready to use. Purchase once. Download forever.
              </p>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          STANDALONE SECTION 1 — ARCHITECTURE
          Scroll-jacked intro → Interior + Exterior video sections
      ═══════════════════════════════════════════════════════════════ */}
      <ArchitectureIntroSection />
      <ArchitectureVideosSection />

      {/* ── Divider ── */}
      {/*
      <div className="vAiSectionDivider">
        <div className="vAiSectionDividerLine" />
        <span className="vAiSectionDividerLabel">3D Modeling</span>
        <div className="vAiSectionDividerLine" />
      </div>
      */}

      {/* ═══════════════════════════════════════════════════════════════
          STANDALONE SECTION 2 — MODELING
          Full-width sticky scroll-jacking: orcs → videos
      ═══════════════════════════════════════════════════════════════ */}
      {/* ── Modeling intro — standalone ── */}
      <ModelingIntro />

      {/* ── Modeling magazine — rendered directly after intro ── */}
      <ModelingMagazine>
        <MagazineSection
          label="3D Animation"
          labelAccent="#4ade80"
          title="3 Animations."
          titleAccent="#4ade80"
          italicLine="Rendered in Blender."
          desc="Hand-modelled 3D assets animated in Blender — cinematic camera orbits, HDRI lighting, and photorealistic metal shaders. Full resolution MP4, lifetime access."
          accent="#4ade80"
          gradient="linear-gradient(135deg, #061a0e 0%, #0e2a18 60%, #0d0c0b 100%)"
          cards={animationCards}
          ctaLabel="Get Animation Access"
          delay={0.1}
        />
        <div className="vObjNote">
          <div className="vObjNoteLeft">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" style={{ color: "#4ade80", flexShrink: 0 }}>
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
              <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
              <line x1="12" y1="22.08" x2="12" y2="12"/>
            </svg>
            <div>
              <p className="vObjNoteTitle"><span style={{ color: "#4ade80" }}>.OBJ source files included</span> with every 3D animation purchase.</p>
              <p className="vObjNoteDesc">Every weapon animation comes with the original <strong>.OBJ + .MTL source files</strong> — import directly into Blender, Maya, or Cinema 4D. Files are <strong>not publicly accessible</strong> — delivered privately to your email upon purchase.</p>
              <div className="vObjNoteBadges">
                {[".OBJ", ".MTL", "Blender", "Maya", "Cinema 4D"].map(b => <span key={b} className="vObjBadge">{b}</span>)}
                <span className="vObjBadgePrivate">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                  Once purchased, lifetime access.
                </span>
              </div>
            </div>
          </div>
        </div>
        <MagazineSection
          label="3D Character Animation"
          labelAccent="#86efac"
          title="3 Characters."
          titleAccent="#86efac"
          italicLine="Sculpted in Blender."
          desc="High-poly orc character animations rendered in Blender — cinematic camera orbits, HDRI environment lighting, procedural skin shaders, and full shadow passes. Full resolution MP4, lifetime access."
          accent="#86efac"
          gradient="linear-gradient(135deg, #061a0a 0%, #0e2a12 60%, #0d0c0b 100%)"
          cards={orcCards}
          ctaLabel="Get Character Access"
          delay={0.15}
        />
        <div className="vObjNote" style={{ borderColor: "rgba(134,239,172,0.18)", background: "rgba(134,239,172,0.05)" }}>
          <div className="vObjNoteLeft">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" style={{ color: "#86efac", flexShrink: 0 }}>
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
              <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
              <line x1="12" y1="22.08" x2="12" y2="12"/>
            </svg>
            <div>
              <p className="vObjNoteTitle"><span style={{ color: "#86efac" }}>.OBJ source files included</span> with every 3D character animation purchase.</p>
              <p className="vObjNoteDesc">Every character animation comes with the original <strong>.OBJ + .MTL source files</strong> — import directly into Blender, Maya, or Cinema 4D. Modify the mesh, apply your own shaders, or re-render at any resolution. Files delivered privately to your email upon purchase.</p>
              <div className="vObjNoteBadges">
                {[".OBJ", ".MTL", "Blender", "Maya", "Cinema 4D"].map(b => (
                  <span key={b} className="vObjBadge" style={{ color: "#86efac", background: "rgba(134,239,172,0.1)", borderColor: "rgba(134,239,172,0.2)" }}>{b}</span>
                ))}
                <span className="vObjBadgePrivate">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                  Once purchased, lifetime access.
                </span>
              </div>
            </div>
          </div>
        </div>
      </ModelingMagazine>

      {/* ── Final AI CTA — contained block ── */}
      <section className="vAiCtaSection">
        <div className="vAiSectionInner">
          <div className="vAiSectionBlock vAiCtaBlock">
            <p className="vAiCtaEyebrow">20 videos · .OBJ source files · Full resolution · Lifetime access</p>
            <h3 className="vAiCtaTitle">
              Own the collection.<br />
              <em style={{ color: "#7dc9a0", fontStyle: "italic" }}>Start today.</em>
            </h3>
            <p className="vAiCtaSub">Register free, then purchase. Your videos are waiting in your dashboard the moment payment clears.</p>
            <a href="/register" className="vAiGetAccessBtn vAiCtaBtn" style={{ background: "#7dc9a0" }}>
              Get Lifetime Access
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                <path d="M1 12L12 1M12 1H6M12 1v6" stroke="#0d0c0b" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </a>
          </div>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────── */}
      {/* ── FAQ — last objection clearance before CTA ──────────────── */}
      <FaqSection />

      {/* ── Final CTA ───────────────────────────────────────────────── */}
      <section className="vCta">
        <div className="vCtaBg" />
        <div className="vCtaContent">
          <Reveal>
            <span className="vSectionEyebrow" style={{ color: "rgba(255,255,255,0.5)" }}>Ready to build?</span>
          </Reveal>
          <Reveal delay={0.1}>
            <h2 className="vCtaTitle">
              Build infrastructure<br />that outlasts trends.
            </h2>
          </Reveal>
          <Reveal delay={0.2}>
            <p className="vCtaSub">
              Premium digital systems for modern operations.<br />
              Built once. Yours forever.
            </p>
          </Reveal>
          <Reveal delay={0.3}>
            <div className="vCtaActions">
              <Link href="/register" className="vCtaBtn">Start a Project</Link>
              <Link href="/systems" className="vCtaBtnGhost">Browse Systems</Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────── */}
      <footer className="vFooter">
        <div className="vFooterTop">
          <div className="vFooterBrand">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/favicon.png" alt="Matthew Studio" className="vNavLogoImg" />
            <span className="vFooterLogoText">Matthew Studio</span>
          </div>
          <nav className="vFooterNav">
            <Link href="#systems" className="vFooterLink">Systems</Link>
            <Link href="#process" className="vFooterLink">Process</Link>
            <Link href="#faq" className="vFooterLink">FAQ</Link>
            <Link href="#about" className="vFooterLink">About</Link>
            <Link href="/login" className="vFooterLink">Sign In</Link>
            <Link href="/register" className="vFooterLink">Sign Up</Link>
          </nav>
        </div>
        <div className="vFooterBottom">
          <p className="vFooterCopy">© {new Date().getFullYear()} Matthew Studio. All rights reserved.</p>
          <p className="vFooterTagline">System · Services · Digital Assets</p>
        </div>
      </footer>
    </div>
  );
}