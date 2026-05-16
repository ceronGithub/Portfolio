// UsersClient.tsx — Client component for User Management.
// Card 1: All registered users (read-only list).
// Card 2: Active users — search by name/email, actions: ban / deactivate / delete.
// Card 3: Non-active/banned users — actions: activate / delete.
"use client";

import { useState, useMemo } from "react";

// ── Types ─────────────────────────────────────────────────────────────

interface Ownership {
  productId: string;
  product: { name: string };
}

interface User {
  id: string;
  name: string | null;
  email: string;
  role: string;
  isActive: boolean;
  isBanned: boolean;
  createdAt: Date;
  ownership: Ownership[];
}

interface Props {
  initialUsers: User[];
}

type ActionType = "ban" | "unban" | "deactivate" | "activate" | "delete";

// ── API helpers ───────────────────────────────────────────────────────

async function patchUser(userId: string, action: Exclude<ActionType, "delete">): Promise<boolean> {
  const res = await fetch(`/api/admin/users/${userId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action }),
  });
  return res.ok;
}

async function deleteUser(userId: string): Promise<boolean> {
  const res = await fetch(`/api/admin/users/${userId}`, { method: "DELETE" });
  return res.ok;
}

// ── Sub-components ────────────────────────────────────────────────────

// Confirmation popover — shown inline when a destructive action is clicked
function ConfirmPopover({
  message,
  onConfirm,
  onCancel,
  danger = false,
}: {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  danger?: boolean;
}) {
  return (
    <div className="umConfirmPopover">
      <p className="umConfirmMsg">{message}</p>
      <div className="umConfirmBtns">
        <button className="umConfirmCancel" onClick={onCancel}>Cancel</button>
        <button className={`umConfirmOk ${danger ? "umConfirmOkDanger" : ""}`} onClick={onConfirm}>
          Confirm
        </button>
      </div>
    </div>
  );
}

// Action button
function ActionBtn({
  label,
  variant,
  onClick,
  disabled,
}: {
  label: string;
  variant: "ban" | "deactivate" | "delete" | "activate" | "unban";
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button className={`umActionBtn umActionBtn--${variant}`} onClick={onClick} disabled={disabled}>
      {label}
    </button>
  );
}

// Role badge
function RoleBadge({ role }: { role: string }) {
  return (
    <span className={`umRoleBadge umRoleBadge--${role.toLowerCase()}`}>{role}</span>
  );
}

// Status badge
function StatusBadge({ isActive, isBanned }: { isActive: boolean; isBanned: boolean }) {
  if (isBanned)   return <span className="umStatusBadge umStatusBadge--banned">Banned</span>;
  if (!isActive)  return <span className="umStatusBadge umStatusBadge--inactive">Inactive</span>;
  return <span className="umStatusBadge umStatusBadge--active">Active</span>;
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
        <div className="umTableHead umTableHead--all">
          <span>Name</span>
          <span>Email</span>
          <span>Role</span>
          <span>Status</span>
          <span>Joined</span>
          <span>Owned</span>
        </div>
        <div className="umTableBody">
        {users.length === 0 && <p className="umEmpty">No users yet.</p>}
        {users.map(user => (
          <div key={user.id} className="umTableRow umTableRow--all">
            <span className="umCell umCellName">{user.name ?? <em className="umNone">—</em>}</span>
            <span className="umCell umCellMuted">{user.email}</span>
            <span className="umCell"><RoleBadge role={user.role} /></span>
            <span className="umCell"><StatusBadge isActive={user.isActive} isBanned={user.isBanned} /></span>
            <span className="umCell umCellMuted">
              {new Date(user.createdAt).toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" })}
            </span>
            <span className="umCell umCellOwned">
              {user.ownership.length === 0
                ? <em className="umNone">None</em>
                : user.ownership.map(o => (
                    <span key={o.productId} className="umOwnedTag">{o.product.name}</span>
                  ))
              }
            </span>
          </div>
        ))}
        </div>
      </div>
    </div>
  );
}

// ── Card 2 — Active Users ─────────────────────────────────────────────

function ActiveUsersCard({
  users,
  onAction,
  pendingId,
}: {
  users: User[];
  onAction: (userId: string, action: ActionType) => void;
  pendingId: string | null;
}) {
  const [search, setSearch] = useState("");
  const [confirmState, setConfirmState] = useState<{ userId: string; action: ActionType } | null>(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return users.filter(u =>
      (u.name ?? "").toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
    );
  }, [users, search]);

  function requestAction(userId: string, action: ActionType) {
    if (action === "delete" || action === "ban") {
      setConfirmState({ userId, action });
    } else {
      onAction(userId, action);
    }
  }

  function confirmAction() {
    if (!confirmState) return;
    onAction(confirmState.userId, confirmState.action);
    setConfirmState(null);
  }

  return (
    <div className="umCard">
      <div className="umCardHeader">
        <h2 className="umCardTitle">Active Users</h2>
        <span className="umCardBadge umCardBadge--active">{users.length}</span>
      </div>

      {/* Search */}
      <div className="umSearchWrap">
        <svg className="umSearchIcon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          className="umSearchInput"
          type="text"
          placeholder="Search by name or email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        {search && (
          <button className="umSearchClear" onClick={() => setSearch("")}>✕</button>
        )}
      </div>

      <div className="umTable">
        <div className="umTableHead umTableHead--active">
          <span>Name</span>
          <span>Email</span>
          <span>Joined</span>
          <span>Owned</span>
          <span>Actions</span>
        </div>
        <div className="umTableBody">
        {filtered.length === 0 && <p className="umEmpty">{search ? "No users match your search." : "No active users."}</p>}
        {filtered.map(user => (
          <div key={user.id} className="umTableRow umTableRow--active">
            <span className="umCell umCellName">{user.name ?? <em className="umNone">—</em>}</span>
            <span className="umCell umCellMuted">{user.email}</span>
            <span className="umCell umCellMuted">
              {new Date(user.createdAt).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })}
            </span>
            <span className="umCell umCellOwned">
              {user.ownership.length === 0
                ? <em className="umNone">None</em>
                : <span className="umOwnedCount">{user.ownership.length} system{user.ownership.length !== 1 ? "s" : ""}</span>
              }
            </span>
            <span className="umCell umCellActions">
              {confirmState?.userId === user.id ? (
                <ConfirmPopover
                  message={confirmState.action === "ban"
                    ? "Ban this user? They will lose all access."
                    : "Permanently delete this user and all their data?"}
                  danger
                  onConfirm={confirmAction}
                  onCancel={() => setConfirmState(null)}
                />
              ) : (
                <div className="umActionsGroup">
                  <ActionBtn label="Ban"        variant="ban"        disabled={!!pendingId} onClick={() => requestAction(user.id, "ban")} />
                  <ActionBtn label="Deactivate" variant="deactivate" disabled={!!pendingId} onClick={() => requestAction(user.id, "deactivate")} />
                  <ActionBtn label="Delete"     variant="delete"     disabled={!!pendingId} onClick={() => requestAction(user.id, "delete")} />
                </div>
              )}
            </span>
          </div>
        ))}
        </div>
      </div>
    </div>
  );
}

// ── Card 3 — Non-active Users ─────────────────────────────────────────

function NonActiveUsersCard({
  users,
  onAction,
  pendingId,
}: {
  users: User[];
  onAction: (userId: string, action: ActionType) => void;
  pendingId: string | null;
}) {
  const [confirmState, setConfirmState] = useState<{ userId: string; action: ActionType } | null>(null);

  function requestAction(userId: string, action: ActionType) {
    if (action === "delete") {
      setConfirmState({ userId, action });
    } else {
      onAction(userId, action);
    }
  }

  function confirmAction() {
    if (!confirmState) return;
    onAction(confirmState.userId, confirmState.action);
    setConfirmState(null);
  }

  return (
    <div className="umCard">
      <div className="umCardHeader">
        <h2 className="umCardTitle">Non-active &amp; Banned Users</h2>
        <span className="umCardBadge umCardBadge--inactive">{users.length}</span>
      </div>

      <div className="umTable">
        <div className="umTableHead umTableHead--inactive">
          <span>Name</span>
          <span>Email</span>
          <span>Status</span>
          <span>Joined</span>
          <span>Actions</span>
        </div>
        <div className="umTableBody">
        {users.length === 0 && <p className="umEmpty">No non-active or banned users.</p>}
        {users.map(user => (
          <div key={user.id} className="umTableRow umTableRow--inactive">
            <span className="umCell umCellName">{user.name ?? <em className="umNone">—</em>}</span>
            <span className="umCell umCellMuted">{user.email}</span>
            <span className="umCell"><StatusBadge isActive={user.isActive} isBanned={user.isBanned} /></span>
            <span className="umCell umCellMuted">
              {new Date(user.createdAt).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })}
            </span>
            <span className="umCell umCellActions">
              {confirmState?.userId === user.id ? (
                <ConfirmPopover
                  message="Permanently delete this user and all their data?"
                  danger
                  onConfirm={confirmAction}
                  onCancel={() => setConfirmState(null)}
                />
              ) : (
                <div className="umActionsGroup">
                  <ActionBtn label="Activate" variant="activate" disabled={!!pendingId} onClick={() => requestAction(user.id, "activate")} />
                  <ActionBtn label="Delete"   variant="delete"   disabled={!!pendingId} onClick={() => requestAction(user.id, "delete")} />
                </div>
              )}
            </span>
          </div>
        ))}
        </div>
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────

export default function UsersClient({ initialUsers }: Props) {
  const [users, setUsers]     = useState<User[]>(initialUsers);
  const [pendingId, setPending] = useState<string | null>(null);
  const [toast, setToast]     = useState<{ msg: string; type: "ok" | "err" } | null>(null);

  const activeUsers    = users.filter(u => u.isActive && !u.isBanned);
  const nonActiveUsers = users.filter(u => !u.isActive || u.isBanned);

  function showToast(msg: string, type: "ok" | "err") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }

  async function handleAction(userId: string, action: ActionType) {
    setPending(userId);
    let success = false;

    if (action === "delete") {
      success = await deleteUser(userId);
      if (success) {
        setUsers(prev => prev.filter(u => u.id !== userId));
        showToast("User deleted.", "ok");
      }
    } else {
      success = await patchUser(userId, action);
      if (success) {
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
      {/* Toast */}
      {toast && (
        <div className={`umToast umToast--${toast.type}`}>{toast.msg}</div>
      )}

      <AllUsersCard   users={users} />
      <ActiveUsersCard    users={activeUsers}    onAction={handleAction} pendingId={pendingId} />
      <NonActiveUsersCard users={nonActiveUsers} onAction={handleAction} pendingId={pendingId} />
    </div>
  );
}