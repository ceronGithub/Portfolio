// NewArchitectureSection — Architecture Studio latest drop teaser.
// Receives latest products as props from buyer/page.tsx (Server Component).
// Falls back to "Coming Soon" when no isLatest products exist.
// Background video plays from previewVideoUrl when a latest drop is active.

"use client";

import { useRef, useEffect } from "react";
import "./new-architecture-section.css";

// ── Types ─────────────────────────────────────────────────────────────
interface LatestArchProduct {
  id:              string;
  name:            string;
  price:           number;
  category:        string;
  previewVideoUrl: string | null;
  facePngUrl:      string | null;
}

interface Props {
  latestInterior: LatestArchProduct | null;
  latestExterior: LatestArchProduct | null;
}

export default function NewArchitectureSection({ latestInterior, latestExterior }: Props) {
  const isLive = latestExterior !== null || latestInterior !== null;

  // Prefer interior video; fall back to exterior if only exterior exists.
  const bgVideoSrc = latestInterior?.previewVideoUrl ?? latestExterior?.previewVideoUrl ?? null;

  const videoRef = useRef<HTMLVideoElement>(null);

  // Play video as soon as src is available — autoplay policies require
  // muted + playsInline for autoplaying without user interaction.
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !bgVideoSrc) return;
    video.load();
    video.play().catch(() => {});
  }, [bgVideoSrc]);

  return (
    <section className="newArchSection">

      {/* ── Background video — left half ─────────────────────────────── */}
      <div className="newArchBgLeft">
        {bgVideoSrc ? (
          <video
            ref={videoRef}
            src={bgVideoSrc}
            className="newArchBgVideo"
            muted
            playsInline
            loop
            autoPlay
          />
        ) : (
          <div className="newArchBgPlaceholder" />
        )}
        <div className="newArchBgFade" />
      </div>

      {/* ── Content — right center ─────────────────────────────────────── */}
      <div className="newArchContent">

        <p className="newArchLabel">Latest Drop on Exterior &amp; Interior Design</p>
        <h2 className="newArchTitle">New Architecture Assets.</h2>

        {isLive ? (
          <span className="newArchLiveBadge">● Live</span>
        ) : (
          <span className="newArchComingSoon">Coming Soon</span>
        )}

        {/* Asset meta — shown only when at least one category is live */}
        {isLive && (
          <div className="newArchDualMeta">
            {latestExterior && (
              <div className="newArchMetaItem">
                <p className="newArchMetaName">{latestExterior.name}</p>
                <p className="newArchMetaPrice">₱{latestExterior.price.toLocaleString()}</p>
                <p className="newArchMetaNote">Exterior · editable Blender file</p>
              </div>
            )}
            {latestExterior && latestInterior && (
              <div className="newArchMetaDivider" />
            )}
            {latestInterior && (
              <div className="newArchMetaItem">
                <p className="newArchMetaName">{latestInterior.name}</p>
                <p className="newArchMetaPrice">₱{latestInterior.price.toLocaleString()}</p>
                <p className="newArchMetaNote">Interior · editable Blender file</p>
              </div>
            )}
          </div>
        )}

      </div>
    </section>
  );
}