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
  price: number; isActive: boolean; isLatest: boolean;
  category: string;
  previewVideoUrl: string | null; facePngUrl: string | null;
  threeDUrl: string | null; actionOneUrl: string | null;
  actionTwoUrl: string | null; actionThreeUrl: string | null;
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

// Creates a new product record.
async function createProduct(data: {
  name: string; price: number; category: string;
  description?: string; isLatest?: boolean;
  previewVideoUrl?: string; facePngUrl?: string; threeDUrl?: string;
  actionOneUrl?: string; actionTwoUrl?: string; actionThreeUrl?: string;
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

// ── MEDIA_FIELDS — ordered list of editable media URL fields per product ──
// Used by MediaEditor to render one inline editor row per field.
const MEDIA_FIELDS: { field: string; label: string }[] = [
  { field: "previewVideoUrl", label: "Preview Video URL" },
  { field: "facePngUrl",      label: "Face PNG URL"       },
  { field: "threeDUrl",       label: "3D Model URL"       },
  { field: "actionOneUrl",    label: "Action 1 URL"       },
  { field: "actionTwoUrl",    label: "Action 2 URL"       },
  { field: "actionThreeUrl",  label: "Action 3 URL"       },
];

// ── MediaEditor — inline URL editor for all media fields of one product ──
// Rendered inside an expandable row. Each field shows a text input with
// Save / Clear buttons that PATCH only the changed field immediately.
function MediaEditor({ product, onFieldSaved }: {
  product: Product;
  onFieldSaved: (id: string, field: string, value: string | null) => void;
}) {
  const initialDrafts = Object.fromEntries(
    MEDIA_FIELDS.map(({ field }) => [field, (product[field as keyof Product] as string | null) ?? ""])
  );
  const [drafts, setDrafts]   = useState<Record<string, string>>(initialDrafts);
  const [saving, setSaving]   = useState<Record<string, boolean>>({});
  const [saved, setSaved]     = useState<Record<string, boolean>>({});

  async function handleSaveField(field: string) {
    const value = drafts[field].trim() || null;
    setSaving(prev => ({ ...prev, [field]: true }));
    const ok = await patchProductMedia(product.id, field, value);
    if (ok) {
      onFieldSaved(product.id, field, value);
      setSaved(prev => ({ ...prev, [field]: true }));
      setTimeout(() => setSaved(prev => ({ ...prev, [field]: false })), 2200);
    }
    setSaving(prev => ({ ...prev, [field]: false }));
  }

  return (
    <div className="apMediaEditor">
      {MEDIA_FIELDS.map(({ field, label }) => (
        <div key={field} className="apMediaRow">
          <span className="apMediaLabel">{label}</span>
          <input
            className="apMediaInput"
            type="text"
            placeholder="Paste URL or leave empty to clear"
            value={drafts[field]}
            onChange={e => setDrafts(prev => ({ ...prev, [field]: e.target.value }))}
            onKeyDown={e => { if (e.key === "Enter") handleSaveField(field); }}
          />
          <button
            className="apPriceSaveBtn"
            onClick={() => handleSaveField(field)}
            disabled={saving[field]}
          >
            {saving[field] ? "…" : saved[field] ? "✓" : "Save"}
          </button>
          <button
            className="apPriceCancelBtn"
            onClick={() => { setDrafts(prev => ({ ...prev, [field]: "" })); handleSaveField(field); }}
            title="Clear this URL"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}

// ── AddProductForm — create a new product from the Admin UI ───────────────
// Shown when the admin clicks "Add New Product" at the top of the table.
// On success, the new product is prepended to the list in local state.

// ── FileUploadField — pick a file, choose R2/GDrive/Both, get URL back ───
// destination: r2 → returns public CDN URL
//              gdrive → returns Drive file ID (usable with /api/drive-video)
//              both → returns both
function FileUploadField({
  label,
  accept,
  defaultDestination = "r2",
  driveFolderIdRef,
  onUploaded,
}: {
  label:               string;
  accept?:             string;
  defaultDestination?: "r2" | "gdrive" | "both";
  driveFolderIdRef:    React.RefObject<string>;
  onUploaded:          (result: { r2Url?: string; driveId?: string; driveUrl?: string }) => void;
}) {
  const [destination, setDestination] = useState<"r2" | "gdrive" | "both">(defaultDestination);
  const [uploading,   setUploading]   = useState(false);
  const [done,        setDone]        = useState(false);
  const [err,         setErr]         = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setDone(false);
    setErr("");

    const form = new FormData();
    form.append("file",        file);
    form.append("destination", destination);
    form.append("r2Folder",    "products");
    if ((destination === "gdrive" || destination === "both") && driveFolderIdRef.current) {
      form.append("driveFolderId", driveFolderIdRef.current);
    }

    try {
      const res  = await fetch("/api/admin/product-upload", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setErr(data.errors?.join("; ") || data.error || "Upload failed");
      } else {
        setDone(true);
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
          {/* Destination selector */}
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
          {/* Hidden file input */}
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            style={{ display: "none" }}
            onChange={handleFile}
          />
          {/* Pick button */}
          <button
            type="button"
            className={"apFilePickBtn" + (done ? " apFilePickBtnDone" : "")}
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? "Uploading…" : done ? "✓ Uploaded" : "Pick File"}
          </button>
        </div>
      </div>
      {err && <p className="apFileUploadErr">{err}</p>}
    </div>
  );
}
function AddProductForm({ onProductCreated, onClose }: {
  onProductCreated: (product: Product) => void;
  onClose: () => void;
}) {
  const [name, setName]               = useState("");
  const [price, setPrice]             = useState("");
  const [category, setCategory]       = useState("character");
  const [description, setDescription] = useState("");
  const [isLatest, setIsLatest]       = useState(false);
  const [previewVideoUrl, setPreviewVideoUrl] = useState("");
  const [facePngUrl, setFacePngUrl]           = useState("");
  const [threeDUrl, setThreeDUrl]             = useState("");
  const [actionOneUrl, setActionOneUrl]       = useState("");
  const [actionTwoUrl, setActionTwoUrl]       = useState("");
  const [actionThreeUrl, setActionThreeUrl]   = useState("");
  const [driveFolderId, setDriveFolderId]     = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState("");

  // Ref so FileUploadField always sees latest driveFolderId without re-mount
  const driveFolderIdRef = useRef<string>("");
  driveFolderIdRef.current = driveFolderId;

  async function handleCreate() {
    if (!name.trim()) { setError("Name is required."); return; }
    const parsedPrice = parseInt(price.replace(/,/g, ""), 10);
    if (isNaN(parsedPrice) || parsedPrice < 0) { setError("Enter a valid price (₱)."); return; }
    setSaving(true);
    setError("");
    const product = await createProduct({
      name: name.trim(),
      price: parsedPrice,
      category,
      description: description.trim() || undefined,
      isLatest,
      previewVideoUrl: previewVideoUrl.trim() || undefined,
      facePngUrl:      facePngUrl.trim()      || undefined,
      threeDUrl:       threeDUrl.trim()        || undefined,
      actionOneUrl:    actionOneUrl.trim()    || undefined,
      actionTwoUrl:    actionTwoUrl.trim()    || undefined,
      actionThreeUrl:  actionThreeUrl.trim()  || undefined,
    });
    if (product) {
      onProductCreated(product);
      onClose();
    } else {
      setError("Failed to create product. Try again.");
    }
    setSaving(false);
  }

  return (
    <div className="apAddProductForm">
      <p className="apAddAddonFormTitle">New Product</p>
      <div className="apAddProductGrid">
        <div className="apAddProductField apAddProductFieldFull">
          <label className="apMediaLabel">Name *</label>
          <input className="apMediaInput" placeholder="e.g. Orc 12 — Berserker" value={name} onChange={e => setName(e.target.value)} />
        </div>
        <div className="apAddProductField">
          <label className="apMediaLabel">Price (₱) *</label>
          <input className="apMediaInput" type="number" min="0" placeholder="5500" value={price} onChange={e => setPrice(e.target.value)} />
        </div>
        <div className="apAddProductField">
          <label className="apMediaLabel">Category *</label>
          <select className="apMediaInput apMediaSelect" value={category} onChange={e => setCategory(e.target.value)}>
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

        {/* ── GDrive folder ID — needed for any GDrive/Both uploads ── */}
        <div className="apAddProductField apAddProductFieldFull">
          <label className="apMediaLabel">Google Drive Folder ID <span style={{ opacity: 0.4, fontSize: "0.7rem" }}>(required for GDrive uploads)</span></label>
          <input className="apMediaInput" placeholder="e.g. 1ApEQgnNAza_uRL9NRR…" value={driveFolderId} onChange={e => setDriveFolderId(e.target.value)} />
        </div>

        {/* ── Preview Video ── */}
        <div className="apAddProductField apAddProductFieldFull">
          <FileUploadField
            label="Preview Video"
            accept="video/*"
            defaultDestination="r2"
            driveFolderIdRef={driveFolderIdRef}
            onUploaded={r => { if (r.r2Url) setPreviewVideoUrl(r.r2Url); else if (r.driveId) setPreviewVideoUrl(`/api/drive-video?id=${r.driveId}`); }}
          />
          <input className="apMediaInput apFileManualInput" placeholder="or paste URL manually…" value={previewVideoUrl} onChange={e => setPreviewVideoUrl(e.target.value)} />
        </div>

        {/* ── Face PNG ── */}
        <div className="apAddProductField">
          <FileUploadField
            label="Face PNG"
            accept="image/*"
            defaultDestination="r2"
            driveFolderIdRef={driveFolderIdRef}
            onUploaded={r => { if (r.r2Url) setFacePngUrl(r.r2Url); else if (r.driveUrl) setFacePngUrl(r.driveUrl); }}
          />
          <input className="apMediaInput apFileManualInput" placeholder="or paste URL manually…" value={facePngUrl} onChange={e => setFacePngUrl(e.target.value)} />
        </div>

        {/* ── 3D Model ── */}
        <div className="apAddProductField">
          <FileUploadField
            label="3D Model (OBJ/FBX/GLB)"
            accept=".obj,.fbx,.glb,.gltf"
            defaultDestination="gdrive"
            driveFolderIdRef={driveFolderIdRef}
            onUploaded={r => { if (r.driveId) setThreeDUrl(r.driveId); else if (r.r2Url) setThreeDUrl(r.r2Url); }}
          />
          <input className="apMediaInput apFileManualInput" placeholder="or paste Drive ID / URL…" value={threeDUrl} onChange={e => setThreeDUrl(e.target.value)} />
        </div>

        {/* ── Action Videos ── */}
        <div className="apAddProductField">
          <FileUploadField
            label="Action 1 Video"
            accept="video/*"
            defaultDestination="r2"
            driveFolderIdRef={driveFolderIdRef}
            onUploaded={r => { if (r.r2Url) setActionOneUrl(r.r2Url); else if (r.driveId) setActionOneUrl(`/api/drive-video?id=${r.driveId}`); }}
          />
          <input className="apMediaInput apFileManualInput" placeholder="or paste URL manually…" value={actionOneUrl} onChange={e => setActionOneUrl(e.target.value)} />
        </div>
        <div className="apAddProductField">
          <FileUploadField
            label="Action 2 Video"
            accept="video/*"
            defaultDestination="r2"
            driveFolderIdRef={driveFolderIdRef}
            onUploaded={r => { if (r.r2Url) setActionTwoUrl(r.r2Url); else if (r.driveId) setActionTwoUrl(`/api/drive-video?id=${r.driveId}`); }}
          />
          <input className="apMediaInput apFileManualInput" placeholder="or paste URL manually…" value={actionTwoUrl} onChange={e => setActionTwoUrl(e.target.value)} />
        </div>
        <div className="apAddProductField apAddProductFieldFull">
          <FileUploadField
            label="Action 3 Video"
            accept="video/*"
            defaultDestination="r2"
            driveFolderIdRef={driveFolderIdRef}
            onUploaded={r => { if (r.r2Url) setActionThreeUrl(r.r2Url); else if (r.driveId) setActionThreeUrl(`/api/drive-video?id=${r.driveId}`); }}
          />
          <input className="apMediaInput apFileManualInput" placeholder="or paste URL manually…" value={actionThreeUrl} onChange={e => setActionThreeUrl(e.target.value)} />
        </div>
        <div className="apAddProductField apAddProductFieldFull apAddProductLatestToggle">
          <label className="apLatestToggleLabel">
            <input type="checkbox" checked={isLatest} onChange={e => setIsLatest(e.target.checked)} />
            Mark as Latest Drop
          </label>
        </div>
      </div>
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

  function showToast(msg: string, type: "ok"|"err") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  }

  function handleFieldSaved(productId: string, field: string, value: string | null) {
    setProductList(prev => prev.map(p =>
      p.id === productId ? { ...p, [field]: value } : p
    ));
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
  }

  return (
    <div className="apCard apReveal" ref={revealRef}>
      {toast && (
        <div style={{
          position:"fixed",bottom:"1.5rem",right:"1.5rem",zIndex:9999,
          background:toast.type==="ok"?"#22c55e":"#ef4444",
          color:"#fff",padding:"0.75rem 1.25rem",borderRadius:"10px",
          fontWeight:700,fontSize:"0.85rem",
          boxShadow:"0 4px 24px rgba(0,0,0,0.4)",pointerEvents:"none",
        }}>{toast.msg}</div>
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
        <div className="apTableHead apGrid--productsV2">
          <span>Name</span><span>Category</span><span>Price</span>
          <span>Latest</span><span>Actions</span>
        </div>
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
        {productList.map(p => (
          <div key={p.id}>
            <div className="apTableRow apGrid--productsV2">
              <span className="apCell apCellName">{p.name}</span>
              <span className="apCell apCellMuted" style={{ textTransform: "capitalize" }}>{p.category}</span>
              <span className="apCell apCellMono">₱{p.price.toLocaleString()}</span>
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
  const [bgVideoUrl, setBgVideo]    = useState(system.bgVideoUrl ?? "");
  const [demoVideoUrl, setDemoVideo]= useState(system.demoVideoUrl ?? "");
  const [saving, setSaving]         = useState(false);
  const [saved, setSaved]           = useState(false);
  const [error, setError]           = useState("");

  async function handleSave() {
    if (!title.trim()) { setError("Title is required."); return; }
    setSaving(true);
    setError("");
    const featuresList = features.split("\n").map(f => f.trim()).filter(Boolean);
    const ok = await updateSystemFields(system.id, {
      title:        title.trim(),
      description:  description.trim(),
      accent:       accentVal.trim(),
      timeline:     timeline.trim(),
      deploy:       deploy.trim(),
      features:     featuresList,
      bgVideoUrl:   bgVideoUrl.trim() || null,
      demoVideoUrl: demoVideoUrl.trim() || null,
    });
    if (ok) {
      onSaved({
        title:        title.trim(),
        description:  description.trim(),
        accent:       accentVal.trim(),
        timeline:     timeline.trim(),
        deploy:       deploy.trim(),
        features:     featuresList,
        bgVideoUrl:   bgVideoUrl.trim() || null,
        demoVideoUrl: demoVideoUrl.trim() || null,
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
  const headerRef                       = useReveal();

  async function handleToggleActive(id: string, current: boolean) {
    setTogglingId(id);
    const ok = await toggleProductActive(id, current);
    if (ok) setProductList(prev => prev.map(p => p.id === id ? { ...p, isActive: !current } : p));
    setTogglingId(null);
  }

  return (
    <div className="apPage">

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

    </div>
  );
}