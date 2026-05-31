"use client";
// src/app/visitor/layout.tsx
// Disables right-click context menu across all visitor pages.
import { useEffect } from "react";

export default function VisitorLayout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    function blockContextMenu(e: MouseEvent) { e.preventDefault(); }
    document.addEventListener("contextmenu", blockContextMenu);
    return () => document.removeEventListener("contextmenu", blockContextMenu);
  }, []);

  return <>{children}</>;
}