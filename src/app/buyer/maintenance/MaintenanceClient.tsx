"use client";
// buyer/maintenance/MaintenanceClient.tsx
// Shows package selection if no active order, or the full maintenance portal.
// Tabs: Tasks | Bug Reports | VC Schedule

import { useState } from "react";
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

  async function avail(pkg: Pkg) {
    setLoading(pkg);
    setError("");
    try {
      const res = await fetch("/api/maintenance/avail", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packageType: pkg }),
      });
      if (res.ok) window.location.reload();
      else {
        const d = await res.json();
        setError(d.error ?? "Something went wrong.");
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
                {loading === pkg ? "Availing…" : "Avail Package"}
              </button>
            </div>
          );
        })}
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
        setBugs(prev => [data.bugReport, ...prev]);
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
            value={title} onChange={e => setTitle(e.target.value)}
          />
          <textarea
            className="mxInput" rows={3}
            placeholder="Describe the issue in detail — what happened, when, what page/feature?"
            value={desc} onChange={e => setDesc(e.target.value)}
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
        : bugs.map(b => (
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
function VCTab({ vcSchedules, pkg }: { vcSchedules: VCSchedule[]; pkg: Pkg }) {
  const [name, setName]         = useState("");
  const [phone, setPhone]       = useState("");
  const [date, setDate]         = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [schedules, setSchedules] = useState(vcSchedules);

  async function submit() {
    if (!name.trim() || !phone.trim() || !date) { setError("All fields are required."); return; }
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/maintenance/vc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ buyerName: name, buyerPhone: phone, preferredDate: date }),
      });
      const data = await res.json();
      if (res.ok) {
        setSchedules(prev => [data.schedule, ...prev]);
        setName(""); setPhone(""); setDate("");
      } else setError(data.error ?? "Something went wrong.");
    } catch { setError("Network error."); }
    finally { setLoading(false); }
  }

  return (
    <>
      <div className="mxVCForm">
        <p className="mxVCFormTitle">Schedule a VC Call</p>
        <input
          className="mxInput" placeholder="Your name"
          value={name} onChange={e => setName(e.target.value)}
        />
        <input
          className="mxInput" placeholder="Phone number"
          value={phone} onChange={e => setPhone(e.target.value)}
        />
        <input
          className="mxInput" type="datetime-local"
          value={date} onChange={e => setDate(e.target.value)}
        />
        <p style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.25)", margin: 0 }}>
          Package: <strong style={{ color: "rgba(255,255,255,0.5)" }}>{PKG_CONFIG[pkg].name}</strong>
        </p>
        {error && <div className="mxError">{error}</div>}
        <button className="mxSubmitBtn" onClick={submit} disabled={loading}>
          {loading ? "Scheduling…" : "Request Call"}
        </button>
      </div>
      {!schedules.length
        ? <div className="mxEmpty">No VC calls scheduled yet.</div>
        : schedules.map(s => (
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
