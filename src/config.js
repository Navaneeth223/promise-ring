/**
 * ============================================================
 * Our Promise — Central Config
 * Edit this file to personalise the experience.
 * ============================================================
 */
export const CONFIG = {
  // ── Names ─────────────────────────────────────────────────
  HER_NAME: 'Her Name',     // shown in loader & letter
  YOUR_NAME: 'Your Name',   // signed at bottom of letter

  // ── Letter ────────────────────────────────────────────────
  LETTER: [
    'From the first moment I heard your voice across the distance,',
    'I knew that oceans were just details.',
    '',
    'Every timezone, every sleepy call, every "good morning" that was',
    'actually your midnight — all of it has only made me more certain.',
    '',
    'I can\'t offer you everything yet.',
    'But I can offer you this: my promise.',
    'My steady, quiet, unshakeable promise.',
    '',
    'To choose you, every single day.',
    'To be worth the wait.',
    'To build something beautiful with you — wherever in the world that is.',
  ],

  LETTER_CLOSING: 'Forever starts with a promise.',

  // ── Video 1 captions ──────────────────────────────────────
  // progress: 0-1 within Scene 1 scroll range
  // Each caption fades in at `inAt` and fades out at `outAt`
  CAPTIONS_V1: [
    { text: 'Across every mile…',           inAt: 0.08,  outAt: 0.22 },
    { text: '…every call, every night…',    inAt: 0.30,  outAt: 0.46 },
    { text: '…I\'ve been saving this moment', inAt: 0.55, outAt: 0.70 },
    { text: '…just for you.',               inAt: 0.76,  outAt: 0.92 },
  ],

  // ── Video 2 captions ──────────────────────────────────────
  CAPTIONS_V2: [
    { text: 'A promise, placed gently…',    inAt: 0.08,  outAt: 0.25 },
    { text: '…where it belongs.',           inAt: 0.35,  outAt: 0.55 },
    { text: 'Right here. With you.',        inAt: 0.65,  outAt: 0.88 },
  ],

  // ── Frame sequences ───────────────────────────────────────
  // Run the ffmpeg commands in the README to populate these.
  VIDEO1_FRAMES: 168,   // total frames in public/frames/v1/
  VIDEO2_FRAMES: 168,   // total frames in public/frames/v2/
  FRAME_EXT: 'webp',    // extension of generated frames

  // Scroll height per video (px) — more = slower, silkier scrub
  VIDEO1_SCROLL_HEIGHT: 4000,
  VIDEO2_SCROLL_HEIGHT: 4000,

  // ── Ring anchor ───────────────────────────────────────────
  // Normalised position (0-1) of her ring finger in the LAST
  // frame of video 2. Tweak until the 3D ring sits perfectly.
  RING_ANCHOR: { x: 0.54, y: 0.48 },

  // ── Three.js ring material ────────────────────────────────
  RING_METALNESS: 1,
  RING_ROUGHNESS: 0.12,
  DIAMOND_IOR: 2.4,
  DIAMOND_THICKNESS: 0.3,

  // ── Music ─────────────────────────────────────────────────
  // Drop your mp3 into public/ and set the path here.
  MUSIC_SRC: '', // e.g. '/music.mp3'

  // ── Particles ─────────────────────────────────────────────
  PETAL_COUNT: 60,
  SPARKLE_COUNT: 80,
};
