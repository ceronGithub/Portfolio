/* =============================================
   PORTFOLIO JS — Ceron Matthew Calsena
   Debugged & Cleaned
============================================= */

// ─── Navbar Scroll Effect ─────────────────
const navbar = document.getElementById('navbar');
if (navbar) {
  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 50);
  }, { passive: true });
}

// ─── Logo Typing Animation ────────────────
const logoEl = document.getElementById('logoTyped');
const logoWords = ['VA + Dev', 'Web Dev', 'CMC', 'Desktop Dev'];
let lIdx = 0, lChar = 0, lDeleting = false;

/**
 * typeLogo — Logo Typing Animation
 * WHAT: Cycles through logoWords[], typing then deleting each word character by character.
 * HOW: Uses lChar (cursor position), lDeleting (direction), and lIdx (word index).
 *      Calls itself recursively via setTimeout with variable delay per phase.
 * CALLED BY: setTimeout on page load (2500ms after load, deletes initial 'CMC' first).
 */
function typeLogo() {
  if (!logoEl) return;
  const word = logoWords[lIdx];

  if (lDeleting) {
    lChar--;
    logoEl.textContent = word.substring(0, lChar);
  } else {
    lChar++;
    logoEl.textContent = word.substring(0, lChar);
  }

  let delay = lDeleting ? 80 : 130;

  if (!lDeleting && lChar === word.length) {
    // Finished typing — pause then delete
    delay = 2500;
    lDeleting = true;
  } else if (lDeleting && lChar === 0) {
    // Finished deleting — move to next word
    lDeleting = false;
    lIdx = (lIdx + 1) % logoWords.length;
    delay = 400;
  }

  setTimeout(typeLogo, delay);
}

// CMC shown in HTML — start cycling to next words after 2.5s
setTimeout(() => {
  lDeleting = true;
  lChar = 3; // start deleting 'CMC'
  typeLogo();
}, 2500);

// ─── Hamburger Menu ───────────────────────
const hamburger = document.getElementById('hamburger');
const navLinks  = document.getElementById('navLinks');

if (hamburger && navLinks) {
  hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('open');
    navLinks.classList.toggle('open');
  });

  navLinks.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
      hamburger.classList.remove('open');
      navLinks.classList.remove('open');
    });
  });
}

// ─── Hero Typing Animation ─────────────────
const roles = [
  'Full Stack Developer',
  'Laravel Developer',
  'Inventory System Builder',
  'Booking System Developer',
  'AI Automation Dev',
  'PHP Developer',
  'Web App Developer',
  'Freelance Developer PH'
];

let roleIndex  = 0;
let charIndex  = 0;
let isDeleting = false;
const typedEl  = document.getElementById('typedText');

/**
 * type — Hero Typing Animation
 * WHAT: Cycles through roles[], typing and deleting each role title in the hero section.
 * HOW: Tracks charIndex and isDeleting state; adjusts delay per phase (type=110ms, delete=60ms).
 *      Calls itself recursively via setTimeout.
 * CALLED BY: setTimeout(type, 1200) on page load.
 */
function type() {
  if (!typedEl) return;
  const current = roles[roleIndex];
  typedEl.textContent = isDeleting
    ? current.substring(0, charIndex - 1)
    : current.substring(0, charIndex + 1);
  isDeleting ? charIndex-- : charIndex++;

  let delay = isDeleting ? 60 : 110;
  if (!isDeleting && charIndex === current.length) {
    delay = 1800; isDeleting = true;
  } else if (isDeleting && charIndex === 0) {
    isDeleting = false;
    roleIndex = (roleIndex + 1) % roles.length;
    delay = 400;
  }
  setTimeout(type, delay);
}
setTimeout(type, 1200);

// ─── Scroll Reveal: Fade-In + Fade-Out (bidirectional) ────────
// WHAT: Reveals elements on scroll-down entry, un-reveals on scroll-up exit.
// HOW:  Uses two IntersectionObservers — one per scroll direction — to eliminate
//       the async race condition between the scroll listener and observer callback.
//       scrollDownObserver fires when element enters from below (reveal).
//       scrollUpObserver fires when element exits below the viewport (un-reveal).
//       Each observer uses the correct rootMargin for its direction so callbacks
//       fire reliably regardless of scroll speed.
//       Mobile guard: un-reveal skipped on ≤600px to prevent mid-scroll flicker.
const revealEls = document.querySelectorAll('.reveal');
let lastRevealScrollY = window.scrollY;
let revealScrollDir = 'down';

window.addEventListener('scroll', () => {
  revealScrollDir = window.scrollY > lastRevealScrollY ? 'down' : 'up';
  lastRevealScrollY = window.scrollY;
}, { passive: true });

// Observer 1 — fires when element enters the viewport from below (scroll-down)
const scrollDownObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.remove('fade-out-up', 'fade-out-down');
      entry.target.classList.add('visible');
    }
  });
}, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });

// Observer 2 — fires when element exits the bottom of the viewport (scroll-up)
// rootMargin bottom is positive so the trigger zone extends below the viewport,
// catching the element the moment it re-enters from the bottom edge on scroll-up.
const scrollUpObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    const isMobile = window.innerWidth <= 600;
    if (isMobile) return;

    if (!entry.isIntersecting && entry.target.classList.contains('visible')) {
      // boundingClientRect.top > 0 means element is below the viewport — scroll-up exit
      if (entry.boundingClientRect.top > 0) {
        entry.target.classList.remove('visible', 'fade-out-up');
        entry.target.classList.add('fade-out-down');
      }
    }
  });
}, { threshold: 0, rootMargin: '0px 0px 80px 0px' });

revealEls.forEach(el => {
  scrollDownObserver.observe(el);
  scrollUpObserver.observe(el);
});

// ─── Staggered Children Animation ──────────
document.querySelectorAll('.cert-flip-grid, .about-cards, .projects-grid, .contact-links, .about-stats').forEach(container => {
  const children = container.querySelectorAll('.cert-flip-wrap, .info-card, .project-card, .contact-item, .stat-item');
  // Use CSS custom property to avoid repeated style recalculations
  children.forEach((child, i) => {
    child.style.setProperty('--stagger-delay', `${i * 0.08}s`);
  });
});

// ─── Skill Bar Animation (bidirectional) ──────────────────
// WHAT: Animates skill bars 0% to target width on scroll-down entry.
//       Resets to 0% on scroll-up exit so the animation replays cleanly on re-entry.
// HOW:  Shares revealScrollDir from the reveal observer above.
//       transition:none is applied before the reset so the snap is instant,
//       then restored via double-rAF so the next fill animates smoothly.
const skillFills = document.querySelectorAll('.skill-fill');

const skillObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    const fill = entry.target;
    const targetWidth = fill.getAttribute('data-width');

    if (entry.isIntersecting) {
      // Animate fill to target width on entry
      setTimeout(() => { fill.style.width = targetWidth + '%'; }, 300);
    } else if (revealScrollDir === 'up') {
      // Reset to 0% instantly on scroll-up exit
      fill.style.transition = 'none';
      fill.style.width = '0%';
      // Re-enable transition after reset so next fill animates smoothly
      requestAnimationFrame(() => {
        requestAnimationFrame(() => { fill.style.transition = ''; });
      });
    }
  });
}, { threshold: 0.3 });

skillFills.forEach(fill => skillObserver.observe(fill));

// ─── Parallax on Scroll ───────────────────
const layerBg   = document.getElementById('layerBg');
const layerGrid = document.getElementById('layerGrid');
const layerOrbs = document.getElementById('layerOrbs');
const layerFg   = document.getElementById('layerFg');

// Pre-promote layers to their own compositor layer
[layerBg, layerGrid, layerOrbs, layerFg].forEach(el => {
  if (el) el.style.willChange = 'transform';
});

let ticking = false;
let lastScrollY = 0;

/**
 * applyParallax — Scroll Parallax Renderer
 * WHAT: Applies GPU-accelerated translate3d transforms to layered background elements
 *       at different speeds to create a parallax depth effect on scroll.
 * HOW: Reads lastScrollY, applies different multipliers per layer, resets ticking flag.
 * CALLED BY: requestAnimationFrame inside the passive scroll event listener.
 */
function applyParallax() {
  if (!layerBg) return;
  const y = lastScrollY;
  layerBg.style.transform   = `translate3d(0, ${y * 0.15}px, 0)`;
  layerGrid.style.transform = `translate3d(0, ${y * 0.08}px, 0)`;
  layerOrbs.style.transform = `translate3d(0, ${y * 0.12}px, 0)`;
  if (layerFg) layerFg.style.transform = `translate3d(0, ${y * 0.05}px, 0)`;
  ticking = false;
}

window.addEventListener('scroll', () => {
  lastScrollY = window.scrollY;
  if (!ticking) {
    requestAnimationFrame(applyParallax);
    ticking = true;
  }
}, { passive: true });

// ─── Mouse Parallax (Hero only) ──────────
const hero = document.getElementById('hero');
let mouseTicking = false;
let mouseX = 0, mouseY = 0;

/**
 * applyMouseParallax — Mouse-Move Parallax for Hero Section
 * WHAT: Shifts layerOrbs and layerGrid based on mouse position within the hero section.
 * HOW: Uses normalized mouseX/mouseY (−0.5 to 0.5) with different multipliers per layer.
 *      Resets mouseTicking so the rAF gate allows the next frame.
 * CALLED BY: requestAnimationFrame inside hero mousemove event listener.
 */
function applyMouseParallax() {
  if (layerOrbs) layerOrbs.style.transform = `translate3d(${mouseX * 20}px, ${mouseY * 20}px, 0)`;
  if (layerGrid) layerGrid.style.transform = `translate3d(${mouseX * 8}px, ${mouseY * 8}px, 0)`;
  mouseTicking = false;
}

if (hero) {
  hero.addEventListener('mousemove', (e) => {
    const rect = hero.getBoundingClientRect();
    mouseX = (e.clientX - rect.left) / rect.width  - 0.5;
    mouseY = (e.clientY - rect.top)  / rect.height - 0.5;
    if (!mouseTicking) {
      requestAnimationFrame(applyMouseParallax);
      mouseTicking = true;
    }
  }, { passive: true });
  hero.addEventListener('mouseleave', () => {
    if (layerOrbs) layerOrbs.style.transform = '';
    if (layerGrid) layerGrid.style.transform = '';
  });
}

