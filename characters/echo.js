/**
 * ECHO — The Counterpart / Tactician
 * Same minimalist build, sharp high-collar tech windbreaker.
 * Glowing rectangular frame glasses (pure white, no eyes visible).
 * Short geometric hair. Analytical, motionless, deadpan.
 */

import { TAU, lerp, clamp, rr } from '../engine/utils.js';

export const Echo = {
  name: 'Echo',
  archetype: 'tactician',
  
  spec: {
    head: { shape: 'circle', radius: 0.17, color: '#f8fafc', stroke: '#f8fafc', strokeWidth: 2 },
    glasses: {
      frameColor: '#f8fafc',
      lensColor: '#ffffff',
      lensOpacity: 0.95,
      glowColor: '#00f0ff',
      glowIntensity: 0.8,
      width: 0.28,
      height: 0.12,
      cornerRadius: 4,
      yOffset: -0.01,
      noEyes: true
    },
    hair: {
      style: 'geometric',
      color: '#181920',
      spikes: 3,
      length: 0.08,
      asymmetry: true
    },
    body: {
      windbreaker: { color: '#161822', stroke: '#00f0ff', strokeWidth: 1.5, collar: 'high' },
      torso: { width: 0.32, height: 0.52, cornerRadius: 6 },
      limbs: { style: 'monoline', color: '#f8fafc', width: 3, cuffWidth: 5 },
      hands: { style: 'mitten', color: '#f8fafc', size: 0.11 }
    }
  },

  poses: {
    idle: { arms: 'clasped_behind', stillness: 0.99 },
    analyzing: { headTilt: 0.1, arms: 'terminal', stillness: 0.95 },
    delivering: { lean: 0.05, arms: 'open_palm', stillness: 0.98 },
    stationary: { microMovements: 0.001 }
  },

  expressions: {
    deadpan: { glasses: 'steady', mouth: 'closed' },
    alert: { glasses: 'flare', mouth: 'closed' },
    processing: { glasses: 'scroll', mouth: 'closed' }
  },

  phonemes: {
    'A': 'open', 'E': 'half', 'I': 'half', 'O': 'open', 'U': 'open',
    'B': 'closed', 'M': 'closed', 'P': 'closed',
    'default': 'closed'
  },

  drawGlasses: (ctx, state, time) => {
    const g = Echo.spec.glasses;
    const flare = state.expression === 'alert' || Math.sin(time * 8) > 0.95;
    
    // Frame
    ctx.strokeStyle = g.frameColor;
    ctx.lineWidth = 2.5;
    rr(ctx, -g.width/2, -g.height/2 + g.yOffset, g.width, g.height, g.cornerRadius);
    ctx.stroke();
    
    // Lenses
    const lensW = g.width * 0.42;
    const lensH = g.height * 0.85;
    [-1, 1].forEach(side => {
      const cx = side * (g.width * 0.24);
      ctx.save();
      ctx.beginPath();
      rr(ctx, cx - lensW/2, -g.height/2 + g.yOffset, lensW, lensH, 3);
      ctx.clip();
      
      // Lens fill
      const grad = ctx.createLinearGradient(cx - lensW/2, -g.height/2, cx + lensW/2, g.height/2);
      grad.addColorStop(0, g.lensColor + 'f0');
      grad.addColorStop(1, g.lensColor + 'c0');
      ctx.fillStyle = grad;
      ctx.fillRect(cx - lensW/2, -g.height/2 + g.yOffset, lensW, lensH);
      
      // Glow
      if (flare) {
        ctx.shadowColor = g.glowColor;
        ctx.shadowBlur = 12;
        ctx.strokeStyle = g.glowColor;
        ctx.lineWidth = 1.5;
        rr(ctx, -lensW/2, -g.height/2 + g.yOffset, lensW, lensH, 3);
        ctx.stroke();
        ctx.shadowBlur = 0;
      }
      ctx.restore();
    });
    
    // Bridge
    ctx.strokeStyle = g.frameColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-lensW/2, -g.height/2 + g.yOffset + g.height/2);
    ctx.lineTo(lensW/2, -g.height/2 + g.yOffset + g.height/2);
    ctx.stroke();
  },

  draw: (ctx, state, time) => {
    ctx.save();
    ctx.translate(state.x || 0, state.y || 0);
    ctx.scale(state.scale || 1, state.scale || 1);
    
    // Head
    ctx.beginPath();
    ctx.arc(0, 0, 0.17, 0, TAU);
    ctx.fillStyle = '#f8fafc';
    ctx.strokeStyle = '#f8fafc';
    ctx.lineWidth = 2;
    ctx.fill(); ctx.stroke();
    
    // Geometric hair
    ctx.fillStyle = '#181920';
    ctx.beginPath();
    ctx.moveTo(-0.15, -0.16);
    ctx.lineTo(-0.1, -0.22);
    ctx.lineTo(-0.05, -0.16);
    ctx.lineTo(0.05, -0.2);
    ctx.lineTo(0.1, -0.23);
    ctx.lineTo(0.15, -0.16);
    ctx.closePath();
    ctx.fill();
    
    // Glasses (covers eyes completely)
    Echo.drawGlasses(ctx, state, time);
    
    // Mouth (simple slash)
    ctx.strokeStyle = '#0a0b10';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-0.04, 0.07);
    ctx.lineTo(0.04, 0.07);
    ctx.stroke();
    
    // Windbreaker (high collar)
    ctx.fillStyle = '#161822';
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 1.5;
    rr(ctx, -0.2, 0.18, 0.36, 0.55, 6);
    ctx.fill(); ctx.stroke();
    
    // High collar
    ctx.fillStyle = '#161822';
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-0.22, 0.18);
    ctx.lineTo(-0.25, 0.05);
    ctx.lineTo(0, -0.05);
    ctx.lineTo(0.25, 0.05);
    ctx.lineTo(0.22, 0.18);
    ctx.closePath();
    ctx.fill(); ctx.stroke();
    
    // Arms clasped behind back (idle)
    ctx.strokeStyle = '#f8fafc';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-0.18, 0.35);
    ctx.lineTo(-0.05, 0.55);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0.18, 0.35);
    ctx.lineTo(0.05, 0.55);
    ctx.stroke();
    
    // Legs
    ctx.strokeStyle = '#f8fafc';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-0.07, 0.7);
    ctx.lineTo(-0.07, 1.1);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0.07, 0.7);
    ctx.lineTo(0.07, 1.1);
    ctx.stroke();
    
    ctx.restore();
  }
};

export default Echo;