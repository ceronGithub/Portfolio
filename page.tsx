/**
 * FILE: visitor/page.tsx
 * ROLE: Visitor — public, no auth required
 *
 * PURPOSE:
 * Visitor landing page — cinematic premium enterprise aesthetic.
 * Sections: Hero, Trust, Systems, Process, About, CTA, Footer.
 *
 * This file previously held every section component inline (2,284
 * lines total). Split into visitor/components/ so each section is
 * independently readable and editable:
 *   - components/Reveal.tsx          — scroll-reveal + marquee wrappers
 *   - components/HeroCarousel.tsx    — AI Visual Systems showcase row
 *   - components/SystemsShowcase.tsx — Service tiers + Systems carousel/configurator
 *   - components/Testimonials.tsx    — Client reviews carousel
 *   - components/Faq.tsx             — FAQ accordion
 *   - lib/visitorData.ts             — shared static data + types
 *
 * This file now only assembles those sections plus the page-specific
 * JSX (Hero, Trust, Process, About, CTA, Footer markup) that doesn't
 * warrant its own component yet.
 */
"use client";

import "./visitor.css";
import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import Link from "next/link";
import { techStack } from "./lib/visitorData";
import { ArchitectureIntroSection, ArchitectureVideosSection } from "./architecture";
import { ModelingIntro, ModelingMagazine } from "./modeling";
import { Reveal, Marquee } from "./components/Reveal";
import { MagazineSection } from "./components/HeroCarousel";
import { SystemsCarousel } from "./components/SystemsShowcase";
import { TestimonialsSection } from "./components/Testimonials";
import { FaqSection } from "./components/Faq";
import { useTrackVisit } from "./useTrackVisit";

