// AIAssetsIntro — client component.
// Cinematic effects: vignette pulse, dust particles,
// chromatic aberration + scroll-driven orc zoom, slide-in, text blur-to-sharp,
// letter spacing expand. Optimized for performance:
// — scroll handler throttled via requestAnimationFrame
// — particle array sorted only on depth-bucket change, not every frame
// — SVG feTurbulence animate removed (was causing GPU jank on scroll)
// — CSS-only bottom fog (no SVG filter on scroll path)

"use client";

import { useEffect, useRef, useState } from "react";
import "./ai-assets-intro.css";

const TAGLINES = [
  "Hyper-real AI characters,",
  "ready to enter your game",
  "and stay in their minds.",
];

// Depth field particle — each has a depth layer (0=far/small/slow, 1=near/large/fast)
interface Particle {
  x: number; y: number;
  vx: number; vy: number;
  size: number; opacity: number;
  life: number; maxLife: number;
  depth: number;
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
  };
}

export default function AIAssetsIntro() {
  const sectionRef  = useRef<HTMLDivElement>(null);
  const canvasRef   = useRef<HTMLCanvasElement>(null);
  const rafRef      = useRef<number>(0);
  const particles   = useRef<Particle[]>([]);
  const progressRef = useRef<number>(0);      // raw value — no re-render on scroll
  const scrollRafRef = useRef<number>(0);     // throttle scroll updates via rAF
  const [progress,  setProgress]  = useState(0);

  // ── Scroll progress — throttled via rAF to avoid layout thrash ───
  useEffect(() => {
    function readScroll() {
      const el = sectionRef.current;
      if (!el) return;
      const top        = el.getBoundingClientRect().top;
      const scrollable = el.scrollHeight - window.innerHeight;
      if (scrollable <= 0) return;
      const next = Math.max(0, Math.min(1, -top / scrollable));
      // Only commit a React state update when the value meaningfully changed
      if (Math.abs(next - progressRef.current) > 0.0015) {
        progressRef.current = next;
        setProgress(next);
      }
    }

    function onScroll() {
      cancelAnimationFrame(scrollRafRef.current);
      scrollRafRef.current = requestAnimationFrame(readScroll);
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    readScroll();
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(scrollRafRef.current);
    };
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

    // Pre-populate with staggered life so particles don't all spawn at once
    for (let i = 0; i < 45; i++) {
      const p = spawnParticle(canvas.width, canvas.height);
      p.y    = Math.random() * canvas.height;
      p.life = Math.random() * p.maxLife;
      particles.current.push(p);
    }

    // Sort particles by depth once on init — depth is fixed per particle lifetime
    // so we only need to re-sort when the array changes (splice/push), not every frame.
    // We handle this by sorting after filter + push, not inside draw().
    particles.current.sort((a, b) => a.depth - b.depth);

    function draw() {
      const w = canvas!.width;
      const h = canvas!.height;
      ctx!.clearRect(0, 0, w, h);

      // Spawn new particles at reduced rate (was 0.55 — now 0.35 for less CPU)
      let needsSort = false;
      if (particles.current.length < 70 && Math.random() < 0.35) {
        particles.current.push(spawnParticle(w, h));
        needsSort = true;
      }

      // Filter dead particles
      const prevLength = particles.current.length;
      particles.current = particles.current.filter(p => p.life < p.maxLife);
      if (particles.current.length !== prevLength) needsSort = true;

      // Only sort when array structure changed (not every frame)
      if (needsSort) particles.current.sort((a, b) => a.depth - b.depth);

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
          // Near-field: soft bokeh glow
          const grad = ctx!.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 2.2);
          grad.addColorStop(0,   `rgba(230,220,200,${alpha})`);
          grad.addColorStop(0.4, `rgba(215,205,185,${alpha * 0.55})`);
          grad.addColorStop(1,   `rgba(195,185,165,0)`);
          ctx!.beginPath();
          ctx!.arc(p.x, p.y, p.size * 2.2, 0, Math.PI * 2);
          ctx!.fillStyle = grad;
          ctx!.fill();
        } else if (p.depth > 0.35) {
          // Mid-field: medium soft dot
          const grad = ctx!.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 1.4);
          grad.addColorStop(0,   `rgba(220,210,192,${alpha})`);
          grad.addColorStop(0.6, `rgba(210,200,182,${alpha * 0.4})`);
          grad.addColorStop(1,   `rgba(200,190,172,0)`);
          ctx!.beginPath();
          ctx!.arc(p.x, p.y, p.size * 1.4, 0, Math.PI * 2);
          ctx!.fillStyle = grad;
          ctx!.fill();
        } else {
          // Far-field: tiny crisp dot
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
    <section ref={sectionRef} className="aiAssetsIntroSection">
      <div className="aiAssetsSticky">

        {/* ── Dust particles ── */}
        <canvas ref={canvasRef} className="aiAssetsDustCanvas" />

        {/* ── Vignette pulse ── */}
        <div className="aiAssetsVignette" style={{ opacity: vignettePulse }} />

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
          <p className="aiAssetsEyebrow">AI Character & Weapon</p>

          <div className="aiAssetsLines">
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
                  className="aiAssetsLine"
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
            className="aiAssetsCta"
            style={{ opacity: Math.max(0, (progress - 0.84) * 9) }}
          >
            — Explore the full catalog ↓ —
          </p>
        </div>

        {/* ── Bottom fog — CSS-only, no SVG filter on scroll path ── */}
        <div className="aiAssetsBottomFog" aria-hidden="true" />

      </div>
    </section>
  );
}