// DownloadsClient — Buyer download library page.
// Full-width layout with hero header band + body content area.
// Search filter + category tabs (All / Character / Weapon / System).
// Download button per asset — constructs Supabase URL from fileKey.

"use client";

import { useState, useMemo } from "react";
import "./downloads.css";
import { sanitize } from "@/lib/utils";

interface DownloadItem {
  id:           string;
  productId:    string;
  name:         string;
  description:  string;
  fileKey:      string | null;  // Admin-attached delivery key (Ownership.fileKey)
  grantedTier:  string;         // mesh_only | standard | full_pack
  fileKeyObj:   string | null;  // Product .obj mesh
  fileKeyFbx:   string | null;  // Product .fbx rigged
  fileKeyGlb:   string | null;  // Product .glb web/AR
  animIdleUrl:      string | null;
  animWalkUrl:      string | null;
  animRunUrl:       string | null;
  animAttackOneUrl: string | null;
  animAttackTwoUrl: string | null;
  animDeathUrl:     string | null;
  animHitUrl:       string | null;
  facePngUrl:       string | null;
  previewVideoUrl:  string | null;
  grantedAt:    string;
}

// Files available per tier
function getTierFiles(item: DownloadItem): { label: string; key: string; ext: string }[] {
  const files: { label: string; key: string; ext: string }[] = [];
  const tier = item.grantedTier;

  // Delivery package (admin-attached zip) always shown if present
  if (item.fileKey) files.push({ label: "Package", key: item.fileKey, ext: "zip" });

  // PNG preview — all tiers
  if (item.facePngUrl) files.push({ label: "PNG", key: item.facePngUrl, ext: "png" });

  // Mesh files — all tiers
  if (item.fileKeyObj) files.push({ label: "OBJ", key: item.fileKeyObj, ext: "obj" });
  if (item.fileKeyFbx) files.push({ label: "FBX", key: item.fileKeyFbx, ext: "fbx" });

  // GLB — standard + full_pack only
  if ((tier === "standard" || tier === "full_pack") && item.fileKeyGlb)
    files.push({ label: "GLB", key: item.fileKeyGlb, ext: "glb" });

  // Preview video (MP4 animation) — standard + full_pack only
  if ((tier === "standard" || tier === "full_pack") && item.previewVideoUrl)
    files.push({ label: "Preview MP4", key: item.previewVideoUrl, ext: "mp4" });

  // Core animations — standard + full_pack
  if (tier === "standard" || tier === "full_pack") {
    if (item.animIdleUrl)      files.push({ label: "Anim: Idle", key: item.animIdleUrl, ext: "fbx" });
    if (item.animWalkUrl)      files.push({ label: "Anim: Walk", key: item.animWalkUrl, ext: "fbx" });
    if (item.animRunUrl)       files.push({ label: "Anim: Run", key: item.animRunUrl, ext: "fbx" });
    if (item.animAttackOneUrl) files.push({ label: "Anim: Attack 1", key: item.animAttackOneUrl, ext: "fbx" });
    if (item.animDeathUrl)     files.push({ label: "Anim: Death", key: item.animDeathUrl, ext: "fbx" });
  }

  // Full pack exclusive animations
  if (tier === "full_pack") {
    if (item.animAttackTwoUrl) files.push({ label: "Anim: Attack 2", key: item.animAttackTwoUrl, ext: "fbx" });
    if (item.animHitUrl)       files.push({ label: "Anim: Hit", key: item.animHitUrl, ext: "fbx" });
  }

  return files;
}

const TIER_LABEL: Record<string, string> = {
  mesh_only:  "Mesh Only",
  standard:   "Standard",
  full_pack:  "Full Pack",
};

interface Props {
  downloads: DownloadItem[];
}

// Derive category from product name convention
function getCategory(name: string): "Character" | "Weapon" | "System" {
  const n = name.toLowerCase();
  if (n.includes("axe") || n.includes("sword") || n.includes("bow") || n.includes("weapon")) return "Weapon";
  if (n.includes("orc") || n.includes("character")) return "Character";
  return "System";
}

const CATEGORY_ICON: Record<string, string> = {
  Character: "🧟",
  Weapon:    "⚔️",
  System:    "🖥️",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-PH", {
    year: "numeric", month: "short", day: "numeric",
  });
}

