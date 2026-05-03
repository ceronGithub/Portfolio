/* ============================================
   CHAT JS — Ceron Matthew Calsena
   CMC Portfolio · 2026
   Firestore collections:
     conversations/{ id, name, email, phone, tag, createdAt, lastMessage, lastAt }
     conversations/{id}/messages/{ sender, text, createdAt, auto }
============================================ */

import { initializeApp, getApps }
  from 'firebase/app';
import {
  getFirestore, collection, doc, addDoc, updateDoc, deleteDoc,
  onSnapshot, query, orderBy, serverTimestamp, getDoc
} from 'firebase/firestore';

// ── Firebase ─────────────────────────────────────────
const cfg = {
  apiKey:            'AIzaSyDbBqV7m8WkDnTYtwLwj-P5zQNaTEMDI9g',
  authDomain:        'portfolio-ae245.firebaseapp.com',
  projectId:         'portfolio-ae245',
  storageBucket:     'portfolio-ae245.firebasestorage.app',
  messagingSenderId: '530260965137',
  appId:             '1:530260965137:web:0d27cc680436f3d11d3eb0'
};
const app = getApps().length ? getApps()[0] : initializeApp(cfg);
const db  = getFirestore(app);
const COL = 'conversations';

// ── Config ────────────────────────────────────────────
const OWNER_PASS   = 'CMC2026';
const AUTO_REPLY   = "Hi! Thanks for reaching out to Ceron. 🙂 Your message has been received and I'll get back to you as soon as possible. Please keep this page open or note your name to return to your conversation.";
const STORAGE_KEY  = 'cmc_chat_visitor';

// ── State ─────────────────────────────────────────────
let isOwner        = false;
let activeConvoId  = null;
let msgUnsub       = null;
let convoUnsub     = null;
let allConvos      = [];

// ── Visitor identity (persisted in localStorage) ──────
/**
 * getVisitorId — Visitor Identity Reader
 * WHAT: Reads the visitor's conversation ID from localStorage.
 * HOW: Catches exceptions (private/incognito mode) and returns null on failure.
 * CALLED BY: selectConvo(), checkReturnVisitor(), newConvoBtn click listener.
 */
function getVisitorId()   { try { return localStorage.getItem(STORAGE_KEY); } catch { return null; } }

/**
 * setVisitorId — Visitor Identity Writer
 * WHAT: Persists the visitor's conversation ID to localStorage.
 * HOW: Silent fail on write errors (private/incognito mode).
 * CALLED BY: ncSubmit click listener after a new conversation is created.
 */
function setVisitorId(id) { try { localStorage.setItem(STORAGE_KEY, id); } catch {} }

/**
 * buildCosmos — Cosmos Background Builder (Chat Page)
 * WHAT: Generates animated nebulas and stars inside the #cosmos element for the chat page.
 * HOW: Creates DOM elements with randomized CSS custom properties for size, position, and timing.
 * CALLED BY: Boot sequence at the bottom of the file.
 */
function buildCosmos() {
  const cosmos = document.getElementById('cosmos');
  if (!cosmos) return;
  const nc = ['rgba(255,106,0,1)','rgba(255,208,0,1)'];
  for (let i = 0; i < 3; i++) {
    const n = document.createElement('div'); n.className = 'nebula';
    const s = 200 + Math.random() * 300;
    n.style.cssText = `width:${s}px;height:${s}px;left:${Math.random()*100}%;top:${Math.random()*100}%;background:${nc[i%nc.length]};animation-delay:${i*4}s;animation-duration:${18+i*3}s`;
    cosmos.appendChild(n);
  }
  for (let i = 0; i < 120; i++) {
    const s = document.createElement('div'); s.className = 'star';
    const sz = Math.random() * 2 + 0.5;
    s.style.cssText = `width:${sz}px;height:${sz}px;left:${Math.random()*100}%;top:${Math.random()*100}%;--dur:${2+Math.random()*4}s;--delay:${Math.random()*5}s;--op:${0.3+Math.random()*0.6}`;
    cosmos.appendChild(s);
  }
}

