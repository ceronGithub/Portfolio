"use client";
// buyer/layout.tsx — wraps all /buyer/* pages.
// On every page navigation, polls /api/auth/check-status.
// If the account is banned or deactivated, forces signOut immediately.
import { useEffect }    from "react";
import { useSession, signOut } from "next-auth/react";
import { usePathname }  from "next/navigation";

export default function BuyerLayout({ children }: { children: React.ReactNode }) {
  const { status } = useSession();
  const pathname   = usePathname();

  useEffect(() => {
    // Only run when session is active
    if (status !== "authenticated") return;

    async function checkAccountStatus() {
      try {
        const res  = await fetch("/api/auth/check-status", { cache: "no-store" });
        const data = await res.json();

        if (data.banned) {
          await signOut({ callbackUrl: "/login?reason=banned" });
        } else if (data.deactivated) {
          await signOut({ callbackUrl: "/login?reason=deactivated" });
        }
      } catch {
        // Network error — don't force logout, fail silently
      }
    }

    checkAccountStatus();
  }, [pathname, status]); // re-runs on every page change

  return <>{children}</>;
}