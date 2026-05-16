// Animated hero section. Uses Framer Motion for reveal animations.
// Floating gradient orbs use GPU-accelerated CSS transforms.
// Video background with dark overlay for contrast.
"use client";

import { motion } from "framer-motion";
import Link from "next/link";

export default function HeroAnimated() {
  return (
    <main className="heroPage">
      {/* Video background */}
      <video
        className="heroBgVideo"
        src="/hero-bg.mp4"
        autoPlay
        muted
        loop
        playsInline
      />
      {/* Dark overlay so text stays readable */}
      <div className="heroBgOverlay" />

      <div className="heroContent">
        <motion.span
          className="heroBadge"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          Premium Business Systems
        </motion.span>

        <motion.h1
          className="heroTitle"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          Unlock the tools that <br />
          <span className="heroAccent">run your business.</span>
        </motion.h1>

        <motion.p
          className="heroSubtitle"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          Warehouse, Construction, Inventory — built once, owned forever.
        </motion.p>

        <motion.div
          className="heroActions"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <Link href="/login" className="heroBtnPrimary">Get Started</Link>
          <Link href="/systems" className="heroBtnSecondary">Browse Systems</Link>
        </motion.div>
      </div>
    </main>
  );
}