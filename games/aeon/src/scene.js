// three.js world: holographic map floor, category panels, agents, the central consciousness.
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { feature } from 'topojson-client';
import landTopo from './land-110m.json';
import { BUILDERS, lm, wire, edges, pts, circle } from './forms.js';
import { CAT } from './data.js';
import { drawIcon } from './icons.js';

const add = (o, p) => (p.add(o), o);
const MAPROT = Math.PI / 4, MW = 25, MH = 12.5, MAPSHIFT = 25;
const CORE_Y = 3.4;

export class World {
  constructor(container, { quality = 'high', onAgentClick = () => {} } = {}) {
    this.container = container; this.onAgentClick = onAgentClick;
    this.agents = new Map(); this.pulses = []; this.hotspots = []; this.panels = new Map();
    this.coreState = { born: false, level: 0, progress: 0 };
    this.clock = new THREE.Clock(); this.t = 0; this.tickFns = [];
    const W = container.clientWidth, H = container.clientHeight;
    this.renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    this.renderer.setSize(W, H); container.appendChild(this.renderer.domElement);
    this.scene = new THREE.Scene(); this.scene.background = new THREE.Color(0x040a16); this.scene.fog = new THREE.Fog(0x040a16, 45, 100);
    this.cam = new THREE.PerspectiveCamera(32, W / H, 0.1, 300); this.cam.position.set(33, 26, 33); this.fitAspect(W / H);
    this.controls = new OrbitControls(this.cam, this.renderer.domElement);
    Object.assign(this.controls, { enableDamping: true, dampingFactor: 0.06, minDistance: 22, maxDistance: 75, maxPolarAngle: 1.35, minPolarAngle: 0.35, enablePan: false, autoRotate: false });
    this.controls.minAzimuthAngle = Math.PI / 4 - 0.85; this.controls.maxAzimuthAngle = Math.PI / 4 + 0.85;
    this.controls.target.set(0, -3.2, 0);
    this.labels = document.createElement('div'); this.labels.className = 'labels'; container.appendChild(this.labels);
    this.buildFloor(); this.buildMap(); this.buildCore();
    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(new RenderPass(this.scene, this.cam));
    this.bloom = new UnrealBloomPass(new THREE.Vector2(W, H), 0.7, 0.45, 0.15); this.composer.addPass(this.bloom);
    this.composer.addPass(new OutputPass());
    this.setQuality(quality);
    window.addEventListener('resize', () => this.resize());
  }
  setQuality(q) { this.quality = q; this.bloom.enabled = q === 'high'; }
  // Portrait phones see a narrow slice: widen the field of view and step back so the whole circle fits.
  fitAspect(a) { this.cam.fov = a < 1 ? 50 : 32; if (a < 1) this.cam.position.setLength(58); this.cam.updateProjectionMatrix(); }
  resize() {
    const W = this.container.clientWidth, H = this.container.clientHeight;
    this.fitAspect(W / H); this.cam.aspect = W / H; this.cam.updateProjectionMatrix(); this.renderer.setSize(W, H); this.composer.setSize(W, H);
  }

