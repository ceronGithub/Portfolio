// ArchitectureIntroSection — Visitor > Architecture scroll-jacked intro.
// Apple-style frame sequence scrubber. No <video> tags.
//
// HOW IT WORKS (identical to Apple iPhone pages):
//   1. On mount, preload all WebP frames into Image objects.
//   2. On scroll, map progress → frame index.
//   3. Draw the current frame onto a <canvas> element — instant, no decoder lag.
//   4. Zero seeking artifacts — frame swap is synchronous pixel copy.
//   5. Works perfectly on iOS Safari where video currentTime seeking breaks.
//
// PHASES:
//   Phase 1 (0 → PHASE1_END): Frame scrubber — canvas swaps frames as you scroll.
//     - 3-line slogan reveals word-by-word during Phase 1.
//     - Last ~20% of Phase 1 fades the canvas overlay out.
//   Phase 2 (PHASE1_END → 1.0): Apple word-reveal.
//     - Black panel stays fixed.
//     - Statement words light up left-to-right as scroll progresses.
//
// FRAME HOSTING:
//   Desktop: FRAME_BASE_URL/desktop/frame-XXXX.webp
//   Mobile:  FRAME_BASE_URL/mobile/frame-XXXX.webp
//   Update FRAME_BASE_URL and TOTAL_FRAMES after running extract-arch-frames.sh.
//
// PRELOAD STRATEGY:
//   - First 12 frames load immediately (above-the-fold priority).
//   - Remaining frames load in background after first batch completes.
//   - Canvas draws whichever frame is loaded; falls back to last loaded frame.

"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import "./architecture-intro-section.css";

// ── Config ────────────────────────────────────────────────────────────────────
// Frames are served from /public/frames/visitor/arch-intro/ — Next.js static.
// Desktop: /frames/visitor/arch-intro/desktop/frame-0001.webp  (1280x720)
// Mobile:  /frames/visitor/arch-intro/mobile/frame-0001.webp   (640x360)
const FRAME_BASE_URL = "/frames/visitor/arch-intro";
const TOTAL_FRAMES   = 192;
const PRIORITY_BATCH = 12;    // frames loaded immediately on mount

// ── Scroll config ─────────────────────────────────────────────────────────────
const SCROLL_BUDGET_VH = 6;   // total scroll height: 6 × 100vh
const PHASE1_END       = 0.70; // 0.0–0.70 = frame scrubber, 0.70–1.0 = word reveal
const FADE_START_P1    = 0.80; // phase 1 overlay starts fading at 80% of phase 1

// ── Slogan lines ──────────────────────────────────────────────────────────────
const TAGLINES = [
  "Photorealistic architecture,",
  "interior and exterior —",
  "ready for your next project.",
];

// ── Apple word-reveal statement ───────────────────────────────────────────────
const APPLE_STATEMENT = "Every render is built to a standard most agencies never reach. We deliver photorealistic architecture — not approximations.";

// ── Frame URL builder — 4-digit zero-padded ──────────────────────────────────
// Detects mobile viewport to serve smaller frames.
function buildFrameUrl(index: number, isMobile: boolean): string {
  const tier    = isMobile ? "mobile" : "desktop";
  const padded  = String(index + 1).padStart(4, "0");
  return `${FRAME_BASE_URL}/${tier}/frame-${padded}.webp`;
}

