/**
 * scrubber.js — high-performance video scrubber
 *
 * Accepts an HTMLVideoElement and seeks it via currentTime based on
 * a 0–1 scroll progress value. Each animation frame the video's
 * current decoded frame is drawn onto the canvas with cover-fit.
 *
 * Maintains the same public API as the previous ImageBitmap scrubber
 * so no changes are needed in scenes.js / main.js.
 */
export class Scrubber {
  /**
   * @param {HTMLCanvasElement} canvas
   * @param {HTMLVideoElement|null} videoEl  pass null to start in placeholder mode
   */
  constructor(canvas, videoEl) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.video = videoEl;  // HTMLVideoElement — replaces the frames[] array
    this._raf = null;
    this._lastProgress = -1;
    this._loopRunning = false;

    this._resize();
    this._ro = new ResizeObserver(() => this._resize());
    this._ro.observe(canvas.parentElement ?? document.body);
  }

  // ── Legacy compatibility ──────────────────────────────────────
  // The old API used `scrubber.frames = [...]; scrubber.seek(0)`.
  // We keep a `frames` setter so existing callers (main.js) don't break.
  set frames(value) {
    // value is now an HTMLVideoElement (or legacy empty array for compat)
    if (value && typeof value.duration === 'number') {
      this.video = value;
      this._startLoop();
    }
    // If an empty array is passed (old dev-mode path), ignore gracefully
  }

  get frames() {
    return this.video ? [this.video] : []; // non-empty = "has frames"
  }

  // ─────────────────────────────────────────────────────────────

  _resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = this.canvas.offsetWidth;
    const h = this.canvas.offsetHeight;
    this.canvas.width  = Math.round(w * dpr);
    this.canvas.height = Math.round(h * dpr);
    this._dpr = dpr;
    this._w = w;
    this._h = h;
    // Re-draw current frame immediately after resize
    if (this.video && !this.video.paused) return; // loop will handle it
    this._drawFrame();
  }

  /**
   * Seek the video to the given progress position.
   * @param {number} progress  0–1
   */
  seek(progress) {
    if (!this.video || !isFinite(this.video.duration)) return;
    if (progress === this._lastProgress) return;
    this._lastProgress = progress;

    // Clamp and set currentTime
    const t = Math.max(0, Math.min(progress, 1)) * this.video.duration;
    this.video.currentTime = t;

    // Make sure we draw even if the loop hasn't started yet
    if (!this._loopRunning) {
      this._startLoop();
    }
  }

  /** Start the rAF draw loop */
  _startLoop() {
    if (this._loopRunning) return;
    this._loopRunning = true;
    const tick = () => {
      this._raf = requestAnimationFrame(tick);
      this._drawFrame();
    };
    tick();
  }

  /** Draw the current video frame with cover-fit */
  _drawFrame() {
    const video = this.video;
    const ctx = this.ctx;
    const cw = this.canvas.width;
    const ch = this.canvas.height;

    if (!video || video.readyState < 2) {
      // No frame available yet — draw placeholder
      ctx.fillStyle = '#1a1015';
      ctx.fillRect(0, 0, cw, ch);
      return;
    }

    const vw = video.videoWidth;
    const vh = video.videoHeight;
    if (!vw || !vh) return;

    // Scale to cover
    const scale = Math.max(cw / vw, ch / vh);
    const sw = vw * scale;
    const sh = vh * scale;
    const dx = (cw - sw) / 2;
    const dy = (ch - sh) / 2;

    ctx.clearRect(0, 0, cw, ch);
    ctx.drawImage(video, dx, dy, sw, sh);
  }

  /**
   * Draw a solid colour placeholder (used in dev mode / fallback).
   * @param {string} color  CSS colour string
   * @param {string} label  optional text label
   */
  drawPlaceholder(color = '#2d1f26', label = '') {
    const ctx = this.ctx;
    const cw = this.canvas.width;
    const ch = this.canvas.height;
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, cw, ch);
    if (label) {
      ctx.fillStyle = 'rgba(255,255,255,0.18)';
      ctx.font = `${14 * this._dpr}px Inter, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, cw / 2, ch / 2);
    }
  }

  destroy() {
    this._ro.disconnect();
    if (this._raf) cancelAnimationFrame(this._raf);
    this._loopRunning = false;
  }
}