// ─── Active Nav Link on Scroll ─────────────
const sections    = document.querySelectorAll('section[id]');
const allNavLinks = document.querySelectorAll('.nav-link');

const sectionObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const id = entry.target.getAttribute('id');
      // Only update if this section's top is within the top half of the viewport
      const rect = entry.target.getBoundingClientRect();
      if (rect.top <= window.innerHeight * 0.5) {
        allNavLinks.forEach(link => {
          link.style.color = link.getAttribute('href') === `#${id}` ? 'var(--orange)' : '';
        });
      }
    }
  });
}, { threshold: 0.15, rootMargin: '0px 0px -50% 0px' });
sections.forEach(s => sectionObserver.observe(s));

// Fallback: on scroll, highlight the section whose top is closest to (but above) 30% viewport height
window.addEventListener('scroll', () => {
  const trigger = window.innerHeight * 0.3;
  let closest = null;
  let closestDist = Infinity;
  sections.forEach(s => {
    const top = s.getBoundingClientRect().top;
    if (top <= trigger) {
      const dist = trigger - top;
      if (dist < closestDist) { closestDist = dist; closest = s; }
    }
  });
  if (closest) {
    const id = closest.getAttribute('id');
    allNavLinks.forEach(link => {
      link.style.color = link.getAttribute('href') === `#${id}` ? 'var(--orange)' : '';
    });
  }
}, { passive: true });

// ─── Profile Image Fallback ─────────────
const profileImg         = document.querySelector('.profile-img');
const profilePlaceholder = document.querySelector('.profile-placeholder');
if (profileImg) {
  profileImg.addEventListener('error', () => {
    profileImg.style.display = 'none';
    if (profilePlaceholder) profilePlaceholder.style.display = 'flex';
  });
  if (!profileImg.complete || profileImg.naturalWidth === 0) {
    profileImg.style.display = 'none';
    if (profilePlaceholder) profilePlaceholder.style.display = 'flex';
  }
}

// ─── Project Filter Tabs + Client Work Stacked Card Deck Carousel ───────────
// Client filter: center = active card (full).
// Previous card peeks from TOP-LEFT corner (behind, dimmed, clipped).
// Next card peeks from BOTTOM-RIGHT corner (in front, dimmed, clipped).
// Left arrow disabled when no prev; right arrow disabled when no next.

const projectsGrid   = document.getElementById('projectsGrid');
const clientSlider   = document.getElementById('clientSlider');
const sliderViewport = document.getElementById('sliderViewport');
const sliderTrack    = document.getElementById('sliderTrack');
const sliderDots     = document.getElementById('sliderDots');
const sliderPrev     = document.getElementById('sliderPrev');
const sliderNext     = document.getElementById('sliderNext');
const filterBtns     = document.querySelectorAll('.filter-btn');

const allCards  = Array.from(document.querySelectorAll('.project-card[data-category]'));

let sliderIndex = 0;
let sliderCards = [];

const PEEK_SCALE  = 0.62;
const PEEK_OFFSET = 30;

// ── matchMedia gate — slider mounts on mobile/tablet only ──
const mobileTabletMQ = window.matchMedia('(max-width: 1024px)');
let   isAnimating    = false;

// ── Layout all cards — only prev/active/next are shown, everything else display:none ──
// Mobile/tablet (≤1024px): only active card visible, centered. Prev/next hidden.
// Desktop: slot -1 → prev top-left, slot 0 → active center, slot +1 → next bottom-right.
/**
 * positionDeckCards — Stacked-Deck Card Layout Engine
 * WHAT: Positions each project card as prev / active / next in a stacked-deck layout.
 * HOW: On mobile/tablet (≤1024px): only the active card is shown (display:flex), all others hidden.
 *      On desktop: computes absolute positions and CSS custom properties (--cTop, --cLeft, --cScale,
 *      --cOpacity, --cZ) for the three visible slots; cards beyond ±1 are hidden.
 * CALLED BY: schedulePosition(), goToSlide(), window resize listener.
 */
