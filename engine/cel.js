/**
 * Cel rendering engine — flat fills, hard shadows, colored outlines, backlit neon
 * Simplified from cel-anime-80s for CipherBase
 */

import { TAU, lerp, clamp, rr, hash, mix } from './utils.js';

export const CEL_SHADING = {
  shadowOffset: 0.008,
  highlightOffset: 0.006,
  rimWidth: 0.004,
  outlineWidth: 2.5,
  outlineColor: '#1a1c2c'
};

export function drawCelShape(ctx, pathFn, fillColor, shadowColor, highlightColor, outlineColor, lightDir = { x: 0.3, y: -0.7 }) {
  // Build path
  const path = new Path2D();
  pathFn(path);
  
  // Shadow (hard, offset toward light)
  ctx.save();
  ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = shadowColor;
  ctx.translate(lightDir.x * CEL_SHADING.shadowOffset, lightDir.y * CEL_SHADING.shadowOffset);
  ctx.fill(path);
  ctx.restore();
  
  // Base fill
  ctx.fillStyle = fillColor;
  ctx.fill(path);
  
  // Highlight (hard, offset away from light)
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.fillStyle = mix(fillColor, '#ffffff', 0.3);
  ctx.translate(-lightDir.x * CEL_SHADING.highlightOffset, -lightDir.y * CEL_SHADING.highlightOffset);
  ctx.fill(path);
  ctx.restore();
  
  // Rim light (backlit neon)
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 0.002;
  ctx.stroke(path);
  ctx.restore();
  
  // Colored outline
  ctx.strokeStyle = '#1a1c2c';
  ctx.lineWidth = 0.0025;
  ctx.stroke(path);
}

export function drawCelCharacter(ctx, character, state, time) {
  // character = { head, torso, limbs, hair, accessories }
  // state = { pose, expression, phoneme, x, y, scale }
  
  const lightDir = { x: 0.3, y: -0.7 };
  
  // Draw in order: body parts back to front
  if (character.body) {
    drawCelBody(ctx, character.body, state, time, lightDir);
  }
  if (character.head) {
    drawCelHead(ctx, character.head, state, time, lightDir);
  }
  if (character.hair) {
    drawCelHair(ctx, character.hair, state, time, lightDir);
  }
  if (character.accessories) {
    character.accessories.forEach(acc => drawCelAccessory(ctx, acc, state, time, lightDir));
  }
}

function drawCelBody(ctx, body, state, time, lightDir) {
  const pose = state.pose || 'idle';
  
  // Torso
  if (body.torso) {
    const t = body.torso;
    const path = new Path2D();
    rr(path, -t.width/2, 0.2, t.width, t.height, t.cornerRadius || 8);
    
    drawCelShape(ctx, p => path, t.color, mix(t.color, '#000000', 0.4), mix(t.color, '#ffffff', 0.15), t.stroke || '#1a1c2c', lightDir);
  }
  
  // Limbs
  if (body.limbs) {
    ctx.strokeStyle = body.limbs.color || '#f8fafc';
    ctx.lineWidth = (body.limbs.width || 3) * (state.scale || 1);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    // Arms based on pose
    const armAngles = getArmAngles(state.pose, time);
    drawLimb(ctx, -0.2, 0.25, armAngles.left, 0.45, 0.5, body.limbs.cuffWidth);
    drawLimb(ctx, 0.2, 0.25, armAngles.right, 0.45, 0.5, body.limbs.cuffWidth);
    
    // Legs
    if (state.pose !== 'sitting') {
      drawLimb(ctx, -0.08, 0.75, 0, 0.15, 0.5, body.limbs.cuffWidth);
      drawLimb(ctx, 0.08, 0.75, 0, 0.15, 0.5, body.limbs.cuffWidth);
    }
  }
  
  // Cuffs
  if (body.cuffWidth) {
    ctx.fillStyle = '#1a1c2c';
    // Wrist cuffs
    // Ankle cuffs
  }
}

function drawLimb(ctx, x, y, angle, w, len, cuffW) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(0, 0.5);
  ctx.stroke();
  ctx.restore();
}

function getArmAngles(pose, time) {
  switch (pose) {
    case 'thinking': return { left: -0.8, right: -0.8 };
    case 'determined': return { left: 0.5, right: 0.5 };
    case 'shocked': return { left: -1.2, right: -1.2 };
    case 'walking': return { 
      left: Math.sin(TAU * time / 0.8) * 0.5, 
      right: -Math.sin(TAU * time / 0.8) * 0.5 
    };
    default: return { left: 0, right: 0 };
  }
}

