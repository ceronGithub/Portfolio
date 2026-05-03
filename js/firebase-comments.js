/* =============================================
   FIREBASE COMMENTS — Ceron Matthew Calsena
   Firestore: portfolio-ae245
============================================= */

import { initializeApp }
  from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js';
import { getFirestore, collection, addDoc, getDocs, query, orderBy, serverTimestamp }
  from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

// ─── Firebase Config ──────────────────────
const firebaseConfig = {
  apiKey:            "AIzaSyDbBqV7m8WkDnTYtwLwj-P5zQNaTEMDI9g",
  authDomain:        "portfolio-ae245.firebaseapp.com",
  projectId:         "portfolio-ae245",
  storageBucket:     "portfolio-ae245.firebasestorage.app",
  messagingSenderId: "530260965137",
  appId:             "1:530260965137:web:0d27cc680436f3d11d3eb0"
};

const app = initializeApp(firebaseConfig);
const db  = getFirestore(app);
const COL = 'comments';

// ─── DOM Refs ─────────────────────────────
const carousel      = document.getElementById('commentsCarousel');
const emptyState    = document.getElementById('commentsEmpty');
const dotsWrap      = document.getElementById('carouselDots');
const prevBtn       = document.getElementById('carouselPrev');
const nextBtn       = document.getElementById('carouselNext');
const form          = document.getElementById('commentForm');
const submitBtn     = document.getElementById('commentSubmitBtn');
const submitText    = document.getElementById('submitBtnText');
const formSuccess   = document.getElementById('formSuccess');
const formErrGlobal = document.getElementById('formErrorGlobal');
const ratingSlider  = document.getElementById('cf-rating');
const ratingDisplay = document.getElementById('ratingDisplay');
const ratingBarFill = document.getElementById('ratingBarFill');
const charCountEl   = document.getElementById('charCount');
const textarea      = document.getElementById('cf-comment');

// ─── State ────────────────────────────────
let allComments   = [];
let currentSlide  = 0;
let autoplayTimer = null;

// ─── Rating Slider ────────────────────────
if (ratingSlider) {
  const updateRating = () => {
    const val   = parseInt(ratingSlider.value);
    const color = val >= 80 ? '#00c882' : val >= 50 ? '#ff6a00' : '#ff4444';
    if (ratingDisplay) { ratingDisplay.textContent = val + '%'; ratingDisplay.style.color = color; }
    if (ratingBarFill) { ratingBarFill.style.width = val + '%'; ratingBarFill.style.background = color; }
  };
  ratingSlider.addEventListener('input', updateRating);
  updateRating();
}

// ─── Char Count ───────────────────────────
if (textarea && charCountEl) {
  textarea.addEventListener('input', () => {
    const len = textarea.value.length;
    charCountEl.textContent = len;
    charCountEl.style.color = len > 450 ? '#ff4444' : '';
  });
}

/**
 * esc — HTML Escape Utility
 * WHAT: Escapes HTML special characters to prevent XSS in dynamically injected innerHTML.
 * HOW: Replaces &, <, >, ", ' with their HTML entity equivalents.
 * CALLED BY: renderCarousel() wherever user-submitted data is injected into card innerHTML.
 */
