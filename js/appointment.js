/* ============================================
   APPOINTMENT PAGE JS — Ceron Matthew Calsena
   CMC Portfolio · 2026
============================================ */

import { initializeApp, getApps }   from 'firebase/app';
import { getFirestore, collection, doc, addDoc, deleteDoc, onSnapshot } from 'firebase/firestore';

// ── Firebase ─────────────────────────────────────────
const firebaseConfig = {
  apiKey:            'AIzaSyDbBqV7m8WkDnTYtwLwj-P5zQNaTEMDI9g',
  authDomain:        'portfolio-ae245.firebaseapp.com',
  projectId:         'portfolio-ae245',
  storageBucket:     'portfolio-ae245.firebasestorage.app',
  messagingSenderId: '530260965137',
  appId:             '1:530260965137:web:0d27cc680436f3d11d3eb0'
};
const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
const db  = getFirestore(app);
const COL = 'appointments';

// ── Config — change OWNER_PASS to your preferred password ──
const OWNER_PASS = 'CMC2026';

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
];
const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const MCOLS = [
  '#4fc3f7','#ff80ab','#ffb347','#a5d6a7',
  '#fff176','#ffd000','#ff6a00','#ce93d8',
  '#80cbc4','#ff7043','#b0bec5','#f48fb1'
];
const ALL_TIMES = [
  '8:00 AM','9:00 AM','10:00 AM','11:00 AM',
  '12:00 PM','1:00 PM','2:00 PM','3:00 PM',
  '4:00 PM','5:00 PM','6:00 PM','7:00 PM',
  '8:00 PM','9:00 PM','10:00 PM'
];

// ── State ─────────────────────────────────────────────
let curYear  = new Date().getFullYear();
let isOwner  = false;
let selDate  = null;
let bookings = {}; // { 'YYYY-MM-DD': [ {...} ] }

