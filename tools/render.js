/**
 * Main render engine — orchestrates all engines to render frames
 */

import { loadScene, saveFrame, getFrameCount } from '../tools/io.js';
import { drawBackground } from '../engine/bg.js';
import { drawCelCharacter } from '../engine/cel.js';
import { drawFX } from '../engine/fx.js';
import { applyCRTPass } from '../engine/post.js';
import { loadCharacters } from '../tools/characters.js';
import { interpolateCamera } from '../engine/camera.js';

const W = 1920, H = 1080, FPS = 24;
const canvas = new OffscreenCanvas(W, H);
const ctx = canvas.getContext('2d');

let scene, characters, frameCount, currentFrame = 0;

export async function render(scenePath, outputDir) {
  console.log('Loading scene...');
  scene = await loadScene(scenePath);
  
  console.log('Loading characters...');
  characters = await loadCharacters(scene.characters);
  
  frameCount = getFrameCount(scene.meta.duration, scene.meta.fps || 24);
  console.log(`Rendering ${frameCount} frames @ ${scene.meta.fps || 24}fps...`);
  
  for (let f = 0; f < frameCount; f++) {
    const t = f / (scene.meta.fps || 24);
    renderFrame(t);
    
    // Apply CRT post-pass
    applyCRTPass(ctx, canvas, scene.meta.crt || {}, t);
    
    // Save frame
    await saveFrame(canvas, outputDir, f);
    
    currentFrame = f;
    if (f % 100 === 0) console.log(`Frame ${f}/${frameCount}`);
  }
  
  console.log('Render complete!');
}

function renderFrame(t) {
  ctx.save();
  ctx.clearRect(0, 0, 1920, 1080);
  
  // 1. Find active shot
  const shot = scene.shots.find(s => t >= s.startTime && t < s.endTime);
  if (!shot) return;
  
  const shotTime = t - shot.startTime;
  const shotDuration = shot.endTime - shot.startTime;
  const shotProgress = shotTime / shotDuration;
  
  // 2. Camera
  const cam = interpolateCamera(shot.camera, shotProgress);
  
  // 3. Background
  const loc = scene.locations[shot.location];
  drawBackground(ctx, loc.id, t, cam);
  
  // 4. Characters
  if (shot.characters) {
    shot.characters.forEach(ch => {
      const char = characters[ch.character];
      if (!char) return;
      
      const state = {
        x: (ch.x || 0) * 1920,
        y: (ch.y || 0) * 1080,
        scale: ch.scale || 1,
        pose: ch.pose || char.defaultPose,
        expression: ch.expression || char.defaultExpression,
        phoneme: ch.phoneme || 'default',
        // animations...
      };
      
      drawCelCharacter(ctx, char, state, t);
    });
  }
  
  // 5. Effects
  if (shot.effects) {
    shot.effects.forEach(fx => {
      if (t >= fx.start && t < fx.end) {
        const fxProgress = (t - fx.start) / (fx.end - fx.start);
        drawFX(ctx, fx.type, fx.config, fxProgress, 1920, 1080);
      }
    });
  }
  
  // 6. Subtitles (burned in)
  // drawSubtitles(ctx, t, shot.narration);
  
  ctx.restore();
}

export { renderFrame };