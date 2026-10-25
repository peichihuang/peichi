/* Moshruum Patch: illustrations. Everything is drawn as SVG markup strings. */
(function (MP) {
'use strict';

const r1 = n => Math.round(n * 10) / 10;
const clamp = (n, a, b) => Math.min(b, Math.max(a, n));
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function hex(c) { const n = parseInt(c.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; }
function mix(a, b, t) {
  const A = hex(a), B = hex(b);
  return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, '0')).join('');
}
let uid = 0;
const nextId = p => p + (++uid);

/* ---------- Shared definitions (gradients and filters) ---------- */
const defs = [];
function stops(list) { return list.map(([o, c, a]) => `<stop offset="${o}" stop-color="${c}"${a != null ? ` stop-opacity="${a}"` : ''}/>`).join(''); }
function lg(id, list, x2 = 0, y2 = 1) { defs.push(`<linearGradient id="${id}" x1="0" y1="0" x2="${x2}" y2="${y2}">${stops(list)}</linearGradient>`); return `url(#${id})`; }
function rg(id, list, cx = 0.38, cy = 0.32, r = 0.85) { defs.push(`<radialGradient id="${id}" cx="${cx}" cy="${cy}" r="${r}">${stops(list)}</radialGradient>`); return `url(#${id})`; }
function cm(id, m) { defs.push(`<filter id="${id}" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values="${m}"/></filter>`); return `url(#${id})`; }

const G = {
  stem: lg('mp-stem', [[0, '#F7F4EE'], [1, '#E2DACB']], 1, 0),
  stemCool: lg('mp-stem-cool', [[0, '#F3F2EE'], [1, '#DCD9D1']], 1, 0),
  blueCap: lg('mp-blue', [[0, '#93A7C0'], [0.55, '#64799A'], [1, '#4B5F7D']]),
  pinkCap: lg('mp-pink', [[0, '#F5B3C4'], [0.55, '#E0809B'], [1, '#C65E7E']]),
  goldCap: lg('mp-golden', [[0, '#F8D978'], [0.55, '#E6B42E'], [1, '#C38D17']]),
  blueGill: lg('mp-blue-g', [[0, '#DCE2E8'], [1, '#F2F3F2']]),
  pinkGill: lg('mp-pink-g', [[0, '#F2CBD6'], [1, '#FBEDF1']]),
  goldGill: lg('mp-golden-g', [[0, '#F1DC9C'], [1, '#FCF4D9']]),
  lion: rg('mp-lion', [[0, '#FFFCF4'], [0.7, '#F2E8D4'], [1, '#E2D2B2']], 0.42, 0.35, 0.75),
  pioCap: rg('mp-pio', [[0, '#4F2F1C'], [0.5, '#7E5136'], [1, '#C59B72']], 0.5, 0.25, 0.9),
  namCap: rg('mp-nam', [[0, '#8E3A12'], [0.55, '#C4652A'], [1, '#E9A55C']], 0.5, 0.2, 0.9),
  kingCap: rg('mp-king', [[0, '#8D6646'], [1, '#CDA884']], 0.5, 0.15, 0.95),
  pearlCap: rg('mp-pearl', [[0, '#26282E'], [1, '#666A74']], 0.5, 0.15, 0.95),
  frond: lg('mp-frond', [[0, '#4E3D31'], [0.45, '#8F7865'], [1, '#DCD0BE']]),
  reishi: lg('mp-reishi', [[0, '#3A0F0B'], [0.5, '#7E2416'], [0.85, '#B5502A'], [1, '#E9D69B']]),
  block: lg('mp-block', [[0, '#DFC596'], [1, '#C8A672']]),
  rice: lg('mp-rice', [[0, '#EDB85E'], [1, '#D99A3C']]),
  club: lg('mp-club', [[0, '#F7B653'], [1, '#DE7A24']]),
  glass: lg('mp-glass', [[0, '#FFFFFF', 0.55], [0.5, '#FFFFFF', 0.12], [1, '#FFFFFF', 0.4]], 1, 0),
  glaze: lg('mp-glaze', [[0, '#E6E2DA'], [0.35, '#FBFAF7'], [0.7, '#F2EFE9'], [1, '#D9D4CA']], 1, 0),
  saucer: lg('mp-saucer', [[0, '#FBFAF7'], [1, '#DAD5CC']]),
  wall: lg('mp-wall', [[0, '#F1EEE9'], [1, '#DCDCC8']]),
  walnut: lg('mp-walnut', [[0, '#7B573A'], [1, '#5A3E29']]),
  plateStone: rg('mp-plate-stone', [[0, '#57544F'], [0.8, '#43413D'], [1, '#2F2E2B']], 0.45, 0.4, 0.7),
  plateStoneWell: rg('mp-plate-stone-w', [[0, '#4D4A46'], [1, '#3D3B37']], 0.45, 0.4, 0.7),
  platePorc: rg('mp-plate-porc', [[0, '#FFFFFF'], [0.85, '#F3F2EE'], [1, '#DEDCD6']], 0.45, 0.4, 0.7),
  plateCel: rg('mp-plate-cel', [[0, '#D3DED2'], [0.75, '#B2C4B2'], [1, '#8EA48F']], 0.45, 0.4, 0.7),
  plateCelWell: rg('mp-plate-cel-w', [[0, '#C9D6C8'], [0.7, '#B9CAB8'], [1, '#93A894']], 0.5, 0.45, 0.6),
  board: lg('mp-board', [[0, '#8A6343'], [1, '#6A4A31']], 1, 1),
  toast: rg('mp-toast', [[0, '#F0D49C'], [0.7, '#E2B672'], [1, '#C98F48']], 0.45, 0.4, 0.7),
  yolk: rg('mp-yolk', [[0, '#FFC24A'], [0.7, '#F19A1C'], [1, '#D97A10']], 0.4, 0.35, 0.8),
  lemon: lg('mp-lemon', [[0, '#F9E27A'], [1, '#EFC73A']]),
  bok: lg('mp-bok', [[0, '#4F7E3A'], [0.55, '#7FAA5A'], [1, '#EEF2DF']]),
  miso: lg('mp-miso', [[0, '#C27A35'], [1, '#8C4A1A']]),
  goldBadge: lg('mp-gold', [[0, '#F7E3A1'], [0.5, '#D9AE48'], [1, '#B48322']], 1, 1),
  amber: lg('mp-amber', [[0, '#1E0F06'], [0.28, '#6A3F1E'], [0.6, '#3B200F'], [1, '#160B04']], 1, 0),
  lid: lg('mp-lid', [[0, '#3A3A38'], [1, '#0E0E0D']]),
  labelShade: lg('mp-label-shade', [[0, '#000', 0.2], [0.22, '#000', 0], [0.78, '#000', 0], [1, '#000', 0.22]], 1, 0),
  wood: lg('mp-wood', [[0, '#D2A472'], [1, '#AE7C4C']]),
  bowlOut: rg('mp-bowl-out', [[0, '#8E887A'], [0.85, '#6E695D'], [1, '#55514A']], 0.45, 0.4, 0.7),
  bowlIn: rg('mp-bowl-in', [[0, '#5E5A52'], [0.7, '#4A4740'], [1, '#34322D']], 0.5, 0.45, 0.6),
  cafe: lg('mp-cafe', [[0, '#2E251C'], [1, '#14100C']]),
  light: rg('mp-light', [[0, '#FFE6B8', 0.3], [1, '#FFE6B8', 0]], 0.75, 0.15, 0.7),
  vig: rg('mp-vig', [[0, '#000', 0], [0.6, '#000', 0], [1, '#000', 0.7]], 0.5, 0.5, 0.75),
};
const F = {
  seared: cm('mp-f-seared', '0.72 0.10 0 0 0  0.04 0.58 0.02 0 0  0 0.04 0.36 0 0  0 0 0 1 0'),
  roasted: cm('mp-f-roasted', '0.62 0.08 0 0 0  0.03 0.48 0 0 0  0 0.03 0.28 0 0  0 0 0 1 0'),
  braised: cm('mp-f-braised', '0.62 0.12 0 0 0  0.04 0.42 0 0 0  0 0.02 0.20 0 0  0 0 0 1 0'),
  gild: cm('mp-f-gild', '0.20 0.36 0.06 0 0.40  0.16 0.30 0.05 0 0.27  0.05 0.10 0.02 0 0.04  0 0 0 1 0'),
};
defs.push('<filter id="mp-shadow" x="-30%" y="-30%" width="160%" height="170%"><feDropShadow dx="0" dy="4" stdDeviation="4" flood-color="#1E1C18" flood-opacity=".24"/></filter>');
defs.push('<filter id="mp-grain" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/></filter>');
defs.push('<filter id="mp-soft" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="8"/></filter>');
F.shadow = 'url(#mp-shadow)';
F.soft = 'url(#mp-soft)';
const DEFS = `<defs>${defs.join('')}</defs>`;

/* ---------- Grow room: mushrooms in side view (base at 0,0; up is negative y) ---------- */
const OYSTER = {
  blue: { cap: G.blueCap, gill: G.blueGill, gl: '#C3CCD5', hi: '#B7C6D8',
    shelves: [[-4, -94, 74, 34, -4], [-36, -60, 70, 32, -16], [36, -66, 74, 34, 14], [-8, -28, 94, 42, -3]] },
  pink: { cap: G.pinkCap, gill: G.pinkGill, gl: '#EBB2C2', hi: '#FAD0DB',
    shelves: [[-30, -100, 60, 28, -20], [24, -106, 62, 30, 16], [-44, -66, 66, 30, -22], [42, -70, 70, 32, 20], [0, -34, 98, 42, 0]] },
  golden: { cap: G.goldCap, gill: G.goldGill, gl: '#E9D38A', hi: '#FBE7A3',
    shelves: [[-44, -76, 46, 22, -28], [-14, -102, 48, 24, -8], [20, -110, 46, 22, 10], [48, -80, 48, 22, 26], [-28, -50, 56, 26, -14], [30, -54, 58, 26, 14], [0, -24, 72, 30, 0]] },
};
function fan(x, y, w, h, rot, c) {
  let s = `<g transform="translate(${x} ${y}) rotate(${rot})">`;
  s += `<path d="M${r1(-w / 2)} 0 C${r1(-w * 0.28)} ${r1(h * 0.44)} ${r1(w * 0.28)} ${r1(h * 0.44)} ${r1(w / 2)} 0Z" fill="${c.gill}"/>`;
  const n = Math.max(6, Math.round(w / 8));
  for (let i = 0; i < n; i++) s += `<path d="M0 ${r1(h * 0.3)} L${r1(-w / 2 + w * (i + 0.5) / n)} 1" stroke="${c.gl}" stroke-width=".9"/>`;
  s += `<path d="M${r1(-w / 2)} 0 C${r1(-w / 2)} ${r1(-h * 1.05)} ${r1(w / 2)} ${r1(-h * 1.05)} ${r1(w / 2)} 0 C${r1(w * 0.3)} ${r1(-h * 0.1)} ${r1(w * 0.12)} ${r1(h * 0.08)} 0 ${r1(-h * 0.02)} C${r1(-w * 0.12)} ${r1(h * 0.08)} ${r1(-w * 0.3)} ${r1(-h * 0.1)} ${r1(-w / 2)} 0Z" fill="${c.cap}"/>`;
  s += `<path d="M${r1(-w * 0.3)} ${r1(-h * 0.52)} C${r1(-w * 0.18)} ${r1(-h * 0.78)} ${r1(w * 0.08)} ${r1(-h * 0.82)} ${r1(w * 0.2)} ${r1(-h * 0.72)}" fill="none" stroke="${c.hi}" stroke-width="${r1(h * 0.1)}" stroke-linecap="round" opacity=".55"/>`;
  return s + '</g>';
}
function oyster(id) {
  const c = OYSTER[id];
  const shelves = c.shelves.map(([x, y, w, h, rot]) => [x, y + 12, w, h, rot]);
  let s = `<ellipse cx="0" cy="-2" rx="22" ry="7" fill="${G.stem}" stroke="#D8CFBF" stroke-width="1.5"/>`;
  shelves.forEach(([x, y, w, h]) => {
    const d = `M0 0 Q${r1(x * 0.2)} ${r1(y * 0.5)} ${r1(x * 0.55)} ${r1(y + h * 0.2)}`;
    s += `<path d="${d}" stroke="#D8CFBF" stroke-width="${r1(w * 0.17 + 3)}" stroke-linecap="round" fill="none"/><path d="${d}" stroke="${G.stem}" stroke-width="${r1(w * 0.17)}" stroke-linecap="round" fill="none"/>`;
  });
  shelves.forEach(sh => { s += fan(sh[0], sh[1], sh[2], sh[3], sh[4], c); });
  return s;
}
function lions(seed) {
  const R = rng(seed + 7);
  let s = '';
  for (let i = 0; i < 26; i++) {
    const x = -52 + i * 104 / 25 + (R() - 0.5) * 3;
    const yb = -60 + 50 * Math.sqrt(Math.max(0, 1 - (x / 58) ** 2));
    const len = 14 + R() * 12;
    s += `<path d="M${r1(x)} ${r1(yb - 14)} q${r1((R() - 0.5) * 4)} ${r1(len * 0.6)} ${r1((R() - 0.5) * 3)} ${r1(len + 6)}" stroke="#E4D5B6" stroke-width="4" stroke-linecap="round" fill="none"/>`;
  }
  s += `<g fill="${G.lion}"><circle cx="-30" cy="-96" r="24"/><circle cx="4" cy="-110" r="27"/><circle cx="34" cy="-94" r="23"/><ellipse cx="0" cy="-60" rx="58" ry="50"/></g>`;
  for (let y = -124; y <= -24; y += 10) {
    for (let x = -54; x <= 54; x += 9) {
      const xx = x + (R() - 0.5) * 6, yy = y + (R() - 0.5) * 5;
      const inBody = ((xx / 56) ** 2 + ((yy + 60) / 48) ** 2) < 1 || Math.hypot(xx - 4, yy + 110) < 24 || Math.hypot(xx + 30, yy + 96) < 21 || Math.hypot(xx - 34, yy + 94) < 20;
      if (inBody) s += `<path d="M${r1(xx)} ${r1(yy)} v6" stroke="#E6D9BF" stroke-width="1.8" stroke-linecap="round"/>`;
    }
  }
  for (let i = 0; i < 19; i++) {
    const x = -46 + i * 92 / 18 + (R() - 0.5) * 3;
    const yb = -60 + 50 * Math.sqrt(Math.max(0, 1 - (x / 58) ** 2)) - 8;
    s += `<path d="M${r1(x)} ${r1(yb)} v${r1(9 + R() * 8)}" stroke="#F1E7D3" stroke-width="3.2" stroke-linecap="round"/>`;
  }
  return s;
}
function dome(x, y, r, fill, gloss) {
  let s = `<path d="M${r1(x - r)} ${r1(y)} C${r1(x - r)} ${r1(y - r * 1.25)} ${r1(x + r)} ${r1(y - r * 1.25)} ${r1(x + r)} ${r1(y)} Q${r1(x)} ${r1(y + r * 0.28)} ${r1(x - r)} ${r1(y)}Z" fill="${fill}"/>`;
  s += `<ellipse cx="${r1(x - r * 0.35)}" cy="${r1(y - r * 0.66)}" rx="${r1(r * 0.28)}" ry="${r1(r * 0.13)}" transform="rotate(-22 ${r1(x - r * 0.35)} ${r1(y - r * 0.66)})" fill="#fff" opacity="${gloss}"/>`;
  return s;
}
function bunch(caps, fill, gloss, sw) {
  let s = '';
  caps.forEach(([x, y]) => {
    const d = `M${r1(x * 0.22)} 0 Q${r1(x * 0.12)} ${r1(y * 0.55)} ${r1(x)} ${r1(y + 2)}`;
    s += `<path d="${d}" stroke="#D6C8AE" stroke-width="${sw + 2}" stroke-linecap="round" fill="none"/><path d="${d}" stroke="${G.stem}" stroke-width="${sw}" stroke-linecap="round" fill="none"/>`;
  });
  caps.forEach(([x, y, r]) => { s += dome(x, y, r, fill, gloss); });
  return s;
}
const pioppino = () => bunch([[-46, -90, 17], [-22, -126, 19], [4, -152, 18], [28, -118, 21], [52, -86, 16], [-4, -98, 24]], G.pioCap, 0.25, 7);
const nameko = () => bunch([[-64, -70, 24], [-24, -100, 30], [26, -88, 27], [66, -62, 23], [-46, -40, 22], [48, -34, 21], [0, -54, 36]], G.namCap, 0.6, 9);
function trumpet(x, rot, sc, cap, tall) {
  const top = tall ? -146 : -128;
  let s = `<g transform="translate(${x} 0) rotate(${rot}) scale(${sc})">`;
  s += `<path d="M-21 0 C-27 -36 -19 -84 -15 -106 L15 -106 C19 -84 27 -36 21 0 Q0 6 -21 0Z" fill="${G.stem}"/>`;
  s += `<path d="M-8 -12 C-11 -40 -8 -70 -6 -96 M9 -14 C11 -44 8 -72 7 -98" stroke="#E7DDCB" stroke-width="1.6" fill="none" stroke-linecap="round"/>`;
  s += `<path d="M-33 -104 C-35 ${top} 35 ${top} 33 -104 Q0 -94 -33 -104Z" fill="${cap}"/>`;
  s += `<path d="M-30 -103 Q0 -93 30 -103 Q0 -97 -30 -103Z" fill="#EAE1CF"/>`;
  s += `<path d="M-19 ${tall ? -126 : -115} Q-6 ${tall ? -137 : -122} 9 ${tall ? -135 : -121}" stroke="#fff" stroke-width="4" stroke-linecap="round" fill="none" opacity=".28"/>`;
  return s + '</g>';
}
function king(pearl) {
  const cap = pearl ? G.pearlCap : G.kingCap;
  return trumpet(-38, -16, 0.68, cap, pearl) + trumpet(40, 14, 0.78, cap, pearl) + trumpet(0, 0, 1, cap, pearl);
}
function frond(x, y, w, h, rot) {
  let s = `<g transform="translate(${x} ${y}) rotate(${rot})">`;
  s += `<path d="M${r1(-w / 2)} 0 C${r1(-w / 2)} ${r1(-h * 1.05)} ${r1(w / 2)} ${r1(-h * 1.05)} ${r1(w / 2)} 0 Q0 ${r1(h * 0.35)} ${r1(-w / 2)} 0Z" fill="${G.frond}"/>`;
  s += `<path d="M${r1(-w * 0.28)} ${r1(-h * 0.62)} Q${r1(-w * 0.04)} ${r1(-h * 0.82)} ${r1(w * 0.18)} ${r1(-h * 0.72)}" stroke="#B49C86" stroke-width="2" fill="none" stroke-linecap="round" opacity=".7"/>`;
  return s + '</g>';
}
const MAITAKE = [
  [[-24, -114, 40, 22, -14], [14, -120, 42, 24, 10]],
  [[-50, -94, 44, 24, -28], [-8, -100, 46, 26, -4], [36, -96, 46, 24, 22]],
  [[-62, -66, 48, 26, -34], [-24, -74, 50, 28, -12], [22, -76, 50, 28, 12], [60, -64, 48, 26, 32]],
  [[-42, -40, 54, 28, -18], [46, -40, 54, 28, 18]],
  [[0, -32, 70, 38, 0]],
];
function maitake() {
  let s = `<ellipse cx="0" cy="-4" rx="40" ry="10" fill="#EDE3D0"/>`;
  MAITAKE.flat().forEach(([x, y, w, h]) => { s += `<path d="M0 -4 L${r1(x * 0.6)} ${r1(y + h * 0.3)}" stroke="#F1E9DA" stroke-width="9" stroke-linecap="round"/>`; });
  MAITAKE.forEach(row => row.forEach(([x, y, w, h, rot]) => { s += frond(x, y, w, h, rot); }));
  return s;
}
function conk(x, y, w, h, rot) {
  let s = `<g transform="translate(${x} ${y}) rotate(${rot})">`;
  s += `<path d="M${r1(-w / 2)} 0 C${r1(-w / 2)} ${r1(-h * 1.1)} ${r1(w / 2)} ${r1(-h * 1.1)} ${r1(w / 2)} 0 Q0 ${r1(h * 0.22)} ${r1(-w / 2)} 0Z" fill="${G.reishi}"/>`;
  for (let k = 1; k <= 3; k++) {
    const f = 1 - k * 0.2;
    s += `<path d="M${r1(-w / 2 * f)} ${r1(-h * (1 - f) * 0.5)} C${r1(-w / 2 * f)} ${r1(-h * 1.05)} ${r1(w / 2 * f)} ${r1(-h * 1.05)} ${r1(w / 2 * f)} ${r1(-h * (1 - f) * 0.5)}" fill="none" stroke="#2A0907" stroke-opacity=".25" stroke-width="1.2"/>`;
  }
  s += `<path d="M${r1(-w * 0.32)} ${r1(-h * 0.6)} Q${r1(-w * 0.08)} ${r1(-h * 0.86)} ${r1(w * 0.2)} ${r1(-h * 0.74)}" stroke="#fff" stroke-width="${r1(h * 0.1)}" stroke-linecap="round" fill="none" opacity=".45"/>`;
  s += `<path d="M${r1(-w / 2)} 0 Q0 ${r1(h * 0.22)} ${r1(w / 2)} 0" stroke="#F1E3B2" stroke-width="4" fill="none" stroke-linecap="round"/>`;
  return s + '</g>';
}
function reishi() {
  let s = '';
  s += `<path d="M-6 0 C-10 -30 -28 -50 -40 -78" stroke="#4B140E" stroke-width="12" stroke-linecap="round" fill="none"/>`;
  s += `<path d="M6 0 C12 -24 26 -36 38 -48" stroke="#4B140E" stroke-width="11" stroke-linecap="round" fill="none"/>`;
  s += conk(-42, -84, 96, 50, -14) + conk(40, -48, 84, 42, 16);
  return s;
}
const TT_BANDS = ['#F4F0E6', '#B9AE9E', '#7C6A58', '#55505A', '#8A9AAB', '#5B4B3E', '#3D3631'];
function tfan(x, y, w, h, rot) {
  let s = `<g transform="translate(${x} ${y}) rotate(${rot})">`;
  TT_BANDS.forEach((c, i) => {
    const f = 1 - i * 0.13;
    s += `<path d="M${r1(-w / 2 * f)} 0 C${r1(-w / 2 * f)} ${r1(-h * f * 1.1)} ${r1(w / 2 * f)} ${r1(-h * f * 1.1)} ${r1(w / 2 * f)} 0Z" fill="${c}"/>`;
  });
  return s + '</g>';
}
function turkeytail() {
  return tfan(-40, -78, 64, 34, -22) + tfan(30, -92, 60, 32, 18) + tfan(-10, -112, 56, 30, -4) + tfan(46, -54, 66, 34, 26) + tfan(-46, -42, 66, 34, -20) + tfan(0, -30, 82, 40, 0);
}
function cordyceps(seed) {
  const R = rng(seed + 3);
  let s = '';
  for (let i = 0; i < 18; i++) {
    const x = -40 + (i / 17) * 80 + (R() - 0.5) * 6, h = 50 + R() * 38, dx = (R() - 0.5) * 18;
    const d = `M${r1(x)} 0 Q${r1(x + dx * 0.2)} ${r1(-h * 0.5)} ${r1(x + dx)} ${r1(-h)}`;
    s += `<path d="${d}" stroke="#E07B26" stroke-width="5.5" stroke-linecap="round" fill="none"/>`;
    s += `<path d="M${r1(x + dx * 0.7)} ${r1(-h * 0.78)} L${r1(x + dx)} ${r1(-h)}" stroke="#F4A34A" stroke-width="7.5" stroke-linecap="round"/>`;
  }
  return s;
}
function cluster(id, seed = 3) {
  switch (id) {
    case 'lions': return lions(seed);
    case 'pioppino': return pioppino();
    case 'nameko': return nameko();
    case 'king': return king(false);
    case 'pearl': return king(true);
    case 'maitake': return maitake();
    case 'reishi': return reishi();
    case 'turkeytail': return turkeytail();
    case 'cordyceps': return cordyceps(seed);
    default: return oyster(id);
  }
}

/* ---------- Grow room: one slot on the rack (local coords, base of block at 0,0) ---------- */
function stageOf(g) { let i = 0; MP.stages.forEach((s, k) => { if (g >= s.at) i = k; }); return i; }
function stageProg(g) {
  const i = stageOf(g);
  if (i >= MP.stages.length - 1) return 1;
  return (g - MP.stages[i].at) / (MP.stages[i + 1].at - MP.stages[i].at);
}
function sparkles(n, w, h, seed, cls = 'twinkle') {
  const R = rng(seed);
  let s = '';
  for (let i = 0; i < n; i++) {
    const x = (R() - 0.5) * w, y = -R() * h, k = 0.6 + R() * 0.8;
    s += `<path class="${cls}" style="animation-delay:-${r1(R() * 3)}s" d="M${r1(x)} ${r1(y - 6 * k)} L${r1(x + 1.6 * k)} ${r1(y - 1.6 * k)} L${r1(x + 6 * k)} ${r1(y)} L${r1(x + 1.6 * k)} ${r1(y + 1.6 * k)} L${r1(x)} ${r1(y + 6 * k)} L${r1(x - 1.6 * k)} ${r1(y + 1.6 * k)} L${r1(x - 6 * k)} ${r1(y)} L${r1(x - 1.6 * k)} ${r1(y - 1.6 * k)}Z" fill="#FFF3C4"/>`;
  }
  return s;
}
function blockBody(p, st, col, R) {
  const sp = MP.species[p.species];
  let s = '';
  s += `<rect x="-72" y="-106" width="144" height="106" rx="10" fill="${G.block}"/>`;
  for (let i = 0; i < 60; i++) s += `<ellipse cx="${r1(-66 + R() * 132)}" cy="${r1(-100 + R() * 94)}" rx="${r1(1 + R() * 2)}" ry="${r1(0.7 + R() * 0.9)}" fill="${R() > 0.5 ? '#B48A57' : '#EAD6B0'}" opacity=".8"/>`;
  for (let i = 0; i < 22; i++) s += `<ellipse cx="${r1(-64 + R() * 128)}" cy="${r1(-100 + R() * 94)}" rx="2.6" ry="1.4" fill="#F6EEDC" opacity="${r1(0.9 - col * 0.6)}"/>`;
  s += `<rect x="-72" y="-106" width="144" height="106" rx="10" fill="#FBF9F3" opacity="${r1(col * 0.88 * 100) / 100}"/>`;
  const threads = Math.round(col * 36);
  for (let i = 0; i < 36; i++) {
    let x = -66 + R() * 132, y = -102 + R() * 98, d = `M${r1(x)} ${r1(y)}`;
    for (let k = 0; k < 4; k++) { x = clamp(x + (R() - 0.5) * 30, -68, 68); y = clamp(y + (R() - 0.5) * 22, -102, -4); d += ` L${r1(x)} ${r1(y)}`; }
    if (i < threads) s += `<path d="${d}" stroke="#fff" stroke-width="1.2" fill="none" opacity=".8"/>`;
  }
  if (st < 2) {
    s += `<path d="M-80 0 V-102 Q-80 -118 -62 -126 L-50 -150 Q0 -160 50 -150 L62 -126 Q80 -118 80 -102 V0Z" fill="#fff" fill-opacity=".16" stroke="#fff" stroke-opacity=".75" stroke-width="1.6"/>`;
    s += `<rect x="-18" y="-164" width="36" height="8" rx="3" fill="#E8E4DA"/>`;
  } else {
    s += `<path d="M-80 0 V-98 Q-80 -112 -68 -114 L68 -114 Q80 -112 80 -98 V0Z" fill="#fff" fill-opacity=".12" stroke="#fff" stroke-opacity=".7" stroke-width="1.6"/>`;
  }
  s += `<path d="M-66 -90 V-14" stroke="#fff" stroke-opacity=".45" stroke-width="4" stroke-linecap="round"/>`;
  s += label(sp.tag, p);
  return s;
}
function jarBody(p, st, col, R) {
  const sp = MP.species[p.species];
  let s = '';
  s += `<rect x="-52" y="-152" width="104" height="152" rx="16" fill="#fff" fill-opacity=".22"/>`;
  s += `<rect x="-48" y="-60" width="96" height="56" rx="10" fill="${G.rice}"/>`;
  for (let i = 0; i < 70; i++) s += `<ellipse cx="${r1(-44 + R() * 88)}" cy="${r1(-56 + R() * 48)}" rx="2.2" ry="1.1" fill="#F6CF82" opacity=".9"/>`;
  s += `<rect x="-48" y="-60" width="96" height="56" rx="10" fill="#FBF6EC" opacity="${r1(col * 0.8 * 100) / 100}"/>`;
  return s;
}
function jarFront() {
  let s = `<rect x="-52" y="-152" width="104" height="152" rx="16" fill="${G.glass}" stroke="#fff" stroke-opacity=".85" stroke-width="1.6"/>`;
  s += `<rect x="-46" y="-166" width="92" height="16" rx="4" fill="#B9B6AE"/><rect x="-14" y="-164" width="28" height="12" rx="2" fill="#F4F2EC"/>`;
  s += `<path d="M-40 -136 V-20" stroke="#fff" stroke-opacity=".6" stroke-width="4" stroke-linecap="round"/>`;
  return s;
}
function label(tag, p) {
  const name = (p.name || '').toUpperCase().slice(0, 10);
  return `<g transform="rotate(-2 0 -40)"><rect x="-46" y="-50" width="92" height="26" rx="3" fill="#FFFEFA" stroke="#DDD6C6"/>` +
    `<text x="0" y="-39" text-anchor="middle" font-family="'Hanken Grotesk', system-ui, sans-serif" font-weight="700" font-size="7.5" letter-spacing=".8" fill="#2A2926">${esc(tag)}</text>` +
    `<text x="0" y="-29.5" text-anchor="middle" font-family="'Hanken Grotesk', system-ui, sans-serif" font-size="6.5" letter-spacing=".6" fill="#6E6C66">${esc(name)}</text></g>`;
}
function pins(p, k, base, R) {
  const sp = MP.species[p.species];
  let s = '';
  for (let i = 0; i < 6; i++) {
    const x = (i - 2.5) * 12 + (R() - 0.5) * 6, h = (6 + R() * 10) * k, rr = (3 + R() * 2.4) * k;
    s += `<path d="M${r1(x)} ${base + 2} v${r1(-h - 2)}" stroke="#EFE7D8" stroke-width="${r1(rr * 1.1 + 1)}" stroke-linecap="round"/><circle cx="${r1(x)}" cy="${r1(base - h)}" r="${r1(rr)}" fill="${sp.pin}"/>`;
  }
  return s;
}
/* A whole slot: block (or jar) plus mushrooms for the plant's growth. */
function slot(p) {
  const st = stageOf(p.growth), prog = stageProg(p.growth);
  const R = rng(p.seed);
  const col = st === 0 ? 0.04 + prog * 0.12 : st === 1 ? 0.16 + prog * 0.84 : 1;
  const jar = MP.species[p.species].jar;
  const base = jar ? -60 : -100;
  let s = jar ? jarBody(p, st, col, R) : blockBody(p, st, col, R);
  if (st === 2) s += pins(p, 0.35 + prog * 0.65, base, R);
  if (st >= 3) {
    const sc = (st === 3 ? 0.3 + prog * 0.25 : st === 4 ? 0.55 + prog * 0.43 : 1) * (jar ? 0.95 : 1);
    const gild = p.gilded ? ` filter="${F.gild}"` : '';
    s += `<g transform="translate(0 ${base + 2})"><g class="sway"><g transform="scale(${r1(sc * 100) / 100})"${gild}>${cluster(p.species, p.seed)}</g>`;
    if (p.gilded) s += sparkles(7, 120 * sc, 150 * sc, p.seed);
    s += '</g></g>';
  }
  if (jar) s += jarFront() + label(MP.species[p.species].tag, p).replace('rotate(-2 0 -40)', 'translate(0 -70) rotate(-2 0 -40)');
  return s;
}
function emptySlot(selected) {
  return `<rect x="-72" y="-106" width="144" height="106" rx="12" fill="#fff" fill-opacity="${selected ? 0.5 : 0.22}" stroke="#8C8A84" stroke-opacity=".6" stroke-dasharray="5 5"/>` +
    `<circle cx="0" cy="-62" r="15" fill="none" stroke="#5E5C57" stroke-width="1.4"/><path d="M0 -70 v16 M-8 -62 h16" stroke="#5E5C57" stroke-width="1.4" stroke-linecap="round"/>` +
    `<text x="0" y="-26" text-anchor="middle" font-family="'Hanken Grotesk', system-ui, sans-serif" font-size="11" letter-spacing="1.2" fill="#5E5C57">PLANT</text>`;
}
const SLOT_POS = [[110, 196], [290, 196], [110, 396], [290, 396]];
const SLOT_K = 0.6;
function rack(slots, selected) {
  let s = '';
  s += `<rect x="18" y="8" width="5" height="410" rx="2" fill="#45452F"/><rect x="377" y="8" width="5" height="410" rx="2" fill="#45452F"/>`;
  [196, 396].forEach(y => {
    s += `<ellipse cx="200" cy="${y + 2}" rx="170" ry="6" fill="#000" opacity=".06"/>`;
    s += `<rect x="16" y="${y}" width="368" height="5" rx="2" fill="#45452F"/>`;
    for (let x = 30; x < 380; x += 14) s += `<path d="M${x} ${y + 5} v5" stroke="#45452F" stroke-width="1"/>`;
    s += `<rect x="16" y="${y + 10}" width="368" height="2" rx="1" fill="#45452F"/>`;
  });
  slots.forEach((p, i) => {
    const [x, y] = SLOT_POS[i];
    const sel = i === selected;
    s += `<g class="slot${sel ? ' sel' : ''}" data-slot="${i}" role="button" tabindex="0" aria-label="${p ? esc(p.name + ', ' + MP.species[p.species].name + ', ' + MP.stages[stageOf(p.growth)].label) : 'Empty slot. Plant here'}">`;
    s += `<rect x="${x - 88}" y="${y - 186}" width="176" height="186" fill="transparent"/>`;
    if (sel) s += `<ellipse cx="${x}" cy="${y - 4}" rx="70" ry="9" fill="#fff" opacity=".85" filter="${F.soft}"/>`;
    s += `<ellipse cx="${x}" cy="${y - 1}" rx="50" ry="4" fill="#000" opacity=".12"/>`;
    s += `<g transform="translate(${x} ${y}) scale(${SLOT_K})">${p ? slot(p) : emptySlot(sel)}</g>`;
    s += '</g>';
  });
  return s;
}

/* ---------- Kitchen: pieces in flat-lay ---------- */
function blobPath(R, rad, n, wob) {
  const pts = [];
  for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2, r = rad * (1 + (R() - 0.5) * wob); pts.push([Math.cos(a) * r, Math.sin(a) * r]); }
  let d = '';
  pts.forEach((p, i) => {
    const q = pts[(i + 1) % n], m = [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];
    d += i === 0 ? `M${r1((pts[n - 1][0] + p[0]) / 2)} ${r1((pts[n - 1][1] + p[1]) / 2)} ` : '';
    d += `Q${r1(p[0])} ${r1(p[1])} ${r1(m[0])} ${r1(m[1])} `;
  });
  return d + 'Z';
}
function trumpetHalf(cap) {
  let s = `<path d="M-26 -44 C-30 -64 30 -64 26 -44 L16 -40 C20 0 22 30 18 50 Q0 57 -18 50 C-22 30 -20 0 -16 -40Z" fill="#F4ECDD"/>`;
  s += `<path d="M-27 -45 C-30 -64 30 -64 27 -45" fill="none" stroke="${cap}" stroke-width="7" stroke-linecap="round"/>`;
  s += `<path d="M-24 -42 Q0 -36 24 -42" fill="none" stroke="#E2D5BE" stroke-width="3"/>`;
  for (let y = -30; y < 42; y += 9) {
    s += `<path d="M-14 ${y} l28 10" stroke="#DCCCAF" stroke-width="1.2"/><path d="M14 ${y} l-28 10" stroke="#DCCCAF" stroke-width="1.2"/>`;
  }
  return s;
}
const PIECES = {
  blue: () => `<path d="M-6 8 L-4 30 Q0 34 4 30 L6 8Z" fill="${G.stem}"/>` + fan(0, 12, 84, 40, 0, OYSTER.blue),
  pink: () => `<path d="M-6 8 L-4 30 Q0 34 4 30 L6 8Z" fill="${G.stem}"/>` + fan(0, 12, 84, 40, 0, OYSTER.pink),
  golden: () => `<path d="M-5 6 L-3 26 Q0 30 3 26 L5 6Z" fill="${G.stem}"/>` + fan(0, 10, 66, 32, 0, OYSTER.golden),
  lions: () => {
    const R = rng(21);
    let s = `<path d="${blobPath(R, 36, 14, 0.14)}" fill="${G.lion}"/>`;
    for (let i = 0; i < 26; i++) { const a = R() * Math.PI * 2, d = R() * 26; s += `<path d="M${r1(Math.cos(a) * d)} ${r1(Math.sin(a) * d)} v5" stroke="#E4D6BB" stroke-width="1.6" stroke-linecap="round"/>`; }
    for (let i = 0; i < 18; i++) { const a = Math.PI * 0.1 + i / 17 * Math.PI * 0.8; s += `<path d="M${r1(Math.cos(a) * 33)} ${r1(Math.sin(a) * 33)} l${r1(Math.cos(a) * 7)} ${r1(Math.sin(a) * 7)}" stroke="#EFE5D0" stroke-width="2.4" stroke-linecap="round"/>`; }
    return s;
  },
  king: () => trumpetHalf('#B88E63'),
  pearl: () => trumpetHalf('#3E4048'),
  pioppino: () => bunch([[-18, -38, 11], [4, -50, 12], [22, -34, 10]], G.pioCap, 0.25, 5).replace(/^/, '<g transform="translate(0 24)">') + '</g>',
  maitake: () => `<g transform="translate(0 26) scale(.55)">${frond(-30, -40, 56, 32, -20)}${frond(30, -44, 56, 32, 20)}${frond(0, -26, 70, 40, 0)}</g>`,
  nameko: () => dome(-14, 4, 15, G.namCap, 0.6) + dome(14, 8, 13, G.namCap, 0.6) + dome(0, -8, 17, G.namCap, 0.6),
  toast: () => {
    let s = `<path d="M-52 46 L-56 -18 C-62 -52 -30 -60 0 -54 C30 -60 62 -52 56 -18 L52 46 Q0 54 -52 46Z" fill="#B97A3B"/>`;
    s += `<path d="M-44 38 L-47 -16 C-52 -44 -26 -48 0 -44 C26 -48 52 -44 47 -16 L44 38 Q0 45 -44 38Z" fill="${G.toast}"/>`;
    const R = rng(5);
    for (let i = 0; i < 16; i++) s += `<ellipse cx="${r1(-36 + R() * 72)}" cy="${r1(-34 + R() * 66)}" rx="${r1(2 + R() * 3)}" ry="${r1(1.4 + R() * 2)}" fill="#C99350" opacity=".7"/>`;
    return s;
  },
  rice: () => {
    let s = `<circle r="54" fill="#F6F3EA"/>`;
    const R = rng(8);
    for (let i = 0; i < 90; i++) { const a = R() * Math.PI * 2, d = Math.sqrt(R()) * 50; s += `<ellipse cx="${r1(Math.cos(a) * d)}" cy="${r1(Math.sin(a) * d)}" rx="4" ry="1.8" transform="rotate(${Math.round(R() * 180)} ${r1(Math.cos(a) * d)} ${r1(Math.sin(a) * d)})" fill="#fff" stroke="#E4DECF" stroke-width=".6"/>`; }
    return s;
  },
  noodles: () => {
    let s = `<circle r="54" fill="#EFD9A3"/>`;
    const R = rng(9);
    for (let i = 0; i < 26; i++) { const a = R() * Math.PI * 2, d = R() * 34; s += `<path d="M${r1(Math.cos(a) * d - 18)} ${r1(Math.sin(a) * d)} q9 -12 18 0 t18 0" stroke="${i % 2 ? '#F5E3B6' : '#DFC27F'}" stroke-width="3.2" fill="none" stroke-linecap="round" transform="rotate(${Math.round(R() * 180)} ${r1(Math.cos(a) * d)} ${r1(Math.sin(a) * d)})"/>`; }
    return s;
  },
  egg: () => `<ellipse rx="30" ry="23" fill="#FCFBF6"/><ellipse rx="30" ry="23" fill="none" stroke="#E9E5DA" stroke-width="1.2"/><circle cx="2" cy="1" r="14" fill="${G.yolk}"/><ellipse cx="-3" cy="-4" rx="4" ry="2" fill="#fff" opacity=".55"/>`,
  tofu: () => [[-16, -12, 6], [14, -10, -8], [-2, 14, 14]].map(([x, y, r]) => `<g transform="translate(${x} ${y}) rotate(${r})"><rect x="-12" y="-12" width="24" height="24" rx="4" fill="#EEE3C8"/><rect x="-12" y="-12" width="24" height="24" rx="4" fill="none" stroke="#D3A55E" stroke-width="2.5"/><rect x="-7" y="-7" width="10" height="5" rx="2" fill="#fff" opacity=".5"/></g>`).join(''),
  bokchoy: () => `<path d="M0 46 C-26 40 -40 6 -34 -22 C-28 -46 -10 -54 0 -54 C10 -54 28 -46 34 -22 C40 6 26 40 0 46Z" fill="${G.bok}"/><path d="M0 44 V-30 M0 -2 L-18 -26 M0 12 L18 -18" stroke="#DCE7C8" stroke-width="2" fill="none" stroke-linecap="round"/>`,
  tomato: () => [[-10, -4], [12, 6]].map(([x, y]) => `<g transform="translate(${x} ${y})"><circle r="12" fill="#D8432F"/><circle r="9" fill="#EE7A5E"/><path d="M0 -6 V6 M-6 0 H6" stroke="#F5B19A" stroke-width="1.6"/><circle cx="-4" cy="-3" r="1.3" fill="#F9E2B3"/><circle cx="4" cy="3" r="1.3" fill="#F9E2B3"/></g>`).join(''),
  garlic: () => [[-8, 0, -20], [10, 4, 24]].map(([x, y, r]) => `<g transform="translate(${x} ${y}) rotate(${r})"><path d="M0 -16 C10 -10 10 10 0 16 C-6 10 -7 -8 0 -16Z" fill="#F5EEE0" stroke="#DCCFB8" stroke-width="1"/><path d="M1 -12 C5 -4 5 6 1 12" stroke="#E4D8C2" fill="none"/></g>`).join(''),
  shallot: () => [[-8, -4], [10, 6]].map(([x, y]) => `<g transform="translate(${x} ${y})"><ellipse rx="14" ry="11" fill="none" stroke="#B9768A" stroke-width="2.4"/><ellipse rx="9" ry="7" fill="none" stroke="#E2C1CB" stroke-width="2"/><ellipse rx="4" ry="3" fill="none" stroke="#B9768A" stroke-width="1.6"/></g>`).join(''),
  butter: () => `<rect x="-16" y="-12" width="32" height="24" rx="5" fill="#F6DE8D"/><path d="M-16 6 Q-8 16 2 10 Q10 6 16 8" fill="#F6DE8D" opacity=".7"/><rect x="-11" y="-8" width="14" height="5" rx="2" fill="#fff" opacity=".5"/>`,
  lemon: () => `<path d="M-24 8 A24 24 0 0 0 24 8Z" fill="#E9BE2D"/><path d="M-20 8 A20 20 0 0 0 20 8Z" fill="${G.lemon}"/>` + [-60, -30, 0, 30, 60].map(a => `<path d="M0 8 L${r1(Math.sin(a * Math.PI / 180) * 18)} ${r1(8 + Math.cos(a * Math.PI / 180) * 18)}" stroke="#FDF3C6" stroke-width="1.3"/>`).join(''),
  thyme: () => {
    let s = `<path d="M-28 22 Q-4 6 26 -24" stroke="#6E6A4E" stroke-width="1.4" fill="none"/>`;
    for (let i = 0; i < 12; i++) { const t = i / 11, x = -28 + t * 54, y = 22 - t * 46 + Math.sin(t * 3) * 3; s += `<ellipse cx="${r1(x + (i % 2 ? 4 : -4))}" cy="${r1(y)}" rx="3.4" ry="1.8" transform="rotate(${i % 2 ? -40 : 40} ${r1(x)} ${r1(y)})" fill="${i % 3 ? '#6F8B4E' : '#8AA463'}"/>`; }
    return s;
  },
  scallion: () => { const R = rng(12); let s = ''; for (let i = 0; i < 14; i++) { const a = R() * Math.PI * 2, d = R() * 26; s += `<circle cx="${r1(Math.cos(a) * d)}" cy="${r1(Math.sin(a) * d)}" r="3.6" fill="#EAF2D6" stroke="${i % 3 ? '#79A350' : '#A9C97E'}" stroke-width="2"/>`; } return s; },
  chili: () => [[-10, -6], [8, 4], [-2, 14]].map(([x, y]) => `<g transform="translate(${x} ${y})"><circle r="7" fill="#C8321F"/><circle r="4.4" fill="#F2D9B8"/><circle cx="-1.4" cy="-1" r="1" fill="#E7B66D"/><circle cx="1.4" cy="1.2" r="1" fill="#E7B66D"/></g>`).join(''),
  micro: () => { const R = rng(14); let s = ''; for (let i = 0; i < 10; i++) { const x = (R() - 0.5) * 34, y = (R() - 0.5) * 30, a = R() * 360; s += `<g transform="translate(${r1(x)} ${r1(y)}) rotate(${Math.round(a)})"><path d="M0 0 V12" stroke="#E5EDD2" stroke-width="1.4"/><ellipse cx="-4" cy="-2" rx="4.4" ry="2.6" fill="#8DBE5A"/><ellipse cx="4" cy="-2" rx="4.4" ry="2.6" fill="#76A846"/></g>`; } return s; },
  parmesan: () => { const R = rng(15); let s = ''; for (let i = 0; i < 6; i++) { const x = (R() - 0.5) * 36, y = (R() - 0.5) * 30; s += `<path d="M${r1(x - 9)} ${r1(y - 4)} L${r1(x + 8)} ${r1(y - 6)} L${r1(x + 10)} ${r1(y + 3)} L${r1(x - 6)} ${r1(y + 6)}Z" fill="#F3E4B4" opacity=".92" stroke="#E2CD8C" stroke-width=".8"/>`; } return s; },
  sesame: () => { const R = rng(16); let s = ''; for (let i = 0; i < 26; i++) { const x = (R() - 0.5) * 50, y = (R() - 0.5) * 44; s += `<ellipse cx="${r1(x)}" cy="${r1(y)}" rx="2.2" ry="1.2" transform="rotate(${Math.round(R() * 180)} ${r1(x)} ${r1(y)})" fill="${i % 4 ? '#F4E7C8' : '#2C2724'}"/>`; } return s; },
  salt: () => { const R = rng(17); let s = ''; for (let i = 0; i < 18; i++) { const x = (R() - 0.5) * 44, y = (R() - 0.5) * 40; s += `<rect x="${r1(x)}" y="${r1(y)}" width="${r1(2 + R() * 2.5)}" height="${r1(2 + R() * 2.5)}" transform="rotate(${Math.round(R() * 90)} ${r1(x)} ${r1(y)})" fill="#fff" opacity=".95"/>`; } return s; },
  miso: () => `<path d="M-62 18 C-30 -26 22 -30 62 -12" stroke="url(#mp-miso)" stroke-width="26" stroke-linecap="round" fill="none"/><path d="M-50 6 C-24 -20 16 -24 50 -12" stroke="#E0A469" stroke-width="5" stroke-linecap="round" fill="none" opacity=".55"/>`,
  cream: () => `<path d="${blobPath(rng(30), 58, 12, 0.22)}" fill="#F5EFE1"/><path d="${blobPath(rng(31), 40, 10, 0.2)}" fill="#FBF8F0" opacity=".7"/>`,
  chilioil: () => [[-14, -8, 7], [10, -12, 5], [16, 10, 8], [-6, 14, 5], [-20, 8, 4]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r + 3}" fill="#E9783A" opacity=".35"/><circle cx="${x}" cy="${y}" r="${r}" fill="#C2391B" opacity=".9"/>`).join(''),
};
const MUSH_PIECES = ['blue', 'pink', 'golden', 'lions', 'pioppino', 'king', 'pearl', 'maitake', 'nameko'];
const PIECE_R = { blue: 46, pink: 46, golden: 38, lions: 40, king: 58, pearl: 58, pioppino: 40, maitake: 44, nameko: 30 };
function pieceR(t) { return PIECE_R[t] || (Object.prototype.hasOwnProperty.call(MP.ingredients, t) && MP.ingredients[t].r) || 30; }

