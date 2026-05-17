// UsersClient.tsx — User Management client component.
// Card 1: All registered users.
// Card 2: Active users — search, ban/deactivate/delete actions.
// Card 3: Non-active/banned — activate/delete actions.
// Card 4: Action logs — 4 tabs: Ban / Delete / Deactivate / Activate.
"use client";

import { useState, useMemo } from "react";

// ── Types ─────────────────────────────────────────────────────────────

interface Ownership { productId: string; product: { name: string }; }

interface User {
  id: string; name: string | null; email: string; role: string;
  isActive: boolean; isBanned: boolean; createdAt: Date;
  ownership: Ownership[];
}

interface ActionLog {
  id: string; action: string;
  targetUserId: string; targetEmail: string; targetName: string | null;
  adminEmail: string; reason: string | null; createdAt: Date;
}

interface Props { initialUsers: User[]; initialLogs: ActionLog[]; }

type ActionType = "ban" | "unban" | "deactivate" | "activate" | "delete";
type LogTab = "BAN" | "DELETE" | "DEACTIVATE" | "ACTIVATE";

// ── API helpers ───────────────────────────────────────────────────────

async function patchUser(userId: string, action: Exclude<ActionType, "delete">, reason?: string): Promise<boolean> {
  const res = await fetch(`/api/admin/users/${userId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, reason }),
  });
  return res.ok;
}

async function deleteUser(userId: string, reason?: string): Promise<boolean> {
  const res = await fetch(`/api/admin/users/${userId}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ reason }),
  });
  return res.ok;
}

// ── Shared UI atoms ───────────────────────────────────────────────────

function RoleBadge({ role }: { role: string }) {
  return <span className={`umRoleBadge umRoleBadge--${role.toLowerCase()}`}>{role}</span>;
}

function StatusBadge({ isActive, isBanned }: { isActive: boolean; isBanned: boolean }) {
  if (isBanned)  return <span className="umStatusBadge umStatusBadge--banned">Banned</span>;
  if (!isActive) return <span className="umStatusBadge umStatusBadge--inactive">Inactive</span>;
  return <span className="umStatusBadge umStatusBadge--active">Active</span>;
}

function ActionLogBadge({ action }: { action: string }) {
  const map: Record<string, string> = {
    BAN: "ban", UNBAN: "unban", DEACTIVATE: "deactivate", ACTIVATE: "activate", DELETE: "delete",
  };
  return <span className={`umActionLogBadge umActionLogBadge--${map[action] ?? "delete"}`}>{action}</span>;
}

function ActionBtn({ label, variant, onClick, disabled }: {
  label: string; variant: "ban"|"deactivate"|"delete"|"activate"|"unban";
  onClick: () => void; disabled?: boolean;
}) {
  return (
    <button className={`umActionBtn umActionBtn--${variant}`} onClick={onClick} disabled={disabled}>
      {label}
    </button>
  );
}

// Confirm popover with optional reason input
function ConfirmPopover({ message, danger, withReason, onConfirm, onCancel }: {
  message: string; danger?: boolean; withReason?: boolean;
  onConfirm: (reason?: string) => void; onCancel: () => void;
}) {
  const [reason, setReason] = useState("");
  return (
    <div className="umConfirmPopover">
      <p className="umConfirmMsg">{message}</p>
      {withReason && (
        <input
          className="umConfirmReason"
          type="text"
          placeholder="Reason (optional)"
          value={reason}
          onChange={e => setReason(e.target.value)}
        />
      )}
      <div className="umConfirmBtns">
        <button className="umConfirmCancel" onClick={onCancel}>Cancel</button>
        <button
          className={`umConfirmOk${danger ? " umConfirmOkDanger" : ""}`}
          onClick={() => onConfirm(reason || undefined)}
        >
          Confirm
        </button>
      </div>
    </div>
  );
}

// ── Card 1 — All Users ────────────────────────────────────────────────

