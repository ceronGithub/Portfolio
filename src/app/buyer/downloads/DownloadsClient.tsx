// DownloadsClient — Buyer download library page.
// Full-width layout with hero header band + body content area.
// Search filter + category tabs (All / Character / Weapon / System).
// Download button per asset — constructs Supabase URL from fileKey.

"use client";

import { useState, useMemo } from "react";
import "./downloads.css";
import { sanitize } from "@/lib/utils";

interface DownloadItem {
  id:          string;
  productId:   string;
  name:        string;
  description: string;
  fileKey:     string | null;  // Admin-attached delivery key (Ownership.fileKey)
  grantedTier: string;         // mesh_only | standard | full_pack
  fileKeyObj:  string | null;  // Product .obj mesh
  fileKeyFbx:  string | null;  // Product .fbx rigged
  fileKeyGlb:  string | null;  // Product .glb web/AR
  grantedAt:   string;
}

// Files available per tier
function getTierFiles(item: DownloadItem): { label: string; key: string; ext: string }[] {
  const files: { label: string; key: string; ext: string }[] = [];
  const tier = item.grantedTier;

  // Delivery package (admin-attached zip) always shown if present
  if (item.fileKey) files.push({ label: "Package", key: item.fileKey, ext: "zip" });

  // Mesh files — all tiers
  if (item.fileKeyObj) files.push({ label: "OBJ", key: item.fileKeyObj, ext: "obj" });
  if (item.fileKeyFbx) files.push({ label: "FBX", key: item.fileKeyFbx, ext: "fbx" });

  // GLB — standard + full_pack only
  if ((tier === "standard" || tier === "full_pack") && item.fileKeyGlb)
    files.push({ label: "GLB", key: item.fileKeyGlb, ext: "glb" });

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

  // Opens a Supabase asset URL directly for a specific file key.
  function openFileKey(fileKey: string, filename: string) {
    const url = `https://ktuahohvysmjxumekaov.supabase.co/storage/v1/object/public/assets/${fileKey}`;
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

                  <div className="dlRowFiles">
                    {hasAnyFile ? (
                      files.map(f => (
                        <button
                          key={f.key}
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