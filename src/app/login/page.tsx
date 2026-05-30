// Login page — cinematic split-screen design.
// Left: cycling architecture MP4 playlist. Right: dark glass form.
"use client";

import { useState, useRef, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { sanitize } from "@/lib/utils";
import Link from "next/link";
import "./login.css";

// Video URLs — Cloudflare R2 (zero egress fees, direct CDN delivery).
const R2 = "https://pub-2ce00f29dc8e495183023b1ecef335df.r2.dev";
const ARCH_VIDEOS = [
  `${R2}/architecture/exterior_1.mp4`,
  `${R2}/architecture/exterior_2.mp4`,
  `${R2}/architecture/exterior_3.mp4`,
  `${R2}/architecture/exterior_4.mp4`,
  `${R2}/architecture/interior_1.mp4`,
  `${R2}/architecture/interior_2.mp4`,
  `${R2}/architecture/interior_3.mp4`,
  `${R2}/architecture/interior_4.mp4`,
  `${R2}/architecture/interior_5.mp4`,
  `${R2}/architecture/interior_6.mp4`,
  `${R2}/architecture/interior_7.mp4`,
];

export default function LoginPage() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const reason       = searchParams.get("reason");

  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState(
    reason === "banned"      ? "Your account has been banned. Contact support." :
    reason === "deactivated" ? "Your account has been deactivated. Contact support." : ""
  );
  const [loading, setLoading]   = useState(false);
  const [vidIdx, setVidIdx]     = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  /* Track sound unlock state */
  const unlockedRef  = useRef(false);
  const [showSoundOverlay, setShowSoundOverlay] = useState(false);

  /* Pick a random index that is NOT the current one */
  function randomNext(cur: number) {
    if (ARCH_VIDEOS.length <= 1) return 0;
    let next: number;
    do { next = Math.floor(Math.random() * ARCH_VIDEOS.length); } while (next === cur);
    return next;
  }

  /* On end: pick random next — never the same clip, loops forever */
  function handleVideoEnd() {
    setVidIdx(cur => randomNext(cur));
  }

  /* Play a specific index — always muted first, unmute after if unlocked */
  function playIdx(idx: number) {
    const v = videoRef.current;
    if (!v) return;
    v.pause();
    v.muted = true;
    v.src = ARCH_VIDEOS[idx];
    v.load();
    
    let timeoutId: NodeJS.Timeout;
    let hasLoaded = false;
    
    const onReady = () => {
      hasLoaded = true;
      clearTimeout(timeoutId);
      v.play()
        .then(() => {
          if (unlockedRef.current) v.muted = false;
        })
        .catch(() => {
          setShowSoundOverlay(true);
        });
      v.removeEventListener("loadeddata", onReady);
      v.removeEventListener("error", onError);
    };
    
    const onError = () => {
      clearTimeout(timeoutId);
      v.removeEventListener("loadeddata", onReady);
      v.removeEventListener("error", onError);
      // Skip to next video on error
      setVidIdx(cur => randomNext(cur));
    };
    
    // Timeout: if video doesn't load within 5 seconds, skip
    timeoutId = setTimeout(() => {
      if (!hasLoaded) {
        v.removeEventListener("loadeddata", onReady);
        v.removeEventListener("error", onError);
        setVidIdx(cur => randomNext(cur));
      }
    }, 5000);
    
    v.addEventListener("loadeddata", onReady);
    v.addEventListener("error", onError);
  }

  /* Unmute helper — used by auto-timer and overlay click */
  function tryUnmute() {
    const v = videoRef.current;
    if (!v) return;
    unlockedRef.current = true;
    setShowSoundOverlay(false);
    // Try unmuting — if browser allows it, sound plays
    v.muted = false;
    // If video was paused (blocked), restart it
    if (v.paused) {
      v.play().catch(() => { v.muted = true; });
    }
  }

  /* Auto-unmute after 2 seconds — no click needed */
  useEffect(() => {
    const timer = setTimeout(() => {
      if (unlockedRef.current) return; // already unlocked
      const v = videoRef.current;
      if (!v) return;
      v.muted = false;
      const testPlay = v.play();
      if (testPlay) {
        testPlay
          .then(() => {
            unlockedRef.current = true;
            setShowSoundOverlay(false);
          })
          .catch(() => {
            // Browser still blocking — show overlay as fallback
            v.muted = true;
            setShowSoundOverlay(true);
          });
      }
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  /* On mount: always play slide 0 first */
  useEffect(() => {
    const t = setTimeout(() => { setVidIdx(0); playIdx(0); }, 0);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* On index change — play the new clip */
  const mountedRef = useRef(false);
  useEffect(() => {
    if (!mountedRef.current) { mountedRef.current = true; return; }
    playIdx(vidIdx);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vidIdx]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await signIn("credentials", { email, password, redirect: false });

    if (result?.error) {
      setError("Invalid email or password.");
      setLoading(false);
      return;
    }

    const res     = await fetch("/api/auth/session");
    const session = await res.json();
    const role    = (session?.user as any)?.role;
    if (role === "ADMIN") router.push("/admin/dashboard");
    else router.push("/buyer");
  }

  /* Disable right-click on the entire auth page */
  useEffect(() => {
    const handler = (e: MouseEvent) => e.preventDefault();
    document.addEventListener("contextmenu", handler);
    return () => document.removeEventListener("contextmenu", handler);
  }, []);

  return (
    <main className="authPage">

      {/* ── Left — video background ──────────────────────────────── */}
      <div className="authLeft">
        <video
          ref={videoRef}
          className="authVideoBg"
          playsInline muted loop={false}
          onEnded={handleVideoEnd}
          preload="auto"
        />
        <div className="authVideoOverlay" />
        <div className="authVideoGrain" />

        {/* Sound overlay — shown if browser blocks auto-unmute after 2s */}
        {showSoundOverlay && (
          <button className="authSoundOverlay" onClick={tryUnmute}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
              <line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/>
            </svg>
            <span>Click to enable sound</span>
          </button>
        )}

        {/* Brand + quote */}
        <div className="authLeftContent">
          <div className="authBrand">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/favicon.png" alt="Matthew Studio" className="authLogoImg" />
            <span className="authLogoText">Matthew Studio</span>
          </div>
          <div className="authQuote">
            <p className="authQuoteText">
              Infrastructure built<br />
              <em style={{ color: "#7dc9a0" }}>for the long game.</em>
            </p>
            <p className="authQuoteSubtext">
              Enterprise systems · AI Visual Assets · Cinematic precision.
            </p>
          </div>
          {/* Video counter */}
          <div className="authVidCounter">
            {ARCH_VIDEOS.map((_, i) => (
              <button
                key={i}
                className={"authVidDot" + (i === vidIdx ? " authVidDotActive" : "")}
                onClick={() => setVidIdx(i)}
                aria-label={`Video ${i + 1}`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* ── Right — form ─────────────────────────────────────────── */}
      <div className="authRight">
        <div className="authCard">

          {/* Header */}
          <div className="authCardHeader">
            <span className="authCardEyebrow">Welcome back</span>
            <h1 className="authCardTitle">Sign in</h1>
            <p className="authCardSub">Access your dashboard and systems.</p>
          </div>

          <form onSubmit={handleSubmit} className="authForm">

            <div className="authField">
              <label className="authLabel" htmlFor="loginEmail">Email</label>
              <input
                id="loginEmail"
                className="authInput"
                type="email"
                value={email}
                onChange={e => setEmail(sanitize(e.target.value))}
                required
                placeholder="you@example.com"
                autoComplete="email"
              />
            </div>

            <div className="authField">
              <label className="authLabel" htmlFor="loginPassword">Password</label>
              <input
                id="loginPassword"
                className="authInput"
                type="password"
                value={password}
                onChange={e => setPassword(sanitize(e.target.value))}
                required
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </div>

            {error && (
              <div className="authError">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="authBtn">
              {loading ? (
                <span className="authBtnLoading">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="authSpinner">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeDasharray="32" strokeDashoffset="10"/>
                  </svg>
                  Signing in...
                </span>
              ) : "Sign In →"}
            </button>

          </form>

          <div className="authCardFooter">
            <p className="authFooterText">
              Don&apos;t have an account?{" "}
              <Link href="/register" className="authFooterLink">Sign Up</Link>
            </p>
            <Link href="/" className="authFooterBack">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M8 1L3 6l5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Back to Home
            </Link>
            <p className="authRightClickNote">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Right-click is disabled on this page.
            </p>
          </div>

        </div>
      </div>

    </main>
  );
}