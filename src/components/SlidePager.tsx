// Slide pager. Splits content into horizontal pages.
// Left/right arrows navigate between pages with slide animation.
"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
  pages: React.ReactNode[];
  labels?: string[];
}

export default function SlidePager({ pages, labels }: Props) {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(1);

  function goNext() {
    if (current < pages.length - 1) {
      setDirection(1);
      setCurrent((c) => c + 1);
    }
  }

  function goPrev() {
    if (current > 0) {
      setDirection(-1);
      setCurrent((c) => c - 1);
    }
  }

  return (
    <div className="slidePager">
      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={current}
          custom={direction}
          variants={{
            enter: (d: number) => ({ x: d > 0 ? "100%" : "-100%", opacity: 0 }),
            center: { x: 0, opacity: 1 },
            exit: (d: number) => ({ x: d > 0 ? "-100%" : "100%", opacity: 0 }),
          }}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.4, ease: "easeInOut" }}
          className="slidePage"
        >
          {pages[current]}
        </motion.div>
      </AnimatePresence>

      {/* Page controls */}
      <div className="slideControls">
        <button className="slideArrow" onClick={goPrev} disabled={current === 0}>←</button>
        <div className="slideDots">
          {pages.map((_, i) => (
            <button
              key={i}
              className={`slideDot ${i === current ? "slideDotActive" : ""}`}
              onClick={() => { setDirection(i > current ? 1 : -1); setCurrent(i); }}
            />
          ))}
        </div>
        <button className="slideArrow" onClick={goNext} disabled={current === pages.length - 1}>→</button>
      </div>

      {labels && (
        <p className="slideLabel">{labels[current]}</p>
      )}
    </div>
  );
}