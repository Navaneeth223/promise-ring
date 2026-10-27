/**
 * main.js — Our Promise
 * Orchestrates: loader → scene 1 → question → yes/no → scene 2 → finale
 */
import './style.css';

import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

import { CONFIG }         from './config.js';
import { loadAllFrames }  from './loader.js';
import { Scrubber }       from './scrubber.js';
import { ParticleSystem } from './particles.js';
import { Ring3D }         from './ring3d.js';
import { setupScenes }    from './scenes.js';
import { startFinale }    from './finale.js';

gsap.registerPlugin(ScrollTrigger);

// ────────────────────────────────────────────────────────────
// Inject config-driven content into HTML
// ────────────────────────────────────────────────────────────
document.getElementById('her-name-loader').textContent = CONFIG.HER_NAME;
document.getElementById('her-name-letter').textContent = `My dearest ${CONFIG.HER_NAME},`;
document.getElementById('your-name-letter').textContent = `— ${CONFIG.YOUR_NAME}`;
document.getElementById('letter-body').textContent = CONFIG.LETTER.join('\n');

// Apply scroll heights from config
document.documentElement.style.setProperty('--scene1-height', `${CONFIG.VIDEO1_SCROLL_HEIGHT}px`);
document.documentElement.style.setProperty('--scene2-height', `${CONFIG.VIDEO2_SCROLL_HEIGHT}px`);

// ────────────────────────────────────────────────────────────
// DOM refs
// ────────────────────────────────────────────────────────────
const loaderEl        = document.getElementById('loader');
const loaderFill      = document.querySelector('.loader-progress-fill');
const scrollCue       = document.getElementById('scroll-cue');
const questionOverlay = document.getElementById('question-overlay');
const noScene         = document.getElementById('no-scene');
const videoCanvas     = document.getElementById('video-canvas');
const particleCanvas  = document.getElementById('particle-canvas');
const ringCanvas      = document.getElementById('ring-canvas');
const musicBtn        = document.getElementById('music-btn');
const audio           = document.getElementById('bg-audio');

// ────────────────────────────────────────────────────────────
// Lenis smooth scroll
// ────────────────────────────────────────────────────────────
const lenis = new Lenis({
  duration: 1.2,
  easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
  smoothWheel: true,
  touchMultiplier: 1.5,
  infinite: false,
});

// Connect GSAP ticker to Lenis
gsap.ticker.add(time => lenis.raf(time * 1000));
gsap.ticker.lagSmoothing(0);

// ScrollTrigger + Lenis integration
lenis.on('scroll', ScrollTrigger.update);
ScrollTrigger.scrollerProxy(document.body, {
  scrollTop(value) {
    if (arguments.length) lenis.scrollTo(value, { immediate: true });
    return window.scrollY;
  },
  getBoundingClientRect() {
    return { top: 0, left: 0, width: window.innerWidth, height: window.innerHeight };
  },
  pinType: document.body.style.transform ? 'transform' : 'fixed',
});
ScrollTrigger.defaults({ scroller: document.body });

lenis.stop(); // stay locked until loader finishes

// ────────────────────────────────────────────────────────────
// Music toggle
// ────────────────────────────────────────────────────────────
let musicOn = false;
musicBtn.addEventListener('click', () => {
  if (!CONFIG.MUSIC_SRC) return;
  if (!audio.src) audio.src = CONFIG.MUSIC_SRC;

  if (musicOn) {
    audio.pause();
    musicBtn.textContent = '♪';
    musicBtn.setAttribute('aria-label', 'Play music');
  } else {
    audio.play().catch(() => {});
    musicBtn.textContent = '♫';
    musicBtn.setAttribute('aria-label', 'Pause music');
  }
  musicOn = !musicOn;
});

// ────────────────────────────────────────────────────────────
// State
// ────────────────────────────────────────────────────────────
let answered = false;
let allVideos = { v1: null, v2: null }; // HTMLVideoElements
let scrubber, particles, ring3d, sceneController;

