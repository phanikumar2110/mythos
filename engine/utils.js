/**
 * Core utilities for CipherBase engine
 */

export const TAU = Math.PI * 2;
export const DEG = Math.PI / 180;

export const lerp = (a, b, t) => a + (b - a) * t;
export const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
export const lerp3 = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];

export const ss = t => { t = clamp(t); return t * t * (3 - 2 * t); };
export const eo = t => 1 - Math.pow(1 - clamp(t), 3);
export const ei = t => Math.pow(clamp(t), 3);
export const eio = t => { t = clamp(t); return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
export const back = (t, s = 1.70158) => { t = clamp(t); return t * t * ((s + 1) * t - s); };
export const spring = (t, k = 8, z = 0.3) => 1 - Math.exp(-k * t) * Math.cos(2 * Math.PI * t / z);

export const sine = t => 0.5 - 0.5 * Math.cos(TAU * clamp(t));
export const smoothPulse = (t, freq = 1) => 0.5 + 0.5 * Math.sin(TAU * freq * t);

export const hash = n => { n = Math.sin(n * 127.1 + 311.7) * 43758.5453; return n - Math.floor(n); };
export const hash2 = (x, y) => hash(x * 127.1 + y * 311.7);
export const hash3 = (x, y, z) => hash(x * 127.1 + y * 311.7 + z * 747.3);

export const rng = (seed = 42) => {
  let s = seed;
  return () => { s = (s * 1664525 + 1013904223) % 4294967296; return s / 4294967296; };
};

export const rr = (ctx, x, y, w, h, r) => {
  const r2 = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r2, y);
  ctx.arcTo(x + w, y, x + w, y + h, r2);
  ctx.arcTo(x + w, y + h, x, y + h, r2);
  ctx.arcTo(x, y + h, x, y, r2);
  ctx.arcTo(x, y, x + w, y, r2);
  ctx.closePath();
};

export const project3D = (point, cam) => {
  const { x, y, z } = point;
  const { cx, cy, cz, yaw, pitch, fov = 0.6 } = cam;
  const dx = x - cx, dy = y - cy, dz = z - cz;
  const cyaw = Math.cos(yaw), syaw = Math.sin(yaw);
  const cpitch = Math.cos(pitch), spitch = Math.sin(pitch);
  const rx = dx * cyaw + dz * syaw;
  const rz = -dx * syaw + dz * cyaw;
  const ry = dy * cpitch - rz * spitch;
  const rz2 = dy * spitch + rz * cpitch;
  if (rz2 <= 0.01) return null;
  const scale = 1 / (rz2 * Math.tan(fov / 2));
  return { x: rx * scale, y: ry * scale, z: rz2, scale };
};

export const ease = {
  in: t => t * t,
  out: t => 1 - (1 - t) * (1 - t),
  inOut: t => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2,
  elastic: t => 1 - Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * TAU * 2),
  bounce: t => {
    const n1 = 7.5625, d1 = 2.75;
    if (t < 1 / d1) return n1 * t * t;
    if (t < 2 / d1) return n1 * (t -= 1.5 / d1) * t + 0.75;
    if (t < 2.5 / d1) return n1 * (t -= 2.25 / d1) * t + 0.9375;
    return n1 * (t -= 2.625 / d1) * t + 0.984375;
  }
};

export const font = (px, weight = 400, family = 'ui') => {
  const families = {
    ui: 'Inter, system-ui, sans-serif',
    mono: 'JetBrains Mono, monospace',
    display: 'Inter Tight, Inter, sans-serif',
    hand: 'Architects Daughter, cursive'
  };
  return `${weight} ${px}px ${families[family] || families.ui}`;
};

export const rgba = (hex, alpha) => {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
};

export const mix = (a, b, t) => {
  const ha = a.replace('#', ''), hb = b.replace('#', '');
  const ra = parseInt(ha.slice(0,2),16), ga = parseInt(ha.slice(2,4),16), ba = parseInt(ha.slice(4,6),16);
  const rb = parseInt(hb.slice(0,2),16), gb = parseInt(hb.slice(2,4),16), bb = parseInt(hb.slice(4,6),16);
  const mr = Math.round(lerp(ra, rb, t)), mg = Math.round(lerp(ga, gb, t)), mb = Math.round(lerp(ba, bb, t));
  return `#${mr.toString(16).padStart(2,'0')}${mg.toString(16).padStart(2,'0')}${mb.toString(16).padStart(2,'0')}`;
};