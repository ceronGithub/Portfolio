// ProductsClient.tsx — Admin Products & Systems.
// System catalog: fully editable inline — title, price, accent, description,
// timeline, deploy, isActive. Each addon row: label, price, category, delete.
"use client";

import { useState, useMemo } from "react";

// ── Types ─────────────────────────────────────────────────────────────

interface Product {
  id: string; name: string; description: string | null;
  price: number; isActive: boolean; createdAt: Date; fileKey: string | null;
}

interface Addon {
  id: string; addonKey: string; label: string;
  price: number; category: string; description: string | null;
}

interface System {
  id: string; tag: string; title: string; basePrice: number;
  accent: string; timeline: string; deploy: string;
  description: string; isActive: boolean; addons: Addon[];
}

interface Props { products: Product[]; systems: System[]; }

// ── API helpers ───────────────────────────────────────────────────────

async function patchSystem(id: string, data: Record<string, unknown>) {
  const res = await fetch(`/api/admin/systems/${id}`, {
    method: "PATCH", headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.ok;
}

async function patchAddon(systemId: string, addonId: string, data: Record<string, unknown>) {
  const res = await fetch(`/api/admin/systems/${systemId}/addons/${addonId}`, {
    method: "PATCH", headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.ok;
}

async function deleteAddon(systemId: string, addonId: string) {
  const res = await fetch(`/api/admin/systems/${systemId}/addons/${addonId}`, { method: "DELETE" });
  return res.ok;
}

async function toggleProductActive(id: string, current: boolean) {
  const res = await fetch(`/api/admin/products/${id}`, {
    method: "PATCH", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ isActive: !current }),
  });
  return res.ok;
}

// ── Inline editable field ─────────────────────────────────────────────

function EditField({ value, onSave, type = "text", small = false }: {
  value: string | number; onSave: (v: string) => void;
  type?: string; small?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(String(value));

  function commit() {
    setEditing(false);
    if (String(val) !== String(value)) onSave(val);
  }

  if (!editing) return (
    <span
      className={`sysEditField${small ? " sysEditFieldSmall" : ""}`}
      onClick={() => { setVal(String(value)); setEditing(true); }}
      title="Click to edit"
    >
      {value}
      <svg className="sysEditPencil" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
      </svg>
    </span>
  );

  return (
    <span className="sysEditActive">
      <input
        autoFocus
        className={`sysEditInput${small ? " sysEditInputSmall" : ""}`}
        type={type} value={val}
        onChange={e => setVal(e.target.value)}
        onBlur={commit}
        onKeyDown={e => { if (e.key === "Enter") commit(); if (e.key === "Escape") setEditing(false); }}
      />
    </span>
  );
}

// ── System card ───────────────────────────────────────────────────────

function SystemCard({
  system, onUpdate, onAddonUpdate, onAddonDelete,
}: {
  system: System;
  onUpdate: (id: string, data: Record<string, unknown>) => void;
  onAddonUpdate: (systemId: string, addonId: string, data: Record<string, unknown>) => void;
  onAddonDelete: (systemId: string, addonId: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [saving,   setSaving]   = useState(false);

  async function save(data: Record<string, unknown>) {
    setSaving(true);
    const ok = await patchSystem(system.id, data);
    if (ok) onUpdate(system.id, data);
    setSaving(false);
  }

  async function saveAddon(addonId: string, data: Record<string, unknown>) {
    const ok = await patchAddon(system.id, addonId, data);
    if (ok) onAddonUpdate(system.id, addonId, data);
  }

  async function handleDeleteAddon(addonId: string) {
    const ok = await deleteAddon(system.id, addonId);
    if (ok) onAddonDelete(system.id, addonId);
  }

  return (
    <div className={`adminSystemCard${saving ? " adminSystemCardSaving" : ""}`}>

      {/* Header row */}
      <div className="adminSystemCardHeader" style={{ borderLeft: `3px solid ${system.accent}` }}>

        <div className="adminSystemCardHeaderLeft" onClick={() => setExpanded(p => !p)}>
          <span className="adminSystemTag" style={{ color: system.accent, borderColor: system.accent }}>
            {system.tag}
          </span>
          <span className="adminSystemTitle">{system.title}</span>
          <span className={`adminActiveBadge ${system.isActive ? "adminActiveBadgeOn" : "adminActiveBadgeOff"}`}>
            {system.isActive ? "Active" : "Inactive"}
          </span>
        </div>

        <div className="adminSystemCardHeaderRight">
          <span className="adminSystemBasePrice">₱{system.basePrice.toLocaleString()} base</span>
          <span className="adminSystemAddonCount">{system.addons.length} add-ons</span>

          {/* Toggle active */}
          <button
            className={`adminToggleBtn ${system.isActive ? "adminToggleBtnDeactivate" : "adminToggleBtnActivate"}`}
            onClick={() => save({ isActive: !system.isActive })}
          >
            {system.isActive ? "Deactivate" : "Activate"}
          </button>

          <span className="adminSystemExpandIcon" onClick={() => setExpanded(p => !p)}>
            {expanded ? "▲" : "▼"}
          </span>
        </div>
      </div>

      {/* Expanded edit panel */}
      {expanded && (
        <div className="adminSystemAddons">

          {/* System fields */}
          <div className="sysFieldGrid">
            <div className="sysFieldRow">
              <span className="sysFieldLabel">Title</span>
              <EditField value={system.title}
                onSave={v => save({ title: v })} />
            </div>
            <div className="sysFieldRow">
              <span className="sysFieldLabel">Base Price (₱)</span>
              <EditField value={system.basePrice} type="number"
                onSave={v => save({ basePrice: parseInt(v) || 0 })} />
            </div>
            <div className="sysFieldRow">
              <span className="sysFieldLabel">Accent Color</span>
              <div className="sysAccentRow">
                <input type="color" className="sysColorPicker"
                  value={system.accent}
                  onChange={e => save({ accent: e.target.value })} />
                <span className="sysAccentHex">{system.accent}</span>
              </div>
            </div>
            <div className="sysFieldRow">
              <span className="sysFieldLabel">Timeline</span>
              <EditField value={system.timeline}
                onSave={v => save({ timeline: v })} />
            </div>
            <div className="sysFieldRow">
              <span className="sysFieldLabel">Deploy</span>
              <EditField value={system.deploy}
                onSave={v => save({ deploy: v })} />
            </div>
            <div className="sysFieldRow sysFieldRowFull">
              <span className="sysFieldLabel">Description</span>
              <EditField value={system.description}
                onSave={v => save({ description: v })} />
            </div>
          </div>

          {/* Addons */}
          <div className="sysAddonsHeader">
            <span className="sysAddonsTitle">Add-ons ({system.addons.length})</span>
          </div>
          <div className="adminAddonsScrollWrap">
            <div className="adminAddonsGrid">
              {/* Column headers */}
              <div className="adminAddonRow adminAddonRowHead">
                <span>Category</span>
                <span>Label</span>
                <span>Price (₱)</span>
                <span></span>
              </div>
              {system.addons.map(addon => (
                <div key={addon.id} className="adminAddonRow adminAddonRowEdit">
                  <EditField value={addon.category} small
                    onSave={v => saveAddon(addon.id, { category: v })} />
                  <EditField value={addon.label} small
                    onSave={v => saveAddon(addon.id, { label: v })} />
                  <EditField value={addon.price} type="number" small
                    onSave={v => saveAddon(addon.id, { price: parseInt(v) || 0 })} />
                  <button className="sysAddonDeleteBtn"
                    onClick={() => handleDeleteAddon(addon.id)}
                    title="Delete addon">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </button>
                </div>
              ))}
              {system.addons.length === 0 && <p className="adminEmptyNote">No add-ons.</p>}
            </div>
          </div>

        </div>
      )}
    </div>
  );
}

// ── Category filter ───────────────────────────────────────────────────

function CategoryFilter({ categories, active, onChange }: {
  categories: string[]; active: string; onChange: (c: string) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="prdCatFilterWrap">
      <button className="prdCatFilterBtn" onClick={() => setOpen(o => !o)}>
        {active === "" ? "All categories" : active}
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {open && (
        <div className="prdCatDropdown">
          <button className={`prdCatOption${active === "" ? " prdCatOptionActive" : ""}`}
            onClick={() => { onChange(""); setOpen(false); }}>All categories</button>
          {categories.map(c => (
            <button key={c}
              className={`prdCatOption${active === c ? " prdCatOptionActive" : ""}`}
              onClick={() => { onChange(c); setOpen(false); }}>{c}</button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────

export default function ProductsClient({ products, systems: initialSystems }: Props) {
  const [productList,  setProductList]  = useState<Product[]>(products);
  const [systemList,   setSystemList]   = useState<System[]>(initialSystems);
  const [togglingId,   setTogglingId]   = useState<string | null>(null);
  const [search,       setSearch]       = useState("");
  const [catFilter,    setCatFilter]    = useState("");

  function getCategory(p: Product): string {
    if (p.fileKey) return p.fileKey.split(".").pop()?.toUpperCase() ?? "File";
    return "Digital";
  }

  const categories = useMemo(() => {
    const cats = new Set<string>();
    productList.forEach(p => cats.add(getCategory(p)));
    return Array.from(cats).sort();
  }, [productList]);

  const filteredProducts = useMemo(() => {
    const q = search.toLowerCase();
    return productList.filter(p => {
      const matchSearch = p.name.toLowerCase().includes(q) || (p.description ?? "").toLowerCase().includes(q);
      const matchCat    = catFilter === "" || getCategory(p) === catFilter;
      return matchSearch && matchCat;
    });
  }, [productList, search, catFilter]);

  async function handleToggle(id: string, current: boolean) {
    setTogglingId(id);
    const ok = await toggleProductActive(id, current);
    if (ok) setProductList(prev => prev.map(p => p.id === id ? { ...p, isActive: !current } : p));
    setTogglingId(null);
  }

  function handleSystemUpdate(id: string, data: Record<string, unknown>) {
    setSystemList(prev => prev.map(s => s.id === id ? { ...s, ...data } : s));
  }

  function handleAddonUpdate(systemId: string, addonId: string, data: Record<string, unknown>) {
    setSystemList(prev => prev.map(s => s.id !== systemId ? s : {
      ...s,
      addons: s.addons.map(a => a.id === addonId ? { ...a, ...data } : a),
    }));
  }

  function handleAddonDelete(systemId: string, addonId: string) {
    setSystemList(prev => prev.map(s => s.id !== systemId ? s : {
      ...s,
      addons: s.addons.filter(a => a.id !== addonId),
    }));
  }

  return (
    <div className="adminProductsContent">

      {/* ── AI-Asset Products ──────────────────────────────────────── */}
      <section className="adminProductsSection">
        <div className="prdSectionHeader">
          <h2 className="adminProductsSectionTitle">AI-Asset Products</h2>
          <div className="prdSectionControls">
            <CategoryFilter categories={categories} active={catFilter} onChange={setCatFilter} />
            <div className="prdSearchWrap">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input className="prdSearchInput" type="text" placeholder="Search products..."
                value={search} onChange={e => setSearch(e.target.value)} />
              {search && <button className="prdSearchClear" onClick={() => setSearch("")}>✕</button>}
            </div>
          </div>
        </div>

        <div className="adminProductsTableWrap">
          <div className="adminProductsTableHeader adminProductsTableHeaderAsset">
            <span>Name</span><span>Category</span><span>Description</span>
            <span>Price</span><span>Status</span><span>Created</span><span>Toggle</span>
          </div>
          {filteredProducts.length === 0 && (
            <p className="adminEmptyNote">{search || catFilter ? "No products match." : "No products found."}</p>
          )}
          {filteredProducts.map(p => (
            <div key={p.id} className="adminProductsTableRow adminProductsTableRowAsset">
              <span className="adminProductsCell adminProductsCellName">{p.name}</span>
              <span className="adminProductsCell"><span className="prdCatBadge">{getCategory(p)}</span></span>
              <span className="adminProductsCell adminProductsCellMuted">{p.description ?? <span className="adminCellEmpty">—</span>}</span>
              <span className="adminProductsCell adminProductsCellMono">₱{(p.price / 100).toLocaleString()}</span>
              <span className="adminProductsCell">
                <span className={`adminActiveBadge ${p.isActive ? "adminActiveBadgeOn" : "adminActiveBadgeOff"}`}>
                  {p.isActive ? "Active" : "Inactive"}
                </span>
              </span>
              <span className="adminProductsCell adminProductsCellMuted">
                {new Date(p.createdAt).toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" })}
              </span>
              <span className="adminProductsCell">
                <button
                  className={`adminToggleBtn ${p.isActive ? "adminToggleBtnDeactivate" : "adminToggleBtnActivate"}`}
                  onClick={() => handleToggle(p.id, p.isActive)} disabled={togglingId === p.id}>
                  {togglingId === p.id ? "..." : p.isActive ? "Deactivate" : "Activate"}
                </button>
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Systems Catalog ────────────────────────────────────────── */}
      <section className="adminProductsSection">
        <h2 className="adminProductsSectionTitle">Systems Catalog</h2>
        <div className="adminSystemsList">
          {systemList.map(system => (
            <SystemCard
              key={system.id}
              system={system}
              onUpdate={handleSystemUpdate}
              onAddonUpdate={handleAddonUpdate}
              onAddonDelete={handleAddonDelete}
            />
          ))}
        </div>
      </section>

    </div>
  );
}