// ────────────────────────────────────────────────────────────
// Boot
// ────────────────────────────────────────────────────────────
async function boot() {
  // 1. Initialise subsystems (order matters for z-index layering)
  scrubber  = new Scrubber(videoCanvas, null);
  particles = new ParticleSystem(particleCanvas);
  ring3d    = new Ring3D(ringCanvas);

  // Start gentle ambient particles
  particles.startAmbient();

  // 2. Load videos + 3D ring concurrently
  const [videos] = await Promise.all([
    loadAllFrames(progress => {
      if (loaderFill) loaderFill.style.width = `${Math.round(progress * 100)}%`;
    }),
    ring3d.load(),
  ]);

  allVideos = videos;

  // Set scene 1 video in scrubber
  scrubber.frames = allVideos.v1;
  scrubber.seek(0);

  // 3. Brief pause so loader feels intentional
  await delay(500);

  // 4. Dismiss loader with fade
  loaderEl.classList.add('hidden');
  await delay(900);
  loaderEl.style.display = 'none';

  // 5. Unlock scroll & show cue
  lenis.start();
  scrollCue.classList.add('visible');

  // 6. Wire up scene ScrollTriggers
  sceneController = setupScenes({
    lenis,
    scrubber,
    frames: allVideos,
    onScene1End: showQuestion,
    onScene2End: showFinale,
  });
}

// ────────────────────────────────────────────────────────────
// Question card
// ────────────────────────────────────────────────────────────
function showQuestion() {
  if (answered) return;
  lenis.stop();
  document.body.style.overflow = 'hidden';
  questionOverlay.setAttribute('aria-hidden', 'false');
  questionOverlay.classList.add('active');

  // Focus first button for accessibility
  requestAnimationFrame(() => {
    document.getElementById('btn-yes')?.focus();
  });
}

function hideQuestion() {
  questionOverlay.classList.remove('active');
  questionOverlay.setAttribute('aria-hidden', 'true');
}

// Yes
document.getElementById('btn-yes').addEventListener('click', () => {
  if (answered) return;
  answered = true;
  handleYes();
});

// No
document.getElementById('btn-no').addEventListener('click', handleNo);

function handleYes() {
  hideQuestion();

  // 1. Burst
  const cx = window.innerWidth  / 2;
  const cy = window.innerHeight / 2;
  particles.burst(cx, cy);

  // 2. Fade out question overlay, then unlock
  gsap.delayedCall(0.8, () => {
    document.body.style.overflow = '';
    lenis.start();

    // Switch scrubber to v2 video
    scrubber.frames = allVideos.v2;
    scrubber.seek(0);

    // Draw first v2 frame (placeholder if not ready)
    if (!allVideos.v2) {
      scrubber.drawPlaceholder('#0e0a0c', 'Scene 2 — start');
    }

    // Activate scene 2 scroll trigger
    sceneController.createScene2ST();

    // Scroll to scene 2
    const scene2 = document.getElementById('scene2');
    lenis.scrollTo(scene2, { immediate: true, offset: 0 });

    ScrollTrigger.refresh();
  });
}

function handleNo() {
  hideQuestion();
  document.body.style.overflow = '';
  noScene.setAttribute('aria-hidden', 'false');
  noScene.classList.add('active');
  particles.startSad();
}

document.getElementById('btn-try-again').addEventListener('click', () => {
  particles.startAmbient();
  noScene.classList.remove('active');
  noScene.setAttribute('aria-hidden', 'true');

  // Small delay before re-showing question
  setTimeout(() => {
    answered = false; // let them answer again
    showQuestion();
  }, 500);
});

// ────────────────────────────────────────────────────────────
// Finale
// ────────────────────────────────────────────────────────────
function showFinale() {
  // Stop ambient particles; finale will add sparkles via ring3d callback
  particles.stop();

  startFinale({ ring3d, particles, lenis });
}

// ────────────────────────────────────────────────────────────
// Utility
// ────────────────────────────────────────────────────────────
function delay(ms) {
  return new Promise(r => setTimeout(r, ms));
}

// ────────────────────────────────────────────────────────────
// Reduced-motion
// ────────────────────────────────────────────────────────────
if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  document.documentElement.style.setProperty('--transition', '0.01s');
  // Immediately show content if user prefers no motion
  loaderFill && (loaderFill.style.width = '100%');
}

// ── GO ──
boot().catch(err => {
  console.error('[OurPromise] Boot error:', err);
  if (loaderEl) {
    const t = loaderEl.querySelector('.loader-text');
    if (t) t.textContent = 'Something went wrong. Please refresh.';
  }
});