function positionDeckCards() {

  if (mobileTabletMQ.matches) {
    // Mobile/tablet: only active card shown, all others hidden
    sliderCards.forEach((card, i) => {
      if (i === sliderIndex) {
        card.style.display = 'flex';
        card.style.removeProperty('--cTop');
        card.style.removeProperty('--cLeft');
        card.style.removeProperty('--cScale');
        card.style.removeProperty('--cOpacity');
        card.style.removeProperty('--cZ');
        card.classList.add('sliderCard--active');
        card.classList.remove('sliderCard--prev', 'sliderCard--next');
      } else {
        card.style.display = 'none';
        card.style.removeProperty('--cTop');
        card.style.removeProperty('--cLeft');
        card.style.removeProperty('--cScale');
        card.style.removeProperty('--cOpacity');
        card.style.removeProperty('--cZ');
        card.classList.remove('sliderCard--active', 'sliderCard--prev', 'sliderCard--next');
      }
    });
    return;
  }

  // ── Desktop: stacked-deck layout (unchanged) ──
  const trackW     = sliderTrack.offsetWidth;
  const cardW      = Math.min(700, Math.max(200, trackW * 0.88));
  const activeLeft = Math.max(0, (trackW - cardW) / 2);

  const activeCard = sliderCards[sliderIndex];
  const activeH    = activeCard ? activeCard.scrollHeight : 500;
  const peekH      = 180 * PEEK_SCALE; // peek cards are clipped to 180px in CSS

  // Track height: small top overlap for prev + active card + small bottom overlap for next
  const topRoom  = 60; // prev card overlaps active from the top by this much
  const botRoom  = 40; // next card peeks out below active card by this much
  const totalH   = topRoom + activeH + botRoom;
  sliderTrack.style.setProperty('--stageH', `${totalH}px`);

  sliderCards.forEach((card, i) => {
    const slot = i - sliderIndex;

    // Strictly hide everything beyond prev/active/next
    if (Math.abs(slot) > 1) {
      card.style.setProperty('--cOpacity', '0');
      card.style.setProperty('--cScale',   '0.5');
      card.style.setProperty('--cZ',       '0');
      card.style.display = 'none';
      card.classList.remove('sliderCard--active', 'sliderCard--prev', 'sliderCard--next');
      return;
    }

    card.style.display = 'flex';

    if (slot === 0) {
      // Active — centered, sits below topRoom
      card.style.setProperty('--cTop',     `${topRoom}px`);
      card.style.setProperty('--cLeft',    `${activeLeft}px`);
      card.style.setProperty('--cScale',   '1');
      card.style.setProperty('--cOpacity', '1');
      card.style.setProperty('--cZ',       '5');
      card.classList.add('sliderCard--active');
      card.classList.remove('sliderCard--prev', 'sliderCard--next');

    } else if (slot === -1) {
      // Prev — top-left: mirrors next card's corner overlap, shifted left of active card
      const prevTop  = 0;
      const prevLeft = activeLeft - (cardW * PEEK_SCALE * .8);
      card.style.setProperty('--cTop',     `${prevTop}px`);
      card.style.setProperty('--cLeft',    `${prevLeft}px`);
      card.style.setProperty('--cScale',   `${PEEK_SCALE}`);
      card.style.setProperty('--cOpacity', '0.6');
      card.style.setProperty('--cZ',       '2');
      card.classList.add('sliderCard--prev');
      card.classList.remove('sliderCard--active', 'sliderCard--next');

    } else {
      // Next — bottom-right: overlaps active card's bottom-right corner, shifted right
      // Sits so its top is near active card's bottom, shifted right past active's right edge
      const nextTop  = topRoom + activeH - (peekH * 0.35);
      const nextLeft = activeLeft + cardW - (cardW * PEEK_SCALE * 0.8);
      card.style.setProperty('--cTop',     `${nextTop}px`);
      card.style.setProperty('--cLeft',    `${nextLeft}px`);
      card.style.setProperty('--cScale',   `${PEEK_SCALE}`);
      card.style.setProperty('--cOpacity', '0.6');
      card.style.setProperty('--cZ',       '3');
      card.classList.add('sliderCard--next');
      card.classList.remove('sliderCard--active', 'sliderCard--prev');
    }
  });
}

// ── Double-rAF ensures browser has painted before we read scrollHeight ──
/**
 * schedulePosition — Double-rAF Position Scheduler
 * WHAT: Schedules positionDeckCards() after two animation frames to ensure the browser
 *       has fully painted before we read scrollHeight values.
 * HOW: Wraps positionDeckCards in a nested requestAnimationFrame pair.
 * CALLED BY: mountClientSlider, mountPersonalSlider, mountAllSlider, window resize listener.
 */
function schedulePosition() {
  requestAnimationFrame(() => requestAnimationFrame(positionDeckCards));
}

// ── animateSlide ──
// Pure horizontal slide: outgoing exits center→left/right, incoming enters right/left→center.
// Both cards sit in a temp absolute layer inside sliderViewport (the clipping container).
// No shrink, no vertical movement — pure translateX.
/**
 * animateSlide — Horizontal Slide Transition
 * WHAT: Animates a horizontal slide between fromCard (exiting) and toCard (entering).
 * HOW: Temporarily positions both cards absolute inside sliderViewport; outgoing exits
 *      center → left/right, incoming enters right/left → center using CSS transform.
 *      Cleans up all inline styles on transitionend and resets isAnimating flag.
 * CALLED BY: goToSlide() on mobile/tablet when mobileTabletMQ.matches is true.
 */
