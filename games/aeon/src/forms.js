// Unique animated 3D forms for agents. Each builder adds meshes to group g and returns update(t).
import * as THREE from 'three';

export const lm = (c, o = 1) => new THREE.LineBasicMaterial({ color: c, transparent: true, opacity: o, blending: THREE.AdditiveBlending, depthWrite: false });
export const wire = (geo, c, o) => new THREE.LineSegments(new THREE.WireframeGeometry(geo), lm(c, o));
export const edges = (geo, c, o) => new THREE.LineSegments(new THREE.EdgesGeometry(geo), lm(c, o));
export const pts = (arr, c, size, o = 1) => {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(arr), 3));
  return new THREE.Points(g, new THREE.PointsMaterial({ color: c, size, transparent: true, opacity: o, blending: THREE.AdditiveBlending, depthWrite: false }));
};
export const circle = (r, c, o, seg = 96) => new THREE.Line(new THREE.BufferGeometry().setFromPoints(Array.from({ length: seg + 1 }, (_, k) => new THREE.Vector3(Math.cos(k / seg * Math.PI * 2) * r, 0, Math.sin(k / seg * Math.PI * 2) * r))), lm(c, o));
const add = (o, p) => (p.add(o), o);
const solid = (geo, c, o = 1) => new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: c, transparent: o < 1, opacity: o }));

