// AdminShell.tsx — Thin wrapper. No sidebar — navigation handled by Navbar.tsx floating pill.
// Applies dark/light theme from localStorage "adminTheme" to the page shell.
"use client";

import { useState, useEffect } from "react";
import "../app/admin/admin-shell.css";

interface Props {
  children: React.ReactNode;
  adminName?: string;
}

export default function AdminShell({ children, adminName }: Props) {
  const [isDark, setIsDark] = useState(false);

  // Read persisted theme on mount — Navbar.tsx writes "adminTheme" to localStorage
  useEffect(() => {
    const apply = () => {
      const saved = localStorage.getItem("adminTheme");
      setIsDark(saved === "dark");
    };
    apply();
    // Re-apply whenever another tab/component changes it
    window.addEventListener("storage", apply);
    // Also listen for custom event fired by Navbar toggle
    window.addEventListener("adminThemeChange", apply);
    return () => {
      window.removeEventListener("storage", apply);
      window.removeEventListener("adminThemeChange", apply);
    };
  }, []);

  // Disable right-click context menu on all admin pages
  useEffect(() => {
    const blockContextMenu = (e: MouseEvent) => e.preventDefault();
    document.addEventListener("contextmenu", blockContextMenu);
    return () => document.removeEventListener("contextmenu", blockContextMenu);
  }, []);

  return (
    <div className={`adminShell adminShellNoSidebar${isDark ? " adminShellDark" : ""}`}>
      <main className="adminMain adminMainFull">
        {children}
      </main>
    </div>
  );
}