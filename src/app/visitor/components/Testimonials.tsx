/**
 * FILE: visitor/components/Testimonials.tsx
 * ROLE: Visitor — public, no auth required
 *
 * PURPOSE:
 * Client reviews section — an "iPhone carousel" style testimonial
 * display. Fetches reviews from /api/reviews and maps them into the
 * Testimonial display shape. Extracted from page.tsx.
 */
"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Reveal } from "./Reveal";

type Testimonial = {
  id: string;
  name: string;
  project: string;  // mapped from assetId
  rate: number;     // rating (1–5) × 20 → percentage for RateBar
  comment: string;
  initials: string;
  accent: string;
};

// Raw shape returned by /api/reviews GET
type ReviewRow = {
  id: string;
  rating: number;
  comment: string;
  createdAt: string;
  userName: string;
  assetId: string;
};

const accentColors = ["#7dc9a0", "#7eb8d4", "#c4b5fd", "#f9a8d4", "#67e8f9", "#fcd34d", "#fdba74", "#86efac"];

function getInitials(name: string) {
  return name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
}

// Convert a ReviewRow from /api/reviews into the Testimonial display shape
function reviewToTestimonial(r: ReviewRow, index: number): Testimonial {
  return {
    id:       r.id,
    name:     r.userName,
    project:  r.assetId,
    rate:     r.rating * 20,          // 1–5 stars → 20–100%
    comment:  r.comment ?? "",
    initials: getInitials(r.userName),
    accent:   accentColors[index % accentColors.length],
  };
}

function RateBar({ rate, accent }: { rate: number; accent: string }) {
  return (
    <div className="tRateWrap">
      <div className="tRateTrack">
        <div className="tRateFill" style={{ width: `${rate}%`, background: accent }} />
      </div>
      <span className="tRateNum" style={{ color: accent }}>{rate}%</span>
    </div>
  );
}

function PhoneCard({ t }: { t: Testimonial }) {
  return (
    <div className="tPhoneCard">
      <div className="tPhoneCardHeader">
        <div className="tPhoneAvatar" style={{ background: t.accent + "33", color: t.accent }}>
          {t.initials}
        </div>
        <div>
          <p className="tPhoneCardName">{t.name}</p>
          <p className="tPhoneCardProject">{t.project}</p>
        </div>
      </div>
      <RateBar rate={t.rate} accent={t.accent} />
      {t.comment && <p className="tPhoneCardComment">&ldquo;{t.comment}&rdquo;</p>}
    </div>
  );
}

