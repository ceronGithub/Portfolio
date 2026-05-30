// Register page — cinematic split-screen design.
// Left: cycling weapon_character MP4 playlist. Right: dark glass form.
"use client";

import "./register.css";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { sanitize } from "@/lib/utils";

// Video URLs — Cloudflare R2 (zero egress fees, direct CDN delivery).
const R2 = "https://pub-2ce00f29dc8e495183023b1ecef335df.r2.dev";
const WEAPON_VIDEOS = [
  `${R2}/weapon/axe-01-animation.mp4`,
  `${R2}/weapon/axe-02-animation.mp4`,
  `${R2}/weapon/axe-03-animation.mp4`,
  `${R2}/character/orc-01-animation.mp4`,
  `${R2}/character/orc-02-animation.mp4`,
  `${R2}/character/orc-03-animation.mp4`,
];

export default function RegisterPage() {
  const router  = useRouter();
  const [form, setForm]     = useState({ name: "", email: "", age: "", password: "", confirmPassword: "" });
  const [error, setError]   = useState("");
  const [loading, setLoading] = useState(false);
  const [vidIdx, setVidIdx] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  /* Track sound unlock state */
  const unlockedRef  = useRef(false);
  const [showSoundOverlay, setShowSoundOverlay] = useState(false);

  /* Pick a random index that is NOT the current one */
  function randomNext(cur: number) {
    if (WEAPON_VIDEOS.length <= 1) return 0;
    let next: number;
    do { next = Math.floor(Math.random() * WEAPON_VIDEOS.length); } while (next === cur);
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
    v.src = WEAPON_VIDEOS[idx];
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

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm({ ...form, [e.target.name]: sanitize(e.target.value) });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (parseInt(form.age) < 18) {
      setError("You must be at least 18 years old.");
      return;
    }

    setLoading(true);
    const res  = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: form.name, email: form.email, age: parseInt(form.age), password: form.password }),
    });
    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? "Registration failed.");
      setLoading(false);
      return;
    }
    router.push("/login");
  }

  /* Disable right-click on the entire auth page */
  useEffect(() => {
    const handler = (e: MouseEvent) => e.preventDefault();
    document.addEventListener("contextmenu", handler);
    return () => document.removeEventListener("contextmenu", handler);
  }, []);

  return (
    <main className="authPage">

      {/* ── Left — weapon/character video ────────────────────────── */}
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

        <div className="authLeftContent">
          <div className="authBrand">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/favicon.png" alt="Matthew Studio" className="authLogoImg" />
            <span className="authLogoText">Matthew Studio</span>
          </div>
          <div className="authQuote">
            <p className="authQuoteText">
              Crafted with<br />
              <em style={{ color: "#86efac" }}>cinematic precision.</em>
            </p>
            <p className="authQuoteSubtext">
              3D animations · AI visuals · Enterprise systems.
            </p>
          </div>
          <div className="authVidCounter">
            {WEAPON_VIDEOS.map((_, i) => (
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

      {/* ── Right — registration form ─────────────────────────────── */}
      <div className="authRight">
        <div className="authCard">

          <div className="authCardHeader">
            <span className="authCardEyebrow">Get started</span>
            <h1 className="authCardTitle">Create account</h1>
            <p className="authCardSub">Join Matthew Studio. Free to register.</p>
          </div>

          <form onSubmit={handleSubmit} className="authForm">

            <div className="authFieldRow">
              <div className="authField">
                <label className="authLabel" htmlFor="regName">Full Name</label>
                <input
                  id="regName" name="name" className="authInput" type="text"
                  value={form.name} onChange={handleChange} required
                  placeholder="Juan dela Cruz" autoComplete="name"
                />
              </div>
              <div className="authField authFieldSm">
                <label className="authLabel" htmlFor="regAge">Age</label>
                <input
                  id="regAge" name="age" className="authInput" type="number"
                  value={form.age} onChange={handleChange} required
                  placeholder="25" min="18"
                />
              </div>
            </div>

            <div className="authField">
              <label className="authLabel" htmlFor="regEmail">Email</label>
              <input
                id="regEmail" name="email" className="authInput" type="email"
                value={form.email} onChange={handleChange} required
                placeholder="you@example.com" autoComplete="email"
              />
            </div>

            <div className="authField">
              <label className="authLabel" htmlFor="regPassword">Password</label>
              <input
                id="regPassword" name="password" className="authInput" type="password"
                value={form.password} onChange={handleChange} required
                placeholder="••••••••" autoComplete="new-password"
              />
            </div>

            <div className="authField">
              <label className="authLabel" htmlFor="regConfirm">Confirm Password</label>
              <input
                id="regConfirm" name="confirmPassword" className="authInput" type="password"
                value={form.confirmPassword} onChange={handleChange} required
                placeholder="••••••••" autoComplete="new-password"
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
                  Creating account...
                </span>
              ) : "Create Account →"}
            </button>

          </form>

          <div className="authCardFooter">
            <p className="authFooterText">
              Already have an account?{" "}
              <Link href="/login" className="authFooterLink">Sign In</Link>
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