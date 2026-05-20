// ArchitectureVideosSection — Visitor > Architecture Interior + Exterior videos.
// Self-contained: owns its card data, SlideStack, and MagazineSection layout.
// Sits at z-index: 51 to render above the ArchitectureIntroSection fixed overlay.

"use client";

import { useState } from "react";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import "./architecture-videos-section.css";

// ── Types ────────────────────────────────────────────────────────────────
type ArchCard = {
  id:          string;
  title:       string;
  category:    string;
  desc:        string;
  accent:      string;
  gradient:    string;
  videoFileId: string;
};

// ── Drive preview helper ─────────────────────────────────────────────────
const drivePreview = (id: string) =>
  `https://drive.google.com/file/d/${id}/preview`;

// ── Interior cards ───────────────────────────────────────────────────────
const interiorCards: ArchCard[] = [
  {
    id:          "int-1",
    title:       "Cinematic Interior I",
    category:    "AI Interior Film",
    desc:        "Natural light cascading through expansive windows. Materiality and atmosphere in perfect balance.",
    accent:      "#7dc9a0",
    gradient:    "linear-gradient(135deg, #0d1a12 0%, #122018 40%, #0d0c0b 100%)",
    videoFileId: "16IlbksfqFgAsIUlIbSnfG1k0miktYC0d",
  },
  {
    id:          "int-2",
    title:       "Cinematic Interior II",
    category:    "AI Interior Film",
    desc:        "Luxury interiors at the precise moment ambient light becomes art.",
    accent:      "#7dc9a0",
    gradient:    "linear-gradient(135deg, #0d1a12 0%, #122018 40%, #0d0c0b 100%)",
    videoFileId: "1cHTTgKBilMBXIrIGuSqB2tAb4A9WdobJ",
  },
  {
    id:          "int-3",
    title:       "Cinematic Interior III",
    category:    "AI Interior Film",
    desc:        "Warm tonal depth and spatial geometry rendered with photorealistic precision.",
    accent:      "#7dc9a0",
    gradient:    "linear-gradient(135deg, #0d1a12 0%, #122018 40%, #0d0c0b 100%)",
    videoFileId: "1A9sgWrWpi_Jq2NWZIH5mkh2XP491_2Ce",
  },
  {
    id:          "int-4",
    title:       "Cinematic Interior IV",
    category:    "AI Interior Film",
    desc:        "Quiet luxury — minimal forms, rich textures, and the stillness of a perfectly composed space.",
    accent:      "#7dc9a0",
    gradient:    "linear-gradient(135deg, #0d1a12 0%, #122018 40%, #0d0c0b 100%)",
    videoFileId: "1sr1O1HBL-q0oFZ2mfhgI3Zf3Y_AWmOzl",
  },
  {
    id:          "int-5",
    title:       "Cinematic Interior V",
    category:    "AI Interior Film",
    desc:        "Cinematic sweep through a residence where every surface has been considered and refined.",
    accent:      "#7dc9a0",
    gradient:    "linear-gradient(135deg, #0d1a12 0%, #122018 40%, #0d0c0b 100%)",
    videoFileId: "1wQtULgqst4SX2imqwdEhnqYRgzcPWJiu",
  },
  {
    id:          "int-6",
    title:       "Cinematic Interior VI",
    category:    "AI Interior Film",
    desc:        "Golden-hour interior light filtered through architecture — a study in atmosphere and calm.",
    accent:      "#7dc9a0",
    gradient:    "linear-gradient(135deg, #0d1a12 0%, #122018 40%, #0d0c0b 100%)",
    videoFileId: "1iqOFR1-0gO4v-Wk7PzBKZ2TsSeL0qoOW",
  },
  {
    id:          "int-7",
    title:       "Cinematic Interior VII",
    category:    "AI Interior Film",
    desc:        "Minimalist elegance — open plan, curated objects, and the precise quality of evening light.",
    accent:      "#7dc9a0",
    gradient:    "linear-gradient(135deg, #0d1a12 0%, #122018 40%, #0d0c0b 100%)",
    videoFileId: "1p34uCYAykKSH9c5fHXh1PuRn_S5XS3sG",
  },
];

