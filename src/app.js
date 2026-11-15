/* 1346 Russell Road renovation model: 3D viewer, editor and prompt interpreter. */
(function () {
'use strict';
const $ = (s) => document.querySelector(s);
const el = (tag, attrs, ...kids) => {
  const n = document.createElement(tag);
  for (const k in (attrs || {})) {
    if (k === 'class') n.className = attrs[k];
    else if (k === 'text') n.textContent = attrs[k];
    else if (k.startsWith('on')) n.addEventListener(k.slice(2), attrs[k]);
    else if (attrs[k] !== false && attrs[k] != null) n.setAttribute(k, attrs[k]);
  }
  kids.flat().forEach((c) => c != null && n.append(c));
  return n;
};
const clone = (o) => JSON.parse(JSON.stringify(o));
const r2 = (v) => Math.round(v * 100) / 100;
const snap = (v, s) => Math.round(v / (s || 0.25)) * (s || 0.25);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const ftin = (v) => { const i = Math.round(v * 12); return Math.floor(i / 12) + "'" + (i % 12 ? (i % 12) + '"' : ''); };

/* ---------- catalogues ---------- */
const FLOORS = {
  oak: { label: 'Oak hardwood', kind: 'plank', c: ['#b98a56', '#a97b49', '#c49a66'], pw: 0.33, pl: 4 },
  wide_oak: { label: 'Wide-plank oak', kind: 'plank', c: ['#c9a678', '#bd9a6b', '#d3b388'], pw: 0.66, pl: 7 },
  walnut: { label: 'Walnut', kind: 'plank', c: ['#5e4130', '#6b4a36', '#54392a'], pw: 0.42, pl: 5 },
  maple: { label: 'Maple', kind: 'plank', c: ['#e2c9a0', '#d9be93', '#e8d2ad'], pw: 0.33, pl: 4 },
  fir: { label: 'Douglas fir', kind: 'plank', c: ['#c98a52', '#c07f47', '#d2955e'], pw: 0.27, pl: 8 },
  whitewash: { label: 'Whitewashed plank', kind: 'plank', c: ['#ddd6c8', '#d3ccbd', '#e5dfd2'], pw: 0.5, pl: 6 },
  grey_vinyl: { label: 'Grey vinyl plank', kind: 'plank', c: ['#9a9790', '#8e8b85', '#a5a29b'], pw: 0.58, pl: 4 },
  parquet: { label: 'Parquet', kind: 'parquet', c: ['#b2824f', '#a37443', '#bf9160'] },
  linoleum: { label: 'Sheet linoleum', kind: 'tile', c: ['#d3ccb8', '#cdc5b0'], size: 1, grout: '#c2baa5' },
  white_tile: { label: 'White porcelain tile', kind: 'tile', c: ['#eeeeea', '#e8e8e3'], size: 2, grout: '#c9c9c2' },
  slate: { label: 'Slate tile', kind: 'tile', c: ['#4c5357', '#565d61', '#444b4f'], size: 2, grout: '#34393c' },
  terracotta: { label: 'Terracotta tile', kind: 'tile', c: ['#b9623f', '#c26e49', '#ad5837'], size: 1, grout: '#8f7b6a' },
  checker: { label: 'Black and white checker', kind: 'checker', c: ['#f0efea', '#24272a'], size: 1, grout: '#8a8a86' },
  marble: { label: 'Marble tile', kind: 'tile', c: ['#ecebe8', '#e4e3e0', '#f2f1ee'], size: 2, grout: '#d2d1cd', vein: true },
  hex: { label: 'Small hex tile', kind: 'hex', c: ['#e9e8e3', '#dedcd6'], grout: '#aeada7' },
  concrete: { label: 'Concrete', kind: 'noise', c: ['#a5a5a0', '#9c9c97'] },
  polished_concrete: { label: 'Polished concrete', kind: 'noise', c: ['#bdbcb6', '#b4b3ad'] },
  carpet_oat: { label: 'Oatmeal carpet', kind: 'noise', c: ['#c8bda8', '#bfb49f'], fine: true },
  carpet_grey: { label: 'Grey carpet', kind: 'noise', c: ['#8f9296', '#878a8e'], fine: true },
  cork: { label: 'Cork', kind: 'noise', c: ['#b58a5a', '#a67c4e'], fine: true }
};
const PAINTS = { white: '#f3f1ea', 'warm white': '#efe9dc', cream: '#ece2c9', sage: '#a9b8a0', 'forest green': '#3f5e4b', green: '#6f9273', navy: '#27374d', blue: '#7d9bb5', 'sky blue': '#b3cddd', teal: '#3e7c7b', charcoal: '#3c4043', grey: '#b5b6b3', gray: '#b5b6b3', 'light grey': '#d7d8d5', greige: '#cfc7b8', beige: '#dccfb6', taupe: '#b3a594', terracotta: '#c0704d', blush: '#e3c3b8', pink: '#e6b9c0', yellow: '#ead48a', mustard: '#c9a13b', black: '#232526', red: '#a8443a', plum: '#6b4460', lavender: '#bfb5d6', cedar: '#a8683f' };
const FIX = {
  counter: { label: 'Counter', w: 6, d: 2.1, color: '#e7e3d8', top: '#5d5f5d' },
  island: { label: 'Kitchen island', w: 6, d: 3, color: '#3f5e4b', top: '#e9e6df' },
  upper_cabinet: { label: 'Upper cabinets', w: 6, d: 1.1, color: '#e7e3d8' },
  fridge: { label: 'Fridge', w: 3, d: 2.5 },
  range: { label: 'Range', w: 2.5, d: 2.2 },
  vanity: { label: 'Vanity', w: 4, d: 1.8, color: '#e7e3d8', top: '#f1f0ec', sink: true },
  tub: { label: 'Bathtub', w: 5, d: 2.6 },
  shower: { label: 'Walk-in shower', w: 4, d: 3 },
  toilet: { label: 'Toilet', w: 1.5, d: 2.3 },
  washer: { label: 'Washer', w: 2.3, d: 2.4 },
  dryer: { label: 'Dryer', w: 2.3, d: 2.4 },
  cabinet: { label: 'Tall cabinet', w: 3, d: 1.5, h: 7, color: '#e7e3d8' },
  fireplace: { label: 'Fireplace', w: 4.2, d: 3.3 },
  hearth: { label: 'Hearth', w: 6, d: 1.6 },
  woodstove: { label: 'Wood stove', w: 2.2, d: 2 },
  bed: { label: 'Bed', w: 5, d: 6.7 },
  sofa: { label: 'Sofa', w: 7, d: 3 },
  table: { label: 'Table', w: 6, d: 3.2 },
  desk: { label: 'Desk', w: 5, d: 2.3 },
  box: { label: 'Block', w: 2, d: 2, h: 3, color: '#b9b6ad' }
};
const OPEN = {
  door: { label: 'Hinged door', w: 2.67, h: 6.67, sill: 0 },
  bifold: { label: 'Bifold doors', w: 4, h: 6.67, sill: 0 },
  slider: { label: 'Sliding glass door', w: 6, h: 6.67, sill: 0 },
  french: { label: 'French doors', w: 5, h: 6.67, sill: 0 },
  pocket: { label: 'Pocket door', w: 2.5, h: 6.67, sill: 0 },
  opening: { label: 'Cased opening', w: 4, h: 6.8, sill: 0 },
  window: { label: 'Window', w: 4, h: 4, sill: 2.75 },
  garage: { label: 'Overhead door', w: 9, h: 7, sill: 0 }
};

/* ---------- state ---------- */
const STORE_KEY = 'russell1346.plan.v1';
let model = clone(AS_BUILT);
let log = [];
let undoStack = [], redoStack = [];
let selected = null;           // {kind:'room'|'wall'|'opening'|'fixture', id}
let view = 'doll';
let cutLow = false, showLabels = true;
let tool = null;               // {type:'wall', p0}
let db = null, sample = null, saveTimer = null, saving = false, saveAgain = false, remoteLoaded = false;

/* ---------- geometry helpers ---------- */
const wallById = (id, m) => (m || model).walls.find((w) => w.id === id);
const roomById = (id, m) => (m || model).rooms.find((r) => r.id === id);
const wlen = (w) => Math.hypot(w.b[0] - w.a[0], w.b[1] - w.a[1]);
function polyArea(p) { let s = 0; for (let i = 0; i < p.length; i++) { const a = p[i], b = p[(i + 1) % p.length]; s += a[0] * b[1] - b[0] * a[1]; } return Math.abs(s) / 2; }
function inPoly(x, y, p) { let c = false; for (let i = 0, j = p.length - 1; i < p.length; j = i++) { const xi = p[i][0], yi = p[i][1], xj = p[j][0], yj = p[j][1]; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c; } return c; }
function bbox(p) { const xs = p.map((q) => q[0]), ys = p.map((q) => q[1]); return { x0: Math.min(...xs), x1: Math.max(...xs), y0: Math.min(...ys), y1: Math.max(...ys) }; }
function roomAt(x, y, m) { m = m || model; let best = null, ba = 1e9; for (const r of m.rooms) { if (inPoly(x, y, r.poly)) { const a = polyArea(r.poly); if (a < ba) { ba = a; best = r; } } } return best; }
function roomCentre(r) { if (r.label) return r.label; const b = bbox(r.poly); return [(b.x0 + b.x1) / 2, (b.y0 + b.y1) / 2]; }
function wallFrame(w) { const L = wlen(w) || 0.001; const ux = (w.b[0] - w.a[0]) / L, uy = (w.b[1] - w.a[1]) / L; return { L, ux, uy, nx: -uy, ny: ux }; }
function sideRoom(w, s, side, m) { const f = wallFrame(w); const o = (w.t / 2 + 0.2) * side; return roomAt(w.a[0] + f.ux * s + f.nx * o, w.a[1] + f.uy * s + f.ny * o, m); }
function wallRooms(w, m) { const f = wallFrame(w), set = new Set(); for (let s = 0.3; s < f.L; s += 0.5) for (const sd of [1, -1]) { const r = sideRoom(w, s, sd, m); if (r) set.add(r.id); } return set; }
function uid(prefix, list) { let i = 1; while (list.some((o) => o.id === prefix + i)) i++; return prefix + i; }
function toHex(c, def) {
  if (!c) return def; c = String(c).trim().toLowerCase();
  if (/^#[0-9a-f]{6}$/.test(c)) return c;
  if (/^#[0-9a-f]{3}$/.test(c)) return '#' + c.slice(1).split('').map((x) => x + x).join('');
  return PAINTS[c] || def;
}

/* ---------- operations (the one way the model changes) ---------- */
function resolveRooms(m, ref) {
  if (Array.isArray(ref)) return ref.flatMap((x) => resolveRooms(m, x));
  const s = String(ref || '').toLowerCase().trim();
  if (!s) throw new Error('No room given');
  if (s === 'all' || s === 'house' || s === 'everywhere') return m.rooms.filter((r) => !r.outdoor && r.id !== 'workshop');
  const hit = m.rooms.filter((r) => r.id.toLowerCase() === s || r.name.toLowerCase() === s);
  if (hit.length) return hit;
  const loose = m.rooms.filter((r) => r.name.toLowerCase().includes(s) || s.includes(r.name.toLowerCase()));
  if (loose.length) return loose;
  throw new Error('No room called "' + ref + '"');
}
const num = (v, def, lo, hi) => { v = Number(v); if (!isFinite(v)) v = def; return clamp(v, lo, hi); };
function fitOpening(m, o) {
  const w = wallById(o.wall, m); if (!w) throw new Error('No wall "' + o.wall + '"');
  const L = wlen(w);
  o.w = clamp(o.w, 1, Math.max(1, L - 0.4));
  o.pos = clamp(o.pos, o.w / 2 + 0.2, L - o.w / 2 - 0.2);
  o.sill = clamp(o.sill || 0, 0, m.wallHeight - 1);
  o.h = clamp(o.h, 1, m.wallHeight - o.sill - 0.3);
}
function applyOp(m, op) {
  const t = op.op;
  if (t === 'set_floor') {
    const key = String(op.material || '').toLowerCase().replace(/[\s-]+/g, '_');
    if (!FLOORS[key]) throw new Error('Unknown flooring "' + op.material + '"');
    const rs = resolveRooms(m, op.room); rs.forEach((r) => { r.floor = key; });
    return FLOORS[key].label + ' in ' + rs.map((r) => r.name).join(', ');
  }
  if (t === 'set_wall_color') {
    const c = toHex(op.color); if (!c) throw new Error('Unknown colour "' + op.color + '"');
    const rs = resolveRooms(m, op.room); rs.forEach((r) => { r.wallColor = c; });
    return 'Painted ' + rs.map((r) => r.name).join(', ') + ' ' + op.color;
  }
  if (t === 'set_siding') { const c = toHex(op.color); if (!c) throw new Error('Unknown colour'); m.siding = c; return 'Exterior colour changed'; }
  if (t === 'set_wall_height') { m.wallHeight = num(op.height, 8, 7, 14); m.openings.forEach((o) => fitOpening(m, o)); return 'Wall height ' + ftin(m.wallHeight); }
  if (t === 'add_opening') {
    const type = OPEN[op.type] ? op.type : 'door', d = OPEN[type];
    const o = { id: op.id && !m.openings.some((x) => x.id === op.id) ? String(op.id) : uid(type + '_', m.openings), wall: String(op.wall), type, pos: num(op.pos, 2, 0, 500), w: num(op.w, d.w, 1, 40), h: num(op.h, d.h, 1, 14), sill: num(op.sill, d.sill, 0, 12) };
    if (op.panes) o.panes = num(op.panes, 1, 1, 8);
    if (op.swing) o.swing = op.swing === 'left' ? 'left' : 'right';
    fitOpening(m, o);
    const w = wallById(o.wall, m); if (w.ext && type !== 'window') o.exterior = true;
    const clash = m.openings.filter((x) => x.wall === o.wall && Math.abs(x.pos - o.pos) < (x.w + o.w) / 2);
    m.openings = m.openings.filter((x) => !clash.includes(x));
    m.openings.push(o); return 'Added ' + d.label.toLowerCase() + ' (' + ftin(o.w) + ' wide)' + (clash.length ? ', replacing ' + clash.map((x) => 'the ' + OPEN[x.type].label.toLowerCase()).join(' and ') + ' that was there' : '');
  }
  if (t === 'update_opening') {
    const o = m.openings.find((x) => x.id === op.id); if (!o) throw new Error('No opening "' + op.id + '"');
    if (op.wall) o.wall = String(op.wall);
    if (op.type && OPEN[op.type]) { o.type = op.type; if (op.sill == null && op.type !== 'window') o.sill = 0; if (op.h == null && op.type !== 'window') o.h = OPEN[op.type].h; }
    ['pos', 'w', 'h', 'sill', 'panes'].forEach((k) => { if (op[k] != null) o[k] = num(op[k], o[k], 0, 500); });
    if (op.swing) o.swing = op.swing === 'left' ? 'left' : 'right';
    fitOpening(m, o); return 'Changed ' + OPEN[o.type].label.toLowerCase();
  }
  if (t === 'remove_opening') {
    const i = m.openings.findIndex((x) => x.id === op.id); if (i < 0) throw new Error('No opening "' + op.id + '"');
    const o = m.openings.splice(i, 1)[0]; return 'Removed ' + OPEN[o.type].label.toLowerCase() + ' and filled the wall';
  }
  if (t === 'add_wall') {
    const a = [num(op.a && op.a[0], 0, -200, 300), num(op.a && op.a[1], 0, -200, 300)], b = [num(op.b && op.b[0], 0, -200, 300), num(op.b && op.b[1], 0, -200, 300)];
    if (Math.hypot(b[0] - a[0], b[1] - a[1]) < 0.5) throw new Error('Wall is too short');
    const w = { id: op.id && !wallById(op.id, m) ? String(op.id) : uid('w_new', m.walls), a, b, t: num(op.t, 0.4, 0.2, 1) };
    if (op.ext) w.ext = true;
    m.walls.push(w); return 'Added a ' + ftin(wlen(w)) + ' wall';
  }
  if (t === 'update_wall') {
    const w = wallById(op.id, m); if (!w) throw new Error('No wall "' + op.id + '"');
    if (op.a) w.a = [num(op.a[0], w.a[0], -200, 300), num(op.a[1], w.a[1], -200, 300)];
    if (op.b) w.b = [num(op.b[0], w.b[0], -200, 300), num(op.b[1], w.b[1], -200, 300)];
    if (op.t != null) w.t = num(op.t, w.t, 0.2, 1);
    m.openings.filter((o) => o.wall === w.id).forEach((o) => fitOpening(m, o));
    return 'Moved a wall';
  }
  if (t === 'remove_wall') {
    const i = m.walls.findIndex((x) => x.id === op.id); if (i < 0) throw new Error('No wall "' + op.id + '"');
    const w = m.walls.splice(i, 1)[0]; m.openings = m.openings.filter((o) => o.wall !== w.id);
    return 'Removed a ' + ftin(wlen(w)) + ' ' + (w.ext ? 'exterior ' : '') + 'wall';
  }
  if (t === 'add_room' || t === 'update_room') {
    let r = t === 'update_room' ? resolveRooms(m, op.id || op.room)[0] : null;
    if (!r) { r = { id: op.id && !roomById(op.id, m) ? String(op.id) : uid('room', m.rooms), name: 'Room', floor: 'oak', poly: [] }; m.rooms.push(r); }
    if (op.name) r.name = String(op.name).slice(0, 40);
    if (op.poly) { if (!Array.isArray(op.poly) || op.poly.length < 3) throw new Error('A room outline needs 3 or more points'); r.poly = op.poly.map((p) => [num(p[0], 0, -200, 300), num(p[1], 0, -200, 300)]); delete r.label; }
    if (op.floor && FLOORS[op.floor]) r.floor = op.floor;
    if (op.wallColor) r.wallColor = toHex(op.wallColor, r.wallColor);
    if (r.poly.length < 3) { m.rooms.splice(m.rooms.indexOf(r), 1); throw new Error('A new room needs an outline'); }
    return (t === 'add_room' ? 'Added room ' : 'Updated ') + r.name;
  }
  if (t === 'remove_room') { const r = resolveRooms(m, op.id || op.room)[0]; m.rooms.splice(m.rooms.indexOf(r), 1); return 'Removed the ' + r.name + ' floor area'; }
  if (t === 'add_fixture') {
    const type = FIX[op.type] ? op.type : 'box', d = FIX[type];
    const f = { id: op.id && !m.fixtures.some((x) => x.id === op.id) ? String(op.id) : uid(type + '_', m.fixtures), type, x: num(op.x, 0, -200, 300), y: num(op.y, 0, -200, 300), w: num(op.w, d.w, 0.3, 60), d: num(op.d, d.d, 0.3, 60), facing: 'nsew'.includes(op.facing) && op.facing ? op.facing : 's' };
    if (op.h != null) f.h = num(op.h, 3, 0.1, 14);
    ['color', 'top'].forEach((k) => { if (op[k]) f[k] = toHex(op[k]); });
    ['sink', 'cooktop'].forEach((k) => { if (op[k]) f[k] = true; });
    if (op.label) f.label = String(op.label).slice(0, 40);
    m.fixtures.push(f); return 'Added ' + (f.label || d.label).toLowerCase();
  }
  if (t === 'update_fixture') {
    const f = m.fixtures.find((x) => x.id === op.id); if (!f) throw new Error('No fixture "' + op.id + '"');
    ['x', 'y'].forEach((k) => { if (op[k] != null) f[k] = num(op[k], f[k], -200, 300); });
    ['w', 'd'].forEach((k) => { if (op[k] != null) f[k] = num(op[k], f[k], 0.3, 60); });
    if (op.h != null) f.h = num(op.h, 3, 0.1, 14);
    if (op.facing && 'nsew'.includes(op.facing)) f.facing = op.facing;
    if (op.type && FIX[op.type]) f.type = op.type;
    ['color', 'top'].forEach((k) => { if (op[k]) f[k] = toHex(op[k], f[k]); });
    ['sink', 'cooktop'].forEach((k) => { if (op[k] != null) f[k] = !!op[k]; });
    if (op.label) f.label = String(op.label).slice(0, 40);
    return 'Changed ' + (f.label || FIX[f.type].label).toLowerCase();
  }
  if (t === 'remove_fixture') {
    const i = m.fixtures.findIndex((x) => x.id === op.id); if (i < 0) throw new Error('No fixture "' + op.id + '"');
    const f = m.fixtures.splice(i, 1)[0]; return 'Removed ' + (f.label || FIX[f.type].label).toLowerCase();
  }
  throw new Error('Unknown change "' + t + '"');
}
/* Apply a batch as one undo step. Returns {done:[...], failed:[...]}. */
function commit(ops, title) {
  const before = JSON.stringify(model), m = clone(model), done = [], failed = [];
  (ops || []).forEach((op) => { try { done.push(applyOp(m, op)); } catch (e) { failed.push(e.message); } });
  if (!done.length) return { done, failed };
  undoStack.push({ model: before, log: JSON.stringify(log) }); if (undoStack.length > 60) undoStack.shift(); redoStack = [];
  model = m;
  log.unshift({ t: title || done[0], n: done.length, at: Date.now() }); if (log.length > 80) log.pop();
  if (selected && !findSel(selected)) selected = null;
  afterChange();
  return { done, failed };
}
function findSel(s) { const m = model; return s.kind === 'room' ? roomById(s.id) : s.kind === 'wall' ? wallById(s.id) : s.kind === 'opening' ? m.openings.find((o) => o.id === s.id) : m.fixtures.find((f) => f.id === s.id); }
function afterChange(skipPanel) { rebuild(); if (!skipPanel) renderPanel(); renderLog(); updateButtons(); scheduleSave(); }
function undo() { const s = undoStack.pop(); if (!s) return; redoStack.push({ model: JSON.stringify(model), log: JSON.stringify(log) }); model = JSON.parse(s.model); log = JSON.parse(s.log); selected = null; afterChange(); }
function redo() { const s = redoStack.pop(); if (!s) return; undoStack.push({ model: JSON.stringify(model), log: JSON.stringify(log) }); model = JSON.parse(s.model); log = JSON.parse(s.log); selected = null; afterChange(); }

/* ---------- three.js scene ---------- */
const canvas = $('#c'), stage = $('#stage'), labelsEl = $('#labels');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.localClippingEnabled = true;
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 600);
scene.add(new THREE.HemisphereLight(0xffffff, 0x8a8f86, 0.6));
const sun = new THREE.DirectionalLight(0xfff4e0, 0.55);
sun.position.set(-30, 70, 60); sun.target.position.set(27, 0, 25); sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, { left: -60, right: 60, top: 60, bottom: -60, near: 1, far: 220 });
sun.shadow.bias = -0.0008; scene.add(sun, sun.target);
const world = new THREE.Group(); scene.add(world);
const clipPlane = new THREE.Plane(new THREE.Vector3(0, -1, 0), 100);
let pickables = [], labelItems = [], selBox = null;
const texCache = {}, matCache = {};

function rng(seed) { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
function shade(hex, f) { const n = parseInt(hex.slice(1), 16); const ch = (v) => clamp(Math.round(v * f), 0, 255); return 'rgb(' + ch(n >> 16) + ',' + ch((n >> 8) & 255) + ',' + ch(n & 255) + ')'; }
function floorTexture(key) {
  if (texCache[key]) return texCache[key];
  const F = FLOORS[key] || FLOORS.oak, N = 512, S = 8, px = N / S; // canvas covers 8 ft square
  const cv = document.createElement('canvas'); cv.width = cv.height = N; const g = cv.getContext('2d'); const R = rng(key.length * 7919 + key.charCodeAt(0) * 31);
  const pick = () => F.c[Math.floor(R() * F.c.length)];
  if (F.kind === 'plank') {
    const rows = Math.max(2, Math.round(S / F.pw)), rh = N / rows, pl = F.pl * px;
    for (let r = 0; r < rows; r++) {
      let x = -R() * pl;
      while (x < N) {
        g.fillStyle = shade(pick(), 0.94 + R() * 0.12); g.fillRect(x, r * rh, pl, rh);
        g.strokeStyle = 'rgba(0,0,0,.05)'; for (let k = 0; k < 3; k++) { const yy = r * rh + R() * rh; g.beginPath(); g.moveTo(x, yy); g.lineTo(x + pl, yy + (R() - 0.5) * 3); g.stroke(); }
        g.fillStyle = 'rgba(0,0,0,.28)'; g.fillRect(x, r * rh, 1.2, rh); x += pl;
      }
      g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(0, r * rh, N, 1.2);
    }
  } else if (F.kind === 'parquet') {
    const c = N / 8, st = c / 4;
    for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) for (let k = 0; k < 4; k++) {
      g.fillStyle = shade(pick(), 0.94 + R() * 0.12);
      if ((i + j) % 2) g.fillRect(i * c + k * st, j * c, st - 0.8, c - 0.8); else g.fillRect(i * c, j * c + k * st, c - 0.8, st - 0.8);
    }
  } else if (F.kind === 'tile' || F.kind === 'checker') {
    const n = Math.round(S / F.size), c = N / n; g.fillStyle = F.grout; g.fillRect(0, 0, N, N);
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
      g.fillStyle = F.kind === 'checker' ? F.c[(i + j) % 2] : shade(pick(), 0.97 + R() * 0.06); g.fillRect(i * c + 1.2, j * c + 1.2, c - 2.4, c - 2.4);
      if (F.vein) { g.strokeStyle = 'rgba(120,120,125,.25)'; g.beginPath(); let vx = i * c + R() * c, vy = j * c; g.moveTo(vx, vy); for (let k = 0; k < 4; k++) { vx += (R() - 0.5) * c * 0.5; vy += c / 4; g.lineTo(clamp(vx, i * c + 2, i * c + c - 2), vy); } g.stroke(); }
    }
  } else if (F.kind === 'hex') {
    g.fillStyle = F.grout; g.fillRect(0, 0, N, N); const cols = 16, w = N / cols, rr = w / Math.sqrt(3), rowsH = 20, h = N / rowsH;
    for (let j = -1; j <= rowsH; j++) for (let i = -1; i <= cols; i++) {
      const cx = i * w + (j % 2 ? w / 2 : 0) + w / 2, cy = j * h + h / 2; g.fillStyle = pick(); g.beginPath();
      for (let k = 0; k < 6; k++) { const a = Math.PI / 6 + k * Math.PI / 3; g.lineTo(cx + Math.cos(a) * (rr - 1.3), cy + Math.sin(a) * (rr - 1.3) * (h / (rr * 1.5))); } g.closePath(); g.fill();
    }
  } else {
    g.fillStyle = F.c[0]; g.fillRect(0, 0, N, N); const dots = F.fine ? 9000 : 2600;
    for (let k = 0; k < dots; k++) { g.fillStyle = R() > 0.5 ? 'rgba(255,255,255,.07)' : 'rgba(0,0,0,.07)'; const s = F.fine ? 1.5 : 2 + R() * 7; g.fillRect(R() * N, R() * N, s, s); }
  }
  const t = new THREE.CanvasTexture(cv); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(1 / S, 1 / S); t.encoding = THREE.sRGBEncoding; t.anisotropy = 8;
  return (texCache[key] = t);
}
function mat(color, opts) {
  const k = color + JSON.stringify(opts || {});
  if (!matCache[k]) matCache[k] = new THREE.MeshStandardMaterial(Object.assign({ color, roughness: 0.85, metalness: 0 }, opts || {}));
  return matCache[k];
}
const clipped = (color, opts) => mat(color, Object.assign({ clippingPlanes: [clipPlane] }, opts || {}));
function box(parent, w, h, d, material, x, y, z, ud) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(Math.max(w, 0.01), Math.max(h, 0.01), Math.max(d, 0.01)), material);
  m.position.set(x, y + h / 2, z); m.castShadow = true; m.receiveShadow = true; parent.add(m);
  if (ud) { m.userData = ud; pickables.push(m); }
  return m;
}
function disposeGroup(g) { g.traverse((o) => { if (o.geometry) o.geometry.dispose(); }); while (g.children.length) g.remove(g.children[0]); }

