// CustomRequestBuilder.tsx — Multi-step custom project request form.
// Step 1: Asset type  Step 2: Style details  Step 3: Delivery  Step 4: Confirm
// Asset types: Character, Weapon, Interior, Exterior, AI Animation, System, Other
// Character & Weapon use pack tiers instead of poly budget / animation count.

"use client";

import { useState } from "react";
import "./custom-request-builder.css";
import { sanitize } from "@/lib/utils";
import { useToast }  from "@/app/buyer/shared/useToast";
import ToastStack    from "@/app/buyer/shared/ToastStack";

// ── Types ────────────────────────────────────────────────────────────────────

type AssetType     = "Character" | "Weapon" | "Interior" | "Exterior" | "AI Animation" | "System" | "Other";
type DeliverySpeed = "Standard" | "Rush" | "Urgent";

// ── Character packs ───────────────────────────────────────────────────────────
// Mesh-only → Rigged → Rigged + Animations (same tiers as the shop)
type CharacterPack = "Mesh Only" | "Rigged" | "Rigged + Animations";
const CHARACTER_PACKS: { key: CharacterPack; label: string; desc: string; price: number }[] = [
  { key: "Mesh Only",           label: "Mesh Only",           desc: "Game-ready mesh, UV-unwrapped, textured",   price: 3500  },
  { key: "Rigged",              label: "Rigged",              desc: "Full rig — ready for animation pipeline",   price: 5500  },
  { key: "Rigged + Animations", label: "Rigged + Animations", desc: "Rig + base animation set (idle, walk, run)", price: 8500 },
];

// ── Weapon packs ──────────────────────────────────────────────────────────────
type WeaponPack = "Mesh Only" | "Textured" | "Textured + FX";
const WEAPON_PACKS: { key: WeaponPack; label: string; desc: string; price: number }[] = [
  { key: "Mesh Only",    label: "Mesh Only",    desc: "Clean low-poly mesh, game-ready topology",      price: 2000  },
  { key: "Textured",     label: "Textured",     desc: "PBR textures — albedo, normal, roughness/metal", price: 3500 },
  { key: "Textured + FX", label: "Textured + FX", desc: "Full textures + particle/shader FX set",      price: 5500 },
];

// ── Base prices (for Interior, Exterior, AI Animation, System, Other) ─────────
const BASE_PRICE: Partial<Record<AssetType, number>> = {
  Interior:      15000,
  Exterior:      20000,
  "AI Animation": 7500,
  System:        33000,
  Other:         8000,
};

const SPEED_MULTIPLIER: Record<DeliverySpeed, number> = {
  Standard: 1.0,
  Rush:     2.2,   // base price + 120% of base price (base × 2.2); base = quoted price
  Urgent:   3.2,   // base price + 220% of base price (base × 3.2); base = quoted price
};

const SPEED_SURCHARGE_LABEL: Record<DeliverySpeed, string> = {
  Standard: "",
  Rush:     "+120% surcharge (×1.2 added)",
  Urgent:   "+220% surcharge (×2.2 added)",
};

const SPEED_DELIVERY: Record<DeliverySpeed, string> = {
  Standard: "4–6 weeks", Rush: "2–3 weeks", Urgent: "1–2 weeks",
};

// ── Form state ────────────────────────────────────────────────────────────────

interface FormState {
  assetType:       AssetType | "";
  description:     string;
  characterPack:   CharacterPack | "";
  weaponPack:      WeaponPack   | "";
  reference:       string;
  deliverySpeed:   DeliverySpeed | "";
}

// ── Price calculator ──────────────────────────────────────────────────────────

function calcEstimate(form: FormState): number | null {
  if (!form.assetType || !form.deliverySpeed) return null;

  let base = 0;

  if (form.assetType === "Character") {
    if (!form.characterPack) return null;
    const pack = CHARACTER_PACKS.find(p => p.key === form.characterPack);
    if (!pack) return null;
    base = pack.price;
  } else if (form.assetType === "Weapon") {
    if (!form.weaponPack) return null;
    const pack = WEAPON_PACKS.find(p => p.key === form.weaponPack);
    if (!pack) return null;
    base = pack.price;
  } else {
    base = BASE_PRICE[form.assetType] ?? 8000;
  }

  return Math.round(base * SPEED_MULTIPLIER[form.deliverySpeed as DeliverySpeed]);
}