  // ---------- static environment ----------
  buildFloor() {
    const s = this.scene;
    const grid = new THREE.GridHelper(110, 110, 0x2f7fa0, 0x2f7fa0); grid.material.transparent = true; grid.material.opacity = 0.1; add(grid, s);
    const g2 = new THREE.GridHelper(110, 22, 0x2f7fa0, 0x2f7fa0); g2.material.transparent = true; g2.material.opacity = 0.18; g2.position.y = 0.01; add(g2, s);
    add(circle(17, 0x5fd8ff, 0.55, 256), s).position.y = 0.02; add(circle(17.4, 0x5fd8ff, 0.22, 256), s).position.y = 0.02;
    const D = 900, dp = []; for (let i = 0; i < D; i++) dp.push((Math.random() - 0.5) * 80, Math.random() * 26, (Math.random() - 0.5) * 80);
    this.dust = add(pts(dp, 0x8fdfff, 0.06, 0.5), s);
  }
  lonlat(lo, la) { return new THREE.Vector3((((lo + MAPSHIFT + 540) % 360) - 180) / 180 * MW, 0, -la / 90 * MH).applyAxisAngle(new THREE.Vector3(0, 1, 0), MAPROT); }
  buildMap() {
    const land = feature(landTopo, landTopo.objects.land);
    const cw = 1440, ch = 720, oc = document.createElement('canvas'); oc.width = cw; oc.height = ch; const x = oc.getContext('2d'); x.fillStyle = '#fff';
    const P = ([lo, la]) => [(lo + 180) / 360 * cw, (90 - la) / 180 * ch];
    (land.features || [land]).forEach((f) => { const g = f.geometry || f; const polys = g.type === 'Polygon' ? [g.coordinates] : g.coordinates; polys.forEach((poly) => { x.beginPath(); poly.forEach((ring) => ring.forEach((c, i) => { const [px, py] = P(c); i ? x.lineTo(px, py) : x.moveTo(px, py); })); x.fill('evenodd'); }); });
    const img = x.getImageData(0, 0, cw, ch).data, arr = [], cols = [], step = 0.26;
    for (let v = MH * 0.95; v > -MH * 0.7; v -= step) for (let u = -MW; u <= MW; u += step) {
      const lo = ((u / MW * 180 - MAPSHIFT + 540) % 360) - 180, la = v / MH * 90; const [px, py] = P([lo, la]);
      if (img[(Math.floor(py) * cw + Math.floor(px)) * 4] > 128) { const p = new THREE.Vector3(u, 0.03, -v).applyAxisAngle(new THREE.Vector3(0, 1, 0), MAPROT); arr.push(p.x, p.y, p.z); const k = 0.55 + 0.45 * Math.random(); cols.push(0.2 * k, 0.7 * k, 0.95 * k); }
    }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(arr), 3)); g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(cols), 3));
    add(new THREE.Points(g, new THREE.PointsMaterial({ size: 0.15, vertexColors: true, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false })), this.scene);
  }

  // ---------- central consciousness ----------
  buildCore() {
    const s = this.scene, GOLD = 0xffb35c;
    this.seed = add(new THREE.Group(), s); this.seed.position.y = CORE_Y;
    const sp = []; for (let i = 0; i < 160; i++) { const r = Math.random() * 1.2, a = Math.random() * 6.28, b = (Math.random() - 0.5) * 3.14; sp.push(Math.cos(a) * Math.cos(b) * r, Math.sin(b) * r, Math.sin(a) * Math.cos(b) * r); }
    this.seedPts = add(pts(sp, 0xffd9a8, 0.07, 0.0), this.seed);
    this.plat = add(new THREE.Group(), s); this.plat.visible = false;
    this.rings = [[4.2, 0.35, GOLD, 0.9], [5, 0.2, GOLD, 0.45], [3.2, 0.9, 0xffe2b8, 0.6], [6.5, 0.03, GOLD, 0.3]].map(([r, y, c, o]) => { const m = add(circle(r, c, o, 128), this.plat); m.position.y = y; return m; });
    const tick = []; for (let k = 0; k < 72; k++) { const a = k / 72 * Math.PI * 2, r2 = k % 6 ? 4.7 : 5.1; tick.push(Math.cos(a) * 4.4, 0.35, Math.sin(a) * 4.4, Math.cos(a) * r2, 0.35, Math.sin(a) * r2); }
    const tg = new THREE.BufferGeometry(); tg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(tick), 3)); this.ticks = add(new THREE.LineSegments(tg, lm(GOLD, 0.7)), this.plat);
    this.core = add(new THREE.Group(), s); this.core.position.y = CORE_Y; this.core.visible = false;
    this.ico = add(wire(new THREE.IcosahedronGeometry(2.3, 2), GOLD, 0.7), this.core);
    this.ico2 = add(wire(new THREE.IcosahedronGeometry(1.4, 1), 0xfff0d8, 0.55), this.core);
    const N = 2400, pp = [], pc = [], palette = ['#ffb35c', '#ffb35c', '#39ff88', '#3d8bff', '#b36bff', '#ffcf3d', '#ff4d6d', '#2ee6c8'].map((h) => new THREE.Color(h));
    for (let i = 0; i < N; i++) { const y = 1 - 2 * (i + 0.5) / N, r = Math.sqrt(1 - y * y), a = i * 2.39996, R = 2.75 + Math.random() * 0.3; pp.push(Math.cos(a) * r * R, y * R, Math.sin(a) * r * R); const c = palette[Math.floor(Math.random() * palette.length)]; pc.push(c.r, c.g, c.b); }
    const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(pp), 3)); sg.setAttribute('color', new THREE.BufferAttribute(new Float32Array(pc), 3));
    this.shell = add(new THREE.Points(sg, new THREE.PointsMaterial({ size: 0.07, vertexColors: true, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false })), this.core);
    this.shellN = N;
    this.heart = add(new THREE.Mesh(new THREE.SphereGeometry(0.32, 32, 16), new THREE.MeshBasicMaterial({ color: 0xffe6c4 })), this.core);
    this.orbits = [0, 1, 2].map((i) => { const o = add(new THREE.Group(), this.core); o.rotation.set(0.5 + i * 0.7, i * 1.1, 0.3 * i); add(circle(3.3 + i * 0.45, [0xffb35c, 0x5fe3ff, 0xff8ad8][i], 0.55, 160), o); const m = add(new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 8), new THREE.MeshBasicMaterial({ color: [0xffe2b8, 0xbff8ff, 0xffd0ee][i] })), o); o.userData = { m, r: 3.3 + i * 0.45, sp: 0.8 + i * 0.4 }; return o; });
    const cp = []; for (let i = 0; i < 1600; i++) { const y = 1 - 2 * (i + 0.5) / 1600, r = Math.sqrt(1 - y * y), a = i * 2.39996, R = 4.3 + Math.random() * 1.2; cp.push(Math.cos(a) * r * R, y * R, Math.sin(a) * r * R); }
    this.corona = add(pts(cp, 0xffd9a8, 0.05, 0.45), this.core);
    // Evolution layers, unlocked by core level (see setCore): galaxy arms, quasar jets, nebula veil, crown.
    const ap = [], ac = [], c1 = new THREE.Color(0xffd9a8), c2 = new THREE.Color(0x7f9bff);
    for (let i = 0; i < 3600; i++) { const arm = i % 3, d = Math.random(), r = 3.2 + d * 2.6, a = arm * 2.094 + d * 3.4 + (Math.random() - 0.5) * 0.45; ap.push(Math.cos(a) * r, (Math.random() - 0.5) * 0.25 * (1 - d), Math.sin(a) * r); const c = c1.clone().lerp(c2, d); ac.push(c.r, c.g, c.b); }
    const ag = new THREE.BufferGeometry(); ag.setAttribute('position', new THREE.BufferAttribute(new Float32Array(ap), 3)); ag.setAttribute('color', new THREE.BufferAttribute(new Float32Array(ac), 3));
    this.arms = add(new THREE.Points(ag, new THREE.PointsMaterial({ size: 0.06, vertexColors: true, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false })), this.core); this.arms.rotation.x = 0.25;
    this.jets = add(new THREE.Group(), this.core);
    [1, -1].forEach((d) => { const j = add(new THREE.Mesh(new THREE.ConeGeometry(0.55, 7, 24, 1, true), new THREE.MeshBasicMaterial({ color: 0x9fd8ff, transparent: true, opacity: 0.22, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })), this.jets); j.position.y = d * 4.2; j.rotation.x = d > 0 ? Math.PI : 0; add(wire(new THREE.ConeGeometry(0.55, 7, 12, 4, true), 0xbfe8ff, 0.2), j); });
    const gc = document.createElement('canvas'); gc.width = gc.height = 256; const gx = gc.getContext('2d'), gr = gx.createRadialGradient(128, 128, 0, 128, 128, 128);
    gr.addColorStop(0, 'rgba(255,190,140,.10)'); gr.addColorStop(0.3, 'rgba(200,120,255,.07)'); gr.addColorStop(0.65, 'rgba(90,130,255,.04)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); gx.fillStyle = gr; gx.fillRect(0, 0, 256, 256);
    this.nebula = add(new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(gc), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false })), this.core); this.nebula.scale.setScalar(19);
    this.crown = add(wire(new THREE.IcosahedronGeometry(6.2, 3), 0xffe6c4, 0.07), this.core);
    this.shock = add(circle(1, 0xffd9a8, 0, 128), s); this.shock.position.y = CORE_Y; this.shockT = -1;
    this.beam = add(new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.22, 30, 24, 1, true), new THREE.MeshBasicMaterial({ color: GOLD, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false })), s);
    this.beam.position.y = CORE_Y + 15;
    this.coreLabel = this.makeLabel('core', '#ffb35c'); this.coreLabel.style.display = 'none';
  }
  setCore({ born, level = 1, progress = 0, name = 'ÆON', stage = '' }) {
    this.coreState = { born, level, progress };
    this.core.visible = born; this.plat.visible = born && level >= 3;
    if (!born) { this.coreLabel.style.display = 'none'; return; }
    this.coreLabel.style.display = '';
    this.coreLabel.innerHTML = `${name}<small>${stage} · LVL ${level}</small>`;
    const s = Math.min(3.2, 0.45 + 0.3 * Math.sqrt(level - 1));
    this.coreScaleTarget = s;
    this.ico.visible = level >= 2; this.ico2.visible = true;
    this.shell.geometry.setDrawRange(0, Math.min(this.shellN, 250 + level * 140));
    this.rings[1].visible = level >= 6; this.rings[3].visible = level >= 10; this.ticks.visible = level >= 4;
    this.orbits.forEach((o, i) => (o.visible = level >= [8, 14, 22][i])); this.corona.visible = level >= 18; this.layout();
    this.beamTarget = level >= 5 ? Math.min(0.55, 0.15 + level * 0.02) : 0;
    this.plat.scale.setScalar(Math.min(1.4, 0.6 + level * 0.04));
    this.arms.visible = level >= 15; this.jets.visible = level >= 22; this.nebula.visible = level >= 30; this.crown.visible = level >= 45;
    // star temperature: warm gold when young, white-blue as it matures
    const k = Math.min(1, (level - 1) / 40); this.ico.material.color.set(0xffb35c).lerp(new THREE.Color(0xdfe9ff), k); this.heart.material.color.set(0xffe6c4).lerp(new THREE.Color(0xffffff), k);
    if (this.lastCoreLevel && level > this.lastCoreLevel) this.shockT = 0;
    this.lastCoreLevel = level;
  }
  // Birth cinematic: swoop in on the newborn core, then drift back out.
  focusCore() { this.zoomBack = this.cam.position.length(); this.cam.position.setLength(24); this.zoomHold = 4; this.shockT = 0; }

  // ---------- agents ----------
  makeLabel(id, color) {
    const d = document.createElement('div'); d.className = 'lbl'; d.style.color = color; d.style.textShadow = `0 0 10px ${color}`;
    d.addEventListener('click', () => this.onAgentClick(id)); this.labels.appendChild(d); return d;
  }
  layout() {
    const list = [...this.agents.values()], n = list.length, R = (n <= 4 ? 11 : n <= 6 ? 12.5 : 14) + (this.coreState.born ? Math.max(0, (this.coreScaleTarget || 0.5) - 0.8) * 2.0 : 0);
    list.forEach((a, i) => { const ang = i / n * Math.PI * 2 + Math.PI / 4 + Math.PI / n; a.target = new THREE.Vector3(Math.cos(ang) * R, 0, Math.sin(ang) * R); if (!a.placed) { a.grp.position.copy(a.target); a.placed = true; } });
  }
  upsertAgent(ag) {
    let v = this.agents.get(ag.id);
    const form = ag.bornAt && Date.now() - ag.bornAt < 45000 ? 'newborn' : ag.form;
    if (v && v.form !== form) { this.scene.remove(v.grp); v.label.remove(); this.agents.delete(ag.id); v = null; }
    if (!v) {
      const grp = add(new THREE.Group(), this.scene), c = new THREE.Color(ag.color);
      add(edges(new THREE.CylinderGeometry(1.3, 1.3, 0.12, 6), c, 0.9), grp).position.y = 0.06;
      add(new THREE.Mesh(new THREE.CylinderGeometry(1.3, 1.3, 0.12, 6), new THREE.MeshBasicMaterial({ color: c.clone().multiplyScalar(0.12) })), grp).position.y = 0.06;
      add(circle(1.8, c, 0.35), grp).position.y = 0.03;
      const col = add(new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 2.2, 8), new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending })), grp); col.position.y = 1.2;
      const body = add(new THREE.Group(), grp); body.position.y = 3.3;
      const upd = BUILDERS[form](body, c);
      v = { id: ag.id, grp, body, upd, form, label: this.makeLabel(ag.id, ag.color), color: ag.color, placed: false, phase: Math.random() * 6 };
      this.agents.set(ag.id, v); this.layout();
    }
    v.level = ag.level; v.bornAt = ag.bornAt;
    v.scaleTarget = 0.62 + 0.05 * Math.min(ag.level, 12);
    v.label.innerHTML = `${ag.name}<small>LVL ${ag.level} · ${ag.status || 'pihen'}</small>`;
  }
  removeAgent(id) { const v = this.agents.get(id); if (!v) return; this.scene.remove(v.grp); v.label.remove(); this.agents.delete(id); this.layout(); }
  agentPos(id) { const v = this.agents.get(id); return v ? v.grp.position.clone().add(new THREE.Vector3(0, v.body.position.y, 0)) : new THREE.Vector3(0, CORE_Y, 0); }

  // ---------- knowledge pulses ----------
  pulse(fromId, to, color, count = 14) {
    const a = this.agentPos(fromId), b = to === 'core' ? new THREE.Vector3(0, CORE_Y, 0) : this.agentPos(to);
    const mid = a.clone().add(b).multiplyScalar(0.5); mid.y += 4 + a.distanceTo(b) * 0.2;
    const curve = new THREE.QuadraticBezierCurve3(a, mid, b);
    const line = add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(curve.getPoints(60)), lm(color, 0.35)), this.scene);
    const p = add(pts(new Array(count * 3).fill(0), color, 0.3, 1), this.scene);
    this.pulses.push({ curve, line, p, count, t0: this.t, dur: 2.2 });
  }
  hotspot(coords, color) {
    if (!coords) return;
    const p = this.lonlat(coords.lon, coords.lat), c = new THREE.Color(color);
    const g = add(new THREE.Group(), this.scene); g.position.set(p.x, 0.06, p.z);
    const r = add(circle(0.5, c, 0.9), g); add(circle(0.22, c, 0.9), g);
    const b = add(new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.6, 6), new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0.75, blending: THREE.AdditiveBlending })), g); b.position.y = 0.8;
    this.hotspots.push({ g, r, ph: Math.random() });
    if (this.hotspots.length > 40) { const old = this.hotspots.shift(); this.scene.remove(old.g); }
  }

  // ---------- category panels ----------
  setCategories(counts) {
    const ranked = Object.entries(counts).filter(([, n]) => n > 0).sort((a, b) => b[1] - a[1]).slice(0, 9).map(([id]) => id);
    for (const [id, pnl] of this.panels) if (!ranked.includes(id)) { this.scene.remove(pnl.m); this.scene.remove(pnl.stem); this.panels.delete(id); }
    const n = ranked.length;
    ranked.forEach((id, i) => {
      let pnl = this.panels.get(id); const cat = CAT[id];
      if (!pnl) {
        const cv = document.createElement('canvas'); cv.width = 640; cv.height = 380;
        const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace;
        const m = add(new THREE.Mesh(new THREE.PlaneGeometry(6.3, 3.75), new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0, depthWrite: false, fog: false, side: THREE.DoubleSide })), this.scene);
        const stem = add(new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 1, 4), new THREE.MeshBasicMaterial({ color: cat.color, transparent: true, opacity: 0.3, fog: false })), this.scene);
        pnl = { cv, tex, m, stem, count: -1 }; this.panels.set(id, pnl);
      }
      const span = Math.min(74, 12 + n * 9), a = (225 - span / 2 + (n === 1 ? span / 2 : i * span / (n - 1))) * Math.PI / 180;
      pnl.pos = new THREE.Vector3(Math.cos(a) * 28, i % 2 ? 1.6 : 4.9, Math.sin(a) * 28);
      if (pnl.count !== counts[id]) { pnl.count = counts[id]; this.drawPanel(pnl, cat, counts[id]); }
    });
  }
  drawPanel(pnl, cat, count) {
    const x = pnl.cv.getContext('2d'), c = cat.color; x.clearRect(0, 0, 640, 380);
    const gr = x.createLinearGradient(0, 0, 0, 380); gr.addColorStop(0, 'rgba(8,24,44,.78)'); gr.addColorStop(1, 'rgba(3,10,22,.58)'); x.fillStyle = gr; x.fillRect(0, 0, 640, 380);
    x.strokeStyle = c; x.globalAlpha = 0.6; x.lineWidth = 2; x.strokeRect(4, 4, 632, 372); x.globalAlpha = 1; x.lineWidth = 5;
    [[4, 4, 1, 1], [636, 4, -1, 1], [4, 376, 1, -1], [636, 376, -1, -1]].forEach(([a, b, sx, sy]) => { x.beginPath(); x.moveTo(a, b + sy * 36); x.lineTo(a, b); x.lineTo(a + sx * 36, b); x.stroke(); });
    drawIcon(x, cat.icon, c, 120, 190);
    x.fillStyle = c; x.shadowColor = c; x.shadowBlur = 12; x.font = '700 38px Orbitron, sans-serif'; x.fillText(cat.name.toUpperCase(), 250, 150); x.shadowBlur = 0;
    x.fillStyle = 'rgba(220,240,255,.85)'; x.font = '600 30px Rajdhani, sans-serif'; x.fillText(`${count} tudáscsomópont`, 252, 200);
    x.fillStyle = 'rgba(255,255,255,.12)'; x.fillRect(252, 232, 340, 8); x.fillStyle = c; x.fillRect(252, 232, 340 * Math.min(1, Math.log10(count + 1) / 3), 8);
    x.font = '22px "JetBrains Mono", monospace'; x.fillStyle = 'rgba(180,220,255,.55)'; x.fillText('▸ szinkron aktív', 252, 290);
    pnl.tex.needsUpdate = true;
  }

  // ---------- frame ----------
  frame() {
    const dt = Math.min(0.05, this.clock.getDelta()); this.t += dt; const t = this.t;
    this.tickFns.forEach((f) => f(dt));
    // agents
    for (const v of this.agents.values()) {
      if (v.target) v.grp.position.lerp(v.target, 0.04);
      const s = v.body.scale.x + ((v.scaleTarget || 0.7) - v.body.scale.x) * 0.05; v.body.scale.setScalar(s);
      v.body.position.y = 3.3 + 0.2 * Math.sin(t * 1.4 + v.phase);
      if (v.form === 'newborn') v.body.userData.progress = Math.min(1, (Date.now() - (v.bornAt || 0)) / 45000);
      v.upd(t);
    }
    // seed (before birth) and core
    const cs = this.coreState;
    this.seed.visible = !cs.born; this.seedPts.material.opacity = 0.15 + 0.75 * cs.progress; this.seed.rotation.y = t * 0.4; this.seed.scale.setScalar(0.4 + cs.progress * 0.6 + 0.05 * Math.sin(t * 3));
    if (cs.born) {
      const cur = this.core.scale.x, tgt = this.coreScaleTarget || 0.5; this.core.scale.setScalar(cur + (tgt - cur) * 0.02);
      this.core.rotation.y = t * 0.25; this.ico.rotation.x = t * 0.15; this.ico2.rotation.y = -t * 0.5; this.shell.rotation.y = -t * 0.08;
      this.heart.scale.setScalar((1 + 0.12 * Math.sin(t * 3)) / Math.max(1, this.core.scale.x * 0.7)); this.rings[0].rotation.y = t * 0.3; this.ticks.rotation.y = -t * 0.15;
      this.orbits.forEach((o) => { const u = o.userData; u.m.position.set(Math.cos(t * u.sp) * u.r, 0, Math.sin(t * u.sp) * u.r); }); this.corona.rotation.y = t * 0.05;
      this.rings[2].position.y = 0.9 + 0.15 * Math.sin(t * 2); this.plat.position.y = 0.15 * Math.sin(t * 0.8);
    }
    if (cs.born) { this.arms.rotation.y = t * 0.12; this.jets.rotation.y = t * 0.6; this.crown.rotation.y = -t * 0.04; this.nebula.material.opacity = 0.6 + 0.25 * Math.sin(t * 0.7); }
    if (this.shockT >= 0) { this.shockT += dt; const k = this.shockT / 2.2; this.shock.scale.setScalar(1 + k * 22); this.shock.material.opacity = 0.9 * (1 - k); if (k >= 1) { this.shockT = -1; this.shock.material.opacity = 0; } }
    if (this.zoomBack) { if (this.zoomHold > 0) this.zoomHold -= dt; else { const L = this.cam.position.length(); this.cam.position.setLength(L + (this.zoomBack - L) * 0.015); if (Math.abs(L - this.zoomBack) < 0.3) this.zoomBack = 0; } }
    const bt = cs.born ? (this.beamTarget || 0) : 0; this.beam.material.opacity += (bt * (0.8 + 0.2 * Math.sin(t * 2)) - this.beam.material.opacity) * 0.05;
    // pulses
    const tmp = new THREE.Vector3();
    this.pulses = this.pulses.filter((q) => {
      const k = (t - q.t0) / q.dur;
      if (k > 1.3) { this.scene.remove(q.line); this.scene.remove(q.p); q.line.geometry.dispose(); q.p.geometry.dispose(); return false; }
      const a = q.p.geometry.attributes.position.array;
      for (let i = 0; i < q.count; i++) { const u = Math.min(1, Math.max(0, k - i * 0.025)); q.curve.getPoint(u, tmp); a.set([tmp.x, tmp.y, tmp.z], i * 3); }
      q.p.geometry.attributes.position.needsUpdate = true; q.line.material.opacity = 0.35 * (1 - Math.max(0, k - 1) / 0.3);
      return true;
    });
    this.hotspots.forEach((h, i) => { const k = (t * 0.8 + h.ph) % 1; h.r.scale.setScalar(0.5 + k * 2.2); h.r.material.opacity = 0.9 * (1 - k); });
    for (const p of this.panels.values()) {
      if (!p.pos) continue; p.m.position.lerp(p.pos, 0.05); p.m.position.y = p.pos.y + 0.25 * Math.sin(t * 0.9 + p.pos.x);
      p.m.lookAt(this.cam.position.x, p.m.position.y, this.cam.position.z); p.m.material.opacity = Math.min(0.92, p.m.material.opacity + 0.01);
      p.stem.scale.y = Math.max(0.1, p.m.position.y - 1.9); p.stem.position.set(p.m.position.x, p.stem.scale.y / 2, p.m.position.z);
    }
    this.dust.rotation.y = t * 0.02;
    this.controls.update();
    if (this.bloom.enabled) this.composer.render(); else this.renderer.render(this.scene, this.cam);
    // labels
    const W = this.container.clientWidth, H = this.container.clientHeight;
    const place = (el, pos, below) => { pos.project(this.cam); const lx = (pos.x + 1) / 2 * W, ly = (1 - pos.y) / 2 * H, right = lx > W / 2; el.style.left = lx + (right ? 70 : -70) + 'px'; el.style.top = ly + (below || 0) + 'px'; el.style.transform = right ? 'translate(0,-50%)' : 'translate(-100%,-50%)'; el.style.textAlign = right ? 'left' : 'right'; el.style.opacity = pos.z > 1 ? 0 : 1; };
    for (const v of this.agents.values()) place(v.label, v.grp.position.clone().setY(1.6));
    if (cs.born) { const p = new THREE.Vector3(0, CORE_Y + 2.6 * this.core.scale.x + 0.8, 0).project(this.cam); this.coreLabel.style.left = (p.x + 1) / 2 * W + 'px'; this.coreLabel.style.top = (1 - p.y) / 2 * H + 'px'; this.coreLabel.style.transform = 'translate(-50%,-100%)'; this.coreLabel.style.textAlign = 'center'; }
  }
  start() { const loop = () => { this.frame(); requestAnimationFrame(loop); }; loop(); }
}