function surface(id, w = 400, h = 400) {
  const R = rng(77);
  let s = '';
  if (id === 'linen') {
    s += `<rect width="${w}" height="${h}" fill="#E6E1D6"/>`;
    for (let y = 0; y < h; y += 4) s += `<path d="M0 ${y} H${w}" stroke="#D9D3C5" stroke-width=".6" opacity=".7"/>`;
    for (let x = 0; x < w; x += 5) s += `<path d="M${x} 0 V${h}" stroke="#EFEBE2" stroke-width=".6" opacity=".6"/>`;
  } else if (id === 'marble') {
    s += `<rect width="${w}" height="${h}" fill="#EFEEEA"/>`;
    for (let i = 0; i < 6; i++) { let x = R() * w, y = 0, d = `M${r1(x)} 0`; while (y < h) { y += 30 + R() * 40; x += (R() - 0.5) * 80; d += ` Q${r1(x + 20)} ${r1(y - 15)} ${r1(x)} ${r1(y)}`; } s += `<path d="${d}" stroke="${i % 2 ? '#D3D1CB' : '#C6C4BE'}" stroke-width="${r1(0.6 + R() * 1.4)}" fill="none" opacity=".7"/>`; }
  } else if (id === 'walnut') {
    s += `<rect width="${w}" height="${h}" fill="${G.walnut}"/>`;
    for (let y = 6; y < h; y += 9 + R() * 8) s += `<path d="M0 ${r1(y)} Q${w / 3} ${r1(y + (R() - 0.5) * 10)} ${w * 2 / 3} ${r1(y)} T${w} ${r1(y)}" stroke="#4A3221" stroke-width="${r1(0.6 + R())}" fill="none" opacity=".45"/>`;
  } else {
    s += `<rect width="${w}" height="${h}" fill="#DDDCD7"/>`;
    for (let i = 0; i < 260; i++) s += `<circle cx="${r1(R() * w)}" cy="${r1(R() * h)}" r="${r1(0.4 + R() * 0.8)}" fill="${R() > 0.5 ? '#CFCEC8' : '#E8E7E2'}"/>`;
  }
  return s;
}
function plate(id) {
  const R = rng(91);
  let s = '';
  if (id === 'board') {
    s += `<rect x="40" y="76" width="320" height="256" rx="26" fill="#000" opacity=".22" filter="${F.soft}"/>`;
    s += `<rect x="36" y="68" width="328" height="256" rx="26" fill="${G.board}"/>`;
    for (let y = 84; y < 316; y += 10 + R() * 9) s += `<path d="M52 ${r1(y)} Q200 ${r1(y + (R() - 0.5) * 12)} 348 ${r1(y)}" stroke="#5B3E28" stroke-width="${r1(0.6 + R())}" fill="none" opacity=".4"/>`;
    s += `<rect x="36" y="68" width="328" height="256" rx="26" fill="none" stroke="#A37B57" stroke-opacity=".5" stroke-width="2"/>`;
    return s;
  }
  s += `<ellipse cx="204" cy="214" rx="160" ry="158" fill="#000" opacity=".22" filter="${F.soft}"/>`;
  if (id === 'stone') {
    s += `<circle cx="200" cy="200" r="160" fill="${G.plateStone}"/><circle cx="200" cy="200" r="122" fill="${G.plateStoneWell}"/>`;
    for (let i = 0; i < 120; i++) { const a = R() * Math.PI * 2, d = Math.sqrt(R()) * 156; s += `<circle cx="${r1(200 + Math.cos(a) * d)}" cy="${r1(200 + Math.sin(a) * d)}" r="${r1(0.5 + R() * 0.9)}" fill="#8C8781" opacity=".5"/>`; }
    s += `<circle cx="200" cy="200" r="122" fill="none" stroke="#5D5A55" stroke-width="1.5"/>`;
  } else if (id === 'celadon') {
    s += `<circle cx="200" cy="200" r="158" fill="${G.plateCel}"/><circle cx="200" cy="200" r="136" fill="${G.plateCelWell}"/>`;
    s += `<circle cx="200" cy="200" r="157" fill="none" stroke="#E2EAE1" stroke-width="2" opacity=".8"/>`;
  } else if (id === 'deepbowl') {
    s += `<circle cx="200" cy="200" r="156" fill="${G.bowlOut}"/><circle cx="200" cy="200" r="140" fill="${G.bowlIn}"/>`;
    s += `<circle cx="200" cy="200" r="155" fill="none" stroke="#7A7568" stroke-width="2" opacity=".6"/><path d="M90 120 A140 140 0 0 1 200 60" stroke="#fff" stroke-width="4" fill="none" opacity=".18" stroke-linecap="round"/>`;
  } else {
    s += `<circle cx="200" cy="200" r="162" fill="${G.platePorc}"/><circle cx="200" cy="200" r="108" fill="#FBFBF9"/>`;
    s += `<circle cx="200" cy="200" r="108" fill="none" stroke="#E2E0DA" stroke-width="2.5"/>`;
  }
  return s;
}
/* A plated dish. items: [{t,x,y,r,s}]. sel: index of the selected item. bare: leave out the surface. */
function dish(comp, sel = -1, bare = false) {
  const method = MP.methods[comp.method] ? comp.method : 'raw';
  let s = (bare ? '' : surface(MP.surfaces[comp.surface] ? comp.surface : 'stone')) + plate(MP.plates[comp.plate] ? comp.plate : 'stone');
  (comp.items || []).slice(0, 40).forEach((it, i) => {
    const draw = MP.pieceDraw(it.t);
    if (!draw) return;
    const cook = MUSH_PIECES.includes(it.t) && method !== 'raw' ? ` filter="${F[method]}"` : '';
    const x = clamp(+it.x || 200, 0, 400), y = clamp(+it.y || 200, 0, 400), rot = Math.round(+it.r || 0), sc = clamp(+it.s || 1, 0.4, 2.2);
    s += `<g class="item${i === sel ? ' sel' : ''}" data-i="${i}" transform="translate(${r1(x)} ${r1(y)}) rotate(${rot}) scale(${r1(sc * 100) / 100})">`;
    s += `<g filter="${F.shadow}"><g${cook}>${draw()}</g></g>`;
    if (i === sel) s += `<circle r="${pieceR(it.t) + 8}" fill="none" stroke="#fff" stroke-width="${r1(1.6 / sc)}" stroke-dasharray="${r1(5 / sc)} ${r1(4 / sc)}"/>`;
    s += '</g>';
  });
  return s;
}
function pieceThumb(t) {
  const r = pieceR(t), draw = MP.pieceDraw(t);
  return `<svg viewBox="${-r - 8} ${-r - 8} ${2 * r + 16} ${2 * r + 16}" aria-hidden="true">${draw ? draw() : ''}</svg>`;
}