function rebuild() {
  disposeGroup(world); pickables = []; labelsEl.textContent = ''; labelItems = [];
  const H = model.wallHeight, viewH = cutLow && view !== 'walk' ? 3.6 : H;
  clipPlane.constant = viewH + 0.001;
  // ground
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(600, 600), mat('#7f9471', { roughness: 1 }));
  ground.rotation.x = -Math.PI / 2; ground.position.set(27, -0.06, 25); ground.receiveShadow = true; world.add(ground);
  // floors (smaller rooms sit a hair higher so overlaps resolve)
  const rooms = model.rooms.slice().sort((a, b) => polyArea(b.poly) - polyArea(a.poly));
  rooms.forEach((r, i) => {
    const sh = new THREE.Shape(); r.poly.forEach((p, k) => (k ? sh.lineTo(p[0], -p[1]) : sh.moveTo(p[0], -p[1])));
    const geo = new THREE.ShapeGeometry(sh); geo.rotateX(-Math.PI / 2);
    const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map: floorTexture(r.floor), roughness: 0.8 }));
    m.position.y = 0.002 * (i + 1); m.receiveShadow = true; m.userData = { kind: 'room', id: r.id }; world.add(m); pickables.push(m);
    if (view === 'walk' && !r.outdoor) { const c = new THREE.Mesh(geo.clone(), new THREE.MeshBasicMaterial({ color: '#efede6', side: THREE.BackSide })); c.position.y = H; world.add(c); }
    const c = roomCentre(r), b = bbox(r.poly), d = el('div', { class: 'lbl' }, el('b', { text: r.name }), el('span', { text: ftin(b.x1 - b.x0 - 0.45) + ' × ' + ftin(b.y1 - b.y0 - 0.45) }));
    if (polyArea(r.poly) < 30) return;
    labelsEl.append(d); labelItems.push({ el: d, p: new THREE.Vector3(c[0], 0.4, c[1]) });
  });
  // walls
  const topM = mat('#2b3331', { roughness: 1 }), endM = mat('#d9d6cc');
  model.walls.forEach((w) => {
    const f = wallFrame(w), g = new THREE.Group();
    g.position.set(w.a[0], 0, w.a[1]); g.rotation.y = -Math.atan2(f.uy, f.ux); world.add(g);
    const ops = model.openings.filter((o) => o.wall === w.id).sort((a, b) => a.pos - b.pos);
    const s0 = -w.t / 2, s1 = f.L + w.t / 2;
    const cuts = new Set([s0, s1]);
    ops.forEach((o) => { cuts.add(clamp(o.pos - o.w / 2, s0, s1)); cuts.add(clamp(o.pos + o.w / 2, s0, s1)); });
    const sideColor = (s, sd) => { const r = sideRoom(w, clamp(s, 0.05, f.L - 0.05), sd); return !r || r.outdoor ? model.siding : (r.wallColor || '#f1eee6'); };
    let prev = null;
    for (let s = 0.125; s < f.L; s += 0.25) { const key = sideColor(s, 1) + sideColor(s, -1); if (prev !== null && key !== prev) cuts.add(s - 0.125); prev = key; }
    const cs = [...cuts].sort((a, b) => a - b), ud = { kind: 'wall', id: w.id };
    for (let i = 0; i < cs.length - 1; i++) {
      const a = cs[i], b = cs[i + 1]; if (b - a < 0.01) continue;
      const mid = (a + b) / 2, o = ops.find((q) => mid > q.pos - q.w / 2 && mid < q.pos + q.w / 2);
      const mats = [endM, endM, topM, endM, mat(sideColor(mid, 1)), mat(sideColor(mid, -1))];
      const piece = (y0, y1) => { y1 = Math.min(y1, viewH); if (y1 - y0 > 0.02) box(g, b - a, y1 - y0, w.t, mats, mid, y0, 0, ud); };
      if (!o) piece(0, H); else { piece(0, o.sill); piece(o.sill + o.h, H); }
    }
    ops.forEach((o) => buildOpening(g, w, o));
  });
  model.fixtures.forEach(buildFixture);
  // selection outline
  selBox = null;
  if (selected) {
    const b3 = new THREE.Box3(); let any = false;
    world.traverse((o) => { if (o.isMesh && o.userData.kind === selected.kind && o.userData.id === selected.id) { b3.expandByObject(o); any = true; } });
    if (any) { b3.expandByScalar(0.06); if (selected.kind === 'room') { b3.max.y = 0.25; } selBox = new THREE.Box3Helper(b3, 0xf59e0b); selBox.material.depthTest = false; selBox.renderOrder = 9; world.add(selBox); }
  }
  if (tool && tool.p0) { const s = new THREE.Mesh(new THREE.SphereGeometry(0.35, 12, 8), mat('#f59e0b')); s.position.set(tool.p0[0], 0.4, tool.p0[1]); world.add(s); }
}

