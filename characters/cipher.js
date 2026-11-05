/**
 * CIPHER — Protagonist
 * Minimalist clean-stroke figure. Solid white circle head, expressive pitch-black dot eyes.
 * Oversized dark obsidian hoodie, hood down, messy hair spikes.
 */

import { TAU, lerp, clamp, rr } from '../engine/utils.js';

export const Cipher = {
  name: 'Cipher',
  archetype: 'protagonist',
  
  // Visual spec
  spec: {
    head: { shape: 'circle', radius: 0.18, color: '#f8fafc', stroke: '#f8fafc', strokeWidth: 2 },
    eyes: {
      type: 'dots',
      baseColor: '#0a0b10',
      states: {
        neutral: { scale: 1.0, offsetX: 0, offsetY: 0 },
        focus: { scale: 0.3, offsetX: 0, offsetY: 0 },
        shock: { scale: 1.8, offsetX: 0, offsetY: -0.02 },
        determined: { scale: 0.8, offsetX: 0.01, offsetY: -0.01 }
      },
      spacing: 0.08,
      yOffset: -0.02
    },
    mouth: {
      type: 'slash',
      color: '#0a0b10',
      strokeWidth: 2.5,
      states: {
        closed: { width: 0.06, curve: 0 },
        half: { width: 0.1, curve: 0.02 },
        open: { width: 0.14, curve: 0.05 }
      },
      yOffset: 0.06
    },
    hair: {
      spikes: 5,
      color: '#181920',
      baseY: -0.15,
      length: 0.12,
      jitter: 0.02
    },
    body: {
      hoodie: { color: '#181920', stroke: '#f8fafc', strokeWidth: 1.5 },
      torso: { width: 0.35, height: 0.55, cornerRadius: 8 },
      hood: { down: true, color: '#181920', thickness: 0.04 },
      limbs: { style: 'monoline', color: '#f8fafc', width: 3, cuffWidth: 5 },
      hands: { style: 'mitten', color: '#f8fafc', size: 0.12 }
    }
  },

  // Animation states
  poses: {
    idle: { 
      arms: 'down', 
      weightShift: 0.02, 
      breathCycle: 4.0 
    },
    thinking: { 
      arms: 'crossed', 
      headTilt: -0.15,
      breathCycle: 6.0 
    },
    determined: { 
      arms: 'forward', 
      lean: 0.08,
      breathCycle: 3.0 
    },
    shocked: { 
      arms: 'back', 
      headBack: 0.1,
      breathCycle: 1.5 
    },
    walking: { 
      armSwing: 0.4, 
      legSwing: 0.5, 
      bounce: 0.03,
      cycle: 0.8 
    },
    sitting: { 
      hips: 90, 
      knees: 90,
      arms: 'rest' 
    },
    holding_weaver: { 
      leftArm: 'raised', 
      rightArm: 'down',
      wristAngle: 45 
    }
  },

  expressions: {
    neutral: { eyes: 'neutral', mouth: 'closed', brow: 0 },
    focus: { eyes: 'focus', mouth: 'closed', brow: -0.1 },
    shock: { eyes: 'shock', mouth: 'open', brow: 0.2 },
    determined: { eyes: 'determined', mouth: 'half', brow: -0.15 },
    curious: { eyes: 'focus', mouth: 'half', brow: 0.05 },
    weary: { eyes: 'focus', mouth: 'closed', brow: 0.1 }
  },

  // Phonetic mouth mapping
  phonemes: {
    'A': 'open', 'E': 'half', 'I': 'half', 'O': 'open', 'U': 'open',
    'B': 'closed', 'M': 'closed', 'P': 'closed',
    'F': 'half', 'V': 'half',
    'TH': 'half',
    'S': 'half', 'Z': 'half',
    'default': 'closed'
  },

  // Drawing functions
  drawHead: (ctx, state, time) => {
    const s = state || {};
    const expr = state.expression || 'neutral';
    const pose = state.pose || 'idle';
    const phoneme = state.phoneme || 'default';
    
    // Head circle
    ctx.beginPath();
    ctx.arc(0, 0, Cipher.spec.head.radius, 0, TAU);
    ctx.fillStyle = Cipher.spec.head.color;
    ctx.fill();
    ctx.strokeStyle = Cipher.spec.head.stroke;
    ctx.lineWidth = Cipher.spec.head.strokeWidth;
    ctx.stroke();
    
    // Hair spikes
    ctx.fillStyle = Cipher.spec.hair.color;
    for (let i = 0; i < Cipher.spec.hair.spikes; i++) {
      const angle = (i / Cipher.spec.hair.spikes) * TAU - TAU/4;
      const baseR = Cipher.spec.head.radius;
      const spikeLen = Cipher.spec.hair.length + Math.sin(time * 3 + i) * Cipher.spec.hair.jitter;
      ctx.beginPath();
      ctx.moveTo(Math.cos(angle) * baseR, Math.sin(angle) * baseR + Cipher.spec.hair.baseY);
      ctx.lineTo(Math.cos(angle) * (baseR + spikeLen), Math.sin(angle) * (baseR + spikeLen) + Cipher.spec.hair.baseY);
      ctx.lineTo(Math.cos(angle + 0.15) * baseR, Math.sin(angle + 0.15) * baseR + Cipher.spec.hair.baseY);
      ctx.fill();
    }
    
    // Eyes
    const eyeState = Cipher.spec.eyes.states[expr] || Cipher.spec.eyes.states.neutral;
    const eyeY = Cipher.spec.eyes.yOffset * Cipher.spec.head.radius;
    ctx.fillStyle = Cipher.spec.eyes.baseColor;
    [-1, 1].forEach(side => {
      ctx.beginPath();
      ctx.arc(
        side * Cipher.spec.eyes.spacing * eyeState.scale, 
        eyeY + eyeState.offsetY, 
        0.025 * eyeState.scale, 0, TAU
      );
      ctx.fill();
    });
    
    // Mouth
    const mouthState = Cipher.spec.mouth.states[Cipher.phonemes[phoneme] || 'closed'] || Cipher.spec.mouth.states.closed;
    ctx.strokeStyle = Cipher.spec.mouth.color;
    ctx.lineWidth = Cipher.spec.mouth.strokeWidth;
    ctx.lineCap = 'round';
    ctx.beginPath();
    const mouthY = Cipher.spec.mouth.yOffset * Cipher.spec.head.radius;
    ctx.moveTo(-mouthState.width * Cipher.spec.head.radius, mouthY);
    ctx.quadraticCurveTo(0, mouthY + mouthState.curve * Cipher.spec.head.radius, mouthState.width * Cipher.spec.head.radius, mouthY);
    ctx.stroke();
    
    // Hood (resting on shoulders)
    ctx.fillStyle = Cipher.spec.body.hoodie.color;
    ctx.strokeStyle = Cipher.spec.body.hoodie.stroke;
    ctx.lineWidth = Cipher.spec.body.hoodie.strokeWidth;
    rr(ctx, -0.28, 0.25, 0.56, 0.22, 6);
    ctx.fill(); ctx.stroke();
  },

  drawBody: (ctx, state, time) => {
    const pose = state.pose || 'idle';
    const p = Cipher.poses[pose] || Cipher.poses.idle;
    
    // Torso (hoodie)
    ctx.fillStyle = Cipher.spec.body.hoodie.color;
    ctx.strokeStyle = Cipher.spec.body.hoodie.stroke;
    ctx.lineWidth = Cipher.spec.body.hoodie.strokeWidth;
    const torso = Cipher.spec.body.torso;
    rr(ctx, -torso.width/2, 0.2, torso.width, torso.height, torso.cornerRadius);
    ctx.fill(); ctx.stroke();
    
    // Limbs
    ctx.strokeStyle = Cipher.spec.body.limbs.color;
    ctx.lineWidth = Cipher.spec.body.limbs.width;
    ctx.lineCap = 'round';
    
    // Arm positions based on pose
    let armAngleL = 0, armAngleR = 0;
    if (pose === 'thinking') { armAngleL = armAngleR = -0.8; }
    else if (pose === 'determined') { armAngleL = armAngleR = 0.5; }
    else if (pose === 'shocked') { armAngleL = armAngleR = -1.2; }
    else if (pose === 'walking') { 
      armAngleL = Math.sin(time * TAU / 0.8) * 0.5; 
      armAngleR = -Math.sin(time * TAU / 0.8) * 0.5; 
    }
    
    // Left arm
    ctx.beginPath();
    ctx.moveTo(-0.2, 0.25);
    ctx.lineTo(-0.2 + Math.sin(armAngleL) * 0.4, 0.25 + Math.cos(armAngleL) * 0.5);
    ctx.stroke();
    
    // Right arm
    ctx.beginPath();
    ctx.moveTo(0.2, 0.25);
    ctx.lineTo(0.2 + Math.sin(armAngleR) * 0.4, 0.25 + Math.cos(armAngleR) * 0.5);
    ctx.stroke();
    
    // Legs
    if (state.pose !== 'sitting') {
      let legAngleL = 0, legAngleR = 0;
      if (state.pose === 'walking') {
        legAngleL = Math.sin(time * TAU / 0.8 + Math.PI) * 0.3;
        legAngleR = -Math.sin(time * TAU / 0.8 + Math.PI) * 0.3;
      }
      ctx.beginPath();
      ctx.moveTo(-0.08, 0.75);
      ctx.lineTo(-0.08 + Math.sin(legAngleL) * 0.15, 0.75 + Math.cos(legAngleL) * 0.5);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0.08, 0.75);
      ctx.lineTo(0.08 + Math.sin(legAngleR) * 0.15, 0.75 + Math.cos(legAngleR) * 0.5);
      ctx.stroke();
    }
  },

  draw: (ctx, state, time) => {
    ctx.save();
    ctx.translate(state.x || 0, state.y || 0);
    ctx.scale(state.scale || 1, state.scale || 1);
    
    Cipher.drawBody(ctx, state, time);
    Cipher.drawHead(ctx, state, time);
    
    // Weaver band on wrist if holding
    if (state.pose === 'holding_weaver') {
      ctx.strokeStyle = '#00f0ff';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0.35, 0.65, 0.04, 0, TAU);
      ctx.stroke();
      // Glow
      ctx.shadowColor = '#00f0ff';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(0.35, 0.65, 0.04, 0, TAU);
      ctx.stroke();
      ctx.shadowBlur = 0;
    }
    
    ctx.restore();
  }
};

export default Cipher;