// ── Exterior cards ───────────────────────────────────────────────────────
const exteriorCards: ArchCard[] = [
  {
    id:          "ext-1",
    title:       "Drone Reveal",
    category:    "AI Exterior Design",
    desc:        "Sweeping drone perspectives over architectural structures — scale, presence, and open sky.",
    accent:      "#8fc99a",
    gradient:    "linear-gradient(135deg, #0d1a10 0%, #142018 40%, #0d0c0b 100%)",
    videoFileId: "1QKCGiJCNzSbpkVsQPN073ws6WbZMwrZC",
  },
  {
    id:          "ext-2",
    title:       "Landscape Study",
    category:    "AI Exterior Design",
    desc:        "Ground-level compositions where structure meets terrain. Architecture as part of the natural world.",
    accent:      "#8fc99a",
    gradient:    "linear-gradient(135deg, #0d1a10 0%, #142018 40%, #0d0c0b 100%)",
    videoFileId: "1hIAB7FrCEnn8cfrGSCplccHkZ4Gonnxu",
  },
  {
    id:          "ext-3",
    title:       "Architectural Vision",
    category:    "AI Exterior Design",
    desc:        "AI-rendered facades with precision materiality — glass, concrete, and light in dialogue.",
    accent:      "#8fc99a",
    gradient:    "linear-gradient(135deg, #0d1a10 0%, #142018 40%, #0d0c0b 100%)",
    videoFileId: "1MJR8A38OCNRDxb_jRheBdRgexnAOugZf",
  },
  {
    id:          "ext-4",
    title:       "Project 01",
    category:    "AI Exterior Design",
    desc:        "A residential exterior study — clean lines, natural surroundings, and cinematic framing.",
    accent:      "#8fc99a",
    gradient:    "linear-gradient(135deg, #0d1a10 0%, #142018 40%, #0d0c0b 100%)",
    videoFileId: "1kp23x5YBnWovDamPDT2FS00d1ID9SB0k",
  },
  {
    id:          "ext-5",
    title:       "Project 02",
    category:    "AI Exterior Design",
    desc:        "Urban density and open space — a visual exploration of how buildings inhabit their environment.",
    accent:      "#8fc99a",
    gradient:    "linear-gradient(135deg, #0d1a10 0%, #142018 40%, #0d0c0b 100%)",
    videoFileId: "10CfcifgZBQMoxK2L_ANH8TJ8vUj7v26T",
  },
  {
    id:          "ext-6",
    title:       "Project 03",
    category:    "AI Exterior Design",
    desc:        "Late afternoon light across textured surfaces — the exterior moment just before dusk.",
    accent:      "#8fc99a",
    gradient:    "linear-gradient(135deg, #0d1a10 0%, #142018 40%, #0d0c0b 100%)",
    videoFileId: "1uK7a0BedMTfGWeZ17WxJt-YYKAJL3bZJ",
  },
  {
    id:          "ext-7",
    title:       "Project 04",
    category:    "AI Exterior Design",
    desc:        "Cinematic walkthrough of an architectural exterior — form, texture, and spatial rhythm.",
    accent:      "#8fc99a",
    gradient:    "linear-gradient(135deg, #0d1a10 0%, #142018 40%, #0d0c0b 100%)",
    videoFileId: "1On-oICTEgx81tNSRyW7DZYk3IOEDBiAT",
  },
];

