/**
 * Full render for ep001_nexus_weaver - 5 minutes (7200 frames)
 * Debug version with verbose logging
 */

import { createCanvas } from 'canvas';
import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { drawBackground } from './engine/bg.js';
import { drawCelCharacter } from './engine/cel.js';
import { drawFX } from './engine/fx.js';
import { applyCRTPass } from './engine/post.js';
import { Cipher } from './characters/cipher.js';
import { Echo } from './characters/echo.js';
import { Voxel } from './characters/voxel.js';
import { Silhouette } from './characters/silhouette.js';
import { interpolateCamera } from './engine/camera.js';

const W = 1920, H = 1080, FPS = 24;

console.log('Loading scene JSON...');
const scene = JSON.parse(readFileSync('./episodes/ep001_nexus_weaver.json', 'utf8'));
console.log('Scene loaded:', scene.meta.title);

const DURATION = scene.meta.duration;
const FRAMES = DURATION * FPS;
console.log(`Duration: ${DURATION}s, FPS: ${FPS}, Total frames: ${FRAMES}`);

const canvas = createCanvas(W, H);
const ctx = canvas.getContext('2d');
console.log('Canvas created:', W, 'x', H);

const characters = { cipher: Cipher, echo: Echo, voxel: Voxel, silhouette: Silhouette };
console.log('Characters loaded:', Object.keys(characters));

const FRAME_DIR = './episodes/ep001_nexus_weaver/work/frames';
if (!existsSync(FRAME_DIR)) {
    mkdirSync(FRAME_DIR, { recursive: true });
    console.log('Created frame directory:', FRAME_DIR);
}

console.log(`Rendering ${FRAMES} frames (${DURATION}s @ ${FPS}fps)...`);
const startTime = Date.now();

let lastLogTime = 0;
for (let f = 0; f < FRAMES; f++) {
  const t = f / FPS;
  
  try {
    renderFrame(t);
  } catch (err) {
    console.error(`Error at frame ${f} (t=${t.toFixed(2)}s):`, err.message);
    console.error(err.stack);
    process.exit(1);
  }
  
  // Apply CRT post-pass
  try {
    applyCRTPass(ctx, canvas, scene.meta.crt || {}, t);
  } catch (err) {
    console.error(`CRT pass error at frame ${f}:`, err.message);
    process.exit(1);
  }
  
  // Save frame
  const buf = canvas.toBuffer('image/png');
  writeFileSync(join(FRAME_DIR, `frame_${String(f).padStart(5, '0')}.png`), buf);
  
  // Progress logging every 10 seconds of video (240 frames)
  if (f % 240 === 0) {
    const elapsed = (Date.now() - startTime) / 1000;
    const remaining = (elapsed / (f + 1)) * (FRAMES - f - 1);
    console.log(`Frame ${f}/${FRAMES} (${Math.round(f/FRAMES*100)}%) | ${Math.round(elapsed/60)}min elapsed | ~${Math.round(remaining/60)}min remaining`);
  }
  
  // Also log every 100 frames for visibility
  if (f % 100 === 0 && f > 0) {
    console.log(`  ... frame ${f} done`);
  }
}

const totalTime = (Date.now() - startTime) / 1000;
console.log(`✅ All ${FRAMES} frames rendered in ${Math.round(totalTime/60)} minutes!`);
console.log(`Now encode with: ffmpeg -y -framerate 24 -i ${FRAME_DIR}/frame_%05d.png -c:v libx264 -preset medium -crf 18 -pix_fmt yuv420p episodes/ep001_nexus_weaver/ep001_nexus_weaver.mp4`);

function renderFrame(t) {
  ctx.save();
  ctx.clearRect(0, 0, W, H);
  
  // Find active shot
  const shot = scene.shots.find(s => t >= s.startTime && t < s.endTime);
  if (!shot) {
    // No active shot at this time - render empty frame
    ctx.restore();
    return;
  }
  
  const shotTime = t - shot.startTime;
  const shotDuration = shot.endTime - shot.startTime;
  const shotProgress = shotDuration > 0 ? shotTime / shotDuration : 0;
  
  // Camera
  const cam = interpolateCamera(shot.camera, shotProgress);
  
  // Background
  const loc = scene.locations[shot.location];
  if (!loc) {
    console.warn(`Location not found: ${shot.location} at t=${t}`);
  } else {
    drawBackground(ctx, loc.id, t, cam);
  }
  
  // Characters
  if (shot.characters) {
    shot.characters.forEach(ch => {
      const char = characters[ch.character];
      if (!char) {
        console.warn(`Character not found: ${ch.character} at t=${t}`);
        return;
      }
      
      const state = {
        x: (ch.x || 0) * W,
        y: (ch.y || 0) * H,
        scale: ch.scale || 1,
        pose: ch.pose || 'idle',
        expression: ch.expression || 'neutral',
        phoneme: ch.phoneme || 'default'
      };
      
      drawCelCharacter(ctx, char, state, t);
    });
  }
  
  // Effects
  if (shot.effects) {
    shot.effects.forEach(fx => {
      if (t >= fx.start && t < fx.end) {
        const fxProgress = (t - fx.start) / (fx.end - fx.start);
        drawFX(ctx, fx.type, fx.config, fxProgress, W, H);
      }
    });
  }
  
  ctx.restore();
}