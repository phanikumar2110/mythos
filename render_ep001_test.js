/**
 * Quick test render for new episode
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
const FRAMES = 10;

const canvas = createCanvas(W, H);
const ctx = canvas.getContext('2d');

const scene = JSON.parse(readFileSync('./episodes/ep001_nexus_weaver.json', 'utf8'));
const characters = { cipher: Cipher, echo: Echo, voxel: Voxel, silhouette: Silhouette };

const FRAME_DIR = './episodes/ep001_nexus_weaver/work/frames';
if (!existsSync(FRAME_DIR)) mkdirSync(FRAME_DIR, { recursive: true });

console.log(`Testing ${FRAMES} frames for ep001_nexus_weaver...`);

for (let f = 0; f < FRAMES; f++) {
  const t = (f / (FRAMES - 1)) * scene.meta.duration;
  renderFrame(t);
  
  applyCRTPass(ctx, canvas, scene.meta.crt || {}, t);
  
  const buf = canvas.toBuffer('image/png');
  writeFileSync(join(FRAME_DIR, `frame_${String(f).padStart(5, '0')}.png`), buf);
  
  console.log(`Frame ${f+1}/${FRAMES} (t=${t.toFixed(2)}s)`);
}

console.log('✅ Test frames rendered!');
console.log('Full render: node render_full.js (after creating it)');
console.log('Then encode with ffmpeg');

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