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

// ─── Scroll Reveal: Fade-In + Fade-Out ────
const revealEls = document.querySelectorAll('.reveal');

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    const el = entry.target;
    if (entry.isIntersecting) {
      el.classList.remove('fade-out-up', 'fade-out-down');
      el.classList.add('visible');
    } else if (el.classList.contains('visible')) {
      const rect = entry.boundingClientRect;
      el.classList.remove('visible');
      el.classList.add(rect.top < 0 ? 'fade-out-up' : 'fade-out-down');
    }
  });
}, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

revealEls.forEach(el => revealObserver.observe(el));

// ─── Staggered Children Animation ──────────
document.querySelectorAll('.cert-flip-grid, .about-cards, .projects-grid, .contact-links, .about-stats').forEach(container => {
  // Bug fix: updated selector from cert-grid → cert-flip-grid
  const children = container.querySelectorAll('.cert-flip-wrap, .info-card, .project-card, .contact-item, .stat-item');
  children.forEach((child, i) => {
    child.style.transitionDelay = `${i * 0.08}s`;
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

let ticking = false;
let lastScrollY = 0;

function applyParallax() {
  if (!layerBg) return;
  layerBg.style.transform   = `translateY(${lastScrollY * 0.15}px)`;
  layerGrid.style.transform = `translateY(${lastScrollY * 0.08}px)`;
  layerOrbs.style.transform = `translateY(${lastScrollY * 0.12}px)`;
  if (layerFg) layerFg.style.transform = `translateY(${lastScrollY * 0.05}px)`;
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
if (hero) {
  hero.addEventListener('mousemove', (e) => {
    const rect = hero.getBoundingClientRect();
    const cx = (e.clientX - rect.left) / rect.width  - 0.5;
    const cy = (e.clientY - rect.top)  / rect.height - 0.5;
    if (layerOrbs) layerOrbs.style.transform = `translate(${cx * 20}px, ${cy * 20}px)`;
    if (layerGrid) layerGrid.style.transform = `translate(${cx * 8}px, ${cy * 8}px)`;
  });
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
      allNavLinks.forEach(link => {
        link.style.color = link.getAttribute('href') === `#${id}` ? 'var(--orange)' : '';
      });
    }
  });
}, { threshold: 0.4 });
sections.forEach(s => sectionObserver.observe(s));

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
sortProjectCards();

// ─── Tool Tags Stagger Animation ──────────
const toolTags = document.querySelectorAll('.tool-tag');
toolTags.forEach((tag, i) => {
  tag.style.transitionDelay = `${i * 0.03}s`;
  tag.style.opacity = '0';
  tag.style.transform = 'translateY(10px)';
});

const toolsSection = document.querySelector('.tools-section');
if (toolsSection) {
  const toolsObserver = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting) {
      toolTags.forEach((tag, i) => {
        setTimeout(() => {
          tag.style.opacity = '1';
          tag.style.transform = 'translateY(0)';
          tag.style.transition = 'opacity 0.4s ease, transform 0.4s ease, border-color 0.35s, color 0.35s, background 0.35s, box-shadow 0.35s';
        }, i * 40);
      });
      toolsObserver.disconnect();
    }
  }, { threshold: 0.2 });
  toolsObserver.observe(toolsSection);
}

// ─── Certificate Image Previews ───────────
// Bug fix: removed PDF.js canvas code — certs now use static JPG previews
// No JS needed for cert previews (pure HTML img tags)

// ─── Resume Image Viewer ──────────────────
(function() {
  const img     = document.getElementById('resumePageImg');
  const prevBtn = document.getElementById('prevPage');
  const nextBtn = document.getElementById('nextPage');
  const pageNum = document.getElementById('pageNum');
  const TOTAL   = 11;
  let   curr    = 1;

  if (!img) return;

  function goToPage(n) {
    curr = Math.max(1, Math.min(n, TOTAL));
    const pad = String(curr).padStart(2, '0');
    img.style.opacity = '0';
    img.src = `resume_previews/page-${pad}.jpg`;
    img.alt = `Resume Page ${curr}`;
    img.onload = () => { img.style.opacity = '1'; };
    if (pageNum) pageNum.textContent = curr;
    if (prevBtn) prevBtn.disabled = (curr <= 1);
    if (nextBtn) nextBtn.disabled = (curr >= TOTAL);
  }

  img.style.transition = 'opacity 0.3s ease';

  if (prevBtn) prevBtn.addEventListener('click', () => goToPage(curr - 1));
  if (nextBtn) nextBtn.addEventListener('click', () => goToPage(curr + 1));

  // Keyboard navigation when resume section is visible
  document.addEventListener('keydown', e => {
    const section = document.getElementById('resume');
    if (!section) return;
    const rect = section.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') goToPage(curr + 1);
      if (e.key === 'ArrowLeft'  || e.key === 'ArrowUp')   goToPage(curr - 1);
    }
  });
})();