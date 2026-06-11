"use client";
// buyer/maintenance/MaintenanceClient.tsx
// Shows package selection if no active order, or the full maintenance portal.
// Tabs: Tasks | Bug Reports | VC Schedule

import { useState, useEffect, useCallback } from "react";
import { sanitize }                          from "@/lib/utils";
import "./maintenance.css";

// ── Types ────────────────────────────────────────────────────────────────────
type Pkg = "BASIC" | "PRIORITY" | "FULL";

interface VCSchedule {
  id: string; initiator: string; buyerName: string; buyerPhone: string;
  preferredDate: string; confirmedDate?: string; status: string; adminNote?: string;
  createdAt: string;
}

interface BugReport {
  id: string; title: string; description: string; category?: string;
  status: string; adminNote?: string; isExtraCharge: boolean;
  extraChargeAmount?: number; createdAt: string;
}

interface Task {
  id: string; title: string; description?: string; type: string;
  status: string; createdAt: string; completedAt?: string;
}

interface MaintenanceOrder {
  id: string; package: Pkg; status: string; bugsUsed: number;
  revisionsUsed: number; startedAt: string; expiresAt: string;
  vcSchedules: VCSchedule[]; bugReports: BugReport[]; tasks: Task[];
}

// ── Package Config ────────────────────────────────────────────────────────────
const PKG_CONFIG: Record<Pkg, {
  name: string; price: string; bugLimit: number; revisionLimit: number;
  popular?: boolean;
  features: { label: string; included: boolean }[];
}> = {
  BASIC: {
    name: "Basic", price: "₱4,500", bugLimit: 3, revisionLimit: 2,
    features: [
      { label: "3 bug reports/month (Minor only)", included: true },
      { label: "2 revision updates/month",         included: true },
      { label: "Monthly health check",             included: true },
      { label: "Immediate response",               included: true },
      { label: "Security patches",                 included: false },
      { label: "Performance monitoring",           included: false },
      { label: "Database backups",                 included: false },
    ],
  },
  PRIORITY: {
    name: "Priority Support", price: "₱8,500", bugLimit: 5, revisionLimit: 4,
    popular: true,
    features: [
      { label: "5 bug reports/month (Minor + Moderate)", included: true },
      { label: "4 revision updates/month",               included: true },
      { label: "Monthly health check",                   included: true },
      { label: "Immediate response",                     included: true },
      { label: "Security patches",                       included: true },
      { label: "Performance monitoring",                 included: true },
      { label: "Database backups",                       included: true },
    ],
  },
  FULL: {
    name: "Full Maintenance", price: "₱15,000", bugLimit: 8, revisionLimit: 6,
    features: [
      { label: "8 bug reports/month (All categories)", included: true },
      { label: "6 revision updates/month",             included: true },
      { label: "Monthly health check",                 included: true },
      { label: "Priority response (first in queue)",   included: true },
      { label: "Security patches",                     included: true },
      { label: "Performance monitoring",               included: true },
      { label: "Database backups",                     included: true },
    ],
  },
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmt(d: string) {
  return new Date(d).toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" });
}

function fmtTime(d: string) {
  return new Date(d).toLocaleString("en-PH", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

function usageClass(used: number, limit: number) {
  const pct = used / limit;
  if (pct >= 1)   return "full";
  if (pct >= 0.7) return "warn";
  return "";
}

// ── Package Selection ─────────────────────────────────────────────────────────
function PackageSelection() {
  const [loading, setLoading] = useState<Pkg | null>(null);
  const [error, setError]     = useState("");

  // Redirects buyer to PayMongo checkout for the selected maintenance package.
  async function avail(pkg: Pkg) {
    setLoading(pkg);
    setError("");
    try {
      const res = await fetch("/api/maintenance/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packageType: pkg }),
      });
      const data = await res.json();
      if (res.ok && data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        setError(data.error ?? "Something went wrong.");
      }
    } catch { setError("Network error. Please try again."); }
    finally { setLoading(null); }
  }

  return (
    <>
      <div className="mxHeader">
        <p className="mxEyebrow">After Delivery</p>
        <h1 className="mxTitle">Maintenance & Support</h1>
        <p className="mxSub">Keep your system running at peak performance. Choose a package below.</p>
      </div>
      {error && <div className="mxError">{error}</div>}
      <div className="mxPackageGrid">
        {(["BASIC", "PRIORITY", "FULL"] as Pkg[]).map(pkg => {
          const c = PKG_CONFIG[pkg];
          return (
            <div key={pkg} className={`mxPackageCard${c.popular ? " popular" : ""}`}>
              {c.popular && <span className="mxPopularBadge">Most Popular</span>}
              <p className="mxPackageName">{c.name}</p>
              <p className="mxPackagePrice">{c.price} <span>/month</span></p>
              <ul className="mxPackageFeatures">
                {c.features.map(f => (
                  <li key={f.label}>
                    {f.included
                      ? <span className="mxCheck">✓</span>
                      : <span className="mxDisabled">—</span>}
                    {f.label}
                  </li>
                ))}
              </ul>
              <button
                className="mxAvailBtn"
                disabled={loading !== null}
                onClick={() => avail(pkg)}
              >
                {loading === pkg ? "Redirecting…" : "Avail Package"}
              </button>
            </div>
          );
        })}
      </div>

      {/* Disclaimer */}
      <div className="mxDisclaimer">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
          <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke="#f59e0b" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          <line x1="12" y1="9" x2="12" y2="13" stroke="#f59e0b" strokeWidth="1.8" strokeLinecap="round"/>
          <line x1="12" y1="17" x2="12.01" y2="17" stroke="#f59e0b" strokeWidth="2.2" strokeLinecap="round"/>
        </svg>
        <span>
          Maintenance does <strong>not</strong> include major new features.{" "}
          <strong>New features are scoped and quoted separately as a new project.</strong>
        </span>
      </div>
    </>
  );
}

// ── Task List Tab ─────────────────────────────────────────────────────────────
function TasksTab({ tasks }: { tasks: Task[] }) {
  if (!tasks.length) return <div className="mxEmpty">No tasks yet. Admin will log work here after your VC call.</div>;
  return (
    <div className="mxTaskList">
      {tasks.map(t => (
        <div key={t.id} className="mxTaskCard">
          <div className={`mxTaskStatus ${t.status}`} />
          <div className="mxTaskBody">
            <p className="mxTaskTitle">{t.title}</p>
            {t.description && <p className="mxTaskDesc">{t.description}</p>}
            <div className="mxTaskMeta">
              <span className="mxTaskType">{t.type}</span>
              <span className="mxTaskDate">{fmt(t.createdAt)}</span>
              {t.completedAt && <span className="mxTaskDate">✓ Done {fmt(t.completedAt)}</span>}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Bug Reports Tab ───────────────────────────────────────────────────────────
function BugsTab({ bugReports, bugLimit, bugsUsed }: { bugReports: BugReport[]; bugLimit: number; bugsUsed: number }) {
  const [title, setTitle]       = useState("");
  const [desc, setDesc]         = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [bugs, setBugs]         = useState(bugReports);
  const [used, setUsed]         = useState(bugsUsed);

  async function submit() {
    if (!title.trim() || !desc.trim()) { setError("Title and description are required."); return; }
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/maintenance/bugs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description: desc }),
      });
      const data = await res.json();
      if (res.ok) {
        if (data.bugReport) setBugs(prev => [data.bugReport, ...prev]);
        setUsed(prev => prev + 1);
        setTitle(""); setDesc("");
      } else setError(data.error ?? "Something went wrong.");
    } catch { setError("Network error."); }
    finally { setLoading(false); }
  }

  return (
    <>
      {used < bugLimit && (
        <div className="mxBugForm">
          <p className="mxBugFormTitle">Report a Bug ({used}/{bugLimit} used)</p>
          <input
            className="mxInput" placeholder="Bug title — brief description"
            value={title} onChange={e => setTitle(sanitize(e.target.value))}
          />
          <textarea
            className="mxInput" rows={3}
            placeholder="Describe the issue in detail — what happened, when, what page/feature?"
            value={desc} onChange={e => setDesc(sanitize(e.target.value))}
          />
          {error && <div className="mxError">{error}</div>}
          <button className="mxSubmitBtn" onClick={submit} disabled={loading}>
            {loading ? "Submitting…" : "Submit Bug Report"}
          </button>
        </div>
      )}
      {used >= bugLimit && (
        <div className="mxError" style={{ marginBottom: "1.25rem" }}>
          You have reached your monthly bug limit ({bugLimit}). Contact admin for additional fixes.
        </div>
      )}
      {!bugs.length
        ? <div className="mxEmpty">No bug reports submitted yet.</div>
        : bugs.filter(b => b?.id).map(b => (
          <div key={b.id} className="mxBugCard">
            <div className="mxBugHeader">
              <p className="mxBugTitle">{b.title}</p>
              <span className={`mxBugStatus ${b.status}`}>{b.status.replace("_", " ")}</span>
            </div>
            <p className="mxBugDesc">{b.description}</p>
            <div className="mxBugMeta">
              {b.category && <span className={`mxBugCategory ${b.category}`}>{b.category}</span>}
              <span style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.2)" }}>{fmt(b.createdAt)}</span>
              {b.isExtraCharge && b.extraChargeAmount && (
                <span style={{ fontSize: "0.75rem", color: "#ef4444" }}>
                  Extra charge: ₱{b.extraChargeAmount.toLocaleString()}
                </span>
              )}
            </div>
            {b.adminNote && <p className="mxBugAdminNote">Admin note: {b.adminNote}</p>}
          </div>
        ))
      }
    </>
  );
}

// ── VC Schedule Tab ───────────────────────────────────────────────────────────
// Custom calendar: month view → select day → pick available hourly time slot.
// Fetches booked slots from DB on mount and on month change; grays out occupied hours.

const VC_HOURS = [8,9,10,11,12,13,14,15,16,17]; // 8 AM – 5 PM

function fmtHour(h: number) {
  if (h === 12) return "12:00 PM";
  return h < 12 ? `${h}:00 AM` : `${h - 12}:00 PM`;
}

function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() &&
         a.getMonth()    === b.getMonth()    &&
         a.getDate()     === b.getDate();
}