/* ---------- Cafe: everything is served in clear glass ---------- */
const GLASSES = {
  mug: { top: 186, bot: 338, wt: 70, wb: 64, fill: 20, handle: true },
  glass: { top: 118, bot: 340, wt: 62, wb: 48, fill: 30 },
  rocks: { top: 218, bot: 340, wt: 80, wb: 70, fill: 24 },
};
function milkTint(comp) {
  const m = MP.milks[comp.milk];
  if (!m || !m.color) return null;
  let c = m.color;
  (comp.mush || []).forEach(id => { const col = powderColor(id); if (col) c = mix(c, col, 0.12); });
  return c;
}
function powderColor(id) {
  const p = MP.products.find(x => x.id === id);
  if (p) return p.color;
  return MP.species[id] && MP.species[id].powder;
}
function drinkColors(comp) {
  const b = MP.bases[comp.base] || MP.bases.espresso;
  let base = b.color;
  (comp.mush || []).forEach(id => { const col = powderColor(id); if (col) base = mix(base, col, 0.1); });
  const milk = milkTint(comp);
  const layered = !!(milk && comp.temp === 'iced' && b.layer);
  const blended = milk ? mix(base, milk, b.latte) : base;
  return { base, milk, layered, blended, b };
}
/* Moshruum's jar: amber glass, black lid, pastel label. Base of the jar at 0,0. */
function jar(p) {
  const words = p.name.split(' ');
  const l1 = words.length > 1 ? words.slice(0, Math.ceil(words.length / 2)).join(' ') : p.name;
  const l2 = words.length > 1 ? words.slice(Math.ceil(words.length / 2)).join(' ') : '';
  const hand = `font-family="'Gochi Hand', 'Comic Sans MS', cursive"`;
  const sans = `font-family="'Hanken Grotesk', Arial, sans-serif"`;
  let s = `<rect x="-31" y="-78" width="62" height="78" rx="8" fill="${G.amber}"/>`;
  s += `<rect x="-28" y="-84" width="56" height="8" rx="2" fill="#2A170C"/>`;
  s += `<rect x="-32" y="-100" width="64" height="18" rx="3" fill="${G.lid}"/><path d="M-30 -96 H30" stroke="#fff" stroke-opacity=".12" stroke-width="1.4"/>`;
  s += `<rect x="-31" y="-70" width="62" height="50" fill="${p.label}"/><rect x="-31" y="-70" width="62" height="50" fill="${G.labelShade}"/>`;
  s += `<text x="0" y="-61" text-anchor="middle" ${sans} font-weight="600" font-size="3.6" letter-spacing=".9" fill="#2A2A26">MOSHRUUM'S</text>`;
  s += `<text x="0" y="${l2 ? -49 : -43}" text-anchor="middle" ${hand} font-size="11" fill="#151513">${esc(l1)}</text>`;
  if (l2) s += `<text x="0" y="-38" text-anchor="middle" ${hand} font-size="11" fill="#151513">${esc(l2)}</text>`;
  s += `<text x="0" y="-29" text-anchor="middle" ${sans} font-weight="700" font-size="2.6" letter-spacing=".4" fill="#2A2A26">${esc(p.tagline)}</text>`;
  s += `<text x="0" y="-24.5" text-anchor="middle" ${sans} font-size="2.4" letter-spacing=".3" fill="#55554E">${esc(p.sub)}</text>`;
  s += `<path d="M-31 -66 q5 1 3 5 q-2 4 3 5" stroke="#151513" stroke-width="1.5" fill="none" stroke-linecap="round"/><path d="M31 -28 q-4 -1 -3 3 q1 4 -3 4" stroke="#151513" stroke-width="1.5" fill="none" stroke-linecap="round"/>`;
  s += `<rect x="-26" y="-76" width="4" height="72" rx="2" fill="#fff" opacity=".16"/>`;
  return s;
}
function woodBlock(w) {
  return `<path d="M${-w / 2 + 6} -7 L${w / 2 - 6} -7 L${w / 2} 0 L${-w / 2} 0Z" fill="#DDB585"/>` +
    `<rect x="${-w / 2}" y="0" width="${w}" height="24" fill="${G.wood}"/>` +
    `<path d="M${-w / 2 + 6} 6 Q0 9 ${w / 2 - 6} 5 M${-w / 2 + 4} 13 Q0 10 ${w / 2 - 4} 14 M${-w / 2 + 8} 19 Q0 22 ${w / 2 - 8} 19" stroke="#9C6E42" stroke-width=".8" fill="none" opacity=".6"/>`;
}
function prop(id, x) {
  const p = MP.products.find(q => q.id === id);
  const sp = MP.species[id];
  let s = `<g transform="translate(${x} 302)"><ellipse cx="0" cy="25" rx="50" ry="5" fill="#000" opacity=".15"/>${woodBlock(84)}<g transform="translate(0 -5)">`;
  if (p) s += jar(p);
  else if (sp) {
    s += `<path d="M-22 0 L-24 -58 L-17 -66 L17 -66 L24 -58 L22 0Z" fill="#CDAE82"/><path d="M-17 -66 L-13 -72 L13 -72 L17 -66Z" fill="#B99A6E"/>` +
      `<rect x="-16" y="-46" width="32" height="22" fill="#FBF8F1"/><text x="0" y="-32" text-anchor="middle" font-family="'Instrument Serif', Georgia, serif" font-size="7.5" fill="#2D2C29">${esc(sp.name)}</text>`;
  }
  return s + '</g></g>';
}
function productThumb(id) {
  const p = MP.products.find(q => q.id === id);
  return p ? `<svg viewBox="-40 -106 80 112" aria-hidden="true">${jar(p)}</svg>` : '';
}
function latteArt(cx, cy, col, sx = 0.7, sy = 0.2) {
  return `<g transform="translate(${cx} ${cy}) scale(${sx} ${sy})"><path d="M0 34 C-44 2 -48 -36 -22 -42 C-9 -44 0 -34 0 -25 C0 -34 9 -44 22 -42 C48 -36 44 2 0 34Z" fill="${col}"/><path d="M0 34 L0 -18" stroke="${col}" stroke-width="3"/></g>`;
}
function dust(comp, cx, cy, rx, ry, seed) {
  const R = rng(seed);
  const cols = { cinnamon: '#8A4B22', cocoa: '#3E241A', matchadust: '#5E8A31' };
  let s = '';
  (comp.finish || []).forEach(f => {
    if (!cols[f]) return;
    for (let i = 0; i < 40; i++) { const a = R() * Math.PI * 2, d = Math.sqrt(R()); s += `<circle cx="${r1(cx + Math.cos(a) * d * rx * 0.85)}" cy="${r1(cy + Math.sin(a) * d * ry * 0.8)}" r="${r1(0.5 + R() * 0.9)}" fill="${cols[f]}" opacity=".85"/>`; }
  });
  if ((comp.finish || []).includes('flowers')) {
    [[-0.35, -0.1, '#8B6BB8'], [0.3, 0.15, '#F2C94C']].forEach(([fx, fy, c]) => {
      const x = cx + fx * rx, y = cy + fy * ry;
      for (let k = 0; k < 5; k++) { const a = k / 5 * Math.PI * 2; s += `<ellipse cx="${r1(x + Math.cos(a) * 4)}" cy="${r1(y + Math.sin(a) * 2)}" rx="3.6" ry="2" transform="rotate(${Math.round(a * 57)} ${r1(x + Math.cos(a) * 4)} ${r1(y + Math.sin(a) * 2)})" fill="${c}"/>`; }
      s += `<circle cx="${r1(x)}" cy="${r1(y)}" r="1.6" fill="#F7E08A"/>`;
    });
  }
  return s;
}
function steam(x, y) {
  return [-18, 0, 18].map((dx, i) => `<path class="steam" style="animation-delay:-${i * 0.9}s" d="M${x + dx} ${y} c-8 -12 8 -20 0 -32 c-8 -12 8 -20 0 -32" stroke="#fff" stroke-width="3" stroke-linecap="round" fill="none" opacity=".75"/>`).join('');
}
function glassDrink(comp) {
  const g = GLASSES[comp.cup] || GLASSES.glass;
  const c = drinkColors(comp);
  const fin = comp.finish || [];
  const id = nextId('mpclip');
  const L = 200 - g.wt, Rr = 200 + g.wt, bl = 200 - g.wb, br = 200 + g.wb;
  const inner = `M${L + 5} ${g.top} L${bl + 5} ${g.bot - 10} Q${bl + 6} ${g.bot - 4} ${bl + 12} ${g.bot - 4} L${br - 12} ${g.bot - 4} Q${br - 6} ${g.bot - 4} ${br - 5} ${g.bot - 10} L${Rr - 5} ${g.top}Z`;
  const outline = `M${L} ${g.top} L${bl} ${g.bot - 8} Q${bl + 2} ${g.bot} ${bl + 12} ${g.bot} L${br - 12} ${g.bot} Q${br - 2} ${g.bot} ${br} ${g.bot - 8} L${Rr} ${g.top}`;
  const fillY = g.top + g.fill;
  const bottom = g.bot - 4, H = bottom - fillY;
  const hotMilk = c.milk && comp.temp !== 'iced';
  const foam = c.milk && (fin.includes('foam') || hotMilk);
  const foamCol = c.milk ? mix(c.milk, '#FFFFFF', 0.35) : '#fff';
  let s = `<defs><clipPath id="${id}"><path d="${inner}"/></clipPath>`;
  let liquid = '';
  if (c.layered) {
    const gid = nextId('mplay');
    s += `<linearGradient id="${gid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c.base}"/><stop offset=".36" stop-color="${c.base}"/><stop offset=".5" stop-color="${mix(c.base, c.milk, 0.55)}"/><stop offset=".6" stop-color="${c.milk}"/><stop offset="1" stop-color="${c.milk}"/></linearGradient>`;
    liquid = `<rect x="0" y="${fillY}" width="400" height="${H}" fill="url(#${gid})"/>`;
  } else {
    const col = c.milk ? c.blended : c.base;
    liquid = `<rect x="0" y="${fillY}" width="400" height="${H}" fill="${col}" opacity="${c.milk || c.b.smoothie ? 1 : 0.9}"/>`;
  }
  s += '</defs>';
  s += `<ellipse cx="200" cy="${g.bot + 2}" rx="${g.wb + 26}" ry="8" fill="#000" opacity=".14" filter="${F.soft}"/>`;
  if (g.handle) s += `<path d="M${Rr - 3} ${g.top + 26} C${Rr + 44} ${g.top + 22} ${Rr + 44} ${g.bot - 44} ${br - 2} ${g.bot - 36}" stroke="#fff" stroke-opacity=".55" stroke-width="10" fill="none" stroke-linecap="round"/><path d="M${Rr - 3} ${g.top + 26} C${Rr + 44} ${g.top + 22} ${Rr + 44} ${g.bot - 44} ${br - 2} ${g.bot - 36}" stroke="#9E9B93" stroke-opacity=".5" stroke-width="1" fill="none"/>`;
  s += `<path d="${outline}Z" fill="#fff" fill-opacity=".18"/>`;
  s += `<g clip-path="url(#${id})">${liquid}`;
  if (comp.sweet === 'brown') {
    const R = rng(6);
    for (let i = 0; i < 6; i++) {
      const x = L + 4 + i * (g.wt * 2 - 8) / 5, h = H * (0.35 + R() * 0.3);
      s += `<path d="M${r1(x - 10)} ${bottom} C${r1(x + 14)} ${r1(bottom - h * 0.35)} ${r1(x - 16)} ${r1(bottom - h * 0.65)} ${r1(x + 8)} ${r1(bottom - h)}" stroke="#6B3612" stroke-width="${r1(10 + R() * 8)}" fill="none" stroke-linecap="round" opacity=".32"/>`;
    }
  }
  if (fin.includes('pearls')) {
    const R = rng(7);
    for (let i = 0; i < 26; i++) { const x = bl + 10 + R() * (g.wb * 2 - 20), y = bottom - 6 - R() * 26; s += `<circle cx="${r1(x)}" cy="${r1(y)}" r="5.2" fill="#2F1C12"/><circle cx="${r1(x - 1.6)}" cy="${r1(y - 1.8)}" r="1.4" fill="#fff" opacity=".35"/>`; }
  }
  if (comp.temp === 'iced') {
    const R = rng(8);
    for (let i = 0; i < 5; i++) { const x = L + 14 + R() * (g.wt * 2 - 48), y = fillY + 4 + R() * Math.min(60, H * 0.45), rr = Math.round((R() - 0.5) * 50); s += `<rect x="${r1(x)}" y="${r1(y)}" width="28" height="26" rx="6" transform="rotate(${rr} ${r1(x + 14)} ${r1(y + 13)})" fill="#fff" fill-opacity=".32" stroke="#fff" stroke-opacity=".7" stroke-width="1.2"/>`; }
  }
  if (foam) s += `<path d="M0 ${fillY + 24} V${fillY} q12 -4 24 0 t24 0 t24 0 t24 0 t24 0 t24 0 t24 0 t24 0 t24 0 t24 0 t24 0 t24 0 t24 0 t24 0 t24 0 t24 0 t24 0 V${fillY + 24}Z" fill="${foamCol}"/>`;
  s += `</g>`;
  /* the surface, seen from slightly above */
  const rx = g.wt - 6 - (g.wt - g.wb) * (g.fill / (g.bot - g.top)), ry = Math.max(5, rx * 0.12);
  const topCol = foam ? foamCol : c.layered ? c.base : c.milk ? c.blended : c.b.top;
  s += `<ellipse cx="200" cy="${fillY}" rx="${r1(rx)}" ry="${r1(ry)}" fill="${topCol}"/>`;
  if (fin.includes('art') && hotMilk) {
    s += `<ellipse cx="200" cy="${fillY}" rx="${r1(rx)}" ry="${r1(ry)}" fill="${mix(c.base, c.milk, 0.35)}"/>`;
    s += latteArt(200, fillY + 1, foamCol, rx / 60, ry / 40);
  }
  s += dust(comp, 200, fillY, rx, ry, 9);
  if (comp.temp === 'iced' && comp.cup === 'glass') s += `<path d="M222 ${g.bot - 20} L262 ${g.top - 34}" stroke="#2F2E2B" stroke-width="7" stroke-linecap="round"/>`;
  s += `<path d="${outline}" fill="none" stroke="#fff" stroke-width="2.4" stroke-opacity=".9"/>`;
  s += `<path d="${outline}" fill="none" stroke="#9E9B93" stroke-width=".8" stroke-opacity=".6"/>`;
  s += `<ellipse cx="200" cy="${g.top}" rx="${g.wt}" ry="${r1(Math.max(5, g.wt * 0.1))}" fill="none" stroke="#fff" stroke-width="2" stroke-opacity=".9"/>`;
  s += `<path d="M${L + 14} ${g.top + 16} L${bl + 14} ${g.bot - 22}" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".45"/>`;
  s += `<rect x="${bl + 4}" y="${g.bot - 8}" width="${g.wb * 2 - 8}" height="8" rx="3" fill="#fff" opacity=".35"/>`;
  if (comp.temp !== 'iced') s += steam(200, g.top - 18);
  return s;
}
function counter(id) {
  let s = `<rect width="400" height="400" fill="${G.wall}"/>`;
  s += `<g transform="translate(0 326)">${surface(id || 'stone', 400, 74)}</g>`;
  s += `<rect y="324" width="400" height="3" fill="#000" opacity=".06"/>`;
  return s;
}
function drink(comp, bare = false) {
  let s = bare ? '' : counter(MP.surfaces[comp.surface] ? comp.surface : 'stone');
  const mush = (comp.mush || []).slice(0, 2);
  if (mush[0]) s += prop(mush[0], 72);
  if (mush[1]) s += prop(mush[1], 344);
  return s + glassDrink(comp);
}