export default function ArchitectureIntroSection() {
  const sentinelRef     = useRef<HTMLDivElement>(null);
  const canvasRef       = useRef<HTMLCanvasElement>(null);
  const overlayRef      = useRef<HTMLDivElement>(null);
  const appleOverlayRef = useRef<HTMLDivElement>(null);
  const lineRefs        = useRef<(HTMLParagraphElement | null)[]>([]);
  const wordSpansRef    = useRef<(HTMLSpanElement | null)[]>([]);

  // Frame store — Image objects keyed by index
  const framesRef       = useRef<(HTMLImageElement | null)[]>(Array(TOTAL_FRAMES).fill(null));
  const loadedCountRef  = useRef(0);
  const lastFrameRef    = useRef(0);   // last successfully drawn frame index
  const progressRef     = useRef(0);
  const rafRef          = useRef<number | null>(null);
  const isMobileRef     = useRef(false);

  const [active,        setActive]        = useState(false);
  const [done,          setDone]          = useState(false);
  const [loadProgress,  setLoadProgress]  = useState(0); // 0–1, drives preload indicator

  const appleWords = APPLE_STATEMENT.split(" ");

  // ── Draw frame at index onto canvas ─────────────────────────────────────────
  // Falls back to the nearest previously loaded frame if target isn't ready yet.
  const drawFrame = useCallback((index: number): void => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const targetIndex = Math.max(0, Math.min(TOTAL_FRAMES - 1, index));
    const frames      = framesRef.current;

    // Walk backwards from target to find the nearest loaded frame
    let frameToUse: HTMLImageElement | null = null;
    for (let i = targetIndex; i >= 0; i--) {
      if (frames[i]?.complete && frames[i]!.naturalWidth > 0) {
        frameToUse = frames[i];
        lastFrameRef.current = i;
        break;
      }
    }

    if (!frameToUse) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Fit frame to canvas — cover mode
    const cw = canvas.width;
    const ch = canvas.height;
    const fw = frameToUse.naturalWidth;
    const fh = frameToUse.naturalHeight;
    const scale   = Math.max(cw / fw, ch / fh);
    const drawW   = fw * scale;
    const drawH   = fh * scale;
    const offsetX = (cw - drawW) / 2;
    const offsetY = (ch - drawH) / 2;

    ctx.drawImage(frameToUse, offsetX, offsetY, drawW, drawH);
  }, []);

  // ── Preload all frames — priority batch first, then remainder ───────────────
  useEffect(() => {
    isMobileRef.current = window.innerWidth < 768;

    function loadFrame(index: number): Promise<void> {
      return new Promise((resolve) => {
        const img = new Image();
        img.src   = buildFrameUrl(index, isMobileRef.current);
        img.onload = () => {
          framesRef.current[index] = img;
          loadedCountRef.current++;
          setLoadProgress(loadedCountRef.current / TOTAL_FRAMES);

          // Draw immediately if this is near the current scroll position
          const currentTargetFrame = Math.floor(progressRef.current * TOTAL_FRAMES);
          if (Math.abs(index - currentTargetFrame) <= 2) {
            drawFrame(index);
          }
          resolve();
        };
        img.onerror = () => resolve(); // never block on error
      });
    }

    async function preloadAll(): Promise<void> {
      // Priority batch — first N frames load in parallel immediately
      const priorityBatch = Array.from({ length: PRIORITY_BATCH }, (_, i) => loadFrame(i));
      await Promise.all(priorityBatch);

      // Draw frame 0 as soon as priority batch is done
      drawFrame(0);

      // Remainder loads in background — staggered to avoid network congestion
      for (let i = PRIORITY_BATCH; i < TOTAL_FRAMES; i++) {
        loadFrame(i); // fire-and-forget, no await
        if (i % 10 === 0) {
          // Yield to main thread every 10 frames
          await new Promise(r => setTimeout(r, 0));
        }
      }
    }

    preloadAll();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drawFrame]);

  // ── Resize canvas to match device pixel ratio ────────────────────────────────
  useEffect(() => {
    function resizeCanvas(): void {
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.width  = window.innerWidth  * window.devicePixelRatio;
      canvas.height = window.innerHeight * window.devicePixelRatio;
      canvas.style.width  = "100%";
      canvas.style.height = "100%";
      // Redraw current frame after resize
      const currentFrame = Math.floor(progressRef.current * TOTAL_FRAMES);
      drawFrame(currentFrame);
    }

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    return () => window.removeEventListener("resize", resizeCanvas);
  }, [drawFrame]);

  // ── Slogan: direct DOM writes ────────────────────────────────────────────────
  function applySlogan(p: number): void {
    const ca = Math.max(0, Math.sin(p * Math.PI) * 2.5);
    lineRefs.current.forEach((el: HTMLParagraphElement | null, i: number) => {
      if (!el) return;
      const threshold = (i / TAGLINES.length) * 0.82;
      const raw  = (p - threshold) / (1 / TAGLINES.length);
      const vis  = Math.max(0, Math.min(1, raw * 2.2));
      const ty   = Math.max(0, (1 - raw) * 36);
      const blur = Math.max(0, (1 - vis) * 10);
      el.style.opacity    = String(vis);
      el.style.transform  = `translate3d(0,${ty}px,0)`;
      el.style.filter     = `blur(${blur}px)`;
      el.style.textShadow = vis > 0.05
        ? `${-ca * 0.6}px 0 0 rgba(255,0,60,${0.35 * vis}),
           ${ca  * 0.6}px 0 0 rgba(0,200,255,${0.35 * vis}),
           0 0 30px rgba(0,0,0,0.95)`
        : "none";
    });
  }

  // ── Apple word-reveal: direct DOM writes ─────────────────────────────────────
  function applyAppleReveal(phase2Progress: number): void {
    const totalWords  = wordSpansRef.current.length;
    if (totalWords === 0) return;
    const SWEEP_WIDTH = 1.5 / totalWords;
    wordSpansRef.current.forEach((span: HTMLSpanElement | null, i: number) => {
      if (!span) return;
      const wordStart  = i / totalWords;
      const raw        = (phase2Progress - wordStart) / SWEEP_WIDTH;
      const brightness = Math.max(0, Math.min(1, raw));
      const alpha      = 0.18 + brightness * 0.82;
      span.style.color = `rgba(255,255,255,${alpha})`;
    });
  }

  // ── rAF loop — drives canvas frame swap and overlays ────────────────────────
  useEffect(() => {
    function loop(): void {
      rafRef.current = requestAnimationFrame(loop);
      const p = progressRef.current;

      if (p >= PHASE1_END) {
        // Phase 2: Apple word-reveal
        if (overlayRef.current)      overlayRef.current.style.opacity      = "0";
        if (appleOverlayRef.current) appleOverlayRef.current.style.opacity = "1";
        const phase2Progress = (p - PHASE1_END) / (1 - PHASE1_END);
        applyAppleReveal(phase2Progress);
        return;
      }

      // Phase 1: frame scrubber
      if (appleOverlayRef.current) appleOverlayRef.current.style.opacity = "0";

      // Map scroll progress → frame index and draw
      const frameIndex = Math.floor((p / PHASE1_END) * (TOTAL_FRAMES - 1));
      drawFrame(frameIndex);

      // Slogan — normalised to phase 1
      applySlogan(p / PHASE1_END);
    }

    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drawFrame]);

  // ── Scroll → progress + overlay opacity ─────────────────────────────────────
  useEffect(() => {
    function onScroll(): void {
      const sentinel = sentinelRef.current;
      if (!sentinel) return;

      const rect       = sentinel.getBoundingClientRect();
      const totalH     = sentinel.offsetHeight;
      const scrolledIn = -rect.top;

      if (scrolledIn < 0) {
        setActive(false);
        setDone(false);
        progressRef.current = 0;
        if (overlayRef.current)      overlayRef.current.style.opacity      = "0";
        if (appleOverlayRef.current) appleOverlayRef.current.style.opacity = "0";
        return;
      }

      if (scrolledIn >= totalH) {
        setActive(false);
        setDone(true);
        progressRef.current = 1;
        if (overlayRef.current)      overlayRef.current.style.opacity      = "0";
        if (appleOverlayRef.current) appleOverlayRef.current.style.opacity = "0";
        return;
      }

      const p = scrolledIn / totalH;
      progressRef.current = p;
      setActive(true);
      setDone(false);

      // Phase 1 overlay fade — last 20% of phase 1 fades to black
      if (p < PHASE1_END) {
        const phase1P     = p / PHASE1_END;
        const exitOpacity = phase1P < FADE_START_P1
          ? 1
          : Math.max(0, 1 - (phase1P - FADE_START_P1) / (1 - FADE_START_P1));
        if (overlayRef.current) overlayRef.current.style.opacity = String(exitOpacity);
      }
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      {/* Sentinel holds total scroll budget for both phases */}
      <div
        ref={sentinelRef}
        className="archIntroSentinel"
        style={{ height: `${SCROLL_BUDGET_VH * 100}vh` }}
        aria-hidden="true"
      />

      {/* ── Phase 1: Canvas frame scrubber overlay ── */}
      <div
        ref={overlayRef}
        className={
          "archIntroFixed" +
          (active ? " archIntroFixedActive" : "") +
          (done   ? " archIntroFixedDone"   : "")
        }
      >
        {/* Canvas — frames drawn here by drawFrame() */}
        <canvas
          ref={canvasRef}
          className="archIntroCanvas"
          aria-hidden="true"
        />

        {/* Preload progress bar — fades out once all frames loaded */}
        <div
          className="archIntroPreloadBar"
          style={{ opacity: loadProgress >= 1 ? 0 : 1 }}
        >
          <div
            className="archIntroPreloadFill"
            style={{ width: `${loadProgress * 100}%` }}
          />
        </div>

        <div className="archIntroScrim" />

        <div className="archIntroTickerWrap">
          <p className="archIntroTicker">
            AI-ASSET ON EXTERIOR &amp; INTERIOR DESIGN
          </p>
        </div>

        <div className="archIntroSlogan">
          {TAGLINES.map((line, i) => (
            <p
              key={i}
              ref={(el: HTMLParagraphElement | null) => { lineRefs.current[i] = el; }}
              className="archIntroLine"
            >
              {line}
            </p>
          ))}
        </div>

        <div className="archIntroBottomGrad" />
      </div>

      {/* ── Phase 2: Apple word-reveal overlay ── */}
      <div
        ref={appleOverlayRef}
        className={
          "archAppleOverlay" +
          (active ? " archAppleOverlayActive" : "") +
          (done   ? " archAppleOverlayDone"   : "")
        }
      >
        <p className="archAppleEyebrow">ARCHITECTURE STANDARD</p>
        <p className="archAppleStatement" aria-label={APPLE_STATEMENT}>
          {appleWords.map((word, i) => (
            <span
              key={i}
              ref={(el: HTMLSpanElement | null) => { wordSpansRef.current[i] = el; }}
              className="archAppleWord"
            >
              {word}
              {i < appleWords.length - 1 ? " " : ""}
            </span>
          ))}
        </p>
      </div>
    </>
  );
}