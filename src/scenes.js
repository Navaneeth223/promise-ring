/**
 * scenes.js — GSAP ScrollTrigger scene orchestration
 *
 * Responsibilities:
 *  - Pin the canvas-wrap for each video sequence
 *  - Drive Scrubber.seek() from scroll progress
 *  - Show/hide captions at configured progress points
 *  - Trigger the question card lock at end of scene 1
 *  - Trigger the ring finale at end of scene 2
 */
import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';
import { CONFIG } from './config.js';

gsap.registerPlugin(ScrollTrigger);

export function setupScenes({
  lenis,
  scrubber,        // Scrubber instance shared between scenes
  frames,          // { v1, v2 }
  onScene1End,     // () => void  — show question
  onScene2End,     // () => void  — show ring finale
}) {
  const {
    CAPTIONS_V1, CAPTIONS_V2,
    VIDEO1_SCROLL_HEIGHT, VIDEO2_SCROLL_HEIGHT,
  } = CONFIG;

  const canvasWrap = document.getElementById('canvas-wrap');
  const scene1     = document.getElementById('scene1');
  const scene2     = document.getElementById('scene2');
  const scrollCue  = document.getElementById('scroll-cue');

  // ── Scene 1 ────────────────────────────────────────────────
  const captions1 = CAPTIONS_V1.map(cfg => {
    const el = document.createElement('p');
    el.className = 'caption-text';
    el.textContent = cfg.text;
    document.getElementById('caption-layer').appendChild(el);
    return { el, ...cfg };
  });

  const st1 = ScrollTrigger.create({
    trigger: scene1,
    start: 'top top',
    end: `+=${VIDEO1_SCROLL_HEIGHT}`,
    scrub: 1.2,
    pin: canvasWrap,
    pinSpacing: false,
    onUpdate(self) {
      const p = self.progress;

      // Scrub frames
      if (frames.v1 && frames.v1.length) {
        scrubber.seek(p);
      } else {
        // Placeholder
        scrubber.drawPlaceholder(
          `hsl(330, ${20 + p * 30}%, ${8 + p * 10}%)`,
          `Scene 1 — ${Math.round(p * 100)}%`
        );
      }

      // Captions
      for (const cap of captions1) {
        const visible = p >= cap.inAt && p < cap.outAt;
        if (visible) {
          cap.el.classList.add('visible');
        } else {
          cap.el.classList.remove('visible');
        }
      }

      // Hide scroll cue once scrolling starts
      if (p > 0.02 && scrollCue) {
        scrollCue.classList.remove('visible');
        scrollCue.classList.add('hidden');
      }
    },
    onLeave() {
      // End of scene 1 — show question
      onScene1End();
    },
    onEnterBack() {
      // Returned to scene 1 from scene 2 — already handled by question logic
    },
  });

  // ── Scene 2 ────────────────────────────────────────────────
  const captions2 = CAPTIONS_V2.map(cfg => {
    const el = document.createElement('p');
    el.className = 'caption-text';
    el.textContent = cfg.text;
    document.getElementById('caption-layer').appendChild(el);
    return { el, ...cfg };
  });

  // scene2 scroll trigger is created AFTER the user hits Yes
  let st2 = null;

  function createScene2ST() {
    if (st2) { st2.kill(); }

    st2 = ScrollTrigger.create({
      trigger: scene2,
      start: 'top top',
      end: `+=${VIDEO2_SCROLL_HEIGHT}`,
      scrub: 1.2,
      pin: canvasWrap,
      pinSpacing: false,
      onUpdate(self) {
        const p = self.progress;

        if (frames.v2 && frames.v2.length) {
          scrubber.seek(p);
        } else {
          scrubber.drawPlaceholder(
            `hsl(340, ${15 + p * 25}%, ${6 + p * 12}%)`,
            `Scene 2 — ${Math.round(p * 100)}%`
          );
        }

        for (const cap of captions2) {
          const visible = p >= cap.inAt && p < cap.outAt;
          cap.el.classList.toggle('visible', visible);
        }
      },
      onLeave() {
        onScene2End();
      },
    });

    ScrollTrigger.refresh();
  }

  return { createScene2ST, st1 };
}
