/**
 * Full render for ep001_nexus_weaver - 5 minutes (7200 frames)
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
const scene = JSON.parse(readFileSync('./episodes/ep001_nexus_weaver.json', 'utf8'));
const DURATION = scene.meta.duration;
const FRAMES = DURATION * FPS;

const canvas = createCanvas(W, H);
const ctx = canvas.getContext('2d');

const characters = { cipher: Cipher, echo: Echo, voxel: Voxel, silhouette: Silhouette };

const FRAME_DIR = './episodes/ep001_nexus_weaver/work/frames';
if (!existsSync(FRAME_DIR)) mkdirSync(FRAME_DIR, { recursive: true });

console.log(`Rendering ${FRAMES} frames (${DURATION}s @ ${FPS}fps)...`);
const startTime = Date.now();

for (let f = 0; f < FRAMES; f++) {
  const t = f / FPS;
  renderFrame(t);
  
  applyCRTPass(ctx, canvas, scene.meta.crt || {}, t);
  
  const buf = canvas.toBuffer('image/png');
  writeFileSync(join(FRAME_DIR, `frame_${String(f).padStart(5, '0')}.png`), buf);
  
  if (f % 720 === 0) {
    const elapsed = (Date.now() - startTime) / 1000;
    const remaining = (elapsed / (f + 1)) * (FRAMES - f - 1);
    console.log(`Frame ${f}/${FRAMES} (${Math.round(f/FRAMES*100)}%) | ${Math.round(elapsed/60)}min elapsed | ~${Math.round(remaining/60)}min remaining`);
  }
}

const totalTime = (Date.now() - startTime) / 1000;
console.log(`✅ All ${FRAMES} frames rendered in ${Math.round(totalTime/60)} minutes!`);
console.log(`Now encode with: ffmpeg -y -framerate 24 -i ${FRAME_DIR}/frame_%05d.png -c:v libx264 -preset medium -crf 18 -pix_fmt yuv420p episodes/ep001_nexus_weaver/ep001_nexus_weaver.mp4`);

function renderFrame(t) {
  ctx.save();
  ctx.clearRect(0, 0, W, H);
  
  const shot = scene.shots.find(s => t >= s.startTime && t < s.endTime);
  if (!shot) return;
  
  const shotTime = t - shot.startTime;
  const shotDuration = shot.endTime - shot.startTime;
  const shotProgress = shotDuration > 0 ? shotTime / shotDuration : 0;
  
  const cam = interpolateCamera(shot.camera, shotProgress);
  const loc = scene.locations[shot.location];
  drawBackground(ctx, loc.id, t, cam);
  
  if (shot.characters) {
    shot.characters.forEach(ch => {
      const char = characters[ch.character];
      if (!char) return;
      
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