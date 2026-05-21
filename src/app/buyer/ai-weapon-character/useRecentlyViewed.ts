// useRecentlyViewed.ts — Tracks recently previewed asset IDs in localStorage.
// Max 8 items. Most recent first. Stores { id, label, category, price } snapshots.
// Called from AssetBuySection when buyer opens Quick View or clicks an asset row.

"use client";

import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "buyerRecentlyViewed";
const MAX_ITEMS   = 8;

export interface RecentItem {
  id:       string;
  label:    string;
  category: string;
  price:    number;
}

function load(): RecentItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as RecentItem[]) : [];
  } catch {
    return [];
  }
}

function save(items: RecentItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch { /* quota */ }
}

export function useRecentlyViewed() {
  const [recentItems, setRecentItems] = useState<RecentItem[]>([]);

  useEffect(() => {
    setRecentItems(load());
  }, []);

  // Call this when buyer previews or clicks an asset
  const trackView = useCallback((item: RecentItem) => {
    setRecentItems(prev => {
      // Remove if already present, then prepend
      const filtered = prev.filter(r => r.id !== item.id);
      const next     = [item, ...filtered].slice(0, MAX_ITEMS);
      save(next);
      return next;
    });
  }, []);

  const clearRecent = useCallback(() => {
    setRecentItems([]);
    save([]);
  }, []);

  return { recentItems, trackView, clearRecent };
}
