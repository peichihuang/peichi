/* Moshruum Patch: the game. */
(function (MP) {
'use strict';

const A = MP.art, C = MP.config;
const { esc, clamp, r1 } = A;
const $ = id => document.getElementById(id);
const MAX = 1000, RH_IDEAL = 85, CO2_IDEAL = 1000;
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

$('defsHost').innerHTML = A.DEFS;
['brand', 'shopLink'].forEach(id => { $(id).href = C.shopUrl; });

/* Time-lapse for demos: ?speed=60 in the URL, or #timelapse for 120x. */
let SPEED = 1;
try {
  const q = Number(new URLSearchParams(location.search).get('speed'));
  if (q > 0) SPEED = q;
  if (location.hash === '#timelapse') SPEED = 120;
} catch (e) { /* ignore */ }
SPEED = clamp(SPEED, 1, 2000);

let state = MP.load();
const save = () => MP.save(state);
const ui = {
  view: 'grow', growSel: 0, growTab: 'care', group: 'culinary', pick: 'blue', pickName: randomName(), confirmCompost: false,
  kSub: 'create', kTab: 'add', kCat: 'mush', kSel: -1, kHist: [],
  cSub: 'create', cStep: 'cup', filter: { dish: 'all', drink: 'all' }, q: { dish: '', drink: '' }, cat: { dish: 'all', drink: 'all' }, kQuery: '',
};

function randomName() { return MP.names[Math.floor(Math.random() * MP.names.length)]; }
function uid() { return 'u' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
function fmtDur(min) {
  min = Math.max(0, Math.round(min));
  if (min < 60) return min + ' min';
  const d = Math.floor(min / 1440), h = Math.floor((min % 1440) / 60), m = min % 60;
  if (d) return d + ' d ' + h + ' h';
  return h + ' h' + (m ? ' ' + m + ' min' : '');
}
function fmtDate(t) { const d = new Date(t); return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); }
const clone = o => JSON.parse(JSON.stringify(o));
const sp = id => MP.species[id];

/* ---------- Toast ---------- */
let toastTimer = 0;
function toast(msg, ms = 3800) {
  const t = $('toast');
  t.textContent = msg;
  t.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { t.hidden = true; }, ms);
}

/* ---------- Sound (generated) ---------- */
let actx = null;
function audio() {
  if (!state.sound) return null;
  try {
    actx = actx || new (window.AudioContext || window.webkitAudioContext)();
    if (actx.state === 'suspended') actx.resume();
    return actx;
  } catch (e) { return null; }
}
function tone(freq, at, dur, type = 'sine', vol = 0.06) {
  const a = audio(); if (!a) return;
  const o = a.createOscillator(), g = a.createGain(), t = a.currentTime + at;
  o.type = type; o.frequency.setValueAtTime(freq, t);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(a.destination); o.start(t); o.stop(t + dur + 0.05);
}
function noise(at, dur, f1, f2, vol = 0.05, type = 'bandpass') {
  const a = audio(); if (!a) return;
  const len = Math.floor(a.sampleRate * dur), buf = a.createBuffer(1, len, a.sampleRate), d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  const src = a.createBufferSource(), flt = a.createBiquadFilter(), g = a.createGain(), t = a.currentTime + at;
  src.buffer = buf; flt.type = type; flt.frequency.setValueAtTime(f1, t); flt.frequency.linearRampToValueAtTime(f2, t + dur);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.04); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(flt).connect(g).connect(a.destination); src.start(t); src.stop(t + dur + 0.05);
}
const SFX = {
  tap() { tone(880, 0, 0.06, 'sine', 0.03); },
  place() { tone(520, 0, 0.09, 'sine', 0.05); tone(780, 0.05, 0.12, 'sine', 0.035); },
  mist() { noise(0, 0.26, 5500, 6500, 0.05); noise(0.32, 0.26, 5500, 6500, 0.05); },
  air() { noise(0, 0.9, 300, 1300, 0.04, 'lowpass'); },
  pour() { noise(0, 0.7, 700, 400, 0.035, 'lowpass'); },
  harvest() { [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.08, 0.4, 'triangle', 0.05)); },
  gilded() { [784, 988, 1175, 1568, 1976].forEach((f, i) => tone(f, i * 0.09, 0.7, 'sine', 0.05)); },
};

/* ---------- Simulation ---------- */
function rate(st, room) {
  const rhF = room.rh >= RH_IDEAL ? 1 : room.rh >= 70 ? 0.7 : 0.4;
  const co2F = st < 2 ? 1 : room.co2 <= CO2_IDEAL ? 1 : room.co2 <= 1600 ? 0.7 : 0.45;
  return rhF * co2F;
}
function simulate(minutes) {
  let m = Math.min(minutes, 60 * 24 * 30);
  const room = state.room;
  while (m > 0) {
    const step = Math.min(1, m);
    m -= step;
    room.rh = Math.max(45, room.rh - 0.9 * step);
    if (state.slots.some(Boolean)) room.co2 = Math.min(2600, room.co2 + 45 * step);
    else room.co2 = Math.max(450, room.co2 - 60 * step);
    state.slots.forEach(p => {
      if (!p) return;
      if (p.growth < MAX) {
        const r = rate(A.stageOf(p.growth), room);
        p.growth = Math.min(MAX, p.growth + r * step);
        p.careSum += r * step; p.careMin += step;
      }
      p.ageMin += step;
    });
  }
}
function advance() {
  const now = Date.now();
  const mins = Math.max(0, (now - state.room.lastTick) / 60000) * SPEED;
  state.room.lastTick = now;
  if (mins) simulate(mins);
}
function announce(changes) {
  changes.forEach(({ i, to }) => {
    const p = state.slots[i];
    if (!p) return;
    if (to === 3 && p.gilded) { toast(`Something on ${p.name}'s block is shimmering…`, 6000); SFX.gilded(); }
    else if (to === 5) { toast(`${p.name} is ready to harvest.`); SFX.harvest(); }
  });
}
function bump(p, pts) { if (p && p.growth < MAX) p.growth = Math.min(MAX, p.growth + pts); }

/* ---------- Grow: actions ---------- */
const busy = {};
function cooldown(key, el) { busy[key] = true; if (el) el.disabled = true; setTimeout(() => { busy[key] = false; if (el && el.isConnected) el.disabled = false; }, 1200); }
function mist(el) {
  if (busy.mist) return;
  advance();
  cooldown('mist', el);
  const dry = state.room.rh < RH_IDEAL;
  state.slots.forEach(p => bump(p, dry ? 8 : 1));
  state.room.rh = Math.min(97, state.room.rh + 22);
  SFX.mist(); fxMist();
  toast(dry ? 'Misted. Humidity is back up.' : "It's already damp. Mushrooms don't like puddles.");
  announce(stageCheck()); save(); renderGrow();
}
function air(el) {
  if (busy.air) return;
  advance();
  cooldown('air', el);
  const fruiting = state.slots.filter(p => p && A.stageOf(p.growth) >= 2);
  const stuffy = state.room.co2 > CO2_IDEAL;
  if (stuffy) fruiting.forEach(p => bump(p, 8));
  state.room.co2 = Math.max(480, state.room.co2 - (stuffy ? 900 : 300));
  SFX.air(); fxAir();
  announce(stageCheck());
  if (!state.slots.some(Boolean)) toast('Fresh air in an empty room. Plant a block first.');
  else if (!fruiting.length) toast('Fresh air in. Colonizing blocks like it a little stuffy, so this matters once pins appear.');
  else toast(stuffy ? 'Fresh air in. CO₂ is back down.' : 'The air is already fresh.');
  save(); renderGrow();
}
let lastStages = state.slots.map(p => p ? A.stageOf(p.growth) : -1);
function stageCheck() {
  const out = [];
  state.slots.forEach((p, i) => { const s = p ? A.stageOf(p.growth) : -1; if (s > lastStages[i] && lastStages[i] >= 0) out.push({ i, from: lastStages[i], to: s }); lastStages[i] = s; });
  return out;
}
function plant() {
  const i = ui.growSel;
  if (state.slots[i]) return;
  const name = (ui.pickName || '').trim().slice(0, 18) || randomName();
  state.planted += 1;
  const growingGilded = state.slots.some(p => p && p.gilded);
  let gilded = Math.random() < C.gildedChance;
  if (!state.gilded && !growingGilded && state.planted >= C.gildedGuaranteeBy) gilded = true;
  const now = Date.now();
  state.slots[i] = { species: ui.pick, name, seed: Math.floor(Math.random() * 1e9), growth: 0, ageMin: 0, plantedAt: now, careSum: 0, careMin: 0, gilded };
  lastStages[i] = 0;
  ui.pickName = randomName();
  SFX.place(); save(); renderGrow();
  toast(`${name} is planted. Keep the rack humid and check back over the next day.`);
}
function harvest(i) {
  const p = state.slots[i];
  if (!p || A.stageOf(p.growth) < 5) return;
  const s = sp(p.species);
  const quality = p.careMin ? clamp(p.careSum / p.careMin, 0.2, 1) : 1;
  const grams = Math.round(s.grams * (0.7 + 0.5 * quality) * (0.92 + Math.random() * 0.16));
  const pan = state.pantry[p.species] || (state.pantry[p.species] = { g: 0, n: 0 });
  pan.g += grams; pan.n += 1; delete pan.gift;
  state.log.unshift({ species: p.species, name: p.name, grams, gilded: p.gilded, date: Date.now() });
  state.log = state.log.slice(0, 200);
  state.slots[i] = null;
  lastStages[i] = -1;
  if (p.gilded) state.gilded += 1;
  save(); renderGrow();
  if (p.gilded) { SFX.gilded(); showGilded(p, grams); return; }
  SFX.harvest();
  const fn = s.group === 'functional' && !s.functional ? 'cafe' : 'kitchen';
  openModal(`
    <p class="label">Harvest</p>
    <h2 id="modalTitle">${esc(p.name)}, ${grams} g</h2>
    <div class="preview">${A.speciesThumb(p.species)}</div>
    <p class="muted">${esc(s.name)} grown in ${fmtDur(p.ageMin)}. ${fn === 'cafe' ? 'Dried and ground into powder for the café.' : "It's in your pantry, ready for the kitchen."}</p>
    <div class="actions"><button class="b2 dark" id="mGo"><b>${fn === 'cafe' ? 'Brew with it' : 'Cook with it'}</b><small>open the ${fn === 'cafe' ? 'café' : 'kitchen'}</small></button><button class="b2 outline" id="mAgain"><b>Plant again</b><small>back to the rack</small></button></div>`);
  $('mGo').onclick = () => { closeModal(); setView(fn); };
  $('mAgain').onclick = () => { closeModal(); ui.growSel = i; renderGrow(); };
}
function showGilded(p, grams) {
  const s = sp(p.species);
  openModal(`
    <p class="label" style="color:var(--gold)">A rare find</p>
    <h2 id="modalTitle">A gilded ${esc(s.name)}</h2>
    <div class="gilded-art">${A.svg(`<g transform="translate(200 360) scale(1.3)"><g filter="${A.F.gild}">${A.cluster(p.species, p.seed)}</g>${A.sparkles(12, 170, 220, p.seed)}</g>`, '0 0 400 400')}</div>
    <p>${esc(p.name)} came out gilded, ${grams} g of shimmer. Gilded mushrooms are rare, so the farm would like to say thank you.</p>
    <div class="reward"><span class="label" style="color:var(--gold)">${esc(C.gildedOffer)} at the Moshruums shop</span><div class="row" style="align-items:center;flex-wrap:wrap"><span class="code" id="mCode">${esc(C.gildedCode)}</span><button class="b2 light" id="mCopy"><b>Copy code</b><small>for checkout</small></button></div></div>
    <div class="actions"><a class="b2 gold" href="${esc(C.shopUrl)}" target="_blank" rel="noopener" style="text-decoration:none"><b>Shop now ↗</b><small>moshruums.com</small></a><button class="b2 outline" id="mPic"><b>Save picture</b><small>share your find</small></button><button class="b2 ghost" id="mClose"><b>Close</b><small>the code stays in Collection</small></button></div>`);
  $('mCopy').onclick = () => copyCode();
  $('mClose').onclick = closeModal;
  $('mPic').onclick = () => savePicture(`<rect width="400" height="400" fill="#EFE6CF"/><g transform="translate(200 360) scale(1.3)"><g filter="${A.F.gild}">${A.cluster(p.species, p.seed)}</g></g>`, `Gilded ${s.name}`, `${p.name} · ${grams} g`, 'gilded-' + p.species);
}
function copyCode() {
  const el = $('mCode') || $('rCode');
  const done = () => toast(`Copied ${C.gildedCode}`);
  try {
    navigator.clipboard.writeText(C.gildedCode).then(done, () => selectText(el));
  } catch (e) { selectText(el); }
}
function selectText(el) {
  if (!el) return;
  const r = document.createRange(); r.selectNodeContents(el);
  const s = getSelection(); s.removeAllRanges(); s.addRange(r);
  toast('Code selected. Copy it to use at checkout.');
}