function buildOpening(g, w, o) {
  const ud = { kind: 'opening', id: o.id }, t = w.t, fr = clipped('#f6f4ee'), y0 = o.sill, x0 = o.pos - o.w / 2, x1 = o.pos + o.w / 2, d = t + 0.12, j = 0.12;
  const glass = clipped('#bcd9e6', { transparent: true, opacity: 0.35, roughness: 0.1 });
  const frame = (sillPiece) => { box(g, j, o.h, d, fr, x0 + j / 2, y0, 0, ud); box(g, j, o.h, d, fr, x1 - j / 2, y0, 0, ud); box(g, o.w, j, d, fr, o.pos, y0 + o.h - j, 0, ud); if (sillPiece) box(g, o.w + 0.2, j, d + 0.15, fr, o.pos, y0, 0, ud); };
  // invisible-ish pick slab so the gap itself is selectable
  const pick = box(g, o.w, o.h, t * 0.6, clipped('#ffffff', { transparent: true, opacity: 0, depthWrite: false }), o.pos, y0, 0, ud); pick.castShadow = false;
  if (o.type === 'window') {
    frame(true); const p = box(g, o.w - 2 * j, o.h - 2 * j, 0.05, glass, o.pos, y0 + j, 0); p.castShadow = false;
    const n = Math.max(1, Math.round(o.panes || 1)); for (let k = 1; k < n; k++) box(g, 0.1, o.h - 2 * j, d * 0.7, fr, x0 + (o.w * k) / n, y0 + j, 0, ud);
  } else if (o.type === 'opening') { frame(false);
  } else if (o.type === 'slider' || o.type === 'french') {
    frame(false); const p = box(g, o.w - 2 * j, o.h - j, 0.05, glass, o.pos, y0, 0); p.castShadow = false;
    box(g, 0.14, o.h - j, d * 0.6, fr, o.pos, y0, 0, ud); box(g, o.w - 2 * j, 0.25, 0.1, fr, o.pos, y0, 0, ud);
    if (o.type === 'french') [x0 + o.w * 0.25, x0 + o.w * 0.75].forEach((x) => box(g, 0.08, o.h - j, 0.08, fr, x, y0, 0));
  } else if (o.type === 'garage') {
    frame(false); for (let k = 0; k < 4; k++) box(g, o.w - 2 * j, (o.h - j) / 4 - 0.04, 0.15, clipped('#dcd9d0'), o.pos, y0 + (k * (o.h - j)) / 4, 0, ud);
  } else if (o.type === 'bifold') {
    frame(false); const n = o.w > 4.5 ? 4 : 2, pw = (o.w - 2 * j) / n;
    for (let k = 0; k < n; k++) { const m = box(g, pw * 0.96, o.h - j, 0.09, clipped('#ebe7dc'), x0 + j + pw * (k + 0.5), y0, 0, ud); m.rotation.y = (k % 2 ? -1 : 1) * 0.42; }
  } else if (o.type === 'pocket') {
    frame(false); box(g, o.w * 0.45, o.h - j, 0.1, clipped('#ebe7dc'), x0 + o.w * 0.225, y0, 0, ud);
  } else {
    frame(false); const hinge = new THREE.Group(), left = o.swing === 'left';
    hinge.position.set(left ? x0 + j : x1 - j, 0, 0); hinge.rotation.y = left ? -0.55 : 0.55; g.add(hinge);
    box(hinge, o.w - 2 * j, o.h - j, 0.12, clipped(o.exterior ? '#6d4a33' : '#ebe7dc'), (left ? 1 : -1) * (o.w - 2 * j) / 2, y0, 0, ud);
  }
}

