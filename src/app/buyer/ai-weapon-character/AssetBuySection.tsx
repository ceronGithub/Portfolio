// AssetBuySection — Character / Weapon buying section.
// Task 1: Per-asset pack tier selection (Mesh Only / Standard / Full Pack).
//         Each item in the cart stores its own chosen tier + price.
// Task 2: Unselecting an asset instantly removes it from Asset Details card.

"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { sanitize }    from "@/lib/utils";
import { useToast }    from "../shared/useToast";
import ToastStack      from "../shared/ToastStack";
import "./asset-buy-section.css";

// ── Types ───────────────────────────────────────────────────────────────────

type PackTier = "mesh_only" | "standard" | "full_pack";

interface AssetItem {
  id:          string;
  label:       string;
  category:    "Character" | "Weapon";
  videoSrc:    string;
  // Base prices per tier (set by admin, fallback to computed)
  priceMesh:    number;
  priceStandard:number;
  priceFull:    number;
  enabledTiers: PackTier[]; // tiers admin has enabled for sale
  hasObj:       boolean;
  hasFbx:       boolean;
  hasGlb:       boolean;
  animCount:    number;
  animNames:    string[];
}

// A cart entry = asset + buyer's chosen tier
interface CartEntry {
  asset:       AssetItem;
  tier:        PackTier;
  price:       number;
}

interface Props {
  ownedAssetIds?:       Set<string>;
  onAddToWishlist?:     (id: string) => void;
  wishlistIds?:         Set<string>;
  onAddToCart?:         (ids: string[]) => void;
  onRegisterAddToCart?: (fn: (ids: string[]) => void) => void;
  onTrackView?:         (item: { id: string; label: string; category: string; price: number }) => void;
  openToId?:            string | null;
  onOpenToIdConsumed?:  () => void;
}

// ── Constants ───────────────────────────────────────────────────────────────

const TIER_LABEL: Record<PackTier, string> = {
  mesh_only: "Mesh Only",
  standard:  "Standard Pack",
  full_pack: "Full Pack",
};

const TIER_CLS: Record<PackTier, string> = {
  mesh_only: "pkgMesh",
  standard:  "pkgStandard",
  full_pack: "pkgFull",
};

const TIER_ORDER: PackTier[] = ["mesh_only", "standard", "full_pack"];

const TIER_INCLUDES: Record<PackTier, string[]> = {
  mesh_only: ["OBJ mesh", "FBX (no rig)", "4K PBR textures"],
  standard:  ["OBJ + FBX rigged", "4K PBR textures", "Idle · Walk · Attack 1"],
  full_pack: ["OBJ + FBX + GLB", "4K PBR textures", "7+ animations", "Web / AR ready GLB", "Face PNG"],
};

// Weapon tier descriptions — based on file formats, not animations
const WEAPON_TIER_INCLUDES: Record<PackTier, string[]> = {
  mesh_only: ["OBJ file only", "4K PBR textures", "Game-ready topology"],
  standard:  ["OBJ + FBX files", "4K PBR textures", "Unity & Unreal ready"],
  full_pack: ["OBJ + FBX + GLB", "4K PBR textures", "Unity · Unreal · Blender · Web / AR ready"],
};

