/**
 * scrubber.js — high-performance canvas frame scrubber
 * Draws ImageBitmaps on a full-screen canvas with cover-fit.
 * Capped DPR at 2 for mobile and desktop performance.
 */
export class Scrubber {
  /**
   * @param {HTMLCanvasElement} canvas
   * @param {ImageBitmap[]} frames
   */
  constructor(canvas, frames = []) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false });
    this._frames = frames;
    this._currentIndex = -1;
    this._raf = null;
    this._pendingIndex = 0;
    this._dirty = false;

    this._resize();
    this._ro = new ResizeObserver(() => this._resize());
    this._ro.observe(canvas.parentElement ?? document.body);
    window.addEventListener('resize', () => this._resize(), { passive: true });

    if (frames && frames.length) {
      this.frames = frames;
    }
  }

  set frames(list) {
    this._frames = list || [];
    this._currentIndex = -1;
    if (this._frames.length > 0) {
      this._draw(0);
      this._currentIndex = 0;
    }
  }

  get frames() {
    return this._frames;
  }

  _resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = this.canvas.offsetWidth || window.innerWidth;
    const h = this.canvas.offsetHeight || window.innerHeight;
    this.canvas.width  = Math.round(w * dpr);
    this.canvas.height = Math.round(h * dpr);
    this._dpr = dpr;
    this._w = w;
    this._h = h;

    if (this._frames && this._frames.length) {
      const idx = this._currentIndex >= 0 ? this._currentIndex : 0;
      this._draw(idx);
    }
  }

  /**
   * Set the frame index to display. Only schedules a rAF if index changed.
   * @param {number} progress 0–1
   */
  seek(progress) {
    if (!this._frames || !this._frames.length) return;
    const idx = Math.min(
      Math.max(0, Math.floor(progress * (this._frames.length - 1))),
      this._frames.length - 1
    );
    if (idx === this._currentIndex) return;
    this._pendingIndex = idx;
    if (!this._dirty) {
      this._dirty = true;
      this._raf = requestAnimationFrame(() => this._flush());
    }
  }

  _flush() {
    this._draw(this._pendingIndex);
    this._currentIndex = this._pendingIndex;
    this._dirty = false;
  }

  /** Draw with cover-fit so the image always fills the canvas. */
  _draw(idx) {
    if (!this._frames) return;
    const bm = this._frames[idx];
    if (!bm) return;

    const ctx = this.ctx;
    const cw = this.canvas.width;
    const ch = this.canvas.height;

    // Scale to cover
    const scale = Math.max(cw / bm.width, ch / bm.height);
    const sw = bm.width  * scale;
    const sh = bm.height * scale;
    const dx = (cw - sw) / 2;
    const dy = (ch - sh) / 2;

    ctx.drawImage(bm, dx, dy, sw, sh);
  }

  /**
   * Draw a solid colour placeholder when no frames are loaded (dev mode).
   * @param {string} color CSS colour string
   * @param {string} label optional text label
   */
  drawPlaceholder(color = '#2d1f26', label = '') {
    const ctx = this.ctx;
    const cw = this.canvas.width;
    const ch = this.canvas.height;
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, cw, ch);
    if (label) {
      ctx.fillStyle = 'rgba(255,255,255,0.18)';
      ctx.font = `${14 * (this._dpr || 1)}px Inter, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, cw / 2, ch / 2);
    }
  }

  destroy() {
    this._ro.disconnect();
    window.removeEventListener('resize', this._resize);
    if (this._raf) cancelAnimationFrame(this._raf);
  }
}