function VCTab({ vcSchedules, pkg }: { vcSchedules: VCSchedule[]; pkg: Pkg }) {
  const today = new Date();
  today.setHours(0,0,0,0);

  const [name, setName]           = useState("");
  const [phone, setPhone]         = useState("");
  const [viewYear, setViewYear]   = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [selectedHour, setSelectedHour] = useState<number | null>(null);
  const [bookedSlots, setBookedSlots]   = useState<Date[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting]     = useState(false);
  const [error, setError]               = useState("");
  const [schedules, setSchedules]       = useState(vcSchedules);

  // Fetch booked slots whenever the viewed month changes
  const fetchBookedSlots = useCallback(async () => {
    setLoadingSlots(true);
    try {
      const res  = await fetch("/api/maintenance/vc/booked-slots");
      const data = await res.json();
      if (res.ok) setBookedSlots((data.bookedSlots ?? []).map((s: { date: string }) => new Date(s.date)));
    } catch { /* fail silently */ }
    finally { setLoadingSlots(false); }
  }, []);

  useEffect(() => { fetchBookedSlots(); }, [fetchBookedSlots]);

  // Check if a given day+hour is already booked
  function isHourBooked(day: Date, hour: number) {
    return bookedSlots.some(b => sameDay(b, day) && b.getHours() === hour);
  }

  // Check if a day has all slots fully booked
  function isDayFullyBooked(day: Date) {
    return VC_HOURS.every(h => isHourBooked(day, h));
  }

  // Build calendar grid for viewed month
  function buildCalendarDays() {
    const firstDay = new Date(viewYear, viewMonth, 1).getDay(); // 0=Sun
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const cells: (Date | null)[] = [];
    for (let i = 0; i < firstDay; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(viewYear, viewMonth, d));
    return cells;
  }

  function prevMonth() {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
    else setViewMonth(m => m - 1);
    setSelectedDay(null); setSelectedHour(null);
  }

  function nextMonth() {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
    else setViewMonth(m => m + 1);
    setSelectedDay(null); setSelectedHour(null);
  }

  async function submit() {
    if (!name.trim() || !phone.trim() || !selectedDay || selectedHour === null) {
      setError("All fields are required."); return;
    }
    const preferredDate = new Date(selectedDay);
    preferredDate.setHours(selectedHour, 0, 0, 0);

    setSubmitting(true); setError("");
    try {
      const res = await fetch("/api/maintenance/vc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ buyerName: name, buyerPhone: phone, preferredDate: preferredDate.toISOString() }),
      });
      const data = await res.json();
      if (res.ok) {
        setSchedules(prev => [data.schedule, ...prev]);
        // Mark the slot as booked immediately in local state
        setBookedSlots(prev => [...prev, preferredDate]);
        setName(""); setPhone(""); setSelectedDay(null); setSelectedHour(null);
      } else setError(data.error ?? "Something went wrong.");
    } catch { setError("Network error."); }
    finally { setSubmitting(false); }
  }

  const MONTH_NAMES = ["January","February","March","April","May","June",
                       "July","August","September","October","November","December"];
  const DAY_LABELS  = ["Su","Mo","Tu","We","Th","Fr","Sa"];
  const calDays     = buildCalendarDays();

  return (
    <>
      <div className="mxVCForm">
        <p className="mxVCFormTitle">Schedule a VC Call</p>
        <input
          className="mxInput" placeholder="Your name"
          value={name} onChange={e => setName(sanitize(e.target.value))}
        />
        <input
          className="mxInput" placeholder="Phone number"
          value={phone} onChange={e => setPhone(sanitize(e.target.value))}
        />

        {/* ── Custom Calendar ── */}
        <div className="mxCalendar">
          <div className="mxCalHeader">
            <button className="mxCalNav" onClick={prevMonth}>‹</button>
            <span className="mxCalMonth">{MONTH_NAMES[viewMonth]} {viewYear}</span>
            <button className="mxCalNav" onClick={nextMonth}>›</button>
          </div>

          <div className="mxCalGrid">
            {DAY_LABELS.map(d => (
              <div key={d} className="mxCalDayLabel">{d}</div>
            ))}
            {calDays.map((day, i) => {
              if (!day) return <div key={`empty-${i}`} />;
              const isPast      = day < today;
              const isFullyBooked = !isPast && isDayFullyBooked(day);
              const isSelected  = selectedDay ? sameDay(day, selectedDay) : false;
              const isToday     = sameDay(day, new Date());
              let cls = "mxCalDay";
              if (isPast)        cls += " past";
              else if (isFullyBooked) cls += " fullyBooked";
              else if (isSelected)    cls += " selected";
              else if (isToday)       cls += " today";
              return (
                <button
                  key={day.toISOString()}
                  className={cls}
                  disabled={isPast || isFullyBooked || loadingSlots}
                  onClick={() => { setSelectedDay(day); setSelectedHour(null); }}
                >
                  {day.getDate()}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Time Slot Picker ── */}
        {selectedDay && (
          <div className="mxTimeSlots">
            <p className="mxTimeSlotsTitle">
              Available times — {selectedDay.toLocaleDateString("en-PH", { weekday: "short", month: "short", day: "numeric" })}
            </p>
            <div className="mxTimeGrid">
              {VC_HOURS.map(h => {
                const booked   = isHourBooked(selectedDay, h);
                const isChosen = selectedHour === h;
                return (
                  <button
                    key={h}
                    className={`mxTimeSlot${booked ? " booked" : ""}${isChosen ? " chosen" : ""}`}
                    disabled={booked}
                    onClick={() => setSelectedHour(h)}
                  >
                    {fmtHour(h)}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {selectedDay && selectedHour !== null && (
          <p className="mxSelectedSummary">
            📅 {selectedDay.toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })} at {fmtHour(selectedHour)}
          </p>
        )}

        <p style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.25)", margin: 0 }}>
          Package: <strong style={{ color: "rgba(255,255,255,0.5)" }}>{PKG_CONFIG[pkg].name}</strong>
        </p>
        {error && <div className="mxError">{error}</div>}
        <button
          className="mxSubmitBtn"
          onClick={submit}
          disabled={submitting || !selectedDay || selectedHour === null}
        >
          {submitting ? "Scheduling…" : "Request Call"}
        </button>
      </div>

      {!schedules.length
        ? <div className="mxEmpty">No VC calls scheduled yet.</div>
        : schedules.filter(s => s?.id).map(s => (
          <div key={s.id} className="mxVCCard">
            <div className="mxVCInfo">
              <p className="mxVCDate">
                {s.confirmedDate
                  ? `Confirmed: ${fmtTime(s.confirmedDate)}`
                  : `Requested: ${fmtTime(s.preferredDate)}`}
              </p>
              <p className="mxVCMeta">
                {s.buyerName} · {s.buyerPhone}
                {s.initiator === "ADMIN" ? " · Scheduled by admin" : ""}
                {s.adminNote ? ` · ${s.adminNote}` : ""}
              </p>
            </div>
            <span className={`mxVCStatus ${s.status}`}>{s.status}</span>
          </div>
        ))
      }
    </>
  );
}

// ── Active Order View ─────────────────────────────────────────────────────────
function ActiveOrder({ order }: { order: MaintenanceOrder }) {
  const [tab, setTab] = useState<"tasks" | "bugs" | "vc">("tasks");
  const cfg           = PKG_CONFIG[order.package];

  const bugPct = order.bugsUsed / cfg.bugLimit * 100;
  const revPct = order.revisionsUsed / cfg.revisionLimit * 100;

  return (
    <>
      <div className="mxHeader">
        <p className="mxEyebrow">After Delivery</p>
        <h1 className="mxTitle">Maintenance & Support</h1>
      </div>
      <div className="mxActiveGrid">
        {/* Left — Package Status */}
        <div className="mxStatusCard">
          <div className="mxStatusBadge"><span className="mxStatusDot" /> Active</div>
          <p className="mxPackageTitle">{cfg.name}</p>
          <p className="mxPackageSubtitle">{cfg.price}/month</p>

          <div className="mxUsageRow">
            <div className="mxUsageItem">
              <span className="mxUsageLabel">Bug reports</span>
              <span className={`mxUsageCount ${usageClass(order.bugsUsed, cfg.bugLimit)}`}>
                {order.bugsUsed}/{cfg.bugLimit}
              </span>
            </div>
            <div className="mxProgressBar">
              <div
                className={`mxProgressFill ${usageClass(order.bugsUsed, cfg.bugLimit)}`}
                style={{ width: `${Math.min(bugPct, 100)}%` }}
              />
            </div>

            <div className="mxUsageItem">
              <span className="mxUsageLabel">Revisions</span>
              <span className={`mxUsageCount ${usageClass(order.revisionsUsed, cfg.revisionLimit)}`}>
                {order.revisionsUsed}/{cfg.revisionLimit}
              </span>
            </div>
            <div className="mxProgressBar">
              <div
                className={`mxProgressFill ${usageClass(order.revisionsUsed, cfg.revisionLimit)}`}
                style={{ width: `${Math.min(revPct, 100)}%` }}
              />
            </div>
          </div>

          <p className="mxExpiry">
            Active since {fmt(order.startedAt)}<br />
            Expires {fmt(order.expiresAt)}
          </p>
        </div>

        {/* Right — Tabs */}
        <div>
          <div className="mxTabs">
            <button className={`mxTab${tab === "tasks" ? " active" : ""}`} onClick={() => setTab("tasks")}>
              Tasks ({order.tasks.length})
            </button>
            <button className={`mxTab${tab === "bugs" ? " active" : ""}`} onClick={() => setTab("bugs")}>
              Bugs ({order.bugReports.length})
            </button>
            <button className={`mxTab${tab === "vc" ? " active" : ""}`} onClick={() => setTab("vc")}>
              VC Calls ({order.vcSchedules.length})
            </button>
          </div>

          {tab === "tasks" && <TasksTab tasks={order.tasks} />}
          {tab === "bugs"  && (
            <BugsTab
              bugReports={order.bugReports}
              bugLimit={cfg.bugLimit}
              bugsUsed={order.bugsUsed}
            />
          )}
          {tab === "vc"    && <VCTab vcSchedules={order.vcSchedules} pkg={order.package} />}
        </div>
      </div>
    </>
  );
}

// ── Main Export ───────────────────────────────────────────────────────────────
export default function MaintenanceClient({ order }: { order: MaintenanceOrder | null }) {
  return (
    <div className="mxPage">
      <div className="mxInner">
        {order ? <ActiveOrder order={order} /> : <PackageSelection />}
      </div>
    </div>
  );
}