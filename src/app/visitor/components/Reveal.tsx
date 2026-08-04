/**
 * FILE: visitor/components/Reveal.tsx
 * ROLE: Visitor — public, no auth required
 *
 * PURPOSE:
 * Two small reusable animation wrappers used throughout the visitor
 * landing page: Reveal (scroll-triggered fade/slide-in for any child)
 * and Marquee (looping horizontal text strip, used for the tech stack
 * ticker). Extracted from page.tsx since both are used by many other
 * section components.
 */
"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";

export function Reveal({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 36 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.75, delay, ease: [0.25, 0.1, 0.25, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ─── Marquee ───────────────────────────────────────────────────────── */
export function Marquee({ items }: { items: string[] }) {
  const doubled = [...items, ...items];
  return (
    <div className="vMarqueeOuter">
      <div className="vMarqueeTrack">
        {doubled.map((t, i) => (
          <span key={i} className="vMarqueeItem">
            {t} <span className="vMarqueeDot">·</span>
          </span>
        ))}
      </div>
    </div>
  );
}
