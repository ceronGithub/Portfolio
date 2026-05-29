// ArchitectureAssetsIntro — Buyer > Architecture scroll-jacked intro.
// Apple-style frame sequence scrubber. No <video> tags.
//
// HOW IT WORKS (identical to ArchitectureIntroSection on visitor):
//   1. On mount, preload all WebP frames into Image objects.
//   2. On scroll, map progress → frame index.
//   3. Draw the current frame onto a <canvas> element — instant, no decoder lag.
//   4. Zero seeking artifacts — frame swap is synchronous pixel copy.
//   5. Works perfectly on iOS Safari where video currentTime seeking breaks.
//
// FRAME HOSTING:
//   Desktop: /frames/buyer/arch-intro/desktop/frame-XXXX.webp  (1280x720)
//   Mobile:  /frames/buyer/arch-intro/mobile/frame-XXXX.webp   (640x360)
//   Served from /public/ — Next.js static files, no Blob needed.
//
// PRELOAD STRATEGY:
//   - First 12 frames load immediately (above-the-fold priority).
//   - Remaining frames load in background after first batch completes.
//   - Canvas draws whichever frame is loaded; falls back to last loaded frame.

"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import "./architecture-assets-intro.css";

// ── Config ────────────────────────────────────────────────────────────────────
const FRAME_BASE_URL   = "/frames/buyer/arch-intro";
const TOTAL_FRAMES     = 192;
const PRIORITY_BATCH   = 12;
const SCROLL_BUDGET_VH = 4;
const FADE_START       = 0.85; // overlay starts fading at 85% scroll progress

// ── Slogan lines ──────────────────────────────────────────────────────────────
const TAGLINES = [
  "Photorealistic architecture,",
  "interior and exterior —",
  "ready for your next project.",
];

// ── Frame URL builder — 4-digit zero-padded ──────────────────────────────────
function buildFrameUrl(index: number, isMobile: boolean): string {
  const tier   = isMobile ? "mobile" : "desktop";
  const padded = String(index + 1).padStart(4, "0");
  return `${FRAME_BASE_URL}/${tier}/frame-${padded}.webp`;
}

export default function ArchitectureAssetsIntro() {
  const sentinelRef    = useRef<HTMLDivElement>(null);
  const canvasRef      = useRef<HTMLCanvasElement>(null);
  const overlayRef     = useRef<HTMLDivElement>(null);
  const lineRefs       = useRef<(HTMLParagraphElement | null)[]>([]);

  const framesRef      = useRef<(HTMLImageElement | null)[]>(Array(TOTAL_FRAMES).fill(null));
  const loadedCountRef = useRef(0);
  const progressRef    = useRef(0);
  const rafRef         = useRef<number | null>(null);
  const isMobileRef    = useRef(false);

  const [active,       setActive]       = useState(false);
  const [done,         setDone]         = useState(false);
  const [loadProgress, setLoadProgress] = useState(0);

  // ── Draw frame at index onto canvas ─────────────────────────────────────────
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
        break;
      }
    }
    if (!frameToUse) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Cover fit — same as object-fit: cover
    const cw      = canvas.width;
    const ch      = canvas.height;
    const fw      = frameToUse.naturalWidth;
    const fh      = frameToUse.naturalHeight;
    const scale   = Math.max(cw / fw, ch / fh);
    const drawW   = fw * scale;
    const drawH   = fh * scale;
    const offsetX = (cw - drawW) / 2;
    const offsetY = (ch - drawH) / 2;
    ctx.drawImage(frameToUse, offsetX, offsetY, drawW, drawH);
  }, []);

  // ── Preload all frames ────────────────────────────────────────────────────────
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
          const currentTarget = Math.floor(progressRef.current * TOTAL_FRAMES);
          if (Math.abs(index - currentTarget) <= 2) drawFrame(index);
          resolve();
        };
        img.onerror = () => resolve();
      });
    }

    async function preloadAll(): Promise<void> {
      const priority = Array.from({ length: PRIORITY_BATCH }, (_, i) => loadFrame(i));
      await Promise.all(priority);
      drawFrame(0);
      for (let i = PRIORITY_BATCH; i < TOTAL_FRAMES; i++) {
        loadFrame(i);
        if (i % 10 === 0) await new Promise(r => setTimeout(r, 0));
      }
    }

    preloadAll();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drawFrame]);

  // ── Resize canvas to match device pixel ratio ─────────────────────────────────
  useEffect(() => {
    function resizeCanvas(): void {
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.width        = window.innerWidth  * window.devicePixelRatio;
      canvas.height       = window.innerHeight * window.devicePixelRatio;
      canvas.style.width  = "100%";
      canvas.style.height = "100%";
      drawFrame(Math.floor(progressRef.current * TOTAL_FRAMES));
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

  // ── rAF loop ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    function loop(): void {
      rafRef.current = requestAnimationFrame(loop);
      const p          = progressRef.current;
      const frameIndex = Math.floor(p * (TOTAL_FRAMES - 1));
      drawFrame(frameIndex);
      applySlogan(p);
    }
    rafRef.current = requestAnimationFrame(loop);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drawFrame]);

  // ── Scroll → progress + overlay opacity ──────────────────────────────────────
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
        if (overlayRef.current) overlayRef.current.style.opacity = "0";
        return;
      }
      if (scrolledIn >= totalH) {
        setActive(false);
        setDone(true);
        progressRef.current = 1;
        if (overlayRef.current) overlayRef.current.style.opacity = "0";
        return;
      }

      const p = scrolledIn / totalH;
      progressRef.current = p;
      setActive(true);
      setDone(false);

      // Fade overlay out during last 15% of scroll
      const exitOpacity = p < FADE_START
        ? 1
        : Math.max(0, 1 - (p - FADE_START) / (1 - FADE_START));
      if (overlayRef.current) overlayRef.current.style.opacity = String(exitOpacity);
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <div
        ref={sentinelRef}
        className="archAssetsIntroSentinel"
        style={{ height: `${SCROLL_BUDGET_VH * 100}vh` }}
        aria-hidden="true"
      />
      <div
        ref={overlayRef}
        className={
          "archAssetsIntroFixed" +
          (active ? " archAssetsIntroFixedActive" : "") +
          (done   ? " archAssetsIntroFixedDone"   : "")
        }
      >
        <canvas
          ref={canvasRef}
          className="archAssetsIntroCanvas"
          aria-hidden="true"
        />

        {/* Preload progress bar — fades out when all frames loaded */}
        <div
          className="archAssetsIntroPreloadBar"
          style={{ opacity: loadProgress >= 1 ? 0 : 1 }}
        >
          <div
            className="archAssetsIntroPreloadFill"
            style={{ width: `${loadProgress * 100}%` }}
          />
        </div>

        <div className="archAssetsScrim" />
        <div className="archAssetsTickerWrap">
          <p className="archAssetsTicker">
            AI-ASSET ON EXTERIOR &amp; INTERIOR DESIGN
          </p>
        </div>
        <div className="archAssetsSlogan">
          {TAGLINES.map((line, i) => (
            <p
              key={i}
              ref={(el: HTMLParagraphElement | null) => { lineRefs.current[i] = el; }}
              className="archAssetsLine"
            >
              {line}
            </p>
          ))}
        </div>
        <div className="archAssetsBottomGrad" />
      </div>
    </>
  );
}