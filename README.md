# 💍 Our Promise

A mobile-first, scroll-driven web experience — a virtual promise-ring proposal.

**Stack:** Vite · Vanilla JS · Three.js · GSAP + ScrollTrigger · Lenis smooth scroll

---

## Quick Start

```bash
npm install
npm run dev
```

The app runs in **dev / placeholder mode** until you drop in your assets. Everything still loads and you can see the full flow.

---

## Personalising the Experience

Open **`src/config.js`** — this is the **only file you need to edit** for content:

| Field | What it does |
|---|---|
| `HER_NAME` | Shown in the loader ("Something for you, …") and letter salutation |
| `YOUR_NAME` | Signed at the bottom of the letter |
| `LETTER` | Array of strings — each becomes a line (empty string = blank line) |
| `LETTER_CLOSING` | The final italic closing line |
| `CAPTIONS_V1` | Caption text + `inAt`/`outAt` as a 0–1 fraction of scene 1 scroll |
| `CAPTIONS_V2` | Same for scene 2 |
| `VIDEO1_FRAMES` | Total number of frames you export from video 1 |
| `VIDEO2_FRAMES` | Total number of frames from video 2 |
| `VIDEO1_SCROLL_HEIGHT` | Scroll distance (px) for video 1 — higher = slower |
| `VIDEO2_SCROLL_HEIGHT` | Scroll distance (px) for video 2 |
| `RING_ANCHOR` | `{ x, y }` — normalised (0–1) position of her ring finger in the last frame of video 2 |
| `MUSIC_SRC` | Path to your MP3, e.g. `'/music.mp3'` |

---

## Adding Your Assets

### Video Files

Drop these into `assets/` at the project root (sibling of `public/`):

```
assets/
  video1-proposal.mp4
  video2-ring-on-finger.mp4
  ring.glb
```

### Converting Videos to Frame Sequences

You can either run the automated extraction script or run the **ffmpeg** commands manually.

#### Option A: Automated script (Recommended)
```bash
node scripts/extract_frames.cjs
```
This extracts high-quality WebP frames (24 fps, 960x540) to `public/frames/v1/` and `public/frames/v2/`, and places `ring.glb` into `public/assets/ring.glb`.

#### Option B: Manual ffmpeg commands
From the project root:

**Video 1:**
```bash
ffmpeg -i assets/video1-proposal.mp4 \
  -vf "scale=960:-2,format=yuv420p" \
  -r 24 \
  -q:v 75 \
  public/frames/v1/%04d.webp
```

**Video 2:**
```bash
ffmpeg -i assets/video2-ring-on-finger.mp4 \
  -vf "scale=960:-2,format=yuv420p" \
  -r 24 \
  -q:v 75 \
  public/frames/v2/%04d.webp
```

> **Tip:** Check the actual frame count after conversion:
> ```bash
> # Windows PowerShell
> (Get-ChildItem public/frames/v1/*.webp).Count
> (Get-ChildItem public/frames/v2/*.webp).Count
> ```
> Update `VIDEO1_FRAMES` and `VIDEO2_FRAMES` in `config.js` to match (currently set to 121 frames).

### 3D Ring Model

Copy `ring.glb` to `public/assets/ring.glb`. The app auto-applies:
- **Band** → `MeshStandardMaterial` (platinum: metalness 1, roughness 0.12)
- **Diamond** → `MeshPhysicalMaterial` (transmission 1, IOR 2.4, clearcoat)

If your model has differently named meshes, adjust `_isDiamond()` in `src/ring3d.js`.

### Music

Drop an MP3 into `public/` and set `MUSIC_SRC: '/your-song.mp3'` in `config.js`.

---

## Tweaking RING_ANCHOR

`RING_ANCHOR` controls where the 3D ring appears to lift off from in the final frame of video 2.

1. Open your last video frame (e.g. `public/frames/v2/0168.webp`)
2. In any image editor, find the centre of the ring on her finger
3. Divide: `x = pixelX / imageWidth`,  `y = pixelY / imageHeight`
4. Set these in `config.js`:
   ```js
   RING_ANCHOR: { x: 0.54, y: 0.48 },  // example
   ```
5. Save and refresh — the 3D ring will animate from that position to the screen centre.

---

## Project Structure

```
promise-ring/
├── public/
│   ├── frames/
│   │   ├── v1/          ← WebP frames for video 1 (0001.webp …)
│   │   └── v2/          ← WebP frames for video 2
│   └── assets/
│       └── ring.glb     ← 3D ring model
├── src/
│   ├── config.js        ← ✏️  All personalisation here
│   ├── main.js          ← App orchestrator
│   ├── style.css        ← Design system
│   ├── loader.js        ← Frame preloader (createImageBitmap)
│   ├── scrubber.js      ← Canvas frame renderer (cover-fit, DPR≤2)
│   ├── scenes.js        ← GSAP ScrollTrigger orchestration
│   ├── particles.js     ← 2D petal + sparkle system
│   ├── ring3d.js        ← Three.js ring (GLTFLoader + materials)
│   └── finale.js        ← Ring lift-off + letter reveal
├── assets/              ← Drop source videos + ring.glb here (not served)
├── vite.config.js
└── index.html
```

---

## Deploy

### Vercel

```bash
npm run build
npx vercel --prod
```

Or connect your GitHub repo in the Vercel dashboard — it auto-detects Vite.

### Netlify

```bash
npm run build
npx netlify deploy --prod --dir=dist
```

Or drag the `dist/` folder onto [app.netlify.com/drop](https://app.netlify.com/drop).

> **Note:** The `public/frames/` directories can be large (100–300 MB). If your host has a size limit, consider uploading frames to a CDN (Cloudflare R2, Bunny, etc.) and updating the paths in `loader.js`.

---

## Performance Notes

- **`createImageBitmap`** pre-decodes frames off the main thread
- **DPR capped at 2** — prevents 3× decode on high-density displays
- **Batch loading** (8 at a time) avoids network saturation on mobile
- **No per-frame DOM work** — only canvas `drawImage` inside rAF
- **Manual chunk splitting** in Vite keeps the main bundle under ~50 KB

---

## Accessibility

- All interactive elements have ARIA labels and 44px minimum tap targets
- `prefers-reduced-motion` disables all animations
- Question card is a proper `role="dialog"` with focus management
- Music toggle is clearly labelled

---

## Licence

Private — made with love. Please don't share. 💕