export default function VisitorPage() {
  useTrackVisit();

  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroY = useTransform(scrollYProgress, [0, 1], ["0%", "18%"]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  return (
    <div className="vPage">

      {/* ── Hero ────────────────────────────────────────────────────── */}
      <section className="vHero" ref={heroRef}>
        <motion.div className="vHeroBg" style={{ y: heroY }}>
          <video
            className="vHeroVideo"
            src="/hero-bg.mp4"
            autoPlay muted loop playsInline
          />
          <div className="vHeroOverlay" />
          {/* Grain texture */}
          <div className="vHeroGrain" />
        </motion.div>

        <motion.div className="vHeroContent" style={{ opacity: heroOpacity }}>
          <motion.p
            className="vHeroEyebrow"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
          >
            Digital Infrastructure · Enterprise Systems
          </motion.p>

          <motion.h1
            className="vHeroTitle"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
          >
            Systems built for<br />
            <em className="vHeroItalic">modern business.</em>
          </motion.h1>

          <motion.p
            className="vHeroSub"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.45 }}
          >
            Warehouse, construction, inventory, and operational systems<br />
            engineered with cinematic precision.
          </motion.p>

          <motion.div
            className="vHeroActions"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.65 }}
          >
            <Link href="/register" className="vHeroBtnPrimary">Start a Project</Link>
            <Link href="#systems" className="vHeroBtnSecondary">
              Explore Systems
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M1 7h12M8 3l5 4-5 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </Link>
          </motion.div>

          {/* Scroll indicator */}
          {/* <motion.div
            className="vScrollHint"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5, duration: 1 }}
          >
            <div className="vScrollLine" />
            <span>scroll</span>
          </motion.div> */}
        </motion.div>
      </section>

      {/* ── Trust marquee ───────────────────────────────────────────── */}
      <section className="vTrust">
        <Reveal>
          <p className="vTrustLabel">Built with enterprise-grade technology</p>
        </Reveal>
        <Marquee items={techStack} />
      </section>

      {/* ── Systems ─────────────────────────────────────────────────── */}
      <section className="vSystems" id="systems">
        <div className="vSectionHeader">
          <Reveal>
            <span className="vSectionEyebrow">Systems Showcase</span>
          </Reveal>
          <Reveal delay={0.1}>
            <h2 className="vSectionTitle">Choose your infrastructure.</h2>
          </Reveal>
          <Reveal delay={0.2}>
            <p className="vSectionSub">Built once. Owned forever. Engineered to outlast your competition.</p>
          </Reveal>
        </div>

        <SystemsCarousel />

        {/* Sprint & Agile Methodology */}
        <div className="vSprintInner">


          <div className="vSprintHeader">
            <Reveal>
              <span className="vSectionEyebrow">How We Build</span>
            </Reveal>
            <Reveal delay={0.1}>
              <h2 className="vSectionTitle">Sprint & Agile methodology.</h2>
            </Reveal>
            <Reveal delay={0.2}>
              <p className="vSectionSub">
                Every system we build follows a structured agile process — from your first call to your final approval before a single line of code is written.
              </p>
            </Reveal>
          </div>

          <div className="vSprintTrack">

            {/* Connector line */}
            <div className="vSprintLine" />

            {/* Step 1 */}
            <Reveal delay={0.0}>
              <div className="vSprintStep">
                <div className="vSprintStepNum">01</div>
                <div className="vSprintStepIcon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" fill="currentColor" />
                  </svg>
                </div>
                <div className="vSprintStepBody">
                  <h3 className="vSprintStepTitle">Discovery Call (VC)</h3>
                  <p className="vSprintStepDesc">
                    We start with a video call — no forms, no guesswork. You walk us through your business, your pain points, and what you need the system to do. We listen, ask the right questions, and capture every requirement in detail.
                  </p>
                  <ul className="vSprintStepList">
                    <li>Understand your business workflow</li>
                    <li>Identify pain points & bottlenecks</li>
                    <li>Record all feature requirements</li>
                    <li>Define scope and priorities</li>
                  </ul>
                </div>
              </div>
            </Reveal>

            {/* Step 2 */}
            <Reveal delay={0.1}>
              <div className="vSprintStep">
                <div className="vSprintStepNum">02</div>
                <div className="vSprintStepIcon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <div className="vSprintStepBody">
                  <h3 className="vSprintStepTitle">Feature Recording & Backlog</h3>
                  <p className="vSprintStepDesc">
                    Every feature discussed in the call is documented into a structured backlog — broken down into user stories, modules, and sprint tasks. Nothing gets lost, nothing gets assumed.
                  </p>
                  <ul className="vSprintStepList">
                    <li>All features logged as user stories</li>
                    <li>Modules broken into sprint tasks</li>
                    <li>Priority ranking per feature</li>
                    <li>Effort estimation per task</li>
                  </ul>
                </div>
              </div>
            </Reveal>

            {/* Step 3 */}
            <Reveal delay={0.2}>
              <div className="vSprintStep">
                <div className="vSprintStepNum">03</div>
                <div className="vSprintStepIcon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <div className="vSprintStepBody">
                  <h3 className="vSprintStepTitle">Full Project Roadmap</h3>
                  <p className="vSprintStepDesc">
                    We build a complete project roadmap — sprint by sprint, milestone by milestone. You see exactly what gets built, when it ships, and what the final system looks like before we write a single line of code.
                  </p>
                  <ul className="vSprintStepList">
                    <li>Sprint-by-sprint delivery plan</li>
                    <li>Milestone & deadline mapping</li>
                    <li>Database & system architecture</li>
                    <li>UI/UX wireframe overview</li>
                  </ul>
                </div>
              </div>
            </Reveal>

            {/* Step 4 */}
            <Reveal delay={0.3}>
              <div className="vSprintStep">
                <div className="vSprintStepNum">04</div>
                <div className="vSprintStepIcon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <div className="vSprintStepBody">
                  <h3 className="vSprintStepTitle">Client Approval</h3>
                  <p className="vSprintStepDesc">
                    The full roadmap is sent to you for review. You approve every feature, every sprint, and every milestone. No surprises, no scope creep. We don't start building until you sign off.
                  </p>
                  <ul className="vSprintStepList">
                    <li>Roadmap sent via email & VC</li>
                    <li>Client reviews all features</li>
                    <li>Revisions handled before coding</li>
                    <li>Formal sign-off required</li>
                  </ul>
                </div>
              </div>
            </Reveal>

            {/* Step 5 */}
            <Reveal delay={0.4}>
              <div className="vSprintStep vSprintStepLast">
                <div className="vSprintStepNum">05</div>
                <div className="vSprintStepIcon vSprintStepIconActive">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <div className="vSprintStepBody">
                  <h3 className="vSprintStepTitle">Sprint Execution & Delivery</h3>
                  <p className="vSprintStepDesc">
                    Once approved, we execute — sprint by sprint, with regular progress updates. Each sprint delivers a working slice of the system. You see real progress every week, not just a final dump at the end.
                  </p>
                  <ul className="vSprintStepList">
                    <li>Agile sprint cycles (1–2 weeks)</li>
                    <li>Weekly progress updates</li>
                    <li>Testing per sprint before next</li>
                    <li>Final UAT & deployment</li>
                  </ul>
                </div>
              </div>
            </Reveal>

          </div>

          {/* Bottom CTA */}
          <Reveal delay={0.3}>
            <div className="vSprintCta">
              <p className="vSprintCtaText">Ready to start your discovery call?</p>
              <a href="/register" className="vHeroBtnPrimary">Book a VC Call</a>
            </div>
          </Reveal>


        </div>
      </section>

      {/* ── Comparison Table ─────────────────────────────────────────── */}
      <section className="vCompare" id="compare">
        <div className="vCompareInner">
          <div className="vSectionHeader">
            <Reveal><span className="vSectionEyebrow">Why Matthew Studio</span></Reveal>
            <Reveal delay={0.1}>
              <h2 className="vSectionTitle">Compare your options.</h2>
            </Reveal>
            <Reveal delay={0.2}>
              <p className="vSectionSub">Not all solutions are equal. Here's how we stack up against the alternatives.</p>
            </Reveal>
          </div>

          <Reveal delay={0.15}>
            <div className="vCompareTable">
              {/* Column headers */}
              <div className="vCompareHeader">
                <div className="vCompareHeaderCell vCompareFeatureCol">Feature</div>
                <div className="vCompareHeaderCell vCompareUs">
                  <span className="vCompareUsLabel">Matthew Studio</span>
                  <span className="vCompareUsBadge">Recommended</span>
                </div>
                <div className="vCompareHeaderCell">Agency</div>
                <div className="vCompareHeaderCell">Template</div>
              </div>

              {/* Rows */}
              {[
                { feature: "Custom to your business",  us: true,  agency: true,  template: false },
                { feature: "Fixed price upfront",       us: true,  agency: false, template: true  },
                { feature: "Source code ownership",     us: true,  agency: false, template: false },
                { feature: "1 month free support",      us: true,  agency: false, template: false },
                { feature: "Sprint-based delivery",     us: true,  agency: true,  template: false },
                { feature: "Lifetime access",           us: true,  agency: false, template: true  },
                { feature: "Philippine peso pricing",   us: true,  agency: false, template: false },
                { feature: "No monthly fees",           us: true,  agency: false, template: true  },
                { feature: "Dedicated project manager", us: true,  agency: true,  template: false },
                { feature: "Ready in 2–6 weeks",        us: true,  agency: false, template: true  },
                { feature: "Scalable architecture",     us: true,  agency: true,  template: false },
              ].map((row, i) => (
                <div key={row.feature} className={"vCompareRow" + (i % 2 === 0 ? " vCompareRowAlt" : "")}>
                  <div className="vCompareCell vCompareFeatureCol">
                    <span className="vCompareFeatureText">{row.feature}</span>
                  </div>
                  <div className="vCompareCell vCompareUs">
                    {row.us
                      ? <span className="vCompareTick vCompareTickUs"><svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 7l3.5 3.5L12 3" stroke="#7dc9a0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg></span>
                      : <span className="vCompareCross"><svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 2l8 8M10 2l-8 8" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" strokeLinecap="round"/></svg></span>
                    }
                  </div>
                  <div className="vCompareCell">
                    {row.agency
                      ? <span className="vCompareTick"><svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 7l3.5 3.5L12 3" stroke="rgba(255,255,255,0.3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg></span>
                      : <span className="vCompareCross"><svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 2l8 8M10 2l-8 8" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" strokeLinecap="round"/></svg></span>
                    }
                  </div>
                  <div className="vCompareCell">
                    {row.template
                      ? <span className="vCompareTick"><svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 7l3.5 3.5L12 3" stroke="rgba(255,255,255,0.3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg></span>
                      : <span className="vCompareCross"><svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 2l8 8M10 2l-8 8" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" strokeLinecap="round"/></svg></span>
                    }
                  </div>
                </div>
              ))}

              {/* Price row */}
              <div className="vCompareRow vComparePriceRow">
                <div className="vCompareCell vCompareFeatureCol">
                  <span className="vCompareFeatureText">Typical price range</span>
                </div>
                <div className="vCompareCell vCompareUs">
                  <span className="vComparePriceUs">₱2,999 – ₱15,000</span>
                </div>
                <div className="vCompareCell">
                  <span className="vComparePriceOther">₱50,000 – ₱300,000+</span>
                </div>
                <div className="vCompareCell">
                  <span className="vComparePriceOther">₱500 – ₱5,000 + monthly fees</span>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── How We Build ─────────────────────────────────────────── */}
      {/* ── Process ─────────────────────────────────────────────────── */}
      <section className="vPriceSection" id="pricing">
        <div className="vPriceSectionInner">

          {/* Header */}
          <div className="vSectionHeader">
            <Reveal><span className="vSectionEyebrow">Pricing Transparency</span></Reveal>
            <Reveal delay={0.1}>
              <h2 className="vSectionTitle">What actually drives cost.</h2>
            </Reveal>
            <Reveal delay={0.2}>
              <p className="vSectionSub">
                No hidden fees. No vague quotes. Here's exactly what moves the number up or down.
              </p>
            </Reveal>
          </div>

          {/* 3 factor cards */}
          <div className="vPriceFactors">
            {[
              {
                num: "01",
                label: "Complexity",
                accent: "#7dc9a0",
                icon: (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ),
                desc: "The number of modules, user roles, and business rules directly determines how much architecture and engineering is required.",
                low: { label: "Simple", detail: "1–2 modules, single role, basic CRUD", price: "₱5,000 – ₱8,000" },
                high: { label: "Complex", detail: "5+ modules, multi-role, advanced logic", price: "₱15,000 – ₱35,000+" },
                factors: ["Number of modules", "User roles & permissions", "Business rule complexity", "Data relationships"],
              },
              {
                num: "02",
                label: "Integrations",
                accent: "#7eb8d4",
                icon: (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                    <path d="M18 20V10M12 20V4M6 20v-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ),
                desc: "Every third-party service — payment gateways, SMS APIs, email providers, government portals — adds development and maintenance overhead.",
                low: { label: "None", detail: "Standalone system, no external APIs", price: "No added cost" },
                high: { label: "Multiple", detail: "PayMongo, SMS, email, maps, etc.", price: "+₱3,000 – ₱8,000 each" },
                factors: ["Payment gateways (PayMongo)", "SMS & email providers", "Third-party data feeds", "External APIs & webhooks"],
              },
              {
                num: "03",
                label: "Timeline",
                accent: "#c4b5fd",
                icon: (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5"/>
                    <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ),
                desc: "Rush projects require parallel sprint execution and dedicated resources. Standard timelines allow for proper planning, testing, and delivery.",
                low: { label: "Standard", detail: "4–8 weeks, planned sprints", price: "Base rate" },
                high: { label: "Rush", detail: "Under 2 weeks, expedited delivery", price: "+20% – +40% premium" },
                factors: ["Delivery deadline", "Sprint parallelism required", "Testing & QA time", "Client review cycles"],
              },
            ].map((f, i) => (
              <Reveal key={f.label} delay={i * 0.1}>
                <div className="vPriceCard" style={{ "--acc": f.accent } as React.CSSProperties}>
                  <div className="vPriceCardGlow" />
                  <div className="vPriceCardTop">
                    <span className="vPriceNum">{f.num}</span>
                    <div className="vPriceIcon" style={{ color: f.accent, borderColor: f.accent + "33", background: f.accent + "12" }}>
                      {f.icon}
                    </div>
                  </div>
                  <h3 className="vPriceLabel" style={{ color: f.accent }}>{f.label}</h3>
                  <p className="vPriceDesc">{f.desc}</p>

                  {/* Low / High range */}
                  <div className="vPriceRange">
                    <div className="vPriceRangeRow">
                      <span className="vPriceRangeBadge" style={{ color: f.accent, borderColor: f.accent + "33", background: f.accent + "10" }}>Low</span>
                      <div className="vPriceRangeBody">
                        <span className="vPriceRangeDetail">{f.low.detail}</span>
                        <span className="vPriceRangePrice" style={{ color: f.accent }}>{f.low.price}</span>
                      </div>
                    </div>
                    <div className="vPriceRangeDivider" />
                    <div className="vPriceRangeRow">
                      <span className="vPriceRangeBadge" style={{ color: f.accent, borderColor: f.accent + "33", background: f.accent + "10" }}>High</span>
                      <div className="vPriceRangeBody">
                        <span className="vPriceRangeDetail">{f.high.detail}</span>
                        <span className="vPriceRangePrice" style={{ color: f.accent }}>{f.high.price}</span>
                      </div>
                    </div>
                  </div>

                  {/* What factors in */}
                  <div className="vPriceFactorList">
                    <span className="vPriceFactorLabel">Factors in:</span>
                    <ul className="vPriceFactorItems">
                      {f.factors.map((item) => (
                        <li key={item} className="vPriceFactorItem">
                          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ flexShrink: 0 }}>
                            <path d="M1.5 5l2.5 2.5 4.5-4.5" stroke={f.accent} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>

          {/* Bottom note */}
          <Reveal delay={0.3}>
            <div className="vPriceNote">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, opacity: 0.5 }}>
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              <p>
                Every project starts with a <strong>free discovery call</strong> where we scope your requirements and give you a fixed price — no surprises mid-build.{" "}
                <a href="/register" className="vPriceNoteLink">Book your call →</a>
              </p>
            </div>
          </Reveal>

        </div>
      </section>

      {/* ── Testimonials ─────────────────────────────────────────── */}
      {/* ── Testimonials — social proof while still warm ────────────── */}
      <TestimonialsSection />

      {/* ── About ───────────────────────────────────────────────────── */}
      <section className="vAbout" id="about">
        <div className="vAboutInner">
          <div className="vAboutLeft">
            <Reveal><span className="vSectionEyebrow">About</span></Reveal>
            <Reveal delay={0.1}>
              <h2 className="vAboutTitle">
                We architect systems that<br />
                <em>think ahead.</em>
              </h2>
            </Reveal>
          </div>
          <div className="vAboutRight">
            <Reveal delay={0.15}>
              <p className="vAboutP">
                Matthew Studio is a digital systems company operating at the intersection of enterprise infrastructure and cinematic design. We don't build templates — we engineer precision tools for businesses that demand more than off-the-shelf software.
              </p>
            </Reveal>
            <Reveal delay={0.25}>
              <p className="vAboutP">
                Every system we deliver is architected for scale, built with enterprise-grade standards, and designed with the kind of visual precision usually reserved for luxury products. The result is infrastructure that performs and impresses.
              </p>
            </Reveal>
            <Reveal delay={0.35}>
              <div className="vAboutStats">
                <div className="vAboutStat">
                  <span className="vAboutStatNum">3+</span>
                  <span className="vAboutStatLabel">System Types</span>
                </div>
                <div className="vAboutStat">
                  <span className="vAboutStatNum">100%</span>
                  <span className="vAboutStatLabel">Custom Built</span>
                </div>
                <div className="vAboutStat">
                  <span className="vAboutStatNum">∞</span>
                  <span className="vAboutStatLabel">Lifetime Access</span>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── Guarantee ────────────────────────────────────────────── */}
      {/* ── Guarantee / Trust Badges ─────────────────────────────────── */}
      <section className="vTrustBadges" id="guarantee">
        <div className="vTrustBadgesInner">
          <Reveal>
            <span className="vSectionEyebrow">Our Guarantee</span>
          </Reveal>
          <Reveal delay={0.1}>
            <h2 className="vSectionTitle">Built with confidence. Backed by commitment.</h2>
          </Reveal>
          <Reveal delay={0.2}>
            <p className="vSectionSub">Every system we deliver comes with these guarantees — no asterisks, no fine print.</p>
          </Reveal>

          <div className="vBadgeGrid">
            {[
              {
                accent: "#7dc9a0",
                icon: (
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ),
                title: "1 Month Free Support",
                desc: "After delivery, we stay. Bug fixes, questions, and minor tweaks — all covered free for 30 days. No ticket system. Direct access.",
                tag: "Post-delivery",
              },
              {
                accent: "#7eb8d4",
                icon: (
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ),
                title: "Source Code Included",
                desc: "You own 100% of the codebase. Full repository access, no lock-in, no licensing fees. Take it anywhere, modify anything.",
                tag: "Full ownership",
              },
              {
                accent: "#c4b5fd",
                icon: (
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                    <path d="M12 2L2 7l10 5 10-5-10-5z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ),
                title: "Lifetime Access",
                desc: "Your dashboard, your assets, your system — forever. No subscriptions, no renewals, no expiry. One payment, infinite access.",
                tag: "No subscriptions",
              },
              {
                accent: "#fcd34d",
                icon: (
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5"/>
                    <path d="M12 8v4l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                ),
                title: "Fixed Price. No Surprises.",
                desc: "We quote before we build. Scope, timeline, and price are locked in writing before a single line of code is written.",
                tag: "Transparent billing",
              },
              {
                accent: "#86efac",
                icon: (
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ),
                title: "Dedicated Project Manager",
                desc: "A single point of contact throughout every sprint. Weekly updates, direct communication, and zero ambiguity on project status.",
                tag: "Dedicated contact",
              },
              {
                accent: "#fdba74",
                icon: (
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ),
                title: "Sprint-Based Delivery",
                desc: "You see working software every 1–2 weeks — not a mystery box at the end. Each sprint is reviewed, approved, and signed off by you.",
                tag: "Agile process",
              },
            ].map((b, i) => (
              <Reveal key={b.title} delay={i * 0.07}>
                <div className="vBadgeCard" style={{ "--acc": b.accent } as React.CSSProperties}>
                  <div className="vBadgeCardGlow" />
                  <div className="vBadgeTop">
                    <div className="vBadgeIcon" style={{ color: b.accent, background: b.accent + "14", borderColor: b.accent + "33" }}>
                      {b.icon}
                    </div>
                    <span className="vBadgeTag" style={{ color: b.accent, borderColor: b.accent + "33", background: b.accent + "10" }}>{b.tag}</span>
                  </div>
                  <h3 className="vBadgeTitle">{b.title}</h3>
                  <p className="vBadgeDesc">{b.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Maintenance Fee ──────────────────────────────────────────── */}
      <section className="vMaintenance" id="maintenance">
        <div className="vMaintenanceInner">
          <div className="vSprintHeader">
            <Reveal><span className="vSectionEyebrow">Optional but Recommended</span></Reveal>
            <Reveal delay={0.1}><h2 className="vSectionTitle">Maintenance & Support.</h2></Reveal>
            <Reveal delay={0.2}>
              <p className="vSectionSub">
                Keep your system running at peak performance after launch. Most freelancers skip this — smart ones don&apos;t.
                This is where recurring income is built.
              </p>
            </Reveal>
          </div>

          {/* Tier cards */}
          <div className="vMaintenanceTiers">
            {[
              {
                label: "Basic",
                price: "₱4,500",
                period: "/month",
                color: "#7dc9a0",
                includes: ["Bug fixing & minor revisions", "Email support (48hr response)", "Monthly system health check", "Uptime monitoring"],
              },
              {
                label: "Priority Support",
                price: "₱8,500",
                period: "/month",
                color: "#7eb8d4",
                includes: ["Everything in Basic", "Priority response (24hrs)", "Security patches & updates", "Performance monitoring", "Database backups"],
                highlight: false,
              },
              {
                label: "Full Maintenance",
                price: "₱15,000",
                period: "/month",
                color: "#c4b5fd",
                includes: ["Everything in Priority", "Server monitoring & auto-backups", "Minor feature updates (up to 8hrs/month)", "Monthly performance report", "Dedicated support channel"],
                highlight: true,
              },
            ].map((tier, i) => (
              <Reveal key={i} delay={i * 0.1}>
                <div className={"vMaintenanceTier" + (tier.highlight ? " vMaintenanceTierHighlight" : "")}
                  style={{ "--mt-color": tier.color } as React.CSSProperties}>
                  <div className="vMtHeader">
                    <span className="vMtLabel" style={{ color: tier.color }}>{tier.label}</span>
                    <div className="vMtPrice">
                      <span className="vMtAmount">{tier.price}</span>
                      <span className="vMtPeriod">{tier.period}</span>
                    </div>
                  </div>
                  <ul className="vMtFeatures">
                    {tier.includes.map((f, fi) => (
                      <li key={fi} className="vMtFeature">
                        <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                          <path d="M1 7l3.5 3.5L12 2" stroke={tier.color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        {f}
                      </li>
                    ))}
                  </ul>
                  <a href="/register" className="vMtBtn" style={{ background: tier.highlight ? tier.color : "transparent",
                    borderColor: tier.color, color: tier.highlight ? "#000" : tier.color }}>
                    Get Started
                  </a>
                </div>
              </Reveal>
            ))}
          </div>

          {/* Note */}
          <Reveal delay={0.3}>
            <div className="vMaintenanceNote vMaintenanceNoteEmphasis">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, marginTop: 1 }}>
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" stroke="#f59e0b" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                <line x1="12" y1="9" x2="12" y2="13" stroke="#f59e0b" strokeWidth="1.8" strokeLinecap="round"/>
                <line x1="12" y1="17" x2="12.01" y2="17" stroke="#f59e0b" strokeWidth="2.2" strokeLinecap="round"/>
              </svg>
              <span>
                Maintenance does <strong>not</strong> include major new features.{" "}
                <strong>New features are scoped and quoted separately as a new project.</strong>
              </span>
            </div>
          </Reveal>
        </div>
      </section>



      {/* ── AI Visual Systems ─────────────────────────────────────────────── */}
      {/* ── AI Visual Systems — Header only, contained ── */}
      <section className="vAiSection" id="ai-visuals">
        <div className="vAiSectionInner">
          <div className="vAiHeader">
            <Reveal>
              <span className="vSectionEyebrow">AI Visual Systems</span>
            </Reveal>
            <Reveal delay={0.1}>
              <h2 className="vAiMainTitle">
                Spaces that don&apos;t exist.<br />
                <em className="vHeroItalic">Until they do.</em>
              </h2>
            </Reveal>
            <Reveal delay={0.2}>
              <p className="vAiHeaderSub">
                AI-generated interior and exterior design films — cinematic, full-resolution,
                and ready to use. Purchase once. Download forever.
              </p>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          STANDALONE SECTION 1 — ARCHITECTURE
          Scroll-jacked intro → Interior + Exterior video sections
      ═══════════════════════════════════════════════════════════════ */}
      <ArchitectureIntroSection />
      <ArchitectureVideosSection />

      {/* ── Divider ── */}
      {/*
      <div className="vAiSectionDivider">
        <div className="vAiSectionDividerLine" />
        <span className="vAiSectionDividerLabel">3D Modeling</span>
        <div className="vAiSectionDividerLine" />
      </div>
      */}

      {/* ═══════════════════════════════════════════════════════════════
          STANDALONE SECTION 2 — MODELING
          Full-width sticky scroll-jacking: orcs → videos
      ═══════════════════════════════════════════════════════════════ */}
      {/* ── Modeling intro — standalone ── */}
      <ModelingIntro />

      {/* ── Modeling magazine — rendered directly after intro ── */}
      <ModelingMagazine>
        <MagazineSection
          label="3D Animation"
          labelAccent="#4ade80"
          title="3 Animations."
          titleAccent="#4ade80"
          italicLine="Rendered in Blender."
          desc="Hand-modelled 3D assets animated in Blender — cinematic camera orbits, HDRI lighting, and photorealistic metal shaders. Full resolution MP4, lifetime access."
          accent="#4ade80"
          gradient="linear-gradient(135deg, #061a0e 0%, #0e2a18 60%, #0d0c0b 100%)"
          r2Prefix="weapon"
          ctaLabel="Get Animation Access"
          delay={0.1}
        />
        <div className="vObjNote">
          <div className="vObjNoteLeft">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" style={{ color: "#4ade80", flexShrink: 0 }}>
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
              <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
              <line x1="12" y1="22.08" x2="12" y2="12"/>
            </svg>
            <div>
              <p className="vObjNoteTitle"><span style={{ color: "#4ade80" }}>.OBJ source files included</span> with every 3D animation purchase.</p>
              <p className="vObjNoteDesc">Every weapon animation comes with the original <strong>.OBJ + .MTL source files</strong> — import directly into Blender, Maya, or Cinema 4D. Files are <strong>not publicly accessible</strong> — delivered privately to your email upon purchase.</p>
              <div className="vObjNoteBadges">
                {[".OBJ", ".MTL", "Blender", "Maya", "Cinema 4D"].map(b => <span key={b} className="vObjBadge">{b}</span>)}
                <span className="vObjBadgePrivate">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                  Once purchased, lifetime access.
                </span>
              </div>
            </div>
          </div>
        </div>
        <MagazineSection
          label="3D Character Animation"
          labelAccent="#86efac"
          title="3 Characters."
          titleAccent="#86efac"
          italicLine="Sculpted in Blender."
          desc="High-poly orc character animations rendered in Blender — cinematic camera orbits, HDRI environment lighting, procedural skin shaders, and full shadow passes. Full resolution MP4, lifetime access."
          accent="#86efac"
          gradient="linear-gradient(135deg, #061a0a 0%, #0e2a12 60%, #0d0c0b 100%)"
          r2Prefix="character"
          ctaLabel="Get Character Access"
          delay={0.15}
        />
        <div className="vObjNote" style={{ borderColor: "rgba(134,239,172,0.18)", background: "rgba(134,239,172,0.05)" }}>
          <div className="vObjNoteLeft">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" style={{ color: "#86efac", flexShrink: 0 }}>
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
              <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
              <line x1="12" y1="22.08" x2="12" y2="12"/>
            </svg>
            <div>
              <p className="vObjNoteTitle"><span style={{ color: "#86efac" }}>.OBJ source files included</span> with every 3D character animation purchase.</p>
              <p className="vObjNoteDesc">Every character animation comes with the original <strong>.OBJ + .MTL source files</strong> — import directly into Blender, Maya, or Cinema 4D. Modify the mesh, apply your own shaders, or re-render at any resolution. Files delivered privately to your email upon purchase.</p>
              <div className="vObjNoteBadges">
                {[".OBJ", ".MTL", "Blender", "Maya", "Cinema 4D"].map(b => (
                  <span key={b} className="vObjBadge" style={{ color: "#86efac", background: "rgba(134,239,172,0.1)", borderColor: "rgba(134,239,172,0.2)" }}>{b}</span>
                ))}
                <span className="vObjBadgePrivate">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                  Once purchased, lifetime access.
                </span>
              </div>
            </div>
          </div>
        </div>
      </ModelingMagazine>

      {/* ── Final AI CTA — contained block ── */}
      <section className="vAiCtaSection">
        <div className="vAiSectionInner">
          <div className="vAiSectionBlock vAiCtaBlock">
            <p className="vAiCtaEyebrow">20 videos · .OBJ source files · Full resolution · Lifetime access</p>
            <h3 className="vAiCtaTitle">
              Own the collection.<br />
              <em style={{ color: "#7dc9a0", fontStyle: "italic" }}>Start today.</em>
            </h3>
            <p className="vAiCtaSub">Register free, then purchase. Your videos are waiting in your dashboard the moment payment clears.</p>
            <a href="/register" className="vAiGetAccessBtn vAiCtaBtn" style={{ background: "#7dc9a0" }}>
              Get Lifetime Access
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                <path d="M1 12L12 1M12 1H6M12 1v6" stroke="#0d0c0b" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </a>
          </div>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────── */}
      {/* ── FAQ — last objection clearance before CTA ──────────────── */}
      <FaqSection />

      {/* ── Final CTA ───────────────────────────────────────────────── */}
      <section className="vCta">
        <div className="vCtaBg" />
        <div className="vCtaContent">
          <Reveal>
            <span className="vSectionEyebrow" style={{ color: "rgba(255,255,255,0.5)" }}>Ready to build?</span>
          </Reveal>
          <Reveal delay={0.1}>
            <h2 className="vCtaTitle">
              Build infrastructure<br />that outlasts trends.
            </h2>
          </Reveal>
          <Reveal delay={0.2}>
            <p className="vCtaSub">
              Premium digital systems for modern operations.<br />
              Built once. Yours forever.
            </p>
          </Reveal>
          <Reveal delay={0.3}>
            <div className="vCtaActions">
              <Link href="/register" className="vCtaBtn">Start a Project</Link>
              <Link href="/systems" className="vCtaBtnGhost">Browse Systems</Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────── */}
      <footer className="vFooter">
        <div className="vFooterTop">
          <div className="vFooterBrand">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/favicon.png" alt="Matthew Studio" className="vNavLogoImg" />
            <span className="vFooterLogoText">Matthew Studio</span>
          </div>
          <nav className="vFooterNav">
            <Link href="#systems" className="vFooterLink">Systems</Link>
            <Link href="#process" className="vFooterLink">Process</Link>
            <Link href="#faq" className="vFooterLink">FAQ</Link>
            <Link href="#about" className="vFooterLink">About</Link>
            <Link href="/login" className="vFooterLink">Sign In</Link>
            <Link href="/register" className="vFooterLink">Sign Up</Link>
          </nav>
        </div>
        <div className="vFooterBottom">
          <p className="vFooterCopy">© {new Date().getFullYear()} Matthew Studio. All rights reserved.</p>
          <p className="vFooterTagline">System · Services · Digital Assets</p>
        </div>
      </footer>
    </div>
  );
}