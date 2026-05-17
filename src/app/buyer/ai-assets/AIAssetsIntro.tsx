// AIAssetsIntro — client component.
// Cinematic effects: vignette pulse, dust particles,
// chromatic aberration + scroll-driven orc zoom, slide-in, text blur-to-sharp,
// letter spacing expand, scanlines, color grade shift.

"use client";

import { useEffect, useRef, useState } from "react";
import "./ai-assets-intro.css";

const TAGLINES = [
  "Hyper-real AI characters,",
  "ready to enter your game",
  "and stay in their minds.",
];

interface Particle {
  x: number; y: number;
  vx: number; vy: number;
  size: number; opacity: number;
  life: number; maxLife: number;
}

function spawnParticle(w: number, h: number): Particle {
  return {
    x: Math.random() * w,
    y: h + 10,
    vx: (Math.random() - 0.5) * 0.35,
    vy: -(Math.random() * 0.55 + 0.15),
    size: Math.random() * 1.8 + 0.4,
    opacity: Math.random() * 0.3 + 0.04,
    life: 0,
    maxLife: Math.random() * 320 + 180,
  };
}

export default function AIAssetsIntro() {
  const sectionRef  = useRef<HTMLDivElement>(null);
  const canvasRef   = useRef<HTMLCanvasElement>(null);
  const rafRef      = useRef<number>(0);
  const particles   = useRef<Particle[]>([]);
  const [progress,  setProgress]  = useState(0);

  // ── Scroll progress ──────────────────────────────────────────────
  useEffect(() => {
    function onScroll() {
      const el = sectionRef.current;
      if (!el) return;
      const top        = el.getBoundingClientRect().top;
      const scrollable = el.scrollHeight - window.innerHeight;
      if (scrollable <= 0) return;
      setProgress(Math.max(0, Math.min(1, -top / scrollable)));
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // ── Dust particle canvas ─────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    function resize() {
      canvas!.width  = canvas!.offsetWidth;
      canvas!.height = canvas!.offsetHeight;
    }
    resize();
    window.addEventListener("resize", resize);

    for (let i = 0; i < 55; i++) {
      const p = spawnParticle(canvas.width, canvas.height);
      p.y    = Math.random() * canvas.height;
      p.life = Math.random() * p.maxLife;
      particles.current.push(p);
    }

    function draw() {
      const w = canvas!.width;
      const h = canvas!.height;
      ctx!.clearRect(0, 0, w, h);
      if (particles.current.length < 75 && Math.random() < 0.45)
        particles.current.push(spawnParticle(w, h));
      particles.current = particles.current.filter(p => p.life < p.maxLife);
      for (const p of particles.current) {
        p.life += 1; p.x += p.vx; p.y += p.vy;
        const lr    = p.life / p.maxLife;
        const alpha = p.opacity * Math.min(1, lr * 6) * (1 - Math.max(0, (lr - 0.7) / 0.3));
        ctx!.beginPath();
        ctx!.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx!.fillStyle = `rgba(210,200,185,${alpha})`;
        ctx!.fill();
      }
      rafRef.current = requestAnimationFrame(draw);
    }
    rafRef.current = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(rafRef.current); window.removeEventListener("resize", resize); };
  }, []);

  // ── Derived values ───────────────────────────────────────────────
  // Vignette pulse — oscillates twice through scroll
  const vignettePulse  = 0.5 + Math.sin(progress * Math.PI * 2.5) * 0.25;

  // Orcs: slide in from edges on first 20% of scroll, then zoom slowly
  const orcSlide       = Math.max(0, 1 - progress / 0.18);
  const orcScale       = 1 + progress * 0.08;



  // Chromatic aberration on text: strongest at 0.1 progress, fades
  const caStr          = Math.max(0, Math.sin(progress * Math.PI) * 2.5);

  return (
    <section ref={sectionRef} className="aiAssetsIntroSection">
      <div className="aiAssetsSticky">

{/* ── Dust particles ── */}
        <canvas ref={canvasRef} className="aiAssetsDustCanvas" />

        {/* ── Vignette pulse ── */}
        <div
          className="aiAssetsVignette"
          style={{ opacity: vignettePulse }}
        />

        {/* ── Blue orc — left ── */}
        <div
          className="aiAssetsImageLeft"
          style={{
            transform: `translate3d(${-orcSlide * 120}px, 0, 0) scale(${orcScale})`,
            transformOrigin: "left center",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/orc-blue.png" alt="" className="aiAssetsImg aiAssetsImgLeft" />
          <div className="aiAssetsLeftFade" />
        </div>

        {/* ── Red orc — right ── */}
        <div
          className="aiAssetsImageRight"
          style={{
            transform: `translate3d(${orcSlide * 120}px, 0, 0) scale(${orcScale})`,
            transformOrigin: "right center",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/orc-red.png" alt="" className="aiAssetsImg aiAssetsImgRight" />
          <div className="aiAssetsRightFade" />
        </div>

        {/* ── Center tagline ── */}
        <div className="aiAssetsCenterText">
          <p className="aiAssetsEyebrow">AI Asset Studio</p>

          <div className="aiAssetsLines">
            {TAGLINES.map((line, i) => {
              const threshold  = (i / TAGLINES.length) * 0.82;
              const raw        = (progress - threshold) / (1 / TAGLINES.length);
              const vis        = Math.max(0, Math.min(1, raw * 2.2));
              const ty         = Math.max(0, (1 - raw) * 36);
              const blur       = Math.max(0, (1 - vis) * 10);
              const spacing    = 0.02 + vis * 0.025; // letter-spacing expands

              return (
                <p
                  key={i}
                  className="aiAssetsLine"
                  style={{
                    opacity:       vis,
                    transform:     `translate3d(0,${ty}px,0)`,
                    filter:        `blur(${blur}px)`,
                    letterSpacing: `${spacing}em`,
                    // Chromatic aberration via text-shadow RGB split
                    textShadow: vis > 0.05
                      ? `${-caStr * 0.6}px 0 0 rgba(255,0,60,${0.35 * vis}),
                         ${caStr * 0.6}px 0 0 rgba(0,200,255,${0.35 * vis}),
                         0 0 30px rgba(0,0,0,0.95)`
                      : "none",
                  }}
                >
                  {line}
                </p>
              );
            })}
          </div>

          <p
            className="aiAssetsCta"
            style={{ opacity: Math.max(0, (progress - 0.84) * 9) }}
          >
            — Explore the full catalog ↓ —
          </p>
        </div>

        {/* Task 5 — Bottom fog layer: animated turbulence sweeps upward */}
        <div className="aiAssetsBottomFog" aria-hidden="true">
          <svg
            className="aiAssetsBottomFogSvg"
            xmlns="http://www.w3.org/2000/svg"
            preserveAspectRatio="none"
          >
            <defs>
              <filter id="aiBottomFogFilter" x="-10%" y="-50%" width="120%" height="200%">
                <feTurbulence
                  type="fractalNoise"
                  baseFrequency="0.012 0.006"
                  numOctaves="5"
                  seed="7"
                  result="noise"
                >
                  <animate
                    attributeName="baseFrequency"
                    values="0.012 0.006;0.018 0.009;0.012 0.006"
                    dur="14s"
                    repeatCount="indefinite"
                  />
                  <animate
                    attributeName="seed"
                    values="7;12;7"
                    dur="22s"
                    repeatCount="indefinite"
                  />
                </feTurbulence>
                <feColorMatrix
                  type="matrix"
                  values="0 0 0 0 0.03
                          0 0 0 0 0.03
                          0 0 0 0 0.05
                          0 0 0 0.72 0"
                  in="noise"
                  result="fog"
                />
                <feGaussianBlur stdDeviation="6" in="fog" result="softFog" />
                <feComposite in="softFog" in2="SourceGraphic" operator="over" />
              </filter>
              <linearGradient id="aiBottomFogGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor="#000" stopOpacity="0" />
                <stop offset="45%"  stopColor="#000" stopOpacity="0.55" />
                <stop offset="100%" stopColor="#000" stopOpacity="0.95" />
              </linearGradient>
            </defs>
            {/* Noise fog layer */}
            <rect
              width="100%" height="100%"
              fill="transparent"
              filter="url(#aiBottomFogFilter)"
              opacity="0.85"
            />
            {/* Gradient fade to black at bottom edge */}
            <rect width="100%" height="100%" fill="url(#aiBottomFogGrad)" />
          </svg>
        </div>

      </div>
    </section>
  );
}