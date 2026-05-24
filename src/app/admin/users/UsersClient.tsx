// UsersClient.tsx — User Management client component.
// Card 1: All registered users.
// Card 2: Active users — search, ban/deactivate/delete actions.
// Card 3: Non-active/banned — activate/delete actions.
// Card 4: Action logs — 4 tabs: Ban / Delete / Deactivate / Activate.
// IntersectionObserver entrance animations on all cards.
"use client";

import { useState, useMemo, useEffect, useRef } from "react";

// ── useReveal — IntersectionObserver entrance animation ───────────────
// Adds "umVisible" class when the element enters the viewport.
function useReveal() {
  const elementRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = elementRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) el.classList.add("umVisible"); },
      { threshold: 0.08 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return elementRef;
}

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

interface ProductOption { id: string; name: string; previewVideoUrl?: string | null; facePngUrl?: string | null; }
interface Props { initialUsers: User[]; initialLogs: ActionLog[]; products: ProductOption[]; }

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

// Calls /api/admin/unlock to create an Ownership record without payment.
async function grantUnlock(userId: string, productId: string): Promise<boolean> {
  const res = await fetch("/api/admin/unlock", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, productId }),
  });
  return res.ok;
}

// Calls /api/admin/unlock (DELETE) to remove an Ownership record.
async function revokeUnlock(userId: string, productId: string): Promise<boolean> {
  const res = await fetch("/api/admin/unlock", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, productId }),
  });
  return res.ok;
}

