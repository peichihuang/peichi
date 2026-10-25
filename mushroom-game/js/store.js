/* Moshruum Patch: saved progress and the shared recipe gallery. */
(function (MP) {
'use strict';

const C = MP.config;

/* ---------- Saved progress (this browser only) ---------- */
function blank() {
  return {
    v: 2,
    slots: [null, null, null, null],
    room: { rh: 92, co2: 650, lastTick: Date.now() },
    pantry: { blue: { g: 200, n: 0, gift: true }, lions: { g: 250, n: 0, gift: true } },
    log: [],
    planted: 0,
    gilded: 0,
    sound: true,
    intro: true,
    kitchen: JSON.parse(JSON.stringify(MP.farmRecipes[0].comp)), // starts with a sample plate from the welcome box
    cafe: { cup: 'mug', temp: 'hot', base: 'espresso', milk: 'oat', mush: ['morning'], sweet: 'none', finish: ['art'], surface: 'walnut' },
    mine: [],
  };
}
function migrate(old) {
  const s = blank();
  if (old && old.v === 1) {
    if (old.plant) s.slots[0] = Object.assign({ gilded: !!old.plant.glow }, old.plant);
    (old.harvests || []).forEach(h => {
      const p = s.pantry[h.species] || (s.pantry[h.species] = { g: 0, n: 0 });
      p.g += h.grams; p.n += 1;
      s.log.push({ species: h.species, name: h.name, grams: h.grams, gilded: false, date: h.date });
    });
    s.planted = (old.harvests || []).length + (old.plant ? 1 : 0);
    s.sound = old.sound !== false;
  }
  return s;
}
MP.load = function () {
  try {
    const raw = localStorage.getItem(C.storeKey);
    if (raw) {
      const s = JSON.parse(raw);
      if (s && s.v === 2) {
        const b = blank();
        const out = Object.assign(b, s);
        out.slots = [0, 1, 2, 3].map(i => (s.slots && s.slots[i]) || null);
        if (!MP.cups[out.cafe.cup]) out.cafe.cup = 'mug'; // the ceramic cup was retired: all drinks are in glass now
        const known = id => Object.prototype.hasOwnProperty.call(MP.species, id); // Nameko was retired
        out.slots = out.slots.map(p => (p && known(p.species) ? p : null));
        Object.keys(out.pantry).forEach(id => { if (!known(id)) delete out.pantry[id]; });
        out.log = (out.log || []).filter(h => known(h.species));
        return out;
      }
    }
    const v1 = localStorage.getItem('moshruum-patch-v1');
    if (v1) return migrate(JSON.parse(v1));
  } catch (e) { /* storage unavailable */ }
  return blank();
};
MP.save = function (state) {
  try { localStorage.setItem(C.storeKey, JSON.stringify(state)); } catch (e) { /* storage unavailable */ }
};

/* ---------- Gallery ----------
   Three ways to keep shared recipes, picked automatically:
   1. Inside Claude (the preview): the artifact's shared database.
   2. On your website with Supabase configured: a "recipes" table.
   3. Otherwise: farm recipes plus the visitor's own, on their device. */
const LIMITS = { title: 60, author: 30, notes: 1200 };
const has = (o, k) => typeof k === 'string' && Object.prototype.hasOwnProperty.call(o, k);
const num = (v, d) => (Number.isFinite(+v) ? +v : d);
/* Shared recipes come from other people: keep only known ids and plain numbers. */
function normComp(kind, c) {
  if (kind === 'dish') {
    return {
      plate: has(MP.plates, c.plate) ? c.plate : 'stone',
      surface: has(MP.surfaces, c.surface) ? c.surface : 'stone',
      method: has(MP.methods, c.method) ? c.method : 'raw',
      items: (Array.isArray(c.items) ? c.items : []).slice(0, 40)
        .filter(it => it && (has(MP.species, it.t) && MP.culinary.includes(it.t) || has(MP.ingredients, it.t)))
        .map(it => ({ t: it.t, x: num(it.x, 200), y: num(it.y, 200), r: num(it.r, 0), s: num(it.s, 1) })),
    };
  }
  const arr = (a, ok) => (Array.isArray(a) ? a.filter(x => typeof x === 'string' && ok(x)) : []);
  const isMush = x => MP.products.some(p => p.id === x) || (has(MP.species, x) && !!MP.species[x].powder);
  return {
    cup: has(MP.cups, c.cup) ? c.cup : 'mug',
    temp: c.temp === 'iced' ? 'iced' : 'hot',
    base: has(MP.bases, c.base) ? c.base : 'espresso',
    milk: has(MP.milks, c.milk) ? c.milk : 'none',
    mush: arr(c.mush, isMush).slice(0, 2),
    sweet: has(MP.sweets, c.sweet) ? c.sweet : 'none',
    finish: arr(c.finish, x => has(MP.finishes, x)),
    surface: has(MP.surfaces, c.surface) ? c.surface : 'stone',
  };
}
/* A cover photo must be an image in this folder or on an https address. */
function cleanCover(c) {
  if (typeof c !== 'string' || !c) return '';
  return /^(https:\/\/[^\s"'<>()]+|covers\/[\w.-]+\.(jpe?g|png|webp))$/i.test(c) ? c : '';
}
function clean(e) {
  if (!e || (e.kind !== 'dish' && e.kind !== 'drink') || typeof e.comp !== 'object' || !e.comp) return null;
  return {
    tags: e.kind === 'dish' && Array.isArray(e.tags) ? e.tags.filter(t => has(MP.courses, t)).slice(0, 6) : [],
    featured: !!e.featured,
    cover: cleanCover(e.cover),
    id: String(e.id || ''),
    kind: e.kind,
    title: String(e.title || 'Untitled').slice(0, LIMITS.title),
    author: String(e.author || '').slice(0, LIMITS.author),
    notes: String(e.notes || '').slice(0, LIMITS.notes),
    comp: normComp(e.kind, e.comp),
    created: Number(e.created) || 0,
    farm: !!e.farm,
  };
}

const gallery = {
  mode: 'local',
  remote: [],
  listeners: new Set(),
  db: null,
  owner: false,
  picks: {}, // premium picks made in the game: { entryId: true | false }
  async init() {
    try {
      if (window.claude && typeof window.claude.use === 'function') {
        const db = await window.claude.use('db');
        if (db) {
          this.db = db;
          this.mode = 'artifact';
          db.collection('recipes').orderBy('created', 'desc').limit(200).onSnapshot(snap => {
            this.remote = snap.docs.map(d => clean(Object.assign({ id: d.id }, d.data()))).filter(Boolean);
            this.emit();
          }, () => { this.mode = 'local'; this.emit(); });
          db.collection('featured').onSnapshot(snap => {
            this.picks = {};
            snap.docs.forEach(d => { this.picks[d.id] = !!(d.data() || {}).on; });
            this.emit();
          }, () => {});
          try { const user = await window.claude.use('user'); this.owner = user ? !!(await user.isOwner()) : false; } catch (e) { this.owner = false; }
          this.emit();
          return;
        }
      }
    } catch (e) { /* not inside Claude */ }
    if (C.supabaseUrl && C.supabaseKey) {
      this.mode = 'supabase';
      await this.refresh();
    }
  },
  headers() {
    return { apikey: C.supabaseKey, Authorization: 'Bearer ' + C.supabaseKey, 'Content-Type': 'application/json' };
  },
  async refresh() {
    if (this.mode !== 'supabase') return;
    try {
      const q = `${C.supabaseUrl}/rest/v1/recipes?select=id,kind,title,author,notes,comp,created,tags,featured,cover&order=created.desc&limit=200${C.galleryNeedsApproval ? '&approved=eq.true' : ''}`;
      const res = await fetch(q, { headers: this.headers() });
      if (res.ok) { this.remote = (await res.json()).map(clean).filter(Boolean); this.emit(); }
    } catch (e) { /* offline */ }
  },
  /* Returns 'shared', 'pending' (waiting for approval) or 'local'. */
  async add(entry) {
    const e = clean(entry);
    if (this.mode === 'artifact') {
      const ref = this.db.collection('recipes').doc(e.id);
      await ref.set({ kind: e.kind, title: e.title, author: e.author, notes: e.notes, comp: e.comp, created: e.created, tags: e.tags });
      return 'shared';
    }
    if (this.mode === 'supabase') {
      const res = await fetch(`${C.supabaseUrl}/rest/v1/recipes`, {
        method: 'POST',
        headers: Object.assign(this.headers(), { Prefer: 'return=minimal' }),
        body: JSON.stringify({ kind: e.kind, title: e.title, author: e.author, notes: e.notes, comp: e.comp, created: e.created, tags: e.tags }),
      });
      if (!res.ok) throw new Error('save failed');
      if (C.galleryNeedsApproval) return 'pending';
      await this.refresh();
      return 'shared';
    }
    return 'local';
  },
  list(kind, mine) {
    const seen = new Set();
    const out = [];
    const push = e => { if (e && e.kind === kind && !seen.has(e.id)) { seen.add(e.id); out.push(e); } };
    this.remote.forEach(push);
    (mine || []).map(clean).forEach(push);
    const farm = MP.farmRecipes.map(clean);
    farm.forEach(push);
    out.forEach(e => {
      const p = MP.premium.find(x => x.id === e.id);
      if (p) { e.featured = true; e.cover = e.cover || cleanCover(p.cover); }
      if (has(this.picks, e.id)) e.featured = this.picks[e.id];
    });
    return out.sort((a, b) => (b.farm ? 0 : 1) - (a.farm ? 0 : 1) || b.created - a.created);
  },
  /* Owner only, inside Claude: add a recipe to the premium section or take it out. */
  async setPremium(id, on) {
    if (this.mode !== 'artifact' || !this.owner) throw new Error('not allowed');
    await this.db.collection('featured').doc(id).set({ on, at: Date.now() });
  },
  on(fn) { this.listeners.add(fn); },
  emit() { this.listeners.forEach(fn => fn()); },
};
MP.gallery = gallery;
MP.cleanEntry = clean;

})(window.MP = window.MP || {});
