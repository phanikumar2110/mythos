/**
 * Post-processing — CRT pass, bloom, chromatic aberration, scanlines, vignette, grading
 * Canvas 2D implementation (no WebGL required)
 */

import { TAU, lerp, clamp, mix } from './utils.js';
import { palette } from './palette.js';

export function applyCRTPass(ctx, canvas, config, time) {
  const W = canvas.width, H = canvas.height;
  const {
    scanlineOpacity = 0.18,
    scanlineCount = 1080,
    phosphorGlow = 0.08,
    vignette = 0.45,
    noise = 0.03,
    chromaticAberration = true,
    chromaticShift = 2.5,
    bloom = true,
    bloomThreshold = 0.85,
    bloomIntensity = 1.8,
    bloomRadius = 24,
    colorGrade = true
  } = config;
  
  // Get image data
  const imgData = ctx.getImageData(0, 0, W, H);
  const data = imgData.data;
  
  // 1. Chromatic aberration (shift R/B channels)
  if (chromaticAberration) {
    const shift = Math.sin(Date.now() / 1000 * 8) * chromaticShift;
    applyChromaticAberration(data, W, H, shift);
  }
  
  // 2. Bloom (bright areas glow)
  if (bloom) {
    applyBloom(data, W, H, bloomThreshold, bloomIntensity, bloomRadius);
  }
  
  // 3. Color grading
  if (colorGrade) {
    applyColorGrade(data, W, H);
  }
  
  // Put back
  ctx.putImageData(imgData, 0, 0);
  
  // 4. Scanlines (drawn on top)
  drawScanlines(ctx, W, H, scanlineOpacity, scanlineCount);
  
  // 5. Phosphor glow
  if (phosphorGlow > 0) {
    drawPhosphorGlow(ctx, canvas, phosphorGlow);
  }
  
  // 6. Vignette
  drawVignette(ctx, W, H, vignette);
  
  // 6. Noise
  if (noise > 0) {
    drawNoise(ctx, W, H, noise);
  }
}

function applyChromaticAberration(data, W, H, shift) {
  // Create temporary buffer for R and B channels
  const tempR = new Uint8ClampedArray(data.length);
  const tempB = new Uint8ClampedArray(data.length);
  const shiftPx = Math.round(shift);
  
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = (y * W + x) * 4;
      const srcX = x + shiftPx;
      const srcX2 = x - shiftPx;
      
      if (srcX >= 0 && srcX < W) {
        const srcI = (y * W + srcX) * 4;
        data[i] = data[srcI]; // R channel
      }
      if (srcX2 >= 0 && srcX2 < W) {
        const srcI2 = (y * W + srcX2) * 4;
        data[i + 2] = data[srcI2 + 2]; // B channel
      }
    }
  }
}

function applyBloom(data, W, H, threshold, intensity, radius) {
  // Simple bloom: find bright pixels, blur them, add back
  const bright = new Uint8Array(data.length / 4);
  
  // Extract brightness
  for (let i = 0; i < data.length; i += 4) {
    const luma = 0.2126 * data[i] + 0.7152 * data[i+1] + 0.0722 * data[i+2];
    bright[i/4] = luma > threshold * 255 ? luma : 0;
  }
  
  // Simple box blur (horizontal + vertical)
  const blurred = new Float32Array(bright.length);
  const r = Math.round(radius / 4);
  
  // Horizontal
  for (let y = 0; y < H; y++) {
    let sum = 0;
    for (let x = -r; x <= r; x++) sum += bright[y * W + clamp(x, 0, W-1)];
    blurred[y * W] = sum / (2*r+1);
    for (let x = 1; x < W; x++) {
      sum += bright[y * W + clamp(x+r, 0, W-1)] - bright[y * W + clamp(x-r-1, 0, W-1)];
      blurred[y * W + x] = sum / (2*r+1);
    }
  }
  
  // Vertical
  const final = new Float32Array(bright.length);
  for (let x = 0; x < W; x++) {
    let sum = 0;
    for (let y = -r; y <= r; y++) sum += blurred[clamp(y, 0, H-1) * W + x];
    final[x] = sum / (2*r+1);
    for (let y = 1; y < H; y++) {
      sum += blurred[clamp(y+r, 0, H-1) * W + x] - blurred[clamp(y-r-1, 0, H-1) * W + x];
      final[y * W + x] = sum / (2*r+1);
    }
  }
  
  // Add bloom back
  for (let i = 0; i < data.length; i += 4) {
    const idx = i / 4;
    const bloom = final[idx] * intensity / 255;
    data[i] = Math.min(255, data[i] + bloom * 255);
    data[i+1] = Math.min(255, data[i+1] + bloom * 255);
    data[i+2] = Math.min(255, data[i+2] + bloom * 255);
  }
}