function buildFixture(f) {
  const D = FIX[f.type] || FIX.box, g = new THREE.Group(), H = model.wallHeight, ud = { kind: 'fixture', id: f.id };
  const side = f.facing === 'e' || f.facing === 'w', W = side ? f.d : f.w, Dp = side ? f.w : f.d;
  g.position.set(f.x + f.w / 2, 0, f.y + f.d / 2); g.rotation.y = { s: 0, e: Math.PI / 2, n: Math.PI, w: -Math.PI / 2 }[f.facing || 's']; world.add(g);
  const B = (w, h, d, c, x, y, z, o) => box(g, w, h, d, typeof c === 'string' ? mat(c, o) : c, x || 0, y || 0, z || 0, ud);
  const col = f.color || D.color || '#e7e3d8', top = f.top || D.top || '#5d5f5d';
  switch (f.type) {
    case 'counter': case 'island': case 'vanity': {
      const h = f.h || (f.type === 'vanity' ? 2.7 : 2.9);
      B(W, 0.3, Dp - 0.25, '#3a3d3c', 0, 0, -0.1); B(W, h - 0.3, Dp, col, 0, 0.3, 0); B(W + 0.08, 0.13, Dp + 0.08, top, 0, h, 0, { roughness: 0.4 });
      const along = W >= Dp;
      if (f.sink) B(along ? Math.min(2.4, W * 0.5) : W * 0.6, 0.03, along ? Dp * 0.6 : Math.min(2.4, Dp * 0.5), '#a9b1b5', 0, h + 0.12, 0, { metalness: 0.6, roughness: 0.3 });
      if (f.cooktop) B(along ? Math.min(2.6, W * 0.5) : W * 0.75, 0.03, along ? Dp * 0.75 : Math.min(2.6, Dp * 0.5), '#1c1d1e', 0, h + 0.12, 0, { roughness: 0.3 });
      if (f.type === 'vanity') B(Math.min(W * 0.7, 3), 2.4, 0.08, '#cfdfe6', 0, h + 0.9, -Dp / 2 + 0.05, { metalness: 0.5, roughness: 0.15 });
      break; }
    case 'upper_cabinet': B(W, f.h || 2.5, Dp, col, 0, 4.5, 0); break;
    case 'fridge': B(W, f.h || 5.8, Dp, '#c9ced1', 0, 0, 0, { metalness: 0.5, roughness: 0.4 }); B(W + 0.02, 0.04, Dp + 0.02, '#8b9195', 0, 3.7, 0); break;
    case 'range': B(W, 2.95, Dp, '#d6d8da', 0, 0, 0, { metalness: 0.4, roughness: 0.4 }); B(W, 0.06, Dp, '#1c1d1e', 0, 2.95, 0); B(W, 0.55, 0.15, '#d6d8da', 0, 3, -Dp / 2 + 0.08); break;
    case 'tub': B(W, 1.75, Dp, '#f5f5f2', 0, 0, 0, { roughness: 0.3 }); B(W - 0.5, 0.04, Dp - 0.5, '#cfe1e6', 0, 1.74, 0, { roughness: 0.2 }); break;
    case 'shower': { B(W, 0.25, Dp, '#e3e3de'); const gl = B(W - 0.1, 6.4, Dp - 0.1, '#bcd9e6', 0, 0.25, 0, { transparent: true, opacity: 0.22, roughness: 0.1 }); gl.castShadow = false; B(0.5, 0.08, 0.5, '#a9b1b5', 0, 6.5, -Dp / 2 + 0.5, { metalness: 0.7 }); break; }
    case 'toilet': { B(Math.min(W, 1.6), 1.25, 0.65, '#f6f6f3', 0, 1.2, -Dp / 2 + 0.33); const r = Math.min(W, 1.3) / 2; const c = new THREE.Mesh(new THREE.CylinderGeometry(r, r * 0.7, 1.3, 20), mat('#f6f6f3', { roughness: 0.3 })); c.scale.z = clamp((Dp - 0.7) / (2 * r), 0.8, 1.5); c.position.set(0, 0.65, -Dp / 2 + 0.65 + r * c.scale.z); c.castShadow = true; c.userData = ud; pickables.push(c); g.add(c); break; }
    case 'washer': case 'dryer': { B(W, 3.1, Dp, '#eceeef', 0, 0, 0, { roughness: 0.4 }); const c = new THREE.Mesh(new THREE.CylinderGeometry(Math.min(W, 2.4) * 0.3, Math.min(W, 2.4) * 0.3, 0.06, 24), mat('#3a4046')); c.rotation.x = Math.PI / 2; c.position.set(0, 1.7, Dp / 2 + 0.02); g.add(c); break; }
    case 'fireplace': B(W, H + 0.3, Dp, '#7a3f31', 0, 0, 0, { roughness: 1 }); B(W * 0.5, 2.3, 0.12, '#17120f', 0, 0.5, Dp / 2 + 0.02); B(W * 0.75, 0.25, 0.5, '#5a3a2c', 0, 4, Dp / 2 + 0.2); break;
    case 'hearth': B(W, f.h || 0.2, Dp, '#7b746d', 0, 0, 0, { roughness: 1 }); break;
    case 'woodstove': { B(W * 0.8, 2.3, Dp * 0.8, '#1c1c1c', 0, 0.5, 0, { roughness: 0.6 }); B(W * 0.5, 0.5, Dp * 0.5, '#1c1c1c'); const p = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, H - 2.8, 12), mat('#1c1c1c')); p.position.y = 2.8 + (H - 2.8) / 2; g.add(p); break; }
    case 'bed': B(W, 1.1, Dp, '#7b6a58'); B(W - 0.2, 0.7, Dp - 0.2, '#ecebe6', 0, 1.1, 0.05); B(W, 3.2, 0.25, '#7b6a58', 0, 0, -Dp / 2 + 0.12); B(W * 0.38, 0.3, 1.3, '#ffffff', -W * 0.23, 1.8, -Dp / 2 + 1.1); B(W * 0.38, 0.3, 1.3, '#ffffff', W * 0.23, 1.8, -Dp / 2 + 1.1); B(W - 0.15, 0.12, Dp * 0.55, f.color || '#5f7a8c', 0, 1.8, Dp * 0.2); break;
    case 'sofa': { const c = f.color || '#7c8f86'; B(W, 1.4, Dp, c); B(W, 1.5, 0.7, c, 0, 1.4, -Dp / 2 + 0.35); B(0.6, 0.7, Dp, c, -W / 2 + 0.3, 1.4, 0); B(0.6, 0.7, Dp, c, W / 2 - 0.3, 1.4, 0); break; }
    case 'table': case 'desk': { const c = f.color || '#9a744d', h = f.h || 2.45; B(W, 0.14, Dp, c, 0, h, 0); [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach((s) => B(0.2, h, 0.2, c, s[0] * (W / 2 - 0.25), 0, s[1] * (Dp / 2 - 0.25))); break; }
    case 'cabinet': B(W, f.h || 7, Dp, col); B(0.04, (f.h || 7) - 0.4, 0.03, '#b5b0a3', 0, 0.2, Dp / 2 + 0.01); break;
    default: B(W, f.h || D.h || 3, Dp, col);
  }
}

