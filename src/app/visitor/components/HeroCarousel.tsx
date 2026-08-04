/**
 * FILE: visitor/components/HeroCarousel.tsx
 * ROLE: Visitor — public, no auth required
 *
 * PURPOSE:
 * The "AI Visual Systems" showcase row used on the landing page —
 * a rotating slide-stack of preview videos (SlideStack) paired with
 * an info card (MagazineSection), repeated per category (interior,
 * exterior, weapons, etc.). Extracted from page.tsx.
 *
 * NOTE: ActiveVideoPlayer is defined here but not currently called
 * anywhere in the app (dead code carried over from the original
 * page.tsx) — kept as-is since removing it wasn't part of this split.
 */
"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { drivePreview } from "../lib/visitorData";

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

/* ─── Dynamic R2 fetch ───────────────────────────────────────────────── */
type SlideCard = { id: string; title: string; category: string; accent: string; gradient: string; videoUrl: string; };

async function fetchR2Modeling(prefix: string): Promise<string[]> {
  try {
    const res = await fetch(`/api/r2-videos?prefix=${encodeURIComponent(prefix)}`);
    if (!res.ok) return [];
    const data = await res.json();
    return data.urls ?? [];
  } catch { return []; }
}

function urlToModelCard(url: string, i: number, category: string, accent: string, gradient: string): SlideCard {
  const raw   = url.split("/").pop()?.replace(".mp4", "") ?? `Video ${i + 1}`;
  const title = raw.replace(/[-_]/g, " ").replace(/\b\w/g, c => c.toUpperCase());
  return { id: `${category}-${i}`, title, category, accent, gradient, videoUrl: url };
}

/* ─── SlideStack — fetches R2 prefix, auto-advances on video end ─────── */
function SlideStack({ r2Prefix, category, accent, gradient }: {
  r2Prefix: string; category: string; accent: string; gradient: string;
}) {
  const [cards,  setCards]  = useState<SlideCard[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [idx,    setIdx]    = useState(0);
  const videoRef            = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    fetchR2Modeling(r2Prefix).then(urls => {
      setCards(urls.map((url, i) => urlToModelCard(url, i, category, accent, gradient)));
      setLoaded(true);
    });
  }, [r2Prefix, category, accent, gradient]);

  useEffect(() => {
    videoRef.current?.load();
    videoRef.current?.play().catch(() => {});
  }, [idx]);

  if (!loaded) return (
    <div className="vSlideStackLoading" style={{ color: accent }}>
      <span className="vSlideLoadingDot" style={{ background: accent }} />
      Loading videos…
    </div>
  );

  if (loaded && cards.length === 0) return (
    <div className="vSlideStackEmpty" style={{ color: accent, opacity: 0.5 }}>
      No videos available yet.
    </div>
  );

  const card = cards[idx];

  return (
    <div className="vSlideStack">
      <div className="vSlideCounter" style={{ color: accent }}>{idx + 1} / {cards.length}</div>
      <motion.div
        key={card.id}
        className="vSlideCard vSlideCardActive"
        style={{ borderColor: accent + "40" }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="vSlideCardThumb" style={{ background: card.gradient }}>
          <video
            ref={videoRef}
            key={card.videoUrl}
            src={card.videoUrl}
            className="vR2Embed"
            autoPlay muted playsInline preload="auto"
            onEnded={() => setIdx(p => (p + 1) % cards.length)}
          />
          <span className="vSlideActiveBadge" style={{ color: accent, borderColor: accent + "44" }}>
            Now Playing
          </span>
        </div>
        <div className="vSlideCardInfo">
          <span className="vAiCardCategory" style={{ color: accent }}>{card.category}</span>
          <p className="vSlideCardTitle">{card.title}</p>
        </div>
      </motion.div>
    </div>
  );
}

/* ─── Magazine split section — buyer-style card pair: info left, video right ── */
export function MagazineSection({
  label, labelAccent, title, titleAccent, italicLine,
  desc, accent, gradient, r2Prefix, ctaLabel, delay,
}: {
  label: string; labelAccent: string; title: string;
  titleAccent: string; italicLine: string;
  desc: string; accent: string; gradient: string;
  r2Prefix: string; ctaLabel: string; delay: number;
}) {
  const ref    = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <motion.div
      ref={ref}
      className="vMagCardRow"
      initial={{ opacity: 0, y: 48 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.9, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* ── Info card — left ── */}
      <div className="vMagCard vMagCardInfo" style={{ background: gradient }}>
        <span className="vAiCardCategory" style={{ color: accent }}>{label}</span>
        <h3 className="vMagCardTitle">
          {title}<br />
          <em className="vMagItalic" style={{ color: accent }}>{italicLine}</em>
        </h3>
        <p className="vMagCardDesc">{desc}</p>
        <div className="vAiSteps">
          {[
            ["01", "Create an account",       "Register with your email. Free, 30 seconds."],
            ["02", "Purchase the collection", "One-time payment. No subscription, no renewal."],
            ["03", "Download forever",        "Instant access. Re-download anytime from your dashboard."],
          ].map(([num, t, sub]) => (
            <div className="vAiStep" key={num}>
              <span className="vAiStepNum" style={{ color: accent }}>{num}</span>
              <div><strong>{t}</strong><p>{sub}</p></div>
            </div>
          ))}
        </div>
        <a href="/register" className="vAiGetAccessBtn" style={{ background: accent }}>
          {ctaLabel}
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
            <path d="M1 12L12 1M12 1H6M12 1v6" stroke="#0d0c0b" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </a>
      </div>

      {/* ── Video card — right ── */}
      <div className="vMagCard vMagCardVideo">
        <SlideStack r2Prefix={r2Prefix} category={label} accent={accent} gradient={gradient} />
        <span className="vMagCardVideoLabel" style={{ color: accent }}>{label} Preview</span>
      </div>
    </motion.div>
  );
}
