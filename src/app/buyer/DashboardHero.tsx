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

// Proxy through our API route — avoids Drive's redirect/confirmation wall
const GD = (id: string) => `/api/drive-video?id=${id}`;

const ALL_VIDEOS = [
  // exterior
  GD("1QKCGiJCNzSbpkVsQPN073ws6WbZMwrZC"), // Drone shot 1
  GD("1hIAB7FrCEnn8cfrGSCplccHkZ4Gonnxu"), // Drone shot 2
  GD("1kp23x5YBnWovDamPDT2FS00d1ID9SB0k"), // project-01
  GD("10CfcifgZBQMoxK2L_ANH8TJ8vUj7v26T"), // project-02
  GD("1uK7a0BedMTfGWeZ17WxJt-YYKAJL3bZJ"), // project-03
  GD("1On-oICTEgx81tNSRyW7DZYk3IOEDBiAT"), // project-04
  // interior
  GD("16IlbksfqFgAsIUlIbSnfG1k0miktYC0d"), // interior-01
  GD("1cHTTgKBilMBXIrIGuSqB2tAb4A9WdobJ"), // interior-02
  GD("1A9sgWrWpi_Jq2NWZIH5mkh2XP491_2Ce"), // interior-03
  GD("1sr1O1HBL-q0oFZ2mfhgI3Zf3Y_AWmOzl"), // interior-04
  GD("1wQtULgqst4SX2imqwdEhnqYRgzcPWJiu"), // interior-05
  GD("1iqOFR1-0gO4v-Wk7PzBKZ2TsSeL0qoOW"), // interior-06
  GD("1p34uCYAykKSH9c5fHXh1PuRn_S5XS3sG"), // interior-07
  // weapon
  GD("1NrTbKznn-3pcIC9q-BqBa2lUfMUsGKa8"), // axe-01
  GD("1db1EOrzdG2phPiaJ8DJV9Tz1-bfYwB67"), // axe-02
  GD("1ZPhiN56sAU9EQIlrrTPY3OSDBhijtHld"), // axe-03
  GD("1jjU-r5EawMDjzhbJueiadCMjkcCZrHtr"), // axe-04
  GD("1vl3KhBI_UQIugyIXeBTduabrOh0eZSU5"), // axe-05
  GD("1DcmVwUgfOzvl8wzJJOq-YP7pR_8ZXZ4u"), // axe-06
  GD("1k9AhDcIY-Em7Wyl5fd2i79DomElK1DnM"), // axe-07
  GD("1tqcYpL3wqMpomBiXOo_N6yDwspdEgmWu"), // axe-08
  // character
  GD("1ApEQgnNAza_uRL9NRRPtCMOurPqKj1VP"), // orc-01
  GD("1SaHl7fGvD2uoy34clB1p2UWT-knWENwl"), // orc-02
  GD("1L_mshqNnDK3rfTHrcds3yApBiY-Wt55i"), // orc-03
  GD("1cx2sETIft3K7R8NnNPumoLet1pW5It0a"), // orc-04
  GD("1-n33tw86ViaKB6xzM0UuCrgF45JVc63-"), // orc-05
  GD("1XVymFPXK8aQa-Ud7DwpkaQ6g3BrGiLjH"), // orc-06
  GD("16-RCaA3WjQjMf1GT0Ad2JrjAhR-U_FyH"), // orc-07
  GD("1Wjgt2RcRkUrbxEMnLQWWdiUdQ3OHwpx3"), // orc-08
  GD("1JB-kYyq0XMrPe0pgrh5L2S-nGmK-wvXE"), // orc-09
  GD("1q3rW69QWjYEK5T53rRTpTFlR7X9ZERRe"), // orc-10
  GD("1CTk71XmBB9yNz9Osbfd-YHg9mrsgmZkf"), // orc-11
  GD("1ZPSoWhJc0ukVny9sCKp0-ytzTsz0aL50"), // orc-12
  GD("1W1eHcST6_noKH3VCygvpKz-JFZkCF6Su"), // orc-13
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