/* ---------- cameras and views ---------- */
let controls;
const walk = { yaw: 1.0, pitch: -0.08, pos: new THREE.Vector3(21.2, 5.3, 24.2), keys: {}, goal: null };
function setView(v) {
  view = v; tool = null;
  document.querySelectorAll('#viewSeg button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.view === v)));
  controls.enabled = v !== 'walk'; controls.enableRotate = v === 'doll';
  sun.castShadow = v !== 'plan';
  camera.fov = v === 'plan' ? 30 : v === 'walk' ? 70 : 45; camera.near = v === 'walk' ? 0.15 : 0.5; camera.updateProjectionMatrix();
  if (v === 'doll') { controls.maxPolarAngle = Math.PI * 0.49; const k = camera.aspect < 1 ? 1.9 : 1; controls.target.set(27, 0, 17); camera.position.set(27 - 15 * k, 50 * k, 17 + 49 * k); }
  if (v === 'plan') { controls.maxPolarAngle = 0; controls.target.set(27.5, 0, 16); camera.position.set(27.5, camera.aspect < 1 ? 230 : 105, 16.01); }
  $('#hint').textContent = v === 'walk' ? 'Drag to look around. Click a floor to walk there, or use the arrow keys.' : v === 'plan' ? 'Drag to pan, scroll to zoom. Click anything to edit it.' : 'Drag to orbit, scroll to zoom, right-drag to pan. Click anything to edit it.';
  labelsEl.hidden = v === 'walk' || !showLabels;
  controls.update(); rebuild();
}
function resize() { const w = stage.clientWidth, h = stage.clientHeight; if (!w || !h) return; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); }
const ray = new THREE.Raycaster(), ndc = new THREE.Vector2(), groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
function setRay(e) { const r = canvas.getBoundingClientRect(); ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1); ray.setFromCamera(ndc, camera); }
function pickAt(e) { setRay(e); const hits = ray.intersectObjects(pickables, false).filter((h) => h.point.y <= clipPlane.constant + 0.01); return hits[0] || null; }
function groundAt(e) { setRay(e); const p = new THREE.Vector3(); return ray.ray.intersectPlane(groundPlane, p) ? p : null; }

let ptr = null, drag = null;
canvas.addEventListener('pointerdown', (e) => {
  ptr = { x: e.clientX, y: e.clientY, moved: false };
  if (view === 'walk') { canvas.setPointerCapture(e.pointerId); return; }
  if (tool) return;
  const hit = pickAt(e), ud = hit && hit.object.userData;
  if (ud && selected && ud.kind === selected.kind && ud.id === selected.id && (ud.kind === 'fixture' || ud.kind === 'opening')) {
    const gp = groundAt(e); if (!gp) return;
    drag = { kind: ud.kind, id: ud.id, before: JSON.stringify(model), start: gp };
    if (ud.kind === 'fixture') { const f = findSel(selected); drag.off = [gp.x - f.x, gp.z - f.y]; }
    controls.enabled = false; canvas.setPointerCapture(e.pointerId);
  }
});
canvas.addEventListener('pointermove', (e) => {
  if (!ptr) return;
  const dx = e.clientX - ptr.x, dy = e.clientY - ptr.y;
  if (Math.abs(dx) + Math.abs(dy) > 5) ptr.moved = true;
  if (view === 'walk') { if (e.buttons) { walk.yaw -= e.movementX * 0.005; walk.pitch = clamp(walk.pitch - e.movementY * 0.004, -1.2, 1.2); } return; }
  if (drag && ptr.moved) {
    const gp = groundAt(e); if (!gp) return;
    if (drag.kind === 'fixture') { const f = model.fixtures.find((x) => x.id === drag.id); f.x = snap(gp.x - drag.off[0]); f.y = snap(gp.z - drag.off[1]); }
    else { const o = model.openings.find((x) => x.id === drag.id), w = wallById(o.wall), fr = wallFrame(w); o.pos = snap((gp.x - w.a[0]) * fr.ux + (gp.z - w.a[1]) * fr.uy); fitOpening(model, o); }
    drag.changed = true; rebuild();
  }
});
canvas.addEventListener('pointerup', (e) => {
  const p = ptr; ptr = null;
  if (drag) {
    const d = drag; drag = null; controls.enabled = view !== 'walk';
    if (d.changed) { undoStack.push({ model: d.before, log: JSON.stringify(log) }); redoStack = []; log.unshift({ t: d.kind === 'fixture' ? 'Moved a fixture' : 'Slid an opening along its wall', n: 1, at: Date.now() }); afterChange(); return; }
  }
  if (!p || p.moved) return;
  if (view === 'walk') { setRay(e); const h = ray.intersectObjects(pickables.filter((m) => m.userData.kind === 'room'), false)[0]; if (h) walk.goal = new THREE.Vector3(h.point.x, 5.3, h.point.z); return; }
  if (tool && tool.type === 'wall') {
    const gp = groundAt(e); if (!gp) return; const q = [snap(gp.x), snap(gp.z)];
    if (!tool.p0) { tool.p0 = q; $('#hint').textContent = 'Now click where the wall ends.'; rebuild(); return; }
    const a = tool.p0; let b = q; if (Math.abs(b[0] - a[0]) > Math.abs(b[1] - a[1])) b = [b[0], a[1]]; else b = [a[0], b[1]];
    tool = null; const r = commit([{ op: 'add_wall', a, b }], 'Drew a new wall'); if (r.failed.length) say('assistant', r.failed[0]); setHint(); return;
  }
  const hit = pickAt(e); select(hit ? { kind: hit.object.userData.kind, id: hit.object.userData.id } : null);
});
window.addEventListener('keydown', (e) => { if (/input|textarea|select/i.test(e.target.tagName)) return; walk.keys[e.key.toLowerCase()] = true; if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); e.shiftKey ? redo() : undo(); } if (view === 'walk' && e.key.startsWith('Arrow')) e.preventDefault(); });
window.addEventListener('keyup', (e) => { walk.keys[e.key.toLowerCase()] = false; });
function setHint() { setView(view); }