/* ---------- Grow: FX ---------- */
function fx(markup, ms, layer) {
  if (reduceMotion) return;
  const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  g.innerHTML = markup;
  $(layer).appendChild(g);
  setTimeout(() => g.remove(), ms);
}
function fxMist() {
  let s = '';
  for (let i = 0; i < 40; i++) {
    const x = 30 + Math.random() * 340, y = 30 + Math.random() * 120 + (i % 2) * 200;
    s += `<circle class="fx" cx="${r1(x)}" cy="${r1(y)}" r="${r1(1 + Math.random() * 2)}" fill="#fff" style="--dx:${r1((Math.random() - 0.5) * 30)}px;--dy:${r1(20 + Math.random() * 40)}px;animation-delay:${r1(Math.random() * 0.5)}s"/>`;
  }
  fx(s, 2000, 'growFx');
}
function fxAir() {
  let s = '';
  for (let i = 0; i < 6; i++) {
    const y = 60 + i * 60;
    s += `<path class="fx" d="M${r1(-20 + Math.random() * 30)} ${y} q24 -9 48 0 t48 0 t48 0" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round" style="--dx:${r1(220 + Math.random() * 60)}px;--dy:0px;animation-delay:${r1(i * 0.06)}s"/>`;
  }
  fx(s, 1900, 'growFx');
}

