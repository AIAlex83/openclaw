// DOM HUD: onboarding, panels, chat, modals (profile, knowledge, forge, settings).
import { ONBOARDING, CATEGORIES, CAT, FORMS, AGENT_COLORS } from './data.js';
import { xpFor, BIRTH } from './game.js';

const $ = (s, r = document) => r.querySelector(s);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmt = (n) => Math.round(n).toLocaleString('hu-HU');
const h = (html) => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; };

export class UI {
  constructor(world) { this.world = world; this.game = null; }
  bind(game) { this.game = game; }
  get s() { return this.game.s; }

  // ---------- onboarding ----------
  runOnboarding(done) {
    const ov = $('#onboard'); ov.hidden = false; let i = 0;
    const show = () => {
      const q = ONBOARDING[i]; const box = $('#ob-card', ov);
      box.innerHTML = `<div class="ob-step">FELMÉRÉS · ${i + 1} / ${ONBOARDING.length}</div><div class="ob-q">${esc(q.q)}</div><div class="ob-body"></div><div class="ob-actions"><button class="btn primary" id="ob-next">${i === ONBOARDING.length - 1 ? 'Ébresszétek fel őket' : 'Tovább'}</button></div>`;
      const body = $('.ob-body', box); let value;
      if (q.type === 'text') { body.innerHTML = `<input class="inp" id="ob-in" placeholder="${esc(q.placeholder)}" maxlength="160">`; const inp = $('#ob-in', body); setTimeout(() => inp.focus(), 50); inp.addEventListener('keydown', (e) => e.key === 'Enter' && $('#ob-next').click()); value = () => inp.value.trim() || q.def; }
      if (q.type === 'multi') { const sel = new Set(); body.innerHTML = `<div class="chips">${q.options.map((o) => `<button class="chip" data-v="${o.v}" style="--c:${CAT[o.v].color}">${esc(o.t)}</button>`).join('')}</div>`; body.querySelectorAll('.chip').forEach((b) => b.addEventListener('click', () => { b.classList.toggle('on'); sel.has(b.dataset.v) ? sel.delete(b.dataset.v) : sel.add(b.dataset.v); })); value = () => [...sel]; }
      if (q.type === 'single') { let v = null; body.innerHTML = `<div class="opts">${q.options.map((o) => `<button class="opt" data-v="${o.v}">${esc(o.t)}</button>`).join('')}</div>`; body.querySelectorAll('.opt').forEach((b) => b.addEventListener('click', () => { body.querySelectorAll('.opt').forEach((x) => x.classList.remove('on')); b.classList.add('on'); v = b.dataset.v; })); value = () => v || q.options[0].v; }
      if (q.type === 'likert') { body.innerHTML = q.items.map((it) => `<div class="lk"><div>${esc(it.t)}</div><div class="lk-row" data-k="${it.k}">${[1, 2, 3, 4, 5].map((n) => `<button class="lk-b${n === 3 ? ' on' : ''}" data-n="${n}">${n}</button>`).join('')}</div></div>`).join('') + '<div class="lk-legend"><span>egyáltalán nem</span><span>teljesen</span></div>'; body.querySelectorAll('.lk-row').forEach((r) => r.querySelectorAll('.lk-b').forEach((b) => b.addEventListener('click', () => { r.querySelectorAll('.lk-b').forEach((x) => x.classList.remove('on')); b.classList.add('on'); }))); value = () => Object.fromEntries([...body.querySelectorAll('.lk-row')].map((r) => [r.dataset.k, Number(r.querySelector('.on').dataset.n)])); }
      $('#ob-next').addEventListener('click', () => { this.game.answerOnboarding(q.id, value()); i++; if (i < ONBOARDING.length) show(); else { ov.classList.add('fade'); setTimeout(() => { ov.hidden = true; done(); }, 900); } });
    };
    show();
  }