let last = performance.now();
function frame(now) {
  requestAnimationFrame(frame);
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  if (view === 'walk') {
    const k = walk.keys, f = (k.arrowup || k.w ? 1 : 0) - (k.arrowdown || k.s ? 1 : 0), s = (k.d ? 1 : 0) - (k.a ? 1 : 0);
    if (k.arrowleft) walk.yaw += dt * 1.6; if (k.arrowright) walk.yaw -= dt * 1.6;
    if (f || s) { walk.goal = null; walk.pos.x += (-Math.sin(walk.yaw) * f + Math.cos(walk.yaw) * s) * dt * 7; walk.pos.z += (-Math.cos(walk.yaw) * f - Math.sin(walk.yaw) * s) * dt * 7; }
    if (walk.goal) { const d = walk.goal.clone().sub(walk.pos); if (d.length() < 0.15) walk.goal = null; else walk.pos.add(d.multiplyScalar(Math.min(1, dt * 4))); }
    camera.position.copy(walk.pos); camera.rotation.set(walk.pitch, walk.yaw, 0, 'YXZ');
  } else controls.update();
  renderer.render(scene, camera);
  if (!labelsEl.hidden) { const w = stage.clientWidth, h = stage.clientHeight, v = new THREE.Vector3(); labelItems.forEach((L) => { v.copy(L.p).project(camera); const on = v.z < 1 && Math.abs(v.x) < 1.05 && Math.abs(v.y) < 1.05; L.el.style.display = on ? '' : 'none'; if (on) L.el.style.transform = 'translate(-50%,-50%) translate(' + ((v.x + 1) / 2 * w).toFixed(1) + 'px,' + ((1 - v.y) / 2 * h).toFixed(1) + 'px)'; }); }
}
function syncTheme() { const c = getComputedStyle(document.documentElement).getPropertyValue('--sky').trim() || '#dfe7e4'; scene.background = new THREE.Color(c); }

/* ---------- side panel ---------- */
function select(s) { selected = s; rebuild(); renderPanel(); if (s) showTab('edit'); }
function showTab(name) { document.querySelectorAll('#tabs button').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.tab === name))); ['edit', 'add', 'log'].forEach((t) => { $('#tab-' + t).hidden = t !== name; }); }
const field = (label, input) => el('label', { class: 'field' }, el('span', { text: label }), input);
function numInput(id, value, step, onchange) { return el('input', { id, type: 'number', step: step || 0.25, value: r2(value), onchange: (e) => onchange(Number(e.target.value)) }); }
function swatches(items, current, onpick) { return el('div', { class: 'swatches' }, items.map((it) => el('button', { type: 'button', class: 'sw' + (it.key === current ? ' on' : ''), title: it.label, 'aria-label': it.label, style: 'background:' + it.css, onclick: () => onpick(it.key) }))); }
function renderPanel() {
  const p = $('#tab-edit'); p.textContent = '';
  const s = selected && findSel(selected);
  if (!s) { p.append(el('p', { class: 'muted', text: 'Click a floor, wall, door, window or fixture in the model to edit it. Selected doors, windows and fixtures can be dragged.' }), el('p', { class: 'muted', text: 'Or describe the change in the box below.' })); return; }
  if (selected.kind === 'room') {
    const b = bbox(s.poly);
    p.append(el('h2', { text: s.name }), el('p', { class: 'dim', text: ftin(b.x1 - b.x0 - 0.45) + ' × ' + ftin(b.y1 - b.y0 - 0.45) + ' · ' + Math.round(polyArea(s.poly)) + ' sq ft' }),
      field('Name', el('input', { id: 'f-name', type: 'text', value: s.name, onchange: (e) => commit([{ op: 'update_room', id: s.id, name: e.target.value }], 'Renamed a room') })),
      el('h3', { text: 'Flooring: ' + (FLOORS[s.floor] || {}).label }),
      swatches(Object.keys(FLOORS).map((k) => ({ key: k, label: FLOORS[k].label, css: 'linear-gradient(135deg,' + FLOORS[k].c[0] + ' 50%,' + (FLOORS[k].c[1] || FLOORS[k].c[0]) + ' 50%)' })), s.floor, (k) => commit([{ op: 'set_floor', room: s.id, material: k }])),
      el('h3', { text: 'Wall paint' }),
      swatches(['white', 'warm white', 'cream', 'greige', 'light grey', 'sage', 'green', 'forest green', 'sky blue', 'blue', 'navy', 'teal', 'blush', 'terracotta', 'mustard', 'charcoal'].map((n) => ({ key: n, label: n, css: PAINTS[n] })), null, (n) => commit([{ op: 'set_wall_color', room: s.id, color: n }])));
  } else if (selected.kind === 'wall') {
    const rs = [...wallRooms(s)].map((id) => roomById(id).name);
    p.append(el('h2', { text: s.ext ? 'Exterior wall' : 'Interior wall' }), el('p', { class: 'dim', text: ftin(wlen(s)) + ' long' + (rs.length ? ' · ' + rs.join(' / ') : '') }),
      el('div', { class: 'btns' }, ['door', 'window', 'opening', 'slider', 'pocket'].map((t) => el('button', { type: 'button', text: '+ ' + OPEN[t].label, onclick: () => { const L = wlen(s); let pos = L / 2; const taken = model.openings.filter((o) => o.wall === s.id); if (taken.some((o) => Math.abs(o.pos - pos) < (o.w + OPEN[t].w) / 2)) pos = L - OPEN[t].w / 2 - 0.5; commit([{ op: 'add_opening', wall: s.id, type: t, pos }]); } }))),
      el('p', { class: 'warn', text: 'The floor plan does not show which walls are load-bearing. Have a builder or engineer confirm before removing or opening up any wall.' }),
      el('div', { class: 'btns' }, el('button', { type: 'button', class: 'danger', text: 'Remove this wall', onclick: () => commit([{ op: 'remove_wall', id: s.id }]) })));
  } else if (selected.kind === 'opening') {
    const w = wallById(s.wall), L = wlen(w), up = (patch, title) => commit([Object.assign({ op: 'update_opening', id: s.id }, patch)], title);
    p.append(el('h2', { text: OPEN[s.type].label }), el('p', { class: 'dim', text: ftin(s.w) + ' wide × ' + ftin(s.h) + ' high' + (s.sill ? ' · sill at ' + ftin(s.sill) : '') }),
      field('Type', el('select', { id: 'f-otype', onchange: (e) => up({ type: e.target.value }) }, Object.keys(OPEN).map((k) => el('option', { value: k, selected: k === s.type ? '' : null, text: OPEN[k].label })))),
      field('Position along wall', el('input', { id: 'f-opos', type: 'range', min: r2(s.w / 2 + 0.2), max: r2(L - s.w / 2 - 0.2), step: 0.25, value: s.pos, onchange: (e) => up({ pos: Number(e.target.value) }, 'Slid an opening along its wall') })),
      el('div', { class: 'row' }, field('Width (ft)', numInput('f-ow', s.w, 0.25, (v) => up({ w: v }))), field('Height (ft)', numInput('f-oh', s.h, 0.25, (v) => up({ h: v }))), field('Sill (ft)', numInput('f-os', s.sill, 0.25, (v) => up({ sill: v })))),
      s.type === 'door' ? el('div', { class: 'btns' }, el('button', { type: 'button', text: 'Flip swing', onclick: () => up({ swing: s.swing === 'left' ? 'right' : 'left' }, 'Flipped a door swing') })) : null,
      el('div', { class: 'btns' }, el('button', { type: 'button', class: 'danger', text: 'Remove and fill wall', onclick: () => commit([{ op: 'remove_opening', id: s.id }]) })));
  } else {
    const D = FIX[s.type] || FIX.box, up = (patch, title) => commit([Object.assign({ op: 'update_fixture', id: s.id }, patch)], title);
    const order = ['s', 'w', 'n', 'e'];
    p.append(el('h2', { text: s.label || D.label }), el('p', { class: 'dim', text: ftin(s.w) + ' × ' + ftin(s.d) + ' footprint' }),
      el('div', { class: 'row' }, field('Width E-W (ft)', numInput('f-fw', s.w, 0.25, (v) => up({ w: v }))), field('Depth N-S (ft)', numInput('f-fd', s.d, 0.25, (v) => up({ d: v })))),
      el('div', { class: 'row' }, field('From west (ft)', numInput('f-fx', s.x, 0.25, (v) => up({ x: v }))), field('From north (ft)', numInput('f-fy', s.y, 0.25, (v) => up({ y: v })))),
      el('div', { class: 'btns' }, el('button', { type: 'button', text: 'Rotate 90°', onclick: () => up({ facing: order[(order.indexOf(s.facing || 's') + 1) % 4], w: s.d, d: s.w, x: s.x + (s.w - s.d) / 2, y: s.y + (s.d - s.w) / 2 }, 'Rotated a fixture') }), el('button', { type: 'button', class: 'danger', text: 'Remove', onclick: () => commit([{ op: 'remove_fixture', id: s.id }]) })),
      D.color ? el('div', null, el('h3', { text: 'Colour' }), swatches(['white', 'cream', 'greige', 'sage', 'forest green', 'navy', 'charcoal', 'cedar', 'black'].map((n) => ({ key: n, label: n, css: PAINTS[n] })), null, (n) => up({ color: n }, 'Recoloured a fixture'))) : null);
  }
}
function renderAdd() {
  const p = $('#tab-add'); p.textContent = '';
  p.append(el('h3', { text: 'Fixtures and furniture' }), el('p', { class: 'muted', text: 'Adds to the selected room, or the middle of the view. Then drag it into place.' }),
    el('div', { class: 'btns' }, Object.keys(FIX).filter((k) => k !== 'box' && k !== 'hearth').map((k) => el('button', { type: 'button', text: FIX[k].label, onclick: () => {
      let c = [controls.target.x, controls.target.z]; const r = selected && selected.kind === 'room' && findSel(selected); if (r) c = roomCentre(r);
      const res = commit([{ op: 'add_fixture', type: k, x: snap(c[0] - FIX[k].w / 2), y: snap(c[1] - FIX[k].d / 2) }]); if (res.done.length) select({ kind: 'fixture', id: model.fixtures[model.fixtures.length - 1].id });
    } }))),
    el('h3', { text: 'Walls' }),
    el('div', { class: 'btns' }, el('button', { type: 'button', text: 'Draw a wall', onclick: () => { if (view === 'walk') setView('plan'); tool = { type: 'wall', p0: null }; $('#hint').textContent = 'Click where the wall starts.'; } })),
    el('p', { class: 'muted', text: 'To add a door or window, click a wall first.' }));
}
function renderLog() {
  const p = $('#tab-log'); p.textContent = '';
  if (!log.length) { p.append(el('p', { class: 'muted', text: 'No changes yet. This is the house as drawn on the listing floor plan.' })); return; }
  p.append(el('ol', { class: 'log' }, log.map((l) => el('li', null, el('span', { text: l.t + (l.n > 1 ? ' (+' + (l.n - 1) + ' more)' : '') }), el('time', { text: new Date(l.at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) })))));
}
function updateButtons() { $('#undoBtn').disabled = !undoStack.length; $('#redoBtn').disabled = !redoStack.length; $('#logCount').textContent = log.length ? String(log.length) : ''; }

