// CustomRequestBuilder.tsx — Multi-step custom project request form.
// Step 1: Asset type  Step 2: Style details  Step 3: Delivery  Step 4: Confirm

"use client";

import { useState } from "react";
import "./custom-request-builder.css";
import { sanitize } from "@/lib/utils";

type AssetType     = "Character" | "Weapon" | "System" | "Other";
type PolyBudget    = "Low (game-ready)" | "Mid (cinematic)" | "High (hero asset)";
type DeliverySpeed = "Standard" | "Rush" | "Urgent";

interface FormState {
  assetType:     AssetType | "";
  description:   string;
  animCount:     number;
  polyBudget:    PolyBudget | "";
  reference:     string;
  deliverySpeed: DeliverySpeed | "";
}

const BASE_PRICE: Record<AssetType, number> = {
  Character: 5500, Weapon: 3500, System: 33000, Other: 8000,
};

const SPEED_MULTIPLIER: Record<DeliverySpeed, number> = {
  Standard: 1.0, Rush: 1.25, Urgent: 1.55,
};

const SPEED_DELIVERY: Record<DeliverySpeed, string> = {
  Standard: "4–6 weeks", Rush: "2–3 weeks", Urgent: "1–2 weeks",
};

const ANIM_PRICE_PER_EXTRA = 800;

function calcEstimate(form: FormState): number | null {
  if (!form.assetType || !form.deliverySpeed) return null;
  const base      = BASE_PRICE[form.assetType as AssetType];
  const animExtra = Math.max(0, form.animCount - 3) * ANIM_PRICE_PER_EXTRA;
  const speedMult = SPEED_MULTIPLIER[form.deliverySpeed as DeliverySpeed];
  return Math.round((base + animExtra) * speedMult);
}

function fmt(p: number) {
  return "₱" + p.toLocaleString("en-PH", { minimumFractionDigits: 0 });
}

// ── SVG icon set — monochrome line art ────────────────────────────────────
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

// ── Main export ────────────────────────────────────────────────────────────
export default function CustomRequestBuilder() {
  const [step,       setStep]       = useState(0);
  const [form,       setForm]       = useState<FormState>({
    assetType: "", description: "", animCount: 3, polyBudget: "", reference: "", deliverySpeed: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted,  setSubmitted]  = useState(false);
  const [submitErr,  setSubmitErr]  = useState("");

  const estimate = calcEstimate(form);

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
          animCount:      form.animCount,
          polyBudget:     form.polyBudget || null,
          reference:      form.reference  || null,
          deliverySpeed:  form.deliverySpeed,
          estimatedQuote: estimate,
        }),
      });
      if (res.status === 201 || res.status === 200) {
        setSubmitted(true);
      } else {
        const data = await res.json().catch(() => ({}));
        setSubmitErr(data.error ?? "Something went wrong. Try again.");
      }
    } catch {
      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  }

  function reset() {
    setSubmitted(false); setStep(0);
    setForm({ assetType: "", description: "", animCount: 3, polyBudget: "", reference: "", deliverySpeed: "" });
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
            {" "}I'll reply within 24 hours.
          </p>
          <button className="crbSuccessReset" onClick={reset}>Submit another</button>
        </div>
      </section>
    );
  }

  return (
    <section className="crbSection">
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

            {/* Step 0 — Asset type */}
            {step === 0 && (
              <div className="crbStep">
                <p className="crbStepTitle">What are you looking for?</p>
                <div className="crbTypeGrid">
                  {(["Character", "Weapon", "System", "Other"] as AssetType[]).map(t => (
                    <button
                      key={t}
                      className={`crbTypeBtn ${form.assetType === t ? "crbTypeBtnActive" : ""}`}
                      onClick={() => setForm(f => ({ ...f, assetType: t }))}
                    >
                      <span className="crbTypeBtnIcon">{ICONS[t]}</span>
                      <span className="crbTypeBtnLabel">{t}</span>
                      {t !== "Other" && (
                        <span className="crbTypeBtnBase">from {fmt(BASE_PRICE[t])}</span>
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

            {/* Step 1 — Details */}
            {step === 1 && (
              <div className="crbStep">
                <p className="crbStepTitle">Describe your {form.assetType?.toLowerCase()}</p>

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

                {(form.assetType === "Character" || form.assetType === "Weapon") && (
                  <>
                    <div className="crbField">
                      <label className="crbLabel">
                        Animations
                        <span className="crbLabelNote"> — 3 base, +{fmt(ANIM_PRICE_PER_EXTRA)} each extra</span>
                      </label>
                      <div className="crbCounterRow">
                        <button className="crbCounterBtn" onClick={() => setForm(f => ({ ...f, animCount: Math.max(1, f.animCount - 1) }))}>−</button>
                        <span className="crbCounterVal">{form.animCount}</span>
                        <button className="crbCounterBtn" onClick={() => setForm(f => ({ ...f, animCount: Math.min(20, f.animCount + 1) }))}>+</button>
                      </div>
                    </div>

                    <div className="crbField">
                      <label className="crbLabel">Poly budget</label>
                      <div className="crbPolyRow">
                        {(["Low (game-ready)", "Mid (cinematic)", "High (hero asset)"] as PolyBudget[]).map(p => (
                          <button
                            key={p}
                            className={`crbPolyBtn ${form.polyBudget === p ? "crbPolyBtnActive" : ""}`}
                            onClick={() => setForm(f => ({ ...f, polyBudget: p }))}
                          >
                            {p}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}

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
                    className={`crbNextBtn ${!form.description ? "crbNextBtnDisabled" : ""}`}
                    onClick={() => form.description && setStep(2)}
                    disabled={!form.description}
                  >
                    Next →
                  </button>
                </div>
              </div>
            )}

            {/* Step 2 — Delivery speed */}
            {step === 2 && (
              <div className="crbStep">
                <p className="crbStepTitle">How fast do you need it?</p>
                <div className="crbSpeedGrid">
                  {(["Standard", "Rush", "Urgent"] as DeliverySpeed[]).map(speed => {
                    const base  = form.assetType ? BASE_PRICE[form.assetType as AssetType] : 0;
                    const extra = Math.max(0, form.animCount - 3) * ANIM_PRICE_PER_EXTRA;
                    const total = Math.round((base + extra) * SPEED_MULTIPLIER[speed]);
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
                        <span className="crbSpeedBtnPrice">{form.assetType ? fmt(total) : "—"}</span>
                        {speed !== "Standard" && (
                          <span className="crbSpeedBtnSurcharge">+{Math.round((SPEED_MULTIPLIER[speed] - 1) * 100)}% surcharge</span>
                        )}
                      </button>
                    );
                  })}
                </div>
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

            {/* Step 3 — Confirm */}
            {step === 3 && (
              <div className="crbStep">
                <p className="crbStepTitle">Review your request</p>

                <div className="crbSummary">
                  <div className="crbSummaryRow">
                    <span>Type</span><span>{form.assetType}</span>
                  </div>
                  <div className="crbSummaryRow">
                    <span>Description</span>
                    <span className="crbSummaryDesc">{form.description}</span>
                  </div>
                  {(form.assetType === "Character" || form.assetType === "Weapon") && (
                    <>
                      <div className="crbSummaryRow">
                        <span>Animations</span><span>{form.animCount}</span>
                      </div>
                      <div className="crbSummaryRow">
                        <span>Poly budget</span><span>{form.polyBudget || "—"}</span>
                      </div>
                    </>
                  )}
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