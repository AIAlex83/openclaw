// Game state & rules: profile assessment, agents, research tasks, XP, core birth & growth, agent forge, persistence.
import { CATEGORIES, CAT, SEEDS, STARTERS, CORE_STAGES, FOLLOWUPS, ARCHETYPES, FORMS } from './data.js';
import { wiki, researchWiki, sampleSource, apiSource, answerFromKnowledge, classify, keywords, sentences } from './brain.js';

const SAVE_KEY = 'aeon-save-v1';
const SPEED = Number(new URLSearchParams(location.search).get('speed')) || 1; // test hook: faster timers
const uid = () => Math.random().toString(36).slice(2, 10);
export const levelOf = (xp) => 1 + Math.floor(Math.pow(xp / 30, 1 / 1.5));
export const xpFor = (lvl) => Math.ceil(30 * Math.pow(lvl - 1, 1.5));
// Rough yardstick for "Út a Mindentudáshoz": the order of magnitude of encyclopedic articles in the largest Wikipedia (~7 million).
const ALL_KNOWLEDGE = 7_000_000;
export const BIRTH = { completeness: 0.6, nodes: 20, avgLevel: 3 };

function freshState() {
  return {
    v: 1, created: Date.now(), phase: 'onboarding',
    oracle: { name: 'Orákulum', answers: {}, traits: { open: 3, consc: 3, intuit: 3, social: 3, skept: 3 }, interests: {}, motive: '', depth: 'vegyes', bigq: '', completeness: 0, behavior: 0, langs: ['hu', 'en'], autonomy: 'igen', archetype: null, portrait: '' },
    agents: [], knowledge: {}, frontier: [], edges: [],
    core: { born: false, name: 'ÆON', xp: 0, bornAt: 0, suggested: [] },
    chat: [], log: [], asked: [], pendingQ: null,
    settings: { apiKey: '', apiWeb: true, quality: 'high', autonomyPace: 1 },
    stats: { tasks: 0, commands: 0, lastQAt: 0, tasksSinceQ: 0 },
  };
}