function drawCelHead(ctx, head, state, time, lightDir) {
  const expr = state.expression || 'neutral';
  const phoneme = state.phoneme || 'default';
  
  // Head base
  const path = new Path2D();
  path.arc(0, 0, head.radius, 0, TAU);
  drawCelShape(ctx, p => path, head.color, '#1a1c2c', '#ffffff20', '#1a1c2c', lightDir);
  
  // Eyes
  drawCelEyes(ctx, head, state, lightDir);
  
  // Mouth
  drawCelMouth(ctx, head, state, phoneme, lightDir);
  
  // Hair
  if (head.hair) {
    drawCelHair(ctx, head.hair, state, time, lightDir);
  }
}

function drawCelEyes(ctx, head, state, lightDir) {
  const expr = state.expression || 'neutral';
  const eyeState = head.eyes.states[expr] || head.eyes.states.neutral;
  const eyeY = (head.eyes.yOffset || 0) * (head.radius || 0.18);
  
  ctx.fillStyle = head.eyes.baseColor || '#0a0b10';
  const spacing = (head.eyes.spacing || 0.08) * eyeState.scale;
  const eyeR = 0.025 * eyeState.scale;
  
  [-1, 1].forEach(side => {
    const path = new Path2D();
    path.arc(side * spacing, eyeY + (eyeState.offsetY || 0), eyeR, 0, TAU);
    ctx.fillStyle = head.eyes.baseColor;
    ctx.fill(path);
  });
}

function drawCelMouth(ctx, head, state, phoneme, lightDir) {
  const mouthMap = head.mouth || { states: { closed: { width: 0.06, curve: 0 } } };
  const mState = mouthMap.states[phoneme] || mouthMap.states.closed;
  const mouthY = (mouthMap.yOffset || 0.06) * (head.radius || 0.18);
  
  ctx.strokeStyle = mouthMap.color || '#0a0b10';
  ctx.lineWidth = mouthMap.strokeWidth || 2.5;
  ctx.lineCap = 'round';
  
  const path = new Path2D();
  path.moveTo(-mState.width * (head.radius || 0.18), (mouthMap.yOffset || 0.06) * (head.radius || 0.18));
  path.quadraticCurveTo(0, mouthY + mState.curve * (head.radius || 0.18), mState.width * (head.radius || 0.18), mouthY);
  ctx.stroke(path);
}

function drawCelHair(ctx, hair, state, time, lightDir) {
  ctx.fillStyle = hair.color;
  for (let i = 0; i < (hair.spikes || 5); i++) {
    const angle = (i / (hair.spikes || 5)) * TAU - TAU/4;
    const baseR = 0.18;
    const spikeLen = (hair.length || 0.12) + Math.sin(time * 3 + i) * (hair.jitter || 0.02);
    ctx.beginPath();
    ctx.moveTo(Math.cos(angle) * baseR, Math.sin(angle) * baseR + (hair.baseY || -0.15));
    ctx.lineTo(Math.cos(angle) * (baseR + spikeLen), Math.sin(angle) * (baseR + spikeLen) + (hair.baseY || -0.15));
    ctx.lineTo(Math.cos(angle + 0.15) * baseR, Math.sin(angle + 0.15) * baseR + (hair.baseY || -0.15));
    ctx.fill();
  }
}

function drawCelAccessory(ctx, acc, state, time, lightDir) {
  // Glasses, windbreaker collar, etc.
  // Implemented per-character
}

export function createCharacterRenderer(characterSpec) {
  return (ctx, state, time) => {
    drawCelBody(ctx, characterSpec.body, state, time, { x: 0.3, y: -0.7 });
    drawCelHead(ctx, characterSpec.head, state, time, { x: 0.3, y: -0.7 });
    if (characterSpec.hair) drawCelHair(ctx, characterSpec.hair, state, time, { x: 0.3, y: -0.7 });
    if (characterSpec.accessories) {
      characterSpec.accessories.forEach(acc => drawCelAccessory(ctx, acc, state, time, { x: 0.3, y: -0.7 }));
    }
  };
}

export default { drawCelShape, drawCelCharacter, createCharacterRenderer };