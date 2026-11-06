import { World } from './scene.js';
import { UI } from './ui.js';
import { Game } from './game.js';

const world = new World(document.getElementById('stage'), { onAgentClick: (id) => (id === 'core' ? ui.openProfile() : ui.openAgent(id)) });
const ui = new UI(world);
const game = new Game(ui);
ui.bind(game);
world.setQuality(game.s.settings.quality || (matchMedia('(max-width: 820px)').matches ? 'low' : 'high'));
world.tickFns.push((dt) => game.tick(dt));
world.start();
window.__aeon = { game, ui, world };

// Newborn agents take their chosen form once they have formed.
setInterval(() => game.s.agents.forEach((a) => { if (a.bornAt && Date.now() - a.bornAt > 45000 && a.status === 'születik') a.status = 'pihen'; world.upsertAgent(a); }), 3000);

async function boot() {
  const intro = document.getElementById('intro');
  const btn = document.getElementById('start');
  btn.textContent = game.s.phase === 'onboarding' ? 'Ébredés' : 'Folytatás';
  document.getElementById('intro-src').textContent = 'Tudásforrások keresése…';
  const sources = game.detectSources().then(() => { document.getElementById('intro-src').textContent = `Tudásforrás: ${game.sourceName}`; });
  btn.addEventListener('click', async () => {
    intro.classList.add('fade'); setTimeout(() => (intro.hidden = true), 900);
    await sources;
    if (game.s.phase === 'onboarding') {
      ui.runOnboarding(() => { game.startDisciples(); ui.initHUD(); });
    } else { ui.initHUD(); game.checkBirth(); }
  }, { once: true });
}
boot();
