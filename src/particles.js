/**
 * particles.js — 2D canvas particle system
 * Two modes:
 *   'petal'   — soft drooping petals (No scene / ambient)
 *   'burst'   — energetic sparkle + petal burst (Yes moment)
 *   'ambient' — slow, gentle petals (always-on during scenes)
 */
import { CONFIG } from './config.js';

const { PETAL_COUNT, SPARKLE_COUNT } = CONFIG;

// Colour palettes
const PETAL_COLORS_NORMAL  = ['#F2BFCB', '#FBE9EF', '#EDB4C2', '#D9869A', '#F8E0E8'];
const PETAL_COLORS_SAD     = ['#9C8B92', '#7a6470', '#c4a0ac', '#8a7580', '#b09098'];
const SPARKLE_COLORS       = ['#F8F4F0', '#F2BFCB', '#C8CDD6', '#fffde7', '#FADADD'];

function rand(min, max) { return Math.random() * (max - min) + min; }
function randChoice(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

class Petal {
  constructor(canvas, sad = false) {
    this.canvas = canvas;
    this.sad = sad;
    this.reset(true);
  }

  reset(initial = false) {
    const w = this.canvas.width;
    const h = this.canvas.height;
    this.x    = rand(0, w);
    this.y    = initial ? rand(-h, h) : rand(-60, -10);
    this.size = rand(6, 14);
    this.color = randChoice(this.sad ? PETAL_COLORS_SAD : PETAL_COLORS_NORMAL);
    this.speedY = this.sad ? rand(0.4, 0.9) : rand(0.8, 1.8);
    this.speedX = rand(-0.4, 0.4);
    this.drift  = rand(0, Math.PI * 2);
    this.driftSpeed = rand(0.008, 0.025);
    this.angle  = rand(0, Math.PI * 2);
    this.angleSpeed = rand(-0.02, 0.02);
    this.opacity = rand(0.4, 0.85);
    this.life    = 1;
  }

  update() {
    this.drift += this.driftSpeed;
    this.x += this.speedX + Math.sin(this.drift) * 0.6;
    this.y += this.speedY;
    this.angle += this.angleSpeed;
    if (this.y > this.canvas.height + 20) this.reset();
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);
    ctx.globalAlpha = this.opacity;
    ctx.fillStyle = this.color;
    // Simple oval petal shape
    ctx.beginPath();
    ctx.ellipse(0, 0, this.size * 0.45, this.size, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

class Sparkle {
  constructor(canvas, x, y) {
    this.canvas = canvas;
    this.x = x ?? rand(0, canvas.width);
    this.y = y ?? rand(0, canvas.height);
    this.size  = rand(2, 6);
    this.color = randChoice(SPARKLE_COLORS);
    this.speedX = rand(-3, 3);
    this.speedY = rand(-5, -1);
    this.gravity = 0.08;
    this.opacity = 1;
    this.fade    = rand(0.015, 0.03);
    this.alive   = true;
  }

  update() {
    this.x += this.speedX;
    this.y += this.speedY;
    this.speedY += this.gravity;
    this.opacity -= this.fade;
    if (this.opacity <= 0) this.alive = false;
  }

  draw(ctx) {
    ctx.save();
    ctx.globalAlpha = Math.max(this.opacity, 0);
    ctx.fillStyle = this.color;
    // 4-point star
    const s = this.size;
    ctx.beginPath();
    ctx.moveTo(0, -s);
    ctx.lineTo(s * 0.25, -s * 0.25);
    ctx.lineTo(s, 0);
    ctx.lineTo(s * 0.25, s * 0.25);
    ctx.lineTo(0, s);
    ctx.lineTo(-s * 0.25, s * 0.25);
    ctx.lineTo(-s, 0);
    ctx.lineTo(-s * 0.25, -s * 0.25);
    ctx.closePath();
    ctx.translate(this.x, this.y);
    ctx.fill();
    ctx.restore();
  }
}

export class ParticleSystem {
  /**
   * @param {HTMLCanvasElement} canvas
   */
  constructor(canvas) {
    this.canvas  = canvas;
    this.ctx     = canvas.getContext('2d');
    this.petals  = [];
    this.sparkles = [];
    this._mode   = 'idle';
    this._raf    = null;
    this._running = false;

    this._resize();
    this._ro = new ResizeObserver(() => this._resize());
    this._ro.observe(document.body);
  }

  _resize() {
    this.canvas.width  = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  /** Start gentle ambient petals */
  startAmbient() {
    this._mode = 'ambient';
    this.petals = Array.from({ length: Math.floor(PETAL_COUNT * 0.4) },
      () => new Petal(this.canvas, false));
    if (!this._running) this._loop();
  }

  /** Switch to sad drooping petals */
  startSad() {
    this._mode = 'sad';
    this.petals = Array.from({ length: PETAL_COUNT },
      () => new Petal(this.canvas, true));
    this.sparkles = [];
    if (!this._running) this._loop();
  }

  /** Fire the Yes burst: lots of petals + sparkles from centre */
  burst(cx, cy) {
    this._mode = 'burst';
    this.petals = Array.from({ length: PETAL_COUNT },
      () => new Petal(this.canvas, false));
    for (let i = 0; i < SPARKLE_COUNT; i++) {
      this.sparkles.push(new Sparkle(this.canvas, cx, cy));
    }
    if (!this._running) this._loop();
  }

  /** Ongoing sparkle bursts from the ring position */
  addSparkles(x, y, count = 8) {
    for (let i = 0; i < count; i++) {
      this.sparkles.push(new Sparkle(this.canvas, x, y));
    }
  }

  stop() {
    this._mode = 'idle';
    if (this._raf) cancelAnimationFrame(this._raf);
    this._running = false;
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  _loop() {
    this._running = true;
    const tick = () => {
      if (this._mode === 'idle') { this._running = false; return; }
      const ctx = this.ctx;
      ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

      for (const p of this.petals) {
        p.update();
        p.draw(ctx);
      }

      // Clean dead sparkles
      this.sparkles = this.sparkles.filter(s => s.alive);
      for (const s of this.sparkles) {
        s.update();
        s.draw(ctx);
      }

      this._raf = requestAnimationFrame(tick);
    };
    this._raf = requestAnimationFrame(tick);
  }

  destroy() {
    this.stop();
    this._ro.disconnect();
  }
}
