/**
 * Background rendering — painted plates, grid voids, parallax layers, volumetric lighting
 */

import { TAU, lerp, clamp, hash, mix } from './utils.js';
import { palette } from './palette.js';

function drawBackground(ctx, location, time, cam) {
  const loc = locations[location] || locations.infinite_grid_void;
  const W = ctx.canvas.width, H = ctx.canvas.height;
  
  // Base fill
  ctx.fillStyle = loc.bgColor || '#0a0b10';
  ctx.fillRect(0, 0, W, H);
  
  // Location-specific rendering
  if (loc.type === 'void') {
    drawVoidBackground(ctx, loc, time, cam, W, H);
  } else if (loc.type === 'interior') {
    drawInteriorBackground(ctx, loc, time, cam, W, H);
  } else if (loc.type === 'exterior') {
    drawExteriorBackground(ctx, loc, time, cam, W, H);
  }
  
  // Vignette
  drawVignette(ctx, W, H, 0.45);
}

function drawVoidBackground(ctx, loc, time, cam, W, H) {
  const grid = loc.grid;
  if (grid && grid.color) {
    drawPerspectiveGrid(ctx, grid, time, cam, W, H);
  }
  if (loc.particles && loc.particles.enabled) {
    drawDustMotes(ctx, loc.particles, time, W, H);
  }
  if (loc.lightRays) {
    drawVolumetricRays(ctx, loc.lightRays, time, W, H);
  }
}

function drawPerspectiveGrid(ctx, grid, time, cam, W, H) {
  ctx.save();
  ctx.strokeStyle = grid.color;
  ctx.globalAlpha = grid.opacity || 0.08;
  ctx.lineWidth = 0.5;
  
  const vanishY = H * (grid.vanishY || 0.35);
  const spacing = grid.spacing || 64;
  const camY = cam?.y || 0;
  const camX = cam?.x || 0;
  
  // Horizontal lines (perspective)
  if (grid.horizontalLines) {
    for (let i = -20; i <= 20; i++) {
      const y = vanishY + i * spacing + (camY * 0.5) % spacing;
      if (y > H || y < 0) continue;
      const perspective = 1 - (vanishY - y) / (vanishY + H);
      const lineOpacity = clamp(perspective * grid.opacity, 0, grid.opacity);
      ctx.globalAlpha = lineOpacity;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.stroke();
    }
  }
  
  // Vertical lines (perspective)
  if (grid.verticalLines) {
    for (let i = -20; i <= 20; i++) {
      const x = W/2 + i * spacing + (camX * 0.3) % spacing;
      const perspective = Math.abs(x - W/2) / (W/2);
      const lineOpacity = clamp((1 - perspective) * grid.opacity, 0, grid.opacity);
      ctx.globalAlpha = lineOpacity;
      ctx.beginPath();
      const y0 = vanishY;
      const y1 = H;
      ctx.moveTo(x, y0);
      ctx.lineTo(x + (W/2 - x) * 0.3, y1);
      ctx.stroke();
    }
  }
  ctx.restore();
}

