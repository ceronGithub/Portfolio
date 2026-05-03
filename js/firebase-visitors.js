/* =============================================
   VISITOR COUNTER — Ceron Matthew Calsena
   Firestore: portfolio-ae245
   Collection: visitors  (one doc per day)
   Doc ID: "YYYY-MM-DD"
   Fields: { count: number, date: string }
============================================= */

import { initializeApp, getApps }
  from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js';
import {
  getFirestore,
  doc, getDoc, setDoc, updateDoc, increment,
  collection, getDocs, query, orderBy, limit
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

// ─── Re-use existing app if already initialised ──
const firebaseConfig = {
  apiKey:            "AIzaSyDbBqV7m8WkDnTYtwLwj-P5zQNaTEMDI9g",
  authDomain:        "portfolio-ae245.firebaseapp.com",
  projectId:         "portfolio-ae245",
  storageBucket:     "portfolio-ae245.firebasestorage.app",
  messagingSenderId: "530260965137",
  appId:             "1:530260965137:web:0d27cc680436f3d11d3eb0"
};

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
const db  = getFirestore(app);
const COL = 'visitors';

// ─── Helpers ─────────────────────────────────────
// Use Philippine Time (UTC+8) so the day resets at midnight PH time,
// not midnight UTC (which would be 8:00 AM PH — causing wrong date keys).
/**
 * todayKey — Philippine Time Date Key Generator
 * WHAT: Returns today's date in 'YYYY-MM-DD' format using Philippine Time (UTC+8).
 * HOW: Offsets Date.now() by 8 hours so the key resets at midnight PH time, not midnight UTC.
 * CALLED BY: hasVisitedToday(), markVisited(), recordVisit(), buildChart() (isToday check),
 *            init() (todayData lookup).
 */
function todayKey() {
  const now = new Date();
  const phTime = new Date(now.getTime() + (8 * 60 * 60 * 1000));
  return phTime.toISOString().slice(0, 10); // "YYYY-MM-DD" in PH time
}

// Use localStorage (persists across sessions) + date key so each
// calendar day gets counted once per browser, even across page reloads.
/**
 * hasVisitedToday — Visit Deduplication Check
 * WHAT: Returns true if the current browser has already been counted as a visit today.
 * HOW: Compares localStorage key 'cmc_visited' with todayKey(). Catches storage errors
 *      (private/incognito) and returns false to allow the count attempt.
 * CALLED BY: recordVisit() as a gate before writing to Firestore.
 */
function hasVisitedToday() {
  try {
    return localStorage.getItem('cmc_visited') === todayKey();
  } catch {
    return false; // private/incognito may block localStorage
  }
}

/**
 * markVisited — Visit Flag Writer
 * WHAT: Stores today's date key in localStorage to prevent duplicate visit counting.
 * HOW: Silent fail on write errors (private/incognito). Only called AFTER a successful
 *      Firestore write to ensure failed writes can retry on next page load.
 * CALLED BY: recordVisit() after Firestore write succeeds.
 */
function markVisited() {
  try {
    localStorage.setItem('cmc_visited', todayKey());
  } catch { /* ignore */ }
}

/**
 * recordVisit — Visit Counter Writer
 * WHAT: Increments today's visitor count in Firestore (or creates the day doc if absent).
 * HOW: Gates on hasVisitedToday() to avoid duplicate writes per browser per day.
 *      Uses getDoc to check existence; updateDoc with increment(1) if exists, setDoc if new.
 *      Only calls markVisited() after a confirmed successful write.
 * CALLED BY: init() during widget initialization.
 */
async function recordVisit() {
  if (hasVisitedToday()) {
    console.log('[CMC Visitors] Already counted today — skipping.');
    return;
  }

  const key = todayKey();
  const ref = doc(db, COL, key);

  try {
    const snap = await getDoc(ref);
    if (snap.exists()) {
      await updateDoc(ref, { count: increment(1) });
    } else {
      await setDoc(ref, { count: 1, date: key });
    }
    // Only mark as visited AFTER the write succeeds
    markVisited();
    console.log('[CMC Visitors] Visit recorded for', key);
  } catch (err) {
    // Do NOT mark as visited so it retries on next load
    console.error('[CMC Visitors] Failed to record visit:', err.code, err.message);
    if (err.code === 'permission-denied') {
      console.error('[CMC Visitors] ⚠️  Firestore rules are blocking writes to the "visitors" collection. Go to Firebase Console → Firestore → Rules and allow read/write for this collection.');
    }
    throw err; // re-throw so init() can show error state
  }
}

/**
 * fetchDailyStats — Last N Days Visitor Data Fetcher
 * WHAT: Fetches the most recent N days of visitor data from Firestore, ordered oldest→newest.
 * HOW: Queries 'visitors' collection ordered by date desc with a limit, then reverses for chart order.
 * CALLED BY: init() in parallel with fetchTotalCount() via Promise.all.
 */
async function fetchDailyStats(days = 7) {
  const q    = query(collection(db, COL), orderBy('date', 'desc'), limit(days));
  const snap = await getDocs(q);
  return snap.docs
    .map(d => ({ date: d.id, count: d.data().count || 0 }))
    .reverse(); // oldest → newest for the chart
}

/**
 * fetchTotalCount — Total Visit Count Aggregator
 * WHAT: Sums all visitor counts across all days in the 'visitors' Firestore collection.
 * HOW: Reads all docs with getDocs, reduces their count fields.
 * CALLED BY: init() in parallel with fetchDailyStats() via Promise.all.
 */
async function fetchTotalCount() {
  const snap = await getDocs(collection(db, COL));
  return snap.docs.reduce((sum, d) => sum + (d.data().count || 0), 0);
}

/**
 * animateCount — Animated Number Counter
 * WHAT: Smoothly animates a number element from its current displayed value to a target number.
 * HOW: Uses requestAnimationFrame with a cubic ease-out curve over the given duration (default 1400ms).
 * CALLED BY: init() to animate #vcCount and #vcCountSmall after data loads.
 */
function animateCount(el, target, duration = 1400) {
  const start = performance.now();
  const from  = parseInt(el.textContent.replace(/,/g,'')) || 0;
  function step(now) {
    const t   = Math.min((now - start) / duration, 1);
    const ease = 1 - Math.pow(1 - t, 3);
    el.textContent = Math.round(from + (target - from) * ease).toLocaleString();
    if (t < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

/**
 * buildChart — SVG Visitor Histogram Builder
 * WHAT: Generates an inline SVG histogram of daily visitor counts for the last 7 days.
 * HOW: Computes bar heights relative to max count; highlights today's bar with a different
 *      gradient. Adds count labels above bars and day-of-week labels below. Returns SVG string.
 * CALLED BY: init() to populate #vcChart after fetchDailyStats() resolves.
 */
function buildChart(data) {
  const W      = 220;
  const H      = 74;
  const AXIS_Y = H - 14;
  const PLOT_H = AXIS_Y - 10;
  const n      = data.length;
  const binW   = W / n;
  const max    = Math.max(...data.map(d => d.count), 1);
  const days   = ['Su','Mo','Tu','We','Th','Fr','Sa'];

  let bins = '';
  data.forEach((d, i) => {
    const barH    = Math.max(3, Math.round((d.count / max) * PLOT_H));
    const x       = i * binW;
    const barY    = AXIS_Y - barH;
    const isToday = d.date === todayKey();
    const fill    = isToday ? 'url(#histGradToday)' : 'url(#histGrad)';
    const stroke  = isToday ? 'rgba(255,154,60,0.7)' : 'rgba(255,106,0,0.2)';
    const dayIdx  = new Date(d.date + 'T00:00:00+08:00').getDay(); // PH timezone
    const dayLbl  = days[dayIdx];
    const countLbl = d.count > 0
      ? `<text x="${x + binW/2}" y="${barY - 2}" text-anchor="middle" font-size="6.5" font-weight="600" fill="${isToday ? '#ff9a3c' : 'rgba(255,255,255,0.5)'}">${d.count}</text>`
      : '';

    bins += `
      <g>
        <rect x="${x}" y="${barY}" width="${binW}" height="${barH}" fill="${fill}" stroke="${stroke}" stroke-width="0.5">
          <title>${d.date}: ${d.count} visit${d.count !== 1 ? 's' : ''}</title>
        </rect>
        ${countLbl}
        <text x="${x + binW/2}" y="${H - 2}" text-anchor="middle" font-size="7"
          fill="${isToday ? 'rgba(255,154,60,0.9)' : 'rgba(255,255,255,0.38)'}"
          font-weight="${isToday ? '700' : '400'}">${dayLbl}</text>
      </g>`;
  });

  const axis = `<line x1="0" y1="${AXIS_Y}" x2="${W}" y2="${AXIS_Y}" stroke="rgba(255,255,255,0.12)" stroke-width="1"/>`;
  const gridY = AXIS_Y - Math.round(0.5 * PLOT_H);
  const grid  = `<line x1="0" y1="${gridY}" x2="${W}" y2="${gridY}" stroke="rgba(255,255,255,0.06)" stroke-width="0.5" stroke-dasharray="3,3"/>`;

  return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto;display:block;">
    <defs>
      <linearGradient id="histGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="rgba(255,106,0,0.55)"/>
        <stop offset="100%" stop-color="rgba(255,106,0,0.18)"/>
      </linearGradient>
      <linearGradient id="histGradToday" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#ffb347"/>
        <stop offset="100%" stop-color="#ff6a00"/>
      </linearGradient>
    </defs>
    ${grid}
    ${bins}
    ${axis}
  </svg>`;
}

/**
 * injectStyles — Visitor Widget CSS Injector
 * WHAT: Dynamically injects the visitor counter widget's CSS into <head> once.
 * HOW: Guards against duplicate injection with a #vc-styles ID check. Creates a <style>
 *      element with all widget layout, animation, and responsive styles.
 * CALLED BY: init() before buildWidget().
 */
function injectStyles() {
  if (document.getElementById('vc-styles')) return;
  const style = document.createElement('style');
  style.id = 'vc-styles';
  style.textContent = `
    /* ── Visitor Counter Widget ── */
    #vc-widget {
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 9999;
      width: 230px;
      background: rgba(15,15,15,0.92);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border: 1px solid rgba(255,122,0,0.25);
      border-radius: 16px;
      padding: 14px 16px 12px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04);
      font-family: 'Poppins', sans-serif;
      cursor: default;
      transform: translateY(120%);
      opacity: 0;
      transition: transform 0.5s cubic-bezier(.34,1.56,.64,1), opacity 0.4s ease;
    }
    #vc-widget.vc-visible {
      transform: translateY(0);
      opacity: 1;
    }
    #vc-widget.vc-collapsed #vc-body,
    #vc-widget.vc-collapsed .vc-appt-wrap,
    #vc-widget.vc-collapsed .vc-chat-wrap {
      display: none;
    }
    #vc-widget.vc-collapsed {
      width: auto;
      min-width: 0;
      padding: 10px 14px;
    }

    /* Header row */
    .vc-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 10px;
    }
    .vc-title-wrap {
      display: flex;
      align-items: center;
      gap: 7px;
    }
    .vc-pulse-dot {
      width: 8px; height: 8px;
      border-radius: 50%;
      background: #ff6a00;
      box-shadow: 0 0 0 0 rgba(255,106,0,0.6);
      animation: vc-pulse 2s infinite;
      flex-shrink: 0;
    }
    @keyframes vc-pulse {
      0%   { box-shadow: 0 0 0 0 rgba(255,106,0,0.6); }
      70%  { box-shadow: 0 0 0 7px rgba(255,106,0,0); }
      100% { box-shadow: 0 0 0 0 rgba(255,106,0,0); }
    }
    .vc-label {
      font-size: 10px;
      font-weight: 600;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: rgba(255,255,255,0.5);
    }
    .vc-toggle-btn {
      background: none;
      border: none;
      color: rgba(255,255,255,0.35);
      cursor: pointer;
      font-size: 14px;
      padding: 0;
      line-height: 1;
      transition: color 0.2s;
    }
    .vc-toggle-btn:hover { color: rgba(255,255,255,0.8); }

    /* Count row */
    .vc-count-row {
      display: flex;
      align-items: flex-end;
      gap: 8px;
      margin-bottom: 12px;
    }
    .vc-count {
      font-family: 'Space Mono', monospace;
      font-size: 30px;
      font-weight: 700;
      color: #fff;
      line-height: 1;
      letter-spacing: -0.02em;
    }
    .vc-count-meta {
      display: flex;
      flex-direction: column;
      padding-bottom: 3px;
      gap: 1px;
    }
    .vc-count-label {
      font-size: 10px;
      color: rgba(255,255,255,0.45);
      font-weight: 500;
    }
    .vc-today-pill {
      font-size: 9px;
      font-weight: 700;
      background: rgba(255,106,0,0.18);
      color: #ff9a3c;
      border: 1px solid rgba(255,106,0,0.3);
      border-radius: 20px;
      padding: 1px 7px;
      letter-spacing: 0.04em;
    }

    /* Chart */
    .vc-chart-wrap {
      border-top: 1px solid rgba(255,255,255,0.06);
      padding-top: 10px;
    }
    .vc-chart-label {
      font-size: 9px;
      color: rgba(255,255,255,0.3);
      text-transform: uppercase;
      letter-spacing: 0.08em;
      margin-bottom: 6px;
    }
    .vc-bar { transition: opacity 0.2s; }
    .vc-bar:hover { opacity: 0.8; }
    .vc-bar-today { filter: drop-shadow(0 0 4px rgba(255,106,0,0.6)); }

    /* Collapsed pill */
    .vc-collapsed-inner {
      display: none;
      align-items: center;
      gap: 7px;
    }
    #vc-widget.vc-collapsed .vc-collapsed-inner {
      display: flex;
    }
    .vc-collapsed-count {
      font-family: 'Space Mono', monospace;
      font-size: 13px;
      font-weight: 700;
      color: #fff;
    }

    /* Appointment Button */
    .vc-appt-wrap {
      margin-top: 10px;
      border-top: 1px solid rgba(255,255,255,0.06);
      padding-top: 10px;
    }
    .vc-appt-btn {
      width: 100%;
      display: flex;
      align-items: center;
      gap: 7px;
      background: linear-gradient(135deg, rgba(255,106,0,0.18), rgba(255,180,0,0.12));
      border: 1px solid rgba(255,140,0,0.35);
      border-radius: 10px;
      padding: 8px 10px;
      cursor: pointer;
      transition: all 0.25s ease;
      font-family: 'Poppins', sans-serif;
      position: relative;
      overflow: hidden;
    }
    .vc-appt-btn::before {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(135deg, rgba(255,180,0,0.15), rgba(255,106,0,0.1));
      opacity: 0;
      transition: opacity 0.25s;
    }
    .vc-appt-btn:hover::before { opacity: 1; }
    .vc-appt-btn:hover {
      border-color: rgba(255,180,0,0.6);
      transform: translateY(-1px);
      box-shadow: 0 4px 16px rgba(255,106,0,0.25);
    }
    .vc-appt-icon {
      font-size: 14px;
      flex-shrink: 0;
    }
    .vc-appt-text {
      font-size: 10px;
      font-weight: 600;
      color: rgba(255,200,80,0.95);
      letter-spacing: 0.04em;
      flex: 1;
      text-align: left;
      text-transform: uppercase;
    }
    .vc-appt-arrow {
      font-size: 11px;
      color: rgba(255,180,0,0.7);
      transition: transform 0.2s;
    }
    .vc-appt-btn:hover .vc-appt-arrow { transform: translateX(3px); }

    /* Chat Button */
    .vc-chat-wrap {
      margin-top: 6px;
    }
    .vc-chat-btn {
      width: 100%;
      display: flex;
      align-items: center;
      gap: 7px;
      background: linear-gradient(135deg, rgba(80,180,255,0.12), rgba(0,200,180,0.08));
      border: 1px solid rgba(80,180,255,0.3);
      border-radius: 10px;
      padding: 8px 10px;
      cursor: pointer;
      transition: all 0.25s ease;
      font-family: 'Poppins', sans-serif;
      position: relative;
      overflow: hidden;
    }
    .vc-chat-btn:hover {
      border-color: rgba(80,200,255,0.6);
      transform: translateY(-1px);
      box-shadow: 0 4px 16px rgba(0,180,255,0.2);
    }
    .vc-chat-icon { font-size: 14px; flex-shrink: 0; }
    .vc-chat-text {
      font-size: 10px;
      font-weight: 600;
      color: rgba(100,210,255,0.95);
      letter-spacing: 0.04em;
      flex: 1;
      text-align: left;
      text-transform: uppercase;
    }

    /* Mobile */
    @media (max-width: 600px) {
      #vc-widget {
        bottom: 16px;
        right: 12px;
        left: auto;
        width: 230px;
        max-width: calc(100vw - 24px);
        margin-left: 0;
        overflow: hidden;
      }
    }
    @media (max-width: 380px) {
      #vc-widget {
        right: 8px;
        left: auto;
        width: 210px;
        max-width: calc(100vw - 16px);
        overflow: hidden;
      }
    }
  `;
  document.head.appendChild(style);
}

/**
 * buildWidget — Visitor Counter Widget DOM Builder
 * WHAT: Creates and appends the fixed-position visitor counter widget to document.body.
 * HOW: Builds innerHTML with header, count display, 7-day chart placeholder, appointment button,
 *      and chat button. Attaches collapse toggle, appointment link, and chat link click handlers.
 *      Returns the widget element so init() can animate it in.
 * CALLED BY: init().
 */
function buildWidget() {
  const wrap = document.createElement('div');
  wrap.id = 'vc-widget';
  wrap.innerHTML = `
    <div class="vc-header">
      <div class="vc-title-wrap">
        <div class="vc-pulse-dot"></div>
        <span class="vc-label">Portfolio Visitors</span>
      </div>
      <button class="vc-toggle-btn" id="vcToggle" title="Collapse">−</button>
    </div>

    <div id="vc-body">
      <div class="vc-count-row">
        <span class="vc-count" id="vcCount">0</span>
        <div class="vc-count-meta">
          <span class="vc-count-label">Total Visits</span>
          <span class="vc-today-pill" id="vcTodayPill">Today: 0</span>
        </div>
      </div>
      <div class="vc-chart-wrap">
        <div class="vc-chart-label">Last 7 Days</div>
        <div id="vcChart">
          <svg viewBox="0 0 220 74" style="width:100%;opacity:0.2;">
            <line x1="0" y1="60" x2="220" y2="60" stroke="rgba(255,255,255,0.3)" stroke-width="1"/>
            <rect x="0"   y="50" width="31" height="10" fill="#ff6a00"/>
            <rect x="31"  y="42" width="32" height="18" fill="#ff6a00"/>
            <rect x="63"  y="32" width="31" height="28" fill="#ff6a00"/>
            <rect x="94"  y="44" width="32" height="16" fill="#ff6a00"/>
            <rect x="126" y="36" width="31" height="24" fill="#ff6a00"/>
            <rect x="157" y="26" width="32" height="34" fill="#ff6a00"/>
            <rect x="189" y="20" width="31" height="40" fill="#ff9a3c"/>
          </svg>
        </div>
      </div>
    </div>

    <!-- Appointment Button -->
    <div class="vc-appt-wrap" id="vc-appt-wrap">
      <button class="vc-appt-btn" id="vcApptBtn">
        <span class="vc-appt-icon">📅</span>
        <span class="vc-appt-text">Schedule Appointment</span>
        <span class="vc-appt-arrow">→</span>
      </button>
    </div>

    <!-- Chat floating button -->
    <div class="vc-chat-wrap">
      <button class="vc-chat-btn" id="vcChatBtn">
        <span class="vc-chat-icon">💬</span>
        <span class="vc-chat-text">Let's Chat</span>
        <span class="vc-appt-arrow">→</span>
      </button>
    </div>

    <!-- Collapsed state -->
    <div class="vc-collapsed-inner">
      <div class="vc-pulse-dot"></div>
      <span class="vc-collapsed-count" id="vcCountSmall">0</span>
      <span class="vc-count-label">visits</span>
    </div>
  `;
  document.body.appendChild(wrap);

  // Toggle collapse
  let collapsed = false;
  document.getElementById('vcToggle').addEventListener('click', () => {
    collapsed = !collapsed;
    wrap.classList.toggle('vc-collapsed', collapsed);
    document.getElementById('vcToggle').textContent = collapsed ? ' + ' : '−';
  });

  // Appointment button
  document.getElementById('vcApptBtn').addEventListener('click', () => {
    window.open('appointment.html', '_blank');
  });

  // Chat button
  document.getElementById('vcChatBtn').addEventListener('click', () => {
    window.open('chat.html', '_blank');
  });

  return wrap;
}

/**
 * init — Visitor Widget Initializer (Main Entry Point)
 * WHAT: Orchestrates the full visitor widget lifecycle: injects styles, builds the widget DOM,
 *       records the visit, fetches stats, and populates count/chart/pill displays.
 * HOW: Calls injectStyles() → buildWidget() → shows widget after 800ms delay →
 *      recordVisit() → Promise.all([fetchTotalCount, fetchDailyStats]) →
 *      animates counts and renders the SVG chart. Shows '--' error state on failure.
 * CALLED BY: Module boot — invoked immediately at the bottom of the file.
 */
async function init() {
  injectStyles();
  const widget = buildWidget();

  // Show widget after short delay
  setTimeout(() => widget.classList.add('vc-visible'), 800);

  try {
    // Record visit (only once per session)
    await recordVisit();

    // Fetch data in parallel
    const [total, daily] = await Promise.all([
      fetchTotalCount(),
      fetchDailyStats(7)
    ]);

    // Today's count
    const todayData = daily.find(d => d.date === todayKey());
    const todayCount = todayData?.count || 0;

    // Animate total
    const countEl = document.getElementById('vcCount');
    if (countEl) animateCount(countEl, total);

    // Today pill
    const pillEl = document.getElementById('vcTodayPill');
    if (pillEl) pillEl.textContent = `Today: ${todayCount.toLocaleString()}`;

    // Collapsed count
    const smallEl = document.getElementById('vcCountSmall');
    if (smallEl) animateCount(smallEl, total);

    // Chart
    const chartEl = document.getElementById('vcChart');
    if (chartEl && daily.length > 0) {
      chartEl.innerHTML = buildChart(daily);
    }

  } catch (err) {
    console.error('[CMC Visitors] Init error:', err.code || err.message);
    // Show a subtle error state in the widget count area
    const countEl = document.getElementById('vcCount');
    const pillEl  = document.getElementById('vcTodayPill');
    if (countEl) countEl.textContent = '--';
    if (pillEl)  { pillEl.textContent = 'Error'; pillEl.style.color = '#ff4444'; }
  }
}

init();