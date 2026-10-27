/**
 * loader.js — preload both MP4 videos for scroll-scrubbing
 *
 * Instead of loading hundreds of image frames, we create two hidden
 * <video> elements, preload them, and pass them to the VideoScrubber.
 */
import { CONFIG } from './config.js';

const { VIDEO1_SRC, VIDEO2_SRC } = CONFIG;

/**
 * Create and preload a single video element.
 * @param {string} src
 * @param {(n: number) => void} onProgress  called with 0–1
 * @returns {Promise<HTMLVideoElement>}
 */
function loadVideo(src, onProgress) {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.src = src;
    video.muted = true;
    video.playsInline = true;
    video.preload = 'auto';
    video.crossOrigin = 'anonymous';
    // Keep hidden off-screen
    video.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:1px;height:1px;pointer-events:none;';
    document.body.appendChild(video);

    // Simulate progress while buffering
    let simulated = 0;
    const progressInterval = setInterval(() => {
      simulated = Math.min(simulated + 0.05, 0.9);
      onProgress(simulated);
    }, 100);

    const done = () => {
      clearInterval(progressInterval);
      onProgress(1);
      resolve(video);
    };

    video.addEventListener('canplaythrough', done, { once: true });
    video.addEventListener('error', (e) => {
      clearInterval(progressInterval);
      console.warn('[loader] Video load error:', src, e);
      // Resolve with the element anyway so the app can show a fallback
      resolve(video);
    }, { once: true });

    video.load();
  });
}

/**
 * Load both videos and report combined progress.
 * @param {(progress: number) => void} onProgress  0–1
 * @returns {Promise<{ v1: HTMLVideoElement, v2: HTMLVideoElement }>}
 */
export async function loadAllFrames(onProgress) {
  let p1 = 0, p2 = 0;

  const update = () => onProgress((p1 + p2) / 2);

  const [v1, v2] = await Promise.all([
    loadVideo(VIDEO1_SRC, (p) => { p1 = p; update(); }),
    loadVideo(VIDEO2_SRC, (p) => { p2 = p; update(); }),
  ]);

  return { v1, v2 };
}
