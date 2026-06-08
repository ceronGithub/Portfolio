// Floating pill navbar. Fixed bottom-center. Glass bubble slides to active item.
// Hides on /login and /register. Role-aware items when session exists.
"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useAdminNotifications }  from "@/app/admin/hooks/useAdminNotifications";
import { useBuyerNotifications }  from "@/app/buyer/hooks/useBuyerNotifications";

/* ── SVG icons ─────────────────────────────────────────────────────── */

function IconHome({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z" />
      <path d="M9 21V12h6v9" />
    </svg>
  );
}

function IconSystems({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="9" height="9" rx="2" />
      <rect x="13" y="3" width="9" height="9" rx="2" />
      <rect x="2" y="13" width="9" height="9" rx="2" />
      <rect x="13" y="13" width="9" height="9" rx="2" />
    </svg>
  );
}

function IconAI({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {/* Brain / neural network icon */}
      <path d="M9.5 2a2.5 2.5 0 0 1 2.45 2H12a2.5 2.5 0 0 1 2.45-2 2.5 2.5 0 0 1 2.45 2.95A2.49 2.49 0 0 1 18 7.5v.05a2.5 2.5 0 0 1 .5 4.9V13a2.5 2.5 0 0 1-2.5 2.5h-.3a2.5 2.5 0 0 1-4.4 0H11A2.5 2.5 0 0 1 8.5 13v-.55A2.5 2.5 0 0 1 9 7.55V7.5a2.49 2.49 0 0 1 .55-3.55A2.5 2.5 0 0 1 9.5 2z" />
      <path d="M12 4.5v3M12 13v3M9 10.5H6M18 10.5h-3M9.5 8l-2-2M16.5 13l-2-2M14.5 8l2-2M9.5 13l-2 2" />
    </svg>
  );
}

function IconPricing({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="1" x2="12" y2="23" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  );
}

function IconAbout({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
    </svg>
  );
}

