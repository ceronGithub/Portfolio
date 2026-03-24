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
function todayKey() {
  return new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"
}

function hasVisitedToday() {
  return sessionStorage.getItem('cmc_visited') === todayKey();
}

function markVisited() {
  sessionStorage.setItem('cmc_visited', todayKey());
}

// ─── Record visit ────────────────────────────────
async function recordVisit() {
  if (hasVisitedToday()) return;
  markVisited();

  const key = todayKey();
  const ref = doc(db, COL, key);
  const snap = await getDoc(ref);

  if (snap.exists()) {
    await updateDoc(ref, { count: increment(1) });
  } else {
    await setDoc(ref, { count: 1, date: key });
  }
}

// ─── Fetch last N days ───────────────────────────
async function fetchDailyStats(days = 7) {
  const q    = query(collection(db, COL), orderBy('date', 'desc'), limit(days));
  const snap = await getDocs(q);
  return snap.docs
    .map(d => ({ date: d.id, count: d.data().count || 0 }))
    .reverse(); // oldest → newest for the chart
}

async function fetchTotalCount() {
  const snap = await getDocs(collection(db, COL));
  return snap.docs.reduce((sum, d) => sum + (d.data().count || 0), 0);
}

// ─── Animated number ─────────────────────────────
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

// ─── Build SVG Histogram ─────────────────────────
// True histogram: adjacent bins (no gaps), baseline axis,
// count labels above each bin, day labels at base.
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
    const dayIdx  = new Date(d.date + 'T00:00:00').getDay();
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

// ─── Inject widget CSS ────────────────────────────
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
    #vc-widget.vc-collapsed #vc-body {
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

    /* Mobile */
    @media (max-width: 480px) {
      #vc-widget {
        bottom: 16px;
        right: 16px;
        width: 210px;
      }
    }
  `;
  document.head.appendChild(style);
}

// ─── Build widget HTML ────────────────────────────
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
    document.getElementById('vcToggle').textContent = collapsed ? '+' : '−';
  });

  return wrap;
}

// ─── Main ─────────────────────────────────────────
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
    console.warn('[CMC Visitors] Error:', err);
  }
}

init();