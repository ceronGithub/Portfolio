// NewArchitectureSection — Architecture Studio latest drop teaser.
// Fetches the latest interior and exterior products from the DB via
// /api/products?latest=true&category=interior|exterior
// Falls back to "Coming Soon" when no isLatest products exist.

"use client";

import { useEffect, useState } from "react";
import "./new-architecture-section.css";

// ── Types ─────────────────────────────────────────────────────────────
interface LatestArchProduct {
  id:       string;
  name:     string;
  price:    number;
  category: string;
}

// ── fetchLatestArch — loads isLatest=true products for a category ─────
async function fetchLatestArch(category: string): Promise<LatestArchProduct | null> {
  const res = await fetch(`/api/products?latest=true&category=${category}`, { cache: "no-store" });
  if (!res.ok) return null;
  const json = await res.json();
  return (json.products ?? [])[0] ?? null;
}

export default function NewArchitectureSection() {
  const [latestExterior, setLatestExterior] = useState<LatestArchProduct | null>(null);
  const [latestInterior, setLatestInterior] = useState<LatestArchProduct | null>(null);
  const [isLoading, setIsLoading]           = useState(true);

  // Load both latest products in parallel on mount
  useEffect(() => {
    async function loadLatest() {
      const [exterior, interior] = await Promise.all([
        fetchLatestArch("exterior"),
        fetchLatestArch("interior"),
      ]);
      setLatestExterior(exterior);
      setLatestInterior(interior);
      setIsLoading(false);
    }
    loadLatest();
  }, []);

  const isLive = !isLoading && (latestExterior !== null || latestInterior !== null);

  return (
    <section className="newArchSection">
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