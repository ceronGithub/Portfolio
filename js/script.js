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

// ─── Scroll Reveal: Fade-In + Fade-Out ────────────
const revealEls = document.querySelectorAll('.reveal');
let lastScrollY = window.scrollY;
let ticking = false;

// Update scroll direction on every scroll
window.addEventListener('scroll', () => {
  lastScrollY = window.scrollY;
}, { passive: true });

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    const el = entry.target;

    if (entry.isIntersecting) {
      // Element entering viewport — fade IN
      el.classList.remove('fade-out-up', 'fade-out-down');
      el.classList.add('visible');
    } else {
      // Element leaving viewport — fade OUT with direction
      if (el.classList.contains('visible')) {
        const rect = entry.boundingClientRect;
        // If element is above viewport (scrolled past), fade up
        // If element is below viewport (haven't reached), fade down
        if (rect.top < 0) {
          el.classList.remove('visible');
          el.classList.add('fade-out-up');
        } else {
          el.classList.remove('visible');
          el.classList.add('fade-out-down');
        }
      }
    }
  });
}, {
  threshold: 0.12,
  rootMargin: '0px 0px -40px 0px'
});

revealEls.forEach(el => revealObserver.observe(el));

// ─── Staggered children animation ──────────
document.querySelectorAll('.cert-grid, .about-cards, .projects-grid, .contact-links, .about-stats').forEach(container => {
  const children = container.querySelectorAll('.cert-card, .info-card, .project-card, .contact-item, .stat-item');
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

// ─── Auto-sort: Ongoing cards always on top ──
function sortProjects() {
  const grid = document.getElementById('projectsGrid');
  if (!grid) return;
  const cards = Array.from(grid.querySelectorAll('.project-card'));

  cards.sort((a, b) => {
    const aOngoing = a.querySelector('.ongoing-badge') ? 1 : 0;
    const bOngoing = b.querySelector('.ongoing-badge') ? 1 : 0;
    return bOngoing - aOngoing; // ongoing first
  });

  // Re-append in sorted order
  cards.forEach(card => grid.appendChild(card));
}

sortProjects();

// ─── Project Filter Tabs ──────────────────
const filterBtns = document.querySelectorAll('.filter-btn');
const projectCards = document.querySelectorAll('.project-card[data-category]');
const projectsGrid = document.getElementById('projectsGrid');

// Sort: ongoing first, then by DOM order
function sortProjects() {
  const cards = Array.from(projectsGrid.querySelectorAll('.project-card[data-category]'));
  const ongoing = cards.filter(c => c.querySelector('.ongoing-badge'));
  const rest = cards.filter(c => !c.querySelector('.ongoing-badge'));
  [...ongoing, ...rest].forEach(card => projectsGrid.appendChild(card));
}

// Run sort on load
sortProjects();

filterBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    const filter = btn.getAttribute('data-filter');

    // Update active button
    filterBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    // Filter cards
    projectCards.forEach(card => {
      const category = card.getAttribute('data-category');
      const show = filter === 'all' || category === filter;

      if (show) {
        card.classList.remove('hidden');
        card.classList.add('fade-in');
        setTimeout(() => card.classList.remove('fade-in'), 500);
      } else {
        card.classList.add('hidden');
      }
    });

    // Re-sort after filter so ongoing always stays on top
    sortProjects();
  });
});
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

// ─── PDF.js Certificate Preview ───────────
if (typeof pdfjsLib !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc =
    'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
}

function renderPDFCanvas(wrap) {
  const canvas = wrap.querySelector('.pdf-canvas');
  if (!canvas || canvas.dataset.rendered) return;
  canvas.dataset.rendered = 'true';

  const pdfPath = canvas.getAttribute('data-pdf');
  const preview = wrap.querySelector('.cert-back-preview');
  if (preview) preview.innerHTML = '<div class="pdf-loading">⏳ Loading...</div>';

  pdfjsLib.getDocument(pdfPath).promise.then(pdf => {
    pdf.getPage(1).then(page => {
      if (preview) preview.innerHTML = '';
      const newCanvas = document.createElement('canvas');
      newCanvas.className = 'pdf-canvas rendered';
      if (preview) preview.appendChild(newCanvas);

      const scale = preview ? (preview.clientWidth / page.getViewport({ scale: 1 }).width) * 1.5 : 1.2;
      const viewport = page.getViewport({ scale: Math.max(scale, 0.8) });
      const ctx = newCanvas.getContext('2d');
      newCanvas.width  = viewport.width;
      newCanvas.height = viewport.height;

      page.render({ canvasContext: ctx, viewport }).promise.then(() => {
        newCanvas.style.opacity = '1';
      });
    });
  }).catch(() => {
    if (preview) preview.innerHTML = '<div class="pdf-error">📄 Preview unavailable<br><small>Click View Certificate below</small></div>';
  });
}

// Lazy render on first hover
document.querySelectorAll('.cert-flip-wrap').forEach(wrap => {
  let rendered = false;
  wrap.addEventListener('mouseenter', () => {
    if (!rendered && typeof pdfjsLib !== 'undefined') {
      rendered = true;
      setTimeout(() => renderPDFCanvas(wrap), 400);
    }
  });
});