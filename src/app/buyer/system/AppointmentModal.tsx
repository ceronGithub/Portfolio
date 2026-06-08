// AppointmentModal.tsx — Schedule a consultation appointment for a system.
// Custom dark date picker (min: tomorrow, past dates grayed out).
// On submit: POST /api/appointments → save ticket → fire EmailJS to developer + buyer.
// Shows success state with reference number after confirmed.

"use client";

import { useState, useCallback } from "react";
import emailjs                   from "@emailjs/browser";
import "./appointment-modal.css";

/* ─── Types ──────────────────────────────────────────────────────── */
interface AddonSnapshot { id: string; label: string; price: number; }

interface SystemItem {
  id:          string;
  name:        string;
  tag:         string;
  accent:      string;
  basePrice:   number;
  timeline:    string;
  description: string;
}

interface Props {
  item:           SystemItem;
  totalPrice:     number;
  buyerEmail:     string;
  buyerName:      string;
  selectedAddons: AddonSnapshot[];
  onClose:        () => void;
}

/* ─── Helpers ────────────────────────────────────────────────────── */
const fmt = (p: number) =>
  "₱" + p.toLocaleString("en-PH", { minimumFractionDigits: 0 });

// Returns YYYY-MM-DD string for a Date
function toDateString(d: Date): string {
  return d.toISOString().slice(0, 10);
}

// Returns tomorrow as a Date (midnight local)
function getTomorrow(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 1);
  return d;
}

// Format display date: "June 10, 2026"
function formatDisplayDate(iso: string): string {
  const [year, month, day] = iso.split("-").map(Number);
  const d = new Date(year, month - 1, day);
  return d.toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" });
}

/* ─── Custom Date Picker ─────────────────────────────────────────── */
// Renders a full month calendar grid. Past dates and today are grayed/disabled.
// No max limit — buyer can pick any future date.

const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];
const DAY_LABELS = ["Su","Mo","Tu","We","Th","Fr","Sa"];

