"use client";
// admin/maintenance/AdminMaintenanceClient.tsx
// Left: scrollable client list. Right: selected client detail with tabs.
// Admin can: add tasks, update task status, delete tasks,
//            classify bugs, set bug status, flag extra charge,
//            schedule VC calls (custom calendar, booked slots hidden),
//            update VC schedule status.

import { useState, useEffect, useCallback } from "react";
import { sanitize }                          from "@/lib/utils";
import "./admin-maintenance.css";

// ── Types ─────────────────────────────────────────────────────────────────────
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

interface Order {
  id: string; package: Pkg; bugsUsed: number; revisionsUsed: number;
  startedAt: string; expiresAt: string;
  user: { id: string; name: string; email: string };
  vcSchedules: VCSchedule[]; bugReports: BugReport[]; tasks: Task[];
}

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

const PKG_LABELS: Record<Pkg, string> = { BASIC: "Basic", PRIORITY: "Priority", FULL: "Full" };

function fmt(d: string) {
  return new Date(d).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" });
}
function fmtTime(d: string) {
  return new Date(d).toLocaleString("en-PH", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

// ── Tasks Tab ─────────────────────────────────────────────────────────────────
function TasksTab({ orderId, initTasks, revisionLimit }: {
  orderId: string;
  initTasks: Task[];
  revisionLimit: number;
}) {
  const [tasks, setTasks]         = useState(initTasks);
  const [title, setTitle]         = useState("");
  const [desc, setDesc]           = useState("");
  const [type, setType]           = useState("OTHER");
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState("");
  const [formOpen, setFormOpen]   = useState(false);
  // Edit state: taskId → { title, description, type }
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDesc, setEditDesc]   = useState("");
  const [editType, setEditType]   = useState("OTHER");

  async function addTask() {
    if (!title.trim()) { setError("Title is required."); return; }
    setLoading(true); setError("");
    try {
      const res = await fetch(`/api/admin/maintenance/${orderId}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description: desc, type }),
      });
      const data = await res.json();
      if (res.ok) { setTasks(p => [data.task, ...p]); setTitle(""); setDesc(""); }
      else setError(data.error ?? "Failed to add task.");
    } catch { setError("Network error."); }
    finally { setLoading(false); }
  }

  async function updateStatus(taskId: string, status: string) {
    const res = await fetch(`/api/admin/maintenance/${orderId}/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      const data = await res.json();
      setTasks(p => p.map(t => t.id === taskId ? data.task : t));
    }
  }

  async function saveEdit(taskId: string) {
    const res = await fetch(`/api/admin/maintenance/${orderId}/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: editTitle, description: editDesc, type: editType }),
    });
    if (res.ok) {
      const data = await res.json();
      setTasks(p => p.map(t => t.id === taskId ? data.task : t));
      setEditingId(null);
    }
  }

  async function deleteTask(taskId: string) {
    const res = await fetch(`/api/admin/maintenance/${orderId}/tasks/${taskId}`, { method: "DELETE" });
    if (res.ok) setTasks(p => p.filter(t => t.id !== taskId));
  }

  function startEdit(t: Task) {
    setEditingId(t.id);
    setEditTitle(t.title);
    setEditDesc(t.description ?? "");
    setEditType(t.type);
  }

  return (
    <>
      {/* Task list always visible at top */}
      {!tasks.length
        ? <div className="amEmpty">No tasks logged yet.</div>
        : <div className="amTaskList amScrollPane">
          {tasks.map(t => (
            <div key={t.id} className="amTaskCard">
              <div className={`amTaskDot ${t.status}`} />
              <div className="amTaskBody">
                {editingId === t.id ? (
                  // ── Inline Edit Form ──
                  <>
                    <input
                      className="amInput"
                      value={editTitle}
                      onChange={e => setEditTitle(sanitize(e.target.value))}
                    />
                    <textarea
                      className="amInput"
                      rows={2}
                      value={editDesc}
                      onChange={e => setEditDesc(sanitize(e.target.value))}
                    />
                    <div className="amTaskActions">
                      <select className="amSelectInput" value={editType} onChange={e => setEditType(e.target.value)}>
                        <option value="REVISION">Revision</option>
                        <option value="FIX">Fix</option>
                        <option value="OTHER">Other</option>
                      </select>
                      <button className="amAddBtn" onClick={() => saveEdit(t.id)}>Save</button>
                      <button className="amStatusBtn" onClick={() => setEditingId(null)}>Cancel</button>
                    </div>
                  </>
                ) : (
                  // ── Read View ──
                  <>
                    <p className="amTaskTitle">{t.title}</p>
                    {t.description && <p className="amTaskDesc">{t.description}</p>}
                    <div className="amTaskActions">
                      {(["PENDING", "IN_PROGRESS", "DONE"] as const).map(s => (
                        <button
                          key={s}
                          className={`amStatusBtn${t.status === s ? " current" : ""}`}
                          onClick={() => updateStatus(t.id, s)}
                        >
                          {s.replace("_", " ")}
                        </button>
                      ))}
                      <button className="amStatusBtn editBtn" onClick={() => startEdit(t)}>Edit</button>
                      <button className="amStatusBtn deleteBtn" onClick={() => deleteTask(t.id)}>Delete</button>
                      <span style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.2)", marginLeft: "auto" }}>
                        {fmt(t.createdAt)}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      }

      {/* Collapsible add-task form — disabled when at revision limit */}
      <div className="amAddTaskToggleRow">
        {tasks.length >= revisionLimit ? (
          <span className="amRevisionLimitNote">
            Revision limit reached ({revisionLimit}/{revisionLimit}) — upgrade package to add more
          </span>
        ) : (
          <button className="amAddTaskToggle" onClick={() => setFormOpen(p => !p)}>
            {formOpen ? "✕ Cancel" : `+ Add Task (${tasks.length}/${revisionLimit})`}
          </button>
        )}
      </div>

      {formOpen && (
        <div className="amAddTask">
          <input className="amInput" placeholder="Task title" value={title} onChange={e => setTitle(sanitize(e.target.value))} />
          <textarea className="amInput" rows={2} placeholder="Description (optional)" value={desc} onChange={e => setDesc(sanitize(e.target.value))} />
          <div className="amInputRow">
            <select className="amSelectInput" value={type} onChange={e => setType(e.target.value)}>
              <option value="REVISION">Revision</option>
              <option value="FIX">Fix</option>
              <option value="OTHER">Other</option>
            </select>
            <button className="amAddBtn" onClick={addTask} disabled={loading}>
              {loading ? "Adding…" : "Save Task"}
            </button>
          </div>
          {error && <div className="amError">{error}</div>}
        </div>
      )}
    </>
  );
}

// ── Bugs Tab ──────────────────────────────────────────────────────────────────
function BugsTab({ orderId, initBugs }: { orderId: string; initBugs: BugReport[] }) {
  const [bugs, setBugs]     = useState(initBugs);
  const [notes, setNotes]   = useState<Record<string, string>>({});

  async function updateBug(bugId: string, data: Record<string, unknown>) {
    const res = await fetch(`/api/admin/maintenance/${orderId}/bugs/${bugId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      const d = await res.json();
      setBugs(p => p.map(b => b.id === bugId ? d.bug : b));
    }
  }

  if (!bugs.length) return <div className="amEmpty">No bug reports submitted yet.</div>;

  return (
    <div className="amScrollPane">
      {bugs.map(b => (
        <div key={b.id} className="amBugCard">
          <div className="amBugHeader">
            <p className="amBugTitle">{b.title}</p>
            <span style={{
              fontFamily: "'DM Mono', monospace", fontSize: "9px", fontWeight: 700,
              letterSpacing: "0.12em", textTransform: "uppercase" as const,
              padding: "3px 8px", borderRadius: "99px",
              background: b.status === "RESOLVED" ? "rgba(34,197,94,0.12)" :
                          b.status === "EXTRA_CHARGE" ? "rgba(239,68,68,0.12)" :
                          b.status === "IN_PROGRESS" ? "rgba(99,102,241,0.12)" : "rgba(255,255,255,0.07)",
              color: b.status === "RESOLVED" ? "#22c55e" :
                     b.status === "EXTRA_CHARGE" ? "#ef4444" :
                     b.status === "IN_PROGRESS" ? "#818cf8" : "rgba(255,255,255,0.4)",
            }}>
              {b.status.replace("_", " ")}
            </span>
          </div>
          <p className="amBugDesc">{b.description}</p>

          <div className="amBugControls">
            {/* Category */}
            <span style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.25)" }}>Category:</span>
            {(["MINOR", "MODERATE", "CRITICAL"] as const).map(cat => (
              <button
                key={cat}
                className={`amBugBtn ${cat.toLowerCase()}${b.category === cat ? " selected" : ""}`}
                onClick={() => updateBug(b.id, { category: cat })}
              >
                {cat}
              </button>
            ))}

            {/* Status */}
            <span style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.25)", marginLeft: "0.5rem" }}>Status:</span>
            {(["REVIEWING", "IN_PROGRESS", "RESOLVED"] as const).map(s => (
              <button
                key={s}
                className={`amBugBtn${b.status === s ? " selected" : ""}`}
                onClick={() => updateBug(b.id, { status: s })}
              >
                {s.replace("_", " ")}
              </button>
            ))}

            {/* Extra charge flag */}
            <button
              className={`amBugBtn extra${b.isExtraCharge ? " selected" : ""}`}
              onClick={() => updateBug(b.id, { isExtraCharge: !b.isExtraCharge })}
            >
              {b.isExtraCharge ? "✓ Extra Charge" : "Flag Extra Charge"}
            </button>
          </div>

          {/* Admin note */}
          <input
            className="amNoteInput"
            placeholder="Admin note (visible to buyer)…"
            value={notes[b.id] ?? (b.adminNote || "")}
            onChange={e => setNotes(p => ({ ...p, [b.id]: sanitize(e.target.value) }))}
            onBlur={() => {
              if (notes[b.id] !== undefined) updateBug(b.id, { adminNote: notes[b.id] });
            }}
          />
        </div>
      ))}\n    </div>
  );
}

// ── VC Tab ────────────────────────────────────────────────────────────────────
// Custom calendar with booked-slot awareness for the admin.
// Fetches occupied slots from /api/admin/maintenance/vc/booked-slots and grays
// out any hour already taken — prevents double-booking.

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

const MONTH_NAMES = ["January","February","March","April","May","June",
                     "July","August","September","October","November","December"];
const DAY_LABELS  = ["Su","Mo","Tu","We","Th","Fr","Sa"];

function VCTab({ orderId, initSchedules, buyerName: defaultName, buyerPhone: defaultPhone }: {
  orderId: string; initSchedules: VCSchedule[]; buyerName: string; buyerPhone: string;
}) {
  const today = new Date();
  today.setHours(0,0,0,0);

  const [schedules, setSchedules]       = useState(initSchedules);
  const [name, setName]                 = useState(defaultName);
  const [phone, setPhone]               = useState(defaultPhone);
  const [note, setNote]                 = useState("");
  const [viewYear, setViewYear]         = useState(today.getFullYear());
  const [viewMonth, setViewMonth]       = useState(today.getMonth());
  const [selectedDay, setSelectedDay]   = useState<Date | null>(null);
  const [selectedHour, setSelectedHour] = useState<number | null>(null);
  const [bookedSlots, setBookedSlots]   = useState<Date[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState("");

  // Fetch all occupied slots from the admin endpoint
  const fetchBookedSlots = useCallback(async () => {
    setLoadingSlots(true);
    try {
      const res  = await fetch("/api/admin/maintenance/vc/booked-slots");
      const data = await res.json();
      if (res.ok) setBookedSlots((data.bookedSlots ?? []).map((s: { date: string }) => new Date(s.date)));
    } catch { /* fail silently */ }
    finally { setLoadingSlots(false); }
  }, []);

  useEffect(() => { fetchBookedSlots(); }, [fetchBookedSlots]);

  // Returns true if the given day+hour combination is already taken
  function isHourBooked(day: Date, hour: number) {
    return bookedSlots.some(b => sameDay(b, day) && b.getHours() === hour);
  }

  // Returns true when every hour on a day is occupied — used to dim the calendar cell
  function isDayFullyBooked(day: Date) {
    return VC_HOURS.every(h => isHourBooked(day, h));
  }

  // Build 7-column grid cells for the current viewed month
  function buildCalendarDays() {
    const firstDay    = new Date(viewYear, viewMonth, 1).getDay();
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

  async function scheduleCall() {
    if (!name.trim() || !phone.trim() || !selectedDay || selectedHour === null) {
      setError("Name, phone, and date/time are required."); return;
    }
    const preferredDate = new Date(selectedDay);
    preferredDate.setHours(selectedHour, 0, 0, 0);

    setLoading(true); setError("");
    try {
      const res = await fetch(`/api/admin/maintenance/${orderId}/vc`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          buyerName: name, buyerPhone: phone,
          preferredDate: preferredDate.toISOString(),
          adminNote: note,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setSchedules(p => [data.vc, ...p]);
        // Immediately reflect the new booking in local state
        setBookedSlots(p => [...p, preferredDate]);
        setNote(""); setSelectedDay(null); setSelectedHour(null);
      } else setError(data.error ?? "Failed to schedule call.");
    } catch { setError("Network error."); }
    finally { setLoading(false); }
  }

  async function updateVC(vcId: string, patch: Record<string, unknown>) {
    const res = await fetch(`/api/admin/maintenance/${orderId}/vc/${vcId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (res.ok) {
      const d = await res.json();
      setSchedules(p => p.map(s => s.id === vcId ? d.vc : s));
    }
  }

  const calDays = buildCalendarDays();

  return (
    <>
      {/* Admin schedule form with custom calendar */}
      <div className="amAddTask">
        <p className="amAddTaskTitle">Schedule a Call for Client</p>
        <input className="amInput" placeholder="Client name"   value={name}  onChange={e => setName(sanitize(e.target.value))} />
        <input className="amInput" placeholder="Phone number"  value={phone} onChange={e => setPhone(sanitize(e.target.value))} />

        {/* ── Custom Calendar ── */}
        <div className="amCalendar">
          <div className="amCalHeader">
            <button className="amCalNav" onClick={prevMonth}>‹</button>
            <span className="amCalMonth">{MONTH_NAMES[viewMonth]} {viewYear}</span>
            <button className="amCalNav" onClick={nextMonth}>›</button>
          </div>

          <div className="amCalGrid">
            {DAY_LABELS.map(d => (
              <div key={d} className="amCalDayLabel">{d}</div>
            ))}
            {calDays.map((day, i) => {
              if (!day) return <div key={`empty-${i}`} />;
              const isPast          = day < today;
              const isFullyBooked   = !isPast && isDayFullyBooked(day);
              const isSelected      = selectedDay ? sameDay(day, selectedDay) : false;
              const isToday         = sameDay(day, new Date());
              let cls = "amCalDay";
              if (isPast)           cls += " past";
              else if (isFullyBooked) cls += " fullyBooked";
              else if (isSelected)  cls += " selected";
              else if (isToday)     cls += " today";
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

        {/* ── Time Slot Picker — shown after a day is selected ── */}
        {selectedDay && (
          <div className="amTimeSlots">
            <p className="amTimeSlotsTitle">
              Available times — {selectedDay.toLocaleDateString("en-PH", { weekday: "short", month: "short", day: "numeric" })}
            </p>
            <div className="amTimeGrid">
              {VC_HOURS.map(h => {
                const booked   = isHourBooked(selectedDay, h);
                const isChosen = selectedHour === h;
                return (
                  <button
                    key={h}
                    className={`amTimeSlot${booked ? " booked" : ""}${isChosen ? " chosen" : ""}`}
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
          <p className="amSelectedSummary">
            📅 {selectedDay.toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })} at {fmtHour(selectedHour)}
          </p>
        )}

        <input className="amInput" placeholder="Note to client (optional)" value={note} onChange={e => setNote(sanitize(e.target.value))} />
        {error && <div className="amError">{error}</div>}
        <button
          className="amAddBtn"
          style={{ alignSelf: "flex-start" }}
          onClick={scheduleCall}
          disabled={loading || !selectedDay || selectedHour === null}
        >
          {loading ? "Scheduling…" : "+ Schedule Call"}
        </button>
      </div>

      {!schedules.length
        ? <div className="amEmpty">No VC calls scheduled yet.</div>
        : <div className="amScrollPane">
          {schedules.map(s => (
            <div key={s.id} className="amVCCard">
              <p className="amVCDate">
                {s.confirmedDate ? `Confirmed: ${fmtTime(s.confirmedDate)}` : `Requested: ${fmtTime(s.preferredDate)}`}
              </p>
              <p className="amVCMeta">
                {s.buyerName} · {s.buyerPhone} · {s.initiator === "ADMIN" ? "Admin initiated" : "Buyer initiated"}
              </p>
              <div className="amBugControls">
                {(["CONFIRMED", "DONE", "CANCELLED"] as const).map(st => (
                  <button
                    key={st}
                    className={`amBugBtn${s.status === st ? " selected" : ""}`}
                    onClick={() => updateVC(s.id, { status: st })}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      }
    </>
  );
}

// ── Client Detail ─────────────────────────────────────────────────────────────
function ClientDetail({ order }: { order: Order }) {
  const [tab, setTab] = useState<"tasks" | "bugs" | "vc">("tasks");
  const pkgCfg = PKG_CONFIG[order.package];

  return (
    <div className="amDetail">
      <div className="amDetailHeader">
        <div>
          <p className="amDetailName">{order.user.name}</p>
          <p className="amDetailEmail">{order.user.email}</p>
        </div>
        <span className="amDetailPkg">{PKG_LABELS[order.package]}</span>
      </div>

      {/* Package description panel */}
      <div className="amPkgDesc">
        <div className="amPkgDescHeader">
          <div className="amPkgDescMeta">
            <span className="amPkgDescName">{pkgCfg.name}</span>
            <span className="amPkgDescPrice">{pkgCfg.price}<span className="amPkgDescPriceSub">/mo</span></span>
          </div>
          <div className="amPkgDescLimits">
            <span className="amPkgDescLimit">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>
              </svg>
              {pkgCfg.bugLimit} bugs/mo
            </span>
            <span className="amPkgDescLimit">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
              {pkgCfg.revisionLimit} revisions/mo
            </span>
          </div>
        </div>
        <ul className="amPkgDescFeatures">
          {pkgCfg.features.map(f => (
            <li key={f.label} className={`amPkgDescFeature ${f.included ? "amPkgDescFeatureIncluded" : "amPkgDescFeatureExcluded"}`}>
              {f.included ? (
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              ) : (
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              )}
              {f.label}
            </li>
          ))}
        </ul>
      </div>

      <div className="amTabs">
        <button className={`amTab${tab === "tasks" ? " active" : ""}`} onClick={() => setTab("tasks")}>
          Tasks / Revisions ({order.tasks.length})
        </button>
        <button className={`amTab${tab === "bugs" ? " active" : ""}`} onClick={() => setTab("bugs")}>
          Bugs ({order.bugReports.length})
        </button>
        <button className={`amTab${tab === "vc" ? " active" : ""}`} onClick={() => setTab("vc")}>
          VC Calls ({order.vcSchedules.length})
        </button>
      </div>

      <div className="amDetailContent">
        {tab === "tasks" && <TasksTab orderId={order.id} initTasks={order.tasks} revisionLimit={pkgCfg.revisionLimit} />}
        {tab === "bugs"  && <BugsTab  orderId={order.id} initBugs={order.bugReports} />}
        {tab === "vc"    && (
          <VCTab
            orderId={order.id}
            initSchedules={order.vcSchedules}
            buyerName={order.user.name}
            buyerPhone={order.vcSchedules[0]?.buyerPhone ?? ""}
          />
        )}
      </div>
    </div>
  );
}

// ── Main Export ───────────────────────────────────────────────────────────────
export default function AdminMaintenanceClient({ orders }: { orders: Order[] }) {
  const [selected, setSelected] = useState<Order | null>(orders[0] ?? null);

  return (
    <div className="amPage">
      <div className="amHeader">
        <p className="amEyebrow">Support</p>
        <h1 className="amTitle">Maintenance Clients</h1>
        <p className="amCount">{orders.length} active client{orders.length !== 1 ? "s" : ""}</p>
      </div>

      {!orders.length
        ? <div className="amEmpty">No active maintenance clients yet.</div>
        : (
          <div className="amLayout">
            {/* Left — Client List */}
            <div className="amClientList">
              {orders.map(o => (
                <div
                  key={o.id}
                  className={`amClientCard${selected?.id === o.id ? " active" : ""}`}
                  onClick={() => setSelected(o)}
                >
                  <p className="amClientName">{o.user.name}</p>
                  <p className="amClientEmail">{o.user.email}</p>
                  <div className="amClientMeta">
                    <span className="amPkgBadge">{PKG_LABELS[o.package]}</span>
                    <span className="amStatBadge">
                      {o.tasks.length}T/R · {o.bugReports.length}B · {o.vcSchedules.length}VC
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Right — Detail */}
            {selected
              ? <ClientDetail key={selected.id} order={selected} />
              : <div className="amNoSelect">Select a client to manage</div>
            }
          </div>
        )
      }
    </div>
  );
}