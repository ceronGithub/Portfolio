// ProductsClient.tsx — Admin Products & Systems page.
// Section 1: Legacy Products table with active toggle.
// Section 2: Systems Catalog accordion — inline base price editor,
//            per-addon inline price editor, and add-new-addon form.
// IntersectionObserver entrance animations on all cards.
// Protocol v23 Rule 17 design standards applied.
"use client";

import { useState, useEffect, useRef } from "react";

// ── Types ─────────────────────────────────────────────────────────────

interface Product {
  id: string; name: string; description: string | null;
  priceMeshOnly: number; priceStandard: number; priceFullPack: number;
  isActive: boolean; isLatest: boolean;
  enabledTiers: string | null;
  category: string;
  previewVideoUrl: string | null; facePngUrl: string | null;
  threeDUrl: string | null; actionOneUrl: string | null;
  actionTwoUrl: string | null; actionThreeUrl: string | null;
  actionFourUrl: string | null; actionFiveUrl: string | null;
  actionSixUrl: string | null; actionSevenUrl: string | null;
  fileKeyObj: string | null; fileKeyFbx: string | null; fileKeyGlb: string | null;
  animIdleUrl: string | null; animWalkUrl: string | null; animRunUrl: string | null;
  animAttackOneUrl: string | null; animAttackTwoUrl: string | null;
  animDeathUrl: string | null; animHitUrl: string | null;
  mediaDriveIds: string | null;
  createdAt: Date;
}

interface Addon {
  id: string; addonKey: string; label: string;
  price: number; category: string; description: string | null;
}

interface System {
  id: string; tag: string; title: string; basePrice: number;
  accent: string; timeline: string; deploy: string;
  description: string; features: string[]; isActive: boolean;
  bgVideoUrl: string | null; demoVideoUrl: string | null;
  displayStatus: string;
  addons: Addon[];
}

interface Props { products: Product[]; systems: System[]; }

// ── useReveal — IntersectionObserver entrance animation ────────────────
// Adds "apVisible" class when element enters the viewport.
function useReveal() {
  const elementRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = elementRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) el.classList.add("apVisible"); },
      { threshold: 0.06 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return elementRef;
}

// ── API helpers ────────────────────────────────────────────────────────

async function toggleProductActive(id: string, current: boolean): Promise<boolean> {
  const res = await fetch(`/api/admin/products/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ isActive: !current }),
  });
  return res.ok;
}

// Toggles the isLatest flag on a product.
async function toggleProductLatest(id: string, current: boolean): Promise<string | null> {
  const res = await fetch(`/api/admin/products/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ isLatest: !current }),
  });
  if (res.ok) return null;
  const b = await res.json().catch(() => ({}));
  return b.error ?? `HTTP ${res.status}`;
}

// Updates a single media URL field (or null) on a product.
async function patchProductMedia(
  id: string,
  field: string,
  value: string | null
): Promise<boolean> {
  const res = await fetch(`/api/admin/products/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ [field]: value }),
  });
  return res.ok;
}

// Saves a Drive file ID to the mediaDriveIds map for a given field.
// This is called after an upload to "both" so the Drive copy can be purged on product delete.
async function patchMediaDriveId(
  productId: string,
  field: string,
  driveId: string
): Promise<void> {
  try {
    await fetch(`/api/admin/products/${productId}`, {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ mediaDriveIds: JSON.stringify({ [field]: driveId }) }),
    });
  } catch { /* silent — best-effort */ }
}

// Deletes a product from the DB (cascade: ownership + orders).
async function deleteProduct(id: string): Promise<{ ok: boolean; error?: string }> {
  const res = await fetch(`/api/admin/products/${id}`, { method: "DELETE" });
  if (res.ok) return { ok: true };
  const b = await res.json().catch(() => ({}));
  return { ok: false, error: b.error ?? `HTTP ${res.status}` };
}

// Deletes a file from R2 by its public URL. Silently passes on 404.
async function deleteFromR2(url: string): Promise<void> {
  try {
    await fetch("/api/admin/r2-delete", {
      method:  "DELETE",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ url }),
    });
  } catch { /* silent — best-effort */ }
}

// Deletes a file from Google Drive by file ID. Silently passes on 404.
async function deleteFromDrive(fileId: string): Promise<void> {
  try {
    await fetch("/api/admin/drive-delete", {
      method:  "DELETE",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ fileId }),
    });
  } catch { /* silent — best-effort */ }
}

// Creates a new product record.
async function createProduct(data: {
  name: string; priceMeshOnly: number; priceStandard: number; priceFullPack: number; enabledTiers: string; category: string;
  description?: string; isLatest?: boolean;
  previewVideoUrl?: string; facePngUrl?: string; threeDUrl?: string;
  actionOneUrl?: string; actionTwoUrl?: string; actionThreeUrl?: string;
  actionFourUrl?: string; actionFiveUrl?: string; actionSixUrl?: string; actionSevenUrl?: string;
  mediaDriveIds?: string;
}): Promise<Product | null> {
  const res = await fetch("/api/admin/products", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) return null;
  const json = await res.json();
  return json.product ?? null;
}

async function updateSystemBasePrice(id: string, basePrice: number): Promise<boolean> {
  const res = await fetch(`/api/admin/systems/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ basePrice }),
  });
  return res.ok;
}

// Patches any combination of editable System fields in one PATCH call.
async function updateSystemFields(
  id: string,
  fields: Partial<{
    title: string; description: string; accent: string;
    timeline: string; deploy: string; features: string[];
    bgVideoUrl: string | null; demoVideoUrl: string | null;
    displayStatus: string; isActive: boolean;
  }>
): Promise<boolean> {
  const res = await fetch(`/api/admin/systems/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(fields),
  });
  return res.ok;
}

async function updateAddonPrice(addonId: string, price: number): Promise<boolean> {
  const res = await fetch(`/api/admin/addons/${addonId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ price }),
  });
  return res.ok;
}

async function createAddon(
  systemId: string,
  data: { label: string; price: number; category: string; description?: string }
): Promise<Addon | null> {
  const res = await fetch(`/api/admin/systems/${systemId}/addons`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) return null;
  const json = await res.json();
  return json.addon ?? null;
}

// ── computeAnalytics — derives chart summary stats ─────────────────────
// Returns total, average, peak value+label, and MoM/WoW growth %.
function computeAnalytics(data: { label: string; value: number }[]): {
  total: number; average: number; peakValue: number; peakLabel: string; growth: number | null;
} {
  if (data.length === 0) return { total: 0, average: 0, peakValue: 0, peakLabel: "—", growth: null };

  const total    = data.reduce((sum, d) => sum + d.value, 0);
  const average  = Math.round(total / data.length);
  const peak     = data.reduce((best, d) => d.value > best.value ? d : best, data[0]);

  // Growth: compare last period vs second-to-last
  let growth: number | null = null;
  if (data.length >= 2) {
    const last = data[data.length - 1].value;
    const prev = data[data.length - 2].value;
    if (prev > 0) growth = Math.round(((last - prev) / prev) * 100);
    else if (last > 0) growth = 100;
    else growth = 0;
  }

  return { total, average, peakValue: peak.value, peakLabel: peak.label, growth };
}

