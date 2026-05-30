// DashboardHero — client component.
// 3 videos play simultaneously as full-viewport columns.
// MECHANIC:
//   - All 3 start together on mount.
//   - When ALL 3 finish, pick the next batch of 3 (all different, none from previous batch).
//   - Each column always shows a unique video — no duplicates across columns.
// Sources: Google Drive via proxy API route.

"use client";

import { useEffect, useRef, useState } from "react";
import "./dashboard.css";

// Video URLs — Cloudflare R2 (zero egress fees, direct CDN delivery).
// To add more videos: upload to R2 under the matching folder and add the URL below.
// They will automatically join the random pool on next deploy.
const R2 = "https://pub-2ce00f29dc8e495183023b1ecef335df.r2.dev";

const ALL_VIDEOS = [
  // architecture / exterior
  `${R2}/architecture/exterior_1.mp4`,
  `${R2}/architecture/exterior_2.mp4`,
  `${R2}/architecture/exterior_3.mp4`,
  `${R2}/architecture/exterior_4.mp4`,
  // architecture / interior
  `${R2}/architecture/interior_1.mp4`,
  `${R2}/architecture/interior_2.mp4`,
  `${R2}/architecture/interior_3.mp4`,
  `${R2}/architecture/interior_4.mp4`,
  `${R2}/architecture/interior_5.mp4`,
  `${R2}/architecture/interior_6.mp4`,
  `${R2}/architecture/interior_7.mp4`,
  // weapon
  `${R2}/weapon/axe-01-animation.mp4`,
  `${R2}/weapon/axe-02-animation.mp4`,
  `${R2}/weapon/axe-03-animation.mp4`,
  // TODO: upload to R2 then uncomment
  // `${R2}/weapon/axe-04-animation.mp4`,
  // `${R2}/weapon/axe-05-animation.mp4`,
  // `${R2}/weapon/axe-06-animation.mp4`,
  // `${R2}/weapon/axe-07-animation.mp4`,
  // `${R2}/weapon/axe-08-animation.mp4`,
  // character
  `${R2}/character/orc-01-animation.mp4`,
  `${R2}/character/orc-02-animation.mp4`,
  `${R2}/character/orc-03-animation.mp4`,
  `${R2}/character/orc-04-animation.mp4`,
  `${R2}/character/orc-05-animation.mp4`,
  `${R2}/character/orc-06-animation.mp4`,
  `${R2}/character/orc-07-animation.mp4`,
  // TODO: upload to R2 then uncomment
  // `${R2}/character/orc-08-animation.mp4`,
  // `${R2}/character/orc-09-animation.mp4`,
  // `${R2}/character/orc-10-animation.mp4`,
  // `${R2}/character/orc-11-animation.mp4`,
  // `${R2}/character/orc-12-animation.mp4`,
  // `${R2}/character/orc-13-animation.mp4`,
];

// Pick 3 unique random videos, excluding any in the `exclude` set
function pickBatch(exclude: string[] = []): string[] {
  const pool = ALL_VIDEOS.filter(v => !exclude.includes(v));
  // Shuffle pool
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  // Take first 3 — guaranteed unique since we slice from a shuffled unique array
  return shuffled.slice(0, 3);
}

interface Props { userName: string; }

export default function DashboardHero({ userName }: Props) {
  const [videos,   setVideos]   = useState<string[]>([]); // empty on SSR — no hydration mismatch
  const [phase,    setPhase]    = useState<"welcome" | "fadeOut" | "subtitle">("welcome");
  const [muted,    setMuted]    = useState(true);
  // Track which columns are still buffering (loading = true until canplay fires)
  const [loading,  setLoading]  = useState<boolean[]>([true, true, true]);

  const videoRefs   = useRef<(HTMLVideoElement | null)[]>([]);
  const sectionRef  = useRef<HTMLElement>(null);
  // Track how many of the 3 have finished in the current batch
  const endedRef    = useRef<Set<number>>(new Set());
  // Keep latest videos in a ref so the onEnded closure sees current value
  const videosRef   = useRef<string[]>(videos);
  videosRef.current = videos;

  // ── Pick initial batch on client only — avoids SSR/client mismatch ──
  useEffect(() => {
    setVideos(pickBatch());
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Phase animation on mount ────────────────────────────────────────
  useEffect(() => {
    const t1 = setTimeout(() => setPhase("fadeOut"),  2000);
    const t2 = setTimeout(() => setPhase("subtitle"), 2700);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  // ── Pause/resume on scroll out of viewport ──────────────────────────
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        videoRefs.current.forEach(v => {
          if (!v) return;
          entry.isIntersecting ? v.play().catch(() => {}) : v.pause();
        });
      },
      { threshold: 0.1 }
    );
    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  // ── Called when a column's video ends ───────────────────────────────
  function handleEnded(index: number) {
    endedRef.current.add(index);
    // Only advance when ALL 3 have finished
    if (endedRef.current.size < 3) return;
    // Reset loading flags for all 3 new columns
    endedRef.current = new Set();
    const nextBatch = pickBatch(videosRef.current);
    setLoading([true, true, true]);
    setVideos(nextBatch);
  }

  function toggleMute() {
    const next = !muted;
    setMuted(next);
    videoRefs.current.forEach(v => { if (v) v.muted = next; });
  }

  return (
    <section className="heroSection" ref={sectionRef}>

      {/* ── 3-column video background ── */}
      <div className="heroBg">
        {videos.map((src, i) => (
          <div key={i} className="heroBgCol">
            {/* Loading shimmer — visible while video is buffering */}
            {loading[i] && <div className="heroBgColLoading" />}
            <video
              key={src}
              ref={el => { videoRefs.current[i] = el; }}
              src={src}
              autoPlay
              muted
              playsInline
              preload="auto"
              className="heroBgVideo"
              onCanPlay={() => setLoading(prev => { const n = [...prev]; n[i] = false; return n; })}
              onWaiting={() => setLoading(prev => { const n = [...prev]; n[i] = true;  return n; })}
              onEnded={() => handleEnded(i)}
            />
          </div>
        ))}
        <div className="heroBgOverlay" />
      </div>

      {/* ── Centered text ── */}
      <div className="heroContent">
        <span className={[
          "heroWelcome",
          phase === "welcome"  ? "heroVisible" : "",
          phase === "fadeOut"  ? "heroFadeOut" : "",
          phase === "subtitle" ? "heroGone"    : "",
        ].join(" ")}>Welcome</span>

        <div className={["heroSub", phase === "subtitle" ? "heroSubVisible" : ""].join(" ")}>
          <p className="heroSubGreet">
            Good to see you, <span className="heroSubName">{userName}</span>.
          </p>
          <p className="heroSubLine">Your systems are ready.</p>
        </div>
      </div>

      {/* ── Sound toggle ── */}
      <button className="heroSoundBtn" onClick={toggleMute} title={muted ? "Unmute" : "Mute"}>
        {muted ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
            <line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/>
          </svg>
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
            <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
          </svg>
        )}
      </button>

    </section>
  );
}