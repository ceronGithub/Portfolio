// ModelingSection — Visitor > AI Visual Systems > Section 2.
// Cinematic intro matching AIAssetsIntro pattern:
// dust particles, vignette pulse, chromatic aberration,
// orc slide-in + zoom, tagline blur-to-sharp with letter-spacing,
// bottom fog SVG, scroll-driven sticky.

"use client";

import { useEffect, useRef, useState } from "react";
import "./modeling-section.css";

const TAGLINES = [
  "Sculpted in Blender,",
  "animated with precision",
  "and built for your world.",
];

interface Particle {
  x: number; y: number;
  vx: number; vy: number;
  size: number; opacity: number;
  life: number; maxLife: number;
  depth: number;
  blur: number;
}

function spawnParticle(w: number, h: number): Particle {
  const depth = Math.random();
  const speed = 0.08 + depth * 0.55;
  const size  = 0.3  + depth * 2.8;
  const life  = Math.round(280 - depth * 110);
  return {
    x:       Math.random() * w,
    y:       h + 10,
    vx:      (Math.random() - 0.5) * (0.15 + depth * 0.4),
    vy:      -(speed * (Math.random() * 0.4 + 0.8)),
    size,
    opacity: 0.06 + (1 - depth) * 0.18 + depth * 0.06,
    life:    0,
    maxLife: life + Math.round(Math.random() * 120),
    depth,
    blur:    (1 - depth) * 1.8,
  };
}

interface ModelingSectionProps {
  children: React.ReactNode;
}

export default function ModelingSection({ children }: ModelingSectionProps) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const canvasRef  = useRef<HTMLCanvasElement>(null);
  const rafRef     = useRef<number>(0);
  const particles  = useRef<Particle[]>([]);
  const [progress, setProgress] = useState(0);

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

      if (particles.current.length < 90 && Math.random() < 0.55)
        particles.current.push(spawnParticle(w, h));
      particles.current = particles.current.filter(p => p.life < p.maxLife);
      particles.current.sort((a, b) => a.depth - b.depth);

      for (const p of particles.current) {
        p.life += 1;
        p.x    += p.vx;
        p.y    += p.vy;

        const lr    = p.life / p.maxLife;
        const alpha = p.opacity
          * Math.min(1, lr * 5)
          * (1 - Math.max(0, (lr - 0.72) / 0.28));

        if (alpha <= 0.002) continue;

        if (p.depth > 0.65) {
          const grad = ctx!.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 2.2);
          grad.addColorStop(0,   `rgba(230,220,200,${alpha})`);
          grad.addColorStop(0.4, `rgba(215,205,185,${alpha * 0.55})`);
          grad.addColorStop(1,   `rgba(195,185,165,0)`);
          ctx!.beginPath();
          ctx!.arc(p.x, p.y, p.size * 2.2, 0, Math.PI * 2);
          ctx!.fillStyle = grad;
          ctx!.fill();
        } else if (p.depth > 0.35) {
          const grad = ctx!.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 1.4);
          grad.addColorStop(0,   `rgba(220,210,192,${alpha})`);
          grad.addColorStop(0.6, `rgba(210,200,182,${alpha * 0.4})`);
          grad.addColorStop(1,   `rgba(200,190,172,0)`);
          ctx!.beginPath();
          ctx!.arc(p.x, p.y, p.size * 1.4, 0, Math.PI * 2);
          ctx!.fillStyle = grad;
          ctx!.fill();
        } else {
          ctx!.beginPath();
          ctx!.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx!.fillStyle = `rgba(200,192,178,${alpha * 0.7})`;
          ctx!.fill();
        }
      }

      rafRef.current = requestAnimationFrame(draw);
    }
    rafRef.current = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
    };
  }, []);

  // ── Derived values ───────────────────────────────────────────────
  const vignettePulse = 0.5 + Math.sin(progress * Math.PI * 2.5) * 0.25;
  const orcSlide      = Math.max(0, 1 - progress / 0.18);
  const orcScale      = 1 + progress * 0.08;
  const caStr         = Math.max(0, Math.sin(progress * Math.PI) * 2.5);

  return (
    <section ref={sectionRef} className="modelSection">
      <div className="modelSticky">

        {/* Dust particles */}
        <canvas ref={canvasRef} className="modelDustCanvas" />

        {/* Vignette pulse */}
        <div className="modelVignette" style={{ opacity: vignettePulse }} />

        {/* Orc left */}
        <div
          className="modelOrcLeft"
          style={{
            transform: `translate3d(${-orcSlide * 120}px, 0, 0) scale(${orcScale})`,
            transformOrigin: "left center",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/model-orc-left.png" alt="" className="modelOrcImg" />
          <div className="modelLeftFade" />
        </div>

        {/* Orc right */}
        <div
          className="modelOrcRight"
          style={{
            transform: `translate3d(${orcSlide * 120}px, 0, 0) scale(${orcScale})`,
            transformOrigin: "right center",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/model-orc-right.png" alt="" className="modelOrcImg" />
          <div className="modelRightFade" />
        </div>

        {/* Center tagline */}
        <div className="modelCenterText">
          <p className="modelEyebrow">3D Character & Weapon Modeling</p>

          <div className="modelLines">
            {TAGLINES.map((line, i) => {
              const threshold = (i / TAGLINES.length) * 0.82;
              const raw       = (progress - threshold) / (1 / TAGLINES.length);
              const vis       = Math.max(0, Math.min(1, raw * 2.2));
              const ty        = Math.max(0, (1 - raw) * 36);
              const blur      = Math.max(0, (1 - vis) * 10);
              const spacing   = 0.02 + vis * 0.025;

              return (
                <p
                  key={i}
                  className="modelLine"
                  style={{
                    opacity:       vis,
                    transform:     `translate3d(0,${ty}px,0)`,
                    filter:        `blur(${blur}px)`,
                    letterSpacing: `${spacing}em`,
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
            className="modelCta"
            style={{ opacity: Math.max(0, (progress - 0.84) * 9) }}
          >
            — Explore the full catalog ↓ —
          </p>
        </div>

        {/* Bottom fog */}
        <div className="modelBottomFog" aria-hidden="true">
          <svg
            className="modelBottomFogSvg"
            xmlns="http://www.w3.org/2000/svg"
            preserveAspectRatio="none"
          >
            <defs>
              <filter id="modelFogFilter" x="-10%" y="-50%" width="120%" height="200%">
                <feTurbulence
                  type="fractalNoise"
                  baseFrequency="0.012 0.006"
                  numOctaves="5"
                  seed="11"
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
                    values="11;17;11"
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
              <linearGradient id="modelFogGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor="#000" stopOpacity="0" />
                <stop offset="45%"  stopColor="#000" stopOpacity="0.55" />
                <stop offset="100%" stopColor="#000" stopOpacity="0.95" />
              </linearGradient>
            </defs>
            <rect width="100%" height="100%" fill="transparent" filter="url(#modelFogFilter)" opacity="0.85" />
            <rect width="100%" height="100%" fill="url(#modelFogGrad)" />
          </svg>
        </div>

      </div>

      {/* Videos section */}
      <div className="modelVideos">
        {children}
      </div>
    </section>
  );
}