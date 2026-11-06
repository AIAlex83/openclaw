import http from 'http'; import fs from 'fs'; import path from 'path'; import { createRequire } from 'module';
const require = createRequire(import.meta.url); const { chromium } = require('playwright');
const root = path.resolve('dist'); const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json' };
const srv = http.createServer((q, r) => { const f = path.join(root, decodeURIComponent(q.url.split('?')[0])); fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'content-type': types[path.extname(f)] || 'application/octet-stream' }); r.end(d); }); }).listen(8790);
const CATW = ['fizika kvantum energia', 'biológia sejt evolúció', 'történelem birodalom háború', 'csillagászat bolygó galaxis', 'technológia számítógép algoritmus', 'filozófia tudat etika', 'művészet zene festő', 'matematika tétel geometria'];
const h = (s) => [...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
function mock(url) {
  const u = new URL(url), p = u.searchParams;
  if (u.pathname.includes('/rest_v1/page/summary/')) {
    const title = decodeURIComponent(u.pathname.split('/').pop()).replace(/_/g, ' '); const k = h(title);
    const geo = /Balaton|Budapest|Himalája|Amazonas|Róma|Egyiptom|Szahara/.test(title) || k % 5 === 0;
    return { title, description: `${CATW[k % CATW.length].split(' ')[0]} fogalom`, extract: `A(z) ${title} a ${CATW[k % CATW.length]} egyik központi témája. Kutatók évszázadok óta vizsgálják a jelenséget, és számos elmélet született a magyarázatára. A legfontosabb felismerések a 20. században születtek. Ma is aktív kutatási terület.`, content_urls: { desktop: { page: `https://${u.hostname}/wiki/${encodeURIComponent(title)}` } }, ...(geo ? { coordinates: { lat: -30 + (k % 90), lon: -120 + (k % 240) } } : {}) };
  }
  if (p.get('meta') === 'siteinfo') return { query: { general: {} } };
  if (p.get('list') === 'search') { const q = p.get('srsearch'); return { query: { search: [q, q + ' (elmélet)', q + ' története'].map((title) => ({ title })) } }; }
  if (p.get('prop') === 'langlinks') { const t = p.get('titles'); return { query: { pages: { 1: h(t) % 3 ? { langlinks: [{ '*': t + ' (EN)' }] } : {} } } }; }
  if (p.get('prop') === 'links') { const t = p.get('titles'); const k = h(t); return { query: { pages: { 1: { links: Array.from({ length: 12 }, (_, i) => ({ title: ['Fekete lyuk', 'Neutroncsillag', 'Római Birodalom', 'Fotoszintézis', 'Neurális hálózat', 'Szókratész', 'Prímszám', 'Bartók Béla', 'Balaton', 'Entrópia', 'Ősrobbanás', 'Tudat', 'Evolúció', 'Grafén'][(k + i * 3) % 14] })) } } } }; }
  return {};
}
const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--ignore-gpu-blocklist'] });
const mode = process.argv[2] || 'desktop';
const ctx = await b.newContext(mode === 'phone' ? { ...require('playwright').devices['Pixel 7'] } : { viewport: { width: 1600, height: 900 } });
const page = await ctx.newPage();
const errors = []; page.on('pageerror', (e) => errors.push(e.message)); page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
await page.route(/wikipedia\.org/, (route) => route.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify(mock(route.request().url())) }));