export default function DownloadsClient({ downloads }: Props) {
  const [search,      setSearch]      = useState("");
  const [tab,         setTab]         = useState<"All" | "Character" | "Weapon" | "System">("All");
  const [downloading, setDownloading] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return downloads.filter(d => {
      const cat         = getCategory(d.name);
      const matchTab    = tab === "All" || cat === tab;
      const matchSearch = d.name.toLowerCase().includes(search.toLowerCase());
      return matchTab && matchSearch;
    });
  }, [downloads, tab, search]);

  async function handleDownload(item: DownloadItem) {
    if (!item.fileKey) return;
    setDownloading(item.id);
    try {
      const url = `https://ktuahohvysmjxumekaov.supabase.co/storage/v1/object/public/assets/${item.fileKey}`;
      const a   = document.createElement("a");
      a.href     = url;
      a.download = item.name;
      a.target   = "_blank";
      a.click();
    } finally {
      setTimeout(() => setDownloading(null), 1200);
    }
  }

  // Opens a file URL — supports both Google Drive proxy (/api/drive-video?id=...) and Supabase storage URLs.
  function openFileKey(fileKey: string, filename: string) {
    let url: string;
    
    // Check if it's a Google Drive proxy URL
    if (fileKey.startsWith("/api/drive-video")) {
      // Google Drive file — use the proxy URL directly
      url = fileKey;
    } else {
      // Supabase storage key — construct the full URL
      url = `https://ktuahohvysmjxumekaov.supabase.co/storage/v1/object/public/assets/${fileKey}`;
    }
    
    const a   = document.createElement("a");
    a.href     = url;
    a.download = filename;
    a.target   = "_blank";
    a.click();
  }

  return (
    <div className="dlPage">

      {/* ── Hero header band ── */}
      <div className="dlHeader">
        <div className="dlHeaderInner">
          <p className="dlEyebrow">Your Library</p>
          <h1 className="dlTitle">Downloads</h1>
          <p className="dlSub">{downloads.length} asset{downloads.length !== 1 ? "s" : ""} · Lifetime access</p>

          {/* ── Grant history summary strip ── */}
          {downloads.length > 0 && (
            <div className="dlHistoryStrip">
              <div className="dlHistoryStat">
                <span className="dlHistoryValue">{downloads.length}</span>
                <span className="dlHistoryLabel">Assets owned</span>
              </div>
              <div className="dlHistoryDivider" />
              <div className="dlHistoryStat">
                <span className="dlHistoryValue">
                  {downloads.filter(d => d.grantedTier === "full_pack").length}
                </span>
                <span className="dlHistoryLabel">Full Pack</span>
              </div>
              <div className="dlHistoryDivider" />
              <div className="dlHistoryStat">
                <span className="dlHistoryValue">
                  {downloads.filter(d => d.grantedTier === "standard").length}
                </span>
                <span className="dlHistoryLabel">Standard</span>
              </div>
              <div className="dlHistoryDivider" />
              <div className="dlHistoryStat">
                <span className="dlHistoryValue">
                  {formatDate(downloads[downloads.length - 1].grantedAt)}
                </span>
                <span className="dlHistoryLabel">First purchase</span>
              </div>
              <div className="dlHistoryDivider" />
              <div className="dlHistoryStat">
                <span className="dlHistoryValue">{formatDate(downloads[0].grantedAt)}</span>
                <span className="dlHistoryLabel">Latest purchase</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Body ── */}
      <div className="dlBody">

        {/* Controls */}
        <div className="dlControls">

          {/* Search */}
          <div className="dlSearchWrap">
            <span className="dlSearchIcon">⌕</span>
            <input
              className="dlSearch"
              type="text"
              placeholder="Search your library…"
              value={search}
              onChange={e => setSearch(sanitize(e.target.value))}
            />
            {search && (
              <button className="dlSearchClear" onClick={() => setSearch("")}>✕</button>
            )}
          </div>

          {/* Category tabs — text only, no emoji */}
          <div className="dlTabs">
            {(["All", "Character", "Weapon", "System"] as const).map(t => (
              <button
                key={t}
                className={`dlTab ${tab === t ? "dlTabActive" : ""}`}
                onClick={() => setTab(t)}
              >
                {t}
                {t === "All" && <span className="dlTabCount">{downloads.length}</span>}
              </button>
            ))}
          </div>
        </div>

        {/* Empty state */}
        {filtered.length === 0 && (
          <div className="dlEmpty">
            <span className="dlEmptyIcon">{search ? "🔍" : "📦"}</span>
            <p className="dlEmptyText">
              {search ? `No results for "${search}"` : "No downloads yet."}
            </p>
            {!search && (
              <p className="dlEmptyHint">Purchase assets from the Character & Weapon section to see them here.</p>
            )}
          </div>
        )}

        {/* Download list */}
        {filtered.length > 0 && (
          <div className="dlList">
            {filtered.map(item => {
              const cat    = getCategory(item.name);
              const isBusy = downloading === item.id;

              const files      = getTierFiles(item);
              const hasAnyFile = files.length > 0;

              return (
                <div key={item.id} className="dlRow">

                  <div className="dlRowTop">
                    <div className="dlRowIcon">{CATEGORY_ICON[cat]}</div>

                    <div className="dlRowInfo">
                      <p className="dlRowName">{item.name}</p>
                      <p className="dlRowMeta">
                        <span className="dlRowCat">{cat}</span>
                        <span className="dlRowDot">·</span>
                        <span className="dlRowTier">{TIER_LABEL[item.grantedTier] ?? item.grantedTier}</span>
                        <span className="dlRowDot">·</span>
                        <span className="dlRowDate">Purchased {formatDate(item.grantedAt)}</span>
                      </p>
                      {item.description && (
                        <p className="dlRowDesc">{item.description}</p>
                      )}
                    </div>
                  </div>

                  <div className="dlRowFiles">
                    {hasAnyFile ? (
                      files.map((f, fIdx) => (
                        <button
                          key={`${f.key}-${fIdx}`}
                          className={`dlFileBtn ${isBusy ? "dlRowBtnBusy" : ""}`}
                          onClick={() => openFileKey(f.key, `${item.name}.${f.ext}`)}
                          disabled={isBusy}
                          title={`Download ${f.label}`}
                        >
                          <span className="dlRowBtnIcon">↓</span>
                          <span>{f.label}</span>
                        </button>
                      ))
                    ) : (
                      <div className="dlComingSoon">
                        <span className="dlComingSoonIcon">🔒</span>
                        <div className="dlComingSoonText">
                          <p className="dlComingSoonTitle">Coming Soon</p>
                          <p className="dlComingSoonSub">Files for your {TIER_LABEL[item.grantedTier] ?? ""} pack are being prepared.</p>
                        </div>
                      </div>
                    )}
                  </div>

                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
}