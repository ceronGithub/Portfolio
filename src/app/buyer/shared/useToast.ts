"use client";
// useToast.ts — Lightweight toast notification hook.
// Returns { toasts, showToast }. Max 3 toasts visible at once.

import { useState, useCallback } from "react";

export type ToastType = "success" | "warning" | "error";

export interface Toast {
  id:      string;
  message: string;
  type:    ToastType;
}

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = "success", duration = 2800) => {
    const id = Math.random().toString(36).slice(2);
    setToasts(prev => [...prev.slice(-2), { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, duration);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return { toasts, showToast, dismissToast };
}