/* ---------- saving ---------- */
function status(t) { $('#status').textContent = t; }
function payload() { return JSON.stringify({ model, log }); }
function adopt(json) { try { const d = JSON.parse(json); if (d && d.model && Array.isArray(d.model.walls) && Array.isArray(d.model.rooms)) { model = d.model; log = d.log || []; return true; } } catch (e) { /* ignore bad data */ } return false; }
function scheduleSave() { try { localStorage.setItem(STORE_KEY, payload()); } catch (e) { /* storage unavailable */ } if (!db || !remoteLoaded) { status(db ? 'Loading saved plan…' : 'Saved in this browser'); return; } clearTimeout(saveTimer); status('Saving…'); saveTimer = setTimeout(pushSave, 900); }
async function pushSave() { if (saving) { saveAgain = true; return; } saving = true; try { await db.doc('plans/main').set({ json: payload(), at: new Date().toISOString() }); status('Saved'); } catch (e) { status('Saved in this browser only'); } saving = false; if (saveAgain) { saveAgain = false; pushSave(); } }

/* ---------- prompt handling ---------- */
function say(who, text) { const c = $('#chat'); const b = el('div', { class: 'msg ' + who, text }); c.append(b); while (c.children.length > 12) c.firstChild.remove(); c.scrollTop = c.scrollHeight; return b; }
const history = [];
function buildPrompt(text) {
  const compact = JSON.stringify(model, (k, v) => (typeof v === 'number' ? r2(v) : v));
  return [
    'You are the renovation planner built into a 3D model of a single-storey house (1346 Russell Road). Turn the request into edits to the model.',
    'Geometry: units are feet. x increases east, y increases south, origin at the NW exterior corner. Walls are centreline segments a->b with thickness t; ext:true marks exterior walls. An opening belongs to one wall; pos is the distance in feet from the wall point a to the centre of the opening. Rooms are floor polygons. Fixtures are axis-aligned boxes: x,y is the NW corner, w is the size east-west, d is the size north-south, facing (n|s|e|w) is the direction the front faces. Wall height is model.wallHeight.',
    'Current model JSON:', compact,
    'Flooring keys: ' + Object.keys(FLOORS).join(', '),
    'Fixture types: ' + Object.keys(FIX).join(', ') + ' (counter, island and vanity accept sink:true or cooktop:true, color and top)',
    'Opening types: ' + Object.keys(OPEN).join(', '),
    'Colours: a #rrggbb hex value.',
    'Available ops (use only these):',
    '{"op":"set_floor","room":id|"all","material":key} {"op":"set_wall_color","room":id|"all","color":hex} {"op":"set_siding","color":hex} {"op":"set_wall_height","height":ft}',
    '{"op":"add_opening","wall":id,"type":t,"pos":ft,"w":ft,"h":ft,"sill":ft,"panes":n,"swing":"left"|"right"} {"op":"update_opening","id":id,...} {"op":"remove_opening","id":id}',
    '{"op":"add_wall","id":newId,"a":[x,y],"b":[x,y],"t":ft} {"op":"update_wall","id":id,"a":[x,y],"b":[x,y]} {"op":"remove_wall","id":id} (removing a wall removes its openings)',
    '{"op":"add_room","id":newId,"name":s,"poly":[[x,y],...],"floor":key} {"op":"update_room","id":id,"name":s,"poly":[...]} {"op":"remove_room","id":id}',
    '{"op":"add_fixture","type":t,"x":ft,"y":ft,"w":ft,"d":ft,"h":ft,"facing":"n|s|e|w","label":s,"color":hex,"top":hex,"sink":bool,"cooktop":bool} {"op":"update_fixture","id":id,...} {"op":"remove_fixture","id":id}',
    'Rules: Ops run in order; an op may reference an id created by an earlier op. Keep fixtures inside their room, clear of walls (inner wall face is t/2 from the centreline), doors and walkways (3 ft clear). An opening must fit inside its wall; a new opening replaces any existing opening it overlaps on that wall. To remove only part of a wall, shorten it with update_wall and add_wall for the remaining piece, or add a wide "opening". When rooms merge or change shape, update the room polygons too. For a remodel, remove the old fixtures you are replacing and place new ones with realistic sizes. Do the whole request, do not ask the user to do steps by hand.',
    'The floor plan does not say which walls are load-bearing, and plumbing and wiring locations are unknown. When a change touches structure, exterior walls or plumbing, say so briefly in the reply.',
    'If the request is a question, answer it in reply and return no ops.',
    history.length ? 'Earlier in this conversation:\n' + history.slice(-6).map((h) => h.role + ': ' + h.text).join('\n') : '',
    'Reply with only a JSON object: {"reply":"one to three plain sentences on what you changed and anything to check","title":"short label for the change log","ops":[...]}',
    'Request: ' + text
  ].filter(Boolean).join('\n\n');
}
let busy = null;
async function handlePrompt(text) {
  text = text.trim(); if (!text || busy) return;
  say('user', text); history.push({ role: 'user', text });
  const finish = (reply) => { say('assistant', reply); history.push({ role: 'assistant', text: reply }); };
  if (!sample) { const r = localInterpret(text); const res = r.ops.length ? commit(r.ops, text.slice(0, 60)) : { done: [], failed: [] }; finish(res.done.length ? res.done.join('. ') + '.' + (res.failed.length ? ' Could not: ' + res.failed.join('; ') : '') : (res.failed[0] || r.reply)); return; }
  const bubble = say('assistant', 'Working on it…'); bubble.classList.add('pending');
  busy = new AbortController(); $('#sendBtn').textContent = 'Stop'; $('#promptBox').disabled = true;
  try {
    const out = await sample.json(buildPrompt(text), { cache: false, signal: busy.signal });
    bubble.remove();
    const ops = out && Array.isArray(out.ops) ? out.ops : [];
    const res = ops.length ? commit(ops, String(out.title || text).slice(0, 60)) : { done: [], failed: [] };
    let reply = String((out && out.reply) || (res.done.length ? 'Done.' : 'Nothing changed.'));
    if (res.failed.length) reply += ' ' + res.failed.length + ' step' + (res.failed.length > 1 ? 's' : '') + ' could not be applied: ' + res.failed.slice(0, 3).join('; ') + '.';
    finish(reply);
  } catch (e) {
    bubble.remove(); const code = e && e.code;
    if (code === 'cancelled') say('assistant', 'Stopped.');
    else if (['not_granted', 'sampling_disabled', 'not_declared', 'capability_disabled', 'capability_removed'].includes(code)) { sample = null; promptMode(); const r = localInterpret(text); const res = r.ops.length ? commit(r.ops, text.slice(0, 60)) : { done: [] }; finish(res.done.length ? res.done.join('. ') + '.' : 'Claude is not available in this view, so only simple requests work here. ' + r.reply); }
    else if (code === 'rate_limited') say('assistant', 'Claude is busy or you have reached a usage limit. Try again in a little while.');
    else if (code === 'invalid_json') say('assistant', 'That request came back garbled. Try again, or ask for less at once.');
    else if (code === 'refused') say('assistant', 'Claude declined that request. Try rewording it.');
    else say('assistant', 'Something went wrong reaching Claude. Try again.');
  }
  busy = null; $('#sendBtn').textContent = 'Apply'; $('#promptBox').disabled = false;
}
/* Small offline interpreter, used when the page cannot ask Claude. */
function localInterpret(text) {
  const t = ' ' + text.toLowerCase().replace(/[.,!?]/g, ' ') + ' ', ops = [];
  const rooms = /\b(whole house|every room|all rooms|everywhere|throughout)\b/.test(t) ? ['all'] : model.rooms.filter((r) => t.includes(' ' + r.name.toLowerCase() + ' ') || t.includes(' ' + r.name.toLowerCase().replace(' room', '') + ' ')).map((r) => r.id);
  const SYN = { oak: ['oak', 'hardwood'], wide_oak: ['wide plank', 'wide-plank'], walnut: ['walnut'], maple: ['maple'], fir: ['fir'], whitewash: ['whitewash'], grey_vinyl: ['vinyl', 'lvp'], parquet: ['parquet'], linoleum: ['lino'], white_tile: ['white tile', 'porcelain'], slate: ['slate'], terracotta: ['terracotta'], checker: ['checker'], marble: ['marble'], hex: ['hex'], polished_concrete: ['polished concrete'], concrete: ['concrete'], carpet_grey: ['grey carpet', 'gray carpet'], carpet_oat: ['carpet'], cork: ['cork'] };
  const isFloor = /floor/.test(t); let matKey = null;
  for (const k of ['wide_oak', 'polished_concrete', 'carpet_grey', 'white_tile'].concat(Object.keys(SYN))) if (!matKey && SYN[k].some((s) => t.includes(s))) matKey = k;
  if (!matKey && isFloor && /\btile/.test(t)) matKey = 'white_tile';
  const colour = Object.keys(PAINTS).sort((a, b) => b.length - a.length).find((c) => t.includes(' ' + c + ' '));
  const side = (t.match(/\b(north|south|east|west)\b/) || [])[1];
  const otype = /sliding|slider|patio door/.test(t) ? 'slider' : /french/.test(t) ? 'french' : /pocket/.test(t) ? 'pocket' : /window/.test(t) ? 'window' : /\bdoor/.test(t) ? 'door' : /opening|archway/.test(t) ? 'opening' : null;
  const fx = Object.keys(FIX).find((k) => t.includes(' ' + FIX[k].label.toLowerCase() + ' ') || t.includes(' ' + k.replace('_', ' ') + ' '));
  if (/\b(remove|take out|knock down|open up|demolish)\b/.test(t) && /\bwall\b/.test(t) && rooms.length === 2) {
    model.walls.filter((w) => { const s = wallRooms(w); return !w.ext && s.has(rooms[0]) && s.has(rooms[1]) && s.size === 2; }).forEach((w) => ops.push({ op: 'remove_wall', id: w.id }));
    if (!ops.length) return { ops, reply: 'I could not find a wall that sits only between those two rooms. Click the wall and use Remove this wall.' };
  } else if (/\b(add|put|install)\b/.test(t) && otype && rooms.length && rooms[0] !== 'all') {
    const r = roomById(rooms[0]), b = bbox(r.poly), sd = side || 'south';
    const horiz = sd === 'north' || sd === 'south', target = sd === 'north' ? b.y0 : sd === 'south' ? b.y1 : sd === 'west' ? b.x0 : b.x1;
    const w = model.walls.filter((q) => wallRooms(q).has(r.id) && (horiz ? Math.abs(q.a[1] - q.b[1]) < 0.01 && Math.abs(q.a[1] - target) < 0.6 : Math.abs(q.a[0] - q.b[0]) < 0.01 && Math.abs(q.a[0] - target) < 0.6)).sort((p, q) => wlen(q) - wlen(p))[0];
    if (!w) return { ops, reply: 'I could not find the ' + sd + ' wall of the ' + r.name + '. Click the wall and add it from the panel.' };
    const mid = horiz ? (b.x0 + b.x1) / 2 - Math.min(w.a[0], w.b[0]) : (b.y0 + b.y1) / 2 - Math.min(w.a[1], w.b[1]);
    const fr = wallFrame(w), pos = (horiz ? fr.ux : fr.uy) > 0 ? mid : fr.L - mid;
    ops.push({ op: 'add_opening', wall: w.id, type: otype, pos });
  } else if (/\b(remove|take out|delete)\b/.test(t) && fx) {
    model.fixtures.filter((f) => f.type === fx && (!rooms.length || rooms[0] === 'all' || rooms.includes((roomAt(f.x + f.w / 2, f.y + f.d / 2) || {}).id))).forEach((f) => ops.push({ op: 'remove_fixture', id: f.id }));
  } else if (/\b(add|put|install)\b/.test(t) && fx) {
    const r = rooms.length && rooms[0] !== 'all' ? roomById(rooms[0]) : null, c = r ? roomCentre(r) : [controls.target.x, controls.target.z];
    ops.push({ op: 'add_fixture', type: fx, x: snap(c[0] - FIX[fx].w / 2), y: snap(c[1] - FIX[fx].d / 2) });
  } else if (matKey && (isFloor || !/paint|wall/.test(t))) { (rooms.length ? rooms : ['all']).forEach((r) => ops.push({ op: 'set_floor', room: r, material: matKey }));
  } else if (colour && /paint|wall|colou?r/.test(t)) { (rooms.length ? rooms : ['all']).forEach((r) => ops.push({ op: 'set_wall_color', room: r, color: colour })); }
  return { ops, reply: 'Try something like "walnut floors in the living room", "paint the office sage", "add a window to the east wall of bedroom 2" or "remove the wall between the office and living room".' };
}
function promptMode() { $('#promptNote').textContent = sample ? 'Claude plans the change and edits the model. Your first request asks permission to use your Claude account.' : 'Simple requests work here: flooring, paint, adding doors and windows, removing a wall between two rooms. Open this as a Claude artifact for full remodel requests.'; }

