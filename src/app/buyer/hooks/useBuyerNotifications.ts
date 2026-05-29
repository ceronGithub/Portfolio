// useBuyerNotifications — polls /api/buyer/notifications every 30 seconds.
// Only active when isBuyer is true. Silently ignores network errors.
"use client";

import { useState, useEffect, useRef } from "react";

export interface BuyerNotificationCounts {
  total:           number;
  pendingOrders:   number;
  activeOrders:    number;
  recentDelivered: number;
  confirmedVc:     number;
  resolvedBugs:    number;
}

const ZERO: BuyerNotificationCounts = {
  total: 0, pendingOrders: 0, activeOrders: 0,
  recentDelivered: 0, confirmedVc: 0, resolvedBugs: 0,
};

const POLL_MS = 30_000;

export function useBuyerNotifications(isBuyer: boolean): BuyerNotificationCounts {
  const [counts, setCounts] = useState<BuyerNotificationCounts>(ZERO);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  async function fetchCounts() {
    try {
      const res = await fetch("/api/buyer/notifications");
      if (!res.ok) return;
      const data = await res.json();
      setCounts({
        total:           data.total           ?? 0,
        pendingOrders:   data.pendingOrders   ?? 0,
        activeOrders:    data.activeOrders    ?? 0,
        recentDelivered: data.recentDelivered ?? 0,
        confirmedVc:     data.confirmedVc     ?? 0,
        resolvedBugs:    data.resolvedBugs    ?? 0,
      });
    } catch { /* silent */ }
  }

  useEffect(() => {
    if (!isBuyer) { setCounts(ZERO); return; }
    fetchCounts();
    timerRef.current = setInterval(fetchCounts, POLL_MS);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isBuyer]);

  return counts;
}