// ── Helpers ───────────────────────────────────────────
/**
 * initials — Name Initials Extractor
 * WHAT: Extracts up to 2 uppercase initials from a full name string.
 * HOW: Splits by space, takes first character of each word, joins and slices to 2 chars.
 * CALLED BY: renderSidebar(), selectConvo() header, renderMessage().
 */
function initials(name = '') {
  return name.trim().split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?';
}

/**
 * timeAgo — Relative Timestamp Formatter
 * WHAT: Converts a Firestore Timestamp or Date into a human-readable relative time string.
 * HOW: Computes ms difference from now; returns 'just now', 'Xm ago', 'Xh ago', or locale date.
 * CALLED BY: renderSidebar() for conversation last-message time display.
 */
function timeAgo(ts) {
  if (!ts) return '';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  const diff = Date.now() - d.getTime();
  if (diff < 60000)   return 'just now';
  if (diff < 3600000) return Math.floor(diff/60000) + 'm ago';
  if (diff < 86400000)return Math.floor(diff/3600000) + 'h ago';
  return d.toLocaleDateString('en-PH', {month:'short', day:'numeric'});
}
/**
 * formatTime — Message Timestamp Formatter
 * WHAT: Formats a Firestore Timestamp or Date into 'HH:MM AM/PM' using en-PH locale.
 * HOW: Converts Firestore Timestamp via .toDate() then uses toLocaleTimeString.
 * CALLED BY: renderMessage() for each chat bubble time label.
 */
function formatTime(ts) {
  if (!ts) return '';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleTimeString('en-PH', {hour:'2-digit', minute:'2-digit'});
}

/**
 * closeModal — Modal Close Helper
 * WHAT: Removes the 'open' class from the modal element matching the given ID.
 * HOW: Direct classList.remove; CSS handles hide transition.
 * CALLED BY: Close button listeners and backdrop click listeners.
 */
function closeModal(id) { document.getElementById(id).classList.remove('open'); }

/**
 * openModal — Modal Open Helper
 * WHAT: Adds the 'open' class to the modal element matching the given ID.
 * HOW: Direct classList.add; CSS handles show transition.
 * CALLED BY: ownerBtn click listener, newConvoBtn click listener.
 */
function openModal(id)  { document.getElementById(id).classList.add('open'); }

/**
 * esc — HTML Escape Utility
 * WHAT: Escapes HTML special characters to prevent XSS in dynamically injected innerHTML.
 * HOW: Replaces &, <, >, with their HTML entity equivalents.
 * CALLED BY: renderSidebar(), renderMessage() wherever user data is injected into HTML.
 */