/* ---------- Grow: render ---------- */
const ICON = {
  on: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor"/><path d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12" stroke="currentColor" stroke-width="1.6" fill="none" stroke-linecap="round"/></svg>',
  off: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor"/><path d="M16 9l6 6M22 9l-6 6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
  dice: '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><rect x="3.5" y="3.5" width="17" height="17" rx="3" fill="none" stroke="currentColor" stroke-width="1.5"/><circle cx="8.5" cy="8.5" r="1.4" fill="currentColor"/><circle cx="12" cy="12" r="1.4" fill="currentColor"/><circle cx="15.5" cy="15.5" r="1.4" fill="currentColor"/></svg>',
};
function tabs(list, current, attr) {
  return `<div class="tabs" role="tablist">${list.map(([k, b, s]) => `<button role="tab" ${attr}="${k}" aria-selected="${k === current}"><b>${b}</b><small>${s}</small></button>`).join('')}</div>`;
}
function growTip() {
  const room = state.room, plants = state.slots.filter(Boolean);
  if (!plants.length) return 'Tap an empty slot to plant your first block.';
  const ready = plants.find(p => p.growth >= MAX);
  if (ready) return `${ready.name} is ready to harvest.`;
  if (room.rh < RH_IDEAL) return `Humidity is ${Math.round(room.rh)}%. Mushrooms like 85–95%, so mist the rack.`;
  if (plants.some(p => A.stageOf(p.growth) >= 2) && room.co2 > CO2_IDEAL) return `CO₂ is ${Math.round(room.co2).toLocaleString('en-US')} ppm. Fruiting mushrooms need fresh air or their stems grow long and thin.`;
  return 'Everything is comfortable. Mushrooms grow in real time, so check back later.';
}
function renderRack() {
  $('rackLayer').innerHTML = A.rack(state.slots, ui.growSel);
}
function renderGrowTop() {
  const n = state.slots.filter(Boolean).length;
  $('growTop').innerHTML = `
    <div class="stat"><b>${Math.round(state.room.rh)}% RH</b><small>Humidity</small></div>
    <div class="stat"><b>${Math.round(state.room.co2).toLocaleString('en-US')} ppm</b><small>CO₂</small></div>
    <div class="stat"><b>${n} of 4</b><small>Blocks growing</small></div>
    ${state.gilded ? `<div class="stat gold"><b>${state.gilded} gilded</b><small>Rare finds</small></div>` : ''}
    ${SPEED > 1 ? `<div class="stat"><b>${SPEED}×</b><small>Time-lapse</small></div>` : ''}`;
  $('growNote').textContent = growTip();
}
function renderGrowTools() {
  const el = $('growTools');
  let html = tabs([['care', 'Care', 'climate and blocks'], ['pantry', 'Pantry', 'your harvest'], ['collection', 'Collection', 'rare finds']], ui.growTab, 'data-gtab');
  html += '<div class="pane" id="growPane"></div>';
  el.innerHTML = html;
  el.querySelectorAll('[data-gtab]').forEach(b => b.onclick = () => { ui.growTab = b.dataset.gtab; SFX.tap(); renderGrowTools(); });
  const pane = $('growPane');
  if (ui.growTab === 'pantry') return renderPantry(pane);
  if (ui.growTab === 'collection') return renderCollection(pane);
  renderCare(pane);
}
function meter(id, name, val, pct, band, off, small, btn) {
  return `<div class="meter${off ? ' off' : ''}" id="${id}"><div class="meter-top"><b>${name}</b><span>${val}</span></div>
    <div class="track"><div class="band" style="left:${band[0]}%;width:${band[1] - band[0]}%"></div><div class="dot" style="left:${pct}%"></div></div><small>${small}</small>${btn}</div>`;
}
function renderCare(pane) {
  const room = state.room;
  const fruiting = state.slots.some(p => p && A.stageOf(p.growth) >= 2);
  let html = '';
  if (state.intro) {
    html += `<div class="note"><b>Welcome to the farm.</b> Your welcome box has Blue Oyster and Lion's Mane, ready to cook in the Kitchen. Plant blocks on the rack to grow more, including functional mushrooms for the Café. <button class="link" id="introOk" style="text-decoration:underline">Got it</button></div>`;
  }
  html += `<div class="climate">
    ${meter('mRh', 'Humidity', Math.round(room.rh) + '%', clamp((room.rh - 40) / 60 * 100, 0, 100), [75, 91.7], room.rh < RH_IDEAL, 'ideal 85–95% RH', `<button class="b2 dark" id="mistBtn"><b>Mist</b><small>raise humidity</small></button>`)}
    ${meter('mCo2', 'CO₂', Math.round(room.co2).toLocaleString('en-US') + ' ppm', clamp((room.co2 - 400) / 2200 * 100, 0, 100), [0, 27.3], fruiting && room.co2 > CO2_IDEAL, fruiting ? 'ideal under 1,000 ppm' : 'colonizing blocks like it stuffy', `<button class="b2 outline" id="airBtn"><b>Fresh air</b><small>lower CO₂</small></button>`)}
  </div>`;
  const p = state.slots[ui.growSel];
  html += `<p class="label">Slot ${ui.growSel + 1} of 4</p>`;
  if (p) {
    const s = sp(p.species), st = A.stageOf(p.growth), pct = Math.floor(p.growth / MAX * 100);
    html += `<div class="detail">
      <div class="detail-head"><div><h3>${esc(p.name)}</h3><p class="muted small">${esc(s.name)} · <i>${esc(s.latin)}</i></p></div>
        <div style="display:grid;gap:6px;justify-items:end"><span class="pill${st === 5 ? ' ready' : ''}">${MP.stages[st].label}</span>${p.gilded && st >= 3 ? '<span class="pill gold">Gilded</span>' : ''}</div></div>
      <div class="progress"><i style="width:${pct}%"></i></div>
      <div class="progress-meta"><span>${st < 5 ? 'Next: ' + MP.stages[st + 1].label.toLowerCase() : 'Fully grown'}</span><span>${pct}% · planted ${fmtDur(p.ageMin)} ago</span></div>
      <p class="small muted">${esc(s.fact)}</p>
      ${st === 5 ? `<button class="b2 dark wide" id="harvestBtn"><b>Harvest ${esc(p.name)}</b><small>${s.group === 'functional' && !s.functional ? 'dry it for the café' : 'add it to your pantry'}</small></button>` : ''}
      ${ui.confirmCompost ? `<div class="confirm"><p>Compost <b>${esc(p.name)}</b> and free this slot? It won't go in your pantry.</p><div class="row"><button class="b2 outline" id="keepBtn"><b>Keep growing</b><small>never mind</small></button><button class="b2 ghost" id="yesCompost"><b>Compost it</b><small>start fresh</small></button></div></div>`
        : `<button class="link" id="compostBtn" style="justify-self:start">Compost this block</button>`}
    </div>`;
  } else {
    const list = ui.group === 'functional' ? MP.functional : MP.culinary;
    if (!list.includes(ui.pick)) ui.pick = list[0];
    const s = sp(ui.pick);
    html += `<h3>Plant a block</h3>
      <div class="seg"><button aria-pressed="${ui.group === 'culinary'}" data-group="culinary"><b>Culinary</b><small>for the kitchen</small></button><button aria-pressed="${ui.group === 'functional'}" data-group="functional"><b>Functional</b><small>for the café</small></button></div>
      <div class="cards">${list.map(id => `<button class="card" data-pick="${id}" aria-pressed="${id === ui.pick}"><span class="art">${A.speciesThumb(id)}</span><b>${esc(sp(id).name)}</b></button>`).join('')}</div>
      <p class="small"><b>${esc(s.name)}</b> <i class="muted">${esc(s.latin)}</i><br><span class="muted">${esc(s.fact)}</span></p>
      <div class="field"><label for="nameInput">Name your block</label><div class="row"><input class="input" id="nameInput" maxlength="18" autocomplete="off" value="${esc(ui.pickName)}"><button class="icon-btn" id="diceBtn" aria-label="Random name" title="Random name">${ICON.dice}</button></div></div>
      <button class="b2 dark wide" id="plantBtn"><b>Plant ${esc(s.name)}</b><small>in slot ${ui.growSel + 1}</small></button>`;
  }
  pane.innerHTML = html;
  const on = (id, fn) => { const e = $(id); if (e) e.onclick = fn; };
  on('introOk', () => { state.intro = false; save(); renderGrowTools(); });
  on('mistBtn', e => mist(e.currentTarget));
  on('airBtn', e => air(e.currentTarget));
  on('harvestBtn', () => harvest(ui.growSel));
  on('compostBtn', () => { ui.confirmCompost = true; renderGrowTools(); });
  on('keepBtn', () => { ui.confirmCompost = false; renderGrowTools(); });
  on('yesCompost', () => { state.slots[ui.growSel] = null; lastStages[ui.growSel] = -1; ui.confirmCompost = false; save(); renderGrow(); });
  on('plantBtn', plant);
  on('diceBtn', () => { ui.pickName = randomName(); $('nameInput').value = ui.pickName; SFX.tap(); });
  const ni = $('nameInput'); if (ni) ni.oninput = e => { ui.pickName = e.target.value; };
  pane.querySelectorAll('[data-group]').forEach(b => b.onclick = () => { ui.group = b.dataset.group; SFX.tap(); renderGrowTools(); });
  pane.querySelectorAll('[data-pick]').forEach(b => b.onclick = () => { ui.pick = b.dataset.pick; SFX.tap(); renderGrowTools(); });
}
function renderPantry(pane) {
  const row = (id, label, extra) => { const p = state.pantry[id]; return `<div class="list-row">${A.speciesThumb(id)}<div><b>${label}</b><div class="small muted">${extra}</div></div><span class="num">${p.g.toLocaleString('en-US')} g</span></div>`; };
  const cul = MP.culinary.filter(id => state.pantry[id]);
  const fun = MP.functional.filter(id => id !== 'lions' && state.pantry[id]);
  pane.innerHTML = `
    <div><p class="label">For the kitchen</p><div class="list">${cul.length ? cul.map(id => row(id, esc(sp(id).name), state.pantry[id].gift ? 'welcome box from the farm' : `harvested ${state.pantry[id].n}×`)).join('') : '<p class="muted small">Nothing yet.</p>'}</div></div>
    <button class="b2 outline" data-go="kitchen"><b>Open the kitchen</b><small>plate a dish</small></button>
    <div><p class="label">For the café</p><div class="list">${fun.length ? fun.map(id => row(id, esc(sp(id).name) + ' powder', `harvested ${state.pantry[id].n}×, dried and ground`)).join('') : '<p class="muted small">Grow Reishi, Cordyceps or Turkey Tail to brew with them. Your Moshruums blends are always on the café shelf.</p>'}</div></div>
    <button class="b2 outline" data-go="cafe"><b>Open the café</b><small>make a drink</small></button>`;
  pane.querySelectorAll('[data-go]').forEach(b => b.onclick = () => setView(b.dataset.go));
}
function renderCollection(pane) {
  const ids = Array.from(new Set(MP.culinary.concat(MP.functional)));
  const grown = id => state.log.filter(h => h.species === id);
  const n = ids.filter(id => grown(id).length).length;
  let html = '';
  if (state.gilded) {
    html += `<div class="reward"><span class="label" style="color:var(--gold)">Your reward · ${state.gilded} gilded find${state.gilded > 1 ? 's' : ''}</span><p class="small">${esc(C.gildedOffer)} at the Moshruums shop.</p><div class="row" style="align-items:center;flex-wrap:wrap"><span class="code" id="rCode">${esc(C.gildedCode)}</span><button class="b2 light" id="rCopy"><b>Copy code</b><small>for checkout</small></button><a class="b2 ghost" href="${esc(C.shopUrl)}" target="_blank" rel="noopener" style="text-decoration:none"><b>Shop ↗</b><small>moshruums.com</small></a></div></div>`;
  } else {
    html += `<div class="note">About 1 in ${Math.round(1 / C.gildedChance)} blocks grows <b>gilded</b>. A gilded harvest unlocks ${esc(C.gildedOffer)} at the Moshruums shop.</div>`;
  }
  html += `<div class="book-head"><h3>${n} of ${ids.length} grown</h3></div><div class="cards">`;
  html += ids.map(id => {
    const g = grown(id), gold = g.filter(h => h.gilded).length;
    return `<div class="card${g.length ? '' : ' locked'}"><span class="art">${A.speciesThumb(id, gold > 0)}</span><b>${esc(sp(id).name)}</b><small>${g.length ? `grown ${g.length}×` : 'not grown yet'}</small>${gold ? `<span class="tag">${gold} gilded</span>` : ''}</div>`;
  }).join('') + '</div>';
  if (state.log.length) {
    html += `<div><p class="label">Harvest log</p><div class="list">${state.log.slice(0, 30).map(h => `<div class="list-row">${A.speciesThumb(h.species, h.gilded)}<div><b>${esc(h.name)}</b>${h.gilded ? ' <span class="pill gold">Gilded</span>' : ''}<div class="small muted">${esc(sp(h.species).name)} · ${fmtDate(h.date)}</div></div><span class="num">${h.grams} g</span></div>`).join('')}</div></div>`;
  }
  pane.innerHTML = html;
  const rc = $('rCopy'); if (rc) rc.onclick = copyCode;
}
function renderGrow() {
  renderRack(); renderGrowTop(); renderGrowTools();
}
$('rackSvg').addEventListener('click', e => {
  const g = e.target.closest('.slot');
  if (!g) return;
  ui.growSel = +g.dataset.slot; ui.confirmCompost = false; ui.growTab = 'care';
  SFX.tap(); renderGrow();
});
$('rackSvg').addEventListener('keydown', e => {
  const g = e.target.closest && e.target.closest('.slot');
  if (!g || (e.key !== 'Enter' && e.key !== ' ')) return;
  e.preventDefault();
  ui.growSel = +g.dataset.slot; ui.growTab = 'care'; renderGrow();
  const again = document.querySelector(`.slot[data-slot="${ui.growSel}"]`); if (again) again.focus();
});

/* ---------- Kitchen ---------- */
const layerOf = MP.layerOf;
const hasOwn = (o, k) => Object.prototype.hasOwnProperty.call(o, k);
const ING = t => (hasOwn(MP.ingredients, t) ? MP.ingredients[t] : null);
function kPush() { ui.kHist.push(JSON.stringify(state.kitchen)); if (ui.kHist.length > 60) ui.kHist.shift(); }
function itemName(t) { return hasOwn(MP.species, t) ? MP.species[t].name : ING(t) ? ING(t).name : t; }
function renderDish() {
  $('dishSvg').innerHTML = A.dish(state.kitchen, ui.kSel);
  $('kSurfaceName').textContent = MP.surfaces[state.kitchen.surface].name;
  $('kUndo').disabled = !ui.kHist.length;
  $('kRemove').disabled = ui.kSel < 0;
}
function addItem(t) {
  const items = state.kitchen.items;
  if (items.length >= 40) { toast('The plate is full. Remove something first.'); return; }
  kPush();
  const it = { t, x: Math.round(200 + (Math.random() - 0.5) * 90), y: Math.round(200 + (Math.random() - 0.5) * 90), r: Math.round((Math.random() - 0.5) * 50), s: 1 };
  const L = layerOf(t);
  let at = items.length;
  for (let i = 0; i < items.length; i++) if (layerOf(items[i].t) > L) { at = i; break; }
  items.splice(at, 0, it);
  ui.kSel = at;
  SFX.place(); save(); renderDish(); renderKitchenTools();
}
function renderKitchenTools() {
  const el = $('kitchenTools');
  let html = tabs([['add', 'Add', 'ingredients'], ['adjust', 'Adjust', 'cooking and layout'], ['plate', 'Plate', 'and surface']], ui.kTab, 'data-ktab');
  html += '<div class="pane">';
  if (ui.kTab === 'add') {
    html += `<input class="input search" id="kSearch" type="search" placeholder="Search ${Object.keys(MP.ingredients).length + MP.culinary.length} ingredients" aria-label="Search ingredients" value="${esc(ui.kQuery || '')}" autocomplete="off">`;
    html += `<div class="chips scroll-row" role="group" aria-label="Ingredient categories">${MP.ingCats.map(([k, l]) => `<button data-kcat="${k}" aria-pressed="${k === ui.kCat && !ui.kQuery}">${l}</button>`).join('')}</div>`;
    html += `<div id="kCards">${kitchenCards()}</div>`;
  } else if (ui.kTab === 'adjust') {
    html += `<div><p class="label">Cooking</p></div><div class="cards">${Object.keys(MP.methods).map(k => `<button class="card" data-method="${k}" aria-pressed="${state.kitchen.method === k}"><b>${MP.methods[k].name}</b><small>${MP.methods[k].line}</small></button>`).join('')}</div>`;
    const it = state.kitchen.items[ui.kSel];
    if (it) {
      html += `<div><p class="label">Selected</p><h3 style="margin-top:4px">${esc(itemName(it.t))}</h3></div>
        <div class="cards">
          <button class="card" data-op="rl"><b>↺ Rotate</b><small>left 15°</small></button>
          <button class="card" data-op="rr"><b>↻ Rotate</b><small>right 15°</small></button>
          <button class="card" data-op="dup"><b>Duplicate</b><small>add another</small></button>
          <button class="card" data-op="sm"><b>Smaller</b><small>−10%</small></button>
          <button class="card" data-op="lg"><b>Larger</b><small>+10%</small></button>
          <button class="card" data-op="del"><b>Remove</b><small>from the plate</small></button>
          <button class="card" data-op="back"><b>Send back</b><small>one layer</small></button>
          <button class="card" data-op="front"><b>Bring forward</b><small>one layer</small></button>
        </div><p class="small muted">Keyboard: arrows move, [ and ] rotate, + and − resize, Delete removes.</p>`;
    } else {
      html += `<p class="muted small">Tap something on the plate to rotate, resize or layer it.</p>`;
    }
  } else {
    html += `<p class="label">Plate</p><div class="cards">${Object.keys(MP.plates).map(k => `<button class="card" data-plate="${k}" aria-pressed="${state.kitchen.plate === k}"><span class="art">${A.svg(A.dish({ plate: k, surface: state.kitchen.surface, items: [] }), '20 20 360 360')}</span><b>${MP.plates[k].name}</b><small>${MP.plates[k].line}</small></button>`).join('')}</div>`;
    html += `<p class="label">Surface</p><div class="cards">${Object.keys(MP.surfaces).map(k => `<button class="card" data-surface="${k}" aria-pressed="${state.kitchen.surface === k}"><span class="art">${A.svg(A.surface(k), '0 0 400 400')}</span><b>${MP.surfaces[k].name}</b></button>`).join('')}</div>`;
  }
  html += '</div>';
  el.innerHTML = html;
  el.querySelectorAll('[data-ktab]').forEach(b => b.onclick = () => { ui.kTab = b.dataset.ktab; SFX.tap(); renderKitchenTools(); });
  el.querySelectorAll('[data-kcat]').forEach(b => b.onclick = () => { ui.kCat = b.dataset.kcat; ui.kQuery = ''; SFX.tap(); renderKitchenTools(); });
  bindKitchenCards();
  const ks = $('kSearch');
  if (ks) ks.oninput = () => {
    ui.kQuery = ks.value;
    $('kCards').innerHTML = kitchenCards();
    el.querySelectorAll('[data-kcat]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.kcat === ui.kCat && !ui.kQuery)));
    bindKitchenCards();
  };
  el.querySelectorAll('[data-method]').forEach(b => b.onclick = () => { kPush(); state.kitchen.method = b.dataset.method; SFX.tap(); save(); renderDish(); renderKitchenTools(); });
  el.querySelectorAll('[data-plate]').forEach(b => b.onclick = () => { kPush(); state.kitchen.plate = b.dataset.plate; SFX.tap(); save(); renderDish(); renderKitchenTools(); });
  el.querySelectorAll('[data-surface]').forEach(b => b.onclick = () => { kPush(); state.kitchen.surface = b.dataset.surface; SFX.tap(); save(); renderDish(); renderKitchenTools(); });
  el.querySelectorAll('[data-op]').forEach(b => b.onclick = () => itemOp(b.dataset.op));
}
function kitchenCards() {
  const q = (ui.kQuery || '').trim().toLowerCase();
  const mushCard = id => {
    const has = !!state.pantry[id];
    return `<button class="card${has ? '' : ' locked'}" data-add="${id}" ${has ? '' : 'disabled'} aria-label="${has ? 'Add ' : ''}${esc(sp(id).name)}${has ? '' : ', grow it first'}">${has ? '<span class="plus">+</span>' : ''}<span class="art">${A.pieceThumb(id)}</span><b>${esc(sp(id).name)}</b><small>${has ? state.pantry[id].g + ' g in pantry' : 'grow it first'}</small></button>`;
  };
  const ingCard = id => `<button class="card" data-add="${id}" aria-label="Add ${esc(ING(id).name)}"><span class="plus">+</span><span class="art">${A.pieceThumb(id)}</span><b>${esc(ING(id).name)}</b><small>${esc(ING(id).line)}</small></button>`;
  let cards;
  if (q) {
    const m = MP.culinary.filter(id => sp(id).name.toLowerCase().includes(q) || 'mushroom'.includes(q));
    const i = Object.keys(MP.ingredients).filter(id => (ING(id).name + ' ' + ING(id).line + ' ' + (MP.ingCats.find(c => c[0] === ING(id).cat) || ['', ''])[1]).toLowerCase().includes(q));
    cards = m.map(mushCard).concat(i.map(ingCard));
    if (!cards.length) return `<p class="muted small">Nothing matches "${esc(ui.kQuery)}". Try a category instead.</p>`;
  } else if (ui.kCat === 'mush') cards = MP.culinary.map(mushCard);
  else cards = Object.keys(MP.ingredients).filter(id => ING(id).cat === ui.kCat).map(ingCard);
  return `<div class="cards scroll tall">${cards.join('')}</div>`;
}
function bindKitchenCards() { document.querySelectorAll('#kCards [data-add]').forEach(b => b.onclick = () => addItem(b.dataset.add)); }
function itemOp(op) {
  const items = state.kitchen.items, i = ui.kSel, it = items[i];
  if (!it) return;
  kPush();
  if (op === 'rl') it.r = (it.r - 15) % 360;
  else if (op === 'rr') it.r = (it.r + 15) % 360;
  else if (op === 'sm') it.s = Math.round(clamp(it.s * 0.9, 0.4, 2.2) * 100) / 100;
  else if (op === 'lg') it.s = Math.round(clamp(it.s * 1.1, 0.4, 2.2) * 100) / 100;
  else if (op === 'dup' && items.length < 40) { const c = Object.assign({}, it, { x: clamp(it.x + 22, 20, 380), y: clamp(it.y + 16, 20, 380) }); items.splice(i + 1, 0, c); ui.kSel = i + 1; }
  else if (op === 'del') { items.splice(i, 1); ui.kSel = -1; }
  else if (op === 'back' && i > 0) { items.splice(i - 1, 0, items.splice(i, 1)[0]); ui.kSel = i - 1; }
  else if (op === 'front' && i < items.length - 1) { items.splice(i + 1, 0, items.splice(i, 1)[0]); ui.kSel = i + 1; }
  SFX.tap(); save(); renderDish(); renderKitchenTools();
}
/* Drag to arrange */
let drag = null;
function svgPoint(svg, e) {
  const pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY;
  return pt.matrixTransform(svg.getScreenCTM().inverse());
}
$('dishSvg').addEventListener('pointerdown', e => {
  const svg = $('dishSvg');
  const g = e.target.closest('.item');
  if (!g) { if (ui.kSel >= 0) { ui.kSel = -1; renderDish(); if (ui.kTab === 'adjust') renderKitchenTools(); } return; }
  const i = +g.dataset.i, it = state.kitchen.items[i];
  const p = svgPoint(svg, e);
  drag = { i, dx: p.x - it.x, dy: p.y - it.y, before: JSON.stringify(state.kitchen), moved: false, id: e.pointerId };
  svg.setPointerCapture(e.pointerId);
  if (ui.kSel !== i) { ui.kSel = i; renderDish(); if (ui.kTab !== 'add') renderKitchenTools(); }
  e.preventDefault();
});
$('dishSvg').addEventListener('pointermove', e => {
  if (!drag || e.pointerId !== drag.id) return;
  const p = svgPoint($('dishSvg'), e), it = state.kitchen.items[drag.i];
  it.x = Math.round(clamp(p.x - drag.dx, 10, 390)); it.y = Math.round(clamp(p.y - drag.dy, 10, 390));
  drag.moved = true;
  const g = $('dishSvg').querySelector(`.item[data-i="${drag.i}"]`);
  if (g) g.setAttribute('transform', `translate(${it.x} ${it.y}) rotate(${Math.round(it.r)}) scale(${it.s})`);
});
function endDrag(e) {
  if (!drag || e.pointerId !== drag.id) return;
  if (drag.moved) { ui.kHist.push(drag.before); save(); renderDish(); }
  drag = null;
}
$('dishSvg').addEventListener('pointerup', endDrag);
$('dishSvg').addEventListener('pointercancel', endDrag);
$('dishSvg').setAttribute('tabindex', '0');
$('dishSvg').addEventListener('keydown', e => {
  const it = state.kitchen.items[ui.kSel];
  if (!it) return;
  const k = e.key, step = e.shiftKey ? 20 : 6;
  const moves = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
  if (moves[k]) { kPush(); it.x = clamp(it.x + moves[k][0], 10, 390); it.y = clamp(it.y + moves[k][1], 10, 390); }
  else if (k === '[') return itemOp('rl');
  else if (k === ']') return itemOp('rr');
  else if (k === '+' || k === '=') return itemOp('lg');
  else if (k === '-') return itemOp('sm');
  else if (k === 'Delete' || k === 'Backspace') return itemOp('del');
  else return;
  e.preventDefault(); save(); renderDish();
});
$('kUndo').onclick = () => { if (!ui.kHist.length) return; state.kitchen = JSON.parse(ui.kHist.pop()); ui.kSel = -1; save(); renderDish(); renderKitchenTools(); };
$('kRemove').onclick = () => itemOp('del');
$('kReset').onclick = () => { if (!state.kitchen.items.length) return; kPush(); state.kitchen.items = []; ui.kSel = -1; save(); renderDish(); renderKitchenTools(); toast('Plate cleared. Undo brings it back.'); };
$('kSurface').onclick = () => { const k = Object.keys(MP.surfaces); kPush(); state.kitchen.surface = k[(k.indexOf(state.kitchen.surface) + 1) % k.length]; SFX.tap(); save(); renderDish(); if (ui.kTab === 'plate') renderKitchenTools(); };
$('kFinish').onclick = () => {
  if (!state.kitchen.items.length) { toast('Add something to the plate first.'); return; }
  ui.kSel = -1; renderDish();
  finishSheet('dish', clone(state.kitchen));
};

/* ---------- Cafe ---------- */
const STEPS = [['cup', 'Cup', 'and temperature'], ['base', 'Base', 'coffee, tea…'], ['milk', 'Milk', 'or none'], ['mush', 'Mushroom', 'blends'], ['sweet', 'Sweet', 'to taste'], ['finish', 'Finish', 'toppings']];
function powderName(id) { const p = MP.products.find(x => x.id === id); return p ? p.name : sp(id) ? sp(id).name : id; }
function drinkName(c) {
  const b = MP.bases[c.base], m = MP.milks[c.milk];
  const milk = m.color ? m.short + ' ' : '';
  let n;
  if (b.smoothie) n = b.name;
  else if (!m.color) n = b.name;
  else if (c.base === 'blacktea') n = milk + 'milk tea';
  else if (c.base === 'hojicha') n = milk + 'hojicha milk tea';
  else if (c.base === 'chai') n = milk + 'chai latte';
  else if (c.base === 'cacao') n = milk + 'cacao';
  else n = milk + b.name.toLowerCase() + ' latte';
  n = (c.temp === 'iced' && !b.smoothie ? 'iced ' : '') + n;
  if (c.mush && c.mush.length) n += ' with ' + list(c.mush.map(powderName));
  n = n.toLowerCase().replace(/(^|\s)\S/g, t => t.toUpperCase()).replace(/ With /, ' with ').replace(/ And /, ' and ');
  return n.replace("Lion'S", "Lion's");
}
function renderDrink() {
  $('drinkSvg').innerHTML = A.drink(state.cafe);
  $('cSurfaceName').textContent = MP.surfaces[state.cafe.surface].name;
  $('drinkName').textContent = drinkName(state.cafe);
}
function finishOk(k, c) {
  if (k === 'art') return c.cup === 'mug' && c.temp === 'hot' && !!MP.milks[c.milk].color;
  if (k === 'pearls') return c.cup !== 'mug';
  if (k === 'foam') return !!MP.milks[c.milk].color;
  return true;
}
function setCafe(patch) {
  Object.assign(state.cafe, patch);
  const c = state.cafe;
  c.finish = c.finish.filter(k => finishOk(k, c));
  save(); renderDrink(); renderCafeTools();
}
function renderCafeTools() {
  const el = $('cafeTools'), c = state.cafe;
  let html = tabs(STEPS.map(([k, b], i) => [k, b, `step ${i + 1}`]), ui.cStep, 'data-cstep');
  html += '<div class="pane">';
  const opt = (attr, k, on, b, s, extra = '', dis = false) => `<button class="card" ${attr}="${k}" aria-pressed="${on}" ${dis ? 'disabled' : ''}>${extra}<b>${b}</b><small>${s || ''}</small></button>`;
  const sw = col => `<span class="swatch" style="background:${col}"></span>`;
  if (ui.cStep === 'cup') {
    html += `<div class="seg"><button data-temp="hot" aria-pressed="${c.temp === 'hot'}"><b>Hot</b><small>steamed</small></button><button data-temp="iced" aria-pressed="${c.temp === 'iced'}"><b>Iced</b><small>over ice</small></button></div>`;
    html += `<div class="cards">${Object.keys(MP.cups).map(k => opt('data-cup', k, c.cup === k, MP.cups[k].name, MP.cups[k].line, `<span class="art">${A.svg(A.drink({ cup: k, temp: c.temp, base: c.base, milk: c.milk, mush: [], sweet: 'none', finish: [], surface: c.surface }), '80 100 240 250')}</span>`)).join('')}</div>`;
  } else if (ui.cStep === 'base') {
    html += `<div class="cards">${Object.keys(MP.bases).map(k => opt('data-base', k, c.base === k, MP.bases[k].name, '', sw(MP.bases[k].color))).join('')}</div>`;
  } else if (ui.cStep === 'milk') {
    html += `<div class="cards">${Object.keys(MP.milks).map(k => opt('data-milk', k, c.milk === k, MP.milks[k].name, '', sw(MP.milks[k].color || 'transparent'))).join('')}</div>`;
  } else if (ui.cStep === 'mush') {
    html += `<p class="small muted">Choose up to two. Tap again to remove.</p><p class="label">Moshruums blends</p>`;
    html += `<div class="cards">${MP.products.map(p => `<button class="card" data-mush="${p.id}" aria-pressed="${c.mush.includes(p.id)}"><span class="art">${A.productThumb(p.id)}</span><b>${esc(p.name)}</b><small>${esc(p.line)}</small></button>`).join('')}</div>`;
    html += `<div class="row" style="flex-wrap:wrap;gap:14px">${MP.products.map(p => `<a class="link" href="${esc(p.url)}" target="_blank" rel="noopener" style="text-decoration:underline">Shop ${esc(p.name)} ↗</a>`).join('')}</div>`;
    const sel = c.mush.map(id => MP.products.find(p => p.id === id)).filter(Boolean)[0];
    if (sel) html += `<p class="small muted"><b style="color:var(--ink)">${esc(sel.name)}.</b> ${esc(sel.note)}</p>`;
    html += `<p class="label">From your harvest</p><div class="cards">${['reishi', 'cordyceps', 'turkeytail'].map(id => {
      const has = !!state.pantry[id];
      return `<button class="card${has ? '' : ' locked'}" data-mush="${id}" aria-pressed="${c.mush.includes(id)}" ${has ? '' : 'disabled'}>${sw(sp(id).powder)}<b>${esc(sp(id).name)}</b><small>${has ? 'your powder' : 'grow it on the rack'}</small></button>`;
    }).join('')}</div>`;
  } else if (ui.cStep === 'sweet') {
    html += `<div class="cards">${Object.keys(MP.sweets).map(k => opt('data-sweet', k, c.sweet === k, MP.sweets[k].name, MP.sweets[k].line)).join('')}</div>`;
  } else {
    html += `<p class="small muted">Pick as many as you like.</p><div class="cards">${Object.keys(MP.finishes).map(k => {
      const ok = finishOk(k, c);
      return opt('data-finish', k, c.finish.includes(k), MP.finishes[k].name, ok ? MP.finishes[k].line : (k === 'art' ? 'needs a hot milk drink in the glass mug' : k === 'pearls' ? 'needs a tall or short glass' : 'needs milk'), '', !ok);
    }).join('')}</div>`;
  }
  const idx = STEPS.findIndex(s => s[0] === ui.cStep);
  html += idx < STEPS.length - 1
    ? `<button class="b2 outline wide" id="cNext"><b>Next: ${STEPS[idx + 1][1]}</b><small>step ${idx + 2} of ${STEPS.length}</small></button>`
    : `<button class="b2 dark wide" id="cDone"><b>Finish the drink</b><small>name and share it</small></button>`;
  html += '</div>';
  el.innerHTML = html;
  el.querySelectorAll('[data-cstep]').forEach(b => b.onclick = () => { ui.cStep = b.dataset.cstep; SFX.tap(); renderCafeTools(); });
  el.querySelectorAll('[data-temp]').forEach(b => b.onclick = () => { SFX.tap(); setCafe({ temp: b.dataset.temp }); });
  el.querySelectorAll('[data-cup]').forEach(b => b.onclick = () => { SFX.tap(); setCafe({ cup: b.dataset.cup }); });
  el.querySelectorAll('[data-base]').forEach(b => b.onclick = () => { SFX.pour(); setCafe({ base: b.dataset.base }); });
  el.querySelectorAll('[data-milk]').forEach(b => b.onclick = () => { SFX.pour(); setCafe({ milk: b.dataset.milk }); });
  el.querySelectorAll('[data-sweet]').forEach(b => b.onclick = () => { SFX.tap(); setCafe({ sweet: b.dataset.sweet }); });
  el.querySelectorAll('[data-mush]').forEach(b => b.onclick = () => {
    const id = b.dataset.mush; let m = c.mush.slice();
    if (m.includes(id)) m = m.filter(x => x !== id);
    else { m.push(id); if (m.length > 2) m.shift(); }
    SFX.place(); setCafe({ mush: m });
  });
  el.querySelectorAll('[data-finish]').forEach(b => b.onclick = () => {
    const k = b.dataset.finish; let f = c.finish.slice();
    f = f.includes(k) ? f.filter(x => x !== k) : f.concat(k);
    SFX.tap(); setCafe({ finish: f });
  });
  const nx = $('cNext'); if (nx) nx.onclick = () => { ui.cStep = STEPS[idx + 1][0]; SFX.tap(); renderCafeTools(); };
  const dn = $('cDone'); if (dn) dn.onclick = () => $('cFinish').click();
}
$('cReset').onclick = () => { state.cafe = { cup: 'mug', temp: 'hot', base: 'espresso', milk: 'oat', mush: [], sweet: 'none', finish: [], surface: state.cafe.surface }; ui.cStep = 'cup'; save(); renderDrink(); renderCafeTools(); };
$('cSurface').onclick = () => { const k = Object.keys(MP.surfaces); state.cafe.surface = k[(k.indexOf(state.cafe.surface) + 1) % k.length]; SFX.tap(); save(); renderDrink(); };
$('cFinish').onclick = () => finishSheet('drink', clone(state.cafe));

/* ---------- Recipes: text ---------- */
function list(arr) { return arr.length < 2 ? arr.join('') : arr.slice(0, -1).join(', ') + ' and ' + arr[arr.length - 1]; }
function dishIngredients(comp) {
  const seen = new Set(), out = [];
  (comp.items || []).forEach(it => {
    if (seen.has(it.t)) return; seen.add(it.t);
    if (hasOwn(MP.species, it.t)) out.push(MP.species[it.t].name + ' mushrooms');
    else if (ING(it.t)) out.push(`${ING(it.t).name}, ${ING(it.t).line}`);
  });
  return out;
}
function dishSteps(comp) {
  const ts = Array.from(new Set((comp.items || []).map(i => i.t)));
  const mush = ts.filter(t => hasOwn(MP.species, t)).map(t => MP.species[t].name.toLowerCase());
  const top = t => ING(t) && layerOf(t) === 3;
  const base = ts.filter(t => ING(t) && !top(t)).map(t => ING(t).name.toLowerCase());
  const garn = ts.filter(top).map(t => ING(t).name.toLowerCase());
  const steps = [];
  if (mush.length) steps.push(`${MP.methods[comp.method].verb.replace('the mushrooms', 'the ' + list(mush))}.`);
  if (base.length) steps.push(`Prepare the ${list(base)}.`);
  steps.push(`Arrange everything on the ${MP.plates[comp.plate].name.toLowerCase()}${garn.length ? `, then finish with ${list(garn)}` : ''}.`);
  return steps.join(' ');
}
/* Diet comes from the ingredients: mushrooms and plants alone make a dish vegan. */
function dishDiet(comp) {
  const marks = new Set();
  (comp.items || []).forEach(it => { const g = ING(it.t); if (g) g.diet.forEach(d => marks.add(d)); });
  const tags = [];
  if (!marks.size) tags.push('vegan');
  if (!marks.has('meat') && !marks.has('seafood')) tags.push('vegetarian');
  if (marks.has('seafood')) tags.push('seafood');
  if (marks.has('meat')) tags.push('meat');
  return tags;
}
function suggestCourses(comp) {
  const ts = new Set((comp.items || []).map(i => i.t));
  const any = list => list.some(t => ts.has(t));
  const out = [];
  if (any(['broth'])) out.push('soup');
  if (any(['noodles', 'spaghetti', 'udon', 'soba', 'ricenoodles', 'penne', 'gnocchi'])) out.push('noodles');
  if (any(['rice', 'brownrice', 'quinoa', 'couscous'])) out.push('rice');
  if (any(['toast', 'baguette', 'tortilla'])) out.push('toast');
  if (any(['egg', 'friedegg', 'oats']) && !out.includes('soup')) out.push('breakfast');
  if (any(['lettuce', 'arugula', 'spinach', 'kale']) && !out.length) out.push('salad');
  return out;
}
const DRINK_TAGS = { coffee: 'Coffee', matcha: 'Matcha', tea: 'Tea', milktea: 'Milk tea', smoothie: 'Smoothie', cacao: 'Cacao', hot: 'Hot', iced: 'Iced', dairyfree: 'Dairy-free', vegan: 'Vegan' };
function drinkTags(c) {
  const t = [];
  if (['espresso', 'coldbrew'].includes(c.base)) t.push('coffee');
  if (c.base === 'matcha') t.push('matcha');
  if (['hojicha', 'blacktea', 'chai'].includes(c.base)) { t.push('tea'); if (MP.milks[c.milk].color) t.push('milktea'); }
  if (MP.bases[c.base].smoothie) t.push('smoothie');
  if (c.base === 'cacao') t.push('cacao');
  t.push(c.temp === 'iced' ? 'iced' : 'hot');
  if (c.milk !== 'whole') { t.push('dairyfree'); if (c.sweet !== 'honey') t.push('vegan'); }
  (c.mush || []).forEach(id => { if (MP.products.some(p => p.id === id)) t.push(id); });
  return t;
}
const DIET_LABEL = { vegan: 'Vegan', vegetarian: 'Vegetarian', seafood: 'Seafood', meat: 'Meat' };
function tagLabel(t) { return DIET_LABEL[t] || MP.courses[t] || DRINK_TAGS[t] || (MP.products.find(p => p.id === t) || {}).name || t; }
function entryTags(e) { return e.kind === 'dish' ? dishDiet(e.comp).concat(e.tags || []) : drinkTags(e.comp); }
function haystack(e) {
  const ingr = e.kind === 'dish' ? dishIngredients(e.comp) : drinkIngredients(e.comp);
  return [e.title, e.author, e.notes, e.kind === 'dish' ? 'dish food recipe' : 'drink cafe café', ingr.join(' '), entryTags(e).map(tagLabel).join(' '), e.featured ? 'premium' : ''].join(' ').toLowerCase();
}
function drinkIngredients(c) {
  const out = [MP.cups[c.cup].name + (c.temp === 'iced' ? ', iced' : ', hot'), MP.bases[c.base].name];
  if (MP.milks[c.milk].color) out.push(MP.milks[c.milk].name);
  (c.mush || []).forEach(id => out.push(powderName(id) + (MP.products.find(p => p.id === id) ? ' (Moshruums)' : ' powder')));
  if (c.sweet !== 'none') out.push(MP.sweets[c.sweet].name);
  (c.finish || []).forEach(k => out.push(MP.finishes[k].name));
  return out;
}
function drinkSteps(c) {
  const b = MP.bases[c.base], m = MP.milks[c.milk];
  const steps = [b.step + '.'];
  if (c.finish.includes('pearls')) steps.unshift('Cook tapioca pearls and spoon them into the glass.');
  if (c.sweet === 'brown') steps.unshift('Swirl brown sugar syrup around the inside of the glass.');
  if (c.mush.length) steps.push(`Stir in one serving of ${list(c.mush.map(powderName))}.`);
  if (c.sweet !== 'none' && c.sweet !== 'brown') steps.push(`Sweeten with ${MP.sweets[c.sweet].name.toLowerCase()}.`);
  if (m.color) steps.push(c.temp === 'iced' ? `Fill the glass with ice and ${m.name.toLowerCase()}, then pour the ${b.name.toLowerCase()} over the top.` : `Steam the ${m.name.toLowerCase()} and pour it in.`);
  else if (c.temp === 'iced') steps.push('Pour over ice.');
  const fin = c.finish.filter(k => k !== 'pearls').map(k => MP.finishes[k].name.toLowerCase());
  if (fin.length) steps.push(`Finish with ${list(fin)}.`);
  return steps.join(' ');
}

/* ---------- Finish and share ---------- */
function render(kind, comp) { return kind === 'dish' ? A.dish(comp) : A.drink(comp); }
function finishSheet(kind, comp) {
  const title = kind === 'dish' ? suggestDishName(comp) : drinkName(comp);
  const where = kind === 'dish' ? 'Recipe Book' : 'Café Menu';
  openModal(`
    <div class="sheet-split">
      <div class="preview">${A.svg(render(kind, comp))}</div>
      <div style="display:grid;gap:12px">
        <p class="label">${kind === 'dish' ? 'Your dish' : 'Your drink'}</p>
        <div class="field"><label for="fTitle">Name</label><input class="input" id="fTitle" maxlength="60" value="${esc(title)}"></div>
        <div class="field"><label for="fAuthor">Your name, optional</label><input class="input" id="fAuthor" maxlength="30" autocomplete="nickname" value="${esc(state.author || '')}"></div>
        ${kind === 'dish' ? `<div class="field"><label>Category</label><div class="chips" id="fCourses">${Object.keys(MP.courses).map(k => `<button type="button" data-course="${k}" aria-pressed="${suggestCourses(comp).includes(k)}">${MP.courses[k]}</button>`).join('')}</div><p class="small muted">${dishDiet(comp).map(tagLabel).join(' · ') || 'Contains meat or seafood'}, worked out from the ingredients.</p></div>` : `<p class="small muted">${drinkTags(comp).map(tagLabel).join(' · ')}</p>`}
        <div class="field"><label for="fNotes">How to make it</label><textarea class="input" id="fNotes" maxlength="1200">${esc(kind === 'dish' ? dishSteps(comp) : drinkSteps(comp))}</textarea></div>
      </div>
    </div>
    <div class="actions"><button class="b2 dark" id="fShare"><b>Share</b><small>to the ${where}</small></button><button class="b2 outline" id="fPic"><b>Save picture</b><small>PNG card</small></button><button class="b2 ghost" id="fBack"><b>Keep editing</b><small>back to the ${kind === 'dish' ? 'plate' : 'bar'}</small></button></div>`, true);
  $('fBack').onclick = closeModal;
  document.querySelectorAll('#fCourses [data-course]').forEach(b => b.onclick = () => b.setAttribute('aria-pressed', String(b.getAttribute('aria-pressed') !== 'true')));
  $('fPic').onclick = () => savePicture(render(kind, comp), $('fTitle').value || title, $('fAuthor').value ? 'by ' + $('fAuthor').value : where, kind);
  $('fShare').onclick = async () => {
    const btn = $('fShare'); btn.disabled = true;
    const entry = { id: uid(), kind, title: $('fTitle').value.trim() || title, author: $('fAuthor').value.trim(), notes: $('fNotes').value.trim(), comp, created: Date.now(),
      tags: Array.from(document.querySelectorAll('#fCourses [data-course][aria-pressed="true"]')).map(b => b.dataset.course) };
    state.author = entry.author;
    state.mine.unshift(entry); state.mine = state.mine.slice(0, 60); save();
    let status = 'local';
    try { status = await MP.gallery.add(entry); } catch (e) { status = 'error'; }
    closeModal();
    const msg = { shared: `Shared to the ${where}.`, pending: `Sent to the ${where}. It appears for everyone once the farm approves it.`, local: `Saved to your ${where} on this device.`, error: `Couldn't share right now, so it's saved on this device.` }[status];
    toast(msg, 5000);
    ui.q[kind] = ''; ui.cat[kind] = 'all'; ui.filter[kind] = 'mine';
    if (kind === 'dish') ui.kSub = 'book'; else ui.cSub = 'book';
    renderView();
  };
}
function suggestDishName(comp) {
  const ts = Array.from(new Set(comp.items.map(i => i.t)));
  const m = ts.find(t => MP.species[t]);
  const what = { toast: 'on Sourdough', baguette: 'Crostini', tortilla: 'Tacos', rice: 'Rice Bowl', brownrice: 'Grain Bowl', quinoa: 'Grain Bowl', noodles: 'Noodles', udon: 'Udon', soba: 'Soba', ricenoodles: 'Noodle Bowl', spaghetti: 'Spaghetti', penne: 'Pasta', gnocchi: 'Gnocchi', broth: 'Soup', polenta: 'with Polenta', lettuce: 'Salad', arugula: 'Salad' };
  const base = ts.find(t => what[t]);
  const method = { raw: 'Fresh', seared: 'Seared', roasted: 'Roasted', braised: 'Glazed' }[comp.method];
  if (!m) return base ? what[base].replace(/^on |^with /, '') : 'Farm Plate';
  return `${method} ${MP.species[m].name}${base ? ' ' + what[base] : ''}`;
}

/* ---------- Books (galleries) ---------- */
const DISH_FILTERS = [['all', 'All'], ['vegan', 'Vegan'], ['vegetarian', 'Vegetarian'], ['seafood', 'Seafood'], ['meat', 'Meat']].concat(Object.keys(MP.courses).map(k => [k, MP.courses[k]]));
const DRINK_FILTERS = [['all', 'All']].concat(Object.keys(DRINK_TAGS).map(k => [k, DRINK_TAGS[k]]), MP.products.map(p => [p.id, p.name]));
function coverHtml(e) {
  return e.cover ? `<img src="${esc(e.cover)}" alt="" loading="lazy">` : A.svg(A.cover(e.kind, e.comp), '0 0 640 400', 'preserveAspectRatio="xMidYMid slice" aria-hidden="true"');
}
function byLine(e, mineIds) { return (e.farm ? 'From the farm' : e.author ? 'by ' + esc(e.author) : 'Anonymous') + (mineIds && mineIds.has(e.id) ? ' · yours' : ''); }
function bookResults(kind, all, mineIds) {
  const f = ui.filter[kind], cat = ui.cat[kind];
  const toks = (ui.q[kind] || '').toLowerCase().split(/\s+/).filter(Boolean);
  const shown = all.filter(e =>
    (f === 'all' || (f === 'farm' && e.farm) || (f === 'community' && !e.farm && !mineIds.has(e.id)) || (f === 'mine' && mineIds.has(e.id))) &&
    (cat === 'all' || entryTags(e).includes(cat)) &&
    (!toks.length || (h => toks.every(t => h.includes(t)))(haystack(e))));
  if (!shown.length) {
    if (toks.length || cat !== 'all') return `<p class="empty">No ${kind === 'dish' ? 'recipes' : 'drinks'} match yet. Try another search, or make one and share it.</p>`;
    return `<p class="empty">${f === 'mine' ? `Nothing here yet. Finish a ${kind === 'dish' ? 'dish' : 'drink'} and share it to see it here.` : f === 'community' ? (MP.gallery.mode === 'local' ? 'Community sharing turns on once the gallery is connected to the website.' : 'No shared recipes yet. Be the first.') : 'Nothing here yet.'}</p>`;
  }
  return `<p class="small muted">${shown.length} ${kind === 'dish' ? (shown.length === 1 ? 'recipe' : 'recipes') : (shown.length === 1 ? 'drink' : 'drinks')}</p><div class="gallery">${shown.map(e => `<button class="entry" data-entry="${esc(e.id)}">${A.svg(render(kind, e.comp))}<span class="entry-text"><b>${esc(e.title)}</b><small>${byLine(e, mineIds)}</small><span class="tags">${entryTags(e).slice(0, 3).map(t => `<i>${esc(tagLabel(t))}</i>`).join('')}</span></span></button>`).join('')}</div>`;
}
function renderBook(kind) {
  const el = $(kind === 'dish' ? 'kitchenBook' : 'cafeBook');
  const all = MP.gallery.list(kind, state.mine);
  const mineIds = new Set(state.mine.map(m => m.id));
  const name = kind === 'dish' ? 'Recipe Book' : 'Café Menu';
  const premium = all.filter(e => e.featured).sort((a, b) => {
    const ia = MP.premium.findIndex(p => p.id === a.id), ib = MP.premium.findIndex(p => p.id === b.id);
    return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib) || b.created - a.created;
  });
  const filters = kind === 'dish' ? DISH_FILTERS : DRINK_FILTERS;
  el.innerHTML = `
    <div class="book-head"><div><p class="label">${kind === 'dish' ? 'Cooking recipes' : 'Barista recipes'}</p><h2>${name}</h2></div></div>
    ${premium.length ? `<section class="premium" aria-label="Premium ${kind === 'dish' ? 'recipes' : 'drinks'}">
      <div class="premium-head"><p class="label">Premium</p><p class="muted small">Hand-picked by the Moshruums farm.</p></div>
      <div class="premium-grid">${premium.map((e, i) => `<button class="pcard${i > 0 && i === premium.length - 1 && premium.length % 2 === 0 ? ' wide' : ''}" data-entry="${esc(e.id)}">${coverHtml(e)}<span class="pcard-text"><small>Premium · ${byLine(e)}</small><b>${esc(e.title)}</b></span></button>`).join('')}</div>
    </section>` : ''}
    <div class="finder">
      <div class="search-row"><input class="input search" id="bookSearch-${kind}" type="search" placeholder="${kind === 'dish' ? 'Search recipes, ingredients, vegan, seafood…' : 'Search drinks, coffee, matcha, oat…'}" aria-label="Search the ${name}" value="${esc(ui.q[kind])}" autocomplete="off">
        <div class="chips">${[['all', 'All'], ['farm', 'Farm'], ['community', 'Community'], ['mine', 'Mine']].map(([k, l]) => `<button data-f="${k}" aria-pressed="${ui.filter[kind] === k}">${l}</button>`).join('')}</div></div>
      <div class="chips scroll-row" role="group" aria-label="Categories">${filters.map(([k, l]) => `<button data-cat="${k}" aria-pressed="${ui.cat[kind] === k}">${esc(l)}</button>`).join('')}</div>
    </div>
    <div id="bookResults-${kind}">${bookResults(kind, all, mineIds)}</div>`;
  const bindEntries = () => el.querySelectorAll('[data-entry]').forEach(b => b.onclick = () => { const e = all.find(x => x.id === b.dataset.entry); if (e) openEntry(e); });
  el.querySelectorAll('[data-f]').forEach(b => b.onclick = () => { ui.filter[kind] = b.dataset.f; SFX.tap(); renderBook(kind); });
  el.querySelectorAll('[data-cat]').forEach(b => b.onclick = () => { ui.cat[kind] = b.dataset.cat; SFX.tap(); renderBook(kind); });
  const si = $('bookSearch-' + kind);
  si.oninput = () => { ui.q[kind] = si.value; $('bookResults-' + kind).innerHTML = bookResults(kind, all, mineIds); bindEntries(); };
  bindEntries();
  $(kind === 'dish' ? 'kBookCount' : 'cBookCount').textContent = `${all.length} ${kind === 'dish' ? 'recipes' : 'drinks'}`;
}
function openEntry(e) {
  const ingr = e.kind === 'dish' ? dishIngredients(e.comp).concat(MP.methods[e.comp.method] ? [MP.methods[e.comp.method].name + ' (' + MP.methods[e.comp.method].line + ')'] : []) : drinkIngredients(e.comp);
  const canPick = MP.gallery.mode === 'artifact' && MP.gallery.owner;
  openModal(`
    ${e.featured ? `<div class="cover">${coverHtml(e)}</div>` : ''}
    <div class="sheet-split">
      <div class="preview">${A.svg(render(e.kind, e.comp))}</div>
      <div style="display:grid;gap:12px;align-content:start">
        <p class="label">${e.featured ? 'Premium · ' : ''}${e.farm ? 'From the farm' : e.author ? 'by ' + esc(e.author) : 'Community'}</p>
        <h2 id="modalTitle">${esc(e.title)}</h2>
        <div class="tags">${entryTags(e).map(t => `<i>${esc(tagLabel(t))}</i>`).join('')}</div>
        <div><p class="label">You'll need</p><ul class="small">${ingr.map(i => `<li>${esc(i)}</li>`).join('')}</ul></div>
        ${e.notes ? `<div><p class="label">How to make it</p><p class="small" style="white-space:pre-line">${esc(e.notes)}</p></div>` : ''}
        ${e.kind === 'drink' ? e.comp.mush.filter(id => MP.products.find(p => p.id === id)).map(id => { const p = MP.products.find(x => x.id === id); return `<a class="link" href="${esc(p.url)}" target="_blank" rel="noopener" style="text-decoration:underline">Shop ${esc(p.full || p.name)} ↗</a>`; }).join('') : ''}
      </div>
    </div>
    <div class="actions"><button class="b2 dark" id="eMake"><b>Recreate it</b><small>open in the ${e.kind === 'dish' ? 'kitchen' : 'café'}</small></button><button class="b2 outline" id="ePic"><b>Save picture</b><small>PNG card</small></button>${canPick ? `<button class="b2 outline" id="ePick"><b>${e.featured ? 'Remove from Premium' : 'Add to Premium'}</b><small>only you see this</small></button>` : ''}<button class="b2 ghost" id="eClose"><b>Close</b><small>back to the list</small></button></div>`, true);
  $('eClose').onclick = closeModal;
  $('ePic').onclick = () => savePicture(render(e.kind, e.comp), e.title, e.farm ? 'From the Moshruums farm' : e.author ? 'by ' + e.author : '', e.kind);
  const pk = $('ePick');
  if (pk) pk.onclick = async () => {
    pk.disabled = true;
    try { await MP.gallery.setPremium(e.id, !e.featured); toast(e.featured ? 'Removed from Premium.' : 'Added to Premium.'); closeModal(); }
    catch (err) { pk.disabled = false; toast("Couldn't change Premium right now."); }
  };
  $('eMake').onclick = () => {
    closeModal();
    if (e.kind === 'dish') { kPush(); state.kitchen = clone(e.comp); ui.kSel = -1; ui.kSub = 'create'; }
    else { state.cafe = clone(e.comp); ui.cSub = 'create'; ui.cStep = 'cup'; }
    save(); renderView();
    toast('Loaded. Make it your own, then finish and share.');
  };
}
MP.gallery.on(() => { if (ui.view === 'kitchen' && ui.kSub === 'book') renderBook('dish'); if (ui.view === 'cafe' && ui.cSub === 'book') renderBook('drink'); });

/* ---------- Pictures ---------- */
async function makeCard(inner, title, sub) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="960" height="960">${A.DEFS}${inner}</svg>`;
  const img = new Image();
  img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  await img.decode();
  try { await Promise.all([document.fonts.load('400 72px "Instrument Serif"'), document.fonts.load('500 30px "Hanken Grotesk"')]); } catch (e) { /* fallback fonts */ }
  const cv = document.createElement('canvas');
  cv.width = 1080; cv.height = 1350;
  const x = cv.getContext('2d');
  x.fillStyle = '#F6F6F4'; x.fillRect(0, 0, 1080, 1350);
  x.drawImage(img, 60, 60, 960, 960);
  x.fillStyle = '#262624';
  x.font = '400 70px "Instrument Serif", Georgia, serif';
  let t = title;
  while (x.measureText(t).width > 960 && t.length > 4) t = t.slice(0, -2);
  if (t !== title) t = t.trim() + '…';
  x.fillText(t, 60, 1130);
  x.fillStyle = '#6C6B66';
  x.font = '500 30px "Hanken Grotesk", Arial, sans-serif';
  x.fillText(sub || '', 62, 1184);
  x.fillStyle = '#262624';
  x.font = '600 24px "Hanken Grotesk", Arial, sans-serif';
  x.letterSpacing = '4px';
  x.fillText('MOSHRUUM PATCH', 62, 1290);
  x.textAlign = 'right';
  x.fillText('MOSHRUUMS.COM', 1018, 1290);
  return cv;
}
async function savePicture(inner, title, sub, slug) {
  let cv;
  try { cv = await makeCard(inner, title, sub); } catch (e) { toast("This browser couldn't draw the picture."); return; }
  const file = (title || slug || 'moshruum').replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase() + '.png';
  const url = cv.toDataURL('image/png');
  openModal(`<h2 id="modalTitle">Your picture</h2><img src="${url}" alt="${esc(title)}"><p class="small muted">On a phone, press and hold the picture to save or share it.</p>
    <div class="actions"><button class="b2 dark" id="pSave"><b>Download</b><small>${esc(file)}</small></button><button class="b2 ghost" id="pClose"><b>Close</b><small>done</small></button></div>`);
  $('pClose').onclick = closeModal;
  $('pSave').onclick = async () => {
    const blob = await new Promise(r => cv.toBlob(r, 'image/png'));
    let dl = null;
    try { dl = window.claude && window.claude.use ? await window.claude.use('downloads') : null; } catch (e) { dl = null; }
    if (dl) {
      try { await dl.save({ filename: file, data: blob }); toast('Saved.'); } catch (e) { if (e && e.code !== 'declined') toast('Press and hold the picture to save it instead.'); }
      return;
    }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = file;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  };
}

