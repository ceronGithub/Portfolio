// NewAssetSection — "Latest Drop" section for Character / Weapon studio.
// UPDATED: Real content wired in.
//   Card 1 — MP4 video from Supabase (latest orc drop).
//   Card 2 — 3D OBJ placeholder (swap with real file when ready).
//   Title and badge reflect actual latest asset.
//   "Coming Soon" badge hidden when SHOW_LIVE = true.

"use client";

import { useRef, useEffect, useState } from "react";import "./new-asset-section.css";

const GD = (id: string) => `/api/drive-video?id=${id}`;

// ── Latest drop config — change these when a new asset drops ──────────────
const LATEST = {
  title:       "Orc 11 — Warlord",
  subtitle:    "New Character. Available now",
  videoSrc:    GD("1CTk71XmBB9yNz9Osbfd-YHg9mrsgmZkf"),
  price:       "₱5,500",
  isLive:      false,         // false = show "Coming Soon" badge
  releaseNote: "Full rig · 4K textures · OBJ + FBX included",
};
// ──────────────────────────────────────────────────────────────────────────

interface FireParticle {
  x: number; y: number;
  vx: number; vy: number;
  life: number; maxLife: number;
  size: number;
}

function spawnFireParticle(canvasWidth: number, canvasHeight: number): FireParticle {
  return {
    x:       canvasWidth * 0.72 + (Math.random() - 0.5) * canvasWidth * 0.28,
    y:       canvasHeight,
    vx:      (Math.random() - 0.5) * 0.6,
    vy:      -(Math.random() * 2.8 + 1.2),
    life:    0,
    maxLife: Math.random() * 80 + 55,
    size:    Math.random() * 18 + 6,
  };
}

export default function NewAssetSection() {
  const sectionRef    = useRef<HTMLDivElement>(null);
  const fireCanvasRef = useRef<HTMLCanvasElement>(null);
  const fireRafRef    = useRef<number>(0);
  const fireParticles = useRef<FireParticle[]>([]);
  const [parallaxY, setParallaxY] = useState(0);

  useEffect(() => {
    const canvas = fireCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    function resize() {
      canvas!.width  = canvas!.offsetWidth;
      canvas!.height = canvas!.offsetHeight;
    }
    resize();
    window.addEventListener("resize", resize);

    for (let i = 0; i < 40; i++) {
      const p = spawnFireParticle(canvas.width, canvas.height);
      p.life = Math.random() * p.maxLife;
      p.y    = canvas.height - (p.life / p.maxLife) * canvas.height * 0.75;
      fireParticles.current.push(p);
    }

    function drawFire() {
      const w = canvas!.width;
      const h = canvas!.height;
      ctx!.clearRect(0, 0, w, h);

      if (fireParticles.current.length < 80 && Math.random() < 0.75)
        fireParticles.current.push(spawnFireParticle(w, h));

      fireParticles.current = fireParticles.current.filter(p => p.life < p.maxLife);

      for (const p of fireParticles.current) {
        p.life += 1;
        p.x    += p.vx + Math.sin(p.life * 0.12) * 0.4;
        p.y    += p.vy;

        const ratio = p.life / p.maxLife;
        const alpha = Math.max(0, (1 - ratio) * (ratio < 0.2 ? ratio * 5 : 1));

        let r: number, g: number, b: number;
        if (ratio < 0.15)      { r = 255; g = 255; b = 220; }
        else if (ratio < 0.35) { r = 255; g = 200; b = 60;  }
        else if (ratio < 0.6)  { r = 255; g = 100; b = 10;  }
        else                   { r = 180; g = 20;  b = 0;   }

        const currentSize = p.size * (1 - ratio * 0.4);
        const grad = ctx!.createRadialGradient(p.x, p.y, 0, p.x, p.y, currentSize);
        grad.addColorStop(0,   `rgba(${r},${g},${b},${alpha})`);
        grad.addColorStop(0.5, `rgba(${r},${Math.max(0, g - 40)},0,${alpha * 0.6})`);
        grad.addColorStop(1,   `rgba(0,0,0,0)`);

        ctx!.beginPath();
        ctx!.arc(p.x, p.y, currentSize, 0, Math.PI * 2);
        ctx!.fillStyle = grad;
        ctx!.fill();
      }

      fireRafRef.current = requestAnimationFrame(drawFire);
    }

    fireRafRef.current = requestAnimationFrame(drawFire);
    return () => {
      cancelAnimationFrame(fireRafRef.current);
      window.removeEventListener("resize", resize);
    };
  }, []);

  useEffect(() => {
    function onScroll() {
      const el = sectionRef.current;
      if (!el) return;
      const rect   = el.getBoundingClientRect();
      const center = rect.top + rect.height / 2 - window.innerHeight / 2;
      setParallaxY(center * 0.15);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <section ref={sectionRef} className="newAssetSection">

      {/* Parallax orc-red background */}
      <div className="newAssetBgWrap">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/orc-red.png"
          alt=""
          className="newAssetBgImg"
          style={{ transform: `translate3d(0, ${parallaxY}px, 0)` }}
        />
        <div className="newAssetBgFade" />
      </div>

      {/* Fire canvas */}
      <canvas ref={fireCanvasRef} className="newAssetFireCanvas" />

      {/* Content */}
      <div className="newAssetContent">
        <div className="newAssetHeaderRow">
          <div>
            <p className="newAssetLabel">Latest Drop on Character & Weapon</p>
            <h2 className="newAssetTitle">{LATEST.subtitle}</h2>
          </div>
          {LATEST.isLive ? (
            <span className="newAssetLiveBadge">● Live</span>
          ) : (
            <span className="newAssetComingSoon">Coming Soon</span>
          )}
        </div>

        <div className="newAssetCards">
          {/* Card 1 — Animation preview — static placeholder, no video loaded */}
          <div className="newAssetCard newAssetCardVideo">
            <div className="newAssetCardVideoStatic">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" style={{opacity:0.2}}>
                <polygon points="5 3 19 12 5 21 5 3"/>
              </svg>
              <p className="newAssetCardVideoStaticLabel">Animation Preview</p>
            </div>
          </div>

          {/* Card 2 — 3D OBJ placeholder */}
          <div className="newAssetCard">
            <div className="newAssetCardInner">
              <span className="newAssetCardIcon">📦</span>
              <p className="newAssetCardLabel">3D OBJ / FBX</p>
            </div>
          </div>
        </div>
      </div>

    </section>
  );
}