function fmt(p: number) {
  return "₱" + p.toLocaleString("en-PH", { minimumFractionDigits: 0 });
}

// ── SVG icon set ──────────────────────────────────────────────────────────────

const ICONS: Record<AssetType, React.ReactNode> = {
  Character: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="7" r="4"/><path d="M5.5 21a8.38 8.38 0 0 1 13 0"/>
    </svg>
  ),
  Weapon: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="21" x2="21" y2="3"/><path d="M15 3h6v6"/><path d="M3 15l3 3"/>
    </svg>
  ),
  Interior: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  ),
  Exterior: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="12" cy="12" r="3"/><line x1="3" y1="9" x2="21" y2="9"/>
    </svg>
  ),
  "AI Animation": (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="5 3 19 12 5 21 5 3"/>
      <path d="M19 3v18"/>
    </svg>
  ),
  System: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="12" rx="2"/><line x1="8" y1="20" x2="16" y2="20"/><line x1="12" y1="16" x2="12" y2="20"/>
    </svg>
  ),
  Other: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/><path d="M12 2v3m0 14v3M4.22 4.22l2.12 2.12m11.32 11.32 2.12 2.12M2 12h3m14 0h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12"/>
    </svg>
  ),
};

// ── Step indicator ────────────────────────────────────────────────────────────

const STEPS = ["Asset Type", "Details", "Delivery", "Confirm"];

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="crbStepRow">
      {STEPS.map((_, i) => (
        <div key={i} className={`crbStepDot ${i < current ? "crbStepDotDone" : i === current ? "crbStepDotActive" : "crbStepDotFuture"}`} />
      ))}
    </div>
  );
}

// ── Pack selector — reused for Character and Weapon ───────────────────────────

function PackSelector<T extends string>({
  packs, selected, onSelect, accent,
}: {
  packs:    { key: T; label: string; desc: string; price: number }[];
  selected: T | "";
  onSelect: (key: T) => void;
  accent:   string;
}) {
  return (
    <>
      <div className="crbPackGrid">
        {packs.map(pack => {
          const isActive = selected === pack.key;
          return (
            <button
              key={pack.key}
              className={`crbPackBtn ${isActive ? "crbPackBtnActive" : ""}`}
              style={isActive ? { borderColor: accent + "66", background: accent + "10" } : {}}
              onClick={() => onSelect(pack.key)}
            >
              <span className="crbPackBtnLabel" style={isActive ? { color: accent } : {}}>{pack.label}</span>
              <span className="crbPackBtnDesc">{pack.desc}</span>
              <span className="crbPackBtnPrice" style={isActive ? { color: accent } : {}}>{fmt(pack.price)}</span>
              <span className="crbPackBtnRange">
                Rush {fmt(Math.round(pack.price * 2.2))} · Urgent {fmt(Math.round(pack.price * 3.2))}
              </span>
            </button>
          );
        })}
      </div>
      <p className="crbPriceNote">⚠ Price can change once admin reviews the request.</p>
    </>
  );
}

// ── Asset type accent colors ──────────────────────────────────────────────────

const ASSET_ACCENT: Record<AssetType, string> = {
  Character:      "#22c55e",
  Weapon:         "#c9935e",
  Interior:       "#60a5fa",
  Exterior:       "#a78bfa",
  "AI Animation": "#f472b6",
  System:         "#67e8f9",
  Other:          "#888",
};

const ASSET_BASE_DISPLAY: Partial<Record<AssetType, string>> = {
  Interior:      "from ₱15,000",
  Exterior:      "from ₱20,000",
  "AI Animation": "from ₱7,500",
  System:        "from ₱33,000",
};

// ── Main export ───────────────────────────────────────────────────────────────