function esc(s) { return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

// ── TAG classes ───────────────────────────────────────
const TAG_CLASS = { new:'tag-new', read:'tag-read', replied:'tag-replied', starred:'tag-starred', closed:'tag-closed' };
const TAG_LABEL = { new:'🟡 New', read:'⚪ Read', replied:'🟢 Replied', starred:'🟠 Starred', closed:'🔴 Closed' };

/**
 * renderSidebar — Conversation List Renderer
 * WHAT: Clears and re-renders the sidebar conversation list, filtered by the search input.
 * HOW: Filters allConvos by name/email match; renders owner view (full details + tag) vs.
 *      visitor view (name + avatar only). Attaches selectConvo() click listener per item.
 * CALLED BY: listen() onSnapshot callback, ownerBtn login/logout, sidebarSearch input.
 */
function renderSidebar(convos) {
  const list  = document.getElementById('convoList');
  const query = document.getElementById('sidebarSearch').value.toLowerCase();
  list.innerHTML = '';

  const filtered = convos.filter(c =>
    !query || c.name.toLowerCase().includes(query) || c.email.toLowerCase().includes(query)
  );

  if (!filtered.length) {
    list.innerHTML = '<div style="padding:20px;text-align:center;font-size:12px;color:rgba(255,255,255,.2);">No conversations yet.</div>';
    return;
  }

  // All visitors see all conversations (name only); owner sees full details
  filtered.forEach(c => {
    const item = document.createElement('div');
    item.className = 'convo-item' + (c.id === activeConvoId ? ' active' : '');
    item.dataset.id = c.id;

    if (isOwner) {
      const tagCls = TAG_CLASS[c.tag] || 'tag-new';
      item.innerHTML = `
        <div class="convo-avatar">${esc(initials(c.name))}</div>
        <div class="convo-info">
          <div class="convo-name">${esc(c.name)}</div>
          <div class="convo-preview">${esc(c.lastMessage || 'No messages yet')}</div>
        </div>
        <div class="convo-meta">
          <span class="convo-time">${timeAgo(c.lastAt || c.createdAt)}</span>
          <span class="convo-tag ${tagCls}">${TAG_LABEL[c.tag] || '🟡 New'}</span>
        </div>`;
    } else {
      // Visitor sees name + avatar only — no preview, no tag, no time
      item.innerHTML = `
        <div class="convo-avatar">${esc(initials(c.name))}</div>
        <div class="convo-info">
          <div class="convo-name">${esc(c.name)}</div>
        </div>`;
    }

    item.addEventListener('click', () => selectConvo(c));
    list.appendChild(item);
  });
}

/**
 * selectConvo — Conversation Selector
 * WHAT: Activates a conversation in the chat panel, showing its messages and updating the header.
 * HOW: Sets activeConvoId, refreshes sidebar active state, updates header info, shows/hides
 *      owner action controls, blurs messages for non-owners viewing others' convos,
 *      and marks 'new' conversations as 'read' if the owner is viewing.
 * CALLED BY: renderSidebar() item click listeners, checkReturnVisitor() returnBtn handler.
 */
function selectConvo(c) {
  activeConvoId = c.id;
  renderSidebar(allConvos);

  // Show chat active area
  document.getElementById('chatEmpty').style.display  = 'none';
  const chatActive = document.getElementById('chatActive');
  chatActive.style.display = 'flex';

  // Header
  document.getElementById('chatHeaderAvatar').textContent = initials(c.name);
  document.getElementById('chatHeaderName').textContent   = c.name;
  const visitorId = getVisitorId();
  // Only owner or the convo owner sees email/phone
  document.getElementById('chatHeaderSub').textContent =
    (isOwner || c.id === visitorId) ? `${c.email} · ${c.phone}` : 'Conversation is private';

  // Owner actions
  const ownerActions = document.getElementById('ownerActions');
  ownerActions.style.display = isOwner ? 'flex' : 'none';
  if (isOwner) {
    document.getElementById('tagSelect').value = c.tag || 'new';
  }

  // Messages visibility
  const msgDiv  = document.getElementById('chatMessages');
  const confDiv = document.getElementById('chatConfidential');

  const chatMain   = document.getElementById('chatMain');
  const isOwnConvo = isOwner || c.id === visitorId;

  if (isOwnConvo) {
    msgDiv.style.display  = 'flex';
    confDiv.style.display = 'none';
    chatMain.classList.remove('chat-main--blurred');
    loadMessages(c.id);
  } else {
    // Show messages blurred — visitor can see there IS a convo but not read it
    msgDiv.style.display  = 'flex';
    confDiv.style.display = 'none';
    chatMain.classList.add('chat-main--blurred');
    loadMessages(c.id);
  }

  // Input area: only show for owner OR the visitor who owns this convo
  const inputArea = document.getElementById('chatInputArea');
  inputArea.style.display = isOwnConvo ? 'flex' : 'none';

  // Mark as read if owner opening new convo
  if (isOwner && c.tag === 'new') {
    updateDoc(doc(db, COL, c.id), { tag: 'read' }).catch(() => {});
  }
}

/**
 * loadMessages — Realtime Message Stream Loader
 * WHAT: Subscribes to the messages subcollection of a conversation and renders them in real time.
 * HOW: Unsubscribes any previous msgUnsub listener, queries messages ordered by createdAt asc,
 *      clears and re-renders all messages on each snapshot, then scrolls to the bottom.
 * CALLED BY: selectConvo() whenever a conversation is activated.
 */
function loadMessages(convoId) {
  if (msgUnsub) msgUnsub();

  const msgCol = collection(db, COL, convoId, 'messages');
  const q      = query(msgCol, orderBy('createdAt', 'asc'));
  const msgDiv = document.getElementById('chatMessages');

  msgUnsub = onSnapshot(q, snap => {
    msgDiv.innerHTML = '';
    snap.docs.forEach(d => renderMessage(d.data(), convoId));
    msgDiv.scrollTop = msgDiv.scrollHeight;
  });
}

/**
 * renderMessage — Single Message Bubble Renderer
 * WHAT: Creates and appends a chat message bubble (with avatar, text, and timestamp) to #chatMessages.
 * HOW: Determines owner vs. visitor layout; owner messages align right (inner then avatar),
 *      visitor messages align left (avatar then inner). Auto-reply bubbles get 'auto-reply' class.
 * CALLED BY: loadMessages() onSnapshot for each message document.
 */
function renderMessage(msg, convoId) {
  const msgDiv = document.getElementById('chatMessages');
  const isOwnerMsg = msg.sender === 'owner';
  const isAuto     = msg.auto === true;

  const wrap = document.createElement('div');
  wrap.className = 'msg-wrap' + (isOwnerMsg ? ' own' : '');

  const avEl = document.createElement('div');
  avEl.className = isOwnerMsg ? 'msg-avatar owner-av' : 'msg-avatar';
  avEl.textContent = isOwnerMsg ? '🔑' : initials(msg.senderName || 'V');

  const bubble = document.createElement('div');
  bubble.className = 'msg-bubble' + (isAuto ? ' auto-reply' : '');
  bubble.textContent = msg.text;

  const time = document.createElement('div');
  time.className = 'msg-time';
  time.textContent = formatTime(msg.createdAt);

  const inner = document.createElement('div');
  inner.style.cssText = 'display:flex;flex-direction:column;max-width:100%;min-width:0;flex:1;' + (isOwnerMsg ? 'align-items:flex-end;' : 'align-items:flex-start;');
  inner.appendChild(bubble);
  inner.appendChild(time);

  // Always: avatar on outside edge, bubble inner toward center
  // Owner: [inner][avEl] with justify-content:flex-end (no row-reverse needed)
  // Visitor: [avEl][inner]
  if (isOwnerMsg) {
    wrap.appendChild(inner);
    wrap.appendChild(avEl);
  } else {
    wrap.appendChild(avEl);
    wrap.appendChild(inner);
  }

  msgDiv.appendChild(wrap);
}

/**
 * sendMessage — Chat Message Sender
 * WHAT: Sends the typed message to Firestore and updates the conversation's lastMessage/tag.
 * HOW: Reads chatInput value, disables button during send, writes to messages subcollection
 *      via addDoc, then updates the parent conversation doc with lastMessage and tag.
 *      Owner sends tag as 'replied'; visitor sends tag as 'new'.
 * CALLED BY: chatSendBtn click listener, chatInput Enter keydown listener.
 */
async function sendMessage() {
  const input = document.getElementById('chatInput');
  const text  = input.value.trim();
  if (!text || !activeConvoId) return;

  const btn = document.getElementById('chatSendBtn');
  btn.disabled = true;
  input.value  = '';
  input.style.height = 'auto';

  const sender     = isOwner ? 'owner' : 'visitor';
  const convoSnap  = await getDoc(doc(db, COL, activeConvoId)).catch(() => null);
  const senderName = isOwner ? 'Ceron' : (convoSnap?.data()?.name || 'Visitor');

  try {
    const msgCol = collection(db, COL, activeConvoId, 'messages');
    await addDoc(msgCol, { sender, senderName, text, createdAt: serverTimestamp(), auto: false });

    await updateDoc(doc(db, COL, activeConvoId), {
      lastMessage: text,
      lastAt: serverTimestamp(),
      tag: isOwner ? 'replied' : 'new'
    });
  } catch(e) {
    console.error('[CMC Chat] Send error:', e);
    alert('Failed to send: ' + e.message);
  } finally {
    btn.disabled = false;
    input.focus();
  }
}

// ── Create new conversation ───────────────────────────
document.getElementById('ncSubmit').addEventListener('click', async () => {
  const name    = document.getElementById('ncName').value.trim();
  const email   = document.getElementById('ncEmail').value.trim();
  const phone   = document.getElementById('ncPhone').value.trim();
  const message = document.getElementById('ncMessage').value.trim();

  // Validate
  let valid = true;
  ['ncName','ncEmail','ncPhone','ncMessage'].forEach(id => {
    const el = document.getElementById(id);
    el.classList.remove('err');
    if (!el.value.trim()) { el.classList.add('err'); valid = false; }
  });
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    document.getElementById('ncEmail').classList.add('err'); valid = false;
  }
  if (!valid) return;

  const btn = document.getElementById('ncSubmit');
  btn.disabled = true; btn.textContent = 'Creating...';

  try {
    // Create conversation doc
    const convoRef = await addDoc(collection(db, COL), {
      name, email, phone,
      tag: 'new',
      lastMessage: message,
      lastAt: serverTimestamp(),
      createdAt: serverTimestamp()
    });

    // Save visitor ID to localStorage so they can return
    setVisitorId(convoRef.id);

    // Add first message
    const msgCol = collection(db, COL, convoRef.id, 'messages');
    await addDoc(msgCol, { sender: 'visitor', senderName: name, text: message, createdAt: serverTimestamp(), auto: false });

    // Auto-reply
    await new Promise(r => setTimeout(r, 800));
    await addDoc(msgCol, { sender: 'owner', senderName: 'Ceron', text: AUTO_REPLY, createdAt: serverTimestamp(), auto: true });

    closeModal('newConvoModal');

    // Reset form
    ['ncName','ncEmail','ncPhone','ncMessage'].forEach(id => { document.getElementById(id).value = ''; });

  } catch(e) {
    console.error('[CMC Chat] Create error:', e);
    alert('Failed: ' + e.message);
  } finally {
    btn.disabled = false; btn.textContent = 'Start Conversation →';
  }
});