function drawDustMotes(ctx, particles, time, W, H) {
  ctx.save();
  ctx.fillStyle = particles.color || '#00f0ff';
  const count = particles.count || 120;
  const seed = 12345;
  let h = seed;
  for (let i = 0; i < count; i++) {
    h = Math.sin(h * 127.1 + 311.7) * 43758.5453;
    h = h - Math.floor(h);
    const x = h * W;
    h = Math.sin(h * 127.1 + 311.7) * 43758.5453;
    h = h - Math.floor(h);
    const y = (h * H + particles.drift?.y * time * 50) % H;
    h = Math.sin(h * 127.1 + 311.7) * 43758.5453;
    h = h - Math.floor(h);
    const size = particles.size?.min + h * (particles.size?.max - particles.size?.min);
    h = Math.sin(h * 127.1 + 311.7) * 43758.5453;
    h = h - Math.floor(h);
    const alpha = (particles.opacity || 0.15) * (0.5 + 0.5 * Math.sin(time * 2 + i));
    ctx.globalAlpha = alpha;
    ctx.beginPath();
    ctx.arc((x + particles.drift?.x * time * 20) % W, y, size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawInteriorBackground(ctx, loc, time, cam, W, H) {
  // Draw elements
  loc.elements?.forEach(el => {
    if (el.type === 'rect') {
      ctx.fillStyle = el.color;
      ctx.fillRect(el.x * W, el.y * H, el.w * W, el.h * H);
      if (el.stroke) {
        ctx.strokeStyle = el.stroke;
        ctx.lineWidth = el.strokeWidth || 1;
        ctx.strokeRect(el.x * W, el.y * H, el.w * W, el.h * H);
      }
      if (el.glow) {
        ctx.save();
        ctx.shadowColor = el.glow;
        ctx.shadowBlur = 20;
        ctx.fillRect(el.x * W, el.y * H, el.w * W, el.h * H);
        ctx.restore();
      }
    } else if (el.type === 'silhouette') {
      ctx.fillStyle = el.color;
      ctx.fillRect(0, el.y * H, W, H * 0.4);
      if (el.lights) {
        // Draw distant lights
        el.lights.forEach((c, i) => {
          ctx.fillStyle = c;
          ctx.beginPath();
          ctx.arc(W * (0.1 + i * 0.2), el.y * H, 3, 0, Math.PI * 2);
          ctx.fill();
        });
      }
    }
  });
  
  // Key lights
  if (loc.lighting?.keyLights) {
    ctx.save();
    loc.lighting.keyLights.forEach(kl => {
      const grad = ctx.createRadialGradient(
        kl.x * W, kl.y * H, 0,
        kl.x * W, kl.y * H, kl.radius * Math.max(W, H)
      );
      grad.addColorStop(0, kl.color + Math.floor(kl.intensity * 255).toString(16).padStart(2, '0'));
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);
    });
    ctx.restore();
  }
}

function drawExteriorBackground(ctx, loc, time, cam, W, H) {
  // Fog gradient
  if (loc.elements) {
    loc.elements.forEach(el => {
      if (el.type === 'gradient') {
        const grad = ctx.createLinearGradient(0, 0, 0, H);
        el.colors.forEach((c, i) => grad.addColorStop(i / (el.colors.length - 1), c));
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, W, H);
      } else if (el.type === 'particles') {
        // Rain
        drawRain(ctx, el, time, W, H);
      } else if (el.type === 'effect') {
        // Lightning
        if (Math.random() < 0.002 || (el.lastFlash && time - el.lastFlash > el.interval?.min)) {
          el.lastFlash = time;
          ctx.save();
          ctx.globalCompositeOperation = 'lighter';
          ctx.fillStyle = el.color;
          ctx.fillRect(0, 0, W, H);
          ctx.restore();
        }
      } else if (el.type === 'silhouette') {
        ctx.fillStyle = el.color;
        ctx.fillRect(0, el.y * H, W, H * 0.4);
      }
    });
  }
}

function drawRain(ctx, el, time, W, H) {
  ctx.save();
  ctx.strokeStyle = el.color;
  ctx.globalAlpha = el.opacity || 0.4;
  ctx.lineWidth = 1;
  const count = el.count || 800;
  const seed = 54321;
  let h = seed;
  for (let i = 0; i < count; i++) {
    h = Math.sin(h * 127.1 + 311.7) * 43758.5453;
    h = h - Math.floor(h);
    const x = (h * W + el.wind * time * 100) % W;
    h = Math.sin(h * 127.1 + 311.7) * 43758.5453;
    h = h - Math.floor(h);
    const y = (h * H + time * el.speed * 50) % H;
    h = Math.sin(h * 127.1 + 311.7) * 43758.5453;
    h = h - Math.floor(h);
    const len = el.length || 30;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + el.angle * 0.1, y + len);
    ctx.stroke();
  }
  ctx.restore();
}

function drawVolumetricRays(ctx, rays, time, W, H) {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  rays.forEach(ray => {
    const grad = ctx.createLinearGradient(ray.x * W, ray.y * H, ray.x * W, (ray.y + ray.length) * H);
    grad.addColorStop(0, ray.color + Math.floor(ray.intensity * 255).toString(16).padStart(2, '0'));
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(ray.x * W - 50, ray.y * H, 100, ray.length * H);
  });
  ctx.restore();
}

function drawVignette(ctx, W, H, strength = 0.45) {
  ctx.save();
  const grad = ctx.createRadialGradient(W/2, H/2, Math.min(W,H)*0.3, W/2, H/2, Math.max(W,H)*0.7);
  grad.addColorStop(0, 'rgba(0,0,0,0)');
  grad.addColorStop(1, `rgba(0,0,0,${strength})`);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);
  ctx.restore();
}

const locations = {
  infinite_grid_void: { type: 'void', bgColor: '#0a0b10', grid: { color: '#00f0ff', opacity: 0.08, spacing: 64, perspective: true, vanishY: 0.35 } },
  terminal_deck: { type: 'interior', bgColor: '#0a0b10' },
  data_monoliths: { type: 'void', bgColor: '#05060a' },
  rain_balustrade: { type: 'exterior', bgColor: '#0a0b10' }
};

export { locations, drawBackground };