// ── Helpers ───────────────────────────────────────────
function phToday() {
  const now = new Date();
  const ph  = new Date(now.getTime() + 8 * 3600000);
  return ph.toISOString().slice(0, 10);
}
function dKey(y, m, d) {
  return `${y}-${String(m + 1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
}
function closeOverlay(id) {
  document.getElementById(id).classList.remove('open');
}
function openOverlay(id) {
  document.getElementById(id).classList.add('open');
}

// ── Firebase realtime listener ────────────────────────
function listenBookings() {
  onSnapshot(collection(db, COL), snap => {
    bookings = {};
    snap.docs.forEach(d => {
      const data = { id: d.id, ...d.data() };
      if (!bookings[data.date]) bookings[data.date] = [];
      bookings[data.date].push(data);
    });
    buildCals(curYear); // rebuild calendars with fresh booking data
    buildFooter();
  }, err => {
    console.error('[CMC Appt] Firestore error:', err.code, err.message);
  });
}

// ══════════════════════════════════════════════
//  COSMOS BACKGROUND
// ══════════════════════════════════════════════
function buildCosmos() {
  const cosmos = document.getElementById('cosmos');
  cosmos.innerHTML = '';

  // Nebulas
  const nc = ['rgba(255,106,0,1)','rgba(255,208,0,1)','rgba(255,60,0,1)','rgba(200,150,0,1)'];
  for (let i = 0; i < 5; i++) {
    const n = document.createElement('div');
    n.className = 'nebula';
    const s = 200 + Math.random() * 300;
    n.style.cssText = `width:${s}px;height:${s}px;left:${Math.random()*100}%;top:${Math.random()*100}%;background:${nc[i%nc.length]};animation-delay:${i*3}s;animation-duration:${15+i*4}s`;
    cosmos.appendChild(n);
  }

  // Stars
  for (let i = 0; i < 200; i++) {
    const s = document.createElement('div');
    s.className = 'star';
    const sz = Math.random() * 2.5 + 0.5;
    s.style.cssText = `width:${sz}px;height:${sz}px;left:${Math.random()*100}%;top:${Math.random()*100}%;--dur:${2+Math.random()*4}s;--delay:${Math.random()*5}s;--op:${0.3+Math.random()*0.7}`;
    cosmos.appendChild(s);
  }

  // Shooting stars
  for (let i = 0; i < 8; i++) {
    const ss = document.createElement('div');
    ss.className = 'shooting-star';
    const angle = -30 - Math.random() * 20;
    const dist  = 200 + Math.random() * 300;
    const rad   = angle * Math.PI / 180;
    ss.style.cssText = `left:${10+Math.random()*80}%;top:${5+Math.random()*40}%;--sdur:${4+Math.random()*6}s;--sdelay:${i*1.5}s;--sx:${Math.cos(rad)*dist}px;--sy:${Math.sin(rad)*dist}px`;
    cosmos.appendChild(ss);
  }
}

// ══════════════════════════════════════════════
//  MONTH FX GENERATORS
// ══════════════════════════════════════════════
function fxJan(c) {
  const cols = ['rgba(100,180,255,1)','rgba(80,220,180,1)','rgba(180,100,255,1)','rgba(255,208,0,1)'];
  for (let i = 0; i < 4; i++) {
    const a = document.createElement('div');
    a.className = 'aurora';
    a.style.cssText = `bottom:${10+i*15}px;left:-50%;background:${cols[i]};--adur:${5+i*2}s;--adelay:${i*1.2}s`;
    c.appendChild(a);
  }
}
function fxFeb(c) {
  const h = ['❤️','🧡','💛','🤍'];
  for (let i = 0; i < 10; i++) {
    const el = document.createElement('div');
    el.className = 'heart-particle';
    el.textContent = h[i % h.length];
    el.style.cssText = `left:${5+Math.random()*90}%;bottom:5px;--hsize:${10+Math.random()*10}px;--hdur:${3+Math.random()*3}s;--hdelay:${Math.random()*4}s`;
    c.appendChild(el);
  }
}
function fxMar(c) {
  for (let i = 0; i < 12; i++) {
    const p = document.createElement('div');
    p.className = 'petal';
    const s = 6 + Math.random() * 8;
    p.style.cssText = `left:${Math.random()*95}%;top:${Math.random()*20}px;--pw:${s}px;--pdur:${3+Math.random()*4}s;--pdelay:${Math.random()*5}s`;
    c.appendChild(p);
  }
}
function fxApr(c) {
  for (let i = 0; i < 20; i++) {
    const r = document.createElement('div');
    r.className = 'raindrop';
    r.style.cssText = `left:${Math.random()*100}%;top:-5px;--rh:${8+Math.random()*14}px;--rdur:${0.6+Math.random()*0.8}s;--rdelay:${Math.random()*2}s`;
    c.appendChild(r);
  }
}
function fxMay(c) {
  for (let i = 0; i < 8; i++) {
    const f = document.createElement('div');
    f.className = 'firefly';
    f.style.cssText = `left:${10+Math.random()*80}%;top:${10+Math.random()*80}%;--ffdur:${4+Math.random()*4}s;--ffdelay:${Math.random()*4}s;--ffx1:${20-Math.random()*40}px;--ffy1:${-20+Math.random()*40}px;--ffx2:${-20+Math.random()*40}px;--ffy2:${20-Math.random()*40}px;--ffx3:${10-Math.random()*20}px;--ffy3:${-30+Math.random()*60}px`;
    c.appendChild(f);
  }
}
function fxJun(c) {
  for (let i = 0; i < 5; i++) {
    const f = document.createElement('div');
    f.className = 'flare';
    const s = (60 + i * 35) + 'px';
    f.style.cssText = `--fw:${s};--fdur:${2+i*0.8}s;--fdelay:${i*0.6}s`;
    c.appendChild(f);
  }
}
function fxJul(c) {
  for (let i = 0; i < 4; i++) {
    const l = document.createElement('div');
    l.className = 'lightning-bolt';
    l.style.cssText = `--lx:${15+i*22}%;--ldur:${3+Math.random()*4}s;--ldelay:${Math.random()*5}s`;
    c.appendChild(l);
  }
}
function fxAug(c) {
  for (let i = 0; i < 10; i++) {
    const m = document.createElement('div');
    m.className = 'meteor';
    m.style.cssText = `--mty:${Math.random()*60}%;--mtx:${Math.random()*80}%;--mlen:${20+Math.random()*40}px;--mtdur:${1+Math.random()*2}s;--mtdelay:${Math.random()*6}s`;
    c.appendChild(m);
  }
}
function fxSep(c) {
  [40, 70, 100, 130, 160].forEach((s, i) => {
    const o = document.createElement('div');
    o.className = 'orbit-ring';
    o.style.cssText = `--ow:${s}px;--oh:${s*0.4}px;--odur:${4+i*2}s;--odelay:${i*0.5}s`;
    c.appendChild(o);
  });
}
function fxOct(c) {
  for (let i = 0; i < 14; i++) {
    const e = document.createElement('div');
    e.className = 'ember';
    const sz = 2 + Math.random() * 4;
    const a  = Math.random() * Math.PI * 2;
    const d  = 20 + Math.random() * 50;
    e.style.cssText = `left:${10+Math.random()*80}%;bottom:${5+Math.random()*30}%;--ew:${sz}px;--eglow:${sz*2}px;--etx:${Math.cos(a)*d}px;--ety:${-(d*0.7)}px;--edur:${1.5+Math.random()*2}s;--edelay:${Math.random()*3}s`;
    c.appendChild(e);
  }
}
function fxNov(c) {
  const fl = ['*', '·', '✦', '❄'];
  for (let i = 0; i < 15; i++) {
    const s = document.createElement('div');
    s.className = 'snowflake';
    s.textContent = fl[i % fl.length];
    s.style.cssText = `left:${Math.random()*95}%;top:-5px;--ss:${8+Math.random()*10}px;--sdur2:${2+Math.random()*3}s;--sdelay2:${Math.random()*4}s;--swx:${-20+Math.random()*40}px`;
    c.appendChild(s);
  }
}
function fxDec(c) {
  const cols = ['rgba(255,208,0,.9)','rgba(255,106,0,.9)','rgba(255,255,255,.9)','rgba(255,180,60,.9)'];
  for (let i = 0; i < 30; i++) {
    const sp = document.createElement('div');
    sp.className = 'spark';
    const a = (i / 30) * Math.PI * 2;
    const d = 20 + Math.random() * 50;
    sp.style.cssText = `--spy:${20+Math.random()*60}%;--spx:${20+Math.random()*60}%;--spc:${cols[i%cols.length]};--spvx:${Math.cos(a)*d}px;--spvy:${Math.sin(a)*d}px;--spdur:${1+Math.random()*1.5}s;--spdelay:${Math.random()*4}s`;
    c.appendChild(sp);
  }
}

const FX = [fxJan,fxFeb,fxMar,fxApr,fxMay,fxJun,fxJul,fxAug,fxSep,fxOct,fxNov,fxDec];

// ══════════════════════════════════════════════
//  BUILD CALENDARS
// ══════════════════════════════════════════════
function buildCals(year) {
  const grid = document.getElementById('calGrid');
  grid.innerHTML = '';

  const today = new Date();
  const tY = today.getFullYear();
  const tM = today.getMonth();
  const tD = today.getDate();

  MONTHS.forEach((month, mi) => {
    // Card
    const card = document.createElement('div');
    card.className = 'cal-card';

    // FX canvas
    const canvas = document.createElement('div');
    canvas.className = 'cal-canvas';
    FX[mi](canvas);
    card.appendChild(canvas);

    // Month header
    const hdr = document.createElement('div');
    hdr.className = 'cal-header';
    hdr.innerHTML = `
      <span class="cal-month-name" style="color:${MCOLS[mi]}">${month}</span>
      <span class="cal-month-num">${String(mi + 1).padStart(2,'0')} / ${year}</span>`;
    card.appendChild(hdr);

    // Calendar body
    const body = document.createElement('div');
    body.className = 'cal-body';

    // Day name headers
    const dayHeader = document.createElement('div');
    dayHeader.className = 'cal-days-header';
    DAYS.forEach(d => {
      const dn = document.createElement('div');
      dn.className = 'cal-day-name';
      dn.textContent = d.slice(0, 2);
      dayHeader.appendChild(dn);
    });
    body.appendChild(dayHeader);

    // Days grid
    const daysWrap = document.createElement('div');
    daysWrap.className = 'cal-days';

    const firstDay    = new Date(year, mi, 1).getDay();
    const daysInMonth = new Date(year, mi + 1, 0).getDate();

    // Empty cells before 1st
    for (let e = 0; e < firstDay; e++) {
      const empty = document.createElement('div');
      empty.className = 'cal-day empty';
      daysWrap.appendChild(empty);
    }

    // Day cells
    for (let d = 1; d <= daysInMonth; d++) {
      // ── Declarations first ──
      const dow     = new Date(year, mi, d).getDay();
      const key     = dKey(year, mi, d);
      const dayBks  = bookings[key] || [];
      const booked  = dayBks.map(b => b.time);
      const isFull  = booked.length >= ALL_TIMES.length;
      const isPast  = year < tY || (year === tY && mi < tM) || (year === tY && mi === tM && d < tD);
      const isToday = year === tY && mi === tM && d === tD;

      // ── Build cell ──
      const el = document.createElement('div');
      el.className = 'cal-day';

      // Day number
      const dayNum = document.createElement('span');
      dayNum.className = 'cal-day-num';
      dayNum.textContent = d;
      el.appendChild(dayNum);

      // Show booked time pills if any bookings exist
      if (dayBks.length > 0) {
        const pills = document.createElement('div');
        pills.className = 'cal-day-pills';
        const sortedBks = [...dayBks].sort(
          (a, b) => ALL_TIMES.indexOf(a.time) - ALL_TIMES.indexOf(b.time)
        );
        sortedBks.forEach(b => {
          const pill = document.createElement('span');
          pill.className = 'cal-day-pill';
          pill.textContent = b.time;
          pills.appendChild(pill);
        });
        el.appendChild(pills);
      }

      if (dow === 0)         el.classList.add('sunday');
      if (isPast)            el.classList.add('past');
      if (isToday)           el.classList.add('today');
      if (dayBks.length > 0) el.classList.add('has-booking');
      if (isFull)            el.classList.add('fully-booked');

      if (!isPast) {
        el.addEventListener('click', () => {
          if (isOwner) openOwnerView(year, mi, d);
          else         openBooking(year, mi, d, el, booked, isFull);
        });
      }
      daysWrap.appendChild(el);
    }

    body.appendChild(daysWrap);
    card.appendChild(body);
    grid.appendChild(card);
  });
}

// ══════════════════════════════════════════════
//  STICKY FOOTER
// ══════════════════════════════════════════════
function buildFooter() {
  const key   = phToday();
  const items = bookings[key] || [];
  const run   = document.getElementById('footerRun');

  if (!items.length) {
    run.innerHTML = '<span class="f-empty">No appointments today.</span>';
    run.style.animation = 'none';
    return;
  }

  const sorted = [...items].sort(
    (a, b) => ALL_TIMES.indexOf(a.time) - ALL_TIMES.indexOf(b.time)
  );

  const mkItem = b =>
    `<span class="f-item">
      <span class="f-dot"></span>
      <b>${b.name}</b>
      <span class="f-sep">·</span>
      <span>${b.topic}</span>
      <span class="f-sep">@</span>
      <span>${b.time}</span>
    </span>`;

  const content = sorted.map(mkItem).join('<span class="f-sep"> | </span>');
  run.innerHTML  = content + content; // duplicate for seamless loop
  run.style.animation = '';
  run.style.animationDuration = Math.max(15, items.length * 8) + 's';
}

// ══════════════════════════════════════════════
//  DAY VIEW — shows existing appointments first,
//  then "Add Appointment" button at the bottom
// ══════════════════════════════════════════════
function openBooking(y, m, d, el, booked, isFull) {
  // Highlight selected day
  document.querySelectorAll('.cal-day.selected').forEach(e => e.classList.remove('selected'));
  el.classList.add('selected');
  selDate = { y, m, d };

  const key      = dKey(y, m, d);
  const dayBks   = bookings[key] || [];
  const dateStr  = `${MONTHS[m]} ${d}, ${y}`;

  // Set date label
  document.getElementById('bookDateLbl').textContent  = `📅 ${dateStr}`;
  document.getElementById('bookDateLbl2').textContent = `📅 ${dateStr}`;
  const titleEl = document.getElementById('dayViewTitle');
  if (titleEl) titleEl.textContent = dateStr;

  // ── Build existing appointments list ──
  const listEl = document.getElementById('dayApptList');
  listEl.innerHTML = '';

  if (dayBks.length > 0) {
    const sorted = [...dayBks].sort(
      (a, b) => ALL_TIMES.indexOf(a.time) - ALL_TIMES.indexOf(b.time)
    );
    sorted.forEach(b => {
      const item = document.createElement('div');
      item.className = 'day-appt-item';
      item.innerHTML = `
        <div class="day-appt-time">${b.time}</div>
        <div class="day-appt-info">
          <span class="day-appt-name">${b.name}</span>
          <span class="day-appt-topic">${b.topic}</span>
        </div>`;
      listEl.appendChild(item);
    });
  } else {
    listEl.innerHTML = '<div class="day-appt-empty">No appointments yet on this date.</div>';
  }

  // ── Show/hide Add button based on availability ──
  const addBtn = document.getElementById('showBookFormBtn');
  if (isFull) {
    addBtn.textContent = '🔴 Fully Booked';
    addBtn.disabled = true;
    addBtn.style.opacity = '0.5';
  } else {
    addBtn.textContent = '➕ Add Appointment';
    addBtn.disabled = false;
    addBtn.style.opacity = '1';
  }

  // ── Reset: show day view, hide form & success ──
  document.getElementById('dayView').style.display    = 'block';
  document.getElementById('bookForm').style.display   = 'none';
  document.getElementById('bookOk').style.display     = 'none';
  document.getElementById('bookAnotherBtn').style.display = 'none';
  openOverlay('bookOv');
}

// ── Show booking form when Add button clicked ──
document.getElementById('showBookFormBtn').addEventListener('click', () => {
  const key    = dKey(selDate.y, selDate.m, selDate.d);
  const dayBks = bookings[key] || [];
  const booked = dayBks.map(b => b.time);

  // Populate available time slots
  const sel = document.getElementById('bTime');
  sel.innerHTML = '<option value="">Select time</option>';
  ALL_TIMES.forEach(t => {
    if (!booked.includes(t)) {
      const o = document.createElement('option');
      o.value = o.textContent = t;
      sel.appendChild(o);
    }
  });

  // Reset all fields
  ['bName','bEmail','bContact','bNotes'].forEach(id => {
    const e = document.getElementById(id);
    e.value = '';
    e.classList.remove('err');
  });
  ['bMethod','bTime','bTopic'].forEach(id => {
    const e = document.getElementById(id);
    e.value = '';
    e.classList.remove('err');
  });

  document.getElementById('dayView').style.display  = 'none';
  document.getElementById('bookForm').style.display = 'block';
  document.getElementById('bookOk').style.display   = 'none';
});

// ── Back to day view from form ──
document.getElementById('backToDayBtn').addEventListener('click', () => {
  document.getElementById('dayView').style.display  = 'block';
  document.getElementById('bookForm').style.display = 'none';
});

document.getElementById('bookSubmit').addEventListener('click', async () => {
  // Validate all required fields
  const fieldIds = ['bName','bEmail','bMethod','bContact','bTime','bTopic','bNotes'];
  let valid = true;

  fieldIds.forEach(id => {
    const el = document.getElementById(id);
    el.classList.remove('err');
    if (!el.value.trim()) { el.classList.add('err'); valid = false; }
  });

  // Email format check
  const emailEl = document.getElementById('bEmail');
  if (emailEl.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailEl.value)) {
    emailEl.classList.add('err');
    valid = false;
  }

  if (!valid) return;

  const btn = document.getElementById('bookSubmit');
  btn.disabled    = true;
  btn.textContent = 'Booking...';

  try {
    await addDoc(collection(db, COL), {
      date:     dKey(selDate.y, selDate.m, selDate.d),
      name:     document.getElementById('bName').value.trim(),
      email:    document.getElementById('bEmail').value.trim(),
      method:   document.getElementById('bMethod').value,
      contact:  document.getElementById('bContact').value.trim(),
      time:     document.getElementById('bTime').value,
      topic:    document.getElementById('bTopic').value,
      notes:    document.getElementById('bNotes').value.trim(),
      bookedAt: new Date().toISOString()
    });

    document.getElementById('bookForm').style.display = 'none';
    document.getElementById('bookOk').style.display   = 'block';
    document.getElementById('dayView').style.display  = 'none';
    document.getElementById('bookAnotherBtn').style.display = 'block';

  } catch (err) {
    console.error('[CMC Appt] Submit error:', err);
    alert('Booking failed: ' + (err.message || 'Please try again.'));
  } finally {
    btn.disabled    = false;
    btn.textContent = 'Confirm Appointment →';
  }
});

// ══════════════════════════════════════════════
//  OWNER VIEW MODAL
// ══════════════════════════════════════════════
function openOwnerView(y, m, d) {
  const key    = dKey(y, m, d);
  const items  = bookings[key] || [];
  const sorted = [...items].sort(
    (a, b) => ALL_TIMES.indexOf(a.time) - ALL_TIMES.indexOf(b.time)
  );

  document.getElementById('ownerDLbl').textContent  = `📅 ${MONTHS[m]} ${d}, ${y}`;
  document.getElementById('ownerDTitle').textContent = `${MONTHS[m]} ${d}`;

  const list = document.getElementById('ownerList');
  list.innerHTML = '';

  if (!sorted.length) {
    list.innerHTML = '<div class="appt-empty">No appointments on this date.</div>';
  } else {
    sorted.forEach(b => {
      const card = document.createElement('div');
      card.className = 'appt-card';
      card.innerHTML = `
        <div class="appt-card-top">
          <span class="appt-name">${b.name}</span>
          <span class="appt-time-badge">⏰ ${b.time}</span>
        </div>
        <div class="appt-row"><span class="appt-lbl">Email</span><span class="appt-val">${b.email}</span></div>
        <div class="appt-row"><span class="appt-lbl">Contact</span><span class="appt-val">${b.method}: ${b.contact}</span></div>
        <div class="appt-row"><span class="appt-lbl">Topic</span><span class="appt-val">${b.topic}</span></div>
        <div class="appt-row"><span class="appt-lbl">Notes</span><span class="appt-val">${b.notes}</span></div>
        <button class="del-btn" data-id="${b.id}" data-y="${y}" data-m="${m}" data-d="${d}">🗑 Remove</button>`;
      list.appendChild(card);
    });

    list.querySelectorAll('.del-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (!confirm('Remove this appointment?')) return;
        try {
          await deleteDoc(doc(db, COL, btn.dataset.id));
          openOwnerView(+btn.dataset.y, +btn.dataset.m, +btn.dataset.d);
        } catch (err) {
          alert('Delete failed: ' + err.message);
        }
      });
    });
  }

  openOverlay('ownerOv');
}

// ══════════════════════════════════════════════
//  OWNER LOGIN
// ══════════════════════════════════════════════
document.getElementById('ownerBtn').addEventListener('click', () => {
  if (isOwner) {
    // Log out of owner mode
    isOwner = false;
    const ob = document.getElementById('ownerBtn');
    ob.textContent = '🔐 Owner';
    ob.classList.remove('active');
    buildCals(curYear);
    return;
  }

  // Show login modal
  document.getElementById('ownerPass').value = '';
  document.getElementById('pinErr').style.display = 'none';
  document.getElementById('ownerPass').classList.remove('err');
  openOverlay('loginOv');
  setTimeout(() => document.getElementById('ownerPass').focus(), 300);
});

document.getElementById('loginSubmit').addEventListener('click', () => {
  const pass = document.getElementById('ownerPass').value;
  if (pass === OWNER_PASS) {
    isOwner = true;
    closeOverlay('loginOv');
    const ob = document.getElementById('ownerBtn');
    ob.textContent = '✅ Owner Mode';
    ob.classList.add('active');
    buildCals(curYear);
  } else {
    document.getElementById('pinErr').style.display = 'block';
    document.getElementById('ownerPass').classList.add('err');
  }
});

document.getElementById('ownerPass').addEventListener('keydown', e => {
  if (e.key === 'Enter') document.getElementById('loginSubmit').click();
});

// ══════════════════════════════════════════════
//  MODAL CLOSE HANDLERS
// ══════════════════════════════════════════════
document.getElementById('bookClose').addEventListener('click',  () => closeOverlay('bookOv'));
document.getElementById('loginClose').addEventListener('click', () => closeOverlay('loginOv'));
document.getElementById('ownerClose').addEventListener('click', () => closeOverlay('ownerOv'));

['bookOv','loginOv','ownerOv'].forEach(id => {
  document.getElementById(id).addEventListener('click', e => {
    if (e.target === e.currentTarget) closeOverlay(id);
  });
});

// ══════════════════════════════════════════════
//  YEAR NAVIGATION
// ══════════════════════════════════════════════
document.getElementById('prevYear').addEventListener('click', () => {
  curYear--;
  document.getElementById('yearDisplay').textContent = curYear;
  buildCals(curYear);
});
document.getElementById('nextYear').addEventListener('click', () => {
  curYear++;
  document.getElementById('yearDisplay').textContent = curYear;
  buildCals(curYear);
});

// ══════════════════════════════════════════════
//  BOOT — calendars render immediately, then
//  Firebase updates them once data arrives
// ══════════════════════════════════════════════
// "Book Another" → back to day view refreshed
document.getElementById('bookAnotherBtn').addEventListener('click', () => {
  if (!selDate) return;
  const { y, m, d } = selDate;
  const key     = dKey(y, m, d);
  const dayBks  = bookings[key] || [];
  const booked  = dayBks.map(b => b.time);
  const isFull  = booked.length >= ALL_TIMES.length;
  const el      = document.querySelector('.cal-day.selected');
  if (el) openBooking(y, m, d, el, booked, isFull);
  else closeOverlay('bookOv');
});

document.getElementById('yearDisplay').textContent = curYear;
buildCosmos();
buildCals(curYear);   // render immediately with empty bookings
buildFooter();        // show footer immediately
listenBookings();     // Firebase refreshes both once connected