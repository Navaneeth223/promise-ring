/**
 * loader.js — preload all frame bitmaps with progress reporting
 */
import { CONFIG } from './config.js';

const { VIDEO1_FRAMES, VIDEO2_FRAMES, FRAME_EXT } = CONFIG;

/**
 * Load a single WebP frame as ImageBitmap for fast GPU upload.
 */
async function loadBitmap(src) {
  const res = await fetch(src);
  if (!res.ok) throw new Error(`Frame not found: ${src}`);
  const blob = await res.blob();
  if (typeof createImageBitmap === 'function') {
    return createImageBitmap(blob, { colorSpaceConversion: 'none' });
  }
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = URL.createObjectURL(blob);
  });
}

/**
 * Load one video's entire frame sequence.
 * @param {'v1'|'v2'} id
 * @param {number} count
 * @param {(n: number) => void} onProgress called with loaded count so far
 * @returns {Promise<ImageBitmap[]>}
 */
async function loadSequence(id, count, onProgress) {
  const bitmaps = new Array(count);
  const BATCH = 12;
  let loaded = 0;

  for (let i = 0; i < count; i += BATCH) {
    const end = Math.min(i + BATCH, count);
    const batch = [];
    for (let j = i; j < end; j++) {
      const src = `/frames/${id}/${String(j + 1).padStart(4, '0')}.${FRAME_EXT}`;
      batch.push(
        loadBitmap(src).then(bm => {
          bitmaps[j] = bm;
        })
      );
    }
    await Promise.all(batch);
    loaded += end - i;
    onProgress(loaded);
  }
  return bitmaps;
}

/**
 * Load all frames for both videos.
 * @param {(progress: number) => void} onProgress 0–1
 * @returns {Promise<{ v1: ImageBitmap[], v2: ImageBitmap[] }>}
 */
export async function loadAllFrames(onProgress) {
  const total = VIDEO1_FRAMES + VIDEO2_FRAMES;
  let done = 0;

  function progress(n) {
    done += n;
    onProgress(Math.min(done / total, 1));
  }

  try {
    const testRes = await fetch(`/frames/v1/0001.${FRAME_EXT}`, { method: 'HEAD' });
    if (!testRes.ok) throw new Error('no frames');

    const [v1, v2] = await Promise.all([
      loadSequence('v1', VIDEO1_FRAMES, n => progress(n)),
      loadSequence('v2', VIDEO2_FRAMES, n => progress(n)),
    ]);
    return { v1, v2 };
  } catch (err) {
    console.warn('[loader] Frame files not found or error loading:', err);
    onProgress(1);
    return { v1: [], v2: [] };
  }
}