// ── ManualUnlockModal — modal to grant a buyer access to a product ────
// Admin picks a product from a custom dropdown with video preview;
// calls /api/admin/unlock on confirm.
function ManualUnlockModal({ user, products, onDone, onClose }: {
  user: User;
  products: ProductOption[];
  onDone: (userId: string, productId: string, productName: string) => void;
  onClose: () => void;
}) {
  const alreadyOwned  = new Set(user.ownership.map(o => o.productId));
  const available     = products.filter(p => !alreadyOwned.has(p.id));

  const [selectedProductId, setSelected] = useState(available[0]?.id ?? "");
  const [dropdownOpen, setDropdownOpen]  = useState(false);
  const [saving, setSaving]              = useState(false);
  const [error, setError]                = useState("");

  const selectedProduct = available.find(p => p.id === selectedProductId) ?? null;

  async function handleGrant() {
    if (!selectedProductId) return;
    setSaving(true);
    setError("");
    const ok = await grantUnlock(user.id, selectedProductId);
    if (ok) {
      const productName = selectedProduct?.name ?? selectedProductId;
      onDone(user.id, selectedProductId, productName);
      onClose();
    } else {
      setError("Failed to grant access. Try again.");
    }
    setSaving(false);
  }

  return (
    <div className="umUnlockOverlay" onClick={onClose}>
      <div className="umUnlockModal" onClick={e => e.stopPropagation()}>

        {/* ── Modal eyebrow ── */}
        <p className="umUnlockTitle">Manual Unlock</p>

        {/* ── User info card ── */}
        <div className="umUnlockInfoCard">
          <div className="umUnlockInfoHeader">
            <div className="umUnlockAvatar">
              {(user.name ?? user.email).charAt(0).toUpperCase()}
            </div>
            <div className="umUnlockInfoMeta">
              <p className="umUnlockInfoName">{user.name ?? <em style={{ fontStyle: "normal", opacity: 0.5 }}>No name</em>}</p>
              <p className="umUnlockInfoEmail">{user.email}</p>
            </div>
          </div>
          <div className="umUnlockInfoRows">
            <div className="umUnlockInfoRow">
              <span className="umUnlockInfoLabel">Role</span>
              <RoleBadge role={user.role} />
            </div>
            <div className="umUnlockInfoRow">
              <span className="umUnlockInfoLabel">Status</span>
              <StatusBadge isActive={user.isActive} isBanned={user.isBanned} />
            </div>
            <div className="umUnlockInfoRow">
              <span className="umUnlockInfoLabel">Joined</span>
              <span className="umUnlockInfoValue">
                {new Date(user.createdAt).toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" })}
              </span>
            </div>
            <div className="umUnlockInfoRow">
              <span className="umUnlockInfoLabel">Owned</span>
              <span className="umUnlockInfoValue">
                {user.ownership.length === 0
                  ? <em style={{ fontStyle: "normal", opacity: 0.4 }}>None</em>
                  : <span className="umUnlockOwnedList">
                      {user.ownership.map(o => (
                        <span key={o.productId} className="umOwnedTag">{o.product.name}</span>
                      ))}
                    </span>
                }
              </span>
            </div>
          </div>
        </div>

        {/* ── How-to hint ── */}
        <div className="umUnlockHint">
          <div className="umUnlockHintIcon">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="5,3 19,12 5,21"/>
            </svg>
          </div>
          <div>
            <p className="umUnlockHintTitle">How to grant access</p>
            <p className="umUnlockHintDesc">Select a product from the dropdown and click "Grant Access" to unlock it for this user.</p>
          </div>
        </div>

        {/* ── Product picker ── */}
        {available.length === 0 ? (
          <p className="umUnlockEmpty">User already owns all products.</p>
        ) : (
          <>
            {/* Custom dropdown trigger */}
            <div className="umProductPicker">
              <button
                className="umProductPickerTrigger"
                onClick={() => setDropdownOpen(prev => !prev)}
                type="button"
              >
                <span className="umProductPickerLabel">
                  {selectedProduct ? selectedProduct.name : "Select a product"}
                </span>
                <svg
                  className={`umProductPickerChevron${dropdownOpen ? " umProductPickerChevronOpen" : ""}`}
                  width="14" height="14" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2.5"
                >
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </button>

              {/* Dropdown list with video previews */}
              {dropdownOpen && (
                <div className="umProductDropdown">
                  {available.map(p => (
                    <button
                      key={p.id}
                      className={`umProductOption${p.id === selectedProductId ? " umProductOptionSelected" : ""}`}
                      onClick={() => { setSelected(p.id); setDropdownOpen(false); }}
                      type="button"
                    >
                      {/* Video or fallback thumbnail */}
                      <div className="umProductOptionMedia">
                        {p.previewVideoUrl ? (
                          <video
                            className="umProductOptionVideo"
                            src={p.previewVideoUrl}
                            autoPlay muted loop playsInline
                          />
                        ) : p.facePngUrl ? (
                          <img className="umProductOptionVideo" src={p.facePngUrl} alt={p.name} />
                        ) : (
                          <div className="umProductOptionNoMedia">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                              <rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>
                            </svg>
                          </div>
                        )}
                      </div>
                      <span className="umProductOptionName">{p.name}</span>
                      {p.id === selectedProductId && (
                        <svg className="umProductOptionCheck" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {error && <p className="umUnlockError">{error}</p>}
            <div className="umUnlockActions">
              <button className="umUnlockCancelBtn" onClick={onClose}>Cancel</button>
              <button
                className="umUnlockGrantBtn"
                onClick={handleGrant}
                disabled={saving}
              >
                {saving ? "Granting…" : "Grant Access"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}



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

function AllUsersCard({ users, onUnlock, onOwnershipRevoked }: {
  users: User[];
  onUnlock: (user: User) => void;
  onOwnershipRevoked: (userId: string, productId: string) => void;
}) {
  const revealRef = useReveal();
  const [revokingKey, setRevokingKey] = useState<string | null>(null);

  async function handleRevoke(userId: string, productId: string) {
    const key = `${userId}:${productId}`;
    setRevokingKey(key);
    const ok = await revokeUnlock(userId, productId);
    if (ok) onOwnershipRevoked(userId, productId);
    setRevokingKey(null);
  }

  return (
    <div className="umCard" ref={revealRef}>
      <div className="umCardHeader">
        <h2 className="umCardTitle">All Registered Users</h2>
        <span className="umCardBadge">{users.length}</span>
      </div>
      <div className="umTable">
        <div className="umTableHead umGrid--allV2">
          <span>Name</span><span>Email</span><span>Role</span>
          <span>Status</span><span>Joined</span><span>Owned</span><span>Unlock</span>
        </div>
        {users.length === 0 && (
          <div className="umEmpty">
            <svg className="umEmptyIcon" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
            <p className="umEmptyTitle">No users yet</p>
            <p className="umEmptyHint">Registered accounts will appear here.</p>
          </div>
        )}
        {users.map(u => (
          <div key={u.id} className="umTableRow umGrid--allV2">
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
                : u.ownership.map(o => (
                    <span key={o.productId} className="umOwnedTagRevoke">
                      <span className="umOwnedTagName">{o.product.name}</span>
                      <button
                        className="umRevokeBtn"
                        title={`Revoke ${o.product.name}`}
                        disabled={revokingKey === `${u.id}:${o.productId}`}
                        onClick={() => handleRevoke(u.id, o.productId)}
                      >
                        {revokingKey === `${u.id}:${o.productId}` ? "…" : "✕"}
                      </button>
                    </span>
                  ))
              }
            </span>
            <span className="umCell">
              <button
                className="umActionBtn umActionBtn--activate"
                style={{ fontSize: "0.7rem", padding: "0.25rem 0.55rem" }}
                onClick={() => onUnlock(u)}
                title="Manually grant product access"
              >
                🔓 Unlock
              </button>
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
  const revealRef = useReveal();
  const [search, setSearch] = useState("");
  const [confirmState, setConfirmState] = useState<{ userId: string; action: ActionType } | null>(null);

  const filtered = useMemo(() => {
    const query = search.toLowerCase();
    return users.filter(u => (u.name ?? "").toLowerCase().includes(query) || u.email.toLowerCase().includes(query));
  }, [users, search]);

  return (
    <div className="umCard" ref={revealRef}>
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
        {filtered.length === 0 && (
          <div className="umEmpty">
            <svg className="umEmptyIcon" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <p className="umEmptyTitle">{search ? "No users match" : "No active users"}</p>
            <p className="umEmptyHint">{search ? "Try a different search term." : "Active accounts will appear here."}</p>
          </div>
        )}
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
                  {u.role !== "ADMIN" && (
                    <>
                      <ActionBtn label="Ban"        variant="ban"        disabled={!!pendingId} onClick={() => setConfirmState({ userId: u.id, action: "ban" })} />
                      <ActionBtn label="Deactivate" variant="deactivate" disabled={!!pendingId} onClick={() => onAction(u.id, "deactivate")} />
                    </>
                  )}
                  <ActionBtn label="Delete" variant="delete" disabled={!!pendingId} onClick={() => setConfirmState({ userId: u.id, action: "delete" })} />
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
  const revealRef = useReveal();
  const [confirmState, setConfirmState] = useState<{ userId: string; action: ActionType } | null>(null);

  return (
    <div className="umCard" ref={revealRef}>
      <div className="umCardHeader">
        <h2 className="umCardTitle">Non-active &amp; Banned Users</h2>
        <span className="umCardBadge umCardBadge--inactive">{users.length}</span>
      </div>
      <div className="umTable">
        <div className="umTableHead umGrid--inactive">
          <span>Name</span><span>Email</span><span>Status</span><span>Joined</span><span>Actions</span>
        </div>
        {users.length === 0 && (
          <div className="umEmpty">
            <svg className="umEmptyIcon" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M9 12l2 2 4-4"/><circle cx="12" cy="12" r="10"/>
            </svg>
            <p className="umEmptyTitle">All clear</p>
            <p className="umEmptyHint">No non-active or banned accounts.</p>
          </div>
        )}
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
  const revealRef = useReveal();
  const [activeTab, setActiveTab] = useState<LogTab>("BAN");

  const filtered = logs.filter(l => l.action === activeTab);

  const counts: Record<LogTab, number> = {
    BAN:        logs.filter(l => l.action === "BAN").length,
    DELETE:     logs.filter(l => l.action === "DELETE").length,
    DEACTIVATE: logs.filter(l => l.action === "DEACTIVATE").length,
    ACTIVATE:   logs.filter(l => l.action === "ACTIVATE").length,
  };

  return (
    <div className="umCard" ref={revealRef}>
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
          <div className="umEmpty">
            <svg className="umEmptyIcon" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="2"/>
            </svg>
            <p className="umEmptyTitle">No {activeTab.toLowerCase()} actions yet</p>
            <p className="umEmptyHint">Entries will appear here once recorded.</p>
          </div>
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

export default function UsersClient({ initialUsers, initialLogs, products }: Props) {
  const [users, setUsers]             = useState<User[]>(initialUsers);
  const [logs, setLogs]               = useState<ActionLog[]>(initialLogs);
  const [pendingId, setPending]       = useState<string | null>(null);
  const [toast, setToast]             = useState<{ msg: string; type: "ok"|"err" } | null>(null);
  const [unlockTarget, setUnlockTarget] = useState<User | null>(null);
  const headerRef                     = useReveal();

  const activeUsers    = users.filter(u => u.isActive && !u.isBanned);
  const nonActiveUsers = users.filter(u => !u.isActive || u.isBanned);

  function showToast(msg: string, type: "ok"|"err") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }

  // Optimistically appends the newly granted ownership to the target user in local state.
  function handleOwnershipGranted(userId: string, productId: string, productName: string) {
    setUsers(prev => prev.map(u => {
      if (u.id !== userId) return u;
      const alreadyHas = u.ownership.some(o => o.productId === productId);
      if (alreadyHas) return u;
      return { ...u, ownership: [...u.ownership, { productId, product: { name: productName } }] };
    }));
    showToast(`Access granted: ${productName}`, "ok");
  }

  // Optimistically removes the revoked ownership from the target user in local state.
  function handleOwnershipRevoked(userId: string, productId: string) {
    setUsers(prev => prev.map(u => {
      if (u.id !== userId) return u;
      return { ...u, ownership: u.ownership.filter(o => o.productId !== productId) };
    }));
    showToast("Access revoked.", "ok");
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
    <div className="adminUsersPage">
      {/* ── Page header ──────────────────────────────── */}
      <div className="umPageHeader" ref={headerRef}>
        <div>
          <span className="umPageEyebrow">Admin</span>
          <h1 className="umPageTitle">Users</h1>
          <p className="umPageSubtitle">
            Manage registered accounts, permissions, and access logs.
          </p>
        </div>
        <p style={{ fontSize: "0.75rem", color: "var(--sidebar-text)", margin: 0, paddingBottom: "0.25rem" }}>
          {new Date().toLocaleDateString("en-PH", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
        </p>
      </div>

      {toast && <div className={`umToast umToast--${toast.type}`}>{toast.msg}</div>}
      <div className="umRoot">
        <AllUsersCard users={users} onUnlock={setUnlockTarget} onOwnershipRevoked={handleOwnershipRevoked} />
        <ActiveUsersCard    users={activeUsers}    onAction={handleAction} pendingId={pendingId} />
        <NonActiveUsersCard users={nonActiveUsers} onAction={handleAction} pendingId={pendingId} />
        <ActionLogsCard  logs={logs} />
      </div>

      {/* Manual unlock modal — rendered at root to escape umCard overflow:hidden */}
      {unlockTarget && (
        <ManualUnlockModal
          user={unlockTarget}
          products={products}
          onDone={handleOwnershipGranted}
          onClose={() => setUnlockTarget(null)}
        />
      )}
    </div>
  );
}