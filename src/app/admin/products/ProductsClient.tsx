// ProductsClient.tsx — Admin Products & Systems page.
// T2: System catalog cards have scrollable addons (max-height).
// T3: "Legacy Products" → "AI-Asset Products" with search bar + Category column.
// T4: Category column has filter dropdown.
"use client";

import { useState, useMemo } from "react";

interface Product {
  id:          string;
  name:        string;
  description: string | null;
  price:       number;
  isActive:    boolean;
  createdAt:   Date;
  fileKey:     string | null;
}

interface Addon {
  id:          string;
  addonKey:    string;
  label:       string;
  price:       number;
  category:    string;
  description: string | null;
}

interface System {
  id:          string;
  tag:         string;
  title:       string;
  basePrice:   number;
  accent:      string;
  timeline:    string;
  deploy:      string;
  description: string;
  isActive:    boolean;
  addons:      Addon[];
}

interface Props {
  products: Product[];
  systems:  System[];
}

async function toggleProductActive(id: string, current: boolean): Promise<boolean> {
  const res = await fetch(`/api/admin/products/${id}`, {
    method:  "PATCH",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ isActive: !current }),
  });
  return res.ok;
}

// ── Category filter pill ──────────────────────────────────────────────
function CategoryFilter({
  categories, active, onChange,
}: {
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
            onClick={() => { onChange(""); setOpen(false); }}>
            All categories
          </button>
          {categories.map(c => (
            <button key={c}
              className={`prdCatOption${active === c ? " prdCatOptionActive" : ""}`}
              onClick={() => { onChange(c); setOpen(false); }}>
              {c}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────
export default function ProductsClient({ products, systems }: Props) {
  const [productList, setProductList] = useState<Product[]>(products);
  const [togglingId,  setTogglingId]  = useState<string | null>(null);
  const [expandedSystem, setExpanded] = useState<string | null>(null);

  // T3: Search + T4: Category filter
  const [search,   setSearch]   = useState("");
  const [catFilter, setCatFilter] = useState("");

  // Derive unique categories from products (using first word of name as proxy,
  // or fileKey extension as category — adapt to your real category field if added)
  const categories = useMemo(() => {
    const cats = new Set<string>();
    productList.forEach(p => {
      // Use fileKey extension as category if present, else "Digital"
      if (p.fileKey) {
        const ext = p.fileKey.split(".").pop()?.toUpperCase() ?? "File";
        cats.add(ext);
      } else {
        cats.add("Digital");
      }
    });
    return Array.from(cats).sort();
  }, [productList]);

  function getCategory(p: Product): string {
    if (p.fileKey) return p.fileKey.split(".").pop()?.toUpperCase() ?? "File";
    return "Digital";
  }

  const filteredProducts = useMemo(() => {
    const q = search.toLowerCase();
    return productList.filter(p => {
      const matchSearch = p.name.toLowerCase().includes(q) ||
        (p.description ?? "").toLowerCase().includes(q);
      const matchCat = catFilter === "" || getCategory(p) === catFilter;
      return matchSearch && matchCat;
    });
  }, [productList, search, catFilter]);

  async function handleToggle(id: string, current: boolean) {
    setTogglingId(id);
    const ok = await toggleProductActive(id, current);
    if (ok) setProductList(prev => prev.map(p => p.id === id ? { ...p, isActive: !current } : p));
    setTogglingId(null);
  }

  return (
    <div className="adminProductsContent">

      {/* ── AI-Asset Products (T3: renamed + search + category) ──── */}
      <section className="adminProductsSection">
        <div className="prdSectionHeader">
          <h2 className="adminProductsSectionTitle">AI-Asset Products</h2>
          <div className="prdSectionControls">

            {/* T4: Category filter */}
            <CategoryFilter
              categories={categories}
              active={catFilter}
              onChange={setCatFilter}
            />

            {/* T3: Search bar */}
            <div className="prdSearchWrap">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                className="prdSearchInput"
                type="text"
                placeholder="Search products..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              {search && (
                <button className="prdSearchClear" onClick={() => setSearch("")}>✕</button>
              )}
            </div>
          </div>
        </div>

        <div className="adminProductsTableWrap">
          <div className="adminProductsTableHeader adminProductsTableHeaderAsset">
            <span>Name</span>
            <span>Category</span>
            <span>Description</span>
            <span>Price</span>
            <span>Status</span>
            <span>Created</span>
            <span>Toggle</span>
          </div>

          {filteredProducts.length === 0 && (
            <p className="adminEmptyNote">
              {search || catFilter ? "No products match your search." : "No products found."}
            </p>
          )}

          {filteredProducts.map(p => (
            <div key={p.id} className="adminProductsTableRow adminProductsTableRowAsset">
              <span className="adminProductsCell adminProductsCellName">{p.name}</span>
              <span className="adminProductsCell">
                <span className="prdCatBadge">{getCategory(p)}</span>
              </span>
              <span className="adminProductsCell adminProductsCellMuted">
                {p.description ?? <span className="adminCellEmpty">—</span>}
              </span>
              <span className="adminProductsCell adminProductsCellMono">
                &#8369;{(p.price / 100).toLocaleString()}
              </span>
              <span className="adminProductsCell">
                <span className={`adminActiveBadge ${p.isActive ? "adminActiveBadgeOn" : "adminActiveBadgeOff"}`}>
                  {p.isActive ? "Active" : "Inactive"}
                </span>
              </span>
              <span className="adminProductsCell adminProductsCellMuted">
                {new Date(p.createdAt).toLocaleDateString("en-PH", {
                  year: "numeric", month: "short", day: "numeric",
                })}
              </span>
              <span className="adminProductsCell">
                <button
                  className={`adminToggleBtn ${p.isActive ? "adminToggleBtnDeactivate" : "adminToggleBtnActivate"}`}
                  onClick={() => handleToggle(p.id, p.isActive)}
                  disabled={togglingId === p.id}
                >
                  {togglingId === p.id ? "..." : p.isActive ? "Deactivate" : "Activate"}
                </button>
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Systems Catalog (T2: scrollable addons) ──────────────── */}
      <section className="adminProductsSection">
        <h2 className="adminProductsSectionTitle">Systems Catalog</h2>
        <div className="adminSystemsList">
          {systems.map(system => (
            <div key={system.id} className="adminSystemCard">

              <div
                className="adminSystemCardHeader"
                onClick={() => setExpanded(prev => prev === system.id ? null : system.id)}
                style={{ borderLeft: `3px solid ${system.accent}` }}
              >
                <div className="adminSystemCardHeaderLeft">
                  <span className="adminSystemTag"
                    style={{ color: system.accent, borderColor: system.accent }}>
                    {system.tag}
                  </span>
                  <span className="adminSystemTitle">{system.title}</span>
                  <span className={`adminActiveBadge ${system.isActive ? "adminActiveBadgeOn" : "adminActiveBadgeOff"}`}>
                    {system.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
                <div className="adminSystemCardHeaderRight">
                  <span className="adminSystemBasePrice">
                    &#8369;{system.basePrice.toLocaleString()} base
                  </span>
                  <span className="adminSystemAddonCount">
                    {system.addons.length} add-on{system.addons.length !== 1 ? "s" : ""}
                  </span>
                  <span className="adminSystemExpandIcon">
                    {expandedSystem === system.id ? "▲" : "▼"}
                  </span>
                </div>
              </div>

              {/* T2: Scrollable addons panel */}
              {expandedSystem === system.id && (
                <div className="adminSystemAddons">
                  <p className="adminSystemDesc">{system.description}</p>
                  {/* T2: Scrollable container */}
                  <div className="adminAddonsScrollWrap">
                    <div className="adminAddonsGrid">
                      {system.addons.map(addon => (
                        <div key={addon.id} className="adminAddonRow">
                          <span className="adminAddonCategory">{addon.category}</span>
                          <span className="adminAddonLabel">{addon.label}</span>
                          <span className="adminAddonPrice">+&#8369;{addon.price.toLocaleString()}</span>
                        </div>
                      ))}
                      {system.addons.length === 0 && (
                        <p className="adminEmptyNote">No add-ons configured.</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

            </div>
          ))}
        </div>
      </section>

    </div>
  );
}