// OrdersClient.tsx — Orders table with filter tabs, full status control,
// delivery note, estimated delivery date, and buyer email notification via EmailJS.
"use client";

import { useState } from "react";
import emailjs      from "@emailjs/browser";
import { sanitize } from "@/lib/utils";

type OrderStatus =
  | "PAID" | "PENDING" | "FAILED"
  | "IN_DEVELOPMENT" | "IN_TESTING" | "DELIVERED";

interface Order {
  id:              string;
  status:          OrderStatus;
  amountPaid:      number | null;
  paymongoOrderId: string | null;
  createdAt:       Date;
  deliveryNote:    string | null;
  estimatedAt:     Date | null;
  userId:          string;
  user:            { name: string | null; email: string };
  product:         { id: string; name: string } | null;
  system:          { id: string; title: string } | null;
}

interface Props { orders: Order[]; }

type FilterTab = "ALL" | OrderStatus;

// ── EmailJS config — reads from env ──────────────────────────────────
const EMAILJS_SERVICE_ID  = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID  ?? "";
const EMAILJS_PUBLIC_KEY  = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY  ?? "";
const EMAILJS_STATUS_TEMPLATE = process.env.NEXT_PUBLIC_EMAILJS_ORDER_STATUS_TEMPLATE_ID ?? "";

const filterTabs: { label: string; value: FilterTab }[] = [
  { label: "All",        value: "ALL"           },
  { label: "Paid",       value: "PAID"          },
  { label: "Pending",    value: "PENDING"       },
  { label: "Failed",     value: "FAILED"        },
  { label: "In Dev",     value: "IN_DEVELOPMENT"},
  { label: "In Testing", value: "IN_TESTING"    },
  { label: "Delivered",  value: "DELIVERED"     },
];

const STATUS_COLOR: Record<OrderStatus, string> = {
  PAID:           "#68d391",
  PENDING:        "#f6ad55",
  FAILED:         "#fc8181",
  IN_DEVELOPMENT: "#63b3ed",
  IN_TESTING:     "#b794f4",
  DELIVERED:      "#c9a96e",
};

const STATUS_LABEL: Record<OrderStatus, string> = {
  PAID:           "PAID",
  PENDING:        "PENDING",
  FAILED:         "FAILED",
  IN_DEVELOPMENT: "IN DEV",
  IN_TESTING:     "TESTING",
  DELIVERED:      "DELIVERED",
};

// Sends an order status email to the buyer via EmailJS.
// Template variables: buyer_name, product_name, status, delivery_note, estimated_date.
async function sendStatusEmail(order: Order, newStatus: OrderStatus): Promise<void> {
  if (!EMAILJS_SERVICE_ID || !EMAILJS_STATUS_TEMPLATE || !EMAILJS_PUBLIC_KEY) return;

  const estimatedDate = order.estimatedAt
    ? new Date(order.estimatedAt).toLocaleDateString("en-PH", {
        year: "numeric", month: "long", day: "numeric",
      })
    : "To be determined";

  await emailjs.send(
    EMAILJS_SERVICE_ID,
    EMAILJS_STATUS_TEMPLATE,
    {
      buyer_name:     order.user.name ?? order.user.email,
      product_name:   order.product?.name ?? "N/A",
      status:         STATUS_LABEL[newStatus],
      delivery_note:  order.deliveryNote ?? "No additional notes at this time.",
      estimated_date: estimatedDate,
      buyer_email:    order.user.email,
    },
    EMAILJS_PUBLIC_KEY
  );
}