// ── Owner: tag change ─────────────────────────────────
document.getElementById('tagSelect').addEventListener('change', async () => {
  if (!activeConvoId || !isOwner) return;
  const tag = document.getElementById('tagSelect').value;
  await updateDoc(doc(db, COL, activeConvoId), { tag }).catch(console.error);
});

// ── Owner: delete conversation ────────────────────────
document.getElementById('deleteConvoBtn').addEventListener('click', async () => {
  if (!activeConvoId || !isOwner) return;
  if (!confirm('Delete this entire conversation? This cannot be undone.')) return;
  try {
    await deleteDoc(doc(db, COL, activeConvoId));
    activeConvoId = null;
    document.getElementById('chatEmpty').style.display  = 'flex';
    document.getElementById('chatActive').style.display = 'none';
    if (msgUnsub) { msgUnsub(); msgUnsub = null; }
  } catch(e) { alert('Delete failed: ' + e.message); }
});

// ── Owner login ───────────────────────────────────────
document.getElementById('ownerBtn').addEventListener('click', () => {
  if (isOwner) {
    isOwner = false;
    const ob = document.getElementById('ownerBtn');
    ob.textContent = '🔐 Owner'; ob.classList.remove('active');
    activeConvoId = null;
    document.getElementById('chatEmpty').style.display  = 'flex';
    document.getElementById('chatActive').style.display = 'none';
    renderSidebar(allConvos);
    return;
  }
  document.getElementById('ownerPass').value = '';
  document.getElementById('pinErr').style.display = 'none';
  openModal('ownerLoginModal');
  setTimeout(() => document.getElementById('ownerPass').focus(), 300);
});