export function TestimonialsSection() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [active, setActive] = useState(0);

  // ── Fetch buyer reviews from /api/reviews and map to carousel display shape ──
  useEffect(() => {
    fetch("/api/reviews")
      .then(res => res.json())
      .then((data: ReviewRow[]) => {
        if (Array.isArray(data) && data.length > 0) {
          setTestimonials(data.map(reviewToTestimonial));
        }
      })
      .catch(() => {});
  }, []);

  const total = testimonials.length;

  const prev = () => setActive(a => ((a - 1) + total) % total);
  const next = () => setActive(a => (a + 1) % total);

  // Always render the iPhone carousel — show empty state inside the phone screen when no testimonials yet
  const activeT  = total > 0 ? testimonials[active] : null;
  const leftIdx  = total > 1 ? ((active - 1) + total) % total : -1;
  const rightIdx = total > 1 ? (active + 1) % total : -1;
  const leftT    = leftIdx  >= 0 ? testimonials[leftIdx]  : null;
  const rightT   = rightIdx >= 0 ? testimonials[rightIdx] : null;

  return (
    <section className="vTestimonials" id="testimonials">
      <div className="vTestimonialsInner">

        <div className="vSprintHeader">
          <Reveal>
            <span className="vSectionEyebrow">Client Reviews</span>
          </Reveal>
          <Reveal delay={0.1}>
            <h2 className="vSectionTitle">What clients say.</h2>
          </Reveal>
          <Reveal delay={0.2}>
            <p className="vSectionSub">Real feedback from real clients. Every system. Every sprint.</p>
          </Reveal>
        </div>

        {/* ── Carousel ── always visible; empty state shown inside phone screen */}
        <div className="tCarouselWrap">

          {/* Left side card — only when multiple testimonials */}
          {leftT && (
            <button className="tSideCard tSideCardLeft" onClick={prev} aria-label="Previous">
              <div className="tSideCardInner">
                <div className="tSideAvatar" style={{ background: leftT.accent + "33", color: leftT.accent }}>
                  {leftT.initials}
                </div>
                <div className="tSideInfo">
                  <p className="tSideName">{leftT.name}</p>
                  <p className="tSideProject">{leftT.project}</p>
                </div>
                <div className="tSideRate" style={{ color: leftT.accent }}>{leftT.rate}%</div>
              </div>
            </button>
          )}

          {/* Phone mockup — always rendered */}
          <div className="tPhoneMockup">
            <div className="tPhoneShell">
              <div className="tPhoneNotch" />
              <div className="tPhoneScreen">

                {/* Instagram-style story bubbles — only when testimonials exist */}
                <div className="tPhoneInstaHeader">
                  <div className="tPhoneInstaStories">
                    {testimonials.map((t, i) => (
                      <button
                        key={t.id}
                        className={"tPhoneInstaStory" + (i === active ? " tPhoneInstaStoryActive" : "")}
                        onClick={() => setActive(i)}
                        style={{ borderColor: i === active ? t.accent : "transparent" }}
                      >
                        <span style={{ background: t.accent + "44", color: t.accent, fontSize: 8, fontWeight: 700, width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "50%" }}>
                          {t.initials}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Active card — or empty state placeholder */}
                <div className="tPhoneScreenContent">
                  {activeT ? (
                    <motion.div
                      key={activeT.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                    >
                      <PhoneCard t={activeT} />
                    </motion.div>
                  ) : (
                    <div className="tPhoneEmptyState">
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <p className="tPhoneEmptyText">Reviews from verified buyers<br/>will appear here.</p>
                    </div>
                  )}
                </div>

                {/* Instagram-style actions */}
                <div className="tPhoneInstaActions">
                  <div className="tPhoneInstaAction">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    <span>{activeT?.rate ?? "—"}</span>
                  </div>
                  <div className="tPhoneInstaAction">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  </div>
                  <div className="tPhoneInstaAction">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  </div>
                </div>
              </div>
              <div className="tPhoneHomeBar" />
            </div>
          </div>

          {/* Right side card — only when multiple testimonials */}
          {rightT && (
            <button className="tSideCard tSideCardRight" onClick={next} aria-label="Next">
              <div className="tSideCardInner">
                <div className="tSideAvatar" style={{ background: rightT.accent + "33", color: rightT.accent }}>
                  {rightT.initials}
                </div>
                <div className="tSideInfo">
                  <p className="tSideName">{rightT.name}</p>
                  <p className="tSideProject">{rightT.project}</p>
                </div>
                <div className="tSideRate" style={{ color: rightT.accent }}>{rightT.rate}%</div>
              </div>
            </button>
          )}

        </div>

        {/* Dot indicators — only when testimonials exist */}
        {total > 0 && activeT && (
          <div className="tDots">
            {testimonials.map((_, i) => (
              <button key={i} className={"tDot" + (i === active ? " tDotActive" : "")}
                style={i === active ? { background: activeT.accent } : {}}
                onClick={() => setActive(i)} aria-label={`Go to testimonial ${i + 1}`}
              />
            ))}
          </div>
        )}

        {/* Reviews are submitted by buyers from their dashboard — visitors view only */}
        <div className="tAddWrap">
          <p className="tAddBuyerNote">
            <a href="/login" className="tAddBuyerNoteLink">Sign in as a buyer</a> to leave a review.
          </p>
        </div>

      </div>
    </section>
  );
}
