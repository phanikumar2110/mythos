/**
 * VOXEL — The Glitch / System Voice
 * Semi-translucent wireframe figure with fragmented, hovering limbs.
 * Shifting chromatic aberration fringe. Changes scale and jitters.
 */

import { TAU, lerp, clamp, hash } from '../engine/utils.js';

export const Voxel = {
  name: 'Voxel',
  archetype: 'glitch_system',
  
  spec: {
    form: 'wireframe',
    baseColor: '#00f0ff',
    secondaryColor: '#ff2a5f',
    tertiaryColor: '#39ff14',
    opacity: 0.6,
    wireframeWidth: 1.5,
    fragmentation: {
      limbOffset: 0.15,
      jitterFrequency: 12,
      scaleVariance: 0.15
    },
    chromaticAberration: {
      enabled: true,
      shift: 3,
      speed: 8
    },
    glitchEffects: {
      scanlineTelegraph: true,
      frameDrop: 0.02,
      colorShift: true
    }
  },

  fragments: [
    { id: 'head', type: 'sphere', radius: 0.16, baseY: 0 },
    { id: 'torso', type: 'cube', width: 0.3, height: 0.5, baseY: 0.3 },
    { id: 'armL', type: 'segment', length: 0.5, baseX: -0.2, baseY: 0.3 },
    { id: 'armR', type: 'segment', length: 0.5, baseX: 0.2, baseY: 0.3 },
    { id: 'legL', type: 'segment', length: 0.7, baseX: -0.08, baseY: 0.8 },
    { id: 'legR', type: 'segment', length: 0.7, baseX: 0.08, baseY: 0.8 }
  ],

  modes: {
    exposition: { jitter: 0.02, scale: 1.0, fragmentation: 0.1, chromaticShift: 0.5 },
    spike: { jitter: 0.08, scale: 1.3, fragmentation: 0.4, chromaticShift: 2.0 },
    idle: { jitter: 0.01, scale: 1.0, fragmentation: 0.05, chromaticShift: 0.3 },
    glitching: { jitter: 0.15, scale: 1.5, fragmentation: 0.6, chromaticShift: 4.0 }
  },

  drawFragment: (ctx, frag, state, time, mode) => {
    const m = mode || state.mode || 'idle';
    const M = Voxel.modes[m];
    const jitter = M.jitter * Math.sin(time * M.jitterFrequency + hash(frag.id) * 100);
    const scaleVar = 1 + (Math.sin(time * 3 + hash(frag.id)) * M.scaleVariance);
    const totalScale = M.scale * scaleVar;
    
    const baseX = (frag.baseX || 0) + (Math.random() - 0.5) * M.fragmentation;
    const baseY = (frag.baseY || 0) + (Math.random() - 0.5) * M.fragmentation;
    
    ctx.save();
    ctx.globalAlpha = Voxel.spec.opacity * (0.8 + 0.2 * Math.sin(time * 4));
    ctx.strokeStyle = Voxel.spec.baseColor;
    ctx.lineWidth = Voxel.spec.wireframeWidth;
    ctx.lineCap = 'round';
    
    // Chromatic aberration offset
    if (Voxel.spec.chromaticAberration.enabled) {
      const caShift = M.chromaticShift * Math.sin(time * Voxel.spec.chromaticAberration.speed);
      ctx.shadowColor = Voxel.spec.secondaryColor;
      ctx.shadowBlur = caShift;
      ctx.shadowOffsetX = caShift;
    }
    
    if (frag.type === 'sphere') {
      ctx.beginPath();
      ctx.arc(0, frag.baseY || 0, frag.radius * totalScale, 0, TAU);
      ctx.stroke();
    } else if (frag.type === 'cube') {
      const w = frag.width * totalScale;
      const h = frag.height * totalScale;
      const x = -w/2;
      const y = frag.baseY - h/2;
      ctx.strokeRect(x, y, w, h);
      // Internal lines
      ctx.beginPath();
      ctx.moveTo(-w/2, frag.baseY); ctx.lineTo(w/2, frag.baseY);
      ctx.moveTo(0, frag.baseY - h/2); ctx.lineTo(0, frag.baseY + h/2);
      ctx.stroke();
    } else if (frag.type === 'segment') {
      const len = frag.length * totalScale;
      const angle = Math.sin(time * 2 + hash(frag.id)) * 0.3;
      ctx.beginPath();
      ctx.moveTo(frag.baseX || 0, frag.baseY || 0);
      ctx.lineTo(
        (frag.baseX || 0) + Math.sin(jitter) * 0.1 + Math.cos(angle) * len,
        (frag.baseY || 0) + Math.cos(jitter) * 0.1 + Math.sin(angle) * len
      );
      ctx.stroke();
    }
    
    ctx.restore();
  },

  draw: (ctx, state, time) => {
    ctx.save();
    ctx.translate(state.x || 0, state.y || 0);
    ctx.scale(state.scale || 1, state.scale || 1);
    
    // Apply chromatic aberration to entire figure
    if (Voxel.spec.chromaticAberration.enabled) {
      const ca = Voxel.modes[state.mode || 'idle'].chromaticShift * Math.sin(time * Voxel.spec.chromaticAberration.speed);
      ctx.shadowColor = Voxel.spec.secondaryColor;
      ctx.shadowBlur = ca;
      ctx.shadowOffsetX = ca;
    }
    
    // Draw all fragments
    Voxel.fragments.forEach(frag => {
      Voxel.drawFragment(ctx, frag, state, time, state.mode);
    });
    
    // Glitch telegraph lines
    if (Voxel.spec.glitchEffects.scanlineTelegraph && state.mode === 'spike') {
      ctx.save();
      ctx.strokeStyle = Voxel.spec.tertiaryColor;
      ctx.lineWidth = 0.5;
      ctx.globalAlpha = 0.4;
      for (let i = 0; i < 5; i++) {
        const y = -0.5 + Math.random() * 1.5;
        ctx.beginPath();
        ctx.moveTo(-0.5, y);
        ctx.lineTo(0.5, y + (Math.random() - 0.5) * 0.1);
        ctx.stroke();
      }
      ctx.restore();
    }
    
    // Frame drop effect
    if (Voxel.spec.glitchEffects.frameDrop && Math.random() < 0.02) {
      return; // Skip frame
    }
    
    ctx.restore();
  }
};

export default Voxel;