function applyColorGrade(data, W, H) {
  // Cyan-teal lift in shadows, warm highlights
  for (let i = 0; i < data.length; i += 4) {
    let r = data[i] / 255, g = data[i+1] / 255, b = data[i+2] / 255;
    const luma = 0.2126*r + 0.7152*g + 0.0722*b;
    
    if (luma < 0.3) {
      // Shadows: cyan teal lift
      r = lerp(r, 0.05, 0.3);
      g = lerp(g, 0.4, 0.3);
      b = lerp(b, 0.6, 0.3);
    } else if (luma > 0.7) {
      // Highlights: slight warmth
      r = lerp(r, 1.0, 0.1);
      g = lerp(g, 0.95, 0.1);
      b = lerp(b, 0.85, 0.1);
    }
    
    // Contrast boost
    r = Math.pow(r, 0.95);
    g = Math.pow(g, 0.95);
    b = Math.pow(b, 0.95);
    
    data[i] = Math.round(clamp(r, 0, 1) * 255);
    data[i+1] = Math.round(clamp(g, 0, 1) * 255);
    data[i+2] = Math.round(clamp(b, 0, 1) * 255);
  }
}

function drawScanlines(ctx, W, H, opacity, count) {
  ctx.save();
  ctx.globalCompositeOperation = 'multiply';
  ctx.strokeStyle = `rgba(0,0,0,${opacity})`;
  ctx.lineWidth = 1;
  ctx.beginPath();
  const step = H / count;
  for (let y = 0; y < H; y += step * 2) {
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
  }
  ctx.stroke();
  ctx.restore();
}

function drawPhosphorGlow(ctx, canvas, intensity) {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.filter = `blur(2px)`;
  ctx.globalAlpha = intensity;
  ctx.drawImage(canvas, 0, 0);
  ctx.filter = 'none';
  ctx.restore();
}

function drawVignette(ctx, W, H, strength) {
  ctx.save();
  const grad = ctx.createRadialGradient(W/2, H/2, Math.min(W,H)*0.3, W/2, H/2, Math.max(W,H)*0.7);
  grad.addColorStop(0, 'rgba(0,0,0,0)');
  grad.addColorStop(1, `rgba(0,0,0,${strength})`);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);
  ctx.restore();
}

function drawNoise(ctx, W, H, opacity) {
  ctx.save();
  ctx.globalAlpha = opacity;
  ctx.globalCompositeOperation = 'overlay';
  for (let y = 0; y < H; y += 2) {
    for (let x = 0; x < W; x += 2) {
      const n = Math.sin(x * 12.9898 + y * 78.233 + Date.now() * 0.001) * 43758.5453;
      const val = n - Math.floor(n);
      if (val > 0.5) {
        ctx.fillStyle = val > 0.75 ? '#ffffff' : '#000000';
        ctx.fillRect(x, y, 2, 2);
      }
    }
  }
  ctx.restore();
}

export function applyPowerOn(ctx, canvas, progress) {
  // Dot -> line -> picture expansion
  const W = canvas.width, H = canvas.height;
  ctx.save();
  if (progress < 0.3) {
    // Dot
    const r = lerp(0, Math.min(W,H)*0.5, progress/0.3);
    ctx.fillStyle = '#00f0ff';
    ctx.beginPath();
    ctx.arc(W/2, H/2, r, 0, TAU);
    ctx.fill();
  } else if (progress < 0.6) {
    // Horizontal line expanding
    const w = lerp(0, W, (progress-0.3)/0.3);
    ctx.fillStyle = '#00f0ff';
    ctx.fillRect(W/2 - w/2, H/2 - 2, w, 4);
  } else {
    // Full picture reveal with light sweep
    const p = (progress - 0.6) / 0.4;
    ctx.globalAlpha = p;
  }
  ctx.restore();
}

export function applyTrackingNoise(ctx, progress, W, H) {
  if (progress > 1) return;
  ctx.save();
  ctx.globalAlpha = 1 - progress;
  ctx.globalCompositeOperation = 'overlay';
  for (let y = 0; y < H; y += 4) {
    const offset = Math.sin(Date.now() * 0.01 + y * 0.1) * (1-progress) * 8;
    ctx.drawImage(ctx.canvas, offset, y, W, 4, 0, y, W, 4);
  }
  ctx.restore();
}

export default { applyCRTPass, applyPowerOn, applyTrackingNoise };