// NewAssetSection — "Latest Drop" section for Character / Weapon studio.
// Receives latest products as props from buyer/page.tsx (Server Component).
// Falls back to "Coming Soon" state when no isLatest products exist.

"use client";

import { useRef, useEffect, useState } from "react";
import "./new-asset-section.css";

// ── Types ─────────────────────────────────────────────────────────────
interface LatestProduct {
  id:              string;
  name:            string;
  priceMeshOnly:   number;
  priceStandard:   number;
  priceFullPack:   number;
  category:        string;
  packageTier:     string;
  previewVideoUrl: string | null;
  facePngUrl:      string | null;
}

// What's included per tier
function getIncludes(tier: string, category: string): string[] {
  const isWeapon = category === "weapon";
  if (tier === "mesh_only") return isWeapon
    ? ["OBJ mesh", "FBX file", "4K PBR textures"]
    : ["OBJ mesh", "FBX file", "4K PBR textures", "No rig"];
  if (tier === "standard") return isWeapon
    ? ["OBJ + FBX", "4K PBR textures", "5 animation clips"]
    : ["OBJ + FBX", "4K PBR textures", "Rig included", "5 animations (Idle, Walk, Run, Attack ×2)"];
  // full_pack
  return isWeapon
    ? ["OBJ + FBX", "GLB (web/AR)", "4K PBR textures", "7 animations"]
    : ["OBJ + FBX + GLB", "4K PBR textures", "Full rig", "7 animations (Idle, Walk, Run, Attack ×2, Death, Hit)"];
}

interface Props {
  latestCharacter: LatestProduct | null;
  latestWeapon:    LatestProduct | null;
}

// ── FireParticle — single particle in the fire canvas animation ───────
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

// ── normalizeFacePngUrl — ensures Drive URLs go through the image proxy ──
// Raw drive.google.com/file/d/.../view URLs cannot be used in <img src>.
// Convert them to /api/drive-video?id=XXX which proxies the file content.
function normalizeFacePngUrl(url: string | null): string | null {
  if (!url) return null;
  // Already a proxy URL
  if (url.startsWith("/api/drive-video")) return url;
  // Raw Drive share URL: drive.google.com/file/d/FILE_ID/view
  const driveMatch = url.match(/drive\.google\.com\/file\/d\/([^/]+)/);
  if (driveMatch) return `/api/drive-video?id=${driveMatch[1]}`;
  // R2 or any other http URL — use as-is
  return url;
}

export default function NewAssetSection({ latestCharacter, latestWeapon }: Props) {
  const sectionRef    = useRef<HTMLDivElement>(null);
  const fireCanvasRef = useRef<HTMLCanvasElement>(null);
  const fireRafRef    = useRef<number>(0);
  const fireParticles = useRef<FireParticle[]>([]);
  const [parallaxY, setParallaxY] = useState(0);

  // latestChar comes from server — no loading state needed
  const latestChar = latestCharacter;

  // Fire canvas animation
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

      fireParticles.current = fireParticles.current.filter((p: FireParticle) => p.life < p.maxLife);

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

  // Parallax scroll handler
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

  const isLive = latestChar !== null || latestWeapon !== null;

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
            <p className="newAssetLabel">Latest Drop on Character &amp; Weapon</p>
            <h2 className="newAssetTitle">
              {isLive ? (latestChar?.name ?? latestWeapon?.name ?? "New Asset") : "New Character. Available now"}
            </h2>
          </div>
          {isLive ? (
            <span className="newAssetLiveBadge">● Live</span>
          ) : (
            <span className="newAssetComingSoon">Coming Soon</span>
          )}
        </div>

        <div className="newAssetCards">
          {/* Character asset card */}
          {latestChar && (
            <div className="newAssetCard">
              <div className="newAssetCardInner">
                {latestChar.facePngUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={normalizeFacePngUrl(latestChar.facePngUrl)!} alt={latestChar.name} className="newAssetCardFaceImg" />
                ) : (
                  <span className="newAssetCardIcon">🧟</span>
                )}
              </div>
              <div className="newAssetCardMeta">
                <p className="newAssetCardCat">Character</p>
                <p className="newAssetCardName">{latestChar.name}</p>
                <p className="newAssetCardPrice">₱{latestChar.priceMeshOnly.toLocaleString()}</p>
                <a href={`/checkout/${latestChar.id}`} className="newAssetCardBuyBtn" target="_blank" rel="noopener noreferrer">
                  Buy Now →
                </a>
                <ul className="newAssetCardIncludes">
                  {getIncludes(latestChar.packageTier, latestChar.category).map(item => (
                    <li key={item}><span className="newAssetIncludeCheck">✓</span>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Character animation preview card */}
          {latestChar && (
            <div className="newAssetCard newAssetCardVideo">
              {latestChar.previewVideoUrl ? (
                <video
                  className="newAssetCardVideoEl"
                  src={latestChar.previewVideoUrl}
                  autoPlay muted loop playsInline
                />
              ) : (
                <div className="newAssetCardVideoStatic">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" style={{opacity:0.2}}>
                    <polygon points="5 3 19 12 5 21 5 3"/>
                  </svg>
                  <p className="newAssetCardVideoStaticLabel">Character Preview</p>
                </div>
              )}
            </div>
          )}

          {/* Weapon asset card */}
          {latestWeapon && (
            <div className="newAssetCard">
              <div className="newAssetCardInner">
                {latestWeapon.facePngUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={normalizeFacePngUrl(latestWeapon.facePngUrl)!} alt={latestWeapon.name} className="newAssetCardFaceImg" />
                ) : (
                  <span className="newAssetCardIcon">⚔️</span>
                )}
              </div>
              <div className="newAssetCardMeta">
                <p className="newAssetCardCat">Weapon</p>
                <p className="newAssetCardName">{latestWeapon.name}</p>
                <p className="newAssetCardPrice">₱{latestWeapon.priceMeshOnly.toLocaleString()}</p>
                <a href={`/checkout/${latestWeapon.id}`} className="newAssetCardBuyBtn" target="_blank" rel="noopener noreferrer">
                  Buy Now →
                </a>
                <ul className="newAssetCardIncludes">
                  {getIncludes(latestWeapon.packageTier, latestWeapon.category).map(item => (
                    <li key={item}><span className="newAssetIncludeCheck">✓</span>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Weapon animation preview card */}
          {latestWeapon && (
            <div className="newAssetCard newAssetCardVideo">
              {latestWeapon.previewVideoUrl ? (
                <video
                  className="newAssetCardVideoEl"
                  src={latestWeapon.previewVideoUrl}
                  autoPlay muted loop playsInline
                />
              ) : (
                <div className="newAssetCardVideoStatic">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" style={{opacity:0.2}}>
                    <polygon points="5 3 19 12 5 21 5 3"/>
                  </svg>
                  <p className="newAssetCardVideoStaticLabel">Weapon Preview</p>
                </div>
              )}
            </div>
          )}

          {/* Fallback: no products, show single empty preview slot */}
          {!latestChar && !latestWeapon && (
            <div className="newAssetCard newAssetCardVideo">
              <div className="newAssetCardVideoStatic">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" style={{opacity:0.2}}>
                  <polygon points="5 3 19 12 5 21 5 3"/>
                </svg>
                <p className="newAssetCardVideoStaticLabel">Animation Preview</p>
              </div>
            </div>
          )}
        </div>

        {/* Coming Soon state */}
        {!isLive && (
          <p className="newAssetComingSoonSub">Check back soon for the next drop.</p>
        )}
      </div>

    </section>
  );
}