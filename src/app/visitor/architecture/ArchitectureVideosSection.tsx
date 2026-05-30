// ArchitectureVideosSection — Visitor > AI Interior Film + AI Exterior Design.
// Dynamically fetches all .mp4 files from R2 via /api/r2-videos.
// New uploads to R2 appear automatically — no code changes needed.

"use client";

import { useState, useEffect, useRef } from "react";
import { motion, useInView }           from "framer-motion";
import "./architecture-videos-section.css";

type ArchCard = { id: string; title: string; category: string; accent: string; gradient: string; videoUrl: string; };

const INT_ACCENT   = "#7dc9a0";
const EXT_ACCENT   = "#8fc99a";
const INT_GRADIENT = "linear-gradient(135deg, #0d1a12 0%, #122018 40%, #0d0c0b 100%)";
const EXT_GRADIENT = "linear-gradient(135deg, #0d1a10 0%, #142018 40%, #0d0c0b 100%)";

function urlToCard(url: string, i: number, category: string, accent: string, gradient: string): ArchCard {
  const raw   = url.split("/").pop()?.replace(".mp4", "") ?? `Video ${i + 1}`;
  const title = raw.replace(/[-_]/g, " ").replace(/\b\w/g, c => c.toUpperCase());
  return { id: `${category}-${i}`, title, category, accent, gradient, videoUrl: url };
}

async function fetchR2(prefix: string): Promise<string[]> {
  try {
    const res = await fetch(`/api/r2-videos?prefix=${encodeURIComponent(prefix)}`);
    if (!res.ok) return [];
    const data = await res.json();
    return data.urls ?? [];
  } catch { return []; }
}

// ── SlideStack ────────────────────────────────────────────────────────────
function SlideStack({ cards, accent }: { cards: ArchCard[]; accent: string }) {
  const [idx, setIdx] = useState(0);
  const videoRef      = useRef<HTMLVideoElement>(null);
  const card          = cards[idx];

  function handleEnded() { setIdx(p => (p + 1) % cards.length); }

  useEffect(() => {
    videoRef.current?.load();
    videoRef.current?.play().catch(() => {});
  }, [idx]);

  if (!card) return null;

  return (
    <div className="avSlideStack">
      <div className="avSlideCounter" style={{ color: accent }}>{idx + 1} / {cards.length}</div>
      <motion.div
        key={card.id}
        className="avSlideCard avSlideCardActive"
        style={{ borderColor: accent + "40" }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="avSlideCardThumb" style={{ background: card.gradient }}>
          <video
            ref={videoRef}
            key={card.videoUrl}
            src={card.videoUrl}
            className="avDriveEmbed"
            autoPlay muted playsInline preload="auto"
            onEnded={handleEnded}
          />
          <span className="avSlideActiveBadge" style={{ color: accent, borderColor: accent + "44" }}>
            Now Playing
          </span>
        </div>
        <div className="avSlideCardInfo">
          <span className="avCardCategory" style={{ color: accent }}>{card.category}</span>
          <p className="avSlideCardTitle">{card.title}</p>
        </div>
      </motion.div>
    </div>
  );
}

// ── MagazineSection ───────────────────────────────────────────────────────
function MagazineSection({
  label, titleSuffix, italicLine, desc, accent, gradient, r2Prefix, ctaLabel, delay,
}: {
  label: string; titleSuffix: string; italicLine: string; desc: string;
  accent: string; gradient: string; r2Prefix: string; ctaLabel: string; delay: number;
}) {
  const ref            = useRef(null);
  const inView         = useInView(ref, { once: true, margin: "-80px" });
  const [cards, setCards] = useState<ArchCard[]>([]);

  useEffect(() => {
    fetchR2(r2Prefix).then(urls =>
      setCards(urls.map((url, i) => urlToCard(url, i, label, accent, gradient)))
    );
  }, [r2Prefix, label, accent, gradient]);

  const countLabel = cards.length > 0 ? `${cards.length} ${titleSuffix}` : titleSuffix;

  return (
    <motion.div
      ref={ref}
      className="avMagSection"
      initial={{ opacity: 0, y: 48 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.9, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="avMagLeft" style={{ background: gradient }}>
        <div className="avMagLeftInner">
          <span className="avCardCategory" style={{ color: accent }}>{label}</span>
          <h3 className="avMagTitle">
            {countLabel}<br />
            <em className="avMagItalic" style={{ color: accent }}>{italicLine}</em>
          </h3>
          <p className="avMagDesc">{desc}</p>
          <div className="avSteps">
            {[
              ["01", "Create an account",       "Register with your email. Free, 30 seconds."],
              ["02", "Purchase the collection", "One-time payment. No subscription, no renewal."],
              ["03", "Download forever",        "Instant access. Re-download anytime from your dashboard."],
            ].map(([num, title, sub]) => (
              <div className="avStep" key={num}>
                <span className="avStepNum" style={{ color: accent }}>{num}</span>
                <div><strong>{title}</strong><p>{sub}</p></div>
              </div>
            ))}
          </div>
          <a href="/register" className="avGetAccessBtn" style={{ background: accent }}>
            {ctaLabel}
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
              <path d="M1 12L12 1M12 1H6M12 1v6" stroke="#0d0c0b" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </a>
        </div>
      </div>
      <div className="avMagRight">
        {cards.length > 0
          ? <SlideStack cards={cards} accent={accent} />
          : <div className="avSlideLoading" style={{ color: accent }}>Loading…</div>
        }
      </div>
    </motion.div>
  );
}

// ── Export ────────────────────────────────────────────────────────────────
export default function ArchitectureVideosSection() {
  return (
    <section className="avSection">
      <MagazineSection
        label="AI Interior Film" titleSuffix="Interiors." italicLine="Yours forever."
        desc="Warm light, material depth, and spatial atmosphere — AI-generated at full resolution. Purchase once, download anytime from your dashboard."
        accent={INT_ACCENT} gradient={INT_GRADIENT}
        r2Prefix="architecture/interior"
        ctaLabel="Get Interior Access" delay={0}
      />
      <MagazineSection
        label="AI Exterior Design" titleSuffix="Exteriors." italicLine="Yours forever."
        desc="Drone sweeps, architectural facades, and atmospheric landscapes — cinematic AI films at full resolution. One purchase, lifetime access."
        accent={EXT_ACCENT} gradient={EXT_GRADIENT}
        r2Prefix="architecture/exterior"
        ctaLabel="Get Exterior Access" delay={0.05}
      />
    </section>
  );
}