function seeker(g, c) {
  const ring = add(solid(new THREE.TorusGeometry(1.1, 0.04, 8, 64), c), g);
  const ring2 = add(solid(new THREE.TorusGeometry(0.8, 0.025, 8, 64), c, 0.6), g);
  const eye = add(wire(new THREE.IcosahedronGeometry(0.42, 1), c, 1), g);
  add(solid(new THREE.SphereGeometry(0.14, 16, 8), 0xeafff2), g);
  const cone = add(wire(new THREE.ConeGeometry(1.6, 3.2, 24, 1, true), c, 0.16), g); cone.position.y = -1.6;
  const sweep = add(circle(1.6, c, 0.8), g); sweep.position.y = -3.15;
  return (t) => {
    ring.rotation.y = t * 1.2; ring.rotation.x = Math.sin(t * 0.7) * 0.6; ring2.rotation.x = t * 1.6; ring2.rotation.z = t * 0.4;
    eye.rotation.y = -t * 0.8; cone.rotation.y = t * 2;
    const k = 1 + 0.15 * Math.sin(t * 4); sweep.scale.set(k, 1, k); sweep.material.opacity = 0.4 + 0.4 * Math.sin(t * 4) ** 2;
  };
}
function analyst(g, c) {
  const outer = add(edges(new THREE.BoxGeometry(1.7, 1.7, 1.7), c, 1), g), inner = add(edges(new THREE.BoxGeometry(0.85, 0.85, 0.85), c, 0.9), g);
  const lg = new THREE.BufferGeometry(); lg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(48), 3));
  add(new THREE.LineSegments(lg, lm(c, 0.5)), g);
  const core = add(solid(new THREE.OctahedronGeometry(0.18), 0xe0ecff), g);
  const corners = []; for (const x of [-1, 1]) for (const y of [-1, 1]) for (const z of [-1, 1]) corners.push(new THREE.Vector3(x, y, z));
  const a = new THREE.Vector3(), b = new THREE.Vector3();
  return (t) => {
    outer.rotation.set(t * 0.35, t * 0.5, 0); inner.rotation.set(-t * 0.9, -t * 0.6, t * 0.3);
    const arr = lg.attributes.position.array;
    corners.forEach((v, i) => { a.copy(v).multiplyScalar(0.85).applyEuler(outer.rotation); b.copy(v).multiplyScalar(0.425).applyEuler(inner.rotation); arr.set([a.x, a.y, a.z, b.x, b.y, b.z], i * 6); });
    lg.attributes.position.needsUpdate = true; core.rotation.y = t * 3;
  };
}
function linguist(g, c) {
  const N = 60; const p = add(pts(new Array(N * 6).fill(0), c, 0.13), g);
  const rg = new THREE.BufferGeometry(); rg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(N / 3 * 6), 3));
  add(new THREE.LineSegments(rg, lm(c, 0.45)), g);
  const glyphs = add(pts(Array.from({ length: 120 }, () => [(Math.random() - 0.5) * 2.6, (Math.random() - 0.5) * 3, (Math.random() - 0.5) * 2.6]).flat(), 0xe6d4ff, 0.05, 0.8), g);
  return (t) => {
    const a = p.geometry.attributes.position.array, r = rg.attributes.position.array;
    for (let i = 0; i < N; i++) {
      const y = -1.5 + i / N * 3, ang = i * 0.35 + t * 1.4, x1 = Math.cos(ang) * 0.7, z1 = Math.sin(ang) * 0.7;
      a.set([x1, y, z1, -x1, y, -z1], i * 6); if (i % 3 === 0) r.set([x1, y, z1, -x1, y, -z1], i / 3 * 6);
    }
    p.geometry.attributes.position.needsUpdate = true; rg.attributes.position.needsUpdate = true; glyphs.rotation.y = -t * 0.3;
  };
}
function architect(g, c) {
  const cubes = [];
  for (let x = -1; x <= 1; x++) for (let y = -1; y <= 1; y++) for (let z = -1; z <= 1; z++) { const m = add(edges(new THREE.BoxGeometry(0.42, 0.42, 0.42), c, 0.55), g); m.userData.v = new THREE.Vector3(x, y, z); cubes.push(m); }
  const frame = add(edges(new THREE.BoxGeometry(2.1, 2.1, 2.1), c, 0.25), g);
  return (t) => {
    const e = 0.48 + 0.22 * Math.max(0, Math.sin(t * 1.3));
    cubes.forEach((m, i) => { m.position.copy(m.userData.v).multiplyScalar(e + 0.05 * Math.sin(t * 3 + i)); m.rotation.y = Math.sin(t + i) * 0.4; });
    g.rotation.y = t * 0.4; frame.rotation.y = -t * 0.8;
  };
}
function strategist(g, c) {
  const d = add(wire(new THREE.DodecahedronGeometry(0.8, 0), c, 1), g);
  const inner = add(solid(new THREE.DodecahedronGeometry(0.3, 0), 0xffd6de), g);
  const orbs = [0, 1, 2].map((i) => {
    const o = new THREE.Group(); o.rotation.set(i * 0.9 + 0.3, i * 1.1, 0); add(o, g); add(circle(1.35 + i * 0.15, c, 0.35), o);
    const s = add(wire(new THREE.OctahedronGeometry(0.16), c, 1), o); return { s, r: 1.35 + i * 0.15, sp: 1.2 + i * 0.5 };
  });
  return (t) => { d.rotation.set(t * 0.3, t * 0.6, 0); inner.rotation.y = -t; orbs.forEach((q) => { q.s.position.set(Math.cos(t * q.sp) * q.r, 0, Math.sin(t * q.sp) * q.r); q.s.rotation.y = t * 3; }); };
}
function crystal(g, c) {
  const main = add(wire(new THREE.OctahedronGeometry(0.75, 0), c, 1), g); main.scale.y = 1.6;
  add(solid(new THREE.OctahedronGeometry(0.25, 0), 0xffffff), g).scale.y = 1.6;
  const shards = Array.from({ length: 7 }, (_, i) => { const s = add(wire(new THREE.TetrahedronGeometry(0.22, 0), c, 0.9), g); s.userData = { a: i / 7 * Math.PI * 2, r: 1.2 + (i % 2) * 0.25, y: (i % 3 - 1) * 0.5 }; return s; });
  return (t) => { main.rotation.y = t * 0.6; shards.forEach((s, i) => { const a = s.userData.a + t * 0.5; s.position.set(Math.cos(a) * s.userData.r, s.userData.y + 0.2 * Math.sin(t * 2 + i), Math.sin(a) * s.userData.r); s.rotation.set(t * 2, t * 1.3, 0); }); };
}
function pulsar(g, c) {
  const knot = add(wire(new THREE.TorusKnotGeometry(0.7, 0.12, 80, 6, 2, 3), c, 0.85), g);
  const heart = add(solid(new THREE.SphereGeometry(0.2, 16, 8), 0xffffff), g);
  const halo = add(circle(1.3, c, 0.6), g);
  return (t) => { knot.rotation.set(t * 0.5, t * 0.8, 0); const k = 1 + 0.25 * Math.max(0, Math.sin(t * 5)); heart.scale.setScalar(k); halo.scale.setScalar(0.8 + ((t * 0.7) % 1) * 0.6); halo.material.opacity = 0.7 * (1 - ((t * 0.7) % 1)); };
}
function swarm(g, c) {
  const N = 220, base = [];
  for (let i = 0; i < N; i++) base.push({ r: 0.4 + Math.random() * 1.0, a: Math.random() * Math.PI * 2, b: (Math.random() - 0.5) * Math.PI, s: 0.5 + Math.random() * 1.5 });
  const p = add(pts(new Array(N * 3).fill(0), c, 0.08, 0.95), g);
  add(solid(new THREE.SphereGeometry(0.12, 12, 8), 0xffffff), g);
  return (t) => {
    const a = p.geometry.attributes.position.array;
    base.forEach((q, i) => { const th = q.a + t * q.s, ph = q.b + Math.sin(t * 0.7 + i) * 0.3; a.set([Math.cos(th) * Math.cos(ph) * q.r, Math.sin(ph) * q.r, Math.sin(th) * Math.cos(ph) * q.r], i * 3); });
    p.geometry.attributes.position.needsUpdate = true;
  };
}
function newborn(g, c) {
  const N = 400, tgt = [], src = [];
  for (let i = 0; i < N; i++) {
    const y = 1 - 2 * (i + 0.5) / N, r = Math.sqrt(1 - y * y), a = i * 2.39996;
    tgt.push(new THREE.Vector3(Math.cos(a) * r, y, Math.sin(a) * r).multiplyScalar(0.95));
    src.push(new THREE.Vector3((Math.random() - 0.5) * 4, (Math.random() - 0.5) * 4, (Math.random() - 0.5) * 4));
  }
  const p = add(pts(new Array(N * 3).fill(0), c, 0.06, 0.8), g);
  const shell = add(wire(new THREE.IcosahedronGeometry(1, 1), c, 0.15), g);
  g.userData.progress = 0;
  return (t) => {
    const a = p.geometry.attributes.position.array, base = g.userData.progress;
    tgt.forEach((v, i) => { const k = Math.min(1, base + 0.08 * Math.sin(t * 1.5 + i)); a.set([src[i].x + (v.x - src[i].x) * k, src[i].y + (v.y - src[i].y) * k, src[i].z + (v.z - src[i].z) * k], i * 3); });
    p.geometry.attributes.position.needsUpdate = true; shell.rotation.y = t * 0.3; shell.material.opacity = 0.08 + 0.08 * Math.abs(Math.sin(t * 5));
  };
}
export const BUILDERS = { seeker, analyst, linguist, architect, strategist, crystal, pulsar, swarm, newborn };
