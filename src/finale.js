/**
 * finale.js — ring lift-off and letter reveal
 *
 * When video 2 ends:
 * 1. The ring 3D canvas crossfades in, appearing at RING_ANCHOR position
 * 2. GSAP lifts it to centre + starts float rotation
 * 3. Sparkles emit from the ring
 * 4. Letter card fades in below / over
 */
import gsap from 'gsap';
import { CONFIG } from './config.js';

const { RING_ANCHOR } = CONFIG;

export function startFinale({ ring3d, particles, lenis }) {
  const ringCanvas    = document.getElementById('ring-canvas');
  const letterSection = document.getElementById('letter-section');

  // ── 1. Position the ring canvas at RING_ANCHOR for the lift-off illusion
  // The ring starts small and positioned at the anchor, then floats to centre
  if (!ring3d.ready) return;

  ring3d.showGroup();

  // Set initial transform origin to anchor point
  const ax = RING_ANCHOR.x * 100;
  const ay = RING_ANCHOR.y * 100;

  // Position the 3D camera starting view near anchor
  // We translate the group so it appears at anchor, then animate to 0,0
  ring3d._group.position.set(
    (RING_ANCHOR.x - 0.5) * 6,  // map 0-1 to -3…+3 world units
    -(RING_ANCHOR.y - 0.5) * 6,
    0
  );
  ring3d._group.scale.setScalar(0.3);

  // Fade in the canvas overlay
  ringCanvas.classList.add('active');

  // ── 2. Animate ring from anchor to centre
  const tl = gsap.timeline({
    onComplete: () => {
      // Start sparkle loop once ring is centred
      ring3d.startLoop((x, y) => {
        particles.addSparkles(x, y, 6);
      });
      // Show letter
      showLetter();
    },
  });

  tl.to(ring3d._group.position, {
    x: 0,
    y: 0,
    z: 0,
    duration: 1.6,
    ease: 'expo.out',
  });

  tl.to(ring3d._group.scale, {
    x: 1,
    y: 1,
    z: 1,
    duration: 1.6,
    ease: 'expo.out',
  }, '<');

  // Start loop before letter (shows ring)
  ring3d.startLoop((x, y) => {
    particles.addSparkles(x, y, 4);
  });
}

function showLetter() {
  const letterSection = document.getElementById('letter-section');
  gsap.to(letterSection, {
    opacity: 1,
    duration: 1.2,
    ease: 'power2.inOut',
    onStart: () => letterSection.classList.add('active'),
  });

  // Stagger letter paragraphs
  const paras = letterSection.querySelectorAll('.letter-body, .letter-closing, .letter-signature, .letter-salutation');
  gsap.from(paras, {
    opacity: 0,
    y: 20,
    duration: 0.9,
    stagger: 0.2,
    ease: 'power2.out',
    delay: 0.4,
  });
}