/* ---------- Cinematic cover (640 x 400) for premium recipes ---------- */
function cover(kind, comp) {
  const R = rng(kind === 'dish' ? (comp.items || []).length * 7 + 3 : 11);
  let s = '';
  if (kind === 'dish') {
    s += `<g transform="scale(1.6)">${surface(MP.surfaces[comp.surface] ? comp.surface : 'stone', 400, 250)}</g>`;
    s += `<rect width="640" height="400" fill="#0B0A08" opacity=".42"/>`;
    s += `<g transform="translate(26 318) rotate(-14)" filter="${F.shadow}"><rect x="-90" y="-46" width="190" height="120" rx="3" fill="#E7E1D5"/><path d="M-90 -14 H100 M-30 -46 V74" stroke="#D2CABA" stroke-width="2"/><rect x="-90" y="-46" width="190" height="120" rx="3" fill="none" stroke="#CFC6B4"/></g>`;
    const garn = Array.from(new Set((comp.items || []).map(i => i.t))).filter(t => ['herb', 'spice'].includes((MP.ingredients[t] || {}).cat)).slice(0, 2);
    garn.forEach((t, i) => { const d = MP.pieceDraw(t); if (d) s += `<g transform="translate(${150 + i * 60} ${340 - i * 30}) rotate(${Math.round(R() * 90)}) scale(.8)" filter="${F.shadow}">${d()}</g>`; });
    s += `<g transform="translate(250 -46) scale(1.14)">${dish(comp, -1, true)}</g>`;
  } else {
    s += `<rect width="640" height="400" fill="url(#mp-cafe)"/>`;
    for (let i = 0; i < 14; i++) s += `<circle cx="${r1(R() * 300)}" cy="${r1(20 + R() * 220)}" r="${r1(10 + R() * 26)}" fill="${R() > 0.5 ? '#FFCB7A' : '#F7E2B8'}" opacity="${r1(0.12 + R() * 0.3)}" filter="${F.soft}"/>`;
    s += `<g transform="translate(0 316) scale(1.6 1)">${surface(MP.surfaces[comp.surface] ? comp.surface : 'walnut', 400, 84)}</g><rect y="316" width="640" height="84" fill="#0B0A08" opacity=".38"/>`;
    s += `<ellipse cx="430" cy="200" rx="120" ry="150" fill="#FFE7BD" opacity=".16" filter="${F.soft}"/>`;
    s += `<g transform="translate(230 -12)">${drink(comp, true)}</g>`;
  }
  s += `<rect width="640" height="400" fill="url(#mp-light)"/><rect width="640" height="400" fill="url(#mp-vig)"/>`;
  s += `<rect width="640" height="400" filter="url(#mp-grain)" opacity=".1"/>`;
  return s;
}

/* ---------- Public ---------- */
function svg(inner, vb = '0 0 400 400', attrs = '') { return `<svg viewBox="${vb}" ${attrs}>${inner}</svg>`; }
function speciesThumb(id, gilded) {
  const box = MP.species[id] && MP.species[id].jar ? '-70 -130 140 140' : '-95 -182 190 190';
  return `<svg viewBox="${box}" aria-hidden="true"><g${gilded ? ` filter="${F.gild}"` : ''}>${cluster(id, 3)}</g></svg>`;
}
MP.art = { DEFS, G, F, surface, blobPath, dome, PIECES, r1, clamp, esc, rng, mix, stageOf, stageProg, rack, slot, cluster, sparkles, dish, drink, cover, productThumb, pieceThumb, pieceR, speciesThumb, svg, SLOT_POS, SLOT_K, MUSH_PIECES, drinkColors };

})(window.MP = window.MP || {});