function animateSlide(fromCard, toCard, dir) {
  isAnimating = true;

  const vp    = sliderViewport;
  const vpW   = vp.offsetWidth;
  const cardW = fromCard.offsetWidth;
  const cardH = fromCard.offsetHeight;

  // Freeze viewport height so page doesn't jump
  vp.style.height   = `${cardH}px`;
  vp.style.position = 'relative';
  vp.style.overflow = 'hidden';

  // Pull both cards out of flow into the viewport stage
  const centerX = (vpW - cardW) / 2;

  [fromCard, toCard].forEach(c => {
    c.style.position = 'absolute';
    c.style.top      = '0';
    c.style.width    = `${cardW}px`;
    c.style.margin   = '0';
    c.style.transition = 'none';
  });

  // Outgoing starts centered
  fromCard.style.left      = `${centerX}px`;
  fromCard.style.transform = 'translateX(0)';
  fromCard.style.display   = 'flex';

  // Incoming starts off-screen in direction of travel
  toCard.style.left      = `${centerX}px`;
  toCard.style.transform = `translateX(${dir * vpW}px)`;
  toCard.style.display   = 'flex';

  // Force reflow
  toCard.getBoundingClientRect();

  const ease = 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)';

  // Slide both cards simultaneously
  fromCard.style.transition = ease;
  fromCard.style.transform  = `translateX(${dir * -vpW}px)`;

  toCard.style.transition = ease;
  toCard.style.transform  = 'translateX(0)';

  toCard.addEventListener('transitionend', function cleanup() {
    toCard.removeEventListener('transitionend', cleanup);

    // Restore all inline styles
    [fromCard, toCard].forEach(c => {
      c.style.position   = '';
      c.style.top        = '';
      c.style.left       = '';
      c.style.width      = '';
      c.style.margin     = '';
      c.style.transition = '';
      c.style.transform  = '';
      c.style.display    = '';
    });

    // Hide outgoing, remove active class
    fromCard.style.display = 'none';
    fromCard.classList.remove('sliderCard--active');

    // Restore viewport
    vp.style.height   = '';
    vp.style.position = '';
    vp.style.overflow = '';

    isAnimating = false;
  }, { once: true });
}

// ── Navigate to a slide index ──
/**
 * goToSlide — Slide Navigator
 * WHAT: Navigates the project card slider to a specific index, updating dots and arrow buttons.
 * HOW: Clamps the index to valid range; on mobile triggers animateSlide(), on desktop calls
 *      positionDeckCards() directly. Updates dot indicators and disables prev/next at boundaries.
 * CALLED BY: sliderPrev/sliderNext click listeners, dot click listeners, filterBtns logic.
 */
function goToSlide(index) {
  const clamped = Math.max(0, Math.min(index, sliderCards.length - 1));
  if (clamped === sliderIndex) return;

  if (mobileTabletMQ.matches && !isAnimating) {
    const dir      = clamped > sliderIndex ? 1 : -1;
    const fromCard = sliderCards[sliderIndex];
    sliderIndex    = clamped;
    const toCard   = sliderCards[sliderIndex];
    toCard.classList.add('sliderCard--active');
    animateSlide(fromCard, toCard, dir);
  } else if (!mobileTabletMQ.matches) {
    sliderIndex = clamped;
    positionDeckCards();
    schedulePosition();
  }

  sliderDots.querySelectorAll('.sliderDot').forEach((dot, i) => {
    dot.classList.toggle('sliderDot--active', i === sliderIndex);
  });

  sliderPrev.disabled = sliderIndex === 0;
  sliderNext.disabled = sliderIndex === sliderCards.length - 1;
}

// ── Builds dot row ──
/**
 * buildSliderDots — Pagination Dot Builder
 * WHAT: Clears and rebuilds the dot indicator row for the slider.
 * HOW: Creates one <button class="sliderDot"> per slide; active dot gets sliderDot--active class.
 *      Each dot has a click listener that calls goToSlide(i).
 * CALLED BY: mountClientSlider, mountPersonalSlider, mountAllSlider.
 */
function buildSliderDots(total, activeIndex) {
  sliderDots.innerHTML = '';
  for (let i = 0; i < total; i++) {
    const dot = document.createElement('button');
    dot.className = 'sliderDot' + (i === activeIndex ? ' sliderDot--active' : '');
    dot.setAttribute('aria-label', `Go to slide ${i + 1}`);
    dot.addEventListener('click', () => goToSlide(i));
    sliderDots.appendChild(dot);
  }
}

// ── Mount client slider ──
/**
 * mountClientSlider — Client Projects Slider Mount
 * WHAT: Filters project cards to 'client' category, sorts ongoing cards first,
 *       mounts them into the sliderTrack, and activates the slider UI.
 * HOW: Clears sliderTrack, resets card styles, builds dots, disables/enables arrows,
 *      shows clientSlider, hides projectsGrid, then calls schedulePosition().
 * CALLED BY: filterBtns click listener when data-filter="client" is selected.
 */
function mountClientSlider() {
  sliderIndex = 0;
  isAnimating = false;
  sliderTrack.innerHTML = '';

  const clientAll = allCards.filter(c => c.getAttribute('data-category') === 'client');
  const ongoing   = clientAll.filter(c => c.querySelector('.ongoing-badge'));
  const rest      = clientAll.filter(c => !c.querySelector('.ongoing-badge'));
  sliderCards = [...ongoing, ...rest];

  sliderCards.forEach((card, i) => {
    card.classList.remove('hidden', 'fade-in', 'sliderCard--active', 'sliderCard--prev', 'sliderCard--next');
    card.style.display   = i === 0 ? 'flex' : 'none';
    card.style.transform = '';
    card.style.opacity   = '';
    if (i === 0) card.classList.add('sliderCard--active');
    sliderTrack.appendChild(card);
  });

  buildSliderDots(sliderCards.length, 0);

  sliderPrev.disabled = true;
  sliderNext.disabled = sliderCards.length <= 1;

  clientSlider.classList.add('clientSlider--active');
  projectsGrid.style.display = 'none';

  schedulePosition();
}