export default function CustomRequestBuilder() {
  const { toasts, showToast, dismissToast } = useToast();
  const [step,       setStep]       = useState(0);
  const [form,       setForm]       = useState<FormState>({
    assetType: "", description: "", characterPack: "", weaponPack: "", reference: "", deliverySpeed: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted,  setSubmitted]  = useState(false);
  const [submitErr,  setSubmitErr]  = useState("");

  const estimate = calcEstimate(form);
  const accent   = form.assetType ? ASSET_ACCENT[form.assetType as AssetType] : "#888";

  // ── Determine if Step 1 (details) is complete enough to advance ────────────
  function isDetailsComplete(): boolean {
    if (!form.description) return false;
    if (form.assetType === "Character" && !form.characterPack) return false;
    if (form.assetType === "Weapon"    && !form.weaponPack)    return false;
    return true;
  }

  async function handleSubmit() {
    setSubmitting(true);
    setSubmitErr("");
    try {
      const res = await fetch("/api/inquiry", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          assetType:      form.assetType,
          description:    form.description,
          characterPack:  form.characterPack  || null,
          weaponPack:     form.weaponPack      || null,
          reference:      form.reference       || null,
          deliverySpeed:  form.deliverySpeed,
          estimatedQuote: estimate,
        }),
      });
      if (res.status === 201 || res.status === 200) {
        showToast("✓ Custom request submitted. I'll review and get back to you soon.", "success");
        setSubmitted(true);
      } else {
        const data = await res.json().catch(() => ({}));
        const msg = data.error ?? "Something went wrong. Try again.";
        setSubmitErr(msg);
        showToast(`✕ ${msg}`, "error");
      }
    } catch {
      showToast("✓ Request received. I'll follow up shortly.", "success");
      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  }

  function reset() {
    setSubmitted(false); setStep(0);
    setForm({ assetType: "", description: "", characterPack: "", weaponPack: "", reference: "", deliverySpeed: "" });
  }

  if (submitted) {
    return (
      <section className="crbSection">
        <div className="crbSuccess">
          <div className="crbSuccessIcon">✓</div>
          <h3 className="crbSuccessTitle">Request Sent</h3>
          <p className="crbSuccessDesc">
            Your custom {form.assetType?.toLowerCase()} request has been received.
            {estimate && <> Estimated quote: <strong>{fmt(estimate)}</strong>.</>}
            {" "}I'll review it and reply within 24 hours with a final quote. <strong>No payment needed yet</strong> — you'll only be asked to pay after we agree on scope and final price.
          </p>
          <button className="crbSuccessReset" onClick={reset}>Submit another</button>
        </div>
      </section>
    );
  }

  return (
    <section className="crbSection">
      <ToastStack toasts={toasts} onDismiss={dismissToast} />
      <div className="crbInner">

        {/* Header */}
        <div className="crbHeader">
          <div className="crbHeaderLeft">
            <p className="crbEyebrow">Custom Work</p>
            <h2 className="crbTitle">Build a Custom Request</h2>
          </div>
          <p className="crbSub">Tell us what you need — get an instant estimate.</p>
        </div>

        {/* Layout */}
        <div className="crbLayout">

          {/* Sidebar — step tracker */}
          <aside className="crbSidebar">
            {STEPS.map((label, i) => (
              <div
                key={i}
                className={`crbSidebarStep ${i < step ? "crbSidebarStepDone" : i === step ? "crbSidebarStepActive" : ""}`}
              >
                <span className="crbSidebarNum">Step {i + 1}</span>
                <span className="crbSidebarLabel">{label}</span>
              </div>
            ))}
          </aside>

          {/* Card */}
          <div className="crbCard">
            <StepIndicator current={step} />

            {/* ── Step 0 — Asset type ── */}
            {step === 0 && (
              <div className="crbStep">
                <p className="crbStepTitle">What are you looking for?</p>
                <div className="crbTypeGrid">
                  {(["Character", "Weapon", "Interior", "Exterior", "AI Animation", "System", "Other"] as AssetType[]).map(t => (
                    <button
                      key={t}
                      className={`crbTypeBtn ${form.assetType === t ? "crbTypeBtnActive" : ""}`}
                      style={form.assetType === t ? { borderColor: ASSET_ACCENT[t] + "66", background: ASSET_ACCENT[t] + "10" } : {}}
                      onClick={() => setForm(f => ({ ...f, assetType: t, characterPack: "", weaponPack: "" }))}
                    >
                      <span className="crbTypeBtnIcon" style={form.assetType === t ? { color: ASSET_ACCENT[t] } : {}}>{ICONS[t]}</span>
                      <span className="crbTypeBtnLabel">{t}</span>
                      {ASSET_BASE_DISPLAY[t] && (
                        <span className="crbTypeBtnBase">{ASSET_BASE_DISPLAY[t]}</span>
                      )}
                      {t === "Character" && (
                        <span className="crbTypeBtnBase">from {fmt(CHARACTER_PACKS[0].price)}</span>
                      )}
                      {t === "Weapon" && (
                        <span className="crbTypeBtnBase">from {fmt(WEAPON_PACKS[0].price)}</span>
                      )}
                    </button>
                  ))}
                </div>
                <div className="crbNavRow">
                  <span />
                  <button
                    className={`crbNextBtn ${!form.assetType ? "crbNextBtnDisabled" : ""}`}
                    onClick={() => form.assetType && setStep(1)}
                    disabled={!form.assetType}
                  >
                    Next →
                  </button>
                </div>
              </div>
            )}

            {/* ── Step 1 — Details ── */}
            {step === 1 && (
              <div className="crbStep">
                <p className="crbStepTitle">Describe your {form.assetType?.toLowerCase()}</p>

                {/* Character packs */}
                {form.assetType === "Character" && (
                  <div className="crbField">
                    <label className="crbLabel">Character Pack</label>
                    <PackSelector<CharacterPack>
                      packs={CHARACTER_PACKS}
                      selected={form.characterPack}
                      onSelect={key => setForm(f => ({ ...f, characterPack: key }))}
                      accent={accent}
                    />
                  </div>
                )}

                {/* Weapon packs */}
                {form.assetType === "Weapon" && (
                  <div className="crbField">
                    <label className="crbLabel">Weapon Pack</label>
                    <PackSelector<WeaponPack>
                      packs={WEAPON_PACKS}
                      selected={form.weaponPack}
                      onSelect={key => setForm(f => ({ ...f, weaponPack: key }))}
                      accent={accent}
                    />
                  </div>
                )}

                <div className="crbField">
                  <label className="crbLabel">Description</label>
                  <textarea
                    className="crbTextarea"
                    placeholder={`Style, mood, use case for your ${form.assetType?.toLowerCase()}…`}
                    value={form.description}
                    maxLength={600}
                    rows={4}
                    onChange={e => setForm(f => ({ ...f, description: sanitize(e.target.value) }))}
                  />
                  <span className="crbCharCount">{form.description.length}/600</span>
                </div>

                <div className="crbField">
                  <label className="crbLabel">Reference link <span className="crbLabelNote">(optional)</span></label>
                  <input
                    className="crbInput"
                    type="text"
                    placeholder="ArtStation, Pinterest, Google Drive…"
                    value={form.reference}
                    onChange={e => setForm(f => ({ ...f, reference: sanitize(e.target.value) }))}
                  />
                </div>

                <div className="crbNavRow">
                  <button className="crbBackBtn" onClick={() => setStep(0)}>← Back</button>
                  <button
                    className={`crbNextBtn ${!isDetailsComplete() ? "crbNextBtnDisabled" : ""}`}
                    onClick={() => isDetailsComplete() && setStep(2)}
                    disabled={!isDetailsComplete()}
                  >
                    Next →
                  </button>
                </div>
              </div>
            )}

            {/* ── Step 2 — Delivery speed ── */}
            {step === 2 && (
              <div className="crbStep">
                <p className="crbStepTitle">How fast do you need it?</p>
                <div className="crbSpeedGrid">
                  {(["Standard", "Rush", "Urgent"] as DeliverySpeed[]).map(speed => {
                    const total = estimate !== null
                      ? Math.round(
                          (estimate / SPEED_MULTIPLIER[form.deliverySpeed as DeliverySpeed || "Standard"]) *
                          SPEED_MULTIPLIER[speed]
                        )
                      : null;
                    // Compute base for display regardless of current speed selection
                    let baseForSpeed = 0;
                    if (form.assetType === "Character") {
                      const pack = CHARACTER_PACKS.find(p => p.key === form.characterPack);
                      baseForSpeed = pack?.price ?? 0;
                    } else if (form.assetType === "Weapon") {
                      const pack = WEAPON_PACKS.find(p => p.key === form.weaponPack);
                      baseForSpeed = pack?.price ?? 0;
                    } else {
                      baseForSpeed = BASE_PRICE[form.assetType as AssetType] ?? 8000;
                    }
                    const displayTotal = Math.round(baseForSpeed * SPEED_MULTIPLIER[speed]);
                    return (
                      <button
                        key={speed}
                        className={`crbSpeedBtn ${form.deliverySpeed === speed ? "crbSpeedBtnActive" : ""}`}
                        onClick={() => setForm(f => ({ ...f, deliverySpeed: speed }))}
                      >
                        <span className="crbSpeedBtnIcon">
                          {speed === "Standard" ? (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                          ) : speed === "Rush" ? (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                          ) : (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>
                          )}
                        </span>
                        <span className="crbSpeedBtnLabel">{speed}</span>
                        <span className="crbSpeedBtnDelivery">{SPEED_DELIVERY[speed]}</span>
                        <span className="crbSpeedBtnPrice">{baseForSpeed > 0 ? fmt(displayTotal) : "—"}</span>
                        {speed === "Standard" && baseForSpeed > 0 && (
                          <span className="crbSpeedBtnFormula">{fmt(baseForSpeed)} base</span>
                        )}
                        {speed === "Rush" && baseForSpeed > 0 && (
                          <span className="crbSpeedBtnFormula">{fmt(baseForSpeed)} + {fmt(Math.round(baseForSpeed * 1.2))}</span>
                        )}
                        {speed === "Urgent" && baseForSpeed > 0 && (
                          <span className="crbSpeedBtnFormula">{fmt(baseForSpeed)} + {fmt(Math.round(baseForSpeed * 2.2))}</span>
                        )}
                        {speed !== "Standard" && (
                          <span className="crbSpeedBtnSurcharge">{SPEED_SURCHARGE_LABEL[speed]}</span>
                        )}
                      </button>
                    );
                  })}
                </div>
                <p className="crbPriceNote">⚠ Price can change once admin reviews the request.</p>
                <div className="crbNavRow">
                  <button className="crbBackBtn" onClick={() => setStep(1)}>← Back</button>
                  <button
                    className={`crbNextBtn ${!form.deliverySpeed ? "crbNextBtnDisabled" : ""}`}
                    onClick={() => form.deliverySpeed && setStep(3)}
                    disabled={!form.deliverySpeed}
                  >
                    Review →
                  </button>
                </div>
              </div>
            )}

            {/* ── Step 3 — Confirm ── */}
            {step === 3 && (
              <div className="crbStep">
                <p className="crbStepTitle">Review your request</p>

                <div className="crbSummary">
                  <div className="crbSummaryRow">
                    <span>Type</span><span>{form.assetType}</span>
                  </div>
                  {form.assetType === "Character" && form.characterPack && (
                    <div className="crbSummaryRow">
                      <span>Pack</span><span>{form.characterPack}</span>
                    </div>
                  )}
                  {form.assetType === "Weapon" && form.weaponPack && (
                    <div className="crbSummaryRow">
                      <span>Pack</span><span>{form.weaponPack}</span>
                    </div>
                  )}
                  <div className="crbSummaryRow">
                    <span>Description</span>
                    <span className="crbSummaryDesc">{form.description}</span>
                  </div>
                  {form.reference && (
                    <div className="crbSummaryRow">
                      <span>Reference</span><span className="crbSummaryRef">{form.reference}</span>
                    </div>
                  )}
                  <div className="crbSummaryRow">
                    <span>Delivery</span>
                    <span>{form.deliverySpeed} · {SPEED_DELIVERY[form.deliverySpeed as DeliverySpeed]}</span>
                  </div>
                  <div className="crbSummaryDivider" />
                  <div className="crbSummaryRow crbSummaryTotal">
                    <span>Estimated quote</span>
                    <span>{estimate ? fmt(estimate) : "—"}</span>
                  </div>
                  <p className="crbPriceNote crbPriceNoteConfirm">⚠ Price can change once admin reviews the request.</p>
                </div>

                {submitErr && <p className="crbSubmitErr">{submitErr}</p>}

                <div className="crbNavRow">
                  <button className="crbBackBtn" onClick={() => setStep(2)}>← Back</button>
                  <button
                    className={`crbSubmitBtn ${submitting ? "crbSubmitBtnLoading" : ""}`}
                    onClick={handleSubmit}
                    disabled={submitting}
                  >
                    {submitting ? "Sending…" : "Send Request →"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}