document.getElementById('ownerLoginSubmit').addEventListener('click', () => {
  const pass = document.getElementById('ownerPass').value;
  if (pass === OWNER_PASS) {
    isOwner = true;
    closeModal('ownerLoginModal');
    const ob = document.getElementById('ownerBtn');
    ob.textContent = '✅ Owner Mode'; ob.classList.add('active');
    renderSidebar(allConvos);
  } else {
    document.getElementById('pinErr').style.display = 'block';
    document.getElementById('ownerPass').classList.add('err');
  }
});
document.getElementById('ownerPass').addEventListener('keydown', e => {
  if (e.key === 'Enter') document.getElementById('ownerLoginSubmit').click();
});

// ── Send button & Enter key ───────────────────────────
document.getElementById('chatSendBtn').addEventListener('click', sendMessage);
document.getElementById('chatInput').addEventListener('keydown', e => {
  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
});
// Auto-resize textarea
document.getElementById('chatInput').addEventListener('input', function() {
  this.style.height = 'auto';
  this.style.height = Math.min(this.scrollHeight, 120) + 'px';
});

// ── Modal close handlers ──────────────────────────────
document.getElementById('newConvoClose').addEventListener('click',    () => closeModal('newConvoModal'));
document.getElementById('ownerLoginClose').addEventListener('click',  () => closeModal('ownerLoginModal'));
['newConvoModal','ownerLoginModal'].forEach(id => {
  document.getElementById(id).addEventListener('click', e => {
    if (e.target === e.currentTarget) closeModal(id);
  });
});