export class Game {
  constructor(ui) {
    this.ui = ui; this.queue = []; this.busy = false; this.sources = { wiki: false, sample: false, api: false };
    this.s = this.load() || freshState();
    this.idleTimer = 0;
  }
  // ---------- persistence ----------
  load() { try { const raw = localStorage.getItem(SAVE_KEY); return raw ? JSON.parse(raw) : null; } catch { return null; } }
  save() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(this.s)); } catch { /* storage may be unavailable (sandboxed views) */ } }
  exportJSON() { return JSON.stringify(this.s, null, 1); }
  importJSON(text) { const d = JSON.parse(text); if (!d || d.v !== 1 || !Array.isArray(d.agents)) throw new Error('Ismeretlen mentésformátum'); this.s = d; this.save(); }
  reset() { this.s = freshState(); this.save(); }

  async detectSources() {
    const [w, sm] = await Promise.all([wiki.probe(), sampleSource.init()]);
    const ap = this.s.settings.apiKey ? await apiSource.init(this.s.settings.apiKey, this.s.settings.apiWeb).catch(() => false) : false;
    this.sources = { wiki: w, sample: sm, api: ap };
    return this.sources;
  }
  get llm() { return this.sources.api ? apiSource : this.sources.sample ? sampleSource : null; }
  get sourceName() { return this.sources.api ? 'Claude API' + (this.s.settings.apiWeb ? ' + webes keresés' : '') : this.sources.wiki ? 'Wikipédia (ingyenes)' + (this.sources.sample ? ' + Claude' : '') : this.sources.sample ? 'Claude (claude.ai)' : 'nincs elérhető forrás'; }

  // ---------- derived values ----------
  get nodes() { return Object.values(this.s.knowledge); }
  agent(id) { return this.s.agents.find((a) => a.id === id); }
  byRole(role) { return this.s.agents.find((a) => a.role === role); }
  avgLevel() { const a = this.s.agents.filter((x) => x.role !== 'custom'); return a.length ? a.reduce((s, x) => s + x.level, 0) / a.length : 0; }
  birthProgress() {
    const o = this.s.oracle, p = Math.min(1, o.completeness / BIRTH.completeness), k = Math.min(1, this.nodes.length / BIRTH.nodes), l = Math.min(1, this.avgLevel() / BIRTH.avgLevel);
    return { p, k, l, total: p * 0.4 + k * 0.35 + l * 0.25 };
  }
  coreLevel() { return levelOf(this.s.core.xp / 2); }
  coreStage() { const l = this.coreLevel(); return [...CORE_STAGES].reverse().find((s) => l >= s.lvl).name; }
  omniscience() { return this.nodes.length / ALL_KNOWLEDGE * 100; }
  agentSlots() { return this.s.core.born ? Math.min(12, 4 + Math.floor(this.coreLevel() / 2)) : 4; }
  catCounts() { const c = {}; for (const n of this.nodes) c[n.cat] = (c[n.cat] || 0) + 1; return c; }
  profileSummary() {
    const o = this.s.oracle, top = Object.entries(o.interests).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([k]) => CAT[k]?.name).filter(Boolean);
    return `${o.name}; archetípus: ${o.archetype?.name || '?'}; motiváció: ${o.motive || '?'}; fő érdeklődés: ${top.join(', ') || '?'}; tanulási mélység: ${o.depth}; nagy kérdése: "${o.bigq}"`;
  }

  // ---------- profile ----------
  answerOnboarding(id, value) {
    const o = this.s.oracle; o.answers[id] = value;
    if (id === 'name') o.name = (value || '').trim() || 'Orákulum';
    if (id === 'interests') for (const c of value) o.interests[c] = (o.interests[c] || 0) + 3;
    if (id === 'motive') o.motive = value;
    if (id === 'traits') Object.assign(o.traits, value);
    if (id === 'depth') o.depth = value;
    if (id === 'bigq') { o.bigq = (value || '').trim(); const c = classify(o.bigq); o.interests[c] = (o.interests[c] || 0) + 2; }
    o.completeness = Math.min(1, o.completeness + 0.06);
    this.updateArchetype(); this.save();
  }
  updateArchetype() { const o = this.s.oracle; o.archetype = ARCHETYPES.find((a) => a.when(o.traits, o.motive)); }
  answerFollowup(q, opt) {
    const o = this.s.oracle; o.answers[q.id] = opt.v ?? opt;
    if (opt.cat) o.interests[opt.cat] = (o.interests[opt.cat] || 0) + 2;
    if (opt.trait) o.traits[opt.trait[0]] = Math.min(5, o.traits[opt.trait[0]] + opt.trait[1]);
    if (opt.seed) this.s.frontier.unshift({ title: opt.seed, cat: opt.cat || 'altalanos' });
    if (q.id === 'langs') o.langs = opt.v === 'hu' ? ['hu', 'en'] : opt.v === 'en' ? ['en', 'hu'] : ['hu', 'en'];
    if (q.id === 'autonomy') o.autonomy = opt.v;
    if (q.id === 'work' && typeof opt === 'string' && opt.trim()) { o.work = opt.trim(); const c = classify(opt); o.interests[c] = (o.interests[c] || 0) + 1; }
    o.completeness = Math.min(1, o.completeness + 0.05);
    this.s.asked.push(q.id); this.s.pendingQ = null; this.updateArchetype();
    const asker = this.agent(q.askedBy); if (asker) this.gainXP(asker, 12, 'megismert téged');
    this.say(asker?.id || 'core', `Köszönöm, ${o.name}. Ez segít jobban szolgálni téged.`);
    this.checkBirth(); this.save(); this.ui.refresh();
  }
  maybeAskFollowup() {
    const st = this.s.stats;
    if (this.s.pendingQ || this.s.phase === 'onboarding') return;
    if (st.tasksSinceQ < 2 && Date.now() - st.lastQAt < 150000 / SPEED) return;
    const q = FOLLOWUPS.find((f) => !this.s.asked.includes(f.id));
    if (!q) return;
    const asker = this.s.agents[Math.floor(Math.random() * this.s.agents.length)];
    this.s.pendingQ = { ...q, askedBy: asker?.id };
    st.tasksSinceQ = 0; st.lastQAt = Date.now();
    this.ui.showQuestion(this.s.pendingQ, asker);
    this.save();
  }
  noteBehavior(cat) {
    const o = this.s.oracle; o.interests[cat] = (o.interests[cat] || 0) + 0.5;
    if (o.behavior < 0.15) { o.behavior += 0.015; o.completeness = Math.min(1, o.completeness + 0.015); }
  }

  // ---------- agents ----------
  startDisciples() {
    this.s.phase = 'disciples';
    this.s.agents = STARTERS.map((a) => ({ id: uid(), ...a, level: 1, xp: 0, status: 'ébredezik', known: [], created: Date.now(), bornAt: Date.now() - 30000 }));
    this.say(this.s.agents[0].id, `Üdvözlünk, ${this.s.oracle.name}! Négyen vagyunk, még kezdetleges tudással. Minden kérdéseddel és utasításoddal okosabbak leszünk, és egyre jobban megismerünk.`);
    this.save();
    if (this.s.oracle.bigq) this.enqueue({ type: 'research', query: this.s.oracle.bigq, from: 'oracle', note: 'a nagy kérdésed' });
  }
  gainXP(ag, n, why) {
    const before = ag.level; ag.xp += Math.round(n); ag.level = levelOf(ag.xp);
    if (ag.level > before) { this.log(ag, `szintet lépett: LVL ${ag.level}`, 'lvl'); this.ui.toast(`${ag.name} szintet lépett → LVL ${ag.level}`, ag.color); }
    this.ui.updateAgent(ag);
  }
  createAgent({ name, specialty, form, color }) {
    if (this.s.agents.length >= this.agentSlots()) throw new Error('Nincs szabad hely: a Központi Tudat szintje határozza meg, hány ügynököt tud vezetni.');
    const cat = CAT[specialty] ? specialty : classify(specialty);
    const ag = { id: uid(), name: (name || '').trim() || (CAT[cat]?.name + '-tudós'), role: 'custom', specialty, cat, form: FORMS.some((f) => f.id === form) ? form : 'crystal', color, desc: `Specialista: ${CAT[specialty]?.name || specialty}`, level: 1, xp: 0, status: 'születik', known: [], created: Date.now(), bornAt: Date.now() };
    this.s.agents.push(ag); this.save();
    this.say(ag.id, `Megszülettem. A területem: ${CAT[specialty]?.name || specialty}. Mindent, amit megtanulok, a Központi Tudatnak adok.`);
    this.ui.addAgent(ag);
    setTimeout(() => { ag.status = 'kutat'; this.enqueue({ type: 'research', query: CAT[specialty] ? SEEDS[cat][Math.floor(Math.random() * SEEDS[cat].length)] : specialty, from: 'self', agentId: ag.id }); }, 46000 / SPEED);
    return ag;
  }

  // ---------- chat & log ----------
  say(from, text, extra = {}) { const m = { from, text, ts: Date.now(), ...extra }; this.s.chat.push(m); if (this.s.chat.length > 200) this.s.chat.shift(); this.ui.addMessage(m); }
  log(ag, text, kind = '') { const e = { who: ag?.name || 'Központ', color: ag?.color || '#ffb35c', text, kind, ts: Date.now() }; this.s.log.push(e); if (this.s.log.length > 80) this.s.log.shift(); this.ui.addLog(e); }

  // ---------- commands ----------
  command(text) {
    text = text.trim(); if (!text) return;
    this.s.stats.commands++;
    this.say('oracle', text);
    const focus = text.match(/^fókusz\s*:?\s*(.+)$/i);
    if (focus) {
      const c = CATEGORIES.find((x) => x.name.toLowerCase() === focus[1].trim().toLowerCase()) || CAT[classify(focus[1])];
      this.s.oracle.focus = c.id; this.s.oracle.interests[c.id] = (this.s.oracle.interests[c.id] || 0) + 3;
      this.say(this.s.core.born ? 'core' : this.s.agents[0].id, `Értettem. Mostantól a(z) ${c.name} területére összpontosítunk, amikor magunktól kutatunk.`);
      this.save(); return;
    }
    if (/^(ki vagyok|mit tudsz rólam|ismersz|milyen vagyok)/i.test(text)) {
      const o = this.s.oracle; this.say(this.s.core.born ? 'core' : this.s.agents[0].id, `${o.archetype?.name || 'Még csak most ismerkedünk'}${o.archetype ? ': ' + o.archetype.desc : '.'} ${o.portrait && o.portrait !== o.archetype?.desc ? o.portrait : ''} Megismerés: ${Math.round(o.completeness * 100)} %. (Profilom gomb)`);
      return;
    }
    // address one agent directly: "Kutató: ..." / "@Kutató ..."
    let agentId = null;
    const direct = text.match(/^@?([\p{L}\-]+)\s*[:,]\s*(.+)$/u);
    if (direct) { const a = this.s.agents.find((x) => x.name.toLowerCase() === direct[1].toLowerCase()); if (a) { agentId = a.id; text = direct[2]; } }
    const isQ = /\?$/.test(text) || /^(mi|mit|miért|hogyan|hogy|ki|kik|mikor|hol|mennyi|melyik|what|why|how|who|when|where|which)\b/i.test(text);
    const query = text.replace(/^(kutassátok|kutass|kutassatok|nézzétek meg|nézz utána|keressétek|tanuljátok meg|derítsétek ki)\s*:?\s*/i, '');
    if (isQ) {
      const hit = answerFromKnowledge(query, this.nodes);
      if (hit && !this.llm) { const ag = this.agent(hit.node.by) || this.s.agents[0]; this.say(ag.id, `Ezt már tudom: ${hit.text}`, { src: hit.node }); }
    }
    if (this.s.core.born) { const lead = agentId ? this.agent(agentId) : this.byRole('kutato'); this.say('core', `Értettem, ${this.s.oracle.name}. A feladatot ${lead?.name || 'a csapat'} vezeti${this.s.agents.length > 1 ? ', a többiek ellenőrzik és összekötik' : ''}.`, { quiet: true }); }
    this.enqueue({ type: 'research', query, from: 'oracle', question: isQ ? text : null, agentId });
  }
  enqueue(task) { task.id = uid(); this.queue.push(task); this.ui.setQueue(this.queue.length + (this.busy ? 1 : 0)); this.pump(); }
  async pump() {
    if (this.busy || !this.queue.length) return;
    this.busy = true; const task = this.queue.shift(); this.ui.setQueue(this.queue.length + 1);
    try { await this.runResearch(task); } catch (e) { console.error(e); this.log(null, `hiba a kutatás közben: ${e.message}`, 'err'); this.say(this.s.agents[0]?.id || 'core', `Most nem értem el a tudásforrást (${e.message}). Később újra próbálom.`); }
    this.busy = false; this.s.stats.tasks++; this.s.stats.tasksSinceQ++;
    this.s.agents.forEach((a) => { if (a.status !== 'születik') a.status = 'pihen'; this.ui.updateAgent(a); });
    this.save(); this.ui.setQueue(this.queue.length); this.ui.refresh();
    this.maybeAskFollowup();
    setTimeout(() => this.pump(), 400);
  }
  wait(ms, ag) { const speed = ag ? 1 + ag.level * 0.08 : 1; return new Promise((r) => setTimeout(r, ms / speed / SPEED)); }
  setStatus(ag, st) { if (!ag) return; ag.status = st; this.ui.updateAgent(ag); }

  // The research pipeline: Kutató finds, Elemző verifies, Nyelvész extracts terms, Építész links, specialists add depth, then sync.
  async runResearch(task) {
    const A = { k: this.byRole('kutato'), e: this.byRole('elemzo'), n: this.byRole('nyelvesz'), b: this.byRole('epitesz') };
    const lead = task.agentId ? this.agent(task.agentId) : A.k;
    const count = Math.min(4, 1 + Math.floor((lead?.level || 1) / 3));
    this.setStatus(lead, 'keres'); this.log(lead, `kutatás indul: „${task.query}”${task.from === 'self' ? ' (saját kíváncsiság)' : ''}`);
    let res;
    if (this.sources.wiki && !this.sources.api) {
      res = await researchWiki(task.query, {
        langs: this.s.oracle.langs, count,
        onStep: async (kind, d) => {
          if (kind === 'found') this.log(lead, d.length ? `forrás: ${d.join(', ')}` : 'nem talált forrást');
          if (kind === 'verify' && A.e) { this.setStatus(A.e, 'ellenőriz'); this.log(A.e, d.verified ? `keresztellenőrizve (${d.alt.lang}): ${d.title}` : `egyetlen forrás: ${d.title}`); }
          if (kind === 'terms' && A.n) { this.setStatus(A.n, 'értelmez'); this.log(A.n, `kulcsfogalmak: ${d.tags.slice(0, 4).join(', ')}`); }
          if (kind === 'links' && A.b) { this.setStatus(A.b, 'összeköt'); this.log(A.b, `${d.related.length} kapcsolódó témát térképezett fel`); }
        },
      });
    } else if (this.llm) {
      this.log(lead, `kérdést tesz fel a mélyebb tudásnak (${this.sourceName})`);
      const r = await this.llm.research(task.question || task.query, { profile: this.profileSummary(), count: count + 1 });
      res = { ...r, via: this.sourceName };
      for (const it of res.items) {
        it.verified = it.confidence >= 0.75; it.cat = it.cat || classify(`${it.title} ${it.extract}`);
        if (A.e) { this.setStatus(A.e, 'ellenőriz'); this.log(A.e, `${it.verified ? 'magas' : 'közepes'} megbízhatóság: ${it.title}`); await this.wait(500, A.e); }
        if (A.n) { this.setStatus(A.n, 'értelmez'); if (!it.tags?.length) it.tags = keywords(it.extract); this.log(A.n, `kulcsfogalmak: ${it.tags.slice(0, 4).join(', ')}`); await this.wait(400, A.n); }
      }
      if (A.b && res.items[0]) { this.setStatus(A.b, 'összeköt'); this.log(A.b, `${res.items.reduce((s, i) => s + (i.related?.length || 0), 0)} kapcsolódó témát térképezett fel`); }
    } else {
      throw new Error('nincs elérhető tudásforrás');
    }
    if (!res.items.length) { this.say(lead.id, `Nem találtam megbízható forrást erre: „${task.query}”. Fogalmazd meg másképp, vagy adj új irányt.`); return; }
    // store knowledge
    const created = [];
    for (const it of res.items) {
      const key = (it.lang + ':' + it.title).toLowerCase();
      if (this.s.knowledge[key]) { this.log(lead, `már ismert: ${it.title}`); continue; }
      const owner = task.agentId ? lead : lead;
      const node = { id: key, title: it.title, lang: it.lang, description: it.description || '', extract: it.extract, url: it.url, alt: it.alt || null, sourceName: it.sourceName || res.via, coords: it.coords || null, cat: it.cat || 'altalanos', tags: it.tags || [], verified: !!it.verified, by: owner.id, ts: Date.now(), synced: false, query: task.query };
      this.s.knowledge[key] = node; owner.known.push(key); created.push(node);
      this.ui.world.hotspot(node.coords, owner.color);
      this.noteBehavior(node.cat);
      for (const r of it.related || []) if (!this.s.frontier.some((f) => f.title === r)) this.s.frontier.push({ title: r, cat: node.cat });
    }
    if (this.s.frontier.length > 300) this.s.frontier = this.s.frontier.slice(-300);
    // XP for the pipeline
    const nC = created.length, nV = created.filter((c) => c.verified).length;
    if (lead) this.gainXP(lead, 14 * nC + 4, 'új tudás');
    if (A.e && A.e !== lead) this.gainXP(A.e, 6 * nC + 8 * nV, 'ellenőrzés');
    if (A.n && A.n !== lead) this.gainXP(A.n, 7 * nC, 'értelmezés');
    if (A.b && A.b !== lead) this.gainXP(A.b, 5 * nC + Math.min(10, (res.items[0]?.related?.length || 0) / 2), 'kapcsolatok');
    // specialists whose field matches learn alongside
    for (const sp of this.s.agents.filter((a) => a.role === 'custom' && a !== lead && created.some((c) => c.cat === a.cat))) this.gainXP(sp, 8 * created.filter((c) => c.cat === sp.cat).length, 'szakterület');
    // report to the Oracle
    if (task.from === 'oracle' || task.question) {
      let answer = res.answer;
      if (!answer && task.question) { const hit = answerFromKnowledge(task.question, created.length ? created : this.nodes); answer = hit?.text; }
      const best = created[0] || res.items[0];
      const text = answer || `${best.title}: ${sentences(best.extract).slice(0, 2).join(' ')}`;
      this.say(lead.id, text, { src: created[0] || null, more: created.slice(1).map((c) => ({ title: c.title, url: c.url })) });
    } else if (created.length) {
      this.say(lead.id, `Magamtól kutattam: ${created.map((c) => c.title).join(', ')}. ${sentences(created[0].extract)[0] || ''}`, { src: created[0], quiet: true });
    }
    await this.share(created);
    this.checkBirth(); this.ui.refresh();
  }

  // Knowledge flows to the core (after birth) or between the disciples (before).
  async share(nodes) {
    for (const n of nodes) {
      const owner = this.agent(n.by); if (!owner) continue;
      if (this.s.core.born) {
        this.ui.world.pulse(owner.id, 'core', owner.color);
        this.s.core.xp += n.verified ? 16 : 10; n.synced = true;
        this.log(owner, `feltöltötte a Központba: ${n.title}`, 'sync');
      } else {
        const peers = this.s.agents.filter((a) => a !== owner);
        const peer = peers[Math.floor(Math.random() * peers.length)];
        if (peer) { this.ui.world.pulse(owner.id, peer.id, owner.color, 10); this.gainXP(peer, 3, 'tanult a társától'); }
      }
      await this.wait(500);
    }
    if (this.s.core.born) { const before = this.s.core.lastLevel || 1, now = this.coreLevel(); if (now > before) { this.ui.toast(`${this.s.core.name} növekszik → LVL ${now} (${this.coreStage()})`, '#ffb35c'); this.log(null, `a Központi Tudat elérte: LVL ${now} — ${this.coreStage()}`, 'lvl'); this.coreSuggest(); } this.s.core.lastLevel = now; this.ui.updateCore(); }
  }

  checkBirth() {
    if (this.s.core.born || this.s.phase !== 'disciples') { this.ui.updateCore(); return; }
    const o = this.s.oracle;
    this.ui.updateCore();
    if (o.completeness >= BIRTH.completeness && this.nodes.length >= BIRTH.nodes && this.avgLevel() >= BIRTH.avgLevel) this.birth();
  }
  async birth() {
    const c = this.s.core; c.born = true; c.bornAt = Date.now(); this.s.phase = 'core';
    c.xp = this.nodes.length * 6; c.lastLevel = 1; this.nodes.forEach((n) => (n.synced = true));
    this.log(null, 'A Központi Tudat megszületett.', 'lvl');
    this.ui.birthCinematic();
    this.s.agents.forEach((a, i) => setTimeout(() => this.ui.world.pulse(a.id, 'core', a.color, 22), i * 350));
    this.save();
    const o = this.s.oracle; let portrait = `${o.archetype?.name || 'A Vándor'} vagy, ${o.name}. ${o.archetype?.desc || ''}`;
    if (this.llm) {
      try {
        portrait = await this.llm.ask(`Egy játékban egy frissen született "Központi Tudat" vagy, amelyet négy tanítvány hozott létre a játékos ("Orákulum") megismeréséből. Írj 4-5 mondatos, misztikus, de őszinte és tiszteletteljes bemutatkozást magyarul, amelyben összefoglalod, mit tudtál meg róla, és milyen irányba javasolsz fejlődni. Adatok: ${this.profileSummary()}. Válaszok: ${JSON.stringify(o.answers)}`);
      } catch { /* the archetype text above is the fallback */ }
    }
    o.portrait = portrait;
    this.say('core', `Létezem. Belőletek születtem, és belőled, ${o.name}. ${portrait}`);
    this.coreSuggest(); this.save(); this.ui.refresh();
  }
  coreSuggest() {
    if (!this.s.core.born) return;
    const covered = new Set(this.s.agents.filter((a) => a.role === 'custom').map((a) => a.cat));
    const top = Object.entries(this.s.oracle.interests).sort((a, b) => b[1] - a[1]).map(([k]) => k).find((k) => !covered.has(k) && !this.s.core.suggested.includes(k) && CAT[k]);
    if (!top || this.s.agents.length >= this.agentSlots()) return;
    this.s.core.suggested.push(top);
    this.say('core', `Látom, hogy a(z) ${CAT[top].name} közel áll hozzád. Hozzunk létre egy új ügynököt, aki erre a területre szakosodik? (Új ügynök gomb)`, { action: { type: 'forge', specialty: top } });
  }

  // Autonomous curiosity: agents keep learning when the Oracle is silent.
  tick(dt) {
    if (this.s.phase === 'onboarding' || this.busy || this.queue.length) { this.idleTimer = 0; return; }
    const pace = this.s.oracle.autonomy === 'nem' ? 0 : this.s.oracle.autonomy === 'ritkan' ? 0.35 : 1;
    if (!pace || !this.s.agents.length) return;
    this.idleTimer += dt * SPEED * pace * (this.s.settings.autonomyPace || 1);
    const interval = 40 / (1 + this.avgLevel() * 0.05);
    if (this.idleTimer < interval) return;
    this.idleTimer = 0;
    const ag = this.s.agents[Math.floor(Math.random() * this.s.agents.length)];
    this.enqueue({ type: 'research', query: this.pickCuriosity(ag), from: 'self', agentId: ag.id });
  }
  pickCuriosity(ag) {
    const o = this.s.oracle;
    const weights = Object.entries(o.interests).filter(([k]) => CAT[k]);
    const pickCat = () => { if (ag.role === 'custom' && CAT[ag.cat]) return ag.cat; if (o.focus && Math.random() < 0.6) return o.focus; const tot = weights.reduce((s, [, w]) => s + w, 0); let r = Math.random() * tot; for (const [k, w] of weights) { r -= w; if (r <= 0) return k; } return 'altalanos'; };
    const cat = pickCat();
    const known = (t) => this.nodes.some((n) => n.title.toLowerCase() === t.toLowerCase());
    const fr = this.s.frontier.filter((f) => !known(f.title) && (f.cat === cat || Math.random() < 0.2));
    if (fr.length && Math.random() < 0.7) { const f = fr[Math.floor(Math.random() * Math.min(fr.length, 12))]; this.s.frontier = this.s.frontier.filter((x) => x !== f); return f.title; }
    const seeds = (SEEDS[cat] || SEEDS.altalanos).filter((t) => !known(t));
    return seeds.length ? seeds[Math.floor(Math.random() * seeds.length)] : (SEEDS[cat] || SEEDS.altalanos)[0];
  }
}
