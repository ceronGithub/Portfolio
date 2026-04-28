/* ==========================================================
   bag-explosion.js — Scroll-triggered bag explosion canvas
   Experience section background animation
========================================================== */
(function () {
  const canvas  = document.getElementById('bagExplosionCanvas');
  if (!canvas) return;
  const ctx     = canvas.getContext('2d');
  const section = document.getElementById('experience');

  /* ── particles pool ── */
  const PARTICLES = [];
  const WORDS = [
    '{ }', '</>', 'PHP', 'SQL', 'Git', 'CSS', 'API',
    'JS',  'C#',  '.NET','MVC','B.S.', 'DLSU', '6yrs',
    'Laravel', 'Firebase', 'REST', 'Claude', 'Deploy',
    'Sprint', 'Agile', 'Debug', 'Build', 'Ship', '∑',
    '📜', '💡', '🎓', '⚙️', '🏆'
  ];

  let exploded   = false;
  let bagScale   = 1;       // 1 → 0 as bag shakes then disappears
  let bagShake   = 0;
  let bagOpacity = 1;
  let phase      = 'idle';  // idle | shaking | exploding | done
  let phaseTimer = 0;
  let raf;

  /* ── resize ── */
  function resize() {
    canvas.width  = section.offsetWidth;
    canvas.height = section.offsetHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  /* ── Particle class ── */
  class Particle {
    constructor(x, y) {
      const angle  = Math.random() * Math.PI * 2;
      const speed  = 1.5 + Math.random() * 5;
      this.x       = x;
      this.y       = y;
      this.vx      = Math.cos(angle) * speed;
      this.vy      = Math.sin(angle) * speed - Math.random() * 3;
      this.gravity = 0.08 + Math.random() * 0.06;
      this.word    = WORDS[Math.floor(Math.random() * WORDS.length)];
      this.size    = 10 + Math.random() * 14;
      this.alpha   = 1;
      this.decay   = 0.006 + Math.random() * 0.008;
      this.rotation= Math.random() * Math.PI * 2;
      this.rotSpeed= (Math.random() - 0.5) * 0.12;
      /* colour: orange, yellow, white, cyan */
      const palettes = ['#ff7a00','#ffd000','#ffffff','#00e5ff','#ff4f4f','#a0ff60'];
      this.color   = palettes[Math.floor(Math.random() * palettes.length)];
      this.isEmoji = /\p{Emoji}/u.test(this.word);
    }
    update() {
      this.x        += this.vx;
      this.y        += this.vy;
      this.vy       += this.gravity;
      this.vx       *= 0.995;
      this.rotation += this.rotSpeed;
      this.alpha    -= this.decay;
    }
    draw(ctx) {
      if (this.alpha <= 0) return;
      ctx.save();
      ctx.globalAlpha = Math.max(0, this.alpha);
      ctx.translate(this.x, this.y);
      ctx.rotate(this.rotation);
      ctx.font = `bold ${this.size}px 'Courier New', monospace`;
      if (!this.isEmoji) {
        ctx.fillStyle   = this.color;
        ctx.shadowColor = this.color;
        ctx.shadowBlur  = 8;
      }
      ctx.textAlign    = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(this.word, 0, 0);
      ctx.restore();
    }
  }

  /* ── draw the bag emoji ── */
  function drawBag(cx, cy, scale, opacity, shakeOffset) {
    if (opacity <= 0) return;
    ctx.save();
    ctx.globalAlpha = opacity;
    ctx.translate(cx + shakeOffset, cy);
    ctx.scale(scale, scale);
    ctx.font = '72px serif';
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('💼', 0, 0);

    /* glow ring */
    const glow = ctx.createRadialGradient(0, 0, 10, 0, 0, 80);
    glow.addColorStop(0,   'rgba(255,122,0,0.18)');
    glow.addColorStop(1,   'rgba(255,122,0,0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, 0, 80, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  /* ── spawn burst ── */
  function spawnBurst(cx, cy, count) {
    for (let i = 0; i < count; i++) {
      PARTICLES.push(new Particle(cx, cy));
    }
  }

  /* ── scroll check ── */
  function getScrollProgress() {
    const rect   = section.getBoundingClientRect();
    const vh     = window.innerHeight;
    /* trigger when section top enters bottom third of viewport */
    const start  = vh * 0.85;
    const end    = vh * 0.2;
    const pos    = rect.top;
    return Math.min(1, Math.max(0, (start - pos) / (start - end)));
  }

  /* ── main loop ── */
  function loop() {
    raf = requestAnimationFrame(loop);

    const W  = canvas.width;
    const H  = canvas.height;
    const cx = W * 0.82;   /* right-ish position */
    const cy = H * 0.38;

    ctx.clearRect(0, 0, W, H);

    const progress = getScrollProgress();

    if (phase === 'idle') {
      if (progress > 0.15) {
        phase      = 'shaking';
        phaseTimer = 0;
      } else {
        drawBag(cx, cy, 1, 0.55 + progress * 0.45, 0);
        return;
      }
    }

    if (phase === 'shaking') {
      phaseTimer++;
      bagShake   = Math.sin(phaseTimer * 0.6) * (6 + phaseTimer * 0.3);
      bagOpacity = 1;
      bagScale   = 1 + Math.sin(phaseTimer * 0.4) * 0.06;

      /* spawn tiny pre-sparks */
      if (phaseTimer % 4 === 0) spawnBurst(cx, cy, 3);

      drawBag(cx, cy, bagScale, bagOpacity, bagShake);

      if (phaseTimer > 38) {
        phase      = 'exploding';
        phaseTimer = 0;
        spawnBurst(cx, cy, 160);
      }
    }

    if (phase === 'exploding') {
      phaseTimer++;
      bagOpacity -= 0.07;
      bagScale   += 0.15;
      if (bagOpacity > 0) drawBag(cx, cy, bagScale, bagOpacity, 0);

      if (phaseTimer % 3 === 0 && phaseTimer < 20) spawnBurst(cx, cy, 12);

      if (bagOpacity <= 0) phase = 'done';
    }

    /* draw & update particles */
    for (let i = PARTICLES.length - 1; i >= 0; i--) {
      PARTICLES[i].update();
      PARTICLES[i].draw(ctx);
      if (PARTICLES[i].alpha <= 0) PARTICLES.splice(i, 1);
    }

    /* if scrolled back up, reset */
    if (progress < 0.05 && phase !== 'idle') {
      phase      = 'idle';
      bagOpacity = 1;
      bagScale   = 1;
      bagShake   = 0;
      phaseTimer = 0;
      PARTICLES.length = 0;
    }
  }

  loop();
})();
