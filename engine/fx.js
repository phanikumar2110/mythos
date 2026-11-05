/**
 * FX effects — speed lines, impact frames, glitch telegraph, light sweeps, chromatic aberration
 */

import { TAU, lerp, clamp, hash, smoothPulse } from './utils.js';
import { palette } from './palette.js';

export function drawSpeedLines(ctx, config, time, W, H) {
  const { centerX = W/2, centerY = H/2, count = 30, length = 0.8, color = '#00f0ff', speed = 4, opacity = 0.6 } = config;
  
  ctx.save();
  ctx.strokeStyle = color;
  ctx.globalAlpha = opacity;
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * TAU + time * speed;
    const r0 = Math.min(W, H) * 0.1;
    const r1 = Math.min(W, H) * length;
    const x0 = centerX + Math.cos(angle) * r0;
    const y0 = centerY + Math.sin(angle) * r0;
    const x1 = centerX + Math.cos(angle) * r1;
    const y1 = centerY + Math.sin(angle) * r1;
    
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.stroke();
  }
  ctx.restore();
}

export function drawImpactFrame(ctx, config, progress, W, H) {
  // 2-frame inverted silhouette over radial lines
  const { color = '#ffffff', radialCount = 24, maxRadius = 0.8 } = config;
  const eased = progress < 0.5 ? progress * 2 : 1 - (progress - 0.5) * 2;
  
  ctx.save();
  ctx.globalCompositeOperation = 'difference';
  ctx.fillStyle = color;
  
  // Radial burst
  for (let i = 0; i < config.radialCount; i++) {
    const angle = (i / config.radialCount) * TAU;
    const r = maxRadius * Math.min(W, H) * eased;
    ctx.save();
    ctx.translate(W/2, H/2);
    ctx.rotate(angle);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(r * eased, 0);
    ctx.strokeStyle = config.color;
    ctx.lineWidth = 3 * (1 - eased);
    ctx.stroke();
    ctx.restore();
  }
  
  // Inverted silhouette
  if (config.silhouette) {
    ctx.globalCompositeOperation = 'difference';
    ctx.fillStyle = '#ffffff';
    config.silhouette(ctx);
  }
  ctx.restore();
}

export function drawGlitchTelegraph(ctx, config, time, W, H) {
  const { intensity = 1, color = '#ff2a5f', scanlineCount = 8 } = config;
  
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.strokeStyle = config.color;
  ctx.lineWidth = 2;
  
  // Horizontal tear lines
  for (let i = 0; i < scanlineCount; i++) {
    const y = hash(time * 10 + i) * H;
    const tearX = (Math.sin(time * 20 + i) * intensity) * 50;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
    
    // Offset segment
    if (Math.random() < 0.3) {
      ctx.beginPath();
      ctx.moveTo(tearX, y);
      ctx.lineTo(W, y);
      ctx.stroke();
    }
  }
  ctx.restore();
}

export function drawLightSweep(ctx, config, progress, W, H) {
  const { color = '#00f0ff', width = 0.15, angle = -0.6, softness = 0.3 } = config;
  
  const x = lerp(-W * 0.5, W * 1.5, progress);
  
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const grad = ctx.createLinearGradient(
    x - width * W * 0.5, 0,
    x + width * W * 0.5, 0
  );
  grad.addColorStop(0, 'rgba(0,0,0,0)');
  grad.addColorStop(0.5 - softness/2, config.color + '00');
  grad.addColorStop(0.5, config.color + '80');
  grad.addColorStop(0.5 + softness/2, config.color + '00');
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  
  ctx.fillStyle = grad;
  ctx.save();
  ctx.translate(W/2, H/2);
  ctx.rotate(angle);
  ctx.fillRect(-W, -H, W*2, H*2);
  ctx.restore();
  ctx.restore();
}

export function drawChromaticAberration(ctx, config, time, W, H) {
  const { shift = 3, speed = 8, colors = ['#ff2a5f', '#00f0ff', '#39ff14'] } = config;
  
  // This is applied as a post-process in post.js
  // Here we return parameters for the shader
  const shiftX = Math.sin(time * speed) * shift;
  return {
    redShift: { x: shiftX, y: 0 },
    greenShift: { x: 0, y: 0 },
    blueShift: { x: -shiftX, y: 0 }
  };
}

export function drawScanlineTelegraph(ctx, config, time, W, H) {
  const { color = '#39ff14', lineCount = 5, opacity = 0.4 } = config;
  
  ctx.save();
  ctx.strokeStyle = config.color;
  ctx.globalAlpha = opacity;
  ctx.lineWidth = 1;
  
  for (let i = 0; i < config.lineCount; i++) {
    const y = H * (i + 0.5) / config.lineCount + Math.sin(time * 10 + i) * 10;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
  }
  ctx.restore();
}

export function drawFrameDrop(ctx, probability = 0.02) {
  return Math.random() < probability;
}

export function drawNoiseOverlay(ctx, config, time, W, H) {
  const { opacity = 0.03, scale = 2 } = config;
  
  ctx.save();
  ctx.globalAlpha = opacity;
  ctx.globalCompositeOperation = 'overlay';
  
  // Simple noise pattern
  for (let y = 0; y < H; y += scale) {
    for (let x = 0; x < W; x += scale) {
      const n = Math.sin(x * 12.9898 + y * 78.233 + time * 0.1) * 43758.5453;
      const val = n - Math.floor(n);
      if (val > 0.5) {
        ctx.fillStyle = val > 0.75 ? '#ffffff' : '#000000';
        ctx.fillRect(x, y, scale, scale);
      }
    }
  }
  ctx.restore();
}

export function drawFX(ctx, type, config, progress, W, H) {
  switch (type) {
    case 'speedLines': return drawSpeedLines(ctx, config, progress, W, H);
    case 'impactFrame': return drawImpactFrame(ctx, config, progress, W, H);
    case 'glitch': return drawGlitchTelegraph(ctx, config, progress, W, H);
    case 'lightSweep': return drawLightSweep(ctx, config, progress, W, H);
    case 'chromaticAberration': return drawChromaticAberration(ctx, config, progress, W, H);
    case 'scanlineTelegraph': return drawScanlineTelegraph(ctx, config, progress, W, H);
    case 'frameDrop': return drawFrameDrop(ctx, config, progress, W, H);
    case 'noiseOverlay': return drawNoiseOverlay(ctx, config, progress, W, H);
    case 'powerOn': return drawPowerOn(ctx, config, progress, W, H);
    default: console.warn(`Unknown FX type: ${type}`);
  }
}

// Power-on sequence: dot -> line -> picture reveal
export function drawPowerOn(ctx, config, progress, W, H) {
  const { color = '#00f0ff' } = config;
  
  ctx.save();
  if (progress < 0.3) {
    // Dot expanding
    const r = lerp(0, Math.min(W, H) * 0.5, progress / 0.3);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(W/2, H/2, r, 0, TAU);
    ctx.fill();
  } else if (progress < 0.6) {
    // Horizontal line expanding
    const w = lerp(0, W, (progress - 0.3) / 0.3);
    ctx.fillStyle = color;
    ctx.fillRect(W/2 - w/2, H/2 - 2, w, 4);
  } else {
    // Full picture reveal with light sweep
    const p = (progress - 0.6) / 0.4;
    ctx.globalAlpha = p;
  }
  ctx.restore();
}

export default {
  drawSpeedLines,
  drawImpactFrame,
  drawGlitchTelegraph,
  drawLightSweep,
  drawChromaticAberration,
  drawScanlineTelegraph,
  drawFrameDrop,
  drawNoiseOverlay,
  drawFX
};