// Returns the correct tier includes based on asset category
function getTierIncludes(category: string): Record<PackTier, string[]> {
  return category === "Weapon" ? WEAPON_TIER_INCLUDES : TIER_INCLUDES;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function getBundleDiscount(count: number): number {
  if (count >= 5) return 0.15;
  if (count >= 3) return 0.10;
  if (count >= 2) return 0.05;
  return 0;
}
function discountLabel(count: number): string {
  if (count >= 5) return "15% off";
  if (count >= 3) return "10% off";
  if (count >= 2) return "5% off";
  return "";
}
function fmt(p: number): string {
  return "₱" + p.toLocaleString("en-PH", { minimumFractionDigits: 0 });
}

// Derive tier price from base product price + tier multiplier
function computeTierPrice(asset: AssetItem, tier: PackTier): number {
  if (tier === "mesh_only")  return asset.priceMesh;
  if (tier === "standard")   return asset.priceStandard;
  return asset.priceFull;
}

function getTierInfo(price: number): { label: string; cls: string } {
  if (price <= 999)  return { label: "Entry",     cls: "tierEntry" };
  if (price <= 1599) return { label: "Mid",        cls: "tierMid" };
  if (price <= 2499) return { label: "Premium",    cls: "tierPremium" };
  return               { label: "Legendary",  cls: "tierLegendary" };
}

export default function AssetBuySection({
  ownedAssetIds = new Set(),
  onAddToWishlist,
  wishlistIds = new Set(),
  onAddToCart,
  onRegisterAddToCart,
  onTrackView,
  openToId,
  onOpenToIdConsumed,
}: Props) {
  const [browseOpen,    setBrowseOpen]    = useState(false);
  const [browseTab,     setBrowseTab]     = useState<"Character" | "Weapon">("Character");
  const [browseSearch,  setBrowseSearch]  = useState("");
  const [browseSort,    setBrowseSort]    = useState<"default" | "price-asc" | "price-desc" | "name">("default");
  const [priceMin,      setPriceMin]      = useState<number | null>(null);
  const [priceMax,      setPriceMax]      = useState<number | null>(null);
  const [tierFilter,    setTierFilter]    = useState<string | null>(null);

  // Task 1: cart is now Map<assetId, CartEntry> — each entry has its own tier
  const [cart,          setCart]          = useState<Map<string, CartEntry>>(new Map());

  // Tier picker state — which asset's tier picker is open in browse modal
  const [tierPickerId,  setTierPickerId]  = useState<string | null>(null);

  const [cycleIndex,    setCycleIndex]    = useState(0);
  const [animIndex,     setAnimIndex]     = useState(0);  // which anim clip to preview
  const { toasts, showToast, dismissToast } = useToast();

  const [characterAssets, setCharacterAssets] = useState<AssetItem[]>([]);
  const [weaponAssets,    setWeaponAssets]    = useState<AssetItem[]>([]);
  const [assetsLoading,   setAssetsLoading]   = useState(false);

  // Task 2: selectedAsset — only shows in card if still in cart
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);

  const videoCardRef = useRef<HTMLVideoElement>(null);
  const fogCanvasRef = useRef<HTMLCanvasElement>(null);
  const fogRafRef    = useRef<number>(0);

  // ── Derived state ─────────────────────────────────────────────────────────
  const cartEntries = useMemo(() => Array.from(cart.values()), [cart]);
  const rawTotal    = cartEntries.reduce((sum, e) => sum + e.price, 0);
  const discRate    = getBundleDiscount(cartEntries.length);
  const discAmount  = Math.round(rawTotal * discRate);
  const finalTotal  = rawTotal - discAmount;

  // Task 2: selectedAsset only valid while it's in the cart
  const selectedEntry = selectedAssetId ? cart.get(selectedAssetId) ?? null : null;

  // ── Fetch assets from DB ──────────────────────────────────────────────────
  useEffect(() => {
    if (!browseOpen) return;
    const category      = browseTab === "Character" ? "character" : "weapon";
    const alreadyLoaded = category === "character" ? characterAssets.length > 0 : weaponAssets.length > 0;
    if (alreadyLoaded) return;

    setAssetsLoading(true);
    fetch(`/api/products?category=${category}`)
      .then(r => { if (!r.ok) throw new Error(`API ${r.status}`); return r.json(); })
      .then(data => {
        const mapped: AssetItem[] = (data.products ?? []).map((p: any) => {
          // Derive 3 tier prices from DB price fields or compute from base
          const base = p.priceFullPack ?? p.priceStandard ?? p.priceMeshOnly ?? 0;
          return {
            id:           p.id,
            label:        p.name,
            category:     browseTab,
            videoSrc:     p.previewVideoUrl ?? "",
            // Use DB tier prices if available, else compute multipliers
            priceMesh:    p.priceMeshOnly ?? Math.round(base * 0.45),
            priceStandard:p.priceStandard  ?? Math.round(base * 0.75),
            priceFull:    p.priceFullPack  ?? base,
            enabledTiers: p.enabledTiers
              ? (p.enabledTiers as string).split(",").map((t: string) => t.trim()).filter(Boolean) as PackTier[]
              : (["mesh_only", "standard", "full_pack"] as PackTier[]),
            hasObj:       p.hasObj  ?? true,
            hasFbx:       p.hasFbx  ?? true,
            hasGlb:       p.hasGlb  ?? false,
            animCount:    p.animCount ?? 0,
            animNames:    p.animNames ?? [],
          };
        });
        if (category === "character") setCharacterAssets(mapped);
        else                          setWeaponAssets(mapped);
      })
      .catch(err => console.error("[AssetBuySection] fetch failed:", err))
      .finally(() => setAssetsLoading(false));
  }, [browseOpen, browseTab]);

  // ── Register addToCartMany (for WishlistPanel) ────────────────────────────
  useEffect(() => {
    onRegisterAddToCart?.((ids: string[]) => {
      setCart(prev => {
        const next = new Map(prev);
        const allAssets = [...characterAssets, ...weaponAssets];
        ids.forEach(id => {
          if (ownedAssetIds.has(id) || next.has(id)) return;
          const asset = allAssets.find(a => a.id === id);
          if (!asset) return;
          next.set(id, { asset, tier: asset.enabledTiers[0] ?? "mesh_only", price: computeTierPrice(asset, asset.enabledTiers[0] ?? "mesh_only") });
        });
        return next;
      });
    });
  }, [onRegisterAddToCart, ownedAssetIds, characterAssets, weaponAssets]);

  // ── Open browse to specific asset (from Recently Viewed) ──────────────────
  useEffect(() => {
    if (!openToId) return;
    setBrowseOpen(true);
    if (openToId.startsWith("axe-")) setBrowseTab("Weapon");
    else                              setBrowseTab("Character");
    onOpenToIdConsumed?.();
  }, [openToId]);

  // ── Ground fog canvas ─────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = fogCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    interface FogWisp {
      x: number; y: number; vx: number; vy: number;
      swayAmp: number; swayFreq: number; swayOff: number;
      rx: number; ry: number; life: number; maxLife: number; opacity: number; layer: number;
    }
    function resize() { canvas!.width = canvas!.offsetWidth; canvas!.height = canvas!.offsetHeight; }
    resize();
    window.addEventListener("resize", resize);
    function spawn(): FogWisp {
      const layer   = Math.floor(Math.random() * 3);
      const rs      = [2.1, 1.45, 0.9][layer];
      const speed   = [0.14, 0.25, 0.38][layer];
      const opacity = [0.30, 0.22, 0.15][layer] * (Math.random() * 0.25 + 0.88);
      return {
        x: Math.random() * canvas!.width * 1.3 - canvas!.width * 0.15,
        y: canvas!.height + Math.random() * 60,
        vx: (Math.random() - 0.5) * 0.22, vy: -(Math.random() * speed + 0.08),
        swayAmp: Math.random() * 25 + 8, swayFreq: Math.random() * 0.003 + 0.001,
        swayOff: Math.random() * Math.PI * 2,
        rx: (Math.random() * 200 + 160) * rs, ry: (Math.random() * 62 + 40) * rs,
        life: 0, maxLife: Math.random() * 480 + 340, opacity, layer,
      };
    }
    const wisps: FogWisp[] = [];
    for (let i = 0; i < 28; i++) {
      const w = spawn(); w.life = Math.random() * w.maxLife * 0.65;
      w.y = canvas.height + 80 + w.vy * w.life; wisps.push(w);
    }
    function draw() {
      const cw = canvas!.width, ch = canvas!.height;
      ctx!.clearRect(0, 0, cw, ch);
      if (wisps.length < 34 && Math.random() < 0.5) wisps.push(spawn());
      for (let i = wisps.length - 1; i >= 0; i--) {
        if (wisps[i].life >= wisps[i].maxLife) { wisps.splice(i, 1); }
      }
      wisps.sort((a, b) => a.layer - b.layer);
      for (const p of wisps) {
        p.life += 1; p.x += p.vx + Math.sin(p.life * p.swayFreq + p.swayOff) * 0.3; p.y += p.vy;
        const ratio = p.life / p.maxLife;
        const fadeIn = Math.min(1, ratio / 0.15);
        const fadeOut = ratio > 0.78 ? Math.max(0, 1 - (ratio - 0.78) / 0.22) : 1;
        const alpha = p.opacity * fadeIn * fadeOut;
        if (alpha < 0.003) continue;
        const r = p.layer === 0 ? 185 : p.layer === 1 ? 205 : 222;
        const g = p.layer === 0 ? 200 : p.layer === 1 ? 215 : 225;
        const b = p.layer === 0 ? 230 : p.layer === 1 ? 228 : 230;
        ctx!.save(); ctx!.translate(p.x, p.y); ctx!.scale(1, p.ry / p.rx);
        const grad = ctx!.createRadialGradient(0, 0, 0, 0, 0, p.rx);
        grad.addColorStop(0,    `rgba(${r},${g},${b},${alpha})`);
        grad.addColorStop(0.42, `rgba(${r},${g},${b},${alpha * 0.58})`);
        grad.addColorStop(0.76, `rgba(${r},${g},${b},${alpha * 0.18})`);
        grad.addColorStop(1,    `rgba(${r},${g},${b},0)`);
        ctx!.beginPath(); ctx!.arc(0, 0, p.rx, 0, Math.PI * 2);
        ctx!.fillStyle = grad; ctx!.fill(); ctx!.restore();
      }
      fogRafRef.current = requestAnimationFrame(draw);
    }
    fogRafRef.current = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(fogRafRef.current); window.removeEventListener("resize", resize); };
  }, []);

  // ── Filtered + sorted asset list ──────────────────────────────────────────
  const filteredAssets = useMemo(() => {
    let list = browseTab === "Character" ? characterAssets : weaponAssets;
    if (browseSearch.trim()) list = list.filter(a => a.label.toLowerCase().includes(browseSearch.toLowerCase()));
    if (priceMin !== null) list = list.filter(a => a.priceFull >= priceMin);
    if (priceMax !== null) list = list.filter(a => a.priceMesh <= priceMax);
    if (tierFilter !== null) list = list.filter(a => tierFilter === "mesh_only"
      ? a.priceMesh > 0 : tierFilter === "standard" ? a.priceStandard > 0 : a.priceFull > 0);
    if (browseSort === "price-asc")  list = [...list].sort((a, b) => a.priceMesh - b.priceMesh);
    if (browseSort === "price-desc") list = [...list].sort((a, b) => b.priceFull - a.priceFull);
    if (browseSort === "name")       list = [...list].sort((a, b) => a.label.localeCompare(b.label));
    return list;
  }, [browseTab, characterAssets, weaponAssets, browseSearch, browseSort, priceMin, priceMax, tierFilter]);

  // ── Cart actions ──────────────────────────────────────────────────────────

  // Task 1: toggle asset in cart — opens tier picker if adding, removes if already in
  function toggleCart(asset: AssetItem, defaultTier: PackTier = asset.enabledTiers[0] ?? "mesh_only") {
    if (ownedAssetIds.has(asset.id)) return;
    setCart(prev => {
      const next = new Map(prev);
      if (next.has(asset.id)) {
        next.delete(asset.id);
        // Task 2: clear selected if this asset was selected
        setSelectedAssetId(id => id === asset.id ? null : id);
      } else {
        next.set(asset.id, { asset, tier: defaultTier, price: computeTierPrice(asset, defaultTier) });
        setSelectedAssetId(asset.id);
      }
      return next;
    });
  }

  // Task 1: change tier of an asset already in cart
  function changeTier(assetId: string, tier: PackTier) {
    setCart(prev => {
      const entry = prev.get(assetId);
      if (!entry) return prev;
      const next = new Map(prev);
      next.set(assetId, { ...entry, tier, price: computeTierPrice(entry.asset, tier) });
      return next;
    });
    setTierPickerId(null);
  }

  // Remove from cart (pill × button or asset details × button)
  const removeFromCart = useCallback((assetId: string) => {
    setCart(prev => {
      const next = new Map(prev);
      next.delete(assetId);
      return next;
    });
    // Task 2: clear selected immediately
    setSelectedAssetId(id => id === assetId ? null : id);
  }, []);

  useEffect(() => {
    if (!browseOpen && selectedEntry && videoCardRef.current) {
      const video = videoCardRef.current;
      video.load(); video.play().catch(() => {});
    }
  }, [browseOpen, selectedEntry]);

  // Reset cycle when cart changes
  const cartKey = cartEntries.map(e => e.asset.id).sort().join(",");
  const prevCartKey = useRef("");
  if (cartKey !== prevCartKey.current) { prevCartKey.current = cartKey; if (cycleIndex !== 0) setCycleIndex(0); }

  // ── Asset Details Card ────────────────────────────────────────────────────

  function renderAssetInfoCard() {
    // Task 2: if nothing selected (or selected was removed), show empty state
    if (!selectedEntry) {
      if (cartEntries.length > 1) {
        // Multi-item summary when no single item is focused
        return (
          <div className="assetBuyCardInner assetBuyCardFilled assetBuyCardMulti">
            <p className="abcMultiTitle">{cartEntries.length} assets in bundle</p>
            <div className="abcMultiList">
              {cartEntries.map(entry => (
                <div key={entry.asset.id} className="abcMultiRow">
                  <div className="abcMultiRowLeft">
                    <span className={`abcPkgBadge ${TIER_CLS[entry.tier]}`}>{TIER_LABEL[entry.tier]}</span>
                  </div>
                  <span
                    className="abcMultiRowName"
                    onClick={() => setSelectedAssetId(entry.asset.id)}
                    title="Click to view details"
                  >{entry.asset.label}</span>
                  <span className="abcMultiRowPrice">{fmt(entry.price)}</span>
                  <button
                    className="abcMultiRowRemove"
                    onClick={() => removeFromCart(entry.asset.id)}
                    aria-label={`Remove ${entry.asset.label}`}
                  >×</button>
                </div>
              ))}
            </div>
            <div className="abcMeta">
              <span>Click any asset name to view details</span>
            </div>
          </div>
        );
      }
      return (
        <div className="assetBuyCardInner assetBuyCardEmpty">
          <span className="assetBuyCardEmptyIcon">◈</span>
          <p className="assetBuyCardEmptyLabel">Select an asset to see what&apos;s included</p>
        </div>
      );
    }

    const { asset, tier, price } = selectedEntry;

    return (
      <div className="assetBuyCardInner assetBuyCardFilled">
        {/* Header row */}
        <div className="abcTopRow">
          <p className="abcAssetName">{asset.label}</p>
          {/* Task 2: X button removes from cart + clears card instantly */}
          <button
            className="abcRemoveBtn"
            onClick={() => removeFromCart(asset.id)}
            aria-label={`Remove ${asset.label}`}
            title="Remove from bundle"
          >×</button>
        </div>

        {/* Task 1: Pack tier selector — 3 pills the buyer clicks to choose */}
        <div className="abcTierSelector">
          <p className="abcTierSelectorLabel">Choose pack:</p>
          <div className="abcTierBtns">
            {TIER_ORDER.filter(t => asset.enabledTiers.includes(t)).map(t => (
              <button
                key={t}
                className={`abcTierBtn ${t === tier ? "abcTierBtnActive" : ""} abcTierBtn_${t}`}
                onClick={() => changeTier(asset.id, t)}
              >
                <span className="abcTierBtnName">{TIER_LABEL[t]}</span>
                <span className="abcTierBtnPrice">{fmt(computeTierPrice(asset, t))}</span>
              </button>
            ))}
          </div>
        </div>

        {/* What's included for selected tier */}
        <div className="abcIncludesList">
          <p className="abcIncludesLabel">Includes:</p>
          {TIER_INCLUDES[tier].map(item => (
            <div key={item} className="abcIncludesItem">
              <span className="abcIncludesCheck">✓</span>
              <span>{item}</span>
            </div>
          ))}
        </div>

        {/* Format badges */}
        <div className="abcFormatRow">
          <span className={`abcFmt ${asset.hasObj ? "abcFmtOn"  : "abcFmtOff"}`}>OBJ</span>
          <span className={`abcFmt ${asset.hasFbx ? "abcFmtFbx" : "abcFmtOff"}`}>FBX</span>
          <span className={`abcFmt ${asset.hasGlb && tier === "full_pack" ? "abcFmtGlb" : "abcFmtOff"}`}>GLB</span>
        </div>

        {/* Anim info */}
        {asset.animCount > 0 && tier !== "mesh_only" ? (
          <div className="abcAnimRow">
            <span className="abcAnimCount">{asset.animCount} animations</span>
            <span className="abcAnimList">{asset.animNames.join(" · ")}</span>
          </div>
        ) : tier === "mesh_only" ? (
          <div className="abcAnimRow abcAnimNone">Static mesh — no animation files</div>
        ) : (
          <div className="abcAnimRow abcAnimNone">Preview video only</div>
        )}

        <div className="abcMeta">
          <span>4K PBR textures</span>
          <span>Royalty-free</span>
          <span>Lifetime access</span>
        </div>
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      <section className="assetBuySection">

        <div className="assetBuyBgOrc">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/orc-blue.png" alt="" className="assetBuyBgOrcImg" />
          <div className="assetBuyBgOrcFade" />
        </div>
        <canvas ref={fogCanvasRef} className="assetBuyFogCanvas" />

        <div className="assetBuyContent">

          <div className="assetBuyHeroText">
            <p className="assetBuyLabel">Character &amp; Weapon Studio</p>
            <h2 className="assetBuyTitle">
              One purchase.<br />
              <span className="assetBuyTitleAccent">Lifetime access.</span>
            </h2>
            <p className="assetBuySubline">
              Hand-crafted in Blender. Clean topology, 4K PBR textures,<br />
              retargetable rigs. No subscriptions.
            </p>
          </div>

          {/* Perks strip */}
          <div className="assetBuyPerks">
            {(browseTab === "Weapon" ? [
              { icon: "◈", label: "OBJ + FBX + GLB" },
              { icon: "⬡", label: "4K PBR textures" },
              { icon: "◉", label: "Unity / Unreal ready" },
              { icon: "∞", label: "Royalty-free" },
            ] : [
              { icon: "◈", label: "OBJ + FBX + GLB" },
              { icon: "⬡", label: "4K PBR textures" },
              { icon: "◉", label: "Hand-keyed anims" },
              { icon: "∞", label: "Royalty-free" },
            ]).map(p => (
              <div key={p.label} className="assetBuyPerk">
                <span className="assetBuyPerkIcon">{p.icon}</span>
                <span className="assetBuyPerkLabel">{p.label}</span>
              </div>
            ))}
          </div>

          {/* Package tier info cards — clicking opens browse filtered to that tier */}
          <div className="assetBuyPackages">
            {[
              {
                key:   "mesh_only" as PackTier,
                name:  "Mesh Only",
                price: browseTab === "Weapon" ? "₱299–₱599"   : "₱699–₱999",
                cls:   "abcPkgCardMesh",
                items: getTierIncludes(browseTab).mesh_only,
                note:  browseTab === "Weapon" ? "Single format, budget-friendly"     : "Static props, background NPCs",
              },
              {
                key:   "standard" as PackTier,
                name:  "Standard Pack",
                price: browseTab === "Weapon" ? "₱599–₱999"   : "₱1,800–₱2,200",
                cls:   "abcPkgCardStandard",
                items: getTierIncludes(browseTab).standard,
                note:  browseTab === "Weapon" ? "OBJ + FBX, Unity & Unreal ready"    : "Game-ready, Unity / Unreal",
              },
              {
                key:   "full_pack" as PackTier,
                name:  "Full Pack",
                price: browseTab === "Weapon" ? "₱999–₱1,599" : "₱2,500–₱3,200",
                cls:   "abcPkgCardFull",
                items: getTierIncludes(browseTab).full_pack,
                note:  browseTab === "Weapon" ? "All formats, every engine covered"  : "Production-ready, VR / AR / cinematics",
                featured: true,
              },
            ].map(pkg => (
              <div
                key={pkg.key}
                className={`abcPkgCard ${pkg.cls}${pkg.featured ? " abcPkgCardFeatured" : ""}`}
                onClick={() => { setTierFilter(pkg.key); setBrowseOpen(true); }}
                title={`Browse ${pkg.name} assets`}
              >
                {pkg.featured && <span className="abcPkgFeaturedBadge">Most complete</span>}
                <p className="abcPkgName">{pkg.name}</p>
                <p className="abcPkgPrice">{pkg.price}</p>
                <ul className="abcPkgList">
                  {pkg.items.map(item => (
                    <li key={item} className="abcPkgListItem">
                      <span className="abcPkgCheck">✓</span>
                      {item}
                    </li>
                  ))}
                </ul>
                <p className="abcPkgNote">{pkg.note}</p>
                <span className="abcPkgCta">Browse {pkg.name} →</span>
              </div>
            ))}
          </div>

          {/* Two-up card rail */}
          <div className="assetBuyCardRail">

            {/* Card 1 — Asset Details (with tier selector) */}
            <div className="assetBuyRailCard assetBuyRailCardInfo">
              <div className="assetBuyRailCardHeader">
                <span className="assetBuyRailCardEye">Asset Details</span>
                {cartEntries.length > 1 && (
                  <span className="assetBuyRailCardCount">{cartEntries.length} in bundle</span>
                )}
              </div>
              {renderAssetInfoCard()}
            </div>

            {/* Card 2 — Animation preview video */}
            <div className="assetBuyRailCard assetBuyRailCardVideo">
              {cartEntries.length === 0 ? (
                <div className="assetBuyRailEmptyState">
                  <span className="assetBuyRailEmptyIcon">▶</span>
                  <p className="assetBuyRailEmptyLabel">Browse and select an asset<br />to preview the animation</p>
                  <button className="assetBuyInlineBtn" onClick={() => setBrowseOpen(true)}>
                    Browse assets →
                  </button>
                </div>
              ) : (() => {
                // Task 3: show the focused asset's video if selected, else cycle through cart
                const focusedEntry = selectedEntry ?? cartEntries[cycleIndex % cartEntries.length];
                const animNames    = focusedEntry?.asset.animNames ?? [];
                const hasAnims     = animNames.length > 1;

                return (
                  <>
                    <video
                      ref={videoCardRef}
                      key={`${focusedEntry?.asset.id}-${animIndex}`}
                      src={focusedEntry?.asset.videoSrc}
                      className="assetBuyCardVideo"
                      autoPlay muted playsInline
                      loop
                    />

                    {/* Task 3: Animation name tabs — shown when asset has multiple anims */}
                    {hasAnims && (
                      <div className="assetAnimSwitcher">
                        <p className="assetAnimSwitcherLabel">Animations</p>
                        <div className="assetAnimSwitcherTabs">
                          {animNames.map((name, i) => (
                            <button
                              key={name}
                              className={`assetAnimTab ${animIndex === i ? "assetAnimTabActive" : ""}`}
                              onClick={() => setAnimIndex(i)}
                              title={name}
                            >
                              {name}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Multi-asset cycle dots */}
                    {cartEntries.length > 1 && !selectedEntry && (
                      <div className="assetBuyCycleLabel">
                        {cartEntries[cycleIndex % cartEntries.length]?.asset.label}
                        <span className="assetBuyCycleDots">
                          {cartEntries.map((_, i) => (
                            <span key={i} className={`assetBuyCycleDot ${i === cycleIndex % cartEntries.length ? "assetBuyCycleDotActive" : ""}`} />
                          ))}
                        </span>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>

          </div>

          {/* Cart pills row */}
          {cartEntries.length > 0 && (
            <div className="assetCartPills">
              {cartEntries.map(entry => (
                <div
                  key={entry.asset.id}
                  className={`assetCartPill ${selectedAssetId === entry.asset.id ? "assetCartPillActive" : ""}`}
                  onClick={() => setSelectedAssetId(entry.asset.id)}
                >
                  <span className="assetCartPillLabel">{entry.asset.label}</span>
                  <span className={`assetCartPillTier ${TIER_CLS[entry.tier]}`}>{TIER_LABEL[entry.tier]}</span>
                  <span className="assetCartPillPrice">{fmt(entry.price)}</span>
                  <button
                    className="assetCartPillRemove"
                    onClick={e => { e.stopPropagation(); removeFromCart(entry.asset.id); }}
                    aria-label={`Remove ${entry.asset.label}`}
                  >×</button>
                </div>
              ))}
            </div>
          )}

          {/* CTA bar */}
          <div className="assetBuyCTABar">
            {cartEntries.length >= 2 && (
              <div className="assetBuyBundleBreakdown">
                <span className="abbSubtotal">{fmt(rawTotal)}</span>
                <span className="abbMinus">−{discountLabel(cartEntries.length)}</span>
                <span className="abbFinal">{fmt(finalTotal)}</span>
              </div>
            )}
            <div className="assetBuyCTAButtons">
              <button className="assetBrowseBtn" onClick={() => setBrowseOpen(true)}>
                Browse catalog
              </button>
              <button
                className="assetBuyBtn"
                onClick={() => {
                  if (cartEntries.length === 0) {
                    showToast("No items selected. Browse and select assets first.", "warning");
                    return;
                  }
                  // Pass id:tier tuples so server computes the correct tier price
                  const items = cartEntries.map(e => `${e.asset.id}:${e.tier}`).join(",");
                  window.open(`/checkout/bundle?items=${items}`, "_blank", "noopener,noreferrer");
                }}
              >
                {cartEntries.length > 0
                  ? `Buy now (${cartEntries.length}) — ${fmt(finalTotal)}`
                  : "Buy now"}
              </button>
              <button
                className={"assetCartIconBtn" + (cartEntries.length === 0 ? " assetCartIconBtnDisabled" : "")}
                disabled={cartEntries.length === 0}
                onClick={() => {
                  if (cartEntries.length === 0) return;
                  const items = cartEntries.map(e => `${e.asset.id}:${e.tier}`).join(",");
                  window.open(`/checkout/bundle?items=${items}`, "_blank", "noopener,noreferrer");
                }}
                title={cartEntries.length > 0 ? `Checkout (${cartEntries.length} items)` : "No items selected"}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
                  <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
                </svg>
                {cartEntries.length > 0 && (
                  <span className="assetCartIconBadge">{cartEntries.length}</span>
                )}
              </button>
            </div>
          </div>

        </div>
      </section>

      {/* ── Browse Modal ─────────────────────────────────────────────────────── */}
      {browseOpen && (
        <div className="assetModalOverlay" onClick={() => setBrowseOpen(false)}>
          <div className="assetModal" onClick={e => e.stopPropagation()}>
            <div className="assetModalHeader">
              <div className="assetModalTabs">
                {(["Character", "Weapon"] as const).map(tab => (
                  <button
                    key={tab}
                    className={`assetModalTab ${browseTab === tab ? "assetModalTabActive" : ""}`}
                    onClick={() => { setBrowseTab(tab); setBrowseSearch(""); setTierFilter(null); setTierPickerId(null); }}
                  >{tab}</button>
                ))}
              </div>
              {cartEntries.length > 0 && (
                <span className="assetModalCartBadge">
                  {cartEntries.length} in bundle{discRate > 0 ? ` · ${discountLabel(cartEntries.length)}` : ""}
                </span>
              )}
              {tierFilter && (
                <span className="assetModalTierFilterPill">
                  {TIER_LABEL[tierFilter as PackTier]}
                  <button className="assetModalTierFilterClear" onClick={() => setTierFilter(null)} title="Clear tier filter">×</button>
                </span>
              )}
              <button className="assetModalClose" onClick={() => { setBrowseOpen(false); setTierFilter(null); setTierPickerId(null); }}>✕</button>
            </div>

            {/* Search + Sort + Price */}
            <div className="assetModalControls">
              <div className="assetModalSearchWrap">
                <input className="assetModalSearch" type="text" placeholder="Search assets…"
                  value={browseSearch} onChange={e => setBrowseSearch(sanitize(e.target.value))} />
                {browseSearch && <button className="assetModalSearchClear" onClick={() => setBrowseSearch("")}>✕</button>}
              </div>
              <select className="assetModalSort" value={browseSort}
                onChange={e => setBrowseSort(e.target.value as typeof browseSort)}>
                <option value="default">Default</option>
                <option value="price-asc">Price: Low → High</option>
                <option value="price-desc">Price: High → Low</option>
                <option value="name">Name A–Z</option>
              </select>
              <div className="assetModalPriceFilter">
                <span className="assetModalPriceFilterLabel">₱</span>
                <input className="assetModalPriceInput" type="number" placeholder="Min" min={0}
                  value={priceMin ?? ""} onChange={e => setPriceMin(e.target.value ? Number(e.target.value) : null)} />
                <span className="assetModalPriceFilterSep">–</span>
                <input className="assetModalPriceInput" type="number" placeholder="Max" min={0}
                  value={priceMax ?? ""} onChange={e => setPriceMax(e.target.value ? Number(e.target.value) : null)} />
                {(priceMin !== null || priceMax !== null) && (
                  <button className="assetModalPriceClear"
                    onClick={() => { setPriceMin(null); setPriceMax(null); }} title="Clear price filter">✕</button>
                )}
              </div>
            </div>

            <div className="assetModalList">
              {assetsLoading && Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="assetModalRowSkeleton">
                  <div className="assetModalSkeletonThumb" />
                  <div className="assetModalSkeletonInfo">
                    <div className="assetModalSkeletonLine assetModalSkeletonLineLong" />
                    <div className="assetModalSkeletonLine assetModalSkeletonLineShort" />
                  </div>
                </div>
              ))}
              {!assetsLoading && filteredAssets.length === 0 && (
                <div className="assetModalEmpty"><p>No {browseTab.toLowerCase()} assets found.</p></div>
              )}
              {!assetsLoading && filteredAssets.map(asset => {
                const isOwned      = ownedAssetIds.has(asset.id);
                const entry        = cart.get(asset.id);
                const isInCart     = !!entry;
                const isWishlisted = wishlistIds.has(asset.id);
                const showPicker   = tierPickerId === asset.id;

                return (
                  <div
                    key={asset.id}
                    className={[
                      "assetModalRow",
                      isInCart  ? "assetModalRowInCart" : "",
                      isOwned   ? "assetModalRowOwned"  : "",
                    ].join(" ")}
                  >
                    <div className="assetModalThumb">
                      <video src={asset.videoSrc} autoPlay muted loop playsInline preload="none" className="assetModalThumbVideo" />
                    </div>

                    <div className="assetModalRowInfo">
                      <div className="assetModalRowLabelRow">
                        <p className="assetModalRowLabel">{asset.label}</p>
                      </div>
                      {/* Format badges */}
                      <div className="assetModalFormatRow">
                        {asset.hasObj && <span className="amfBadge amfObj">OBJ</span>}
                        {asset.hasFbx && <span className="amfBadge amfFbx">FBX</span>}
                        {asset.hasGlb && <span className="amfBadge amfGlb">GLB</span>}
                        {asset.animCount > 0 && (
                          <span className="amfBadge amfAnim">{asset.animCount} anims</span>
                        )}
                      </div>
                      {/* Price range */}
                      <p className="assetModalRowPriceRange">
                        {fmt(asset.priceMesh)} – {fmt(asset.priceFull)}
                      </p>
                    </div>

                    <div className="assetModalRowRight">
                      {isOwned ? (
                        <span className="assetModalOwnedBadge">✓ Owned</span>
                      ) : isInCart ? (
                        // Already in cart — show current tier + change/remove options
                        <div className="assetModalInCartActions">
                          <span className={`assetModalInCartTier ${TIER_CLS[entry!.tier]}`}>
                            {TIER_LABEL[entry!.tier]} · {fmt(entry!.price)}
                          </span>
                          <button
                            className="assetModalChangeTierBtn"
                            onClick={e => { e.stopPropagation(); setTierPickerId(showPicker ? null : asset.id); }}
                          >Change tier ▾</button>
                          <button
                            className="assetModalRemoveBtn"
                            onClick={e => { e.stopPropagation(); removeFromCart(asset.id); setTierPickerId(null); }}
                          >Remove</button>
                        </div>
                      ) : (
                        // Not in cart — show wishlist + add buttons
                        <div className="assetModalRowBtns">
                          {onAddToWishlist && (
                            <button
                              className={"assetModalWishlistBtn" + (isWishlisted ? " assetModalWishlistBtnActive" : "")}
                              onClick={e => { e.stopPropagation(); onAddToWishlist(asset.id); }}
                              aria-label="Save to wishlist"
                            >{isWishlisted ? "♥" : "♡"}</button>
                          )}
                          <button
                            className="assetModalSelectBtn"
                            onClick={e => {
                              e.stopPropagation();
                              setTierPickerId(asset.id);
                              onTrackView?.({ id: asset.id, label: asset.label, category: asset.category, price: asset.priceFull });
                            }}
                          >Select pack ▾</button>
                        </div>
                      )}
                    </div>

                    {/* Task 1: Inline tier picker — appears below the row */}
                    {showPicker && !isOwned && (
                      <div className="assetTierPicker" onClick={e => e.stopPropagation()}>
                        <p className="assetTierPickerLabel">Choose a pack for <strong>{asset.label}</strong>:</p>
                        <div className="assetTierPickerBtns">
                          {TIER_ORDER.filter(t => asset.enabledTiers.includes(t)).map(t => (
                            <button
                              key={t}
                              className={`assetTierPickerBtn assetTierPickerBtn_${t} ${isInCart && entry?.tier === t ? "assetTierPickerBtnActive" : ""}`}
                              onClick={() => {
                                if (isInCart) {
                                  changeTier(asset.id, t);
                                } else {
                                  toggleCart(asset, t);
                                }
                                setTierPickerId(null);
                                setBrowseOpen(false);
                              }}
                            >
                              <span className="atpBtnName">{TIER_LABEL[t]}</span>
                              <span className="atpBtnIncludes">{TIER_INCLUDES[t].slice(0, 2).join(", ")}</span>
                              <span className="atpBtnPrice">{fmt(computeTierPrice(asset, t))}</span>
                            </button>
                          ))}
                        </div>
                        <button className="assetTierPickerCancel" onClick={() => setTierPickerId(null)}>Cancel</button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="assetModalFooter">
              <div className="assetModalFooterLeft">
                <p className="assetModalFooterNote">
                  {cartEntries.length === 0 ? "Select assets and choose a pack" : `${cartEntries.length} item${cartEntries.length > 1 ? "s" : ""} selected`}
                </p>
                {cartEntries.length >= 2 && discRate > 0 && (
                  <p className="assetModalFooterDiscount">
                    {fmt(rawTotal)} − {discountLabel(cartEntries.length)} = <strong>{fmt(finalTotal)}</strong>
                  </p>
                )}
              </div>
              <button
                className={"assetModalAddCartBtn" + (cartEntries.length === 0 ? " assetModalAddCartBtnDisabled" : "")}
                disabled={cartEntries.length === 0}
                onClick={() => {
                  if (cartEntries.length === 0) return;
                  onAddToCart?.(cartEntries.map(e => e.asset.id));
                  setBrowseOpen(false);
                  showToast(`${cartEntries.length} item${cartEntries.length > 1 ? "s" : ""} added to cart`, "success");
                }}
              >
                {cartEntries.length === 0 ? "Add to Cart" : `Add ${cartEntries.length} to Cart`}
              </button>
            </div>
          </div>
        </div>
      )}

      <ToastStack toasts={toasts} onDismiss={dismissToast} />
    </>
  );
}