// ── Mount personal slider ──
/**
 * mountPersonalSlider — Personal Projects Slider Mount
 * WHAT: Filters project cards to 'personal' category and mounts them into the slider.
 * HOW: Same mounting sequence as mountClientSlider but uses data-category="personal" filter.
 * CALLED BY: filterBtns click listener when data-filter="personal" is selected.
 */
function mountPersonalSlider() {
  sliderIndex = 0;
  isAnimating = false;
  sliderTrack.innerHTML = '';

  const personalAll = allCards.filter(c => c.getAttribute('data-category') === 'personal');
  sliderCards = personalAll;

  sliderCards.forEach((card, i) => {
    card.classList.remove('hidden', 'fade-in', 'sliderCard--active', 'sliderCard--prev', 'sliderCard--next');
    card.style.display   = i === 0 ? 'flex' : 'none';
    card.style.transform = '';
    card.style.opacity   = '';
    if (i === 0) card.classList.add('sliderCard--active');
    sliderTrack.appendChild(card);
  });

  buildSliderDots(sliderCards.length, 0);

  sliderPrev.disabled = true;
  sliderNext.disabled = sliderCards.length <= 1;

  clientSlider.classList.add('clientSlider--active');
  projectsGrid.style.display = 'none';

  schedulePosition();
}

// ── Mount all-projects slider ──
/**
 * mountAllSlider — All Projects Slider Mount
 * WHAT: Mounts all project cards into the slider (ongoing first, then the rest).
 * HOW: Same mounting sequence as mountClientSlider but uses the full allCards array.
 * CALLED BY: filterBtns click listener when data-filter="all" is selected.
 */
function mountAllSlider() {
  sliderIndex = 0;
  isAnimating = false;
  sliderTrack.innerHTML = '';

  const ongoing = allCards.filter(c => c.querySelector('.ongoing-badge'));
  const rest    = allCards.filter(c => !c.querySelector('.ongoing-badge'));
  sliderCards   = [...ongoing, ...rest];

  sliderCards.forEach((card, i) => {
    card.classList.remove('hidden', 'fade-in', 'sliderCard--active', 'sliderCard--prev', 'sliderCard--next');
    card.style.display   = i === 0 ? 'flex' : 'none';
    card.style.transform = '';
    card.style.opacity   = '';
    if (i === 0) card.classList.add('sliderCard--active');
    sliderTrack.appendChild(card);
  });

  buildSliderDots(sliderCards.length, 0);

  sliderPrev.disabled = true;
  sliderNext.disabled = sliderCards.length <= 1;

  clientSlider.classList.add('clientSlider--active');
  projectsGrid.style.display = 'none';

  schedulePosition();
}

// ── Dismount slider, return cards to grid ──
/**
 * dismountClientSlider — Slider Dismount / Grid Restore
 * WHAT: Removes all slider cards from the sliderTrack and returns them to the projectsGrid.
 * HOW: Strips slider CSS classes and custom properties from each card, re-adds hidden class,
 *      moves them back to projectsGrid, clears sliderCards[], deactivates clientSlider.
 * CALLED BY: filterBtns click listener before mounting a new slider or grid filter.
 */
function dismountClientSlider() {
  sliderCards.forEach(card => {
    card.classList.remove('sliderCard--active', 'sliderCard--prev', 'sliderCard--next');
    ['--cTop','--cLeft','--cScale','--cOpacity','--cZ'].forEach(p => card.style.removeProperty(p));
    card.style.display = '';
    card.classList.add('hidden');
    projectsGrid.appendChild(card);
  });
  sliderCards = [];
  clientSlider.classList.remove('clientSlider--active');
  projectsGrid.style.display = '';
}

// ── Grid filter for All / Personal ──
/**
 * filterProjectsGrid — Grid Filter by Category
 * WHAT: Shows/hides project cards in the grid based on a category filter string.
 * HOW: Toggles hidden/fade-in classes per card; re-sorts visible cards with ongoing first.
 * CALLED BY: filterBtns click listener for non-slider filter values.
 */
function filterProjectsGrid(filter) {
  allCards.forEach(card => {
    if (card.parentNode !== projectsGrid) return;
    const show = filter === 'all' || card.getAttribute('data-category') === filter;
    if (show) {
      card.classList.remove('hidden');
      card.classList.add('fade-in');
      setTimeout(() => card.classList.remove('fade-in'), 500);
    } else {
      card.classList.add('hidden');
    }
  });
  const visible = Array.from(projectsGrid.querySelectorAll('.project-card[data-category]:not(.hidden)'));
  const ongoing = visible.filter(c => c.querySelector('.ongoing-badge'));
  const rest    = visible.filter(c => !c.querySelector('.ongoing-badge'));
  [...ongoing, ...rest].forEach(card => projectsGrid.appendChild(card));
}

sliderPrev.addEventListener('click', () => goToSlide(sliderIndex - 1));
sliderNext.addEventListener('click', () => goToSlide(sliderIndex + 1));

// Re-center on window resize
window.addEventListener('resize', () => {
  if (sliderCards.length > 0) schedulePosition();
}, { passive: true });

filterBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    filterBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const filter = btn.getAttribute('data-filter');
    if (filter === 'client') {
      dismountClientSlider();
      mountClientSlider();
    } else if (filter === 'personal') {
      dismountClientSlider();
      mountPersonalSlider();
    } else if (filter === 'all') {
      dismountClientSlider();
      mountAllSlider();
    } else {
      dismountClientSlider();
      filterProjectsGrid(filter);
    }
  });
});

mountClientSlider();


// ─── Tool Tags Stagger Animation ──────────
const toolTags = document.querySelectorAll('.tool-tag');
// Set stagger delays via CSS custom property once (no repeated style writes)
toolTags.forEach((tag, i) => {
  tag.style.setProperty('--tag-delay', `${i * 30}ms`);
});

const toolsSection = document.querySelector('.tools-section');
if (toolsSection) {
  const toolsObserver = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting) {
      toolsSection.classList.add('tools-visible');
      toolsObserver.disconnect();
    }
  }, { threshold: 0.1 });
  toolsObserver.observe(toolsSection);
}

// ─── Certificate Image Previews ───────────
// Bug fix: removed PDF.js canvas code — certs now use static JPG previews
// No JS needed for cert previews (pure HTML img tags)

/**
 * Resume Tabs — IIFE
 * WHAT: Manages two resume tab views (Standard ATS / Visual CV) with paginated image previews.
 * HOW: tabConfig maps tab keys to image prefix, extension, and page totals.
 *      goToPage() updates the <img> src with fade-in transition and updates nav controls.
 *      Tab buttons switch currentTab, reset to page 1, and activate/deactivate tab content.
 *      Arrow keys work when the resume section is visible in the viewport.
 * CALLED BY: Self-invoking on page load; also responds to tab/prev/next button clicks and keydown.
 */
(function() {
  const tabBtns     = document.querySelectorAll('.resume-tab-btn');
  const tabContents = document.querySelectorAll('.resume-tab-content');
  const img         = document.getElementById('resumePageImg');
  const prevBtn     = document.getElementById('prevPage');
  const nextBtn     = document.getElementById('nextPage');
  const pageNum     = document.getElementById('pageNum');

  const tabConfig = {
    standard: { prefix: 'resume_previews/ats-page-',    ext: '.jpg', total: 3 },
    visual:   { prefix: 'resume_previews/ENHANCE CURRICULUM VITAE_', ext: '.jpg', total: 6 }
  };

  let currentTab = 'standard';
  let curr = 1;

  const pageCount = document.getElementById('pageCount');

  /**
   * goToPage — Resume Page Navigator
   * WHAT: Loads the correct resume image for the current tab and page number.
   * HOW: Clamps n to [1, cfg.total], builds the padded filename, fades image out then in on load,
   *      updates pageNum/pageCount labels, and disables prev/next at boundaries.
   * CALLED BY: Tab button click listener, prevBtn/nextBtn click listeners, keydown handler.
   */
  function goToPage(n) {
    const cfg = tabConfig[currentTab];
    curr = Math.max(1, Math.min(n, cfg.total));
    const pad = String(curr).padStart(2, '0');
    img.style.opacity = '0';
    img.src = `${cfg.prefix}${pad}${cfg.ext}`;
    img.alt = `Resume Page ${curr}`;
    img.onload = () => { img.style.opacity = '1'; };
    if (pageNum)   pageNum.textContent  = curr;
    if (pageCount) pageCount.textContent = String(cfg.total).padStart(2, '0');
    if (prevBtn) prevBtn.disabled = (curr <= 1);
    if (nextBtn) nextBtn.disabled = (curr >= cfg.total);
  }

  if (img) img.style.transition = 'opacity 0.3s ease';

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      currentTab = btn.getAttribute('data-tab');
      curr = 1;

      tabBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      tabContents.forEach(c => c.classList.remove('active'));
      document.getElementById(`tab-${currentTab}`).classList.add('active');

      goToPage(1);
    });
  });

  if (prevBtn) prevBtn.addEventListener('click', () => goToPage(curr - 1));
  if (nextBtn) nextBtn.addEventListener('click', () => goToPage(curr + 1));

  document.addEventListener('keydown', e => {
    const section = document.getElementById('resume');
    if (!section) return;
    const rect = section.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') goToPage(curr + 1);
      if (e.key === 'ArrowLeft'  || e.key === 'ArrowUp')   goToPage(curr - 1);
    }
  });

  // Init default tab
  goToPage(1);
})();

