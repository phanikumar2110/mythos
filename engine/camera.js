/**
 * Camera interpolation utilities
 */

import { lerp, clamp, eio, eo } from '../engine/utils.js';

export function interpolateCamera(camera, progress) {
  if (!camera || camera.type === 'static') {
    return {
      x: camera?.start?.x || 0,
      y: camera?.start?.y || 0,
      zoom: camera?.start?.zoom || 1,
      rotation: camera?.start?.rotation || 0,
      targetX: camera?.start?.targetX || 0,
      targetY: camera?.start?.targetY || 0
    };
  }
  
  const p = clamp(progress);
  const eased = ease(progress, camera.easing || 'easeInOut');
  
  const start = camera.start || {};
  const end = camera.end || {};
  
  return {
    x: lerp(start.x || 0, end.x || 0, eased),
    y: lerp(start.y || 0, end.y || 0, eased),
    zoom: lerp(start.zoom || 1, end.zoom || 1, eased),
    rotation: lerp(start.rotation || 0, end.rotation || 0, eased),
    targetX: lerp(start.targetX || 0, end.targetX || 0, eased),
    targetY: lerp(start.targetY || 0, end.targetY || 0, eased)
  };
}

function ease(t, type = 'easeInOut') {
  switch (type) {
    case 'linear': return t;
    case 'easeIn': return t * t;
    case 'easeOut': return 1 - (1 - t) * (1 - t);
    case 'easeInOut': return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    case 'easeElastic': return 1 - Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * Math.PI * 2);
    case 'easeBounce': return bounce(t);
    default: return t;
  }
}

function bounce(t) {
  const n1 = 7.5625, d1 = 2.75;
  if (t < 1 / d1) return n1 * t * t;
  if (t < 2 / d1) { const t2 = t - 1.5 / d1; return n1 * t2 * t2 + 0.75; }
  if (t < 2.5 / d1) { const t2 = t - 2.25 / d1; return n1 * t2 * t2 + 0.9375; }
  return n1 * (t - 2.625 / d1) * t2 + 0.984375;
}