// DashboardHero — client component.
// 3 videos play simultaneously as full-viewport columns.
// Sources: Supabase bucket — exterior, weapon, character (interior skipped — filenames have spaces).
// Audio: muted by default (browser autoplay policy). User clicks unmute button to enable audio.

"use client";

import { useEffect, useRef, useState } from "react";
import "./dashboard.css";

const SB = "https://ktuahohvysmjxumekaov.supabase.co/storage/v1/object/public/videos";

// Only use folders with clean filenames — no spaces/parens issues
const ALL_VIDEOS = [
  // exterior
  `${SB}/exterior/Drone_shot_revealing_landscape_202605061517.mp4`,
  `${SB}/exterior/Drone_shot_revealing_landscape_202605061518.mp4`,
  `${SB}/exterior/project-01.mp4`,
  `${SB}/exterior/project-02.mp4`,
  `${SB}/exterior/project-03.mp4`,
  `${SB}/exterior/project-04.mp4`,
  `${SB}/exterior/project-05.mp4`,
  // interior
  `${SB}/interior/interior-01.mp4`,
  `${SB}/interior/interior-02.mp4`,
  `${SB}/interior/interior-03.mp4`,
  `${SB}/interior/interior-04.mp4`,
  `${SB}/interior/interior-05.mp4`,
  `${SB}/interior/interior-06.mp4`,
  `${SB}/interior/interior-07.mp4`,
  // weapon
  `${SB}/weapon/axe-01-animation.mp4`,
  `${SB}/weapon/axe-02-animation.mp4`,
  `${SB}/weapon/axe-03-animation.mp4`,
  `${SB}/weapon/axe-04-animation.mp4`,
  `${SB}/weapon/axe-05-animation.mp4`,
  `${SB}/weapon/axe-07-animation.mp4`,
  // character
  `${SB}/character/orc-01-animation.mp4`,
  `${SB}/character/orc-02-animation.mp4`,
  `${SB}/character/orc-03-animation.mp4`,
  `${SB}/character/orc-04-animation.mp4`,
  `${SB}/character/orc-05-animation.mp4`,
  `${SB}/character/orc-06-animation.mp4`,
  `${SB}/character/orc-07-animation.mp4`,
  `${SB}/character/orc-08-animation.mp4`,
  `${SB}/character/orc-09-animation.mp4`,
  `${SB}/character/orc-11-animation.mp4`,
];

function pickRandom3(): string[] {
  return [...ALL_VIDEOS].sort(() => Math.random() - 0.5).slice(0, 3);
}

function pickNext(current: string): string {
  const pool = ALL_VIDEOS.filter(v => v !== current);
  return pool[Math.floor(Math.random() * pool.length)];
}

interface Props { userName: string; }

export default function DashboardHero({ userName }: Props) {
  const [videos, setVideos] = useState<string[] | null>(null);
  const [phase,  setPhase]  = useState<"welcome" | "fadeOut" | "subtitle">("welcome");
  const [muted,  setMuted]  = useState(true);
  const videoRefs  = useRef<(HTMLVideoElement | null)[]>([]);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    setVideos(pickRandom3());
    const t1 = setTimeout(() => setPhase("fadeOut"),  2000);
    const t2 = setTimeout(() => setPhase("subtitle"), 2700);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  // Pause all hero videos when section scrolls out of viewport
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        videoRefs.current.forEach(v => {
          if (!v) return;
          if (entry.isIntersecting) {
            v.play().catch(() => {});
          } else {
            v.pause();
          }
        });
      },
      { threshold: 0.1 }
    );
    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  function toggleMute() {
    const next = !muted;
    setMuted(next);
    videoRefs.current.forEach(v => { if (v) v.muted = next; });
  }

  function handleEnded(index: number, currentSrc: string) {
    setVideos(prev => {
      if (!prev) return prev;
      const updated = [...prev];
      updated[index] = pickNext(currentSrc);
      return updated;
    });
  }

  return (
    <section className="heroSection" ref={sectionRef}>

      {/* ── 3-column video background ── */}
      <div className="heroBg">
        {(videos ?? []).map((src, i) => (
          <div key={i} className="heroBgCol">
            <video
              key={src}
              ref={el => { videoRefs.current[i] = el; }}
              src={src}
              autoPlay
              muted
              playsInline
              preload="metadata"
              className="heroBgVideo"
              onEnded={() => handleEnded(i, src)}
            />
          </div>
        ))}
        <div className="heroBgOverlay" />
      </div>

      {/* ── Centered text ── */}
      <div className="heroContent">
        <span className={["heroWelcome",
          phase === "welcome"  ? "heroVisible"  : "",
          phase === "fadeOut"  ? "heroFadeOut"  : "",
          phase === "subtitle" ? "heroGone"     : "",
        ].join(" ")}>Welcome</span>

        <div className={["heroSub", phase === "subtitle" ? "heroSubVisible" : ""].join(" ")}>
          <p className="heroSubGreet">
            Good to see you, <span className="heroSubName">{userName}</span>.
          </p>
          <p className="heroSubLine">Your systems are ready.</p>
        </div>
      </div>

      {/* ── Sound toggle — bottom right ── */}
      <button className="heroSoundBtn" onClick={toggleMute} title={muted ? "Unmute" : "Mute"}>
        {muted ? (
          // Muted icon
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
            <line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/>
          </svg>
        ) : (
          // Unmuted icon
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