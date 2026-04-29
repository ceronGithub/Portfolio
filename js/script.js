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
  'VA Support',
  'AI Workflow Dev',
  'AI Automation',
  'Laravel Developer',
  'PHP Developer',  
  'Web Developer',
  'Desktop Developer'
];

let roleIndex  = 0;
let charIndex  = 0;
let isDeleting = false;
const typedEl  = document.getElementById('typedText');

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

// ─── Scroll Reveal: Fade-In Only ────────
// Fix: removed fade-out logic — it caused sections to disappear on mobile
// when IntersectionObserver triggered on small screens mid-scroll.
const revealEls = document.querySelectorAll('.reveal');

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.remove('fade-out-up', 'fade-out-down');
      entry.target.classList.add('visible');
      revealObserver.unobserve(entry.target); // once visible, stays visible
    }
  });
}, { threshold: 0.08, rootMargin: '0px 0px -20px 0px' });

revealEls.forEach(el => revealObserver.observe(el));

// ─── Staggered Children Animation ──────────
document.querySelectorAll('.cert-flip-grid, .about-cards, .projects-grid, .contact-links, .about-stats').forEach(container => {
  const children = container.querySelectorAll('.cert-flip-wrap, .info-card, .project-card, .contact-item, .stat-item');
  // Use CSS custom property to avoid repeated style recalculations
  children.forEach((child, i) => {
    child.style.setProperty('--stagger-delay', `${i * 0.08}s`);
  });
});

// ─── Skill Bar Animation ──────────────────
const skillFills = document.querySelectorAll('.skill-fill');

const skillObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const fill = entry.target;
      const targetWidth = fill.getAttribute('data-width');
      setTimeout(() => { fill.style.width = targetWidth + '%'; }, 300);
      skillObserver.unobserve(fill);
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

// ─── Project Filter Tabs + Sort ───────────
// Bug fix: added null guard on filterProjects for projectsGrid
const projectsGrid = document.getElementById('projectsGrid');
const filterBtns   = document.querySelectorAll('.filter-btn');

function sortProjectCards() {
  if (!projectsGrid) return;
  const cards   = Array.from(projectsGrid.querySelectorAll('.project-card[data-category]:not(.hidden)'));
  const ongoing = cards.filter(c => c.querySelector('.ongoing-badge'));
  const rest    = cards.filter(c => !c.querySelector('.ongoing-badge'));
  [...ongoing, ...rest].forEach(card => projectsGrid.appendChild(card));
}

function filterProjects(filter) {
  if (!projectsGrid) return;  // Bug fix: null guard
  projectsGrid.querySelectorAll('.project-card[data-category]').forEach(card => {
    const show = filter === 'all' || card.getAttribute('data-category') === filter;
    if (show) {
      card.classList.remove('hidden');
      card.classList.add('fade-in');
      setTimeout(() => card.classList.remove('fade-in'), 500);
    } else {
      card.classList.add('hidden');
    }
  });
  sortProjectCards();
}

filterBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    filterBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    filterProjects(btn.getAttribute('data-filter'));
  });
});
// Default: show client work on load
filterProjects('client');
sortProjectCards();

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

// ─── Resume Tabs ──────────────────────────
(function() {
  const tabBtns     = document.querySelectorAll('.resume-tab-btn');
  const tabContents = document.querySelectorAll('.resume-tab-content');
  const img         = document.getElementById('resumePageImg');
  const prevBtn     = document.getElementById('prevPage');
  const nextBtn     = document.getElementById('nextPage');
  const pageNum     = document.getElementById('pageNum');

  const tabConfig = {
    standard: { prefix: 'resume_previews/ats-page-',    ext: '.jpg', total: 3 },
    visual:   { prefix: 'resume_previews/ENHANCE CURRICULUM VITAE_', ext: '.jpg', total: 7 }
  };

  let currentTab = 'standard';
  let curr = 1;

  const pageCount = document.getElementById('pageCount');

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