function AllUsersCard({ users }: { users: User[] }) {
  return (
    <div className="umCard">
      <div className="umCardHeader">
        <h2 className="umCardTitle">All Registered Users</h2>
        <span className="umCardBadge">{users.length}</span>
      </div>
      <div className="umTable">
        <div className="umTableHead umGrid--all">
          <span>Name</span><span>Email</span><span>Role</span>
          <span>Status</span><span>Joined</span><span>Owned</span>
        </div>
        {users.length === 0 && <p className="umEmpty">No users yet.</p>}
        {users.map(u => (
          <div key={u.id} className="umTableRow umGrid--all">
            <span className="umCell umCellName">{u.name ?? <em className="umNone">—</em>}</span>
            <span className="umCell umCellMuted">{u.email}</span>
            <span className="umCell"><RoleBadge role={u.role} /></span>
            <span className="umCell"><StatusBadge isActive={u.isActive} isBanned={u.isBanned} /></span>
            <span className="umCell umCellMuted">
              {new Date(u.createdAt).toLocaleDateString("en-PH", { year:"numeric", month:"short", day:"numeric" })}
            </span>
            <span className="umCell umCellOwned">
              {u.ownership.length === 0
                ? <em className="umNone">None</em>
                : u.ownership.map(o => <span key={o.productId} className="umOwnedTag">{o.product.name}</span>)
              }
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Card 2 — Active Users ─────────────────────────────────────────────

function ActiveUsersCard({ users, onAction, pendingId }: {
  users: User[]; onAction: (id: string, action: ActionType, reason?: string) => void; pendingId: string | null;
}) {
  const [search, setSearch] = useState("");
  const [confirmState, setConfirmState] = useState<{ userId: string; action: ActionType } | null>(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return users.filter(u => (u.name ?? "").toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
  }, [users, search]);

  return (
    <div className="umCard">
      <div className="umCardHeader">
        <h2 className="umCardTitle">Active Users</h2>
        <span className="umCardBadge umCardBadge--active">{users.length}</span>
      </div>
      <div className="umSearchWrap">
        <svg className="umSearchIcon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input className="umSearchInput" placeholder="Search by name or email..."
          value={search} onChange={e => setSearch(e.target.value)} />
        {search && <button className="umSearchClear" onClick={() => setSearch("")}>✕</button>}
      </div>
      <div className="umTable">
        <div className="umTableHead umGrid--active">
          <span>Name</span><span>Email</span><span>Joined</span><span>Owned</span><span>Actions</span>
        </div>
        {filtered.length === 0 && <p className="umEmpty">{search ? "No users match." : "No active users."}</p>}
        {filtered.map(u => (
          <div key={u.id} className="umTableRow umGrid--active">
            <span className="umCell umCellName">{u.name ?? <em className="umNone">—</em>}</span>
            <span className="umCell umCellMuted">{u.email}</span>
            <span className="umCell umCellMuted">
              {new Date(u.createdAt).toLocaleDateString("en-PH", { month:"short", day:"numeric", year:"numeric" })}
            </span>
            <span className="umCell umCellOwned">
              {u.ownership.length === 0
                ? <em className="umNone">None</em>
                : <span className="umOwnedCount">{u.ownership.length} system{u.ownership.length !== 1 ? "s" : ""}</span>
              }
            </span>
            <span className="umCell umCellActions">
              {confirmState?.userId === u.id ? (
                <ConfirmPopover
                  message={confirmState.action === "ban"
                    ? "Ban this user? They will lose all access."
                    : "Permanently delete this user and all their data?"}
                  danger withReason
                  onConfirm={reason => { onAction(u.id, confirmState.action, reason); setConfirmState(null); }}
                  onCancel={() => setConfirmState(null)}
                />
              ) : (
                <div className="umActionsGroup">
                  <ActionBtn label="Ban"        variant="ban"        disabled={!!pendingId} onClick={() => setConfirmState({ userId: u.id, action: "ban" })} />
                  <ActionBtn label="Deactivate" variant="deactivate" disabled={!!pendingId} onClick={() => onAction(u.id, "deactivate")} />
                  <ActionBtn label="Delete"     variant="delete"     disabled={!!pendingId} onClick={() => setConfirmState({ userId: u.id, action: "delete" })} />
                </div>
              )}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Card 3 — Non-active Users ─────────────────────────────────────────

function NonActiveUsersCard({ users, onAction, pendingId }: {
  users: User[]; onAction: (id: string, action: ActionType, reason?: string) => void; pendingId: string | null;
}) {
  const [confirmState, setConfirmState] = useState<{ userId: string; action: ActionType } | null>(null);

  return (
    <div className="umCard">
      <div className="umCardHeader">
        <h2 className="umCardTitle">Non-active &amp; Banned Users</h2>
        <span className="umCardBadge umCardBadge--inactive">{users.length}</span>
      </div>
      <div className="umTable">
        <div className="umTableHead umGrid--inactive">
          <span>Name</span><span>Email</span><span>Status</span><span>Joined</span><span>Actions</span>
        </div>
        {users.length === 0 && <p className="umEmpty">No non-active or banned users.</p>}
        {users.map(u => (
          <div key={u.id} className="umTableRow umGrid--inactive">
            <span className="umCell umCellName">{u.name ?? <em className="umNone">—</em>}</span>
            <span className="umCell umCellMuted">{u.email}</span>
            <span className="umCell"><StatusBadge isActive={u.isActive} isBanned={u.isBanned} /></span>
            <span className="umCell umCellMuted">
              {new Date(u.createdAt).toLocaleDateString("en-PH", { month:"short", day:"numeric", year:"numeric" })}
            </span>
            <span className="umCell umCellActions">
              {confirmState?.userId === u.id ? (
                <ConfirmPopover
                  message="Permanently delete this user and all their data?"
                  danger withReason
                  onConfirm={reason => { onAction(u.id, confirmState.action, reason); setConfirmState(null); }}
                  onCancel={() => setConfirmState(null)}
                />
              ) : (
                <div className="umActionsGroup">
                  <ActionBtn label="Activate" variant="activate" disabled={!!pendingId} onClick={() => onAction(u.id, "activate")} />
                  <ActionBtn label="Delete"   variant="delete"   disabled={!!pendingId} onClick={() => setConfirmState({ userId: u.id, action: "delete" })} />
                </div>
              )}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Card 4 — Action Log Tables ────────────────────────────────────────

const LOG_TABS: { label: string; value: LogTab; color: string }[] = [
  { label: "Ban",        value: "BAN",        color: "#c53030" },
  { label: "Delete",     value: "DELETE",     color: "#718096" },
  { label: "Deactivate", value: "DEACTIVATE", color: "#b7791f" },
  { label: "Activate",   value: "ACTIVATE",   color: "#2f855a" },
];

function ActionLogsCard({ logs }: { logs: ActionLog[] }) {
  const [activeTab, setActiveTab] = useState<LogTab>("BAN");

  const filtered = logs.filter(l => l.action === activeTab);

  const counts: Record<LogTab, number> = {
    BAN:        logs.filter(l => l.action === "BAN").length,
    DELETE:     logs.filter(l => l.action === "DELETE").length,
    DEACTIVATE: logs.filter(l => l.action === "DEACTIVATE").length,
    ACTIVATE:   logs.filter(l => l.action === "ACTIVATE").length,
  };

  return (
    <div className="umCard">
      <div className="umCardHeader">
        <h2 className="umCardTitle">Action Logs</h2>
        <span className="umCardBadge">{logs.length} total</span>
      </div>

      {/* Tabs */}
      <div className="umLogTabs">
        {LOG_TABS.map(tab => (
          <button
            key={tab.value}
            className={`umLogTab${activeTab === tab.value ? " umLogTabActive" : ""}`}
            onClick={() => setActiveTab(tab.value)}
            style={activeTab === tab.value ? { borderColor: tab.color, color: tab.color } : {}}
          >
            {tab.label}
            <span className="umLogTabCount">{counts[tab.value]}</span>
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="umTable">
        <div className="umTableHead umGrid--log">
          <span>Action</span><span>Target User</span><span>Target Email</span>
          <span>By Admin</span><span>Reason</span><span>Date &amp; Time</span>
        </div>
        {filtered.length === 0 && (
          <p className="umEmpty">No {activeTab.toLowerCase()} actions recorded yet.</p>
        )}
        {filtered.map(log => (
          <div key={log.id} className="umTableRow umGrid--log">
            <span className="umCell"><ActionLogBadge action={log.action} /></span>
            <span className="umCell umCellName">{log.targetName ?? <em className="umNone">—</em>}</span>
            <span className="umCell umCellMuted">{log.targetEmail}</span>
            <span className="umCell umCellMuted">{log.adminEmail}</span>
            <span className="umCell umCellMuted">
              {log.reason ?? <em className="umNone">—</em>}
            </span>
            <span className="umCell umCellMuted">
              {new Date(log.createdAt).toLocaleDateString("en-PH", {
                year:"numeric", month:"short", day:"numeric",
              })}{" "}
              <span className="umLogTime">
                {new Date(log.createdAt).toLocaleTimeString("en-PH", { hour:"2-digit", minute:"2-digit" })}
              </span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────

export default function UsersClient({ initialUsers, initialLogs }: Props) {
  const [users, setUsers]       = useState<User[]>(initialUsers);
  const [logs, setLogs]         = useState<ActionLog[]>(initialLogs);
  const [pendingId, setPending] = useState<string | null>(null);
  const [toast, setToast]       = useState<{ msg: string; type: "ok"|"err" } | null>(null);

  const activeUsers    = users.filter(u => u.isActive && !u.isBanned);
  const nonActiveUsers = users.filter(u => !u.isActive || u.isBanned);

  function showToast(msg: string, type: "ok"|"err") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }

  // Append a new log entry to local state immediately (optimistic)
  function appendLog(action: string, target: User, adminEmail: string, reason?: string) {
    const newLog: ActionLog = {
      id:            Math.random().toString(36).slice(2),
      action:        action.toUpperCase(),
      targetUserId:  target.id,
      targetEmail:   target.email,
      targetName:    target.name,
      adminEmail,
      reason:        reason ?? null,
      createdAt:     new Date(),
    };
    setLogs(prev => [newLog, ...prev]);
  }

  async function handleAction(userId: string, action: ActionType, reason?: string) {
    setPending(userId);
    const target = users.find(u => u.id === userId);
    if (!target) { setPending(null); return; }

    let success = false;

    if (action === "delete") {
      success = await deleteUser(userId, reason);
      if (success) {
        appendLog("DELETE", target, "admin", reason);
        setUsers(prev => prev.filter(u => u.id !== userId));
        showToast("User deleted.", "ok");
      }
    } else {
      success = await patchUser(userId, action, reason);
      if (success) {
        appendLog(action, target, "admin", reason);
        setUsers(prev => prev.map(u => {
          if (u.id !== userId) return u;
          if (action === "ban")        return { ...u, isBanned: true,  isActive: false };
          if (action === "unban")      return { ...u, isBanned: false };
          if (action === "deactivate") return { ...u, isActive: false };
          if (action === "activate")   return { ...u, isActive: true,  isBanned: false };
          return u;
        }));
        const labels: Record<string, string> = {
          ban: "User banned.", unban: "User unbanned.",
          deactivate: "User deactivated.", activate: "User activated.",
        };
        showToast(labels[action] ?? "Done.", "ok");
      }
    }

    if (!success) showToast("Action failed. Try again.", "err");
    setPending(null);
  }

  return (
    <div className="umRoot">
      {toast && <div className={`umToast umToast--${toast.type}`}>{toast.msg}</div>}
      <AllUsersCard    users={users} />
      <ActiveUsersCard    users={activeUsers}    onAction={handleAction} pendingId={pendingId} />
      <NonActiveUsersCard users={nonActiveUsers} onAction={handleAction} pendingId={pendingId} />
      <ActionLogsCard  logs={logs} />
    </div>
  );
}