/* ---------- Modal ---------- */
let lastFocus = null;
function openModal(html, wide) {
  lastFocus = document.activeElement;
  const sh = $('sheet');
  sh.className = 'sheet' + (wide ? ' wide' : '');
  sh.innerHTML = html;
  $('modal').hidden = false;
  const first = sh.querySelector('input, button, a');
  if (first) first.focus();
}
function closeModal() {
  $('modal').hidden = true;
  if (lastFocus && lastFocus.isConnected) lastFocus.focus();
}
$('modal').addEventListener('click', e => { if (e.target === $('modal')) closeModal(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape' && !$('modal').hidden) closeModal(); });

/* ---------- Views ---------- */
const HASH = { grow: 'grow', kitchen: 'kitchen', cafe: 'cafe', recipes: 'kitchen', menu: 'cafe' };
function setView(v, sub) {
  ui.view = v;
  if (sub && v === 'kitchen') ui.kSub = sub;
  if (sub && v === 'cafe') ui.cSub = sub;
  SFX.tap();
  renderView();
  try { history.replaceState(null, '', '#' + (v === 'kitchen' && ui.kSub === 'book' ? 'recipes' : v === 'cafe' && ui.cSub === 'book' ? 'menu' : v)); } catch (e) { /* sandboxed */ }
}
function renderView() {
  ['grow', 'kitchen', 'cafe'].forEach(v => {
    $('v-' + v).hidden = v !== ui.view;
    $('nav-' + v).setAttribute('aria-selected', String(v === ui.view));
  });
  if (ui.view === 'grow') renderGrow();
  if (ui.view === 'kitchen') {
    $('k-sub-create').setAttribute('aria-selected', String(ui.kSub === 'create'));
    $('k-sub-book').setAttribute('aria-selected', String(ui.kSub === 'book'));
    $('kitchenCreate').hidden = ui.kSub !== 'create';
    $('kitchenBook').hidden = ui.kSub !== 'book';
    if (ui.kSub === 'create') { renderDish(); renderKitchenTools(); } else renderBook('dish');
    $('kBookCount').textContent = `${MP.gallery.list('dish', state.mine).length} recipes`;
  }
  if (ui.view === 'cafe') {
    $('c-sub-create').setAttribute('aria-selected', String(ui.cSub === 'create'));
    $('c-sub-book').setAttribute('aria-selected', String(ui.cSub === 'book'));
    $('cafeCreate').hidden = ui.cSub !== 'create';
    $('cafeBook').hidden = ui.cSub !== 'book';
    if (ui.cSub === 'create') { renderDrink(); renderCafeTools(); } else renderBook('drink');
    $('cBookCount').textContent = `${MP.gallery.list('drink', state.mine).length} drinks`;
  }
}
window.addEventListener('hashchange', () => {
  const h = (location.hash || '').slice(1);
  if (!HASH[h] || (HASH[h] === ui.view && h !== 'recipes' && h !== 'menu')) return;
  ui.view = HASH[h];
  if (h === 'recipes') ui.kSub = 'book';
  if (h === 'menu') ui.cSub = 'book';
  renderView();
});
document.querySelectorAll('.nav [data-view]').forEach(b => b.onclick = () => setView(b.dataset.view));
document.querySelectorAll('#v-kitchen .subnav [data-sub]').forEach(b => b.onclick = () => setView('kitchen', b.dataset.sub));
document.querySelectorAll('#v-cafe .subnav [data-sub]').forEach(b => b.onclick = () => setView('cafe', b.dataset.sub));

function renderSound() {
  const b = $('soundBtn');
  b.innerHTML = state.sound ? ICON.on : ICON.off;
  b.setAttribute('aria-pressed', String(state.sound));
  b.setAttribute('aria-label', state.sound ? 'Sound on' : 'Sound off');
}
$('soundBtn').onclick = () => { state.sound = !state.sound; save(); renderSound(); SFX.tap(); };

/* ---------- Boot ---------- */
(function boot() {
  const away = (Date.now() - state.room.lastTick) / 60000;
  const before = state.slots.map(p => p ? p.growth : 0);
  advance();
  lastStages = state.slots.map(p => p ? A.stageOf(p.growth) : -1);
  save();
  const h = (location.hash || '').slice(1);
  if (HASH[h]) { ui.view = HASH[h]; if (h === 'recipes') ui.kSub = 'book'; if (h === 'menu') ui.cSub = 'book'; }
  renderSound();
  renderView();
  if (away > 10 && state.slots.some(Boolean)) {
    const grew = state.slots.reduce((a, p, i) => a + (p ? p.growth - before[i] : 0), 0);
    const ready = state.slots.filter(p => p && p.growth >= MAX).length;
    toast(`Welcome back. Your rack grew ${Math.round(grew / 10)}% while you were away${ready ? `, and ${ready} block${ready > 1 ? 's are' : ' is'} ready to harvest` : ''}.`, 7000);
  }
  MP.gallery.init().then(() => renderView());
  let n = 0;
  setInterval(() => {
    advance();
    const ch = stageCheck();
    announce(ch);
    if (ui.view === 'grow') {
      renderGrowTop();
      if (ch.length || n % 15 === 0) { renderRack(); if (!document.activeElement || !$('growTools').contains(document.activeElement) || ch.length) renderGrowTools(); }
    }
    if (++n % 10 === 0) save();
  }, 1000);
  document.addEventListener('visibilitychange', () => { if (document.hidden) { advance(); save(); } });
  window.addEventListener('pagehide', () => { advance(); save(); });
})();

/* Testing hook: MP.debug.setGrowth(slot, points) */
MP.debug = {
  setGrowth(i, g) { const p = state.slots[i]; if (!p) return; p.growth = clamp(g, 0, MAX); announce(stageCheck()); save(); renderView(); },
  state: () => state,
};

})(window.MP = window.MP || {});
