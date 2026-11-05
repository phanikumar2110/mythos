/**
 * Self-contained demo renderer for CipherBase Episode 001
 * Runs directly with Node.js (no external tools needed for demo)
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

const W = 1920, H = 1080, FPS = 24, DURATION = 30;
const FRAMES = DURATION * FPS;

// Load scene JSON
const scene = JSON.parse(readFileSync('./episodes/demo_episode.json', 'utf8'));

const canvas = createCanvas(W, H);
const ctx = canvas.getContext('2d');

// Character registry
const characters = { cipher: Cipher, echo: Echo, voxel: Voxel, silhouette: Silhouette };

const FRAME_DIR = './episodes/demo_episode/work/frames';
if (!existsSync(FRAME_DIR)) mkdirSync(FRAME_DIR, { recursive: true });

console.log(`Rendering ${FRAMES} frames @ ${FPS}fps...`);

for (let f = 0; f < FRAMES; f++) {
  const t = f / FPS;
  renderFrame(t);
  
  // Apply CRT post-pass
  applyCRTPass(ctx, canvas, scene.meta.crt || {}, t);
  
  // Save frame
  const buf = canvas.toBuffer('image/png');
  writeFileSync(join(FRAME_DIR, `frame_${String(f).padStart(5, '0')}.png`), buf);
  
  if (f % 240 === 0) console.log(`Frame ${f}/${FRAMES} (${Math.round(f/FRAMES*100)}%)`);
}

console.log('✅ Frames rendered. Now run ffmpeg to encode:');
console.log(`ffmpeg -y -framerate 24 -i ./episodes/demo_episode/work/frames/frame_%05d.png -c:v libx264 -preset medium -crf 18 -pix_fmt yuv420p episodes/demo_episode/demo_episode.mp4`);

function renderFrame(t) {
  ctx.save();
  ctx.clearRect(0, 0, W, H);
  
  // Find active shot
  const shot = scene.shots.find(s => t >= s.startTime && t < s.endTime);
  if (!shot) return;
  
  const shotTime = t - shot.startTime;
  const shotDuration = shot.endTime - shot.startTime;
  const shotProgress = shotDuration > 0 ? shotTime / shotDuration : 0;
  
  // Camera
  const cam = interpolateCamera(shot.camera, shotProgress);
  
  // Background
  const loc = scene.locations[shot.location];
  drawBackground(ctx, loc.id, t, cam);
  
  // Characters
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