// ── SlideStack ───────────────────────────────────────────────────────────
function SlideStack({ cards, accent }: { cards: ArchCard[]; accent: string }) {
  const [order, setOrder] = useState(cards.map((_, i) => i));

  const rotate = (dir: "up" | "down") => {
    setOrder((prev) => {
      const next = [...prev];
      if (dir === "down") {
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
    <div className="avSlideStack">

      {/* Up arrow */}
      <div className="avSlideOuterArrow avSlideOuterArrowTop">
        <button
          className="avSlideArrowBtn"
          onClick={() => rotate("up")}
          aria-label="Previous video"
          style={{ color: accent, borderColor: accent + "44" }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M2 10L7 4L12 10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <span className="avSlideArrowCount" style={{ color: accent }}>
          {order[0] + 1} / {cards.length}
        </span>
      </div>

      {/* Active card */}
      <motion.div
        key={`active-${activeCard.id}`}
        layout
        className="avSlideCard avSlideCardActive"
        style={{ borderColor: accent + "40" }}
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="avSlideCardThumb" style={{ background: activeCard.gradient }}>
          <iframe
            key={activeCard.videoFileId}
            src={drivePreview(activeCard.videoFileId)}
            className="avDriveEmbed"
            allow="autoplay"
            allowFullScreen
            title={activeCard.title}
          />
          <span
            className="avSlideActiveBadge"
            style={{ color: accent, borderColor: accent + "44" }}
          >
            Now Playing
          </span>
          {/* Logo overlay — hides Google Drive external-link icon */}
          <div className="avDriveIconOverlay">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/favicon.png" alt="Matthew Studio" className="avDriveOverlayLogo" />
          </div>
        </div>
        <div className="avSlideCardInfo">
          <span className="avCardCategory" style={{ color: accent }}>{activeCard.category}</span>
          <p className="avSlideCardTitle">{activeCard.title}</p>
          <p className="avSlideCardDesc">{activeCard.desc}</p>
        </div>
      </motion.div>

      {/* Down arrow */}
      <div className="avSlideOuterArrow avSlideOuterArrowBottom">
        <button
          className="avSlideArrowBtn"
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

// ── MagazineSection ──────────────────────────────────────────────────────
function MagazineSection({
  label, title, italicLine, desc, accent, gradient, cards, ctaLabel, delay,
}: {
  label:      string;
  title:      string;
  italicLine: string;
  desc:       string;
  accent:     string;
  gradient:   string;
  cards:      ArchCard[];
  ctaLabel:   string;
  delay:      number;
}) {
  const ref    = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <motion.div
      ref={ref}
      className="avMagSection"
      initial={{ opacity: 0, y: 48 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.9, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Left — text + steps + CTA */}
      <div className="avMagLeft" style={{ background: gradient }}>
        <div className="avMagLeftInner">
          <span className="avCardCategory" style={{ color: accent }}>{label}</span>
          <h3 className="avMagTitle">
            {title}<br />
            <em className="avMagItalic" style={{ color: accent }}>{italicLine}</em>
          </h3>
          <p className="avMagDesc">{desc}</p>
          <div className="avSteps">
            <div className="avStep">
              <span className="avStepNum" style={{ color: accent }}>01</span>
              <div>
                <strong>Create an account</strong>
                <p>Register with your email. Free, 30 seconds.</p>
              </div>
            </div>
            <div className="avStep">
              <span className="avStepNum" style={{ color: accent }}>02</span>
              <div>
                <strong>Purchase the collection</strong>
                <p>One-time payment. No subscription, no renewal.</p>
              </div>
            </div>
            <div className="avStep">
              <span className="avStepNum" style={{ color: accent }}>03</span>
              <div>
                <strong>Download forever</strong>
                <p>Instant access. Re-download anytime from your dashboard.</p>
              </div>
            </div>
          </div>
          <a href="/register" className="avGetAccessBtn" style={{ background: accent }}>
            {ctaLabel}
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
              <path d="M1 12L12 1M12 1H6M12 1v6" stroke="#0d0c0b" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </a>
        </div>
      </div>

      {/* Right — slide stack */}
      <div className="avMagRight">
        <SlideStack cards={cards} accent={accent} />
      </div>
    </motion.div>
  );
}

// ── Page export ──────────────────────────────────────────────────────────
export default function ArchitectureVideosSection() {
  return (
    <section className="avSection">
      <MagazineSection
        label="AI Interior Film"
        title="8 Interior."
        italicLine="Yours forever."
        desc="Warm light, material depth, and spatial atmosphere — AI-generated at full resolution. Purchase once, download anytime from your dashboard."
        accent="#7dc9a0"
        gradient="linear-gradient(135deg, #0d1a12 0%, #122018 60%, #0d0c0b 100%)"
        cards={interiorCards}
        ctaLabel="Get Interior Access"
        delay={0}
      />
      <MagazineSection
        label="AI Exterior Design"
        title="6 Exterior."
        italicLine="Yours forever."
        desc="Drone sweeps, architectural facades, and atmospheric landscapes — cinematic AI films at full resolution. One purchase, lifetime access."
        accent="#8fc99a"
        gradient="linear-gradient(135deg, #0d1a10 0%, #142018 60%, #0d0c0b 100%)"
        cards={exteriorCards}
        ctaLabel="Get Exterior Access"
        delay={0.05}
      />
    </section>
  );
}