// ── formatPeso — compact peso display ─────────────────────────────────
function formatPeso(value: number): string {
  if (value >= 1_000_000) return `₱${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000)     return `₱${(value / 1_000).toFixed(1)}k`;
  return `₱${value.toLocaleString("en-PH")}`;
}

// ── AnalyticsBar — summary strip shown above each chart card ───────────
// Shows Total, Average, Peak, and Growth for the dataset.
function AnalyticsBar({ data, color }: { data: { label: string; value: number }[]; color: string }) {
  const { total, average, peakValue, peakLabel, growth } = computeAnalytics(data);
  const hasData = total > 0;

  return (
    <div className="apAnalyticsBar">
      <div className="apAnalyticsStat">
        <span className="apAnalyticsLabel">Total</span>
        <span className="apAnalyticsValue" style={{ color: hasData ? color : undefined }}>
          {hasData ? formatPeso(total) : "—"}
        </span>
      </div>
      <div className="apAnalyticsDivider" />
      <div className="apAnalyticsStat">
        <span className="apAnalyticsLabel">Average</span>
        <span className="apAnalyticsValue">{hasData ? formatPeso(average) : "—"}</span>
      </div>
      <div className="apAnalyticsDivider" />
      <div className="apAnalyticsStat">
        <span className="apAnalyticsLabel">Peak</span>
        <span className="apAnalyticsValue">
          {hasData ? `${formatPeso(peakValue)} (${peakLabel})` : "—"}
        </span>
      </div>
      {growth !== null && (
        <>
          <div className="apAnalyticsDivider" />
          <div className="apAnalyticsStat">
            <span className="apAnalyticsLabel">vs last period</span>
            <span
              className="apAnalyticsValue apAnalyticsGrowth"
              style={{ color: growth >= 0 ? "#68d391" : "#fc8181" }}
            >
              {growth >= 0 ? "▲" : "▼"} {Math.abs(growth)}%
            </span>
          </div>
        </>
      )}
    </div>
  );
}

// ── SystemBasePriceEditor — inline editor for system base price ────────
function SystemBasePriceEditor({ systemId, initialPrice, accent }: {
  systemId: string; initialPrice: number; accent: string;
}) {
  const [price, setPrice]     = useState(initialPrice);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft]     = useState(String(initialPrice));
  const [saving, setSaving]   = useState(false);
  const [saved, setSaved]     = useState(false);

  async function handleSave() {
    const parsed = parseInt(draft.replace(/,/g, ""), 10);
    if (isNaN(parsed) || parsed < 0) return;
    setSaving(true);
    const ok = await updateSystemBasePrice(systemId, parsed);
    if (ok) { setPrice(parsed); setSaved(true); setTimeout(() => setSaved(false), 2200); }
    setSaving(false);
    setEditing(false);
  }

  function handleCancel() { setDraft(String(price)); setEditing(false); }

  if (editing) {
    return (
      <div className="apPriceEditor" onClick={e => e.stopPropagation()}>
        <span className="apPriceCurrency">₱</span>
        <input
          className="apPriceInput"
          type="number" min="0"
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") handleSave(); if (e.key === "Escape") handleCancel(); }}
          autoFocus
          style={{ borderColor: accent }}
        />
        <button className="apPriceSaveBtn" onClick={handleSave} disabled={saving}
          style={{ background: accent, color: "#0d0d0d" }}>
          {saving ? "…" : "Save"}
        </button>
        <button className="apPriceCancelBtn" onClick={handleCancel}>✕</button>
      </div>
    );
  }

  return (
    <button
      className="apPriceDisplay"
      onClick={e => { e.stopPropagation(); setEditing(true); setDraft(String(price)); }}
      title="Click to edit base price"
    >
      <span className="apSystemBasePrice">₱{price.toLocaleString()} base</span>
      {saved
        ? <span className="apPriceSavedTag">✓ saved</span>
        : <span className="apPriceEditHint">✎</span>
      }
    </button>
  );
}

// ── AddonPriceEditor — inline price editor per addon row ───────────────
function AddonPriceEditor({ addon, accent, onUpdated }: {
  addon: Addon; accent: string; onUpdated: (id: string, newPrice: number) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft]     = useState(String(addon.price));
  const [saving, setSaving]   = useState(false);
  const [saved, setSaved]     = useState(false);

  async function handleSave() {
    const parsed = parseInt(draft.replace(/,/g, ""), 10);
    if (isNaN(parsed) || parsed < 0) return;
    setSaving(true);
    const ok = await updateAddonPrice(addon.id, parsed);
    if (ok) { onUpdated(addon.id, parsed); setSaved(true); setTimeout(() => setSaved(false), 2200); }
    setSaving(false);
    setEditing(false);
  }

  function handleCancel() { setDraft(String(addon.price)); setEditing(false); }

  if (editing) {
    return (
      <div className="apAddonPriceEditor" onClick={e => e.stopPropagation()}>
        <span className="apPriceCurrency">₱</span>
        <input
          className="apPriceInput apPriceInputSmall"
          type="number" min="0"
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") handleSave(); if (e.key === "Escape") handleCancel(); }}
          autoFocus
          style={{ borderColor: accent }}
        />
        <button className="apPriceSaveBtn apPriceSaveBtnSmall" onClick={handleSave} disabled={saving}
          style={{ background: accent, color: "#0d0d0d" }}>
          {saving ? "…" : "Save"}
        </button>
        <button className="apPriceCancelBtn" onClick={handleCancel}>✕</button>
      </div>
    );
  }

  return (
    <button
      className="apAddonPriceDisplay"
      onClick={e => { e.stopPropagation(); setEditing(true); setDraft(String(addon.price)); }}
      title="Click to edit price"
    >
      {saved
        ? <span className="apPriceSavedTag">✓ saved</span>
        : <span className="apAddonPriceValue">+₱{addon.price.toLocaleString()}</span>
      }
      <span className="apPriceEditHintSmall apPriceEditHintVisible">✎</span>
    </button>
  );
}

// ── AddAddonForm — inline form to add a new addon to a system ──────────
function AddAddonForm({ systemId, accent, onAdded }: {
  systemId: string; accent: string; onAdded: (addon: Addon) => void;
}) {
  const [open, setOpen]         = useState(false);
  const [label, setLabel]       = useState("");
  const [price, setPrice]       = useState("");
  const [category, setCategory] = useState("");
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState("");

  async function handleAdd() {
    if (!label.trim() || !category.trim()) { setError("Label and category are required."); return; }
    const parsedPrice = parseInt(price.replace(/,/g, ""), 10);
    if (isNaN(parsedPrice) || parsedPrice < 0) { setError("Enter a valid price."); return; }
    setSaving(true);
    setError("");
    const addon = await createAddon(systemId, { label: label.trim(), price: parsedPrice, category: category.trim() });
    if (addon) {
      onAdded(addon);
      setLabel(""); setPrice(""); setCategory("");
      setOpen(false);
    } else {
      setError("Failed to save. Try again.");
    }
    setSaving(false);
  }

  if (!open) {
    return (
      <button
        className="apAddAddonBtn"
        onClick={e => { e.stopPropagation(); setOpen(true); }}
        style={{ borderColor: accent, color: accent }}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
        Add Addon
      </button>
    );
  }

  return (
    <div className="apAddAddonForm" onClick={e => e.stopPropagation()}>
      <p className="apAddAddonFormTitle">New Addon</p>
      <div className="apAddAddonFormFields">
        <input
          className="apAddAddonInput"
          placeholder="Label (e.g. AI Chatbot)"
          value={label}
          onChange={e => setLabel(e.target.value)}
        />
        <input
          className="apAddAddonInput"
          placeholder="Category (e.g. AI)"
          value={category}
          onChange={e => setCategory(e.target.value)}
        />
        <input
          className="apAddAddonInput apAddAddonInputPrice"
          placeholder="Price (₱)"
          type="number"
          min="0"
          value={price}
          onChange={e => setPrice(e.target.value)}
        />
      </div>
      {error && <p className="apAddAddonError">{error}</p>}
      <div className="apAddAddonFormActions">
        <button className="apPriceCancelBtn" onClick={() => { setOpen(false); setError(""); }}>
          Cancel
        </button>
        <button
          className="apPriceSaveBtn"
          onClick={handleAdd}
          disabled={saving}
          style={{ background: accent, color: "#0d0d0d" }}
        >
          {saving ? "Saving…" : "Add Addon"}
        </button>
      </div>
    </div>
  );
}

// ── MEDIA_FIELDS — ordered list of URL-based media fields (non-action, non-3D) ──
// Used by MediaEditor for previewVideo and facePng rows only.
const SIMPLE_MEDIA_FIELDS: { field: string; label: string; isImage?: boolean }[] = [
  { field: "previewVideoUrl", label: "Preview Video"  },
  { field: "facePngUrl",      label: "Face PNG", isImage: true },
];

// Action slot definitions for MediaEditor — Action 1–7.
const ACTION_FIELDS: { field: keyof Product; label: string }[] = [
  { field: "actionOneUrl",   label: "Action 1" },
  { field: "actionTwoUrl",   label: "Action 2" },
  { field: "actionThreeUrl", label: "Action 3" },
  { field: "actionFourUrl",  label: "Action 4" },
  { field: "actionFiveUrl",  label: "Action 5" },
  { field: "actionSixUrl",   label: "Action 6" },
  { field: "actionSevenUrl", label: "Action 7" },
];

// ── MediaEditor — inline editor for all media fields of one product ──
// Simple fields (Preview Video, Face PNG): text input + pick file + upload-to select.
// 3D slots (OBJ, FBX, GLB): separate FileUploadField per format with folder picker.
// Action 1–7: FileUploadField each with full R2/GDrive/Both + folder picker.
// When a Drive ID is returned alongside an R2 URL ("both"), it is saved to
// mediaDriveIds so product delete can purge the Drive copy.
function MediaEditor({ product, onFieldSaved }: {
  product: Product;
  onFieldSaved: (id: string, field: string, value: string | null) => void;
}) {
  // ── Tier Price Editor ──────────────────────────────────────────────────────
  // Admin enters the Full Pack price; Mesh Only (45%) and Standard (75%) are
  // auto-computed. All three are saved in one PATCH.
  const [fullPackDraft, setFullPackDraft] = useState(String(product.priceFullPack || ""));
  const [priceSaving,   setPriceSaving]   = useState(false);
  const [priceSaved,    setPriceSaved]    = useState(false);
  const [priceError,    setPriceError]    = useState("");

  // ── Tier Availability Toggles ──────────────────────────────────────────────
  // Admin controls which tiers buyers can see and purchase.
  // At least 1 tier must stay enabled.
  const ALL_TIERS = ["mesh_only", "standard", "full_pack"] as const;
  type TierKey = typeof ALL_TIERS[number];
  const TIER_LABELS: Record<TierKey, string> = { mesh_only: "Mesh Only", standard: "Standard", full_pack: "Full Pack" };

  const parsedEnabled = (product.enabledTiers ?? "mesh_only,standard,full_pack")
    .split(",").map((t: string) => t.trim()).filter((t: string) => t.length > 0);
  const [enabledTiers,    setEnabledTiers]    = useState<TierKey[]>(parsedEnabled as TierKey[]);
  const [tiersSaving,     setTiersSaving]     = useState(false);
  const [tiersSaved,      setTiersSaved]      = useState(false);

  async function toggleTier(tier: TierKey) {
    const next = enabledTiers.includes(tier)
      ? enabledTiers.filter(t => t !== tier)
      : [...enabledTiers, tier];
    // Enforce: at least one tier must remain enabled
    if (next.length === 0) return;
    const ordered = ALL_TIERS.filter(t => next.includes(t));
    setEnabledTiers(ordered);
    setTiersSaving(true);
    const res = await fetch(`/api/admin/products/${product.id}`, {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ enabledTiers: ordered.join(",") }),
    });
    setTiersSaving(false);
    if (res.ok) {
      onFieldSaved(product.id, "enabledTiers", ordered.join(","));
      setTiersSaved(true);
      setTimeout(() => setTiersSaved(false), 2000);
    }
  }

  const fullPackNum   = parseInt(fullPackDraft.replace(/,/g, ""), 10);
  const isValidPrice  = !isNaN(fullPackNum) && fullPackNum > 0;
  const derivedMesh   = isValidPrice ? Math.round(fullPackNum * 0.45) : 0;
  const derivedStd    = isValidPrice ? Math.round(fullPackNum * 0.75) : 0;

  async function handleSavePrices() {
    if (!isValidPrice) { setPriceError("Enter a valid Full Pack price."); return; }
    setPriceSaving(true); setPriceError("");
    const res = await fetch(`/api/admin/products/${product.id}`, {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({
        priceMeshOnly: derivedMesh,
        priceStandard: derivedStd,
        priceFullPack: fullPackNum,
      }),
    });
    setPriceSaving(false);
    if (res.ok) {
      onFieldSaved(product.id, "priceMeshOnly", String(derivedMesh));
      onFieldSaved(product.id, "priceStandard", String(derivedStd));
      onFieldSaved(product.id, "priceFullPack", String(fullPackNum));
      setPriceSaved(true);
      setTimeout(() => setPriceSaved(false), 2500);
    } else {
      setPriceError("Failed to save prices.");
    }
  }

  const initialSimpleDrafts = Object.fromEntries(
    SIMPLE_MEDIA_FIELDS.map(({ field }) => [field, (product[field as keyof Product] as string | null) ?? ""])
  );
  const [drafts,     setDrafts]     = useState<Record<string, string>>(initialSimpleDrafts);
  const [saving,     setSaving]     = useState<Record<string, boolean>>({});
  const [saved,      setSaved]      = useState<Record<string, boolean>>({});
  const [pendingFiles, setPendingFiles] = useState<Record<string, File | null>>({});
  const [destinations, setDestinations] = useState<Record<string, "r2" | "gdrive" | "both">>(() =>
    Object.fromEntries(SIMPLE_MEDIA_FIELDS.map(({ field }) => [field, "r2" as const]))
  );
  // Per-field R2 folder and Drive folder selections for simple media fields
  const [simpleR2Folders,    setSimpleR2Folders]    = useState<Record<string, string>>(() =>
    Object.fromEntries(SIMPLE_MEDIA_FIELDS.map(({ field }) => [field, "products"]))
  );
  const [simpleDriveFolderIds, setSimpleDriveFolderIds] = useState<Record<string, string>>(() =>
    Object.fromEntries(SIMPLE_MEDIA_FIELDS.map(({ field }) => [field, ""]))
  );
  // Folder lists for simple field dropdowns — fetched lazily on first GDrive/Both selection
  const [simpleFolderR2List,    setSimpleFolderR2List]    = useState<string[]>(["products", "architecture", "character", "systems", "weapon"]);
  const [simpleFolderDriveList, setSimpleFolderDriveList] = useState<{ id: string; name: string }[]>([]);
  const simpleFoldersLoadedRef = useRef(false);

  // Loads R2 + Drive folder lists for simple media field pickers (once)
  async function loadSimpleFolders(): Promise<void> {
    if (simpleFoldersLoadedRef.current) return;
    simpleFoldersLoadedRef.current = true;
    try {
      const [r2Res, driveRes] = await Promise.allSettled([
        fetch("/api/admin/r2-folders").then(r => r.json()),
        fetch("/api/admin/drive-folders").then(r => r.json()),
      ]);
      if (r2Res.status === "fulfilled" && Array.isArray(r2Res.value.folders)) {
        const merged = Array.from(new Set(["products", ...r2Res.value.folders])).sort();
        setSimpleFolderR2List(merged);
      }
      if (driveRes.status === "fulfilled" && Array.isArray(driveRes.value.folders)) {
        setSimpleFolderDriveList(
          (driveRes.value.folders as { id: string; name: string }[])
            .sort((a, b) => a.name.localeCompare(b.name))
        );
      }
    } catch { /* silent */ }
  }

  const fileInputRefs    = useRef<Record<string, HTMLInputElement | null>>({});
  // Shared drive folder ref for 3D model and action file uploads (FileUploadField components)
  const driveFolderIdRef = useRef<string>("");

  const [uploadErrors, setUploadErrors] = useState<Record<string, string>>({});

  // ── Upload pending file then PATCH the resulting URL ─────────────────
  // If a file is pending, uploads first. Bails without patching DB if upload fails.
  // Surfaces upload errors to admin via per-field error state.
  async function handleSaveSimpleField(field: string) {
    setSaving(prev => ({ ...prev, [field]: true }));
    setUploadErrors(prev => ({ ...prev, [field]: "" }));
    let urlToSave = drafts[field].trim() || null;
    let uploadAttempted = false;

    const pendingFile = pendingFiles[field];
    if (pendingFile) {
      uploadAttempted = true;
      const dest = destinations[field];
      const form = new FormData();
      form.append("file",        pendingFile);
      form.append("destination", dest);
      form.append("r2Folder",    simpleR2Folders[field] || "products");
      if ((dest === "gdrive" || dest === "both") && simpleDriveFolderIds[field]) {
        form.append("driveFolderId", simpleDriveFolderIds[field]);
      }
      try {
        const res  = await fetch("/api/admin/product-upload", { method: "POST", body: form });
        const data = await res.json();
        if (data.success) {
          if (data.r2Url)        urlToSave = data.r2Url;
          else if (data.driveId) urlToSave = `/api/drive-video?id=${data.driveId}`;
          setDrafts(prev => ({ ...prev, [field]: urlToSave ?? "" }));
          setPendingFiles(prev => ({ ...prev, [field]: null }));
          // Track Drive ID if uploaded to both
          if (data.driveId && dest === "both") {
            await patchMediaDriveId(product.id, field, data.driveId);
          }
        } else {
          // Upload failed — surface error, bail without patching DB
          const errMsg = data.errors?.join("; ") || data.error || "Upload failed";
          setUploadErrors(prev => ({ ...prev, [field]: errMsg }));
          setSaving(prev => ({ ...prev, [field]: false }));
          return;
        }
      } catch {
        setUploadErrors(prev => ({ ...prev, [field]: "Network error — upload failed" }));
        setSaving(prev => ({ ...prev, [field]: false }));
        return;
      }
    }

    // If upload was attempted but produced no URL, bail — don't wipe DB value
    if (uploadAttempted && !urlToSave) {
      setUploadErrors(prev => ({ ...prev, [field]: "Upload returned no URL" }));
      setSaving(prev => ({ ...prev, [field]: false }));
      return;
    }

    const ok = await patchProductMedia(product.id, field, urlToSave);
    if (ok) {
      onFieldSaved(product.id, field, urlToSave);
      setSaved(prev => ({ ...prev, [field]: true }));
      setTimeout(() => setSaved(prev => ({ ...prev, [field]: false })), 2200);
    }
    setSaving(prev => ({ ...prev, [field]: false }));
  }

  return (
    <div className="apMediaEditor">

      {/* ── Tier Price Editor ── */}
      <div className="apMediaPriceEditor">
        <p className="apMediaSectionLabel">
          Tier Prices
          <span className="apMediaSectionHint"> — enter Full Pack price, others auto-computed</span>
        </p>
        <div className="apMediaPriceRow">
          <div className="apMediaPriceInputGroup">
            <label className="apMediaPriceLabel">Full Pack (100%)</label>
            <div className="apMediaPriceInputWrap">
              <span className="apMediaPriceCurrency">₱</span>
              <input
                className="apMediaPriceInput"
                type="text"
                inputMode="numeric"
                value={fullPackDraft}
                placeholder="e.g. 5500"
                onChange={e => { setFullPackDraft(e.target.value); setPriceError(""); }}
              />
            </div>
          </div>
          <div className="apMediaPriceDerived">
            <span title="Mesh Only = 45% of Full Pack">
              M ₱{isValidPrice ? derivedMesh.toLocaleString() : "—"}
            </span>
            <span title="Standard = 75% of Full Pack">
              S ₱{isValidPrice ? derivedStd.toLocaleString() : "—"}
            </span>
            <span title="Full Pack = 100%">
              F ₱{isValidPrice ? fullPackNum.toLocaleString() : "—"}
            </span>
          </div>
          <button
            className="apMediaPriceSaveBtn"
            onClick={handleSavePrices}
            disabled={priceSaving || !isValidPrice}
          >
            {priceSaving ? "Saving…" : priceSaved ? "✓ Saved" : "Save Prices"}
          </button>
        </div>
        {priceError && <p className="apMediaPriceError">{priceError}</p>}
      </div>

      {/* ── Tier Availability — toggle which tiers buyers can see ── */}
      <div className="apTierAvailEditor">
        <p className="apMediaSectionLabel">
          Tier Availability
          <span className="apMediaSectionHint"> — toggle which tiers buyers can purchase</span>
          {tiersSaving && <span className="apMediaSectionHint"> · Saving…</span>}
          {tiersSaved  && <span className="apTierSavedBadge"> ✓ Saved</span>}
        </p>
        <div className="apTierToggleRow">
          {ALL_TIERS.map(tier => {
            const isOn     = enabledTiers.includes(tier);
            const isLast   = isOn && enabledTiers.length === 1;
            return (
              <button
                key={tier}
                className={`apTierToggleBtn ${isOn ? "apTierToggleBtnOn" : "apTierToggleBtnOff"}`}
                onClick={() => toggleTier(tier)}
                disabled={isLast || tiersSaving}
                title={isLast ? "At least one tier must remain enabled" : isOn ? "Click to hide from buyers" : "Click to show to buyers"}
              >
                <span className="apTierToggleDot" />
                <span className="apTierToggleLabel">{TIER_LABELS[tier]}</span>
                <span className="apTierToggleState">{isOn ? "ON" : "OFF"}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Preview Video + Face PNG — simple text + pick file rows ── */}
      {SIMPLE_MEDIA_FIELDS.map(({ field, isImage }) => {
        const hasPending = !!pendingFiles[field];
        const currentUrl = drafts[field];
        const labelMap: Record<string, string> = {
          previewVideoUrl: "Preview Video",
          facePngUrl:      "Face PNG",
        };
        return (
          <div key={field} className="apMediaRow apMediaRowUpload">
            <span className="apMediaLabel">{labelMap[field]}</span>
            <input
              className="apMediaInput"
              type="text"
              placeholder={hasPending ? `📎 ${pendingFiles[field]!.name}` : "Paste URL or leave empty to clear"}
              value={hasPending ? "" : currentUrl}
              onChange={e => { if (!hasPending) setDrafts(prev => ({ ...prev, [field]: e.target.value })); }}
              onKeyDown={e => { if (e.key === "Enter") handleSaveSimpleField(field); }}
              style={hasPending ? { color: "#c9a96e", fontStyle: "italic" } : undefined}
            />
            <input
              type="file"
              style={{ display: "none" }}
              ref={el => { fileInputRefs.current[field] = el; }}
              onChange={e => {
                const file = e.target.files?.[0] ?? null;
                setPendingFiles(prev => ({ ...prev, [field]: file }));
                if (e.target) e.target.value = "";
              }}
            />
            <button
              type="button"
              className={`apMediaPickBtn${hasPending ? " apMediaPickBtnActive" : ""}`}
              onClick={() => fileInputRefs.current[field]?.click()}
              title="Pick a file to upload"
            >
              {hasPending ? "✓ File" : "Pick File"}
            </button>
            <select
              className="apMediaDestSelect"
              value={destinations[field]}
              onChange={e => {
                const newDest = e.target.value as "r2" | "gdrive" | "both";
                setDestinations(prev => ({ ...prev, [field]: newDest }));
                if (newDest !== "r2") loadSimpleFolders();
              }}
            >
              <option value="r2">R2</option>
              <option value="gdrive">GDrive</option>
              <option value="both">Both</option>
            </select>
            {/* R2 folder picker — shown when destination is r2 or both */}
            {(destinations[field] === "r2" || destinations[field] === "both") && (
              <select
                className="apMediaFolderSelect"
                value={simpleR2Folders[field]}
                onChange={e => setSimpleR2Folders(prev => ({ ...prev, [field]: e.target.value }))}
                title="R2 folder"
              >
                {simpleFolderR2List.map(f => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            )}
            {/* Drive folder picker — shown when destination is gdrive or both */}
            {(destinations[field] === "gdrive" || destinations[field] === "both") && (
              <select
                className="apMediaFolderSelect"
                value={simpleDriveFolderIds[field]}
                onChange={e => setSimpleDriveFolderIds(prev => ({ ...prev, [field]: e.target.value }))}
                title="Drive folder"
              >
                <option value="">— Drive folder —</option>
                {simpleFolderDriveList.map(f => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </select>
            )}
            <button
              className="apPriceSaveBtn"
              onClick={() => handleSaveSimpleField(field)}
              disabled={saving[field]}
            >
              {saving[field] ? "…" : saved[field] ? "✓" : "Save"}
            </button>
            <button
              className="apPriceCancelBtn"
              onClick={() => {
                setPendingFiles(prev => ({ ...prev, [field]: null }));
                setDrafts(prev => ({ ...prev, [field]: "" }));
                handleSaveSimpleField(field);
              }}
              title="Clear this URL"
            >
              ✕
            </button>
            {isImage && currentUrl && !hasPending && (
              <div className="apMediaImagePreview">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={currentUrl} alt="Face PNG preview" className="apMediaImageThumb" />
              </div>
            )}
            {uploadErrors[field] && (
              <p className="apMediaUploadError">{uploadErrors[field]}</p>
            )}
          </div>
        );
      })}

      {/* ── 3D Model — separate editable FileUploadField per slot ── */}
      {/* OBJ, FBX, GLB each get their own upload row with R2/GDrive/Both + folder picker. */}
      {/* On save, R2 URL is patched to fileKeyObj/Fbx/Glb. Drive ID saved to mediaDriveIds. */}
      <div className="apMediaSection3D">
        <p className="apMediaSectionLabel">3D Model Files <span className="apMediaSectionHint">— uploading auto-saves</span></p>
        {([
          { key: "fileKeyObj" as const, label: "OBJ",      accept: ".obj"          },
          { key: "fileKeyFbx" as const, label: "FBX",      accept: ".fbx"          },
          { key: "fileKeyGlb" as const, label: "GLB / GLTF", accept: ".glb,.gltf"  },
        ] as { key: "fileKeyObj" | "fileKeyFbx" | "fileKeyGlb"; label: string; accept: string }[]).map(({ key, label, accept }) => {
          const currentVal = product[key];
          return (
            <div key={key} className="apMedia3DRow">
              <span className="apMediaLabel" style={{ minWidth: "4.5rem" }}>{label}</span>
              {currentVal && (
                <span className="apMedia3DCurrentUrl" title={currentVal}>
                  {currentVal.length > 40 ? `…${currentVal.slice(-38)}` : currentVal}
                </span>
              )}
              <FileUploadField
                label=""
                accept={accept}
                defaultDestination="both"
                driveFolderIdRef={driveFolderIdRef}
                onUploaded={async (result) => {
                  const urlToSave = result.r2Url ?? (result.driveId ? `/api/drive-video?id=${result.driveId}` : null);
                  if (!urlToSave) return;
                  const ok = await patchProductMedia(product.id, key, urlToSave);
                  if (ok) {
                    onFieldSaved(product.id, key, urlToSave);
                    // Track Drive ID so product delete can purge the Drive copy
                    if (result.driveId) {
                      await patchMediaDriveId(product.id, key, result.driveId);
                    }
                  }
                }}
              />
            </div>
          );
        })}
      </div>

      {/* ── Action 1–7 — full FileUploadField per slot with folder picker ── */}
      {/* Each slot shows the R2/GDrive/Both destination selector + the 📁 folder picker. */}
      {/* On upload to "both", Drive ID is saved to mediaDriveIds for purge on delete. */}
      <div className="apMediaSectionActions">
        <p className="apMediaSectionLabel">Action Slots (1 – 7) <span className="apMediaSectionHint">— uploading auto-saves</span></p>
        {ACTION_FIELDS.map(({ field, label }) => {
          const currentVal = product[field] as string | null;
          return (
            <div key={field} className="apMediaActionRow">
              <span className="apMediaLabel" style={{ minWidth: "4.5rem" }}>{label}</span>
              {currentVal && (
                <span className="apMediaActionCurrentUrl" title={currentVal}>
                  {currentVal.length > 36 ? `…${currentVal.slice(-34)}` : currentVal}
                </span>
              )}
              <FileUploadField
                label=""
                accept="video/*"
                defaultDestination="both"
                driveFolderIdRef={driveFolderIdRef}
                onUploaded={async (result) => {
                  const urlToSave = result.r2Url ?? (result.driveId ? `/api/drive-video?id=${result.driveId}` : null);
                  if (!urlToSave) return;
                  const ok = await patchProductMedia(product.id, field, urlToSave);
                  if (ok) {
                    onFieldSaved(product.id, field, urlToSave);
                    // Track Drive ID so product delete can purge the Drive copy
                    if (result.driveId) {
                      await patchMediaDriveId(product.id, field, result.driveId);
                    }
                  }
                }}
              />
              {/* Clear button — removes URL from DB */}
              <button
                className="apPriceCancelBtn"
                style={{ flexShrink: 0 }}
                title={`Clear ${label}`}
                onClick={async () => {
                  const ok = await patchProductMedia(product.id, field, null);
                  if (ok) onFieldSaved(product.id, field, null);
                }}
              >
                ✕
              </button>
            </div>
          );
        })}
      </div>

    </div>
  );
}

// ── AddProductForm — create a new product from the Admin UI ───────────────
// Shown when the admin clicks "Add New Product" at the top of the table.
// On success, the new product is prepended to the list in local state.

// ── FileUploadField — pick a file, choose R2/GDrive/Both, get URL back ───
// destination: r2     → returns public CDN URL
//              gdrive → returns Drive file ID (usable with /api/drive-video)
//              both   → returns both
//
// Folder selectors are live dropdowns fetched from:
//   R2:     GET /api/admin/r2-folders      → { folders: string[] }
//   GDrive: GET /api/admin/drive-folders   → { folders: { id, name }[] }
// Dropdowns open on 📁 click and lazy-load on first open.
function FileUploadField({
  label,
  accept,
  defaultDestination = "r2",
  defaultR2Folder = "products",
  defaultDriveSubfolder = "",
  driveFolderIdRef,
  customFileName,
  onUploaded,
}: {
  label:                  string;
  accept?:                string;
  defaultDestination?:    "r2" | "gdrive" | "both";
  defaultR2Folder?:       string;
  defaultDriveSubfolder?: string;
  driveFolderIdRef:       React.RefObject<string>;
  // If provided, the file is renamed to this value (preserving extension) before upload.
  customFileName?:        string;
  onUploaded:             (result: { r2Url?: string; driveId?: string; driveUrl?: string }) => void;
}) {
  const [destination,    setDestination]    = useState<"r2" | "gdrive" | "both">(defaultDestination);
  const [r2Folder,       setR2Folder]       = useState(defaultR2Folder);
  const [driveSubfolder, setDriveSubfolder] = useState(defaultDriveSubfolder);
  const [showPath,       setShowPath]       = useState(false);
  const [uploading,      setUploading]      = useState(false);
  const [done,           setDone]           = useState(false);
  const [err,            setErr]            = useState("");
  const [deleting,       setDeleting]       = useState(false);
  const [driveConnectUrl, setDriveConnectUrl] = useState<string | null>(null);

  // Track what was uploaded so we can delete it
  const uploadedR2UrlRef  = useRef<string | null>(null);
  const uploadedDriveIdRef = useRef<string | null>(null);

  // Folder lists — seeded empty; live fetch populates on first open
  const KNOWN_R2_FOLDERS: string[] = ["architecture", "character", "systems", "weapon"];
  const KNOWN_DRIVE_FOLDERS: { id: string; name: string }[] = [];

  const [r2Folders,      setR2Folders]      = useState<string[]>(KNOWN_R2_FOLDERS);
  const [driveFolders,   setDriveFolders]   = useState<{ id: string; name: string }[]>(KNOWN_DRIVE_FOLDERS);
  const [foldersLoading, setFoldersLoading] = useState(false);
  const foldersLoadedRef = useRef(false);

  const inputRef = useRef<HTMLInputElement>(null);
  // Tracks the actual Drive folder ID selected from the dropdown for this field
  const selectedDriveFolderIdRef = useRef<string>("");

  // ── Fetch folders on first open — merges live results with known list ───
  async function loadFolders(): Promise<void> {
    if (foldersLoadedRef.current) return;
    foldersLoadedRef.current = true;
    setFoldersLoading(true);
    try {
      const [r2Res, driveRes] = await Promise.allSettled([
        fetch("/api/admin/r2-folders").then(r => r.json()),
        fetch("/api/admin/drive-folders").then(r => r.json()),
      ]);
      if (r2Res.status === "fulfilled" && Array.isArray(r2Res.value.folders)) {
        // Merge live + known, dedup, sort
        const merged = Array.from(new Set([...KNOWN_R2_FOLDERS, ...r2Res.value.folders])).sort();
        setR2Folders(merged);
      }
      if (driveRes.status === "fulfilled" && Array.isArray(driveRes.value.folders)) {
        // Live Drive folders have real IDs — prefer them over placeholder IDs
        const liveNames = new Set((driveRes.value.folders as { id: string; name: string }[]).map(f => f.name));
        const knownNotInLive = KNOWN_DRIVE_FOLDERS.filter(f => !liveNames.has(f.name));
        const merged = [...driveRes.value.folders, ...knownNotInLive]
          .sort((a: { name: string }, b: { name: string }) => a.name.localeCompare(b.name));
        setDriveFolders(merged);
      }
    } finally {
      setFoldersLoading(false);
    }
  }

  function togglePath(): void {
    const next = !showPath;
    setShowPath(next);
    if (next) loadFolders();
  }

  // ── Delete uploaded file from R2 and/or GDrive ───────────────────────
  async function handleDelete(): Promise<void> {
    setDeleting(true);
    setErr("");
    const errors: string[] = [];

    // Delete from R2
    if (uploadedR2UrlRef.current) {
      try {
        const res = await fetch("/api/admin/r2-delete", {
          method:  "DELETE",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({ url: uploadedR2UrlRef.current }),
        });
        const data = await res.json();
        if (!data.success) errors.push(`R2: ${data.error}`);
        else uploadedR2UrlRef.current = null;
      } catch {
        errors.push("R2: network error");
      }
    }

    // Delete from Google Drive
    if (uploadedDriveIdRef.current) {
      try {
        const res = await fetch("/api/admin/drive-delete", {
          method:  "DELETE",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({ fileId: uploadedDriveIdRef.current }),
        });
        const data = await res.json();
        if (!data.success) errors.push(`Drive: ${data.error}`);
        else uploadedDriveIdRef.current = null;
      } catch {
        errors.push("Drive: network error");
      }
    }

    setDeleting(false);
    if (errors.length > 0) {
      setErr(errors.join(" | "));
    } else {
      // Clear the field — notify parent to clear the URL
      setDone(false);
      onUploaded({ r2Url: undefined, driveId: undefined, driveUrl: undefined });
    }
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>): Promise<void> {
    const rawFile = e.target.files?.[0];
    if (!rawFile) return;

    // Rename file to customFileName (preserving extension) if provided
    let file = rawFile;
    if (customFileName) {
      const ext = rawFile.name.includes(".") ? rawFile.name.slice(rawFile.name.lastIndexOf(".")) : "";
      const renamedName = `${customFileName}${ext}`;
      file = new File([rawFile], renamedName, { type: rawFile.type });
    }

    setUploading(true); setDone(false); setErr("");

    const form = new FormData();
    form.append("file",           file);
    form.append("destination",    destination);
    form.append("r2Folder",       r2Folder.trim() || "products");
    form.append("driveSubfolder", driveSubfolder.trim());
    if (destination === "gdrive" || destination === "both") {
      // Prefer folder ID selected from dropdown; fall back to parent-provided ref
      const resolvedFolderId = selectedDriveFolderIdRef.current || driveFolderIdRef.current;
      if (resolvedFolderId && resolvedFolderId.trim()) {
        form.append("driveFolderId", resolvedFolderId.trim());
      } else {
        setErr("Please select a Google Drive folder before uploading.");
        setUploading(false);
        return;
      }
    }

    try {
      const res  = await fetch("/api/admin/product-upload", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok || !data.success) {
        const errMsg = data.errors?.join("; ") || data.error || "Upload failed";
        setErr(errMsg);
        // If Drive is not connected, fetch the reconnect URL
        if (errMsg.toLowerCase().includes("not connected")) {
          fetch("/api/admin/drive-connect-url")
            .then(r => r.json())
            .then(d => { if (d.url) setDriveConnectUrl(d.url); })
            .catch(() => {});
        }
      } else {
        setDone(true);
        uploadedR2UrlRef.current   = data.r2Url   ?? null;
        uploadedDriveIdRef.current = data.driveId  ?? null;
        onUploaded({ r2Url: data.r2Url, driveId: data.driveId, driveUrl: data.driveUrl });
      }
    } catch {
      setErr("Network error — upload failed.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="apFileUploadField">
      <div className="apFileUploadRow">
        <label className="apMediaLabel">{label}</label>
        <div className="apFileUploadControls">
          <select
            className="apFileDestSelect"
            value={destination}
            onChange={e => setDestination(e.target.value as "r2" | "gdrive" | "both")}
            disabled={uploading}
          >
            <option value="r2">R2</option>
            <option value="gdrive">GDrive</option>
            <option value="both">Both</option>
          </select>

          <button
            type="button"
            className="apFilePathToggle"
            onClick={togglePath}
            title="Choose upload folder"
          >
            {showPath ? "▲" : "📁"}
          </button>

          <input
            ref={inputRef}
            type="file"
            accept={accept}
            style={{ display: "none" }}
            onChange={handleFile}
          />
          <button
            type="button"
            className={"apFilePickBtn" + (done ? " apFilePickBtnDone" : "")}
            onClick={() => { if (!done) inputRef.current?.click(); }}
            disabled={uploading}
          >
            {uploading ? "Uploading…" : done ? "✓ Saved" : "Upload & Save"}
          </button>
          {done && (
            <button
              type="button"
              className="apFileDeleteBtn"
              onClick={handleDelete}
              disabled={deleting}
              title="Delete uploaded file from R2 / Drive"
            >
              {deleting ? "…" : "🗑"}
            </button>
          )}
        </div>
      </div>

      {/* ── Expandable folder picker ── */}
      {showPath && (
        <div className="apFilePathConfig">
          {foldersLoading && (
            <p className="apFolderLoading">Loading folders…</p>
          )}

          {/* R2 folder dropdown */}
          {!foldersLoading && (destination === "r2" || destination === "both") && (
            <div className="apFilePathRow">
              <span className="apFilePathLabel">R2 folder</span>
              <select
                className="apFolderSelect"
                value={r2Folder}
                onChange={e => setR2Folder(e.target.value)}
              >
                {/* Keep current value even if not in list */}
                {!r2Folders.includes(r2Folder) && r2Folder && (
                  <option value={r2Folder}>{r2Folder}</option>
                )}
                {r2Folders.map(f => (
                  <option key={f} value={f}>{f}</option>
                ))}
                {r2Folders.length === 0 && (
                  <option value="products">products</option>
                )}
              </select>
            </div>
          )}

          {/* GDrive folder dropdown */}
          {!foldersLoading && (destination === "gdrive" || destination === "both") && (
            <div className="apFilePathRow">
              <span className="apFilePathLabel">GDrive folder</span>
              <select
                className="apFolderSelect"
                value={driveSubfolder}
                onChange={e => {
                  const selectedName = e.target.value;
                  setDriveSubfolder(selectedName);
                  // Store the real folder ID locally for upload
                  const found = driveFolders.find(f => f.name === selectedName);
                  selectedDriveFolderIdRef.current = found?.id ?? "";
                }}
              >
                <option value="">— root / no subfolder —</option>
                {driveFolders.map(f => (
                  <option key={f.id} value={f.name}>{f.name}</option>
                ))}
                {driveFolders.length === 0 && (
                  <option disabled>No folders found — check Drive connection</option>
                )}
              </select>
            </div>
          )}
        </div>
      )}

      {err && (
        <div className="apFileUploadErrWrap">
          <p className="apFileUploadErr">{err}</p>
          {driveConnectUrl && (
            <div className="apDriveReconnectRow">
              <p className="apDriveRedirectNote">
                ⚠ Before clicking, make sure your Google Cloud Console has this URI added under
                <strong> APIs &amp; Services → Credentials → OAuth 2.0 Client → Authorized redirect URIs</strong>:
                <br />
                <code className="apDriveRedirectUri">
                  {typeof window !== "undefined" ? window.location.origin : ""}/api/google/callback
                </code>
                <a
                  href="https://console.cloud.google.com/apis/credentials"
                  target="_blank"
                  rel="noreferrer"
                  className="apDriveConsoleLink"
                >
                  Open Google Cloud Console ↗
                </a>
              </p>
              <a
                href={driveConnectUrl}
                className="apDriveReconnectBtn"
              >
                🔗 Reconnect Google Drive
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
function AddProductForm({ onProductCreated, onClose }: {
  onProductCreated: (product: Product) => void;
  onClose: () => void;
}) {
  const [name, setName]               = useState("");
  const [priceMeshOnly, setPriceMeshOnly] = useState("");
  const [priceStandard,  setPriceStandard]  = useState("");
  const [priceFullPack,  setPriceFullPack]  = useState("");
  const [category, setCategory]       = useState("character");
  const [description, setDescription] = useState("");
  const [isLatest, setIsLatest]       = useState(false);
  const [previewVideoUrl, setPreviewVideoUrl] = useState("");
  const [facePngUrl, setFacePngUrl]           = useState("");
  // 3D Model — three separate slots (OBJ, FBX, GLB), stored concatenated or as first found
  const [threeDObjUrl, setThreeDObjUrl] = useState("");
  const [threeDFbxUrl, setThreeDFbxUrl] = useState("");
  const [threeDGlbUrl, setThreeDGlbUrl] = useState("");
  const [actionOneUrl,   setActionOneUrl]   = useState("");
  const [actionTwoUrl,   setActionTwoUrl]   = useState("");
  const [actionThreeUrl, setActionThreeUrl] = useState("");
  const [actionFourUrl,  setActionFourUrl]  = useState("");
  const [actionFiveUrl,  setActionFiveUrl]  = useState("");
  const [actionSixUrl,   setActionSixUrl]   = useState("");
  const [actionSevenUrl, setActionSevenUrl] = useState("");
  const [driveFolderId, setDriveFolderId]     = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState("");

  // Ref so FileUploadField always sees latest driveFolderId without re-mount
  const driveFolderIdRef = useRef<string>("");
  driveFolderIdRef.current = driveFolderId;

  // Fetch live Drive folder IDs on mount so FileUploadField dropdowns have real IDs ready.
  // This prevents the placeholder IDs in KNOWN_DRIVE_FOLDERS from being used on upload.
  useEffect(() => {
    fetch("/api/admin/drive-folders")
      .then(r => r.json())
      .catch(() => null);
  }, []);

  const [mediaDriveIds, setMediaDriveIds] = useState<Record<string, string>>({});

  // Slugify name to use as filename base — e.g. "Axe-01" → "axe-01"
  function slugifyName(raw: string): string {
    return raw.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
  }

  // The threeDUrl stored in DB is the first available 3D URL (OBJ preferred, then FBX, then GLB)
  function resolveThreeDUrl(): string {
    return (threeDObjUrl || threeDFbxUrl || threeDGlbUrl).trim();
  }

  async function handleCreate() {
    if (!name.trim()) { setError("Name is required."); return; }
    const parsedMesh     = parseInt(priceMeshOnly.replace(/,/g, ""), 10);
    const parsedStandard = parseInt(priceStandard.replace(/,/g, ""), 10);
    const parsedFull     = parseInt(priceFullPack.replace(/,/g, ""), 10);
    const isFlat = category === "interior" || category === "exterior";
    if (!isFlat && (isNaN(parsedMesh)     || parsedMesh     < 0)) { setError("Enter a valid Mesh Only price (₱)."); return; }
    if (!isFlat && (isNaN(parsedStandard) || parsedStandard < 0)) { setError("Enter a valid Standard price (₱)."); return; }
    if (isNaN(parsedFull) || parsedFull < 0) { setError("Enter a valid price (₱)."); return; }
    setSaving(true);
    setError("");
    const product = await createProduct({
      name: name.trim(),
      priceMeshOnly: isFlat ? parsedFull : parsedMesh,
      priceStandard:  isFlat ? parsedFull : parsedStandard,
      priceFullPack:  parsedFull,
      category,
      description: description.trim() || undefined,
      isLatest,
      enabledTiers:    "mesh_only,standard,full_pack",
      previewVideoUrl: previewVideoUrl.trim() || undefined,
      facePngUrl:      facePngUrl.trim()      || undefined,
      threeDUrl:       resolveThreeDUrl()      || undefined,
      actionOneUrl:    actionOneUrl.trim()    || undefined,
      actionTwoUrl:    actionTwoUrl.trim()    || undefined,
      actionThreeUrl:  actionThreeUrl.trim()  || undefined,
      actionFourUrl:   actionFourUrl.trim()   || undefined,
      actionFiveUrl:   actionFiveUrl.trim()   || undefined,
      actionSixUrl:    actionSixUrl.trim()    || undefined,
      actionSevenUrl:  actionSevenUrl.trim()  || undefined,
      mediaDriveIds:   Object.keys(mediaDriveIds).length > 0 ? JSON.stringify(mediaDriveIds) : undefined,
    });
    if (product) {
      onProductCreated(product);
      onClose();
    } else {
      setError("Failed to create product. Try again.");
    }
    setSaving(false);
  }

  const nameSlug = slugifyName(name);

  return (
    <div className="apAddProductForm">
      <p className="apAddAddonFormTitle">New Product</p>
      <div className="apAddProductScrollBody">
      <div className="apAddProductGrid">
        <div className="apAddProductField apAddProductFieldFull">
          <label className="apMediaLabel">Name *</label>
          <input className="apMediaInput" placeholder="e.g. Axe-01" value={name} onChange={e => setName(e.target.value)} />
        </div>
        {(category === "character" || category === "weapon") && (<>
        <div className="apAddProductField">
          <label className="apMediaLabel">Price — Mesh Only (₱) *</label>
          <input className="apMediaInput" type="number" min="0" placeholder="0" value={priceMeshOnly} onChange={e => setPriceMeshOnly(e.target.value)} />
        </div>
        <div className="apAddProductField">
          <label className="apMediaLabel">Price — Standard (₱) *</label>
          <input className="apMediaInput" type="number" min="0" placeholder="0" value={priceStandard} onChange={e => setPriceStandard(e.target.value)} />
        </div>
        </>)}
        <div className="apAddProductField">
          <label className="apMediaLabel">{(category === "interior" || category === "exterior") ? "Price (₱) *" : "Price — Full Pack (₱) *"}</label>
          <input className="apMediaInput" type="number" min="0" placeholder="0" value={priceFullPack} onChange={e => setPriceFullPack(e.target.value)} />
        </div>
        <div className="apAddProductField">
          <label className="apMediaLabel">Category *</label>
          <select className="apMediaInput apMediaSelect" value={category} onChange={e => { setCategory(e.target.value); setIsLatest(false); }}>
            <option value="character">Character</option>
            <option value="weapon">Weapon</option>
            <option value="interior">Interior</option>
            <option value="exterior">Exterior</option>
          </select>
        </div>
        <div className="apAddProductField apAddProductFieldFull">
          <label className="apMediaLabel">Description</label>
          <input className="apMediaInput" placeholder="Short description…" value={description} onChange={e => setDescription(e.target.value)} />
        </div>

        {/* ── Preview Video → Both (R2 + GDrive), filename: name-animation ── */}
        <div className="apAddProductField apAddProductFieldFull">
          <FileUploadField
            label="Preview Video (Both)"
            accept="video/*"
            defaultDestination="both"
            driveFolderIdRef={driveFolderIdRef}
            customFileName={nameSlug ? `${nameSlug}-animation` : undefined}
            onUploaded={r => { if (r.r2Url) setPreviewVideoUrl(r.r2Url); else if (r.driveId) setPreviewVideoUrl(`/api/drive-video?id=${r.driveId}`); }}
          />
          <input className="apMediaInput apFileManualInput" placeholder="or paste URL manually…" value={previewVideoUrl} onChange={e => setPreviewVideoUrl(e.target.value)} />
        </div>

        {/* ── Face PNG — Character & Weapon only ── */}
        {(category === "character" || category === "weapon") && (
        <div className="apAddProductField">
          <FileUploadField
            label="Face PNG (R2 + GDrive)"
            accept="image/*"
            defaultDestination="both"
            driveFolderIdRef={driveFolderIdRef}
            customFileName={nameSlug ? `${nameSlug}-face` : undefined}
            onUploaded={r => {
              if (r.r2Url) setFacePngUrl(r.r2Url);
              else if (r.driveId) setFacePngUrl(`/api/drive-video?id=${r.driveId}`);
              if (r.driveId) setMediaDriveIds(prev => ({ ...prev, facePngUrl: r.driveId! }));
            }}
          />
          <input className="apMediaInput apFileManualInput" placeholder="or paste URL manually…" value={facePngUrl} onChange={e => setFacePngUrl(e.target.value)} />
        </div>
        )}

        {/* ── 3D Model — Character & Weapon only ── */}
        {(category === "character" || category === "weapon") && (
        <div className="apAddProductField apAddProductFieldFull">
          <label className="apMediaLabel" style={{ marginBottom: "0.35rem" }}>3D Model (OBJ / FBX / GLB) — Both</label>
          <div className="apThreeDSlots">
            {/* OBJ slot */}
            <div className="apThreeDSlot">
              <FileUploadField
                label="OBJ"
                accept=".obj"
                defaultDestination="both"
                driveFolderIdRef={driveFolderIdRef}
                customFileName={nameSlug ? `${nameSlug}-obj` : undefined}
                onUploaded={r => { if (r.r2Url) setThreeDObjUrl(r.r2Url); else if (r.driveId) setThreeDObjUrl(r.driveId); }}
              />
              {threeDObjUrl && (
                <div className="apThreeDUploaded">
                  <span className="apThreeDUploadedName" title={threeDObjUrl}>✓ OBJ saved</span>
                  <button
                    type="button"
                    className="apThreeDDeleteBtn"
                    onClick={() => setThreeDObjUrl("")}
                    title="Remove OBJ"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                  </button>
                </div>
              )}
            </div>
            {/* FBX slot */}
            <div className="apThreeDSlot">
              <FileUploadField
                label="FBX"
                accept=".fbx"
                defaultDestination="both"
                driveFolderIdRef={driveFolderIdRef}
                customFileName={nameSlug ? `${nameSlug}-fbx` : undefined}
                onUploaded={r => { if (r.r2Url) setThreeDFbxUrl(r.r2Url); else if (r.driveId) setThreeDFbxUrl(r.driveId); }}
              />
              {threeDFbxUrl && (
                <div className="apThreeDUploaded">
                  <span className="apThreeDUploadedName" title={threeDFbxUrl}>✓ FBX saved</span>
                  <button
                    type="button"
                    className="apThreeDDeleteBtn"
                    onClick={() => setThreeDFbxUrl("")}
                    title="Remove FBX"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                  </button>
                </div>
              )}
            </div>
            {/* GLB slot */}
            <div className="apThreeDSlot">
              <FileUploadField
                label="GLB"
                accept=".glb,.gltf"
                defaultDestination="both"
                driveFolderIdRef={driveFolderIdRef}
                customFileName={nameSlug ? `${nameSlug}-glb` : undefined}
                onUploaded={r => { if (r.r2Url) setThreeDGlbUrl(r.r2Url); else if (r.driveId) setThreeDGlbUrl(r.driveId); }}
              />
              {threeDGlbUrl && (
                <div className="apThreeDUploaded">
                  <span className="apThreeDUploadedName" title={threeDGlbUrl}>✓ GLB saved</span>
                  <button
                    type="button"
                    className="apThreeDDeleteBtn"
                    onClick={() => setThreeDGlbUrl("")}
                    title="Remove GLB"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
        )} {/* end character/weapon only — 3D Model */}

        {/* ── Action Videos 1–7 — Character & Weapon only ── */}
        {(category === "character" || category === "weapon") && (<>
          {([
            ["Action 1 Video", actionOneUrl,   setActionOneUrl,   "actionOneUrl",   "1"],
            ["Action 2 Video", actionTwoUrl,   setActionTwoUrl,   "actionTwoUrl",   "2"],
            ["Action 3 Video", actionThreeUrl, setActionThreeUrl, "actionThreeUrl", "3"],
            ["Action 4 Video", actionFourUrl,  setActionFourUrl,  "actionFourUrl",  "4"],
            ["Action 5 Video", actionFiveUrl,  setActionFiveUrl,  "actionFiveUrl",  "5"],
            ["Action 6 Video", actionSixUrl,   setActionSixUrl,   "actionSixUrl",   "6"],
            ["Action 7 Video", actionSevenUrl, setActionSevenUrl, "actionSevenUrl", "7"],
          ] as [string, string, React.Dispatch<React.SetStateAction<string>>, string, string][]).map(([lbl, val, setter, fieldKey, num]) => (
            <div key={num} className="apAddProductField">
              <FileUploadField
                label={`${lbl} (Both)`}
                accept="video/*"
                defaultDestination="both"
                driveFolderIdRef={driveFolderIdRef}
                customFileName={nameSlug ? `${nameSlug}-action-${num}` : undefined}
                onUploaded={r => {
                  if (r.r2Url) setter(r.r2Url);
                  else if (r.driveId) setter(`/api/drive-video?id=${r.driveId}`);
                  if (r.driveId) setMediaDriveIds(prev => ({ ...prev, [fieldKey]: r.driveId! }));
                }}
              />
              <input className="apMediaInput apFileManualInput" placeholder="or paste URL manually…" value={val} onChange={e => setter(e.target.value)} />
            </div>
          ))}
        </>)}

        <div className="apAddProductField apAddProductFieldFull apAddProductLatestToggle">
          <p className="apMediaLabel" style={{ marginBottom: "0.5rem" }}>Mark as Latest Drop</p>
          <div className="apLatestRadioGroup">
            <label className="apLatestToggleLabel">
              <input
                type="radio"
                name="latestDropType"
                checked={!isLatest}
                onChange={() => setIsLatest(false)}
              />
              None
            </label>
            <div className="apLatestRadioDivider" />
            <label className="apLatestToggleLabel">
              <input
                type="radio"
                name="latestDropType"
                checked={isLatest && (category === "character" || category === "weapon")}
                onChange={() => setIsLatest(true)}
              />
              Mark as Latest Drop on Character &amp; Weapon
            </label>
            <label className="apLatestToggleLabel">
              <input
                type="radio"
                name="latestDropType"
                checked={isLatest && (category === "interior" || category === "exterior")}
                onChange={() => setIsLatest(true)}
              />
              Mark as Latest Drop on Interior &amp; Exterior
            </label>
          </div>
        </div>
      </div>
      </div>{/* end apAddProductScrollBody */}
      {error && <p className="apAddAddonError">{error}</p>}
      <div className="apAddAddonFormActions">
        <button className="apPriceCancelBtn" onClick={onClose}>Cancel</button>
        <button className="apPriceSaveBtn" onClick={handleCreate} disabled={saving}
          style={{ background: "#22c55e", color: "#0d0d0d" }}>
          {saving ? "Creating…" : "Create Product"}
        </button>
      </div>
    </div>
  );
}

// ── ProductsSection — products table with media editing and add form ────
// Each row is expandable to reveal the MediaEditor and isLatest toggle.
// "Add New Product" button at top opens AddProductForm inline.
function ProductsSection({
  products, onToggle, togglingId,
}: {
  products: Product[];
  onToggle: (id: string, current: boolean) => void;
  togglingId: string | null;
}) {
  const revealRef = useReveal();
  const [productList, setProductList]     = useState<Product[]>(products);
  const [expandedRow, setExpandedRow]     = useState<string | null>(null);
  const [togglingLatest, setTogglingLatest] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: "ok"|"err" }|null>(null);
  const [showAddForm, setShowAddForm]     = useState(false);
  const [deletingId,  setDeletingId]      = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // ── Delete product — purges ALL R2 and Drive files then removes DB record ──
  // Every media field is checked. A URL is sent to R2 delete if it looks like an
  // R2/CDN URL. A value is sent to Drive delete if it is a bare Drive file ID
  // (no "http") or contains "/api/drive-video?id=". Both deletions run in parallel.
  async function handleDeleteProduct(product: Product): Promise<void> {
    setDeletingId(product.id);
    setConfirmDeleteId(null);

    // All media fields on the Product model — includes R2 URLs, Drive IDs, and file keys
    const ALL_MEDIA_FIELDS: (keyof Product)[] = [
      "previewVideoUrl", "facePngUrl",    "threeDUrl",
      "actionOneUrl",    "actionTwoUrl",  "actionThreeUrl",
      "actionFourUrl",   "actionFiveUrl", "actionSixUrl", "actionSevenUrl",
      "fileKeyObj",      "fileKeyFbx",    "fileKeyGlb",
      "animIdleUrl",     "animWalkUrl",   "animRunUrl",
      "animAttackOneUrl","animAttackTwoUrl","animDeathUrl","animHitUrl",
    ];

    const r2Urls:    string[] = [];
    const driveIds:  string[] = [];

    for (const field of ALL_MEDIA_FIELDS) {
      const val = product[field] as string | null;
      if (!val) continue;

      // Detect Drive file ID: bare ID (no http) OR /api/drive-video?id=XXX
      const driveMatch = val.match(/[?&]id=([^&]+)/);
      if (driveMatch) {
        driveIds.push(driveMatch[1]);
        continue;
      }
      if (!val.startsWith("http") && !val.startsWith("/")) {
        // Looks like a raw Drive file ID
        driveIds.push(val);
        continue;
      }

      // Anything starting with http that is not a drive.google.com share link → R2
      if (val.startsWith("http") && !val.includes("drive.google.com")) {
        r2Urls.push(val);
        continue;
      }
      // /api/ internal proxied Drive files — extract the id param
      if (val.startsWith("/api/drive-video")) {
        const id = new URLSearchParams(val.split("?")[1] ?? "").get("id");
        if (id) driveIds.push(id);
      }
    }

    // ── Add Drive IDs from mediaDriveIds map ─────────────────────────
    // Captures Drive copies of files uploaded to "both" — where only the
    // R2 URL was saved to the media field and the Drive ID was tracked separately.
    if (product.mediaDriveIds) {
      try {
        const driveMap: Record<string, string> = JSON.parse(product.mediaDriveIds);
        for (const driveId of Object.values(driveMap)) {
          if (driveId && !driveIds.includes(driveId)) driveIds.push(driveId);
        }
      } catch { /* malformed JSON — skip */ }
    }

    // Best-effort parallel deletion from both storages
    await Promise.allSettled([
      ...r2Urls.map(deleteFromR2),
      ...driveIds.map(deleteFromDrive),
    ]);

    // Delete from DB
    const { ok, error } = await deleteProduct(product.id);
    setDeletingId(null);
    if (ok) {
      setProductList(prev => prev.filter(p => p.id !== product.id));
      setToast({ msg: `"${product.name}" deleted — files purged from R2 & Drive.`, type: "ok" });
      setTimeout(() => setToast(null), 4000);
    } else {
      setToast({ msg: error ?? "Delete failed.", type: "err" });
      setTimeout(() => setToast(null), 4000);
    }
  }

  // ── Filter + Sort ─────────────────────────────────────────────────────
  const [filterName,     setFilterName]     = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [sortCol,        setSortCol]        = useState<"name"|"category"|"price"|"latest">("name");
  const [sortDir,        setSortDir]        = useState<"asc"|"desc">("asc");

  function toggleSort(col: typeof sortCol) {
    if (sortCol === col) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortCol(col); setSortDir("asc"); }
  }

  const displayList = [...productList]
    .filter(p => {
      const nameMatch = p.name.toLowerCase().includes(filterName.toLowerCase());
      const catMatch  = filterCategory === "all" || p.category === filterCategory;
      return nameMatch && catMatch;
    })
    .sort((a, b) => {
      let cmp = 0;
      if (sortCol === "name")     cmp = a.name.localeCompare(b.name);
      if (sortCol === "category") cmp = a.category.localeCompare(b.category);
      if (sortCol === "price")    cmp = a.priceMeshOnly - b.priceMeshOnly;
      if (sortCol === "latest")   cmp = (a.isLatest ? 0 : 1) - (b.isLatest ? 0 : 1);
      return sortDir === "asc" ? cmp : -cmp;
    });

  function showToast(msg: string, type: "ok"|"err") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  }

  function handleFieldSaved(productId: string, field: string, value: string | null) {
    const NUMERIC_FIELDS = new Set(["priceMeshOnly", "priceStandard", "priceFullPack"]);
    const parsedValue = NUMERIC_FIELDS.has(field) && value !== null
      ? parseInt(value, 10)
      : value;
    setProductList(prev => prev.map(p =>
      p.id === productId ? { ...p, [field]: parsedValue } : p
    ));
    const labelMap: Record<string, string> = {
      previewVideoUrl: "Preview Video",
      facePngUrl:      "Face PNG",
      fileKeyObj:      "OBJ file",
      fileKeyFbx:      "FBX file",
      fileKeyGlb:      "GLB file",
      priceMeshOnly:   "Tier prices",
      priceStandard:   "Tier prices",
      priceFullPack:   "Tier prices",
    };
    const fieldLabel = labelMap[field] ?? field;
    // Avoid 3 toasts for 1 save — only toast on priceFullPack (last field saved)
    if (field === "priceFullPack") {
      showToast(`✓ ${fieldLabel} updated successfully.`, "ok");
    } else if (!NUMERIC_FIELDS.has(field)) {
      if (value) {
        showToast(`✓ ${fieldLabel} uploaded & saved successfully.`, "ok");
      } else {
        showToast(`✓ ${fieldLabel} cleared.`, "ok");
      }
    }
  }

  async function handleToggleLatest(id: string, current: boolean) {
    setTogglingLatest(id);
    try {
      const err = await toggleProductLatest(id, current);
      if (!err) {
        setProductList(prev => {
          const target = prev.find(p => p.id === id);
          return prev.map(p => {
            if (p.id === id) return { ...p, isLatest: !current };
            if (!current && p.category === target?.category) return { ...p, isLatest: false };
            return p;
          });
        });
        showToast(!current ? "✦ Set as Latest Drop." : "Unset Latest Drop.", "ok");
      } else {
        showToast(`Failed: ${err}`, "err");
      }
    } finally {
      setTogglingLatest(null);
    }
  }

  function handleProductCreated(newProduct: Product) {
    setProductList(prev => [newProduct, ...prev]);
    showToast(`✦ "${newProduct.name}" created successfully.`, "ok");
    setShowAddForm(false);
  }

  return (
    <div className="apCard apReveal" ref={revealRef}>
      {toast && (
        <div className={`apToast apToast--${toast.type}`}>{toast.msg}</div>
      )}
      <div className="apCardHeader">
        <div>
          <h2 className="apCardTitle">Products</h2>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <span className="apCardBadge">{productList.length}</span>
          <button
            className="apPriceSaveBtn"
            onClick={() => setShowAddForm(prev => !prev)}
            style={{ background: showAddForm ? "rgba(255,255,255,0.08)" : "#22c55e", color: showAddForm ? "#aaa" : "#0d0d0d", fontSize: "0.78rem" }}
          >
            {showAddForm ? "✕ Cancel" : "+ Add New Product"}
          </button>
        </div>
      </div>

      {/* Add product inline form */}
      {showAddForm && (
        <AddProductForm
          onProductCreated={handleProductCreated}
          onClose={() => setShowAddForm(false)}
        />
      )}

      <div className="apTable">
        {/* ── Filter bar ── */}
        <div className="apProductFilterBar">
          <input
            className="apProductFilterInput"
            placeholder="Search by name…"
            value={filterName}
            onChange={e => setFilterName(e.target.value)}
          />
          <select
            className="apProductFilterSelect"
            value={filterCategory}
            onChange={e => setFilterCategory(e.target.value)}
          >
            <option value="all">All Categories</option>
            <option value="character">Character</option>
            <option value="weapon">Weapon</option>
            <option value="interior">Interior</option>
            <option value="exterior">Exterior</option>
          </select>
        </div>

        {/* ── Sortable column headers ── */}
        <div className="apTableHead apGrid--productsV2">
          {(["name","category","price","latest"] as const).map(col => (
            <span
              key={col}
              className={"apTableSortHeader" + (sortCol === col ? " apTableSortHeaderActive" : "")}
              onClick={() => toggleSort(col)}
            >
              {col.charAt(0).toUpperCase() + col.slice(1)}
              <span className="apTableSortIcon">
                {sortCol === col ? (sortDir === "asc" ? " ↑" : " ↓") : " ↕"}
              </span>
            </span>
          ))}
          <span>Actions</span>
        </div>
        {displayList.length === 0 && productList.length > 0 && (
          <div className="apEmpty">
            <p className="apEmptyTitle">No results</p>
            <p className="apEmptyHint">Try adjusting your search or filter.</p>
          </div>
        )}
        {productList.length === 0 && (
          <div className="apEmpty">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M20 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"/>
              <path d="M16 3H8a2 2 0 0 0-2 2v2h12V5a2 2 0 0 0-2-2z"/>
            </svg>
            <p className="apEmptyTitle">No products yet</p>
            <p className="apEmptyHint">Click "Add New Product" above to create one.</p>
          </div>
        )}
        {displayList.map(p => (
          <div key={p.id}>
            <div className="apTableRow apGrid--productsV2">
              <span className="apCell apCellName">{p.name}</span>
              <span className="apCell apCellMuted" style={{ textTransform: "capitalize" }}>{p.category}</span>
              <span className="apCell apCellMono apCellTierPrices">
                {(p.category === "interior" || p.category === "exterior") ? (
                  <span title="Flat Price">₱{p.priceFullPack.toLocaleString()}</span>
                ) : (
                  <>
                    <span title="Mesh Only">M ₱{p.priceMeshOnly.toLocaleString()}</span>
                    <span title="Standard">S ₱{p.priceStandard.toLocaleString()}</span>
                    <span title="Full Pack">F ₱{p.priceFullPack.toLocaleString()}</span>
                  </>
                )}
              </span>
              <span className="apCell">
                <button
                  className={`apActionBtn ${p.isLatest ? "apActionBtnActivate" : "apActionBtnDeactivate"}`}
                  style={{ fontSize: "0.72rem" }}
                  onClick={() => handleToggleLatest(p.id, p.isLatest)}
                  disabled={togglingLatest === p.id}
                  title="Toggle Latest Drop flag"
                >
                  {togglingLatest === p.id ? "…" : p.isLatest ? "✦ Latest" : "Set Latest"}
                </button>
              </span>
              <span className="apCell" style={{ display:"flex",gap:"0.4rem",flexWrap:"wrap",alignItems:"center" }}>
                <button
                  className="apActionBtn apActionBtnActivate"
                  onClick={() => { if (!p.isActive) onToggle(p.id, p.isActive); }}
                  disabled={togglingId === p.id || p.isActive}
                  style={{ opacity: p.isActive ? 0.28 : 1 }}
                >
                  {togglingId === p.id && !p.isActive ? "…" : "Activate"}
                </button>
                <button
                  className="apActionBtn apActionBtnDeactivate"
                  onClick={() => { if (p.isActive) onToggle(p.id, p.isActive); }}
                  disabled={togglingId === p.id || !p.isActive}
                  style={{ opacity: !p.isActive ? 0.28 : 1 }}
                >
                  {togglingId === p.id && p.isActive ? "…" : "Deactivate"}
                </button>
                <button
                  className={`apActionBtn ${expandedRow === p.id ? "apActionBtnDeactivate" : "apActionBtnActivate"}`}
                  style={{ fontSize: "0.72rem" }}
                  onClick={() => setExpandedRow(prev => prev === p.id ? null : p.id)}
                >
                  {expandedRow === p.id ? "▲ Media" : "✎ Media"}
                </button>
                {/* Delete — two-step confirm */}
                {confirmDeleteId === p.id ? (
                  <>
                    <button
                      className="apActionBtn apActionBtnDelete apActionBtnDeleteConfirm"
                      onClick={() => handleDeleteProduct(p)}
                      disabled={deletingId === p.id}
                    >
                      {deletingId === p.id ? "…" : "Confirm"}
                    </button>
                    <button
                      className="apActionBtn apActionBtnDeactivate"
                      style={{ fontSize: "0.7rem" }}
                      onClick={() => setConfirmDeleteId(null)}
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <button
                    className="apActionBtn apActionBtnDelete"
                    style={{ fontSize: "0.72rem" }}
                    onClick={() => setConfirmDeleteId(p.id)}
                    disabled={deletingId === p.id}
                    title="Delete product + files from R2/Drive"
                  >
                    🗑 Delete
                  </button>
                )}
              </span>
            </div>
            {/* Expanded media editor row */}
            {expandedRow === p.id && (
              <div className="apMediaEditorWrap">
                <MediaEditor product={p} onFieldSaved={handleFieldSaved} />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── SystemFullEditor — expandable full-field editor for a System card ─
// Renders inside the accordion body when admin clicks "✎ Edit System".
// Saves each changed field via PATCH. Features is edited as a newline-
// separated textarea and split back to a string array on save.
function SystemFullEditor({ system, accent, onSaved }: {
  system: System;
  accent: string;
  onSaved: (fields: Partial<System>) => void;
}) {
  const [title, setTitle]           = useState(system.title);
  const [description, setDesc]      = useState(system.description);
  const [accentVal, setAccent]      = useState(system.accent);
  const [timeline, setTimeline]     = useState(system.timeline);
  const [deploy, setDeploy]         = useState(system.deploy);
  const [features, setFeatures]     = useState((system.features ?? []).join("\n"));
  const [bgVideoUrl, setBgVideo]        = useState(system.bgVideoUrl ?? "");
  const [demoVideoUrl, setDemoVideo]    = useState(system.demoVideoUrl ?? "");
  const [displayStatus, setDisplayStatus] = useState(system.displayStatus ?? "visible");
  const [saving, setSaving]         = useState(false);
  const [saved, setSaved]           = useState(false);
  const [error, setError]           = useState("");

  async function handleSave() {
    if (!title.trim()) { setError("Title is required."); return; }
    setSaving(true);
    setError("");
    const featuresList = features.split("\n").map(f => f.trim()).filter(Boolean);
    const ok = await updateSystemFields(system.id, {
      title:         title.trim(),
      description:   description.trim(),
      accent:        accentVal.trim(),
      timeline:      timeline.trim(),
      deploy:        deploy.trim(),
      features:      featuresList,
      bgVideoUrl:    bgVideoUrl.trim() || null,
      demoVideoUrl:  demoVideoUrl.trim() || null,
      displayStatus: displayStatus,
    });
    if (ok) {
      onSaved({
        title:         title.trim(),
        description:   description.trim(),
        accent:        accentVal.trim(),
        timeline:      timeline.trim(),
        deploy:        deploy.trim(),
        features:      featuresList,
        bgVideoUrl:    bgVideoUrl.trim() || null,
        demoVideoUrl:  demoVideoUrl.trim() || null,
        displayStatus: displayStatus,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } else {
      setError("Save failed. Try again.");
    }
    setSaving(false);
  }

  return (
    <div className="apSystemFullEditor" onClick={e => e.stopPropagation()}>
      <p className="apSystemEditorTitle">Edit System Fields</p>
      <div className="apSystemEditorGrid">

        <div className="apSystemEditorField apSystemEditorFieldFull">
          <label className="apMediaLabel">Title</label>
          <input className="apMediaInput" value={title} onChange={e => setTitle(e.target.value)} />
        </div>

        <div className="apSystemEditorField">
          <label className="apMediaLabel">Accent Color (hex)</label>
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
            <input
              className="apMediaInput"
              value={accentVal}
              onChange={e => setAccent(e.target.value)}
              style={{ borderColor: accentVal }}
            />
            <span
              style={{
                width: "1.5rem", height: "1.5rem", borderRadius: "50%",
                background: accentVal, flexShrink: 0, border: "1px solid rgba(255,255,255,0.12)"
              }}
            />
          </div>
        </div>

        <div className="apSystemEditorField">
          <label className="apMediaLabel">Timeline (e.g. 4–6 weeks)</label>
          <input className="apMediaInput" value={timeline} onChange={e => setTimeline(e.target.value)} />
        </div>

        <div className="apSystemEditorField">
          <label className="apMediaLabel">Deploy (e.g. Cloud / On-premise)</label>
          <input className="apMediaInput" value={deploy} onChange={e => setDeploy(e.target.value)} />
        </div>

        {/* ── Display Status — controls how this system appears to buyers/visitors ── */}
        <div className="apSystemEditorField apSystemEditorFieldFull">
          <label className="apMediaLabel">Display Status</label>
          <div className="apSystemStatusGroup">
            {([
              { value: "visible",      label: "Visible",      hint: "Shown normally — buyers can configure & order",           color: "#22c55e" },
              { value: "coming_soon",  label: "Coming Soon",  hint: "Shown with a locked badge — no ordering allowed",         color: "#f6ad55" },
              { value: "ongoing",      label: "Ongoing",      hint: "Shown with an In Development badge",                      color: "#63b3ed" },
              { value: "hidden",       label: "Hidden",       hint: "Not shown to buyers or visitors at all",                  color: "#fc8181" },
            ] as { value: string; label: string; hint: string; color: string }[]).map(opt => (
              <button
                key={opt.value}
                type="button"
                className={`apSystemStatusBtn${displayStatus === opt.value ? " apSystemStatusBtnActive" : ""}`}
                style={displayStatus === opt.value ? { borderColor: opt.color, color: opt.color, background: `${opt.color}14` } : undefined}
                onClick={() => setDisplayStatus(opt.value)}
                title={opt.hint}
              >
                <span className="apSystemStatusDot" style={{ background: opt.color }} />
                {opt.label}
              </button>
            ))}
          </div>
          <p className="apSystemStatusHint">
            {displayStatus === "visible"     && "Buyers can see and order this system."}
            {displayStatus === "coming_soon" && "System is visible but locked — buyers see a Coming Soon badge."}
            {displayStatus === "ongoing"     && "System shows an In Development badge."}
            {displayStatus === "hidden"      && "System is completely hidden from buyers and visitors."}
          </p>
        </div>

        <div className="apSystemEditorField apSystemEditorFieldFull">
          <label className="apMediaLabel">Description</label>
          <textarea
            className="apMediaInput apSystemEditorTextarea"
            rows={3}
            value={description}
            onChange={e => setDesc(e.target.value)}
          />
        </div>

        <div className="apSystemEditorField apSystemEditorFieldFull">
          <label className="apMediaLabel">Features (one per line)</label>
          <textarea
            className="apMediaInput apSystemEditorTextarea"
            rows={5}
            placeholder={"Feature A\nFeature B\nFeature C"}
            value={features}
            onChange={e => setFeatures(e.target.value)}
          />
        </div>

        <div className="apSystemEditorField apSystemEditorFieldFull">
          <label className="apMediaLabel">Background Video URL</label>
          <input
            className="apMediaInput"
            placeholder="Paste URL or leave empty to clear"
            value={bgVideoUrl}
            onChange={e => setBgVideo(e.target.value)}
          />
        </div>

        <div className="apSystemEditorField apSystemEditorFieldFull">
          <label className="apMediaLabel">Demo Video — Google Drive Link</label>
          <input
            className="apMediaInput"
            placeholder="Paste Google Drive share link (e.g. drive.google.com/file/d/…/view)"
            value={demoVideoUrl}
            onChange={e => setDemoVideo(e.target.value)}
            onBlur={async () => {
              // Auto-save the demo URL on blur — no need to click Save Changes
              const trimmed = demoVideoUrl.trim() || null;
              if (trimmed === (system.demoVideoUrl ?? null)) return; // unchanged — skip
              await updateSystemFields(system.id, { demoVideoUrl: trimmed });
            }}
          />
          <p style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.65rem", color: "rgba(255,255,255,0.25)", margin: "4px 0 0", letterSpacing: "0.04em" }}>
            Accepts any GDrive share link — auto-converted to embed format. Auto-saves when you leave the field.
          </p>
        </div>

      </div>
      {error && <p className="apAddAddonError">{error}</p>}
      <div className="apAddAddonFormActions">
        <button
          className="apPriceSaveBtn"
          onClick={handleSave}
          disabled={saving}
          style={{ background: accent, color: "#0d0d0d" }}
        >
          {saving ? "Saving…" : saved ? "✓ Saved" : "Save Changes"}
        </button>
      </div>
    </div>
  );
}

// ── SystemCard — single accordion card ────────────────────────────────
function SystemCard({ system, isExpanded, onToggleExpand }: {
  system: System; isExpanded: boolean;
  onToggleExpand: () => void;
}) {
  const revealRef = useReveal();
  const [addons, setAddons]         = useState<Addon[]>(system.addons);
  const [localSystem, setLocal]     = useState<System>(system);
  const [editOpen, setEditOpen]     = useState(false);

  // Group addons by category for organized display
  const groupedAddons = addons.reduce<Record<string, Addon[]>>((groups, addon) => {
    const cat = addon.category || "General";
    if (!groups[cat]) groups[cat] = [];
    groups[cat].push(addon);
    return groups;
  }, {});

  function handleAddonPriceUpdated(addonId: string, newPrice: number) {
    setAddons(prev => prev.map(a => a.id === addonId ? { ...a, price: newPrice } : a));
  }

  function handleAddonAdded(newAddon: Addon) {
    setAddons(prev => [...prev, newAddon]);
  }

  // Merges saved fields back into localSystem so header reflects changes immediately.
  function handleFieldsSaved(fields: Partial<System>) {
    setLocal(prev => ({ ...prev, ...fields }));
  }

  return (
    <div className="apSystemCard apReveal" ref={revealRef}>

      {/* ── Header row — click to expand/collapse ── */}
      <div
        className="apSystemHeader"
        onClick={onToggleExpand}
        style={{ borderLeft: `3px solid ${localSystem.accent}` }}
      >
        <div className="apSystemHeaderLeft">
          <span className="apSystemTag" style={{ color: localSystem.accent, borderColor: localSystem.accent }}>
            {localSystem.tag}
          </span>
          <span className="apSystemTitle">{localSystem.title}</span>
          <span className={`apBadge ${localSystem.isActive ? "apBadgeActive" : "apBadgeInactive"}`}>
            {localSystem.isActive ? "Active" : "Inactive"}
          </span>
          {/* Display status badge */}
          {({
            visible:     null,
            coming_soon: <span className="apBadge apBadgeComingSoon">Coming Soon</span>,
            ongoing:     <span className="apBadge apBadgeOngoing">In Dev</span>,
            hidden:      <span className="apBadge apBadgeHidden">Hidden</span>,
          } as Record<string, React.ReactNode>)[localSystem.displayStatus ?? "visible"]}
        </div>
        <div className="apSystemHeaderRight">
          <SystemBasePriceEditor
            systemId={localSystem.id}
            initialPrice={localSystem.basePrice}
            accent={localSystem.accent}
          />
          <span className="apSystemAddonCount">
            {addons.length} add-on{addons.length !== 1 ? "s" : ""}
          </span>
          <svg
            className={`apExpandIcon ${isExpanded ? "apExpandIconOpen" : ""}`}
            width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
          >
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </div>
      </div>

      {/* ── Expanded panel ─────────────────────── */}
      {isExpanded && (
        <div className="apSystemBody">
          <p className="apSystemDesc">{localSystem.description}</p>

          {/* ── Full editor toggle ── */}
          <div className="apSystemEditorToggleWrap">
            <button
              className={`apActionBtn ${editOpen ? "apActionBtnDeactivate" : "apActionBtnActivate"}`}
              style={{ fontSize: "0.72rem" }}
              onClick={e => { e.stopPropagation(); setEditOpen(prev => !prev); }}
            >
              {editOpen ? "▲ Close Editor" : "✎ Edit System"}
            </button>
          </div>

          {/* Full editor — title, description, features, accent, videos, timeline, deploy */}
          {editOpen && (
            <SystemFullEditor
              system={localSystem}
              accent={localSystem.accent}
              onSaved={handleFieldsSaved}
            />
          )}

          {/* Addon groups */}
          {Object.keys(groupedAddons).length === 0 ? (
            <div className="apEmpty apEmptySmall">
              <p className="apEmptyTitle">No addons configured</p>
              <p className="apEmptyHint">Add the first addon below.</p>
            </div>
          ) : (
            Object.entries(groupedAddons).map(([category, categoryAddons]) => (
              <div key={category} className="apAddonGroup">
                <p className="apAddonGroupLabel">{category}</p>
                <div className="apAddonList">
                  {categoryAddons.map(addon => (
                    <div key={addon.id} className="apAddonRow">
                      <span className="apAddonLabel">{addon.label}</span>
                      <AddonPriceEditor
                        addon={addon}
                        accent={localSystem.accent}
                        onUpdated={handleAddonPriceUpdated}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}

          {/* Add new addon */}
          <div className="apAddAddonWrap">
            <AddAddonForm
              systemId={localSystem.id}
              accent={localSystem.accent}
              onAdded={handleAddonAdded}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main export ────────────────────────────────────────────────────────
export default function ProductsClient({ products, systems }: Props) {
  const [productList, setProductList]   = useState<Product[]>(products);
  const [togglingId, setTogglingId]     = useState<string | null>(null);
  const [expandedSystem, setExpandedSystem] = useState<string | null>(null);
  const [driveToast, setDriveToast]     = useState<"connected" | "error" | null>(null);
  const [globalToast, setGlobalToast]   = useState<{ msg: string; type: "ok" | "err" } | null>(null);
  const headerRef                       = useReveal();

  // Show Drive connection result from OAuth callback query params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("drive_connected") === "true") {
      setDriveToast("connected");
      window.history.replaceState({}, "", "/admin/products");
      setTimeout(() => setDriveToast(null), 5000);
    } else if (params.get("drive_error")) {
      setDriveToast("error");
      window.history.replaceState({}, "", "/admin/products");
      setTimeout(() => setDriveToast(null), 6000);
    }
  }, []);

  async function handleToggleActive(id: string, current: boolean) {
    setTogglingId(id);
    const ok = await toggleProductActive(id, current);
    if (ok) {
      setProductList(prev => prev.map(p => p.id === id ? { ...p, isActive: !current } : p));
      const name = productList.find(p => p.id === id)?.name ?? "Product";
      setGlobalToast({ msg: current ? `"${name}" deactivated.` : `"${name}" activated.`, type: "ok" });
      setTimeout(() => setGlobalToast(null), 3000);
    } else {
      setGlobalToast({ msg: "Failed to update product status.", type: "err" });
      setTimeout(() => setGlobalToast(null), 4000);
    }
    setTogglingId(null);
  }

  return (
    <div className="apPage">

      {/* ── Drive connection toast ───────────────── */}
      {driveToast === "connected" && (
        <div className="apDriveToast apDriveToastOk">
          ✓ Google Drive connected — you can now upload to Drive.
        </div>
      )}
      {driveToast === "error" && (
        <div className="apDriveToast apDriveToastErr">
          ✗ Google Drive connection failed — please try reconnecting.
        </div>
      )}

      {/* ── Global action toast (activate / deactivate) ──────────────── */}
      {globalToast && (
        <div style={{
          position: "fixed", bottom: "1.5rem", right: "1.5rem", zIndex: 9999,
          background: globalToast.type === "ok" ? "#22c55e" : "#ef4444",
          color: "#0d0d0d", padding: "0.6rem 1.2rem", borderRadius: "8px",
          fontWeight: 600, fontSize: "0.85rem", boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
        }}>{globalToast.msg}</div>
      )}

      {/* ── Page header ──────────────────────────── */}
      <div className="apPageHeader apReveal" ref={headerRef}>
        <div>
          <span className="apPageEyebrow">Admin</span>
          <h1 className="apPageTitle">Products & Systems</h1>
          <p className="apPageSubtitle">
            {products.length} product{products.length !== 1 ? "s" : ""} &middot; {systems.length} system catalog{systems.length !== 1 ? "s" : ""}
          </p>
        </div>
        <p className="apPageDate">
          {new Date().toLocaleDateString("en-PH", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
        </p>
      </div>

      {/* ── Legacy Products ───────────────────────── */}
      <ProductsSection
        products={productList}
        onToggle={handleToggleActive}
        togglingId={togglingId}
      />

      {/* ── Systems Catalog ───────────────────────── */}
      <div className="apSectionHeader apReveal">
        <span className="apSectionEyebrow">Catalog</span>
        <h2 className="apSectionTitle">Systems</h2>
      </div>

      <div className="apSystemsList">
        {systems.map(sys => (
          <SystemCard
            key={sys.id}
            system={sys}
            isExpanded={expandedSystem === sys.id}
            onToggleExpand={() => setExpandedSystem(prev => prev === sys.id ? null : sys.id)}
          />
        ))}
        {systems.length === 0 && (
          <div className="apEmpty">
            <p className="apEmptyTitle">No systems in catalog</p>
            <p className="apEmptyHint">Run the seed script to populate systems.</p>
          </div>
        )}
      </div>

      {/* ── Page footer — GDrive setup note ──────── */}
      <footer className="apPageFooter">
        <p className="apPageFooterNote">
          <strong>Google Drive uploads</strong> require an authorized redirect URI in your Google Cloud Console.
          Go to{" "}
          <a
            href="https://console.cloud.google.com/apis/credentials"
            target="_blank"
            rel="noreferrer"
            className="apPageFooterLink"
          >
            APIs &amp; Services → Credentials → OAuth 2.0 Client
          </a>
          {" "}and add{" "}
          <code className="apPageFooterCode">
            {typeof window !== "undefined" ? window.location.origin : "https://your-domain.vercel.app"}/api/google/callback
          </code>
          {" "}under <strong>Authorized redirect URIs</strong> before connecting.
        </p>
      </footer>

    </div>
  );
}