/* ---------- boot ---------- */
function boot() {
  try { const s = localStorage.getItem(STORE_KEY); if (s) adopt(s); } catch (e) { /* storage unavailable */ }
  controls = new THREE.OrbitControls(camera, canvas);
  controls.enableDamping = true; controls.dampingFactor = 0.12; controls.minDistance = 6; controls.maxDistance = 300; controls.screenSpacePanning = false;
  syncTheme(); resize(); setView('doll'); renderPanel(); renderAdd(); renderLog(); updateButtons(); promptMode(); status('Saved in this browser');
  new ResizeObserver(resize).observe(stage);
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', syncTheme);
  new MutationObserver(syncTheme).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  document.querySelectorAll('#viewSeg button').forEach((b) => b.addEventListener('click', () => setView(b.dataset.view)));
  document.querySelectorAll('#tabs button').forEach((b) => b.addEventListener('click', () => showTab(b.dataset.tab)));
  $('#cutChk').addEventListener('change', (e) => { cutLow = e.target.checked; rebuild(); });
  $('#lblChk').addEventListener('change', (e) => { showLabels = e.target.checked; labelsEl.hidden = !showLabels || view === 'walk'; });
  $('#undoBtn').addEventListener('click', undo); $('#redoBtn').addEventListener('click', redo);
  $('#resetBtn').addEventListener('click', () => { $('#resetConfirm').hidden = false; });
  $('#resetNo').addEventListener('click', () => { $('#resetConfirm').hidden = true; });
  $('#resetYes').addEventListener('click', () => { $('#resetConfirm').hidden = true; undoStack.push({ model: JSON.stringify(model), log: JSON.stringify(log) }); redoStack = []; model = clone(AS_BUILT); log = []; selected = null; afterChange(); });
  $('#promptForm').addEventListener('submit', (e) => { e.preventDefault(); if (busy) { busy.abort(); return; } const b = $('#promptBox'), v = b.value; b.value = ''; handlePrompt(v); });
  $('#promptBox').addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); $('#promptForm').requestSubmit(); } });
  document.querySelectorAll('#chips button').forEach((b) => b.addEventListener('click', () => { $('#promptBox').value = b.textContent; $('#promptBox').focus(); }));
  requestAnimationFrame(frame);
  const cl = window.claude;
  if (cl && cl.use) {
    cl.use('sample').then((s) => { sample = s || null; promptMode(); });
    cl.use('db').then(async (d) => {
      if (!d) return; db = d; status('Loading saved plan…');
      const timer = setTimeout(() => { if (!remoteLoaded) status('Saved plan not reachable yet'); }, 10000);
      try { const snapDoc = await db.doc('plans/main').get(); clearTimeout(timer); const data = snapDoc.exists && snapDoc.data(); if (data && data.json && data.json !== payload() && adopt(data.json)) { undoStack = []; redoStack = []; selected = null; rebuild(); renderPanel(); renderLog(); updateButtons(); } remoteLoaded = true; status('Saved'); }
      catch (e) { clearTimeout(timer); db = null; status('Saved in this browser only'); }
    });
  }
}
boot();
})();
