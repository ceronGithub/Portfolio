"use client";
// admin/maintenance/AdminMaintenanceClient.tsx
// Left: scrollable client list. Right: selected client detail with tabs.
// Admin can: add tasks, update task status, delete tasks,
//            classify bugs, set bug status, flag extra charge,
//            update VC schedule status.

import { useState } from "react";
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

const PKG_LABELS: Record<Pkg, string> = { BASIC: "Basic", PRIORITY: "Priority", FULL: "Full" };

function fmt(d: string) {
  return new Date(d).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" });
}
function fmtTime(d: string) {
  return new Date(d).toLocaleString("en-PH", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

// ── Tasks Tab ─────────────────────────────────────────────────────────────────
function TasksTab({ orderId, initTasks }: { orderId: string; initTasks: Task[] }) {
  const [tasks, setTasks]         = useState(initTasks);
  const [title, setTitle]         = useState("");
  const [desc, setDesc]           = useState("");
  const [type, setType]           = useState("OTHER");
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState("");
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
      <div className="amAddTask">
        <p className="amAddTaskTitle">Add Task for Client</p>
        <input className="amInput" placeholder="Task title" value={title} onChange={e => setTitle(e.target.value)} />
        <textarea className="amInput" rows={2} placeholder="Description (optional)" value={desc} onChange={e => setDesc(e.target.value)} />
        <div className="amInputRow">
          <select className="amSelectInput" value={type} onChange={e => setType(e.target.value)}>
            <option value="REVISION">Revision</option>
            <option value="FIX">Fix</option>
            <option value="OTHER">Other</option>
          </select>
          <button className="amAddBtn" onClick={addTask} disabled={loading}>
            {loading ? "Adding…" : "+ Add Task"}
          </button>
        </div>
        {error && <div className="amError">{error}</div>}
      </div>

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
                      onChange={e => setEditTitle(e.target.value)}
                    />
                    <textarea
                      className="amInput"
                      rows={2}
                      value={editDesc}
                      onChange={e => setEditDesc(e.target.value)}
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
            onChange={e => setNotes(p => ({ ...p, [b.id]: e.target.value }))}
            onBlur={() => {
              if (notes[b.id] !== undefined) updateBug(b.id, { adminNote: notes[b.id] });
            }}
          />
        </div>
      ))}\n    </div>
  );
}

// ── VC Tab ────────────────────────────────────────────────────────────────────
function VCTab({ orderId, initSchedules, buyerName: defaultName, buyerPhone: defaultPhone }: {
  orderId: string; initSchedules: VCSchedule[]; buyerName: string; buyerPhone: string;
}) {
  const [schedules, setSchedules] = useState(initSchedules);
  const [name, setName]           = useState(defaultName);
  const [phone, setPhone]         = useState(defaultPhone);
  const [date, setDate]           = useState("");
  const [note, setNote]           = useState("");
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState("");

  async function scheduleCall() {
    if (!name.trim() || !phone.trim() || !date) { setError("Name, phone, and date are required."); return; }
    setLoading(true); setError("");
    try {
      const res = await fetch(`/api/admin/maintenance/${orderId}/vc`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ buyerName: name, buyerPhone: phone, preferredDate: new Date(date).toISOString(), adminNote: note }),
      });
      const data = await res.json();
      if (res.ok) {
        setSchedules(p => [data.vc, ...p]);
        setDate(""); setNote("");
      } else setError(data.error ?? "Failed to schedule call.");
    } catch { setError("Network error."); }
    finally { setLoading(false); }
  }

  async function updateVC(vcId: string, data: Record<string, unknown>) {
    const res = await fetch(`/api/admin/maintenance/${orderId}/vc/${vcId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      const d = await res.json();
      setSchedules(p => p.map(s => s.id === vcId ? d.vc : s));
    }
  }

  return (
    <>
      {/* Admin schedule form */}
      <div className="amAddTask">
        <p className="amAddTaskTitle">Schedule a Call for Client</p>
        <input className="amInput" placeholder="Client name" value={name} onChange={e => setName(e.target.value)} />
        <input className="amInput" placeholder="Phone number" value={phone} onChange={e => setPhone(e.target.value)} />
        <input className="amInput" type="datetime-local" value={date} onChange={e => setDate(e.target.value)} />
        <input className="amInput" placeholder="Note to client (optional)" value={note} onChange={e => setNote(e.target.value)} />
        {error && <div className="amError">{error}</div>}
        <button className="amAddBtn" style={{ alignSelf: "flex-start" }} onClick={scheduleCall} disabled={loading}>
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

  return (
    <div className="amDetail">
      <div className="amDetailHeader">
        <div>
          <p className="amDetailName">{order.user.name}</p>
          <p className="amDetailEmail">{order.user.email}</p>
        </div>
        <span className="amDetailPkg">{PKG_LABELS[order.package]}</span>
      </div>

      <div className="amTabs">
        <button className={`amTab${tab === "tasks" ? " active" : ""}`} onClick={() => setTab("tasks")}>
          Tasks ({order.tasks.length})
        </button>
        <button className={`amTab${tab === "bugs" ? " active" : ""}`} onClick={() => setTab("bugs")}>
          Bugs ({order.bugReports.length})
        </button>
        <button className={`amTab${tab === "vc" ? " active" : ""}`} onClick={() => setTab("vc")}>
          VC Calls ({order.vcSchedules.length})
        </button>
      </div>

      <div className="amDetailContent">
        {tab === "tasks" && <TasksTab orderId={order.id} initTasks={order.tasks} />}
        {tab === "bugs"  && <BugsTab  orderId={order.id} initBugs={order.bugReports} />}
        {tab === "vc"    && (
          <VCTab
            orderId={order.id}
            initSchedules={order.vcSchedules}
            buyerName={order.user.name}
            buyerPhone=""
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
                      {o.tasks.length}T · {o.bugReports.length}B · {o.vcSchedules.length}VC
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