// useWishlist.ts — Custom hook for buyer wishlist state.
// Persists wishlisted asset/system IDs to localStorage under key "buyerWishlist".
// Returns the set of wishlisted IDs, a toggle function, and a clear function.

"use client";

import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "buyerWishlist";

function loadFromStorage(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw) as string[]);
  } catch {
    return new Set();
  }
}

function saveToStorage(ids: Set<string>): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]));
  } catch {
    // storage quota exceeded — silently skip
  }
}

export function useWishlist() {
  const [wishlistIds, setWishlistIds] = useState<Set<string>>(new Set());

  // Hydrate from localStorage on mount (client only)
  useEffect(() => {
    setWishlistIds(loadFromStorage());
  }, []);

  // Toggle an id in/out of the wishlist
  const toggleWishlist = useCallback((id: string) => {
    setWishlistIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      saveToStorage(next);
      return next;
    });
  }, []);

  // Clear the entire wishlist
  const clearWishlist = useCallback(() => {
    setWishlistIds(new Set());
    saveToStorage(new Set());
  }, []);

  return { wishlistIds, toggleWishlist, clearWishlist };
}