// ── Delivery info panel — note + estimated date ───────────────────────
function DeliveryPanel({
  orderId, note, estimatedAt, onSaved,
}: {
  orderId:     string;
  note:        string | null;
  estimatedAt: Date | null;
  onSaved:     (id: string, note: string | null, est: Date | null) => void;
}) {
  const [noteVal, setNote] = useState(note ?? "");
  const [estVal,  setEst]  = useState(
    estimatedAt ? new Date(estimatedAt).toISOString().slice(0, 10) : ""
  );
  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);
  const [error,  setError]  = useState("");

  async function handleSave() {
    setSaving(true);
    setError("");
    const res = await fetch(`/api/admin/orders/${orderId}`, {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({
        deliveryNote: noteVal.trim() || null,
        estimatedAt:  estVal || null,
      }),
    });
    if (res.ok) {
      onSaved(
        orderId,
        noteVal.trim() || null,
        estVal ? new Date(estVal) : null
      );
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } else {
      setError("Save failed.");
    }
    setSaving(false);
  }

  return (
    <div className="ordDeliveryPanel">
      <p className="ordDeliveryPanelTitle">Delivery Details</p>
      <div className="ordDeliveryPanelFields">
        <div className="ordDeliveryField">
          <label className="ordDeliveryLabel">Delivery Note</label>
          <textarea
            className="ordDeliveryTextarea"
            rows={2}
            placeholder="e.g. Currently building the HR module…"
            value={noteVal}
            onChange={e => setNote(sanitize(e.target.value))}
          />
        </div>
        <div className="ordDeliveryField">
          <label className="ordDeliveryLabel">Estimated Delivery Date</label>
          <input
            type="date"
            className="ordDeliveryInput"
            value={estVal}
            onChange={e => setEst(e.target.value)}
          />
        </div>
      </div>
      {error && <p className="ordDeliveryError">{error}</p>}
      <div className="ordDeliveryActions">
        <button
          className="ordDeliverySaveBtn"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? "Saving…" : saved ? "✓ Saved" : "Save Details"}
        </button>
      </div>
    </div>
  );
}

// ── FileKeyPanel — admin attaches Supabase fileKey to buyer's Ownership record ──
// Only shown when order status is DELIVERED. Writes to Ownership via PATCH /api/admin/unlock.
const TIER_LABELS: Record<string, string> = {
  mesh_only:  "Mesh Only (OBJ + FBX)",
  standard:   "Standard (+ 5 Animations)",
  full_pack:  "Full Pack (+ GLB + 7 Animations)",
};

function FileKeyPanel({
  userId, productId, onSaved,
}: {
  userId:    string;
  productId: string;
  onSaved:   () => void;
}) {
  const [fileKey,     setFileKey]     = useState("");
  const [grantedTier, setGrantedTier] = useState("mesh_only");
  const [saving,      setSaving]      = useState(false);
  const [saved,       setSaved]       = useState(false);
  const [error,       setError]       = useState("");

  async function handleAttach() {
    if (!fileKey.trim()) { setError("Enter a file key."); return; }
    setSaving(true);
    setError("");
    const res = await fetch("/api/admin/unlock", {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ userId, productId, fileKey: fileKey.trim(), grantedTier }),
    });
    if (res.ok) {
      setSaved(true);
      onSaved();
      setTimeout(() => setSaved(false), 2500);
    } else {
      const data = await res.json();
      setError(data.error ?? "Save failed.");
    }
    setSaving(false);
  }

  async function handleClear() {
    setSaving(true);
    setError("");
    const res = await fetch("/api/admin/unlock", {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ userId, productId, fileKey: null }),
    });
    if (res.ok) {
      setFileKey("");
      setSaved(false);
      onSaved();
    } else {
      setError("Clear failed.");
    }
    setSaving(false);
  }

  return (
    <div className="ordFileKeyPanel">
      <p className="ordFileKeyPanelTitle">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="17 8 12 3 7 8"/>
          <line x1="12" y1="3" x2="12" y2="15"/>
        </svg>
        Attach Download File
      </p>
      <p className="ordFileKeyPanelHint">
        Select the tier granted, then paste the Supabase storage key. Buyer sees only files for their tier.
      </p>
      <div className="ordFileKeyTierRow">
        {Object.entries(TIER_LABELS).map(([val, label]) => (
          <button
            key={val}
            className={`ordTierBtn ${grantedTier === val ? "ordTierBtnActive" : ""}`}
            onClick={() => setGrantedTier(val)}
            type="button"
          >
            {label}
          </button>
        ))}
      </div>
      <div className="ordFileKeyRow">
        <input
          className="ordFileKeyInput"
          type="text"
          placeholder="e.g. weapons/axe-01/axe-01-mesh.zip"
          value={fileKey}
          onChange={e => setFileKey(sanitize(e.target.value))}
          spellCheck={false}
        />
        <button
          className="ordFileKeySaveBtn"
          onClick={handleAttach}
          disabled={saving}
        >
          {saving ? "Saving…" : saved ? "✓ Attached" : "Attach"}
        </button>
        <button
          className="ordFileKeyClearBtn"
          onClick={handleClear}
          disabled={saving}
          title="Clear existing fileKey from this ownership record"
        >
          Clear
        </button>
      </div>
      {error && <p className="ordFileKeyError">{error}</p>}
    </div>
  );
}