function DatePicker({
  value, onChange, accent,
}: {
  value:    string;    // YYYY-MM-DD or ""
  onChange: (iso: string) => void;
  accent:   string;
}) {
  const tomorrow = getTomorrow();

  // Calendar view state — defaults to tomorrow's month
  const [viewYear,  setViewYear]  = useState(tomorrow.getFullYear());
  const [viewMonth, setViewMonth] = useState(tomorrow.getMonth()); // 0-indexed

  // Go to previous month — cannot go before tomorrow's month
  function prevMonth() {
    const minYear  = tomorrow.getFullYear();
    const minMonth = tomorrow.getMonth();
    if (viewYear === minYear && viewMonth === minMonth) return; // already at min
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  }

  // Go to next month — no limit
  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  }

  // Build calendar days for the current view month
  function buildDays(): (number | null)[] {
    const firstDay = new Date(viewYear, viewMonth, 1).getDay(); // 0=Sun
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const cells: (number | null)[] = Array(firstDay).fill(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    // Pad to full rows
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }

  function isDisabled(day: number): boolean {
    // Compare as YYYY-MM-DD strings to avoid any timezone offset issues
    const cellIso = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const tomorrowIso = toDateString(tomorrow);
    return cellIso < tomorrowIso;
  }

  function isSelected(day: number): boolean {
    if (!value) return false;
    return value === `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }

  function handleSelect(day: number) {
    if (isDisabled(day)) return;
    const iso = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    onChange(iso);
  }

  const isPrevDisabled =
    viewYear === tomorrow.getFullYear() && viewMonth === tomorrow.getMonth();

  return (
    <div className="apDatePicker">
      {/* Month navigation */}
      <div className="apDatePickerHeader">
        <button
          className="apDatePickerNav"
          onClick={prevMonth}
          disabled={isPrevDisabled}
          type="button"
          aria-label="Previous month"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>
        <span className="apDatePickerMonthLabel">
          {MONTH_NAMES[viewMonth]} {viewYear}
        </span>
        <button
          className="apDatePickerNav"
          onClick={nextMonth}
          type="button"
          aria-label="Next month"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </button>
      </div>

      {/* Day headers */}
      <div className="apDatePickerGrid">
        {DAY_LABELS.map(d => (
          <span key={d} className="apDatePickerDayLabel">{d}</span>
        ))}

        {/* Calendar cells */}
        {buildDays().map((day, idx) => {
          if (!day) return <span key={idx} className="apDatePickerCell apDatePickerCellEmpty" />;
          const disabled  = isDisabled(day);
          const selected  = isSelected(day);
          return (
            <button
              key={idx}
              type="button"
              className={
                "apDatePickerCell apDatePickerCellDay" +
                (disabled ? " apDatePickerCellDisabled" : "") +
                (selected  ? " apDatePickerCellSelected" : "")
              }
              style={selected ? { background: accent, borderColor: accent, color: "#000" } : {}}
              onClick={() => handleSelect(day)}
              disabled={disabled}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Main Modal ─────────────────────────────────────────────────── */
export default function AppointmentModal({ item, totalPrice, buyerEmail, buyerName, selectedAddons, onClose }: Props) {
  const [message,       setMessage]       = useState("");
  const [scheduledDate, setScheduledDate] = useState(toDateString(getTomorrow()));
  const [submitting,    setSubmitting]    = useState(false);
  const [referenceNo,   setReferenceNo]   = useState<string | null>(null);
  const [errorMsg,      setErrorMsg]      = useState("");

  // ── Submit — POST to API then fire EmailJS ────────────────────────
  async function handleSubmit() {
    if (!scheduledDate) { setErrorMsg("Please select a date."); return; }
    if (submitting) return;
    setSubmitting(true);
    setErrorMsg("");

    try {
      // 1. Create appointment ticket
      const res  = await fetch("/api/appointments", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemId:      item.id,
          systemTitle:   item.name,
          basePrice:     item.basePrice,
          selectedAddons,
          quotedPrice:   totalPrice,
          scheduledDate,
          message:       message || null,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Failed to submit appointment.");
      }

      const data = await res.json();
      const ref  = data.referenceNo as string;

      // 2. Build add-ons text for email
      const addonsText = selectedAddons.length > 0
        ? selectedAddons.map(a => `• ${a.label} — ${fmt(a.price)}`).join("<br/>")
        : "None selected";

      // 3. Build shared template params — uses systemproducts template (template_ija0n6t)
      const emailParams = {
        subject_line:  `Appointment Request: ${item.name} — ${fmt(totalPrice)}`,
        title:         item.name,
        buyer_name:    buyerName,
        detail_1:      formatDisplayDate(scheduledDate),
        detail_2:      addonsText,
        quoted_price:  fmt(totalPrice),
        reference_no:  ref,
        buyer_email:   buyerEmail,
        cc_email:      "developerceron@gmail.com",
      };

      // 4. Send to developer — CC developer as well for paper trail
      await emailjs.send(
        process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID!,
        process.env.NEXT_PUBLIC_EMAILJS_CUSTOM_REQUEST_TEMPLATE_ID!,
        emailParams,
        process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY!,
      ).catch(() => {}); // silent fail

      setReferenceNo(ref);
    } catch (err: any) {
      setErrorMsg(err.message ?? "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  // ── Success state ─────────────────────────────────────────────────
  if (referenceNo) {
    return (
      <div className="apModalOverlay" onClick={onClose}>
        <div className="apModal" onClick={e => e.stopPropagation()}>
          <div className="apModalSuccess">
            {/* Check icon */}
            <div className="apSuccessIcon" style={{ borderColor: item.accent + "55", background: item.accent + "12" }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={item.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>

            <p className="apSuccessLabel" style={{ color: item.accent }}>Appointment Requested</p>
            <p className="apSuccessTitle">We'll see you soon.</p>
            <p className="apSuccessSub">
              Your consultation for <strong>{item.name}</strong> has been submitted.
              The developer will reach out within the day to confirm your VC schedule.
            </p>

            {/* Reference number */}
            <div className="apSuccessRef">
              <span className="apSuccessRefLabel">Reference No.</span>
              <span className="apSuccessRefNo" style={{ color: item.accent }}>{referenceNo}</span>
            </div>

            {/* Date */}
            <div className="apSuccessDate">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.4 }}>
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
              <span>Preferred date — {formatDisplayDate(scheduledDate)}</span>
            </div>

            {/* Note */}
            <p className="apSuccessNote">
              30% downpayment is only due after the developer delivers the front-end prototype —
              so you can see and feel it before committing further.
            </p>

            <button className="apSuccessClose" onClick={onClose}>Close</button>
          </div>
        </div>
      </div>
    );
  }

  // ── Form state ────────────────────────────────────────────────────
  return (
    <div className="apModalOverlay" onClick={onClose}>
      <div className="apModal" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="apModalHeader">
          <div className="apModalHeaderLeft">
            <span className="apModalTag" style={{ color: item.accent, borderColor: item.accent + "44", background: item.accent + "12" }}>
              {item.tag}
            </span>
            <p className="apModalTitle">Schedule Appointment</p>
          </div>
          <button className="apModalClose" onClick={onClose} type="button">✕</button>
        </div>

        {/* System summary */}
        <div className="apModalSummary" style={{ borderColor: item.accent + "22" }}>
          <div className="apModalSummaryRow">
            <span className="apModalSummarySystem">{item.name}</span>
            <span className="apModalSummaryPrice" style={{ color: item.accent }}>{fmt(totalPrice)}</span>
          </div>
          {selectedAddons.length > 0 && (
            <div className="apModalAddons">
              {selectedAddons.map(a => (
                <div key={a.id} className="apModalAddonRow">
                  <span>+ {a.label}</span>
                  <span style={{ color: "#22c55e" }}>+{fmt(a.price)}</span>
                </div>
              ))}
            </div>
          )}
          <p className="apModalSummaryNote">
            A VC will be scheduled to discuss everything in detail before any payment is made.
          </p>
        </div>

        {/* Date picker */}
        <div className="apModalSection">
          <p className="apModalSectionLabel">Preferred VC Date</p>
          <p className="apModalSectionSub">Earliest available is tomorrow. Pick any date that works for you.</p>
          <DatePicker
            value={scheduledDate}
            onChange={setScheduledDate}
            accent={item.accent}
          />
          {scheduledDate && (
            <p className="apModalDateSelected" style={{ color: item.accent }}>
              Selected: {formatDisplayDate(scheduledDate)}
            </p>
          )}
        </div>

        {/* Optional message */}
        <div className="apModalSection">
          <p className="apModalSectionLabel">Additional Notes <span className="apModalOptional">(optional)</span></p>
          <textarea
            className="apModalTextarea"
            placeholder="Anything specific you'd like to discuss in the VC…"
            value={message}
            onChange={e => setMessage(e.target.value)}
            rows={3}
          />
        </div>

        {/* 30% DP note */}
        <div className="apModalDpNote">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}>
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <span>
            30% downpayment is only due after the developer delivers the front-end prototype —
            not before. You see it, you like it, then you decide.
          </span>
        </div>

        {/* Error */}
        {errorMsg && <p className="apModalError">{errorMsg}</p>}

        {/* Submit */}
        <button
          className={"apModalSubmit" + (submitting ? " apModalSubmitLoading" : "")}
          onClick={handleSubmit}
          disabled={submitting || !scheduledDate}
          type="button"
        >
          {submitting ? "Submitting…" : "Send Appointment Request"}
        </button>

      </div>
    </div>
  );
}
