/**
 * THE SILHOUETTE — The Enigma / Antagonist
 * Pitch-black flat silhouette that absorbs background light.
 * Featureless except for a single razor-thin horizontal slit eye.
 * Crimson flare when hostile.
 */

import { TAU, lerp, clamp, rr } from '../engine/utils.js';

export const Silhouette = {
  name: 'The Silhouette',
  archetype: 'antagonist',
  
  spec: {
    color: '#000000', // True black - absorbs all light
    eye: {
      color: '#ff2a5f',
      width: 0.35,
      height: 0.015,
      yOffset: -0.02,
      glowIntensity: 1.2,
      pulseSpeed: 1.5,
      hostileFlare: 3.0
    },
    form: 'humanoid',
    height: 1.8,
    absorption: 1.0 // 1.0 = perfect light absorption
  },

  forms: {
    standing: { width: 0.4, headRadius: 0.18, shoulderWidth: 0.5 },
    looming: { width: 0.6, headRadius: 0.25, shoulderWidth: 0.8 },
    crouching: { width: 0.45, headRadius: 0.18, shoulderWidth: 0.55, height: 1.4 },
    dissolving: { fragmentation: true }
  },

  states: {
    dormant: { eyeGlow: 0.4, pulseSpeed: 1.0, hostile: false },
    watching: { eyeGlow: 0.7, pulseSpeed: 1.5, hostile: false },
    hostile: { eyeGlow: 1.0, pulseSpeed: 3.0, hostile: true, flare: true },
    striking: { eyeGlow: 1.0, pulseSpeed: 5.0, hostile: true, flare: true, expand: true }
  },

  draw: (ctx, state, time) => {
    ctx.save();
    ctx.translate(state.x || 0, state.y || 0);
    ctx.scale(state.scale || 1, state.scale || 1);
    
    const s = state.formState || 'standing';
    const st = state.silhouetteState || 'dormant';
    const form = Silhouette.forms[s];
    const sts = Silhouette.states[st];
    
    // Perfect black body (absorbs all light)
    ctx.fillStyle = '#000000';
    ctx.globalCompositeOperation = 'source-over';
    
    // Body shape
    ctx.save();
    if (s === 'standing') {
      // Head
      ctx.beginPath();
      ctx.arc(0, -0.6, form.headRadius, 0, TAU);
      ctx.fill();
      // Torso
      ctx.fillRect(-form.width/2, -0.4, form.width, 1.0);
      // Legs
      ctx.fillRect(-0.08, 0.4, 0.12, 0.7);
      ctx.fillRect(0.08, 0.4, 0.12, 0.7);
    } else if (s === 'looming') {
      // Larger, more imposing
      ctx.beginPath();
      ctx.arc(0, -0.7, form.headRadius, 0, TAU);
      ctx.fill();
      ctx.fillRect(-form.shoulderWidth/2, -0.5, form.shoulderWidth, 1.2);
      ctx.fillRect(-0.12, 0.7, 0.15, 0.8);
      ctx.fillRect(-0.12, 0.7, 0.15, 0.8);
    } else if (s === 'crouching') {
      ctx.beginPath();
      ctx.arc(0, -0.5, form.headRadius, 0, TAU);
      ctx.fill();
      ctx.fillRect(-form.width/2, -0.3, form.width, 0.8);
      ctx.fillRect(-0.1, 0.5, 0.14, 0.6);
      ctx.fillRect(0.1, 0.5, 0.14, 0.6);
    }
    ctx.restore();
    
    // Single slit eye
    const eye = Silhouette.spec.eye;
    const glow = sts.eyeGlow * (0.7 + 0.3 * Math.sin(time * sts.pulseSpeed * TAU));
    const flareMult = sts.flare ? sts.hostileFlare : 1.0;
    
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = eye.color;
    ctx.shadowColor = eye.color;
    ctx.shadowBlur = eye.glowIntensity * glow * flareMult * 20;
    
    // Horizontal slit
    ctx.beginPath();
    rr(ctx, -form.width/2 * eye.width, eye.yOffset, form.width * eye.width, eye.height, 2);
    ctx.fill();
    
    // Hostile flare - expanding rings
    if (sts.hostile && sts.flare) {
      const flarePhase = (time * sts.pulseSpeed * 2) % 1;
      for (let i = 0; i < 3; i++) {
        const phase = (flarePhase + i * 0.33) % 1;
        const ringScale = 1 + phase * 2;
        const ringAlpha = (1 - phase) * 0.4 * glow;
        ctx.globalAlpha = ringAlpha;
        ctx.strokeStyle = eye.color;
        ctx.lineWidth = 1 + phase * 3;
        ctx.shadowBlur = 30 * (1 - phase);
        ctx.beginPath();
        ctx.ellipse(0, eye.yOffset, form.headRadius * ringScale * 0.6, eye.height * ringScale * 3, 0, 0, TAU);
        ctx.stroke();
      }
    }
    
    ctx.restore();
    
    // Light absorption field (subtle dark halo)
    if (Silhouette.spec.absorption > 0) {
      ctx.save();
      ctx.globalCompositeOperation = 'multiply';
      const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, form.headRadius * 2);
      grad.addColorStop(0, 'rgba(0,0,0,0.15)');
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grad;
      ctx.fillRect(-form.headRadius * 3, -form.headRadius * 3, form.headRadius * 6, form.headRadius * 6);
      ctx.restore();
    }
    
    ctx.restore();
  }
};

export default Silhouette;