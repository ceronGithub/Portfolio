// useAdminNotifications — polls /api/admin/notifications every 30 seconds.
// Only active when isAdmin is true. Silently ignores network errors.
"use client";

import { useState, useEffect, useRef } from "react";

export interface NotificationCounts {
  total:     number;
  orders:    number;
  messages:  number;
  inquiries: number;
  reviews:   number;
}

const ZERO: NotificationCounts = { total: 0, orders: 0, messages: 0, inquiries: 0, reviews: 0 };
const POLL_MS = 30_000;

export function useAdminNotifications(isAdmin: boolean): NotificationCounts {
  const [counts, setCounts] = useState<NotificationCounts>(ZERO);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  async function fetchCounts() {
    try {
      const res = await fetch("/api/admin/notifications");
      if (!res.ok) return;
      const d = await res.json();
      setCounts({
        total:     d.total     ?? 0,
        orders:    d.orders    ?? 0,
        messages:  d.messages  ?? 0,
        inquiries: d.inquiries ?? 0,
        reviews:   d.reviews   ?? 0,
      });
    } catch { /* silent */ }
  }

  useEffect(() => {
    if (!isAdmin) { setCounts(ZERO); return; }
    fetchCounts();
    timerRef.current = setInterval(fetchCounts, POLL_MS);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  return counts;
}