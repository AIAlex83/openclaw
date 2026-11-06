// Knowledge sources. The game picks whichever is reachable:
//  - wiki:   free Wikipedia APIs (works when the page is served from a normal web origin)
//  - sample: Claude via the claude.ai artifact "sample" capability (works inside a published artifact)
//  - api:    Claude API with the player's own key + server-side web search (works outside artifacts)
import { CATEGORIES, STOPWORDS } from './data.js';

const UA_PARAMS = 'format=json&origin=*';
const withTimeout = (ms) => { const c = new AbortController(); setTimeout(() => c.abort(), ms); return c.signal; };

async function getJSON(url) {
  const r = await fetch(url, { signal: withTimeout(12000), headers: { 'Api-User-Agent': 'AEON-tudasjatek/0.1 (prototype)' } });
  if (!r.ok) throw new Error('HTTP ' + r.status);
  return r.json();
}

// ---------- classification & text helpers ----------
export function classify(text) {
  const s = (' ' + (text || '') + ' ').toLowerCase();
  let best = 'altalanos', score = 0;
  for (const c of CATEGORIES) {
    let n = 0;
    for (const k of c.kw) if (s.includes(k)) n++;
    if (n > score) { score = n; best = c.id; }
  }
  return best;
}
export function keywords(text, n = 6) {
  const freq = {};
  for (const w of (text || '').toLowerCase().match(/[a-záéíóöőúüű0-9-]{4,}/g) || []) {
    if (STOPWORDS.has(w)) continue;
    freq[w] = (freq[w] || 0) + 1;
  }
  return Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, n).map(([w]) => w);
}
export function sentences(text) { return (text || '').split(/(?<=[.!?])\s+(?=[A-ZÁÉÍÓÖŐÚÜŰ0-9„"])/).filter(Boolean); }

// Turn a natural-language question into a search phrase ("Ki volt Szókratész?" -> "Szókratész").
const QWORDS = new Set('mi mit miért miert hogyan hogy ki kik mikor hol honnan hová mennyi melyik milyen mekkora volt van vannak lesz lett működik működnek keletkezett keletkeztek jött jöttek létre alakult alakultak jelent jelenti lehet lehetne kell tudunk tudok tudsz mondd mondj magyarázd el meg a az egy is the what why how who when where which does do is are was were'.split(' '));
export function toSearch(text) {
  const words = (text || '').replace(/[?!.,;:„”"]/g, ' ').split(/\s+/).filter(Boolean);
  const kept = words.filter((w) => !QWORDS.has(w.toLowerCase()));
  return (kept.length ? kept : words).join(' ').trim();
}

// ---------- Wikipedia ----------
export const wiki = {
  async probe() {
    try { await getJSON(`https://hu.wikipedia.org/w/api.php?action=query&meta=siteinfo&${UA_PARAMS}`); return true; } catch { return false; }
  },
  async search(lang, q, limit = 3) {
    const d = await getJSON(`https://${lang}.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(q)}&srlimit=${limit}&${UA_PARAMS}`);
    return (d.query?.search || []).map((x) => x.title);
  },
  async summary(lang, title) {
    const d = await getJSON(`https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title.replace(/ /g, '_'))}`);
    if (!d.extract) return null;
    return {
      title: d.title, lang, description: d.description || '', extract: d.extract.slice(0, 900),
      url: d.content_urls?.desktop?.page || `https://${lang}.wikipedia.org/wiki/${encodeURIComponent(title)}`,
      coords: d.coordinates ? { lat: d.coordinates.lat, lon: d.coordinates.lon } : null,
    };
  },
  async langlink(lang, title, target) {
    const d = await getJSON(`https://${lang}.wikipedia.org/w/api.php?action=query&prop=langlinks&titles=${encodeURIComponent(title)}&lllang=${target}&${UA_PARAMS}`);
    const p = Object.values(d.query?.pages || {})[0];
    return p?.langlinks?.[0]?.['*'] || null;
  },
  async links(lang, title, limit = 25) {
    const d = await getJSON(`https://${lang}.wikipedia.org/w/api.php?action=query&prop=links&titles=${encodeURIComponent(title)}&plnamespace=0&pllimit=${limit}&${UA_PARAMS}`);
    const p = Object.values(d.query?.pages || {})[0];
    return (p?.links || []).map((l) => l.title);
  },
};

// ---------- Claude (shared prompt + JSON contract) ----------
const CAT_IDS = CATEGORIES.map((c) => c.id).join(', ');
function researchPrompt(query, ctx) {
  return `Egy tudásgyűjtő játék ügynöke vagy. A játékos (az "Orákulum") kérése vagy kérdése: "${query}".
Profil-összefoglaló a játékosról: ${ctx.profile || 'még ismeretlen'}.
Feladat: gyűjts ${ctx.count || 3} különálló, tényszerű tudáselemet a témához, magyar nyelven.
Csak olyat írj, amiben biztos vagy; ha bizonytalan, a confidence legyen alacsony.
Válasz KIZÁRÓLAG egy JSON objektum ebben a formában:
{"answer": "2-4 mondatos közvetlen válasz a kérésre magyarul",
 "items": [{"title": "rövid cím", "summary": "2-4 mondatos összefoglaló", "category": "egyik ezek közül: ${CAT_IDS}",
            "keywords": ["3-6 kulcsszó"], "related": ["2-4 kapcsolódó téma neve"], "lat": null, "lon": null,
            "confidence": 0.0-1.0, "source": "forrás megnevezése vagy URL, ha van"}]}
A lat/lon csak akkor szám, ha a tudáselem konkrét földrajzi helyhez kötődik.`;
}
function parseJSON(text) {
  if (!text) return null;
  const m = text.match(/\{[\s\S]*\}/);
  if (!m) return null;
  try { return JSON.parse(m[0]); } catch { return null; }
}
function normalizeItems(obj, via) {
  const items = (obj?.items || []).filter((x) => x && x.title && x.summary).slice(0, 6).map((x) => ({
    title: String(x.title).slice(0, 120), lang: 'hu', description: '', extract: String(x.summary).slice(0, 900),
    url: /^https?:\/\//.test(x.source || '') ? x.source : '', sourceName: x.source && !/^https?:/.test(x.source) ? String(x.source).slice(0, 80) : via,
    coords: Number.isFinite(x.lat) && Number.isFinite(x.lon) ? { lat: x.lat, lon: x.lon } : null,
    cat: CATEGORIES.some((c) => c.id === x.category) ? x.category : null,
    tags: Array.isArray(x.keywords) ? x.keywords.slice(0, 6).map(String) : [],
    related: Array.isArray(x.related) ? x.related.slice(0, 4).map(String) : [],
    confidence: typeof x.confidence === 'number' ? x.confidence : 0.6,
  }));
  return { answer: typeof obj?.answer === 'string' ? obj.answer : '', items };
}

// claude.ai artifact capability ("sample") — the page asks Claude through the viewer's own plan.
export const sampleSource = {
  fn: null,
  async init() {
    // On claude.ai the bridge may appear shortly after load.
    for (let i = 0; i < 15 && !window.claude?.use; i++) await new Promise((r) => setTimeout(r, 200));
    if (!window.claude?.use) return false;
    try { this.fn = await window.claude.use('sample'); } catch { this.fn = null; }
    return !!this.fn;
  },
  async research(query, ctx) {
    const res = await this.fn(researchPrompt(query, ctx), { modelTier: 'default' });
    return normalizeItems(parseJSON(res.text), 'Claude tudása');
  },
  async ask(prompt) { const r = await this.fn(prompt, { modelTier: 'default', cache: false }); return r.text; },
};

// Claude API with the player's key (browser direct access; key stays in this browser only).
export const apiSource = {
  client: null, key: '', web: true,
  async init(key, web) {
    this.key = key; this.web = web; this.client = null;
    if (!key) return false;
    const { default: Anthropic } = await import('@anthropic-ai/sdk');
    this.client = new Anthropic({ apiKey: key, dangerouslyAllowBrowser: true });
    return true;
  },
  async call(prompt, web) {
    const tools = web ? [{ type: 'web_search_20260209', name: 'web_search', max_uses: 4 }] : undefined;
    const msg = await this.client.beta.messages.create({
      model: 'claude-opus-5-5', max_tokens: 8000,
      betas: ['server-side-fallback-2026-07-01'], fallbacks: 'default',
      output_config: { effort: 'low' },
      ...(tools ? { tools } : {}),
      messages: [{ role: 'user', content: prompt }],
    });
    if (msg.stop_reason === 'refusal') throw new Error('A modell ezt a kérést nem teljesítette.');
    return msg.content.filter((b) => b.type === 'text').map((b) => b.text).join('\n');
  },
  async research(query, ctx) {
    const extra = this.web ? '\nHasználd a webes keresést friss, hiteles forrásokhoz, és a "source" mezőbe írd a konkrét URL-t.' : '';
    return normalizeItems(parseJSON(await this.call(researchPrompt(query, ctx) + extra, this.web)), 'Claude API');
  },
  async ask(prompt) { return this.call(prompt, false); },
};

// ---------- unified research ----------
// Returns { items:[{title,lang,description,extract,url,coords,cat?,tags?,related?,verified?,alt?}], answer, via }
export async function researchWiki(raw, { langs = ['hu', 'en'], count = 2, onStep = () => {} }) {
  const primary = langs[0], query = toSearch(raw);
  onStep('search', `keresés: „${query}” (${langs.join(', ')})`);
  let titles = await wiki.search(primary, query, count + 1).catch(() => []);
  let lang = primary;
  if (!titles.length && langs[1]) { lang = langs[1]; titles = await wiki.search(lang, query, count + 1).catch(() => []); }
  const items = [];
  for (const t of titles.slice(0, count)) {
    const s = await wiki.summary(lang, t).catch(() => null);
    if (s) items.push(s);
  }
  onStep('found', items.map((i) => i.title));
  // cross-language verification
  const other = langs.find((l) => l !== lang) || (lang === 'hu' ? 'en' : 'hu');
  for (const it of items) {
    const alt = await wiki.langlink(lang, it.title, other).catch(() => null);
    if (alt) {
      const s = await wiki.summary(other, alt).catch(() => null);
      if (s) { it.verified = true; it.alt = { title: s.title, lang: other, url: s.url }; if (!it.coords && s.coords) it.coords = s.coords; }
    }
    onStep('verify', it);
  }
  for (const it of items) { it.tags = keywords(it.extract); it.cat = classify(`${it.description} ${it.extract}`); onStep('terms', it); }
  if (items[0]) {
    items[0].related = (await wiki.links(items[0].lang, items[0].title).catch(() => [])).slice(0, 25);
    onStep('links', items[0]);
  }
  return { items, answer: '', via: 'Wikipédia' };
}

// Best-effort answer from stored knowledge (free mode).
export function answerFromKnowledge(question, nodes) {
  const q = keywords(question, 8);
  if (!q.length) return null;
  let best = null, bestScore = 0;
  for (const n of nodes) {
    const hay = `${n.title} ${n.extract}`.toLowerCase();
    let s = 0;
    for (const w of q) if (hay.includes(w.slice(0, Math.max(4, w.length - 2)))) s += n.title.toLowerCase().includes(w.slice(0, 5)) ? 2 : 1;
    if (s > bestScore) { bestScore = s; best = n; }
  }
  if (!best || bestScore < 2) return null;
  return { node: best, text: sentences(best.extract).slice(0, 3).join(' ') };
}