const shot = (n) => page.screenshot({ path: `shots/${mode}-${n}.png` });
await page.goto('http://localhost:8790/index.html?speed=10');
await page.waitForTimeout(2500); await shot('01-intro');
await page.click('#start'); await page.waitForTimeout(1200);
await page.fill('#ob-in', 'Alex'); await shot('02-onboard-name'); await page.click('#ob-next');
for (const c of ['fizika', 'csillag', 'tech', 'filozofia']) await page.click(`.chip[data-v="${c}"]`); await shot('03-onboard-interests'); await page.click('#ob-next');
await page.click('.opt[data-v="megerteni"]'); await page.click('#ob-next');
await page.click('.lk-row[data-k="open"] .lk-b[data-n="5"]'); await page.click('.lk-row[data-k="skept"] .lk-b[data-n="4"]'); await shot('04-onboard-likert'); await page.click('#ob-next');
await page.click('.opt[data-v="vegyes"]'); await page.click('#ob-next');
await page.fill('#ob-in', 'Hogyan keletkezett a tudat?'); await page.click('#ob-next');
await page.waitForTimeout(4000); await shot('05-disciples');
const cmds = ['Hogyan működik a fotoszintézis?', 'kutassátok: fekete lyuk', 'fókusz: csillagászat', 'Nyelvész: Rovásírás', 'Mi a kvantumszámítógép?', 'Balaton', 'Ki vagyok én?', 'Ki volt Szókratész?'];
let t0 = Date.now(), i = 0, shotMid = false;
while (Date.now() - t0 < 240000) {
  const born = await page.evaluate(() => __aeon.game.s.core.born);
  if (born) break;
  const q = await page.$('.qcard:not(.done) .qopts .btn'); if (q) { await q.click().catch(() => {}); }
  const qf = await page.$('.qcard:not(.done) .qform input'); if (qf) { await qf.fill('informatika'); await page.click('.qcard:not(.done) .qform .btn').catch(() => {}); }
  const busy = await page.evaluate(() => __aeon.game.busy || __aeon.game.queue.length);
  if (!busy && i < cmds.length) { await page.fill('#cmd-in', cmds[i++]); await page.click('#cmd .btn'); }
  if (!shotMid && (await page.evaluate(() => __aeon.game.nodes.length)) >= 10) { await shot('06-learning'); shotMid = true; }
  await page.waitForTimeout(1500);
}
const st = await page.evaluate(() => ({ born: __aeon.game.s.core.born, nodes: __aeon.game.nodes.length, comp: __aeon.game.s.oracle.completeness, avg: __aeon.game.avgLevel(), agents: __aeon.game.s.agents.map((a) => a.name + ':' + a.level) }));
console.log('state', JSON.stringify(st), 'secs', Math.round((Date.now() - t0) / 1000));
await page.waitForTimeout(1500); await shot('07-birth');
await page.waitForTimeout(5000); await shot('08-core-born');
await page.click('#b-profile'); await page.waitForTimeout(500); await shot('09-profile'); await page.click('.x');
await page.click('#b-know'); await page.waitForTimeout(500); await shot('10-knowledge'); await page.click('.x');
await page.click('#b-map'); await page.waitForTimeout(800); await page.mouse.click(...(await (async () => { const b = await page.$('#kmap'); const r = await b.boundingBox(); return [r.x + r.width * 0.5, r.y + r.height * 0.5]; })())); await page.waitForTimeout(300); await shot('10b-map'); await page.click('.x');
await page.click('.arow'); await page.waitForTimeout(400); const sk = await page.$('#skills [data-sk="depth"]:not([disabled])'); if (sk) { await sk.click(); await page.waitForTimeout(300); } await shot('10c-agent-skills'); await page.click('.x');
// core evolution series (levels set directly to preview the stages)
if (mode === 'desktop') for (const L of [1, 6, 15, 22, 30, 45]) { await page.evaluate((L) => { __aeon.game.s.core.xp = 2 * 30 * Math.pow(L - 1, 1.5) + 1; __aeon.ui.updateCore(); }, L); await page.waitForTimeout(L === 1 ? 2500 : 4000); await page.screenshot({ path: `shots/core-L${String(L).padStart(2, '0')}.png`, clip: { x: 400, y: 0, width: 800, height: 600 } }); }
// grow the core to show the later stages (simulates a long play session)
await page.evaluate(() => { __aeon.game.s.core.xp = 2200; __aeon.ui.updateCore(); __aeon.ui.renderAgents(); });
await page.click('#b-forge'); await page.waitForTimeout(400); await page.fill('#f-name', 'Szófia'); await page.selectOption('#f-spec', 'pszicho'); await page.click('.fopt[data-f="pulsar"]'); await page.click('.swc[data-c="#ff8ad8"]'); await shot('11-forge'); await page.click('#f-go');
await page.waitForTimeout(6000); await shot('12-grown-core');
await page.evaluate(() => { __aeon.game.s.core.xp = 20000; __aeon.ui.updateCore(); });
await page.waitForTimeout(6000); await shot('13-late-core');
await page.click('#b-settings'); await page.waitForTimeout(400); await shot('14-settings'); await page.click('.x');
console.log('errors', JSON.stringify(errors.slice(0, 10)));
await b.close(); srv.close();
