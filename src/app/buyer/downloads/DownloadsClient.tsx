// DownloadsClient — Buyer download library page.
// Full-width layout with hero header band + body content area.
// Search filter + category tabs (All / Character / Weapon / System).
// Download button per asset — constructs Google Drive proxy URL from fileKey.

"use client";

import { useState, useMemo } from "react";
import "./downloads.css";
import { sanitize } from "@/lib/utils";
import { useToast }    from "../shared/useToast";
import ToastStack      from "../shared/ToastStack";

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

// Files available per tier — returns field name (for secure API) + display info
function getTierFiles(item: DownloadItem): { label: string; field: string; ext: string }[] {
  const files: { label: string; field: string; ext: string }[] = [];
  const tier = item.grantedTier;

  // Admin delivery package (Ownership.fileKey)
  if (item.fileKey)   files.push({ label: "Package",  field: "fileKey",    ext: "zip" });

  // PNG + preview video — all tiers
  if (item.facePngUrl)      files.push({ label: "PNG",         field: "facePngUrl",      ext: "png" });
  if (item.fileKeyObj)      files.push({ label: "OBJ",         field: "fileKeyObj",      ext: "obj" });
  if (item.fileKeyFbx)      files.push({ label: "FBX",         field: "fileKeyFbx",      ext: "fbx" });
  if (item.previewVideoUrl) files.push({ label: "Preview MP4", field: "previewVideoUrl", ext: "mp4" });

  // GLB + core anims — standard + full_pack
  if (tier === "standard" || tier === "full_pack") {
    if (item.fileKeyGlb)       files.push({ label: "GLB",            field: "fileKeyGlb",       ext: "glb" });
    if (item.animIdleUrl)      files.push({ label: "Anim: Idle",     field: "animIdleUrl",      ext: "fbx" });
    if (item.animWalkUrl)      files.push({ label: "Anim: Walk",     field: "animWalkUrl",      ext: "fbx" });
    if (item.animRunUrl)       files.push({ label: "Anim: Run",      field: "animRunUrl",       ext: "fbx" });
    if (item.animAttackOneUrl) files.push({ label: "Anim: Attack 1", field: "animAttackOneUrl", ext: "fbx" });
    if (item.animDeathUrl)     files.push({ label: "Anim: Death",    field: "animDeathUrl",     ext: "fbx" });
  }

  // Full pack exclusive
  if (tier === "full_pack") {
    if (item.animAttackTwoUrl) files.push({ label: "Anim: Attack 2", field: "animAttackTwoUrl", ext: "fbx" });
    if (item.animHitUrl)       files.push({ label: "Anim: Hit",      field: "animHitUrl",       ext: "fbx" });
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
  const { toasts, showToast, dismissToast } = useToast();

  const filtered = useMemo(() => {
    return downloads.filter(d => {
      const cat         = getCategory(d.name);
      const matchTab    = tab === "All" || cat === tab;
      const matchSearch = d.name.toLowerCase().includes(search.toLowerCase());
      return matchTab && matchSearch;
    });
  }, [downloads, tab, search]);

  async function handleDownload(productId: string, field: string, filename: string) {
    setDownloading(productId + field);
    try {
      const url = `/api/buyer/download?productId=${productId}&field=${encodeURIComponent(field)}`;
      const a   = document.createElement("a");
      a.href     = url;
      a.download = filename;
      a.target   = "_blank";
      a.click();
      showToast(`Downloading ${filename}`, "success");
    } finally {
      setTimeout(() => setDownloading(null), 1200);
    }
  }

  // Opens a file via Google Drive proxy — fileKey is always a Drive file ID.
  function openFileKey(fileKey: string, filename: string) {
    const a   = document.createElement("a");
    a.href     = `/api/drive-video?id=${fileKey}`;
    a.download = filename;
    a.target   = "_blank";
    a.click();
    showToast(`Downloading ${filename}`, "success");
  }

  return (
    <div className="dlPage">
      <ToastStack toasts={toasts} onDismiss={dismissToast} />

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
              const isBusy = downloading !== null && downloading.startsWith(item.productId);

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
                          key={`${f.field}-${fIdx}`}
                          className={`dlFileBtn ${isBusy ? "dlRowBtnBusy" : ""}`}
                          onClick={() => handleDownload(item.productId, f.field, `${item.name}.${f.ext}`)}
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