function esc(str) {
  return String(str ?? '')
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

/**
 * renderCarousel — Comment Cards Carousel Builder
 * WHAT: Clears and rebuilds the comments carousel with a card per comment, plus dot indicators.
 * HOW: Creates .comment-card elements with avatar initials, rating bar, comment text, and date.
 *      Builds dot buttons with goToSlide() click listeners. Starts autoplay after build.
 * CALLED BY: loadComments() on initial load and after a new comment is submitted.
 */
function renderCarousel(comments) {
  if (!carousel) return;
  carousel.querySelectorAll('.comment-card').forEach(c => c.remove());

  if (comments.length === 0) {
    if (emptyState) emptyState.style.display = 'flex';
    if (dotsWrap)   dotsWrap.innerHTML = '';
    updateControls();
    return;
  }
  if (emptyState) emptyState.style.display = 'none';

  comments.forEach((c, i) => {
    const card     = document.createElement('div');
    card.className = 'comment-card' + (i === 0 ? ' active' : '');
    const rating   = c.rating || 0;
    const color    = rating >= 80 ? '#00c882' : rating >= 50 ? '#ff6a00' : '#ff4444';
    const initials = (c.name || '??').split(' ').map(w => w[0]).join('').toUpperCase().slice(0,2);
    const date     = c.createdAt?.toDate
      ? new Date(c.createdAt.toDate()).toLocaleDateString('en-PH',{year:'numeric',month:'short',day:'numeric'})
      : 'Recently';

    card.innerHTML = `
      <div class="comment-card-inner">
        <div class="comment-card-top">
          <div class="commenter-avatar" style="background:${color}22;border-color:${color}44;">${initials}</div>
          <div class="commenter-info">
            <span class="commenter-name">${esc(c.name)}</span>
            <span class="commenter-project">📌 ${esc(c.project)}</span>
          </div>
          <div class="comment-rating-badge" style="color:${color};border-color:${color}44;background:${color}11;">
            <span class="rating-num">${rating}%</span>
            <span class="rating-label">Rating</span>
          </div>
        </div>
        <div class="comment-rating-bar-wrap">
          <div class="comment-rating-bar" style="width:${rating}%;background:${color};"></div>
        </div>
        <blockquote class="comment-text">"${esc(c.comment)}"</blockquote>
        <div class="comment-card-footer">
          <span class="comment-date">📅 ${date}</span>
        </div>
      </div>`;
    carousel.appendChild(card);
  });

  // Dots
  if (dotsWrap) {
    dotsWrap.innerHTML = '';
    comments.forEach((_,i) => {
      const dot = document.createElement('button');
      dot.className = 'carousel-dot' + (i === 0 ? ' active' : '');
      dot.setAttribute('aria-label', `Review ${i+1}`);
      dot.addEventListener('click', () => goToSlide(i));
      dotsWrap.appendChild(dot);
    });
  }

  currentSlide = 0;
  updateControls();
  startAutoplay();
}

/**
 * goToSlide — Carousel Slide Navigator
 * WHAT: Transitions the active comment card and dot indicator to the given index.
 * HOW: Removes 'active' from the current card/dot, wraps index via modulo, adds 'active' to new ones.
 * CALLED BY: prevBtn/nextBtn click listeners, dot click listeners, startAutoplay() interval, touch swipe.
 */
function goToSlide(idx) {
  const cards = carousel?.querySelectorAll('.comment-card');
  const dots  = dotsWrap?.querySelectorAll('.carousel-dot');
  if (!cards?.length) return;

  cards[currentSlide]?.classList.remove('active');
  dots?.[currentSlide]?.classList.remove('active');

  currentSlide = ((idx % allComments.length) + allComments.length) % allComments.length;

  cards[currentSlide]?.classList.add('active');
  dots?.[currentSlide]?.classList.add('active');
  updateControls();
}

/**
 * updateControls — Carousel Arrow State Updater
 * WHAT: Enables or disables the prev/next carousel buttons based on whether there are multiple comments.
 * HOW: Sets disabled property based on allComments.length > 1.
 * CALLED BY: renderCarousel(), goToSlide().
 */
function updateControls() {
  const ok = allComments.length > 1;
  if (prevBtn) prevBtn.disabled = !ok;
  if (nextBtn) nextBtn.disabled = !ok;
}

/**
 * startAutoplay — Carousel Auto-Advance Timer
 * WHAT: Clears any existing autoplay timer and starts a new 5-second interval to advance slides.
 * HOW: Uses setInterval to call goToSlide(currentSlide + 1) every 5000ms.
 *      Only starts if there are more than 1 comments. Pauses on mouseenter (see listeners below).
 * CALLED BY: renderCarousel() after building cards, carousel mouseleave listener.
 */
function startAutoplay() {
  clearInterval(autoplayTimer);
  if (allComments.length > 1) {
    autoplayTimer = setInterval(() => goToSlide(currentSlide + 1), 5000);
  }
}

carousel?.addEventListener('mouseenter', () => clearInterval(autoplayTimer));
carousel?.addEventListener('mouseleave', () => startAutoplay());
prevBtn?.addEventListener('click', () => goToSlide(currentSlide - 1));
nextBtn?.addEventListener('click', () => goToSlide(currentSlide + 1));

// Swipe
let touchX = 0;
carousel?.addEventListener('touchstart', e => { touchX = e.touches[0].clientX; }, {passive:true});
carousel?.addEventListener('touchend',   e => {
  const d = touchX - e.changedTouches[0].clientX;
  if (Math.abs(d) > 50) goToSlide(d > 0 ? currentSlide+1 : currentSlide-1);
});

/**
 * loadComments — Firestore Comments Fetcher
 * WHAT: Fetches all comments from the 'comments' Firestore collection ordered by createdAt desc.
 * HOW: Uses getDocs (one-time read) with an orderBy query; maps docs to plain objects
 *      and passes the result to renderCarousel(). Shows error state in emptyState on failure.
 * CALLED BY: Boot sequence at bottom of file; also called after a new comment is submitted.
 */
async function loadComments() {
  try {
    const q    = query(collection(db, COL), orderBy('createdAt','desc'));
    const snap = await getDocs(q);
    allComments = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    renderCarousel(allComments);
  } catch (err) {
    console.error('Load error:', err);
    if (emptyState) {
      emptyState.innerHTML = '<div class="comments-empty-icon">⚠️</div><p>Could not load reviews. Please try again later.</p>';
      emptyState.style.display = 'flex';
    }
  }
}

/**
 * validate — Comment Form Validator
 * WHAT: Validates all required comment form fields and the email format.
 * HOW: Iterates field config array; shows inline error messages and adds 'input-error' class
 *      to invalid fields. Also enforces a 10-character minimum on the comment body.
 *      Returns true only if all checks pass.
 * CALLED BY: form submit event listener before Firestore write.
 */
function validate() {
  let ok = true;
  const fields = [
    { id:'cf-name',    err:'err-name',    msg:'Full name is required.' },
    { id:'cf-email',   err:'err-email',   msg:'Email address is required.' },
    { id:'cf-project', err:'err-project', msg:'Project or task name is required.' },
    { id:'cf-comment', err:'err-comment', msg:'Comment is required.' },
  ];

  fields.forEach(f => {
    const el  = document.getElementById(f.id);
    const err = document.getElementById(f.err);
    if (err) err.textContent = '';
    el?.classList.remove('input-error');

    if (!el?.value.trim()) {
      if (err) err.textContent = f.msg;
      el?.classList.add('input-error');
      ok = false;
    }
  });

  // Email format
  const emailEl  = document.getElementById('cf-email');
  const emailErr = document.getElementById('err-email');
  if (emailEl?.value.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailEl.value.trim())) {
    if (emailErr) emailErr.textContent = 'Please enter a valid email.';
    emailEl.classList.add('input-error');
    ok = false;
  }

  // Comment min length
  const commentEl  = document.getElementById('cf-comment');
  const commentErr = document.getElementById('err-comment');
  if (commentEl?.value.trim() && commentEl.value.trim().length < 10) {
    if (commentErr) commentErr.textContent = 'Comment must be at least 10 characters.';
    commentEl.classList.add('input-error');
    ok = false;
  }

  return ok;
}

