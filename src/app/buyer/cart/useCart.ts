"use client";
// useCart.ts — Unified cart hook for buyer dashboard.
// Holds a Set of asset IDs across all sections (characters, weapons, architecture).
// Persists to sessionStorage — clears on tab close, no stale cart.

import { useState, useCallback } from "react";

const SESSION_KEY = "buyerCart";

function loadCart(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? new Set(JSON.parse(raw) as string[]) : new Set();
  } catch { return new Set(); }
}

function saveCart(ids: Set<string>) {
  try { sessionStorage.setItem(SESSION_KEY, JSON.stringify([...ids])); } catch {}
}

export function useCart() {
  const [cartIds, setCartIds] = useState<Set<string>>(() => loadCart());

  const addToCart = useCallback((ids: string[]) => {
    setCartIds(prev => {
      const next = new Set(prev);
      ids.forEach(id => next.add(id));
      saveCart(next);
      return next;
    });
  }, []);

  const removeFromCart = useCallback((id: string) => {
    setCartIds(prev => {
      const next = new Set(prev);
      next.delete(id);
      saveCart(next);
      return next;
    });
  }, []);

  const clearCart = useCallback(() => {
    setCartIds(new Set());
    saveCart(new Set());
  }, []);

  return { cartIds, addToCart, removeFromCart, clearCart };
}
