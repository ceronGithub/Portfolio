// ArchitectureVideosSection — Visitor > Architecture Interior + Exterior videos.
// Self-contained: owns its card data, SlideStack, and MagazineSection layout.
// Sits at z-index: 51 to render above the ArchitectureIntroSection fixed overlay.

"use client";

import { useState, useEffect, useRef } from "react";
import { motion, useInView } from "framer-motion";
import "./architecture-videos-section.css";

// ── Types ────────────────────────────────────────────────────────────────
type ArchCard = {
  id:       string;
  title:    string;
  category: string;
  desc:     string;
  accent:   string;
  gradient: string;
  videoUrl: string;  // Cloudflare R2 direct URL
};

// ── R2 base URL ──────────────────────────────────────────────────────────
const R2 = "https://pub-2ce00f29dc8e495183023b1ecef335df.r2.dev";

// ── Interior cards ───────────────────────────────────────────────────────
const interiorCards: ArchCard[] = [
  {
    id:       "int-1",
    title:    "Cinematic Interior I",
    category: "AI Interior Film",
    desc:     "Natural light cascading through expansive windows. Materiality and atmosphere in perfect balance.",
    accent:   "#7dc9a0",
    gradient: "linear-gradient(135deg, #0d1a12 0%, #122018 40%, #0d0c0b 100%)",
    videoUrl: `${R2}/architecture/interior_1.mp4`,
  },
  {
    id:       "int-2",
    title:    "Cinematic Interior II",
    category: "AI Interior Film",
    desc:     "Luxury interiors at the precise moment ambient light becomes art.",
    accent:   "#7dc9a0",
    gradient: "linear-gradient(135deg, #0d1a12 0%, #122018 40%, #0d0c0b 100%)",
    videoUrl: `${R2}/architecture/interior_2.mp4`,
  },
  {
    id:       "int-3",
    title:    "Cinematic Interior III",
    category: "AI Interior Film",
    desc:     "Warm tonal depth and spatial geometry rendered with photorealistic precision.",
    accent:   "#7dc9a0",
    gradient: "linear-gradient(135deg, #0d1a12 0%, #122018 40%, #0d0c0b 100%)",
    videoUrl: `${R2}/architecture/interior_3.mp4`,
  },
  {
    id:       "int-4",
    title:    "Cinematic Interior IV",
    category: "AI Interior Film",
    desc:     "Quiet luxury — minimal forms, rich textures, and the stillness of a perfectly composed space.",
    accent:   "#7dc9a0",
    gradient: "linear-gradient(135deg, #0d1a12 0%, #122018 40%, #0d0c0b 100%)",
    videoUrl: `${R2}/architecture/interior_4.mp4`,
  },
  {
    id:       "int-5",
    title:    "Cinematic Interior V",
    category: "AI Interior Film",
    desc:     "Cinematic sweep through a residence where every surface has been considered and refined.",
    accent:   "#7dc9a0",
    gradient: "linear-gradient(135deg, #0d1a12 0%, #122018 40%, #0d0c0b 100%)",
    videoUrl: `${R2}/architecture/interior_5.mp4`,
  },
  {
    id:       "int-6",
    title:    "Cinematic Interior VI",
    category: "AI Interior Film",
    desc:     "Golden-hour interior light filtered through architecture — a study in atmosphere and calm.",
    accent:   "#7dc9a0",
    gradient: "linear-gradient(135deg, #0d1a12 0%, #122018 40%, #0d0c0b 100%)",
    videoUrl: `${R2}/architecture/interior_6.mp4`,
  },
  {
    id:       "int-7",
    title:    "Cinematic Interior VII",
    category: "AI Interior Film",
    desc:     "Minimalist elegance — open plan, curated objects, and the precise quality of evening light.",
    accent:   "#7dc9a0",
    gradient: "linear-gradient(135deg, #0d1a12 0%, #122018 40%, #0d0c0b 100%)",
    videoUrl: `${R2}/architecture/interior_7.mp4`,
  },
];

// ── Exterior cards ───────────────────────────────────────────────────────
const exteriorCards: ArchCard[] = [
  {
    id:       "ext-1",
    title:    "Drone Reveal",
    category: "AI Exterior Design",
    desc:     "Sweeping drone perspectives over architectural structures — scale, presence, and open sky.",
    accent:   "#8fc99a",
    gradient: "linear-gradient(135deg, #0d1a10 0%, #142018 40%, #0d0c0b 100%)",
    videoUrl: `${R2}/architecture/exterior_1.mp4`,
  },
  {
    id:       "ext-2",
    title:    "Landscape Study",
    category: "AI Exterior Design",
    desc:     "Ground-level compositions where structure meets terrain. Architecture as part of the natural world.",
    accent:   "#8fc99a",
    gradient: "linear-gradient(135deg, #0d1a10 0%, #142018 40%, #0d0c0b 100%)",
    videoUrl: `${R2}/architecture/exterior_2.mp4`,
  },
  {
    id:       "ext-3",
    title:    "Architectural Vision",
    category: "AI Exterior Design",
    desc:     "AI-rendered facades with precision materiality — glass, concrete, and light in dialogue.",
    accent:   "#8fc99a",
    gradient: "linear-gradient(135deg, #0d1a10 0%, #142018 40%, #0d0c0b 100%)",
    videoUrl: `${R2}/architecture/exterior_3.mp4`,
  },
  {
    id:       "ext-4",
    title:    "Project 01",
    category: "AI Exterior Design",
    desc:     "A residential exterior study — clean lines, natural surroundings, and cinematic framing.",
    accent:   "#8fc99a",
    gradient: "linear-gradient(135deg, #0d1a10 0%, #142018 40%, #0d0c0b 100%)",
    videoUrl: `${R2}/architecture/exterior_4.mp4`,
  },
  // TODO: upload to R2 then add ext-5, ext-6, ext-7 here matching exterior_5.mp4 etc.
];

// ── SlideStack — auto-advances to next video on end, loops through all ──
function SlideStack({ cards, accent }: { cards: ArchCard[]; accent: string }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  const activeCard = cards[currentIndex];

  // Advance to next video — wraps around to 0 for continuous loop
  function handleEnded() {
    setCurrentIndex(prev => (prev + 1) % cards.length);
  }

  // Play new video when index changes
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.load();
      videoRef.current.play().catch(() => {});
    }
  }, [currentIndex]);

  return (
    <div className="avSlideStack">

      {/* Counter badge */}
      <div className="avSlideCounter" style={{ color: accent }}>
        {currentIndex + 1} / {cards.length}
      </div>

      {/* Full-width card */}
      <motion.div
        key={`card-${activeCard.id}`}
        className="avSlideCard avSlideCardActive"
        style={{ borderColor: accent + "40" }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="avSlideCardThumb" style={{ background: activeCard.gradient }}>
          <video
            ref={videoRef}
            key={activeCard.videoUrl}
            src={activeCard.videoUrl}
            className="avDriveEmbed"
            autoPlay
            muted
            playsInline
            preload="auto"
            onEnded={handleEnded}
          />
          <span
            className="avSlideActiveBadge"
            style={{ color: accent, borderColor: accent + "44" }}
          >
            Now Playing
          </span>
        </div>
        <div className="avSlideCardInfo">
          <span className="avCardCategory" style={{ color: accent }}>{activeCard.category}</span>
          <p className="avSlideCardTitle">{activeCard.title}</p>
          <p className="avSlideCardDesc">{activeCard.desc}</p>
        </div>
      </motion.div>

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
        title="7 Interior."
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
        title="4 Exterior."
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