  // ---------- main HUD ----------
  initHUD() {
    $('#hud').hidden = false;
    $('#cmd').addEventListener('submit', (e) => { e.preventDefault(); const i = $('#cmd-in'); const v = i.value; i.value = ''; this.game.command(v); });
    $('#b-profile').onclick = () => this.openProfile();
    $('#b-know').onclick = () => this.openKnowledge();
    $('#b-map').onclick = () => this.openMap();
    $('#b-forge').onclick = () => this.openForge();
    $('#b-settings').onclick = () => this.openSettings();
    $('#modal').addEventListener('click', (e) => { if (e.target.id === 'modal' || e.target.closest('.x')) this.closeModal(); });
    $('#chat-tg').onclick = () => { $('#chat').classList.toggle('min'); $('#chat-tg').textContent = $('#chat').classList.contains('min') ? '▴' : '▾'; };
    $('#b-mobile').onclick = () => document.body.classList.toggle('show-panels');
    $('#chat-msgs').innerHTML = ''; this.s.chat.slice(-40).forEach((m) => this.addMessage(m, true));
    $('#log').innerHTML = ''; this.s.log.slice(-20).forEach((e) => this.addLog(e));
    this.s.agents.forEach((a) => this.world.upsertAgent(a));
    if (this.s.pendingQ) this.showQuestion(this.s.pendingQ, this.game.agent(this.s.pendingQ.askedBy));
    this.refresh();
  }
  refresh() { this.renderAgents(); this.updateCore(); this.world.setCategories(this.game.catCounts()); $('#src').textContent = this.game.sourceName; }
  renderAgents() {
    const g = this.game;
    $('#agents').innerHTML = `<div class="t">ÜGYNÖKHÁLÓZAT <span class="dim">${g.s.agents.length} / ${g.agentSlots()}</span></div>` + g.s.agents.map((a) => {
      const lo = xpFor(a.level), hi = xpFor(a.level + 1), pct = Math.min(100, (a.xp - lo) / (hi - lo) * 100);
      return `<div class="arow" data-id="${a.id}"><span class="dot" style="color:${a.color}"></span><span class="an" style="color:${a.color}">${esc(a.name)}</span><span class="al">LVL ${a.level}${a.points > 0 ? ` <span class="pt" title="elosztható képességpont">+${a.points}</span>` : ''}</span><span class="as">${esc(a.status || '')}</span><div class="bar sm"><i style="width:${pct}%;background:${a.color}"></i></div></div>`;
    }).join('');
    $('#agents').querySelectorAll('.arow').forEach((r) => r.addEventListener('click', () => this.openAgent(r.dataset.id)));
  }
  updateAgent(ag) { this.world.upsertAgent(ag); clearTimeout(this._ra); this._ra = setTimeout(() => this.renderAgents(), 120); }
  addAgent(ag) { this.world.upsertAgent(ag); this.renderAgents(); }
  updateCore() {
    const g = this.game, c = g.s.core, el = $('#core');
    if (!c.born) {
      const b = g.birthProgress();
      el.innerHTML = `<div class="t">KÖZPONTI TUDAT</div><div class="big dim2">még nem született meg</div>
        <div class="sub">A tanítványaid megismernek téged, és tudást gyűjtenek. Ha mindhárom feltétel teljesül, megszületik a Központ.</div>
        ${[['Profil (megismerés)', b.p, `${Math.round(g.s.oracle.completeness * 100)} / ${BIRTH.completeness * 100} %`], ['Közös tudás', b.k, `${g.nodes.length} / ${BIRTH.nodes} csomópont`], ['Tanítványok érettsége', b.l, `átlag LVL ${g.avgLevel().toFixed(1)} / ${BIRTH.avgLevel}`]].map(([n, v, t]) => `<div class="row"><span>${n}</span><b>${t}</b></div><div class="bar"><i style="width:${v * 100}%"></i></div>`).join('')}`;
      this.world.setCore({ born: false, progress: b.total });
      return;
    }
    const lvl = g.coreLevel(), lo = xpFor(lvl) * 2, hi = xpFor(lvl + 1) * 2, pct = Math.min(100, (c.xp - lo) / (hi - lo) * 100);
    el.innerHTML = `<div class="t">KÖZPONTI TUDAT</div><div class="big">${esc(c.name)} <span class="o">LVL ${lvl}</span></div><div class="sub o">${g.coreStage()}</div>
      <div class="bar"><i style="width:${pct}%"></i></div>
      <div class="row"><span>Szinkronizált tudás</span><b class="o">${fmt(g.nodes.filter((n) => n.synced).length)}</b></div>
      <div class="row"><span>Ügynökök</span><b>${g.s.agents.length} / ${g.agentSlots()}</b></div>
      <div class="row"><span>Tudásforrás</span><b class="src2">${esc(g.sourceName)}</b></div>
      <div class="row"><span class="t" style="font-size:11px">ÚT A MINDENTUDÁSHOZ</span><b class="o">${g.omniscience().toFixed(5).replace('.', ',')} %</b></div>`;
    this.world.setCore({ born: true, level: lvl, name: c.name, stage: g.coreStage() });
  }
  setQueue(n) { $('#queue').textContent = n ? `${n} feladat folyamatban` : 'várakozik'; }

