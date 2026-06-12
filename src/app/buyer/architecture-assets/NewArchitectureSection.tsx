// NewArchitectureSection — Architecture Studio latest drop teaser.
// Receives latest products as props from buyer/page.tsx (Server Component).
// Falls back to "Coming Soon" when no isLatest products exist.
// Background video loops through both interior and exterior preview videos.
// Price displayed is priceFullPack — matches what checkout/[productId]/page.tsx charges.

"use client";

import { useRef, useEffect, useState } from "react";
import "./new-architecture-section.css";

// ── Types ─────────────────────────────────────────────────────────────
interface LatestArchProduct {
  id:              string;
  name:            string;
  priceMeshOnly:   number;
  priceStandard:   number;
  priceFullPack:   number;
  category:        string;
  previewVideoUrl: string | null;
  facePngUrl:      string | null;
}

interface Props {
  latestInterior: LatestArchProduct | null;
  latestExterior: LatestArchProduct | null;
  ownedAssetIds?: Set<string>;
}

export default function NewArchitectureSection({ latestInterior, latestExterior, ownedAssetIds = new Set() }: Props) {
  const isLive = latestExterior !== null || latestInterior !== null;

  // Build playlist of available video URLs (filter out nulls)
  const videoPlaylist = [
    latestInterior?.previewVideoUrl ?? null,
    latestExterior?.previewVideoUrl ?? null,
  ].filter((url): url is string => url !== null);

  // Track which video in the playlist is currently playing
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);

  const videoRef = useRef<HTMLVideoElement>(null);

  // Current video src — cycles through playlist
  const currentVideoSrc = videoPlaylist.length > 0
    ? videoPlaylist[currentVideoIndex % videoPlaylist.length]
    : null;

  // When src changes, reload and play
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !currentVideoSrc) return;
    video.load();
    video.play().catch(() => {});
  }, [currentVideoSrc]);

  // Advance to next video on ended — creates the loop across both videos
  function handleVideoEnded() {
    if (videoPlaylist.length > 1) {
      setCurrentVideoIndex(prev => (prev + 1) % videoPlaylist.length);
    } else {
      // Single video — just replay
      const video = videoRef.current;
      if (video) {
        video.currentTime = 0;
        video.play().catch(() => {});
      }
    }
  }

  return (
    <section className="newArchSection">

      {/* ── Background video — left half ─────────────────────────────── */}
      <div className="newArchBgLeft">
        {currentVideoSrc ? (
          <video
            ref={videoRef}
            key={currentVideoSrc}
            src={currentVideoSrc}
            className="newArchBgVideo"
            muted
            playsInline
            autoPlay
            onEnded={handleVideoEnded}
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
                {/* Use priceFullPack — matches checkout/[productId]/page.tsx price prop */}
                <p className="newArchMetaPrice">₱{latestExterior.priceFullPack.toLocaleString()}</p>
                <p className="newArchMetaNote">Exterior · editable Blender file</p>
                {ownedAssetIds.has(latestExterior.id) ? (
                  <span className="newArchOwnedBadge">✓ Owned</span>
                ) : (
                  <a href={`/checkout/${latestExterior.id}`} className="newArchBuyBtn" target="_blank" rel="noopener noreferrer">
                    Buy Now →
                  </a>
                )}
              </div>
            )}
            {latestExterior && latestInterior && (
              <div className="newArchMetaDivider" />
            )}
            {latestInterior && (
              <div className="newArchMetaItem">
                <p className="newArchMetaName">{latestInterior.name}</p>
                {/* Use priceFullPack — matches checkout/[productId]/page.tsx price prop */}
                <p className="newArchMetaPrice">₱{latestInterior.priceFullPack.toLocaleString()}</p>
                <p className="newArchMetaNote">Interior · editable Blender file</p>
                {ownedAssetIds.has(latestInterior.id) ? (
                  <span className="newArchOwnedBadge">✓ Owned</span>
                ) : (
                  <a href={`/checkout/${latestInterior.id}`} className="newArchBuyBtn" target="_blank" rel="noopener noreferrer">
                    Buy Now →
                  </a>
                )}
              </div>
            )}
          </div>
        )}

      </div>
    </section>
  );
}
