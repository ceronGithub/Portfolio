// Manual unlock button. Admin selects a product and grants ownership to a user.
// Calls /api/admin/unlock Server Action to inject Ownership record.
"use client";

import { useState } from "react";

interface Product { id: string; name: string; }

interface Props {
  userId: string;
  products: Product[];
  ownedIds: string[];
}

export default function ManualUnlockButton({ userId, products, ownedIds }: Props) {
  const [selected, setSelected] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const available = products.filter((p) => !ownedIds.includes(p.id));
  if (available.length === 0) return <span className="allOwned">All owned</span>;

  // Sends unlock request to API and refreshes on success.
  async function handleUnlock() {
    if (!selected) return;
    setLoading(true);
    const res = await fetch("/api/admin/unlock", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, productId: selected }),
    });
    if (res.ok) {
      setDone(true);
      window.location.reload();
    }
    setLoading(false);
  }

  if (done) return <span className="unlockDone">Unlocked!</span>;

  return (
    <div className="unlockGroup">
      <select className="unlockSelect" value={selected} onChange={(e) => setSelected(e.target.value)}>
        <option value="">Select...</option>
        {available.map((p) => (
          <option key={p.id} value={p.id}>{p.name}</option>
        ))}
      </select>
      <button className="unlockBtn" onClick={handleUnlock} disabled={!selected || loading}>
        {loading ? "..." : "Unlock"}
      </button>
    </div>
  );
}