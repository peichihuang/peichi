/* Moshruum Patch: the kitchen's ingredient library, with flat-lay drawings.
   diet marks what makes a dish not vegan: meat, seafood, dairy, egg, honey.
   layer: 0 sauce under the food, 1 a base or bed, 2 the main items, 3 toppings. */
(function (MP) {
'use strict';

const { r1, rng, blobPath, PIECES } = MP.art;
const TAU = Math.PI * 2;

/* ---------- Drawing helpers (centered on 0,0) ---------- */
function ball(x, y, r, c1, c2, hi = 0.45) {
  return `<circle cx="${r1(x)}" cy="${r1(y)}" r="${r1(r)}" fill="${c2}"/><circle cx="${r1(x - r * 0.12)}" cy="${r1(y - r * 0.12)}" r="${r1(r * 0.84)}" fill="${c1}"/>` +
    (hi ? `<ellipse cx="${r1(x - r * 0.34)}" cy="${r1(y - r * 0.38)}" rx="${r1(r * 0.28)}" ry="${r1(r * 0.17)}" fill="#fff" opacity="${hi}"/>` : '');
}
function scatter(n, rad, seed, fn) {
  const R = rng(seed);
  let s = '';
  for (let i = 0; i < n; i++) { const a = R() * TAU, d = Math.sqrt(R()) * rad; s += fn(Math.cos(a) * d, Math.sin(a) * d, R, i); }
  return s;
}
function spots(list, fn) { return list.map(([x, y, k], i) => fn(x, y, k || 1, i)).join(''); }
function coin(x, y, r, rim, flesh, extra = '') {
  return `<g transform="translate(${r1(x)} ${r1(y)})"><circle r="${r1(r)}" fill="${rim}"/><circle r="${r1(r * 0.84)}" fill="${flesh}"/>${extra}</g>`;
}
function leaf(len, w, c1, c2, vein = true) {
  const h = len / 2;
  return `<path d="M0 ${r1(h)} C${r1(w)} ${r1(h * 0.5)} ${r1(w)} ${r1(-h * 0.5)} 0 ${r1(-h)} C${r1(-w)} ${r1(-h * 0.5)} ${r1(-w)} ${r1(h * 0.5)} 0 ${r1(h)}Z" fill="${c1}"/>` +
    `<path d="M0 ${r1(h)} C${r1(-w * 0.9)} ${r1(h * 0.4)} ${r1(-w * 0.9)} ${r1(-h * 0.5)} 0 ${r1(-h)}Z" fill="${c2}" opacity=".45"/>` +
    (vein ? `<path d="M0 ${r1(h + 4)} V${r1(-h * 0.85)}" stroke="#fff" stroke-opacity=".35" stroke-width="1.1"/>` : '');
}
function leaves(list, len, w, c1, c2) {
  return list.map(([x, y, rot, k]) => `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${k || 1})">${leaf(len, w, c1, c2)}</g>`).join('');
}
function strip(x, y, len, w, rot, c1, c2) {
  return `<g transform="translate(${x} ${y}) rotate(${rot})"><rect x="${r1(-len / 2)}" y="${r1(-w / 2)}" width="${r1(len)}" height="${r1(w)}" rx="${r1(w / 2)}" fill="${c1}"/><rect x="${r1(-len / 2 + 3)}" y="${r1(-w / 2 + 1)}" width="${r1(len - 6)}" height="${r1(w * 0.3)}" rx="${r1(w * 0.15)}" fill="${c2}" opacity=".6"/></g>`;
}
function cubes(list, size, top, edge) {
  return list.map(([x, y, rot]) => `<g transform="translate(${x} ${y}) rotate(${rot})"><rect x="${-size / 2}" y="${-size / 2}" width="${size}" height="${size}" rx="${r1(size * 0.18)}" fill="${edge}"/><rect x="${r1(-size / 2 + 2)}" y="${r1(-size / 2 + 2)}" width="${size - 4}" height="${size - 4}" rx="${r1(size * 0.14)}" fill="${top}"/><rect x="${r1(-size * 0.3)}" y="${r1(-size * 0.3)}" width="${r1(size * 0.35)}" height="${r1(size * 0.16)}" rx="2" fill="#fff" opacity=".35"/></g>`).join('');
}
function pile(r, seed, base, n, grain) {
  return `<path d="${blobPath(rng(seed), r, 12, 0.12)}" fill="${base}"/>` + scatter(n, r * 0.92, seed + 1, grain);
}
function nest(r, seed, c1, c2, w, n = 24) {
  let s = `<circle r="${r1(r * 0.92)}" fill="${c2}"/>`;
  s += scatter(n, r * 0.62, seed, (x, y, R, i) => `<path d="M${r1(x - 16)} ${r1(y)} q8 -11 16 0 t16 0" stroke="${i % 2 ? c1 : c2}" stroke-width="${w}" fill="none" stroke-linecap="round" transform="rotate(${Math.round(R() * 180)} ${r1(x)} ${r1(y)})"/>`);
  return s + `<circle r="${r1(r * 0.92)}" fill="none" stroke="${c1}" stroke-width="${w}" opacity=".6"/>`;
}
function pool(r, seed, c1, c2, wob = 0.2) {
  return `<path d="${blobPath(rng(seed), r, 12, wob)}" fill="${c1}"/><path d="${blobPath(rng(seed + 1), r * 0.62, 10, wob)}" fill="${c2}" opacity=".55"/><ellipse cx="${r1(-r * 0.3)}" cy="${r1(-r * 0.35)}" rx="${r1(r * 0.2)}" ry="${r1(r * 0.08)}" fill="#fff" opacity=".35"/>`;
}
function drizzle(seed, c, w, len = 110) {
  const R = rng(seed);
  let d = `M${-len / 2} 0`;
  for (let x = -len / 2 + 18; x <= len / 2; x += 18) d += ` Q${r1(x - 9)} ${r1((R() - 0.5) * 34)} ${r1(x)} ${r1((R() - 0.5) * 10)}`;
  return `<path d="${d}" stroke="${c}" stroke-width="${w}" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="${d}" stroke="#fff" stroke-width="${r1(w * 0.25)}" fill="none" stroke-linecap="round" opacity=".35" transform="translate(-1 -1)"/>`;
}
function dots(n, rad, seed, c, rmin, rmax, hi = true) {
  return scatter(n, rad, seed, (x, y, R) => { const r = rmin + R() * (rmax - rmin); return `<circle cx="${r1(x)}" cy="${r1(y)}" r="${r1(r)}" fill="${c}"/>` + (hi ? `<circle cx="${r1(x - r * 0.3)}" cy="${r1(y - r * 0.3)}" r="${r1(r * 0.3)}" fill="#fff" opacity=".45"/>` : ''); });
}
function flakes(n, rad, seed, cols, size) {
  return scatter(n, rad, seed, (x, y, R, i) => `<rect x="${r1(x)}" y="${r1(y)}" width="${r1(size * (0.5 + R()))}" height="${r1(size * (0.3 + R() * 0.6))}" transform="rotate(${Math.round(R() * 180)} ${r1(x)} ${r1(y)})" fill="${cols[i % cols.length]}"/>`);
}
function wedge(rad, ang, rind, flesh, seg) {
  const a = ang * Math.PI / 180, x = Math.sin(a / 2) * rad, y = Math.cos(a / 2) * rad;
  let s = `<path d="M0 ${r1(-rad * 0.35)} L${r1(-x)} ${r1(y - rad * 0.35)} A${rad} ${rad} 0 0 0 ${r1(x)} ${r1(y - rad * 0.35)}Z" fill="${rind}"/>`;
  const ri = rad * 0.86, xi = Math.sin(a / 2) * ri, yi = Math.cos(a / 2) * ri;
  s += `<path d="M0 ${r1(-rad * 0.3)} L${r1(-xi)} ${r1(yi - rad * 0.35)} A${ri} ${ri} 0 0 0 ${r1(xi)} ${r1(yi - rad * 0.35)}Z" fill="${flesh}"/>`;
  if (seg) for (let k = -1; k <= 1; k++) s += `<path d="M0 ${r1(-rad * 0.28)} L${r1(Math.sin(k * a / 4) * ri * 0.9)} ${r1(Math.cos(k * a / 4) * ri * 0.9 - rad * 0.35)}" stroke="${seg}" stroke-width="1.2"/>`;
  return s;
}
function citrus(r, rind, pith, flesh, seg) {
  let s = `<circle r="${r}" fill="${rind}"/><circle r="${r1(r * 0.9)}" fill="${pith}"/><circle r="${r1(r * 0.8)}" fill="${flesh}"/>`;
  for (let k = 0; k < 9; k++) { const a = k / 9 * TAU; s += `<path d="M0 0 L${r1(Math.cos(a) * r * 0.8)} ${r1(Math.sin(a) * r * 0.8)}" stroke="${seg}" stroke-width="1.3"/>`; }
  return s + `<circle r="${r1(r * 0.12)}" fill="${seg}"/>`;
}
function fillet(w, h, c1, c2, extra = '') {
  return `<path d="M${r1(-w / 2)} 0 C${r1(-w / 2)} ${r1(-h * 0.7)} ${r1(w * 0.3)} ${r1(-h * 0.6)} ${r1(w / 2)} ${r1(-h * 0.2)} C${r1(w * 0.56)} ${r1(h * 0.3)} ${r1(w * 0.2)} ${r1(h * 0.6)} ${r1(-w * 0.2)} ${r1(h * 0.5)} C${r1(-w * 0.45)} ${r1(h * 0.45)} ${r1(-w / 2)} ${r1(h * 0.3)} ${r1(-w / 2)} 0Z" fill="${c2}"/>` +
    `<path d="M${r1(-w / 2 + 4)} 0 C${r1(-w / 2 + 4)} ${r1(-h * 0.6)} ${r1(w * 0.28)} ${r1(-h * 0.5)} ${r1(w / 2 - 4)} ${r1(-h * 0.16)} C${r1(w * 0.5)} ${r1(h * 0.24)} ${r1(w * 0.18)} ${r1(h * 0.48)} ${r1(-w * 0.2)} ${r1(h * 0.4)} C${r1(-w * 0.42)} ${r1(h * 0.36)} ${r1(-w / 2 + 4)} ${r1(h * 0.24)} ${r1(-w / 2 + 4)} 0Z" fill="${c1}"/>` + extra;
}
function slices(n, w, h, gap, crust, inner, rot = -8) {
  let s = '';
  for (let i = 0; i < n; i++) {
    const x = (i - (n - 1) / 2) * gap;
    s += `<g transform="translate(${r1(x)} ${r1(i * 2)}) rotate(${rot})"><rect x="${r1(-w / 2)}" y="${r1(-h / 2)}" width="${w}" height="${h}" rx="${r1(w * 0.45)}" fill="${crust}"/><rect x="${r1(-w / 2 + 3)}" y="${r1(-h / 2 + 3)}" width="${w - 6}" height="${h - 6}" rx="${r1(w * 0.4)}" fill="${inner}"/></g>`;
  }
  return s;
}
function sprig(len, col, leafFn, n = 12, seed = 1) {
  let s = `<path d="M${r1(-len / 2)} ${r1(len * 0.3)} Q0 ${r1(len * 0.1)} ${r1(len / 2)} ${r1(-len * 0.35)}" stroke="${col}" stroke-width="1.6" fill="none"/>`;
  for (let i = 0; i < n; i++) { const t = i / (n - 1), x = -len / 2 + t * len, y = len * 0.3 - t * len * 0.65; s += leafFn(x, y, i); }
  return s;
}
function blob(r, seed, c1, c2, wob = 0.18) { return `<path d="${blobPath(rng(seed), r, 11, wob)}" fill="${c1}"/><path d="${blobPath(rng(seed + 3), r * 0.7, 9, wob)}" fill="${c2}" opacity=".5"/>`; }

/* ---------- The library ---------- */
const L = {};
function add(cat, id, name, line, r, draw, more = {}) { L[id] = Object.assign({ cat, name, line, r, draw, diet: [] }, more); }

/* Vegetables */
add('veg', 'tomato', 'Cherry tomato', 'halved', 26, null);
add('veg', 'tomatoslice', 'Tomato', 'thick slices', 34, () => spots([[-12, -6], [12, 8]], (x, y) => coin(x, y, 20, '#C8321F', '#E5553D', `<circle r="10" fill="#F08A68"/>${[0, 1, 2, 3, 4].map(k => `<ellipse cx="${r1(Math.cos(k * 1.26) * 10)}" cy="${r1(Math.sin(k * 1.26) * 10)}" rx="3" ry="2" fill="#F7D88E"/>`).join('')}`)));
add('veg', 'cucumber', 'Cucumber', 'thin slices', 30, () => spots([[-14, -8], [10, -12], [0, 10], [18, 10]], (x, y) => coin(x, y, 12, '#3E6B2E', '#E3EFCB', '<circle r="6" fill="#C9DCA4"/><circle r="2" fill="#B6CC8A"/>')));
add('veg', 'carrot', 'Carrot', 'coins', 28, () => spots([[-12, -8], [10, -10], [-4, 10], [16, 10]], (x, y) => coin(x, y, 10, '#D9661A', '#F39A3A', '<circle r="4.5" fill="#F7B865"/>')));
add('veg', 'zucchini', 'Zucchini', 'seared rounds', 30, () => spots([[-12, -6], [12, -8], [0, 12]], (x, y) => coin(x, y, 13, '#3F6B2A', '#EFEAC8', '<circle r="7" fill="#E2D9A8" opacity=".7"/><path d="M-8 -3 h16 M-8 3 h16" stroke="#C48B45" stroke-width="2" opacity=".6"/>')));
add('veg', 'radish', 'Radish', 'shaved', 26, () => spots([[-10, -6], [10, -8], [0, 10]], (x, y) => coin(x, y, 11, '#D2436A', '#FBF3F4', '<circle r="5" fill="#F7E5EA"/>')));
add('veg', 'redonion', 'Red onion', 'pickled rings', 30, () => spots([[-10, -4], [12, 6]], (x, y) => `<g transform="translate(${x} ${y})"><ellipse rx="17" ry="13" fill="none" stroke="#9C3E6C" stroke-width="3"/><ellipse rx="11" ry="8" fill="none" stroke="#E7B9CF" stroke-width="2.4"/></g>`));
add('veg', 'shallot', 'Shallot', 'sliced rings', 26, null);
add('veg', 'garlic', 'Garlic', 'cloves', 22, null);
add('veg', 'ginger', 'Ginger', 'thin slices', 24, () => spots([[-8, -4], [10, 6]], (x, y) => `<g transform="translate(${x} ${y})"><path d="${blobPath(rng(x + 40), 11, 8, 0.25)}" fill="#C9A86A"/><path d="${blobPath(rng(x + 41), 9, 8, 0.2)}" fill="#F0DDA2"/><path d="M-5 -2 l10 2 M-4 3 l8 1" stroke="#DCC07E" stroke-width=".8"/></g>`));
add('veg', 'broccoli', 'Broccoli', 'florets', 34, () => spots([[-12, 0, 1], [14, 4, 0.85]], (x, y, k) => `<g transform="translate(${x} ${y}) scale(${k})"><path d="M-5 20 L-4 4 L4 4 L5 20Z" fill="#A9C27E"/>${[[-10, -2, 8], [0, -8, 9], [10, -2, 8], [-5, -14, 7], [6, -15, 7], [0, 0, 7]].map(([a, b, r]) => ball(a, b, r, '#4F7A2E', '#3A5F21', 0.15)).join('')}</g>`));
add('veg', 'asparagus', 'Asparagus', 'spears', 44, () => [-10, 0, 10].map((x, i) => `<g transform="translate(${x} 0) rotate(${(i - 1) * 6})"><rect x="-3.5" y="-38" width="7" height="76" rx="3.5" fill="#7FA04A"/><path d="M-3.5 -38 Q0 -46 3.5 -38Z" fill="#5E7E34"/>${[-28, -14, 0, 14].map(y => `<path d="M-3 ${y} l3 -3 3 3" fill="none" stroke="#5E7E34" stroke-width="1.2"/>`).join('')}</g>`).join(''));
add('veg', 'greenbeans', 'Green beans', 'blanched', 38, () => [[-12, -20], [-4, 30], [6, -8], [14, 22], [0, 4]].map(([x, r]) => strip(x, 0, 64, 6, r + 70, '#5E9A3A', '#9CC772')).join(''));
add('veg', 'peas', 'Peas', 'sweet', 26, () => dots(14, 20, 4, '#7DB04A', 3.5, 4.5));
add('veg', 'corn', 'Corn', 'charred kernels', 26, () => scatter(20, 20, 5, (x, y, R, i) => `<rect x="${r1(x)}" y="${r1(y)}" width="5" height="6" rx="2" fill="${i % 5 ? '#F2C94C' : '#C98A2E'}"/>`));
add('veg', 'pepper', 'Bell pepper', 'strips', 34, () => [['#D23A2A', -12, -20], ['#F2B531', 0, 10], ['#D23A2A', 12, 30], ['#5E9A3A', 4, -40]].map(([c, x, r]) => `<g transform="translate(${x} 0) rotate(${r})"><path d="M-24 0 Q0 -10 24 0" stroke="${c}" stroke-width="7" fill="none" stroke-linecap="round"/></g>`).join(''));
add('veg', 'spinach', 'Spinach', 'baby leaves', 34, () => leaves([[-10, -6, -30], [12, -4, 30], [0, 12, 180, 0.9]], 40, 15, '#3F6E2E', '#6E9A50'));
add('veg', 'kale', 'Kale', 'crispy', 40, () => [[-8, -4, -20], [10, 6, 30]].map(([x, y, r]) => `<g transform="translate(${x} ${y}) rotate(${r})"><path d="${blobPath(rng(x + 9), 24, 16, 0.35)}" fill="#2F5A2E"/><path d="${blobPath(rng(x + 8), 18, 14, 0.3)}" fill="#46753C"/><path d="M0 20 V-18" stroke="#9DBC86" stroke-width="2"/></g>`).join(''));
add('veg', 'lettuce', 'Lettuce', 'butter lettuce leaf', 50, () => `<path d="${blobPath(rng(61), 46, 18, 0.22)}" fill="#8FBF5A"/><path d="${blobPath(rng(62), 34, 14, 0.2)}" fill="#B9D982"/><path d="M0 40 V-30 M0 0 L-22 -18 M0 14 L22 -8 M0 -14 L18 -30" stroke="#E5F0C8" stroke-width="2" fill="none"/>`);
add('veg', 'cabbage', 'Red cabbage', 'shredded', 34, () => scatter(22, 22, 63, (x, y, R, i) => `<path d="M${r1(x - 10)} ${r1(y)} q10 -6 20 0" stroke="${i % 2 ? '#7B3B78' : '#C79BC6'}" stroke-width="2.4" fill="none" stroke-linecap="round" transform="rotate(${Math.round(R() * 180)} ${r1(x)} ${r1(y)})"/>`));
add('veg', 'avocado', 'Avocado', 'halved', 38, () => `<path d="M0 -36 C22 -34 32 4 26 20 C20 36 -20 36 -26 20 C-32 4 -22 -34 0 -36Z" fill="#3F5A26"/><path d="M0 -31 C18 -29 27 4 22 18 C17 31 -17 31 -22 18 C-27 4 -18 -29 0 -31Z" fill="#D7DE8A"/><path d="M0 -24 C12 -22 18 4 15 14 C11 24 -11 24 -15 14 C-18 4 -12 -22 0 -24Z" fill="#EEEAA4"/>${ball(0, 10, 11, '#8A5634', '#6E4024', 0.35)}`);
add('veg', 'potato', 'Potato', 'roasted wedges', 34, () => [[-12, -4, -30], [8, 8, 20], [14, -12, 70]].map(([x, y, r]) => `<g transform="translate(${x} ${y}) rotate(${r})"><path d="M-18 4 Q0 -14 18 4Z" fill="#B07A3A"/><path d="M-15 3 Q0 -10 15 3Z" fill="#EBC06A"/></g>`).join(''));
add('veg', 'sweetpotato', 'Sweet potato', 'roasted cubes', 30, () => cubes([[-10, -8, 10], [10, -6, -14], [0, 10, 24], [18, 12, 4]], 15, '#F09A48', '#B8642A'));
add('veg', 'pumpkin', 'Squash', 'roasted cubes', 30, () => cubes([[-10, -8, -6], [10, -6, 18], [0, 10, 34]], 16, '#F2B04A', '#C7792A'));
add('veg', 'eggplant', 'Eggplant', 'grilled rounds', 32, () => spots([[-10, -6], [12, 8]], (x, y) => coin(x, y, 17, '#4A2340', '#E8D7A6', '<path d="M-10 -4 h20 M-10 4 h20" stroke="#8C5A3A" stroke-width="2.4" opacity=".55"/>')));
add('veg', 'edamame', 'Edamame', 'in the pod', 34, () => [[-8, -8, -20], [8, 8, 30], [0, 0, 80]].map(([x, y, r]) => `<g transform="translate(${x} ${y}) rotate(${r})"><path d="M-22 0 C-22 -8 -14 -6 -8 -8 C-2 -10 2 -6 8 -8 C14 -10 22 -8 22 0 C22 8 14 6 8 8 C2 10 -2 6 -8 8 C-14 10 -22 8 -22 0Z" fill="#7FB04E"/><circle cx="-12" cy="0" r="3" fill="#A6CF73"/><circle cx="0" cy="0" r="3" fill="#A6CF73"/><circle cx="12" cy="0" r="3" fill="#A6CF73"/></g>`).join(''));
add('veg', 'sprouts', 'Bean sprouts', 'crunchy', 30, () => scatter(12, 14, 71, (x, y, R) => `<g transform="translate(${r1(x)} ${r1(y)}) rotate(${Math.round(R() * 180)})"><path d="M-14 0 Q0 -3 14 0" stroke="#F4F1E2" stroke-width="2.4" fill="none"/><ellipse cx="14" cy="0" rx="3" ry="2.2" fill="#E6D97A"/></g>`));
add('veg', 'chili', 'Chili', 'sliced', 26, null);
add('veg', 'bokchoy', 'Bok choy', 'halved', 50, null);

/* Protein */
add('protein', 'egg', 'Soft egg', 'jammy, halved', 30, null, { diet: ['egg'] });
add('protein', 'friedegg', 'Fried egg', 'crispy edges', 40, () => `<path d="${blobPath(rng(81), 36, 12, 0.22)}" fill="#E9C99A"/><path d="${blobPath(rng(82), 32, 12, 0.2)}" fill="#FCFBF6"/>${ball(4, -2, 13, '#F5A623', '#E0861A', 0.5)}`, { diet: ['egg'] });
add('protein', 'tofu', 'Tofu', 'seared cubes', 34, null);
add('protein', 'tempeh', 'Tempeh', 'seared slices', 34, () => [[-12, -6, -8], [12, 6, 10]].map(([x, y, r]) => `<g transform="translate(${x} ${y}) rotate(${r})"><rect x="-16" y="-11" width="32" height="22" rx="3" fill="#A97B44"/><rect x="-14" y="-9" width="28" height="18" rx="2" fill="#D9B77E"/>${scatter(10, 8, x + 90, (a, b) => `<ellipse cx="${r1(a)}" cy="${r1(b)}" rx="2.4" ry="1.6" fill="#EBD4A2"/>`)}</g>`).join(''));
add('protein', 'chickpeas', 'Chickpeas', 'roasted', 28, () => dots(13, 20, 91, '#E2C48A', 4.4, 5.4));
add('protein', 'blackbeans', 'Black beans', 'cooked', 28, () => scatter(14, 20, 92, (x, y, R) => `<ellipse cx="${r1(x)}" cy="${r1(y)}" rx="5" ry="3.4" transform="rotate(${Math.round(R() * 180)} ${r1(x)} ${r1(y)})" fill="#2A2426"/><ellipse cx="${r1(x - 1.5)}" cy="${r1(y - 1)}" rx="1.6" ry="1" fill="#fff" opacity=".35"/>`));
add('protein', 'lentils', 'Lentils', 'braised', 40, () => pile(36, 93, '#8A5A30', 70, (x, y, R, i) => `<ellipse cx="${r1(x)}" cy="${r1(y)}" rx="3" ry="2.4" fill="${i % 3 ? '#B07A40' : '#9C6532'}"/>`));
add('protein', 'chicken', 'Chicken', 'grilled, sliced', 40, () => [0, 1, 2].map(i => `<g transform="translate(${(i - 1) * 16} ${i * 3}) rotate(${-14 + i * 6})"><ellipse rx="15" ry="30" fill="#B9763A"/><ellipse rx="12.5" ry="27" fill="#EBC48E"/><path d="M-10 -14 l20 -6 M-11 0 l22 -6 M-10 14 l20 -6" stroke="#7A4A24" stroke-width="2.4" stroke-linecap="round" opacity=".7"/></g>`).join(''), { diet: ['meat'] });
add('protein', 'steak', 'Steak', 'sliced medium-rare', 42, () => [0, 1, 2, 3].map(i => `<g transform="translate(${(i - 1.5) * 15} ${i * 2}) rotate(-10)"><rect x="-10" y="-28" width="20" height="56" rx="5" fill="#5A2E1E"/><rect x="-7" y="-24" width="14" height="48" rx="4" fill="#A9413E"/><rect x="-4" y="-18" width="8" height="36" rx="3" fill="#D46A66"/></g>`).join(''), { diet: ['meat'] });
add('protein', 'bacon', 'Bacon', 'crispy strips', 40, () => [-10, 10].map(y => `<g transform="translate(0 ${y})"><path d="M-36 0 q9 -8 18 0 t18 0 t18 0 t18 0" stroke="#A9402F" stroke-width="12" fill="none" stroke-linecap="round"/><path d="M-36 -2 q9 -8 18 0 t18 0 t18 0 t18 0" stroke="#F1CDB4" stroke-width="3" fill="none" stroke-linecap="round"/></g>`).join(''), { diet: ['meat'] });
add('protein', 'prosciutto', 'Prosciutto', 'thin ribbons', 36, () => [[-8, -6, -20], [10, 8, 30]].map(([x, y, r]) => `<g transform="translate(${x} ${y}) rotate(${r})"><path d="M-24 -6 C-12 -16 0 4 12 -8 C18 -12 24 -6 24 0 C14 12 2 -4 -12 8 C-18 12 -24 6 -24 -6Z" fill="#D9897F"/><path d="M-24 -6 C-12 -16 0 4 12 -8 C18 -12 24 -6 24 -4" stroke="#F6E2DA" stroke-width="2.4" fill="none"/></g>`).join(''), { diet: ['meat'] });
add('protein', 'sausage', 'Sausage', 'seared coins', 28, () => spots([[-10, -6], [10, -8], [0, 10], [16, 10]], (x, y) => coin(x, y, 10, '#7A3424', '#B5644A', scatter(5, 5, x + 7, (a, b) => `<circle cx="${r1(a)}" cy="${r1(b)}" r="1.2" fill="#F2D2B8"/>`))), { diet: ['meat'] });
add('protein', 'salmon', 'Salmon', 'crispy-skin fillet', 46, () => fillet(84, 46, '#F28B5B', '#B5532E', [-24, -10, 4, 18].map(x => `<path d="M${x} -16 q6 14 0 30" stroke="#FBD3BC" stroke-width="2.2" fill="none" opacity=".8"/>`).join('')), { diet: ['seafood'] });
add('protein', 'whitefish', 'White fish', 'pan-roasted cod', 44, () => fillet(80, 44, '#F6F0E4', '#D9A660', [-22, -8, 6, 20].map(x => `<path d="M${x} -14 q5 12 0 26" stroke="#E6DCCB" stroke-width="1.6" fill="none"/>`).join('')), { diet: ['seafood'] });
add('protein', 'tuna', 'Tuna', 'seared, sliced', 40, () => [0, 1, 2].map(i => `<g transform="translate(${(i - 1) * 18} ${i * 2}) rotate(-8)"><rect x="-12" y="-26" width="24" height="52" rx="3" fill="#4A3A30"/><rect x="-9" y="-23" width="18" height="46" rx="2" fill="#C2384A"/>${scatter(6, 8, i + 77, (a, b) => `<ellipse cx="${r1(a)}" cy="${r1(b - 20)}" rx="1.4" ry=".8" fill="#F4E7C8"/>`)}</g>`).join(''), { diet: ['seafood'] });
add('protein', 'shrimp', 'Shrimp', 'grilled', 32, () => [[-10, -6, 0], [12, 8, 140]].map(([x, y, r]) => `<g transform="translate(${x} ${y}) rotate(${r})"><path d="M-14 6 C-18 -10 0 -18 12 -10" stroke="#F08A5E" stroke-width="11" fill="none" stroke-linecap="round"/>${[-12, -6, 0, 6].map((a, k) => `<path d="M${a} ${-8 - k} l2 7" stroke="#FBC3A2" stroke-width="1.6"/>`).join('')}<path d="M10 -12 l8 -6 l2 8Z" fill="#D9542E"/></g>`).join(''), { diet: ['seafood'] });
add('protein', 'scallop', 'Scallops', 'seared', 30, () => spots([[-12, -6], [10, -8], [0, 12]], (x, y) => `<g transform="translate(${x} ${y})"><circle r="11" fill="#B9773A"/><circle r="8.5" fill="#E9B36A"/><circle r="5" fill="#F6E1BC" opacity=".8"/></g>`), { diet: ['seafood'] });
add('protein', 'mussels', 'Mussels', 'steamed', 34, () => [[-12, -6, -30], [10, 8, 40], [12, -14, 100]].map(([x, y, r]) => `<g transform="translate(${x} ${y}) rotate(${r})"><path d="M0 -16 C12 -14 14 10 0 16 C-12 10 -10 -14 0 -16Z" fill="#26252A"/><path d="M0 -12 C8 -10 9 8 0 12 C-7 8 -7 -10 0 -12Z" fill="#F2A15E"/><path d="M-4 -12 C-8 -4 -7 8 -2 13" stroke="#5A6A8A" stroke-width="1.4" fill="none" opacity=".7"/></g>`).join(''), { diet: ['seafood'] });

/* Grains and bread */
add('grain', 'toast', 'Sourdough', 'thick-cut, toasted', 62, null, { layer: 1 });
add('grain', 'baguette', 'Baguette', 'sliced', 40, () => [[-16, -6, -10], [6, 4, 8], [24, -8, -4]].map(([x, y, r]) => `<g transform="translate(${x} ${y}) rotate(${r})"><ellipse rx="13" ry="22" fill="#B87536"/><ellipse rx="10" ry="19" fill="#F1DCA8"/>${scatter(6, 8, x + 60, (a, b) => `<ellipse cx="${r1(a)}" cy="${r1(b * 1.6)}" rx="1.6" ry="1" fill="#D9BC80"/>`)}</g>`).join(''), { layer: 1 });
add('grain', 'tortilla', 'Tortilla', 'warm, flour', 54, () => `<circle r="50" fill="#EBD39A"/>${scatter(16, 44, 101, (x, y, R) => `<ellipse cx="${r1(x)}" cy="${r1(y)}" rx="${r1(2 + R() * 4)}" ry="${r1(1.6 + R() * 2)}" fill="#B98A4A" opacity=".55"/>`)}`, { layer: 1 });
add('grain', 'rice', 'Rice', 'short-grain', 58, null, { layer: 1 });
add('grain', 'brownrice', 'Brown rice', 'steamed', 56, () => pile(52, 102, '#C9A57A', 90, (x, y, R) => `<ellipse cx="${r1(x)}" cy="${r1(y)}" rx="4" ry="1.8" transform="rotate(${Math.round(R() * 180)} ${r1(x)} ${r1(y)})" fill="#DCBE92" stroke="#B48E62" stroke-width=".5"/>`), { layer: 1 });
add('grain', 'quinoa', 'Quinoa', 'fluffy', 52, () => pile(48, 103, '#E5D6AE', 110, (x, y) => `<circle cx="${r1(x)}" cy="${r1(y)}" r="1.8" fill="#F4EAD0" stroke="#CDB98A" stroke-width=".5"/>`), { layer: 1 });
add('grain', 'couscous', 'Couscous', 'herbed', 50, () => pile(46, 104, '#EBCB82', 90, (x, y, R, i) => `<circle cx="${r1(x)}" cy="${r1(y)}" r="1.4" fill="${i % 9 ? '#F5DFA4' : '#6E9A44'}"/>`), { layer: 1 });
add('grain', 'noodles', 'Egg noodles', 'fresh', 58, null, { layer: 1, diet: ['egg'] });
add('grain', 'spaghetti', 'Spaghetti', 'twirled', 50, () => nest(46, 105, '#E9C774', '#F3DC98', 2.4, 34), { layer: 1 });
add('grain', 'udon', 'Udon', 'thick and chewy', 52, () => nest(48, 106, '#EFE6CF', '#F8F3E6', 6, 18), { layer: 1 });
add('grain', 'soba', 'Soba', 'buckwheat', 50, () => nest(46, 107, '#8D7258', '#A88C70', 2.6, 30), { layer: 1 });
add('grain', 'ricenoodles', 'Rice noodles', 'thin', 50, () => nest(46, 108, '#ECE8DE', '#F8F6F0', 2, 34), { layer: 1 });
add('grain', 'penne', 'Penne', 'al dente', 40, () => scatter(9, 24, 109, (x, y, R) => `<g transform="translate(${r1(x)} ${r1(y)}) rotate(${Math.round(R() * 180)})"><path d="M-10 -4 L12 -4 L8 4 L-14 4Z" fill="#EDC777"/><path d="M-6 -4 l-4 8 M0 -4 l-4 8 M6 -4 l-4 8" stroke="#D9AE57" stroke-width="1"/><ellipse cx="10" cy="0" rx="2" ry="4" fill="#C9973F"/></g>`), { layer: 1 });
add('grain', 'gnocchi', 'Gnocchi', 'pan-fried', 34, () => scatter(8, 20, 110, (x, y, R) => `<g transform="translate(${r1(x)} ${r1(y)}) rotate(${Math.round(R() * 180)})"><ellipse rx="9" ry="6.5" fill="#E2B866"/><ellipse rx="7.5" ry="5" fill="#F3DFA6"/><path d="M-5 -3 v6 M-1 -4 v8 M3 -4 v8" stroke="#E0C07A" stroke-width="1"/></g>`));
add('grain', 'polenta', 'Polenta', 'soft and creamy', 54, () => pool(50, 111, '#F2CC5E', '#F8DF8E', 0.12), { layer: 0, diet: ['dairy'] });
add('grain', 'oats', 'Porridge', 'oats, slow-cooked', 52, () => pool(48, 112, '#E8DCC4', '#F3EBDA', 0.12) + scatter(16, 36, 113, (x, y, R) => `<ellipse cx="${r1(x)}" cy="${r1(y)}" rx="3.4" ry="2.2" transform="rotate(${Math.round(R() * 180)} ${r1(x)} ${r1(y)})" fill="#D8C39C"/>`), { layer: 0 });

/* Dairy and cheese */
add('dairy', 'butter', 'Butter', 'cultured', 20, null, { diet: ['dairy'] });
add('dairy', 'parmesan', 'Parmesan', 'shaved', 30, null, { diet: ['dairy'], layer: 3 });
add('dairy', 'burrata', 'Burrata', 'torn open', 32, () => `${ball(0, 0, 28, '#FBFAF4', '#E9E5D8', 0.5)}<path d="${blobPath(rng(121), 14, 9, 0.35)}" transform="translate(6 4)" fill="#F7F1DE"/>`, { diet: ['dairy'] });
add('dairy', 'feta', 'Feta', 'crumbled', 30, () => scatter(9, 22, 122, (x, y, R) => `<path d="${blobPath(R, 5 + R() * 3, 6, 0.4)}" transform="translate(${r1(x)} ${r1(y)})" fill="#FAF8F0" stroke="#E2DED0" stroke-width=".6"/>`), { diet: ['dairy'], layer: 3 });
add('dairy', 'goatcheese', 'Goat cheese', 'soft rounds', 28, () => spots([[-10, -4], [10, 6]], (x, y) => coin(x, y, 12, '#E9E3D3', '#FBF9F3', '<circle r="3" fill="#fff" opacity=".7"/>')), { diet: ['dairy'] });
add('dairy', 'cheddar', 'Cheddar', 'grated', 30, () => scatter(18, 20, 123, (x, y, R) => `<rect x="${r1(x)}" y="${r1(y)}" width="10" height="2.6" rx="1.3" transform="rotate(${Math.round(R() * 180)} ${r1(x)} ${r1(y)})" fill="#F2A93B"/>`), { diet: ['dairy'], layer: 3 });
add('dairy', 'yogurt', 'Yogurt', 'thick, a dollop', 32, () => `<path d="${blobPath(rng(124), 28, 10, 0.2)}" fill="#FBFAF6"/><path d="M-12 0 C-8 -10 10 -10 12 -2 C8 6 -4 6 -2 0" stroke="#EAE6DA" stroke-width="2" fill="none"/>`, { diet: ['dairy'] });
add('dairy', 'ricotta', 'Ricotta', 'whipped', 30, () => `<path d="${blobPath(rng(125), 26, 12, 0.3)}" fill="#FCFBF6"/>${scatter(10, 18, 126, (x, y) => `<circle cx="${r1(x)}" cy="${r1(y)}" r="2" fill="#EFEADC"/>`)}`, { diet: ['dairy'] });

/* Fruit */
add('fruit', 'lemon', 'Lemon', 'wedge', 26, null);
add('fruit', 'lime', 'Lime', 'wedge', 26, () => wedge(26, 70, '#4E8A2E', '#B9D96A', '#E2F0B0'));
add('fruit', 'orange', 'Orange', 'wheel', 30, () => citrus(26, '#E8861F', '#FBE2B8', '#F5A33A', '#FBD08A'));
add('fruit', 'apple', 'Apple', 'thin slices', 34, () => [[-12, -20], [0, 0], [12, 20]].map(([x, r]) => `<g transform="translate(${x} 0) rotate(${r})"><path d="M-20 6 A22 22 0 0 1 20 6Z" fill="#C7362F"/><path d="M-17 6 A19 19 0 0 1 17 6Z" fill="#F7EBC8"/></g>`).join(''));
add('fruit', 'strawberry', 'Strawberries', 'halved', 30, () => spots([[-10, -4], [12, 6]], (x, y) => `<g transform="translate(${x} ${y})"><path d="M0 16 C-14 10 -14 -10 0 -12 C14 -10 14 10 0 16Z" fill="#D3322E"/><path d="M0 12 C-9 8 -9 -7 0 -8 C9 -7 9 8 0 12Z" fill="#F07A70"/><path d="M-6 -12 l6 -4 6 4 -6 2Z" fill="#4E8A2E"/></g>`));
add('fruit', 'blueberry', 'Blueberries', 'a handful', 26, () => dots(12, 18, 131, '#3B4A86', 4.4, 5.4));
add('fruit', 'raspberry', 'Raspberries', 'fresh', 26, () => spots([[-10, -6], [10, -4], [0, 10]], (x, y) => `<g transform="translate(${x} ${y})">${[[0, 0], [-3, -3], [3, -3], [-3, 3], [3, 3], [0, -5], [0, 5], [-5, 0], [5, 0]].map(([a, b]) => `<circle cx="${a}" cy="${b}" r="2.6" fill="#D33A5A"/>`).join('')}</g>`));
add('fruit', 'pomegranate', 'Pomegranate', 'seeds', 26, () => dots(16, 20, 132, '#B3203A', 2.6, 3.4));
add('fruit', 'fig', 'Figs', 'halved', 30, () => spots([[-10, -4], [12, 6]], (x, y) => `<g transform="translate(${x} ${y})"><path d="M0 -16 C12 -8 14 14 0 16 C-14 14 -12 -8 0 -16Z" fill="#5E2A4A"/><path d="M0 -12 C9 -6 10 11 0 12 C-10 11 -9 -6 0 -12Z" fill="#E78F8E"/><path d="M0 -6 C5 -2 5 8 0 8 C-5 8 -5 -2 0 -6Z" fill="#F4C9A4"/></g>`));
add('fruit', 'mango', 'Mango', 'cubed', 30, () => cubes([[-10, -8, 8], [10, -6, -12], [0, 10, 20]], 15, '#F7B23A', '#E08A1F'));
add('fruit', 'peach', 'Peach', 'grilled slices', 34, () => [[-12, -16], [0, 0], [12, 16]].map(([x, r]) => `<g transform="translate(${x} 0) rotate(${r})"><path d="M-22 4 A24 20 0 0 1 22 4Z" fill="#E0603A"/><path d="M-19 4 A21 17 0 0 1 19 4Z" fill="#F6B05E"/><path d="M-10 -4 h20" stroke="#A9592E" stroke-width="2" opacity=".5"/></g>`).join(''));
add('fruit', 'banana', 'Banana', 'coins', 26, () => spots([[-10, -6], [10, -6], [0, 10]], (x, y) => coin(x, y, 10, '#EAD48A', '#F8EDC0', '<circle r="2.4" fill="#C9A86A"/>')));

/* Herbs and greens */
add('herb', 'thyme', 'Thyme', 'fresh sprig', 34, null);
add('herb', 'rosemary', 'Rosemary', 'sprig', 36, () => sprig(64, '#6E6A4E', (x, y, i) => `<path d="M${r1(x)} ${r1(y)} l${i % 2 ? 7 : -7} ${i % 2 ? -4 : 4}" stroke="#4E6A44" stroke-width="2.2" stroke-linecap="round"/>`, 16));
add('herb', 'basil', 'Basil', 'leaves', 30, () => leaves([[-8, -6, -30], [10, -2, 40], [0, 12, 170, 0.8]], 30, 11, '#3F8A2E', '#2E6A22'));
add('herb', 'parsley', 'Parsley', 'flat-leaf', 28, () => scatter(6, 14, 141, (x, y, R) => `<g transform="translate(${r1(x)} ${r1(y)}) rotate(${Math.round(R() * 360)})">${[0, 120, 240].map(a => `<ellipse cx="0" cy="-6" rx="4" ry="6" transform="rotate(${a})" fill="#3F7A2E"/>`).join('')}</g>`));
add('herb', 'cilantro', 'Cilantro', 'leaves', 28, () => scatter(6, 14, 142, (x, y, R) => `<g transform="translate(${r1(x)} ${r1(y)}) rotate(${Math.round(R() * 360)})"><path d="M0 0 c-8 -2 -8 -12 0 -12 c8 0 8 10 0 12Z" fill="#5F9A44"/><path d="M0 0 c-4 -4 -4 -10 0 -12" stroke="#8CBF6E" stroke-width="1" fill="none"/></g>`));
add('herb', 'dill', 'Dill', 'fronds', 30, () => scatter(5, 10, 143, (x, y, R) => { let s = `<g transform="translate(${r1(x)} ${r1(y)}) rotate(${Math.round(R() * 360)})"><path d="M0 0 V-22" stroke="#7FA85A" stroke-width="1"/>`; for (let k = 0; k < 7; k++) s += `<path d="M0 ${-k * 3} l${k % 2 ? 6 : -6} -4" stroke="#7FA85A" stroke-width=".9"/>`; return s + '</g>'; }));
add('herb', 'mint', 'Mint', 'leaves', 28, () => leaves([[-8, -4, -40], [8, -6, 30], [0, 10, 180, 0.8]], 24, 10, '#6FAE5A', '#4E8A3C'));
add('herb', 'chives', 'Chives', 'snipped', 30, () => scatter(14, 20, 144, (x, y, R) => `<rect x="${r1(x)}" y="${r1(y)}" width="7" height="2.6" rx="1.3" transform="rotate(${Math.round(R() * 180)} ${r1(x)} ${r1(y)})" fill="#5E8F3A"/>`));
add('herb', 'scallion', 'Scallion', 'thinly sliced', 30, null);
add('herb', 'micro', 'Microgreens', 'a small handful', 26, null);
add('herb', 'arugula', 'Arugula', 'peppery', 34, () => [[-8, -4, -30], [10, 6, 40], [0, -12, 100]].map(([x, y, r]) => `<g transform="translate(${x} ${y}) rotate(${r})"><path d="M0 22 C-6 14 -10 12 -8 6 C-12 2 -10 -6 -6 -6 C-10 -12 -4 -20 0 -22 C4 -20 10 -12 6 -6 C10 -6 12 2 8 6 C10 12 6 14 0 22Z" fill="#4F7F33"/><path d="M0 22 V-18" stroke="#9DBC86" stroke-width="1.2"/></g>`).join(''));
add('herb', 'shiso', 'Shiso', 'leaf', 30, () => `<g transform="rotate(-20)">${leaf(52, 22, '#4C7F3A', '#2E5A24')}</g>`);

/* Spices, nuts and seeds */
add('spice', 'sesame', 'Sesame', 'toasted', 30, null);
add('spice', 'salt', 'Flaky salt', 'a pinch', 26, null);
add('spice', 'pepper', 'Black pepper', 'cracked', 24, () => flakes(22, 18, 151, ['#2A2522', '#5A4A3E'], 2.4));
add('spice', 'chiliflakes', 'Chili flakes', 'a pinch', 24, () => flakes(20, 18, 152, ['#C8321F', '#E6A04A', '#A92A18'], 2.6));
add('spice', 'paprika', 'Smoked paprika', 'dusted', 26, () => scatter(60, 20, 153, (x, y) => `<circle cx="${r1(x)}" cy="${r1(y)}" r=".9" fill="#B83A22"/>`));
add('spice', 'cinnamon', 'Cinnamon', 'stick', 34, () => `<g transform="rotate(-30)"><rect x="-32" y="-6" width="64" height="12" rx="4" fill="#8A4A22"/><rect x="-30" y="-4" width="60" height="4" rx="2" fill="#B06A38"/><circle cx="32" cy="0" r="6" fill="#6E3618"/><path d="M32 0 m-3 0 a3 3 0 1 0 3 -3" stroke="#B06A38" stroke-width="1.2" fill="none"/></g>`);
add('spice', 'staranise', 'Star anise', 'whole', 22, () => { let s = ''; for (let k = 0; k < 8; k++) s += `<path d="M0 0 L-4 -14 Q0 -20 4 -14Z" transform="rotate(${k * 45})" fill="#7A3E22"/>`; return s + '<circle r="3" fill="#5A2A14"/>'; });
add('spice', 'almond', 'Almonds', 'toasted', 26, () => scatter(7, 16, 154, (x, y, R) => `<g transform="translate(${r1(x)} ${r1(y)}) rotate(${Math.round(R() * 360)})"><path d="M0 -8 C6 -4 6 6 0 8 C-6 6 -6 -4 0 -8Z" fill="#B97A45"/><path d="M0 -6 V6" stroke="#D9A06A" stroke-width=".8"/></g>`));
add('spice', 'walnut', 'Walnuts', 'halves', 26, () => spots([[-8, -4], [10, 6]], (x, y) => `<g transform="translate(${x} ${y})"><path d="${blobPath(rng(x + 155), 10, 10, 0.3)}" fill="#B98A55"/><path d="M0 -8 V8 M-6 -3 q3 3 0 6 M6 -3 q-3 3 0 6" stroke="#8C6234" stroke-width="1.2" fill="none"/></g>`));
add('spice', 'peanut', 'Peanuts', 'roasted', 24, () => scatter(9, 16, 156, (x, y, R) => `<ellipse cx="${r1(x)}" cy="${r1(y)}" rx="4.4" ry="3" transform="rotate(${Math.round(R() * 180)} ${r1(x)} ${r1(y)})" fill="#D9A86A"/>`));
add('spice', 'pinenuts', 'Pine nuts', 'toasted', 24, () => scatter(12, 16, 157, (x, y, R) => `<ellipse cx="${r1(x)}" cy="${r1(y)}" rx="3.4" ry="1.8" transform="rotate(${Math.round(R() * 180)} ${r1(x)} ${r1(y)})" fill="#EED7A0"/>`));
add('spice', 'cashew', 'Cashews', 'toasted', 26, () => scatter(6, 14, 158, (x, y, R) => `<path d="M${r1(x - 6)} ${r1(y)} q6 -10 12 0 q-3 -4 -6 2 q-3 -6 -6 -2Z" fill="#EBD0A0" stroke="#D2B07A" stroke-width=".8" transform="rotate(${Math.round(R() * 360)} ${r1(x)} ${r1(y)})"/>`));
add('spice', 'pepitas', 'Pumpkin seeds', 'toasted', 24, () => scatter(12, 16, 159, (x, y, R) => `<ellipse cx="${r1(x)}" cy="${r1(y)}" rx="3.6" ry="2" transform="rotate(${Math.round(R() * 180)} ${r1(x)} ${r1(y)})" fill="#7E9A4E"/>`));
add('spice', 'nori', 'Nori', 'thin strips', 30, () => [[-10, -20], [0, 10], [10, 40], [-4, 70]].map(([x, r]) => `<rect x="${x - 2}" y="-20" width="4" height="40" rx="1" transform="rotate(${r})" fill="#1F2E22"/>`).join(''));
add('spice', 'friedshallot', 'Crispy shallots', 'fried', 26, () => scatter(14, 18, 160, (x, y, R) => `<path d="M${r1(x - 4)} ${r1(y)} q4 -6 8 0" stroke="#B9763A" stroke-width="2" fill="none" stroke-linecap="round" transform="rotate(${Math.round(R() * 360)} ${r1(x)} ${r1(y)})"/>`));

/* Sauces and oils */
add('sauce', 'miso', 'Miso glaze', 'white miso, honey, butter', 70, null, { diet: ['dairy', 'honey'] });
add('sauce', 'cream', 'Cream sauce', 'garlic and thyme', 66, null, { diet: ['dairy'] });
add('sauce', 'gravy', 'Mushroom gravy', 'rich and savory', 60, () => pool(54, 171, '#6E4428', '#8C5A36'));
add('sauce', 'broth', 'Mushroom broth', 'clear and golden', 72, () => `<circle r="68" fill="#D9A24A" opacity=".55"/><circle r="56" fill="#E7B65E" opacity=".45"/>${dots(10, 50, 172, '#F4D78E', 2, 5, false)}`);
add('sauce', 'tomatosauce', 'Tomato sauce', 'slow-cooked', 60, () => pool(54, 173, '#B8301F', '#D9502E'));
add('sauce', 'pesto', 'Pesto', 'basil and pine nut', 50, () => pool(44, 174, '#4F7F2E', '#6E9A3E') + dots(12, 34, 175, '#9CBF5E', 1.2, 2, false), { diet: ['dairy'] });
add('sauce', 'curry', 'Curry', 'coconut', 60, () => pool(54, 176, '#E0A030', '#EFB74A') + dots(10, 40, 177, '#E07A20', 2, 4, false));
add('sauce', 'hummus', 'Hummus', 'swirled', 54, () => pool(48, 178, '#E7CFA0', '#F0DDB6', 0.1) + `<path d="M-26 6 C-20 -20 20 -24 26 0 C18 18 -10 18 -8 2" stroke="#D2B47E" stroke-width="3" fill="none"/>`);
add('sauce', 'chilioil', 'Chili oil', 'a few drops', 30, null, { layer: 3 });
add('sauce', 'soy', 'Soy sauce', 'drizzle', 56, () => drizzle(181, '#3A1E10', 4), { layer: 3 });
add('sauce', 'oliveoil', 'Olive oil', 'drizzle', 56, () => drizzle(182, '#C8B44A', 3.4), { layer: 3 });
add('sauce', 'honey', 'Honey', 'drizzle', 56, () => drizzle(183, '#E8A92A', 4), { layer: 3, diet: ['honey'] });
add('sauce', 'tahini', 'Tahini', 'drizzle', 56, () => drizzle(184, '#E3C79A', 4.4), { layer: 3 });
add('sauce', 'balsamic', 'Balsamic', 'reduced, dots', 30, () => dots(8, 24, 185, '#3A1A1A', 2.4, 4.4), { layer: 3 });
add('sauce', 'sriracha', 'Sriracha', 'dots', 30, () => dots(8, 24, 186, '#D2341E', 2.4, 4), { layer: 3 });
add('sauce', 'gochujang', 'Gochujang', 'swoosh', 60, () => `<path d="M-50 12 C-24 -20 20 -22 50 -8" stroke="#A92A1B" stroke-width="16" stroke-linecap="round" fill="none"/><path d="M-40 4 C-20 -14 14 -16 40 -8" stroke="#D2533A" stroke-width="3" stroke-linecap="round" fill="none" opacity=".6"/>`);
add('sauce', 'aioli', 'Aioli', 'garlic, dots', 30, () => dots(7, 22, 187, '#F7EFD2', 3, 4.6), { layer: 3, diet: ['egg'] });

MP.ingredients = L;
MP.ingCats = [
  ['mush', 'Mushrooms'], ['veg', 'Vegetables'], ['protein', 'Protein'], ['grain', 'Grains & bread'], ['dairy', 'Dairy'],
  ['fruit', 'Fruit'], ['herb', 'Herbs'], ['spice', 'Spices & nuts'], ['sauce', 'Sauces'],
];
const LAYER_BY_CAT = { sauce: 0, grain: 1, herb: 3, spice: 3 };
MP.layerOf = t => {
  const ing = Object.prototype.hasOwnProperty.call(L, t) ? L[t] : null;
  if (!ing) return 2;
  if (ing.layer != null) return ing.layer;
  return ing.cat in LAYER_BY_CAT ? LAYER_BY_CAT[ing.cat] : 2;
};
/* Drawing for any piece: built-in art first, then the library. */
MP.pieceDraw = t => {
  if (Object.prototype.hasOwnProperty.call(PIECES, t)) return PIECES[t];
  if (Object.prototype.hasOwnProperty.call(L, t) && L[t].draw) return L[t].draw;
  return null;
};

})(window.MP = window.MP || {});