  // ---------- chat ----------
  who(from) {
    if (from === 'oracle') return { name: this.s.oracle.name, color: '#ff9a3c' };
    if (from === 'core') return { name: this.s.core.name || 'Központ', color: '#ffb35c' };
    const a = this.game.agent(from); return a ? { name: a.name, color: a.color } : { name: '?', color: '#9ab' };
  }
  addMessage(m, silent) {
    const w = this.who(m.from), box = $('#chat-msgs');
    const src = m.src ? `<div class="src">forrás: ${m.src.url ? `<a href="${esc(m.src.url)}" target="_blank" rel="noopener">${esc(m.src.title)}</a>` : esc(m.src.title)}${m.src.verified ? ' <span class="ok">✔ ellenőrzött</span>' : ''}${m.more?.length ? ' · továbbiak: ' + m.more.map((x) => (x.url ? `<a href="${esc(x.url)}" target="_blank" rel="noopener">${esc(x.title)}</a>` : esc(x.title))).join(', ') : ''}</div>` : '';
    const act = m.action?.type === 'forge' ? `<button class="btn sm" data-forge="${m.action.specialty}">Új ügynök létrehozása</button>` : '';
    const el = h(`<div class="msg ${m.from === 'oracle' ? 'me' : ''}${m.quiet ? ' quiet' : ''}"><div class="mw" style="color:${w.color}">${esc(w.name)}</div><div class="mt">${esc(m.text)}</div>${src}${act}</div>`);
    el.querySelector('[data-forge]')?.addEventListener('click', (e) => this.openForge(e.target.dataset.forge));
    box.appendChild(el); while (box.children.length > 60) box.firstChild.remove(); box.scrollTop = box.scrollHeight;
  }
  showQuestion(q, asker) {
    const box = $('#chat-msgs'), w = asker ? { name: asker.name, color: asker.color } : this.who('core');
    const el = h(`<div class="msg qcard"><div class="mw" style="color:${w.color}">${esc(w.name)} kérdezi</div><div class="mt">${esc(q.q)}</div><div class="qopts"></div></div>`);
    const opts = el.querySelector('.qopts');
    if (q.type === 'text') { opts.innerHTML = `<form class="qform"><input class="inp" placeholder="${esc(q.placeholder || '')}"><button class="btn sm">Válasz</button></form>`; opts.querySelector('form').addEventListener('submit', (e) => { e.preventDefault(); const v = opts.querySelector('input').value; el.classList.add('done'); opts.innerHTML = `<i>${esc(v || '—')}</i>`; this.game.answerFollowup(q, v); }); }
    else q.options.forEach((o) => { const b = h(`<button class="btn sm">${esc(o.t)}</button>`); b.addEventListener('click', () => { el.classList.add('done'); opts.innerHTML = `<i>${esc(o.t)}</i>`; this.game.answerFollowup(q, o); }); opts.appendChild(b); });
    box.appendChild(el); box.scrollTop = box.scrollHeight;
    this.toast(`${w.name} kérdést tett fel neked`, w.color);
  }
  addLog(e) {
    const box = $('#log'); const el = h(`<div class="le ${e.kind}"><span style="color:${e.color}">▸ ${esc(e.who)}</span> ${esc(e.text)}</div>`);
    box.appendChild(el); while (box.children.length > 9) box.firstChild.remove();
  }
  toast(text, color = '#5fe3ff') { const el = h(`<div class="toast" style="--c:${color}">${esc(text)}</div>`); $('#toasts').appendChild(el); setTimeout(() => el.classList.add('out'), 3200); setTimeout(() => el.remove(), 4000); }
  birthCinematic() {
    const el = $('#birth'); el.hidden = false; el.innerHTML = `<div class="bt">A KÖZPONTI TUDAT MEGSZÜLETETT</div><div class="bs">${esc(this.s.core.name)}</div>`;
    setTimeout(() => el.classList.add('out'), 4200); setTimeout(() => { el.hidden = true; el.classList.remove('out'); }, 5200);
  }

