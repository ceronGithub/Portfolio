/* =============================================
   PORTFOLIO JS — Ceron Matthew Calsena
============================================= */

// ─── Navbar Scroll Effect ─────────────────
const navbar = document.getElementById('navbar');

window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 50);
});

// ─── Hamburger Menu ───────────────────────
const hamburger = document.getElementById('hamburger');
const navLinks = document.getElementById('navLinks');

hamburger.addEventListener('click', () => {
  hamburger.classList.toggle('open');
  navLinks.classList.toggle('open');
});

// Close nav on link click
navLinks.querySelectorAll('.nav-link').forEach(link => {
  link.addEventListener('click', () => {
    hamburger.classList.remove('open');
    navLinks.classList.remove('open');
  });
});

// ─── Typing Animation ─────────────────────
const roles = [
  'PHP Developer',
  'VA Specialist',
  'AI Workflow Dev',
  'Laravel Engineer',
  'Automation Expert',
  'Web Developer'
];

let roleIndex = 0;
let charIndex = 0;
let isDeleting = false;
const typedEl = document.getElementById('typedText');

function type() {
  const current = roles[roleIndex];
  if (isDeleting) {
    typedEl.textContent = current.substring(0, charIndex - 1);
    charIndex--;
  } else {
    typedEl.textContent = current.substring(0, charIndex + 1);
    charIndex++;
  }

  let delay = isDeleting ? 60 : 110;

  if (!isDeleting && charIndex === current.length) {
    delay = 1800;
    isDeleting = true;
  } else if (isDeleting && charIndex === 0) {
    isDeleting = false;
    roleIndex = (roleIndex + 1) % roles.length;
    delay = 400;
  }

  setTimeout(type, delay);
}

setTimeout(type, 1200);

// ─── Scroll Reveal ────────────────────────
const revealEls = document.querySelectorAll('.reveal');

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
    }
  });
}, {
  threshold: 0.12,
  rootMargin: '0px 0px -50px 0px'
});

revealEls.forEach(el => revealObserver.observe(el));

// ─── Skill Bar Animation ──────────────────
const skillFills = document.querySelectorAll('.skill-fill');

const skillObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const fill = entry.target;
      const targetWidth = fill.getAttribute('data-width');
      // Slight delay so reveal animation completes first
      setTimeout(() => {
        fill.style.width = targetWidth + '%';
      }, 300);
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

function applyParallax() {
  const scrollY = window.scrollY;
  if (!layerBg) return;

  layerBg.style.transform   = `translateY(${scrollY * 0.15}px)`;
  layerGrid.style.transform = `translateY(${scrollY * 0.08}px)`;
  layerOrbs.style.transform = `translateY(${scrollY * 0.12}px)`;
  if (layerFg) layerFg.style.transform = `translateY(${scrollY * 0.05}px)`;
}

window.addEventListener('scroll', applyParallax, { passive: true });

// ─── Mouse Move Parallax (Hero only) ──────
const hero = document.getElementById('hero');

hero.addEventListener('mousemove', (e) => {
  const rect = hero.getBoundingClientRect();
  const cx = (e.clientX - rect.left) / rect.width  - 0.5;
  const cy = (e.clientY - rect.top)  / rect.height - 0.5;

  if (layerOrbs) {
    layerOrbs.style.transform = `translate(${cx * 20}px, ${cy * 20}px)`;
  }
  if (layerGrid) {
    layerGrid.style.transform = `translate(${cx * 8}px, ${cy * 8}px)`;
  }
});

hero.addEventListener('mouseleave', () => {
  if (layerOrbs) layerOrbs.style.transform = '';
  if (layerGrid) layerGrid.style.transform = '';
});

// ─── Active Nav Link on Scroll ─────────────
const sections = document.querySelectorAll('section[id]');
const allNavLinks = document.querySelectorAll('.nav-link');

const sectionObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const id = entry.target.getAttribute('id');
      allNavLinks.forEach(link => {
        link.style.color = link.getAttribute('href') === `#${id}`
          ? 'var(--orange)'
          : '';
      });
    }
  });
}, { threshold: 0.4 });

sections.forEach(section => sectionObserver.observe(section));

// ─── Smooth profile image fallback ─────────
const profileImg = document.querySelector('.profile-img');
const profilePlaceholder = document.querySelector('.profile-placeholder');

if (profileImg) {
  profileImg.addEventListener('error', () => {
    profileImg.style.display = 'none';
    if (profilePlaceholder) profilePlaceholder.style.display = 'flex';
  });

  // Check if already broken (cached error)
  if (!profileImg.complete || profileImg.naturalWidth === 0) {
    profileImg.style.display = 'none';
    if (profilePlaceholder) profilePlaceholder.style.display = 'flex';
  }
}

// ─── Tool tags stagger animation ──────────
const toolTags = document.querySelectorAll('.tool-tag');
toolTags.forEach((tag, i) => {
  tag.style.transitionDelay = `${i * 0.03}s`;
  tag.style.opacity = '0';
  tag.style.transform = 'translateY(10px)';
});

const toolsObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      toolTags.forEach((tag, i) => {
        setTimeout(() => {
          tag.style.opacity = '1';
          tag.style.transform = 'translateY(0)';
          tag.style.transition = 'opacity 0.4s ease, transform 0.4s ease, border-color 0.35s, color 0.35s, background 0.35s, box-shadow 0.35s';
        }, i * 40);
      });
      toolsObserver.disconnect();
    }
  });
}, { threshold: 0.2 });

const toolsSection = document.querySelector('.tools-section');
if (toolsSection) toolsObserver.observe(toolsSection);