function IconDashboard({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function IconAdmin({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" />
    </svg>
  );
}

function IconSignIn({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
      <polyline points="10 17 15 12 10 7" />
      <line x1="15" y1="12" x2="3" y2="12" />
    </svg>
  );
}

function IconSignUp({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <line x1="19" y1="8" x2="19" y2="14" />
      <line x1="22" y1="11" x2="16" y2="11" />
    </svg>
  );
}

function IconSignOut({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

function IconSun({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  );
}

function IconMoon({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

// Download tray icon — used in buyer navbar for /buyer/downloads
function IconDownload({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

// Receipt / orders icon — used in buyer navbar for /buyer/orders
function IconOrders({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/>
      <rect x="9" y="3" width="6" height="4" rx="1"/>
      <line x1="9" y1="12" x2="15" y2="12"/>
      <line x1="9" y1="16" x2="13" y2="16"/>
    </svg>
  );
}

// Clock / pending icon — used in buyer navbar for /buyer/pending-payments
function IconPending({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

// Wrench / maintenance icon — used in buyer navbar for /buyer/maintenance
function IconMaintenance({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
    </svg>
  );
}

// Calendar icon — used for /buyer/appointments and /admin/appointments
function IconCalendar({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
      <line x1="16" y1="2" x2="16" y2="6"/>
      <line x1="8" y1="2" x2="8" y2="6"/>
      <line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  );
}

/* ── NotifBadge — red dot with count on admin nav item ────────────────── */
function NotifBadge({ count }: { count: number }) {
  if (count === 0) return null;
  return (
    <span style={{
      position: "absolute", top: "1px", right: "2px",
      minWidth: "15px", height: "15px",
      background: "#f04343", borderRadius: "999px",
      fontSize: "0.6rem", fontWeight: 700, color: "#fff",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "0 3px", lineHeight: 1, pointerEvents: "none", zIndex: 10,
    }}>
      {count > 99 ? "99+" : count}
    </span>
  );
}

/* ── Types ──────────────────────────────────────────────────────────── */

type NavItem = {
  label: string;
  href: string;
  icon: React.ReactNode;
  signOut?: boolean;
  toggleTheme?: boolean;
  isHash?: boolean;
  hashId?: string;
};

/* ── Bubble position — computed directly, no stale ref issues ── */

const BUBBLE_W = 90;

function calcLeft(
  activeIndex: number,
  itemRefs: React.MutableRefObject<(HTMLButtonElement | null)[]>,
  pillRef: React.RefObject<HTMLDivElement | null>,
): number | null {
  if (activeIndex === -1) return null;
  const btn  = itemRefs.current[activeIndex];
  const pill = pillRef.current;
  if (!btn || !pill) return null;
  const pillRect = pill.getBoundingClientRect();
  const btnRect  = btn.getBoundingClientRect();
  return btnRect.left - pillRect.left + btnRect.width / 2 - BUBBLE_W / 2;
}

/* ── Component ──────────────────────────────────────────────────────── */

export default function Navbar() {
  const router   = useRouter();
  const pathname = usePathname();
  const { data: session } = useSession();

  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const pillRef  = useRef<HTMLDivElement>(null);

  const hideOn     = ["/login", "/register"];
  const isAdmin    = (session?.user as any)?.role === "ADMIN";
  const isOnVisitor = pathname === "/" || pathname === "/visitor" || pathname.startsWith("/visitor/");
  // /checkout is a buyer-context route — show buyer navbar links there too
  const isOnBuyer   = pathname.startsWith("/buyer") || pathname.startsWith("/checkout");
  const isOnAdmin   = pathname.startsWith("/admin");

  // Notification counts — polled every 30 s when on admin or buyer pages
  const notif       = useAdminNotifications(isAdmin && isOnAdmin);
  const buyerNotif  = useBuyerNotifications(!isAdmin && isOnBuyer);

  /* ── Admin theme state — synced with localStorage "adminTheme" ──── */
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("adminTheme");
    setIsDark(saved === "dark");
  }, []);

  function toggleAdminTheme() {
    const next = !isDark;
    setIsDark(next);
    localStorage.setItem("adminTheme", next ? "dark" : "light");
    // Notify AdminShell to re-apply theme
    window.dispatchEvent(new Event("adminThemeChange"));
  }

  /* ── Nav items — context-aware ──────────────────────────────────── */

  // Buyer on /buyer pages: Dash + Downloads + Orders + Pending Payments + Profile + Sign Out
  const buyerItems: NavItem[] = [
    { label: "Dash", href: "/buyer", icon: (
      <span style={{ position: "relative", display: "inline-flex" }}>
        <IconDashboard />
        <NotifBadge count={buyerNotif.total} />
      </span>
    )},
    { label: "Downloads",         href: "/buyer/downloads",        icon: <IconDownload />  },
    { label: "Orders",            href: "/buyer/orders",           icon: <IconOrders />    },
    { label: "Pending Payments",  href: "/buyer/pending-payments", icon: <IconPending />      },
    { label: "Maintenance",       href: "/buyer/maintenance",      icon: <IconMaintenance /> },
    { label: "Appointments",      href: "/buyer/appointments",     icon: <IconCalendar />    },
    { label: "Profile",           href: "/buyer/profile",          icon: <IconAbout />        },
    { label: "Sign Out",          href: "#",                       icon: <IconSignOut />,  signOut: true },
  ];

  // Admin on /admin pages: Overview, Users, Products, Orders, Theme toggle, Sign Out
  const adminItems: NavItem[] = [
    { label: "Overview", href: "/admin/dashboard", icon: (
      <span style={{ position: "relative", display: "inline-flex" }}>
        <IconAdmin />
        <NotifBadge count={notif.total} />
      </span>
    )},
    { label: "Users",         href: "/admin/users",         icon: <IconAbout />    },
    { label: "Products",      href: "/admin/products",      icon: <IconSystems />  },
    { label: "Orders",        href: "/admin/orders",        icon: <IconPricing />      },
    { label: "Maintenance",   href: "/admin/maintenance",   icon: <IconMaintenance /> },
    { label: "Reviews",       href: "/admin/reviews",       icon: <IconAbout />    },
    { label: "Testimonials",  href: "/admin/testimonials",  icon: <IconSystems />  },
    { label: "Inquiries",     href: "/admin/inquiries",     icon: <IconPricing />  },
    { label: "Appointments",  href: "/admin/appointments",  icon: <IconCalendar /> },
    { label: isDark ? "Light" : "Dark", href: "#", icon: isDark ? <IconSun /> : <IconMoon />, toggleTheme: true },
    { label: "Sign Out", href: "#",                icon: <IconSignOut />, signOut: true              },
  ];

  // Visitor page logged in: full nav with Dash shortcut
  const visitorLoggedIn: NavItem[] = [
    { label: "Home",    href: "/",            icon: <IconHome />    },
    { label: "Systems", href: "/#systems",    icon: <IconSystems />, isHash: true, hashId: "systems"    },
    { label: "Pricing", href: "/#pricing",    icon: <IconPricing />, isHash: true, hashId: "pricing"    },
    { label: "About",   href: "/#about",      icon: <IconAbout />,   isHash: true, hashId: "about"      },
    { label: "AI",      href: "/#ai-visuals", icon: <IconAI />,      isHash: true, hashId: "ai-visuals" },
    {
      label: isAdmin ? "Admin" : "Dash",
      href:  isAdmin ? "/admin/dashboard" : "/buyer",
      icon:  isAdmin ? <IconAdmin /> : <IconDashboard />,
    },
    { label: "Sign Out", href: "#", icon: <IconSignOut />, signOut: true },
  ];

  // Visitor page guest: full nav with Sign In + Sign Up
  const visitorGuest: NavItem[] = [
    { label: "Home",    href: "/",            icon: <IconHome />    },
    { label: "Systems", href: "/#systems",    icon: <IconSystems />, isHash: true, hashId: "systems"    },
    { label: "Pricing", href: "/#pricing",    icon: <IconPricing />, isHash: true, hashId: "pricing"    },
    { label: "About",   href: "/#about",      icon: <IconAbout />,   isHash: true, hashId: "about"      },
    { label: "AI",      href: "/#ai-visuals", icon: <IconAI />,      isHash: true, hashId: "ai-visuals" },
    { label: "Sign In", href: "/login",       icon: <IconSignIn />  },
    { label: "Sign Up", href: "/register",    icon: <IconSignUp />  },
  ];

  const items: NavItem[] = (() => {
    if (session && isOnBuyer) return buyerItems;
    if (session && isOnAdmin) return adminItems;
    if (session)              return visitorLoggedIn;
    return visitorGuest;
  })();

  /* ── Click-locked active index ─────────────────────────────────── */
  // User click immediately locks the active item for 1s.
  // After 1s the lock releases and IntersectionObserver takes over.
  const [clickedIndex, setClickedIndex]   = useState<number | null>(null);
  const [scrollIndex,  setScrollIndex]    = useState<number | null>(null);
  const clickLockRef  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasScrolledRef = useRef(false); // only trust observer after real scroll

  /* ── Scroll-based section detection ─────────────────────────────── */
  useEffect(() => {
    if (!isOnVisitor) return;

    const onScroll = () => { hasScrolledRef.current = true; };
    window.addEventListener("scroll", onScroll, { once: true });

    const hashItems = items.filter(it => it.isHash && it.hashId);
    if (hashItems.length === 0) return () => window.removeEventListener("scroll", onScroll);

    // Track which sections are currently intersecting the middle band
    const intersecting = new Set<string>();

    const updateActive = () => {
      if (!hasScrolledRef.current) return;

      // If nothing intersecting, check if we're near the top → Home
      if (intersecting.size === 0) {
        if (window.scrollY < 200) setScrollIndex(null); // back to Home default
        return;
      }

      // Pick the first hashItem (in nav order) that is currently intersecting
      const match = hashItems.find(it => intersecting.has(it.hashId!));
      if (match) {
        const idx = items.findIndex(it => it.hashId === match.hashId);
        if (idx !== -1) setScrollIndex(idx);
      }
    };

    const observers: IntersectionObserver[] = [];

    hashItems.forEach(item => {
      const el = document.getElementById(item.hashId!);
      if (!el) return;

      const obs = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            intersecting.add(item.hashId!);
          } else {
            intersecting.delete(item.hashId!);
          }
          updateActive();
        },
        {
          // Fire when section enters top 40% of viewport or bottom 20%
          rootMargin: "-40% 0px -20% 0px",
          threshold: 0,
        }
      );
      obs.observe(el);
      observers.push(obs);
    });

    // Also reset to Home when user scrolls back to very top
    const onScrollTop = () => {
      if (!hasScrolledRef.current) return;
      if (window.scrollY < 200 && intersecting.size === 0) {
        setScrollIndex(null);
      }
    };
    window.addEventListener("scroll", onScrollTop, { passive: true });

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("scroll", onScrollTop);
      observers.forEach(o => o.disconnect());
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOnVisitor, pathname]);

  /* ── Active index — click wins for 1s, scroll takes over after ─── */
  const activeIndex = (() => {
    // Click lock wins — user just clicked a nav item
    if (clickedIndex !== null) return clickedIndex;
    // Scroll detection — user scrolled to a section
    if (scrollIndex !== null && isOnVisitor) return scrollIndex;
    // Exact pathname match (non-hash pages like /dashboard)
    const exact = items.findIndex((it) => !it.isHash && !it.signOut && it.href === pathname);
    if (exact !== -1) return exact;
    // Longest-prefix match — prevents /buyer from swallowing /buyer/downloads
    let bestPrefixIdx = -1;
    let bestPrefixLen = 0;
    items.forEach((it, idx) => {
      if (!it.isHash && !it.signOut && it.href !== "/" && pathname.startsWith(it.href)) {
        if (it.href.length > bestPrefixLen) {
          bestPrefixLen = it.href.length;
          bestPrefixIdx = idx;
        }
      }
    });
    if (bestPrefixIdx !== -1) return bestPrefixIdx;
    // Home default on visitor page
    if (isOnVisitor) return 0;
    return -1;
  })();

  // Reset clickedIndex and scrollIndex when pathname actually changes
  const prevPathnameForReset = useRef(pathname);
  useEffect(() => {
    if (prevPathnameForReset.current !== pathname) {
      prevPathnameForReset.current = pathname;
      setClickedIndex(null);
      setScrollIndex(null);
      hasScrolledRef.current = false;
    }
  }, [pathname]);

  /* ── Bubble state ───────────────────────────────────────────────── */
  const [bubbleLeft, setBubbleLeft]       = useState<number | null>(null);
  const [bubbleAnimate, setBubbleAnimate] = useState(false);
  const prevActiveIndex = useRef<number | null>(null);
  const prevPathname    = useRef<string | null>(null);
  const rafRef          = useRef<number | null>(null);

  // Stable recalc — takes idx as param so activeIndex is NOT a dep of useCallback
  // This prevents the cascade: activeIndex change → new recalcBubble ref → effect fires twice
  const recalcBubble = useCallback((idx: number, animate: boolean) => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      const left = calcLeft(idx, itemRefs, pillRef);
      if (left === null) return;
      setBubbleAnimate(animate);
      setBubbleLeft(left);
    });
  // itemRefs and pillRef are stable refs — safe to exclude
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // Page changed = navigated to a new route
    const pageChanged = prevPathname.current !== null && prevPathname.current !== pathname;
    // Animate only on same-page activeIndex changes (hash scroll / click)
    // Never animate on page navigation — always snap
    const shouldAnimate = !pageChanged
      && prevActiveIndex.current !== null
      && prevActiveIndex.current !== activeIndex
      && activeIndex !== -1;

    prevActiveIndex.current = activeIndex;
    prevPathname.current    = pathname;

    recalcBubble(activeIndex, shouldAnimate);

    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [activeIndex, pathname, recalcBubble]);

  // Recalc on window resize — always snap, no animation
  useEffect(() => {
    const onResize = () => recalcBubble(activeIndex, false);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  // activeIndex intentionally not in deps — resize handler uses latest via closure ref
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recalcBubble]);

  /* ── Hide on auth pages (after all hooks) ───────────────────────── */
  if (hideOn.includes(pathname)) return null;

  /* ── Click handler ──────────────────────────────────────────────── */
  function handleClick(item: NavItem, index: number) {
    if (item.signOut) {
      // Force a hard redirect after sign-out clears the JWT cookie.
      // redirect: true tells next-auth to do a full page navigation
      // to callbackUrl — bypassing any client-side router caching.
      signOut({ callbackUrl: "/login", redirect: true });
      return;
    }
    if (item.toggleTheme) { toggleAdminTheme(); return; }

    // Lock bubble to clicked item immediately — before any scroll happens
    setClickedIndex(index);

    // Release click lock after 1s so scroll tracking resumes
    if (clickLockRef.current) clearTimeout(clickLockRef.current);
    clickLockRef.current = setTimeout(() => setClickedIndex(null), 1000);

    if (item.isHash && item.hashId) {
      if (isOnVisitor) {
        document.getElementById(item.hashId)?.scrollIntoView({ behavior: "smooth" });
      } else {
        router.push(item.href);
      }
      return;
    }
    router.push(item.href);
  }

  return (
    <nav className="floatNav">
      <div className="floatPill" ref={pillRef}>

        {/* Bubble — snaps on page load, slides on same-page nav */}
        {bubbleLeft !== null && activeIndex !== -1 && (
          <div
            className="floatBubble"
            style={{
              left: `${bubbleLeft}px`,
              transition: bubbleAnimate
                ? "left 0.42s cubic-bezier(0.34, 1.3, 0.64, 1)"
                : "none",
            }}
          />
        )}

        {items.map((item, i) => (
          <button
            key={item.label}
            ref={(el) => { itemRefs.current[i] = el; }}
            className={`floatNavItem${i === activeIndex ? " floatNavActive" : ""}`}
            onClick={() => handleClick(item, i)}
            aria-label={item.label}
          >
            <span className="floatNavIcon">{item.icon}</span>
            <span className="floatNavLabel">{item.label}</span>
          </button>
        ))}

      </div>
    </nav>
  );
}