// ─── Submit ───────────────────────────────
form?.addEventListener('submit', async e => {
  e.preventDefault();
  if (formSuccess)   formSuccess.style.display   = 'none';
  if (formErrGlobal) formErrGlobal.textContent   = '';

  if (!validate()) return;

  if (submitBtn)  submitBtn.disabled    = true;
  if (submitText) submitText.textContent = 'Submitting...';

  const payload = {
    name:      document.getElementById('cf-name').value.trim(),
    email:     document.getElementById('cf-email').value.trim(),
    project:   document.getElementById('cf-project').value.trim(),
    rating:    parseInt(document.getElementById('cf-rating').value),
    comment:   document.getElementById('cf-comment').value.trim(),
    createdAt: serverTimestamp()
  };

  console.log('[CMC] Submitting comment:', payload);

  try {
    const docRef = await addDoc(collection(db, COL), payload);
    console.log('[CMC] Comment saved! ID:', docRef.id);

    if (formSuccess) {
      formSuccess.style.display  = 'flex';
      formSuccess.style.opacity  = '1';
      formSuccess.style.transition = 'opacity 0.5s ease';
      // Auto-hide after 3 seconds
      setTimeout(() => {
        formSuccess.style.opacity = '0';
        setTimeout(() => {
          formSuccess.style.display = 'none';
          formSuccess.style.opacity = '1';
        }, 500);
      }, 3000);
    }
    form.reset();

    // Reset rating UI
    if (ratingDisplay) { ratingDisplay.textContent = '50%'; ratingDisplay.style.color = ''; }
    if (ratingBarFill) { ratingBarFill.style.width = '50%'; ratingBarFill.style.background = '#ff6a00'; }
    if (charCountEl)     charCountEl.textContent = '0';

    await loadComments();
    carousel?.scrollIntoView({ behavior:'smooth', block:'nearest' });

  } catch (err) {
    console.error('[CMC] Submit error:', err.code, err.message);

    let msg = '⚠️ Submission failed. ';
    if (err.code === 'permission-denied') {
      msg += 'Firebase rules are blocking writes. Please update Firestore rules to allow write access.';
    } else if (err.code === 'unavailable') {
      msg += 'No internet connection. Please check your network.';
    } else {
      msg += err.message || 'Please try again.';
    }

    if (formErrGlobal) formErrGlobal.textContent = msg;
  } finally {
    if (submitBtn)  submitBtn.disabled    = false;
    if (submitText) submitText.textContent = 'Submit Review';
  }
});

// ─── Boot ─────────────────────────────────
loadComments();