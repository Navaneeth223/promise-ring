const ffmpeg = require('@ffmpeg-installer/ffmpeg');
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const root = __dirname;
const v1Dir = path.join(root, 'public', 'frames', 'v1');
const v2Dir = path.join(root, 'public', 'frames', 'v2');
const assetsDir = path.join(root, 'assets');
const publicAssetsDir = path.join(root, 'public', 'assets');

if (!fs.existsSync(assetsDir)) fs.mkdirSync(assetsDir, { recursive: true });
if (!fs.existsSync(publicAssetsDir)) fs.mkdirSync(publicAssetsDir, { recursive: true });

// Copy 3D model to intended place
const glbSource = path.join(root, 'public', 'frames', 'heart+ring+3d+model.glb');
if (fs.existsSync(glbSource)) {
  fs.copyFileSync(glbSource, path.join(publicAssetsDir, 'ring.glb'));
  fs.copyFileSync(glbSource, path.join(assetsDir, 'ring.glb'));
  console.log('Copied ring.glb to public/assets/ring.glb and assets/ring.glb');
}

// Find video files
const v1Files = fs.readdirSync(v1Dir).filter(f => f.endsWith('.mp4'));
const v2Files = fs.readdirSync(v2Dir).filter(f => f.endsWith('.mp4'));

if (v1Files.length === 0 || v2Files.length === 0) {
  console.error('Could not find MP4 files in v1 or v2');
  process.exit(1);
}

const v1Video = path.join(v1Dir, v1Files[0]);
const v2Video = path.join(v2Dir, v2Files[0]);

// Backup videos to assets/
fs.copyFileSync(v1Video, path.join(assetsDir, 'video1-proposal.mp4'));
fs.copyFileSync(v2Video, path.join(assetsDir, 'video2-ring-on-finger.mp4'));
console.log('Backed up videos to assets/');

// Extract frames for v1
console.log('Extracting frames for Video 1...');
const cmd1 = `"${ffmpeg.path}" -y -i "${v1Video}" -vf "scale=960:-2,format=yuv420p" -r 24 -q:v 75 "${path.join(v1Dir, '%04d.webp')}"`;
execSync(cmd1, { stdio: 'inherit' });

// Extract frames for v2
console.log('Extracting frames for Video 2...');
const cmd2 = `"${ffmpeg.path}" -y -i "${v2Video}" -vf "scale=960:-2,format=yuv420p" -r 24 -q:v 75 "${path.join(v2Dir, '%04d.webp')}"`;
execSync(cmd2, { stdio: 'inherit' });

const v1Frames = fs.readdirSync(v1Dir).filter(f => f.endsWith('.webp')).length;
const v2Frames = fs.readdirSync(v2Dir).filter(f => f.endsWith('.webp')).length;

console.log(`Extraction complete!`);
console.log(`Video 1 frames: ${v1Frames}`);
console.log(`Video 2 frames: ${v2Frames}`);