// ─── Games Stacked Card Deck Carousel ───────────────────────────────────
// Identical layout engine to the client work slider.
// Center card is horizontally centered in the track.
// Prev peeks top-left, next peeks bottom-right.
// Left/right arrows sit on the sides, vertically centered.
// Mobile/tablet (≤1024px): only active card shown, no peeks.
(function () {
  const gSlider  = document.getElementById('gamesSlider');
  const gTrack   = document.getElementById('gSliderTrack');
  const gDots    = document.getElementById('gSliderDots');
  const gPrev    = document.getElementById('gSliderPrev');
  const gNext    = document.getElementById('gSliderNext');
  const gGrid    = document.getElementById('gamesGrid');

  if (!gSlider || !gTrack || !gGrid) return;

  const gameCards = Array.from(gGrid.querySelectorAll('.project-card[data-game]'));
  if (!gameCards.length) return;

  let gIndex = 0;
  const PEEK_SCALE = 0.72;
  const gameMQ     = window.matchMedia('(max-width: 1024px)');

  // ── Position all cards using exact same math as positionDeckCards ──
  function positionGameCards() {
    if (gameMQ.matches) {
      // Mobile/tablet: only active card visible, all others hidden
      gameCards.forEach((card, i) => {
        if (i === gIndex) {
          card.style.display = 'flex';
          ['--cTop','--cLeft','--cScale','--cOpacity','--cZ'].forEach(p => card.style.removeProperty(p));
          card.classList.add('gCard--active');
          card.classList.remove('gCard--prev', 'gCard--next');
        } else {
          card.style.display = 'none';
          card.classList.remove('gCard--active', 'gCard--prev', 'gCard--next');
        }
      });
      return;
    }

    // Desktop: stacked-deck layout matching client work slider
    const trackW     = gTrack.offsetWidth;
    const cardW      = Math.min(700, Math.max(200, trackW * 0.88));
    const activeLeft = Math.max(0, (trackW - cardW) / 2);

    const activeCard = gameCards[gIndex];
    const activeH    = activeCard ? activeCard.scrollHeight : 500;
    const peekH      = 180 * PEEK_SCALE;

    const topRoom = 60;
    const botRoom = 40;
    const totalH  = topRoom + activeH + botRoom;
    gTrack.style.setProperty('--gStageH', `${totalH}px`);

    gameCards.forEach((card, i) => {
      const slot = i - gIndex;

      if (Math.abs(slot) > 1) {
        card.style.setProperty('--cOpacity', '0');
        card.style.setProperty('--cScale',   '0.5');
        card.style.setProperty('--cZ',       '0');
        card.style.display = 'none';
        card.classList.remove('gCard--active', 'gCard--prev', 'gCard--next');
        return;
      }

      card.style.display = 'flex';

      if (slot === 0) {
        // Active — centered
        card.style.setProperty('--cTop',     `${topRoom}px`);
        card.style.setProperty('--cLeft',    `${activeLeft}px`);
        card.style.setProperty('--cScale',   '1');
        card.style.setProperty('--cOpacity', '1');
        card.style.setProperty('--cZ',       '5');
        card.classList.add('gCard--active');
        card.classList.remove('gCard--prev', 'gCard--next');

      } else if (slot === -1) {
        // Prev — top-left peek
        const prevLeft = activeLeft - (cardW * PEEK_SCALE * 0.8);
        card.style.setProperty('--cTop',     '0px');
        card.style.setProperty('--cLeft',    `${prevLeft}px`);
        card.style.setProperty('--cScale',   `${PEEK_SCALE}`);
        card.style.setProperty('--cOpacity', '0.6');
        card.style.setProperty('--cZ',       '2');
        card.classList.add('gCard--prev');
        card.classList.remove('gCard--active', 'gCard--next');

      } else {
        // Next — bottom-right peek
        const nextTop  = topRoom + activeH - (peekH * 0.35);
        const nextLeft = activeLeft + cardW - (cardW * PEEK_SCALE * 0.8);
        card.style.setProperty('--cTop',     `${nextTop}px`);
        card.style.setProperty('--cLeft',    `${nextLeft}px`);
        card.style.setProperty('--cScale',   `${PEEK_SCALE}`);
        card.style.setProperty('--cOpacity', '0.6');
        card.style.setProperty('--cZ',       '3');
        card.classList.add('gCard--next');
        card.classList.remove('gCard--active', 'gCard--prev');
      }
    });
  }

  // ── Double-rAF: ensures browser has painted before reading scrollHeight ──
  function schedulePosition() {
    requestAnimationFrame(() => requestAnimationFrame(positionGameCards));
  }

  // ── Build dot indicators ──
  function buildGDots() {
    gDots.innerHTML = '';
    gameCards.forEach((_, i) => {
      const dot = document.createElement('button');
      dot.className = 'gSliderDot' + (i === gIndex ? ' gSliderDot--active' : '');
      dot.setAttribute('aria-label', `Go to game ${i + 1}`);
      dot.addEventListener('click', () => goToGame(i));
      gDots.appendChild(dot);
    });
  }

  // ── Navigate to game index ──
  function goToGame(index) {
    gIndex = Math.max(0, Math.min(index, gameCards.length - 1));
    schedulePosition();
    gDots.querySelectorAll('.gSliderDot').forEach((dot, i) => {
      dot.classList.toggle('gSliderDot--active', i === gIndex);
    });
    gPrev.disabled = gIndex === 0;
    gNext.disabled = gIndex === gameCards.length - 1;
  }

  // ── Mount: move cards from hidden gamesGrid into gSliderTrack ──
  gameCards.forEach(card => {
    card.classList.remove('hidden');
    gTrack.appendChild(card);
  });

  buildGDots();

  gPrev.disabled = true;
  gNext.disabled = gameCards.length <= 1;

  gPrev.addEventListener('click', () => goToGame(gIndex - 1));
  gNext.addEventListener('click', () => goToGame(gIndex + 1));

  // Reposition on resize
  window.addEventListener('resize', schedulePosition);

  // Initial position
  schedulePosition();
}());