// ── Status selector dropdown ──────────────────────────────────────────
function StatusSelector({
  orderId, current, onUpdate, disabled,
}: {
  orderId:  string;
  current:  OrderStatus;
  onUpdate: (id: string, status: OrderStatus) => void;
  disabled: boolean;
}) {
  const [open, setOpen] = useState(false);
  const options: OrderStatus[] = [
    "PAID", "PENDING", "FAILED",
    "IN_DEVELOPMENT", "IN_TESTING", "DELIVERED",
  ];

  return (
    <div className="ordStatusWrap">
      <button
        className={`ordStatusBtn ordStatusBtn--${current.toLowerCase()}`}
        onClick={() => setOpen(o => !o)}
        disabled={disabled}
        title="Click to change status"
      >
        <span className="ordStatusDot" style={{ background: STATUS_COLOR[current] }} />
        {STATUS_LABEL[current]}
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <div className="ordStatusDropdown">
          {options.filter(s => s !== current).map(s => (
            <button
              key={s}
              className={`ordStatusOption ordStatusOption--${s.toLowerCase()}`}
              onClick={() => { onUpdate(orderId, s); setOpen(false); }}
            >
              <span className="ordStatusDot" style={{ background: STATUS_COLOR[s] }} />
              {STATUS_LABEL[s]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────
export default function OrdersClient({ orders: initialOrders }: Props) {
  const [orders,       setOrders]  = useState<Order[]>(initialOrders);
  const [activeFilter, setFilter]  = useState<FilterTab>("ALL");
  const [pendingId,    setPending] = useState<string | null>(null);
  const [expandedId,   setExpanded]= useState<string | null>(null);
  const [toast,        setToast]   = useState<{ msg: string; type: "ok"|"err"|"info" } | null>(null);

  const filtered = activeFilter === "ALL"
    ? orders
    : orders.filter(o => o.status === activeFilter);

  function showToast(msg: string, type: "ok"|"err"|"info") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }

  // Updates order status in DB then sends buyer email notification.
  async function handleStatusUpdate(orderId: string, newStatus: OrderStatus) {
    setPending(orderId);

    const res = await fetch(`/api/admin/orders/${orderId}`, {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ status: newStatus }),
    });

    if (res.ok) {
      // Update local state first so delivery note is available for the email
      const updatedOrder = orders.find(o => o.id === orderId);
      setOrders(prev => prev.map(o =>
        o.id === orderId ? { ...o, status: newStatus } : o
      ));
      showToast(`Status updated to ${STATUS_LABEL[newStatus]}.`, "ok");

      // Send buyer notification email — non-blocking, silent on failure
      if (updatedOrder) {
        const orderWithNewStatus = { ...updatedOrder, status: newStatus };
        sendStatusEmail(orderWithNewStatus, newStatus).then(() => {
          showToast(`✉ Buyer notified: ${STATUS_LABEL[newStatus]}.`, "info");
        }).catch(() => {
          // Email failure is non-critical — do not disrupt admin workflow
        });
      }
    } else {
      showToast("Failed to update order.", "err");
    }

    setPending(null);
  }

  function handleDeliverySaved(
    orderId:     string,
    note:        string | null,
    estimatedAt: Date | null,
  ) {
    setOrders(prev => prev.map(o =>
      o.id === orderId ? { ...o, deliveryNote: note, estimatedAt } : o
    ));
    showToast("Delivery details saved.", "ok");
  }

  return (
    <div className="adminOrdersContent">

      {/* Toast */}
      {toast && (
        <div className={`ordToast ordToast--${toast.type}`}>{toast.msg}</div>
      )}

      {/* Filter tabs */}
      <div className="adminOrdersFilterTabs">
        {filterTabs.map(tab => (
          <button
            key={tab.value}
            className={`adminOrdersFilterTab${activeFilter === tab.value ? " adminOrdersFilterTabActive" : ""}`}
            onClick={() => setFilter(tab.value)}
          >
            {tab.label}
            <span className="adminOrdersFilterCount">
              {tab.value === "ALL"
                ? orders.length
                : orders.filter(o => o.status === tab.value).length}
            </span>
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="adminOrdersTableWrap">
        <div className="adminOrdersTableHeader">
          <span>Order ID</span>
          <span>Customer</span>
          <span>Product</span>
          <span>Status</span>
          <span>Amount</span>
          <span>Date</span>
        </div>

        {filtered.length === 0 && (
          <p className="adminEmptyNote">No orders match this filter.</p>
        )}

        {filtered.map(order => {
          const isExpanded = expandedId === order.id;
          const hasDelivery = order.deliveryNote || order.estimatedAt;
          return (
            <div key={order.id} className="ordRowGroup">
              <div className="adminOrdersTableRow">
                <span className="adminOrdersCell adminOrdersCellId">
                  #{order.id.slice(-6).toUpperCase()}
                </span>
                <span className="adminOrdersCell adminOrdersCellName">
                  <span className="adminOrdersCellNameMain">
                    {order.user.name ?? order.user.email}
                  </span>
                  {order.user.name && (
                    <span className="adminOrdersCellNameEmail">{order.user.email}</span>
                  )}
                </span>
                <span className="adminOrdersCell adminOrdersCellMuted">
                  {order.product?.name ?? order.system?.title ?? "—"}
                </span>
                <span className="adminOrdersCell">
                  <StatusSelector
                    orderId={order.id}
                    current={order.status}
                    onUpdate={handleStatusUpdate}
                    disabled={pendingId === order.id}
                  />
                </span>
                <span className="adminOrdersCell adminOrdersCellMono">
                  {order.amountPaid
                    ? `₱${(order.amountPaid / 100).toLocaleString()}`
                    : <span className="adminCellEmpty">—</span>}
                </span>
                <span className="adminOrdersCell adminOrdersCellActions">
                  <span className="adminOrdersCellMuted adminOrdersCellDate">
                    {new Date(order.createdAt).toLocaleDateString("en-PH", {
                      year: "numeric", month: "short", day: "numeric",
                    })}
                  </span>
                  <button
                    className={`ordDeliveryToggleBtn ${isExpanded ? "ordDeliveryToggleBtnOpen" : ""} ${hasDelivery ? "ordDeliveryToggleBtnHasData" : ""}`}
                    onClick={() => setExpanded(isExpanded ? null : order.id)}
                    title="Set delivery note & estimated date"
                  >
                    {hasDelivery ? "📦" : "📋"}
                    <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </button>
                </span>
              </div>

              {/* Delivery panel + FileKey panel — expanded inline */}
              {isExpanded && (
                <>
                  <DeliveryPanel
                    orderId={order.id}
                    note={order.deliveryNote}
                    estimatedAt={order.estimatedAt}
                    onSaved={handleDeliverySaved}
                  />
                  {order.status === "DELIVERED" && (order.product || order.system) && (
                    <FileKeyPanel
                      userId={order.userId}
                      productId={order.product?.id ?? order.system?.id ?? ""}
                      onSaved={() => showToast("✓ File key attached. Buyer can now download.", "ok")}
                    />
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>

    </div>
  );
}