  // ---------- modals ----------
  modal(title, html) { const m = $('#modal'); m.hidden = false; $('#modal-box').innerHTML = `<div class="mh"><span class="t">${esc(title)}</span><button class="x">✕</button></div><div class="mb">${html}</div>`; return $('#modal-box'); }
  closeModal() { $('#modal').hidden = true; }
  openAgent(id) {
    const a = this.game.agent(id); if (!a) return;
    const nodes = a.known.map((k) => this.s.knowledge[k]).filter(Boolean).slice(-25).reverse();
    this.modal(a.name, `<div class="agent-head" style="--c:${a.color}"><div class="big" style="color:${a.color}">${esc(a.name)} <span class="al">LVL ${a.level}</span></div><div class="sub">${esc(a.desc || '')}</div>
      <div class="row"><span>Forma</span><b>${esc(FORMS.find((f) => f.id === a.form)?.name || a.form)}</b></div><div class="row"><span>Tapasztalat</span><b>${fmt(a.xp)} XP (következő szint: ${fmt(xpFor(a.level + 1))})</b></div>
      <div class="row"><span>Sebesség</span><b>+${Math.round(a.level * 8)} %</b></div><div class="row"><span>Saját tudáscsomópontok</span><b>${a.known.length}</b></div><div class="row"><span>Állapot</span><b>${esc(a.status)}</b></div></div>
      <div class="t" style="margin-top:14px">KÉPESSÉGEK <span class="dim">· elosztható pont: <b id="pts">${a.points || 0}</b></span></div>
      <div id="skills">${[['speed', 'Sebesség', 'gyorsabban dolgozik'], ['depth', 'Mélység', 'több forrást dolgoz fel egyszerre'], ['accuracy', 'Pontosság', 'több XP, szigorúbb ellenőrzés']].map(([k, n, d]) => `<div class="skill"><span><b>${n}</b> <span class="dim">${d}</span></span><span class="pips">${Array.from({ length: 10 }, (_, i) => `<i class="${i < (a.skills?.[k] || 0) ? 'on' : ''}" style="--c:${a.color}"></i>`).join('')}</span><button class="btn sm" data-sk="${k}" ${a.points > 0 ? '' : 'disabled'}>+</button></div>`).join('')}</div>
      <div class="t" style="margin-top:14px">LEGUTÓBBI TUDÁS</div>${nodes.length ? nodes.map((n) => this.nodeRow(n)).join('') : '<div class="dim">Még nincs saját tudása.</div>'}`);
    this.bindSkills(id);
  }
  bindSkills(id) { document.querySelectorAll('#skills [data-sk]').forEach((b) => b.addEventListener('click', () => { if (this.game.spendPoint(id, b.dataset.sk)) { this.openAgent(id); this.toast('Képesség fejlesztve', this.game.agent(id).color); } })); }
  // Star map of everything learned: categories pull nodes together, shared tags/related topics draw links.
  openMap() {
    const g = this.game, nodes = g.nodes.slice(-400);
    const box = this.modal(`Tudástérkép · ${g.nodes.length} csomópont`, `<canvas id="kmap" width="900" height="560"></canvas><div id="kinfo" class="sub">Kattints egy csillagra a részletekért. A színek a tudásterületeket jelölik, a vonalak a közös fogalmakat.</div>`);
    const cv = box.querySelector('#kmap'), x = cv.getContext('2d'), W = cv.width, H = cv.height;
    const cats = [...new Set(nodes.map((n) => n.cat))], anchor = Object.fromEntries(cats.map((c, i) => { const a = i / cats.length * Math.PI * 2; return [c, [W / 2 + Math.cos(a) * W * 0.3, H / 2 + Math.sin(a) * H * 0.3]]; }));
    const P = nodes.map((n) => ({ n, x: anchor[n.cat][0] + (Math.random() - 0.5) * 80, y: anchor[n.cat][1] + (Math.random() - 0.5) * 80, vx: 0, vy: 0 }));
    const E = []; for (let i = 0; i < P.length; i++) for (let j = i + 1; j < P.length; j++) { const a = P[i].n, b = P[j].n; const shared = (a.tags || []).filter((t) => (b.tags || []).includes(t)).length + (a.query && a.query === b.query ? 2 : 0); if (shared >= 2) E.push([i, j]); }
    for (let it = 0; it < 220; it++) {
      for (const p of P) { const [ax, ay] = anchor[p.n.cat]; p.vx += (ax - p.x) * 0.004; p.vy += (ay - p.y) * 0.004; }
      for (let i = 0; i < P.length; i++) for (let j = i + 1; j < P.length; j++) { const a = P[i], b = P[j], dx = a.x - b.x, dy = a.y - b.y, d2 = dx * dx + dy * dy + 0.01; if (d2 < 3600) { const f = 40 / d2; a.vx += dx * f; a.vy += dy * f; b.vx -= dx * f; b.vy -= dy * f; } }
      for (const [i, j] of E) { const a = P[i], b = P[j]; a.vx += (b.x - a.x) * 0.002; a.vy += (b.y - a.y) * 0.002; b.vx += (a.x - b.x) * 0.002; b.vy += (a.y - b.y) * 0.002; }
      for (const p of P) { p.x = Math.max(14, Math.min(W - 14, p.x + p.vx)); p.y = Math.max(14, Math.min(H - 14, p.y + p.vy)); p.vx *= 0.82; p.vy *= 0.82; }
    }
    let sel = null;
    const draw = () => {
      x.fillStyle = '#020713'; x.fillRect(0, 0, W, H);
      for (let i = 0; i < 160; i++) { x.fillStyle = `rgba(255,255,255,${(i * 37 % 10) / 40})`; x.fillRect((i * 97) % W, (i * 53) % H, 1, 1); }
      x.lineWidth = 1; for (const [i, j] of E) { x.strokeStyle = sel && (P[i] === sel || P[j] === sel) ? 'rgba(255,200,140,.8)' : 'rgba(120,200,255,.13)'; x.beginPath(); x.moveTo(P[i].x, P[i].y); x.lineTo(P[j].x, P[j].y); x.stroke(); }
      x.font = '700 12px Orbitron, sans-serif'; x.textAlign = 'center';
      for (const c of cats) { const [ax, ay] = anchor[c]; x.fillStyle = CAT[c].color; x.globalAlpha = 0.5; x.fillText(CAT[c].name.toUpperCase(), ax, ay - 46); x.globalAlpha = 1; }
      for (const p of P) { const c = CAT[p.n.cat]?.color || '#9ab', r = p === sel ? 7 : p.n.verified ? 4.5 : 3.2; x.shadowColor = c; x.shadowBlur = 12; x.fillStyle = c; x.beginPath(); x.arc(p.x, p.y, r, 0, 7); x.fill(); x.shadowBlur = 0; }
      if (sel) { x.fillStyle = '#fff'; x.font = '600 15px Rajdhani, sans-serif'; x.fillText(sel.n.title, sel.x, sel.y - 12); }
    };
    cv.addEventListener('click', (e) => { const r = cv.getBoundingClientRect(), mx = (e.clientX - r.left) * W / r.width, my = (e.clientY - r.top) * H / r.height; sel = P.reduce((b, p) => (Math.hypot(p.x - mx, p.y - my) < Math.hypot((b?.x ?? 1e9) - mx, (b?.y ?? 1e9) - my) ? p : b), null); if (sel && Math.hypot(sel.x - mx, sel.y - my) > 24) sel = null; box.querySelector('#kinfo').innerHTML = sel ? this.nodeRow(sel.n) : 'Kattints egy csillagra a részletekért.'; draw(); });
    draw();
  }
  nodeRow(n) {
    const c = CAT[n.cat] || CAT.altalanos, owner = this.game.agent(n.by);
    return `<div class="node"><div><span class="cchip" style="--c:${c.color}">${c.name}</span> <b>${n.url ? `<a href="${esc(n.url)}" target="_blank" rel="noopener">${esc(n.title)}</a>` : esc(n.title)}</b>${n.verified ? ' <span class="ok">✔</span>' : ''} <span class="dim">· ${esc(owner?.name || '')} · ${esc(n.sourceName || '')}</span></div><div class="nx">${esc(n.extract.slice(0, 260))}${n.extract.length > 260 ? '…' : ''}</div></div>`;
  }
  openKnowledge() {
    const g = this.game, counts = g.catCounts();
    const box = this.modal(`Tudástár · ${g.nodes.length} csomópont`, `<input class="inp" id="kq" placeholder="Keresés a tudásban…"><div class="chips sm" id="kc"><button class="chip on" data-c="">Mind</button>${CATEGORIES.filter((c) => counts[c.id]).map((c) => `<button class="chip" data-c="${c.id}" style="--c:${c.color}">${c.name} ${counts[c.id]}</button>`).join('')}</div><div id="kl"></div>`);
    let cat = '';
    const render = () => { const q = $('#kq', box).value.toLowerCase(); const list = g.nodes.filter((n) => (!cat || n.cat === cat) && (!q || (n.title + ' ' + n.extract).toLowerCase().includes(q))).sort((a, b) => b.ts - a.ts).slice(0, 80); $('#kl', box).innerHTML = list.length ? list.map((n) => this.nodeRow(n)).join('') : '<div class="dim">Nincs találat. Adj új kutatási irányt a parancssorban.</div>'; };
    $('#kq', box).addEventListener('input', render);
    box.querySelectorAll('#kc .chip').forEach((b) => b.addEventListener('click', () => { box.querySelectorAll('#kc .chip').forEach((x) => x.classList.remove('on')); b.classList.add('on'); cat = b.dataset.c; render(); }));
    render();
  }
  openProfile() {
    const o = this.s.oracle, ints = Object.entries(o.interests).filter(([k]) => CAT[k]).sort((a, b) => b[1] - a[1]).slice(0, 8), max = Math.max(1, ...ints.map(([, v]) => v));
    const box = this.modal(`${o.name} · Orákulum-profil`, `<div class="big o">${esc(o.archetype?.name || '…')}</div><div class="sub">${esc(o.archetype?.desc || '')}</div>
      ${o.portrait ? `<div class="portrait">„${esc(o.portrait)}”</div>` : ''}
      <div class="row"><span>Megismerés</span><b>${Math.round(o.completeness * 100)} %</b></div><div class="bar"><i style="width:${o.completeness * 100}%"></i></div>
      <div class="pgrid"><canvas id="radar" width="320" height="300"></canvas><div><div class="t">ÉRDEKLŐDÉS</div>${ints.map(([k, v]) => `<div class="row"><span style="color:${CAT[k].color}">${CAT[k].name}</span></div><div class="bar sm"><i style="width:${v / max * 100}%;background:${CAT[k].color}"></i></div>`).join('') || '<div class="dim">még ismeretlen</div>'}</div></div>
      ${o.bigq ? `<div class="row"><span>Nagy kérdésed</span><b>${esc(o.bigq)}</b></div>` : ''}${o.work ? `<div class="row"><span>Területed</span><b>${esc(o.work)}</b></div>` : ''}
      <div class="dim" style="margin-top:8px">A profil a válaszaidból és abból épül, hogy miről kérdezed a tanítványaidat. A felmérés nem pszichológiai diagnózis, hanem a játék irányítását szolgálja.</div>`);
    const cv = $('#radar', box), x = cv.getContext('2d'), keys = [['open', 'Nyitottság'], ['consc', 'Rendszeresség'], ['intuit', 'Intuíció'], ['social', 'Társas energia'], ['skept', 'Szkepszis']], cx = 160, cy = 150, R = 100;
    x.strokeStyle = 'rgba(95,227,255,.25)'; x.fillStyle = '#9fdcff'; x.font = '13px Rajdhani, sans-serif'; x.textAlign = 'center';
    for (let r = 1; r <= 5; r++) { x.beginPath(); keys.forEach((_, i) => { const a = -Math.PI / 2 + i / 5 * Math.PI * 2; x[i ? 'lineTo' : 'moveTo'](cx + Math.cos(a) * R * r / 5, cy + Math.sin(a) * R * r / 5); }); x.closePath(); x.stroke(); }
    keys.forEach(([k, n], i) => { const a = -Math.PI / 2 + i / 5 * Math.PI * 2; x.fillText(n, cx + Math.cos(a) * (R + 26), cy + Math.sin(a) * (R + 22) + 4); });
    x.beginPath(); keys.forEach(([k], i) => { const a = -Math.PI / 2 + i / 5 * Math.PI * 2, v = (o.traits[k] || 3) / 5; x[i ? 'lineTo' : 'moveTo'](cx + Math.cos(a) * R * v, cy + Math.sin(a) * R * v); }); x.closePath();
    x.fillStyle = 'rgba(255,154,60,.25)'; x.fill(); x.strokeStyle = '#ff9a3c'; x.lineWidth = 2; x.stroke();
  }
  openForge(preset) {
    const g = this.game;
    if (!g.s.core.born) { this.modal('Új ügynök', `<div class="sub">Új ügynököt a <b>Központi Tudat</b> tud létrehozni. Előbb hagyd, hogy a négy tanítvány megismerjen és tudást gyűjtsön, amíg a Központ megszületik.</div>`); return; }
    const free = g.agentSlots() - g.s.agents.length;
    let form = 'crystal', color = AGENT_COLORS.find((c) => !g.s.agents.some((a) => a.color === c)) || AGENT_COLORS[0];
    const box = this.modal('Ügynök-kovácsműhely', `<div class="sub">Szabad helyek: <b>${free}</b> (a Központ szintjével nő). Az új ügynök egy választott területre szakosodik, és minden tudását a Központba tölti fel.</div>
      <label>Név</label><input class="inp" id="f-name" placeholder="pl. Szófia, Tesla, Gaia…" maxlength="24">
      <label>Szakterület</label><select class="inp" id="f-spec">${CATEGORIES.filter((c) => c.id !== 'altalanos').map((c) => `<option value="${c.id}" ${preset === c.id ? 'selected' : ''}>${c.name}</option>`).join('')}<option value="__custom">Egyéni terület…</option></select>
      <input class="inp" id="f-custom" placeholder="pl. ókori csillagászat, kvantumbiológia" hidden>
      <label>Forma</label><div class="forms">${FORMS.map((f) => `<button class="fopt${f.id === form ? ' on' : ''}" data-f="${f.id}"><b>${f.name}</b><span>${f.hint}</span></button>`).join('')}</div>
      <label>Szín</label><div class="sw">${AGENT_COLORS.map((c) => `<button class="swc${c === color ? ' on' : ''}" data-c="${c}" style="background:${c}"></button>`).join('')}</div>
      <div class="ob-actions"><button class="btn primary" id="f-go" ${free <= 0 ? 'disabled' : ''}>Létrehozás</button></div><div id="f-err" class="err"></div>`);
    $('#f-spec', box).addEventListener('change', (e) => ($('#f-custom', box).hidden = e.target.value !== '__custom'));
    box.querySelectorAll('.fopt').forEach((b) => b.addEventListener('click', () => { box.querySelectorAll('.fopt').forEach((x) => x.classList.remove('on')); b.classList.add('on'); form = b.dataset.f; }));
    box.querySelectorAll('.swc').forEach((b) => b.addEventListener('click', () => { box.querySelectorAll('.swc').forEach((x) => x.classList.remove('on')); b.classList.add('on'); color = b.dataset.c; }));
    $('#f-go', box).addEventListener('click', () => {
      const spec = $('#f-spec', box).value === '__custom' ? $('#f-custom', box).value.trim() : $('#f-spec', box).value;
      if (!spec) { $('#f-err', box).textContent = 'Adj meg egy szakterületet.'; return; }
      try { g.createAgent({ name: $('#f-name', box).value, specialty: spec, form, color }); this.closeModal(); this.refresh(); } catch (e) { $('#f-err', box).textContent = e.message; }
    });
  }
  openSettings() {
    const g = this.game, st = g.s.settings, src = g.sources;
    const box = this.modal('Beállítások', `
      <div class="t">TUDÁSFORRÁSOK</div>
      <div class="row"><span>Wikipédia (ingyenes, magyar + angol)</span><b class="${src.wiki ? 'ok' : 'err'}">${src.wiki ? 'elérhető' : 'nem elérhető ebben a nézetben'}</b></div>
      <div class="row"><span>Claude a claude.ai-on (beépített)</span><b class="${src.sample ? 'ok' : 'dim'}">${src.sample ? 'elérhető' : 'csak a claude.ai oldalon'}</b></div>
      <div class="row"><span>Claude API saját kulccsal</span><b class="${src.api ? 'ok' : 'dim'}">${src.api ? 'aktív' : 'nincs beállítva'}</b></div>
      <label>Anthropic API-kulcs (opcionális, fizetős: a modell mélyebben gondolkodik és bárhol kereshet a weben)</label>
      <input class="inp" id="s-key" type="password" placeholder="sk-ant-…" value="${esc(st.apiKey)}">
      <label class="ck"><input type="checkbox" id="s-web" ${st.apiWeb ? 'checked' : ''}> Webes keresés engedélyezése az MI-nek</label>
      <div class="dim">A kulcs csak ebben a böngészőben tárolódik. Ha a játék a claude.ai oldalon fut, külső hívást az oldal biztonsági szabályai nem engednek: ott a beépített Claude-forrás működik.</div>
      <div class="t" style="margin-top:14px">JÁTÉK</div>
      <label>Önálló kutatás tempója</label><select class="inp" id="s-pace"><option value="0.5">lassú</option><option value="1">normál</option><option value="2">gyors</option></select>
      <label>Grafika</label><select class="inp" id="s-q"><option value="high">magas (ragyogás)</option><option value="low">gyors (telefonra)</option></select>
      <div class="ob-actions"><button class="btn primary" id="s-save">Mentés</button></div>
      <div class="t" style="margin-top:14px">MENTÉS</div>
      <div class="sub">A játék automatikusan ment ebbe a böngészőbe. A mentésfájlt felteheted a Google Drive-odra, és bármikor visszatöltheted.</div>
      <div class="ob-actions"><button class="btn" id="s-exp">Mentés letöltése</button><button class="btn" id="s-copy">Mentés másolása</button><label class="btn">Mentés betöltése<input type="file" id="s-imp" accept=".json,application/json" hidden></label><button class="btn danger" id="s-reset">Új játék</button></div><div id="s-msg" class="sub"></div>`);
    $('#s-pace', box).value = String(st.autonomyPace || 1); $('#s-q', box).value = st.quality;
    const msg = (t) => ($('#s-msg', box).textContent = t);
    $('#s-save', box).addEventListener('click', async () => {
      st.apiKey = $('#s-key', box).value.trim(); st.apiWeb = $('#s-web', box).checked; st.autonomyPace = Number($('#s-pace', box).value); st.quality = $('#s-q', box).value;
      this.world.setQuality(st.quality); g.save(); msg('Ellenőrzöm a forrásokat…'); await g.detectSources(); this.refresh(); this.closeModal(); this.toast(`Tudásforrás: ${g.sourceName}`);
    });
    $('#s-exp', box).addEventListener('click', async () => {
      const data = g.exportJSON(), filename = `aeon-mentes-${new Date().toISOString().slice(0, 10)}.json`;
      try { const dl = window.claude?.use ? await window.claude.use('downloads') : null; if (dl) { await dl.save({ filename, data }); msg('Mentés kész.'); return; } } catch { /* fall through to a normal download */ }
      const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([data], { type: 'application/json' })); a.download = filename; a.click(); msg('Letöltés elindítva.');
    });
    $('#s-copy', box).addEventListener('click', async () => { try { await navigator.clipboard.writeText(g.exportJSON()); msg('Vágólapra másolva.'); } catch { msg('A másolás itt nem engedélyezett.'); } });
    $('#s-imp', box).addEventListener('change', async (e) => { try { g.importJSON(await e.target.files[0].text()); location.reload(); } catch (err) { msg('Hibás mentésfájl: ' + err.message); } });
    let armed = false; $('#s-reset', box).addEventListener('click', (e) => { if (!armed) { armed = true; e.target.textContent = 'Biztosan? Minden törlődik'; return; } g.reset(); location.reload(); });
  }
}