// ── New convo button ──────────────────────────────────
document.getElementById('newConvoBtn').addEventListener('click', () => {
  // If visitor already has a convo, ask if they want to start a new one
  const existingId = getVisitorId();
  if (existingId && !isOwner) {
    if (!confirm('You already have an existing conversation. Start a new one?')) return;
  }
  ['ncName','ncEmail','ncPhone','ncMessage'].forEach(id => {
    document.getElementById(id).value = '';
    document.getElementById(id).classList.remove('err');
  });
  openModal('newConvoModal');
});

// ── Sidebar search ────────────────────────────────────
document.getElementById('sidebarSearch').addEventListener('input', () => renderSidebar(allConvos));

/**
 * checkReturnVisitor — Return Visitor Banner Handler
 * WHAT: Checks if the current browser session has a stored conversation ID and shows
 *       a welcome-back banner if that conversation still exists.
 * HOW: Reads getVisitorId() from localStorage, finds the matching conversation in allConvos,
 *      populates #returnName, shows the banner, and attaches a selectConvo handler to the button.
 * CALLED BY: listen() onSnapshot callback after allConvos is refreshed.
 */
function checkReturnVisitor() {
  const id = getVisitorId();
  if (!id || isOwner) return;
  const convo = allConvos.find(c => c.id === id);
  if (!convo) return;
  const banner = document.getElementById('returnBanner');
  document.getElementById('returnName').textContent = convo.name;
  banner.classList.add('show');
  document.getElementById('returnBtn').onclick = () => {
    banner.classList.remove('show');
    selectConvo(convo);
  };
}

/**
 * listen — Firestore Conversation Realtime Listener
 * WHAT: Subscribes to all conversations ordered by lastAt desc and keeps allConvos in sync.
 * HOW: onSnapshot updates allConvos[], re-renders sidebar, checks return visitor, and
 *      refreshes the active convo's tag select if owner has one open.
 * CALLED BY: Boot sequence at the bottom of the file.
 */
function listen() {
  const q = query(collection(db, COL), orderBy('lastAt', 'desc'));
  convoUnsub = onSnapshot(q, snap => {
    allConvos = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    renderSidebar(allConvos);
    checkReturnVisitor();

    // Refresh active convo header if open
    if (activeConvoId) {
      const updated = allConvos.find(c => c.id === activeConvoId);
      if (updated && isOwner) {
        document.getElementById('tagSelect').value = updated.tag || 'new';
      }
    }
  }, err => console.error('[CMC Chat] Listen error:', err));
}

// ── Boot ──────────────────────────────────────────────
buildCosmos();
listen();