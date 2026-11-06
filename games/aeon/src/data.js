// Static game data: knowledge categories, agent archetypes, profile questions.

export const CATEGORIES = [
  { id: 'fizika', name: 'Fizika', color: '#3d8bff', icon: 'atom', kw: ['fizik', 'physic', 'kvantum', 'quantum', 'energi', 'részecsk', 'particle', 'relativ', 'mechanik', 'mechanic', 'elektromos', 'electric', 'mágnes', 'magnet', 'optik', 'termodinami', 'thermodynam', 'gravitáci', 'gravit'] },
  { id: 'kemia', name: 'Kémia', color: '#2ee6c8', icon: 'flask', kw: ['kémi', 'chemi', 'molekul', 'molecul', 'vegyület', 'compound', 'reakci', 'reaction', 'kémiai elem', 'chemical element', 'sav', 'acid', 'polimer', 'polymer'] },
  { id: 'biologia', name: 'Biológia', color: '#39ff88', icon: 'dna', kw: ['biológ', 'biolog', 'sejt', 'cell', 'gén', 'gene', 'evolúci', 'evolution', 'faj', 'species', 'állat', 'animal', 'növény', 'plant', 'ökológ', 'ecolog', 'dns', 'dna', 'organizmus', 'organism'] },
  { id: 'orvos', name: 'Orvostudomány', color: '#ff7a9c', icon: 'cross', kw: ['orvos', 'medic', 'betegség', 'disease', 'gyógy', 'therap', 'egészség', 'health', 'vírus', 'virus', 'kórház', 'hospital', 'tünet', 'symptom', 'gyógyszer', 'drug'] },
  { id: 'matek', name: 'Matematika', color: '#5fe3ff', icon: 'math', kw: ['matemat', 'mathemat', 'geometri', 'geometr', 'algebra', 'tétel', 'theorem', 'statiszt', 'statistic', 'valószínűség', 'probabilit', 'számelmélet', 'number theory', 'függvény', 'function'] },
  { id: 'csillag', name: 'Csillagászat', color: '#9fb7ff', icon: 'astro', kw: ['csillag', 'star', 'bolygó', 'planet', 'galaxi', 'galax', 'univerzum', 'universe', 'kozmo', 'cosmo', 'űrkutat', 'space', 'hold', 'moon', 'nap ', 'solar', 'fekete lyuk', 'black hole', 'üstökös', 'comet'] },
  { id: 'tech', name: 'Technológia', color: '#ff4d6d', icon: 'tech', kw: ['technológ', 'technolog', 'számítógép', 'computer', 'szoftver', 'software', 'mesterséges intelligencia', 'artificial intelligence', 'internet', 'robot', 'mérnök', 'engineer', 'algoritm', 'algorithm', 'programoz', 'programming', 'akkumulátor', 'battery', 'félvezető', 'semiconductor'] },
  { id: 'tortenelem', name: 'Történelem', color: '#ffcf3d', icon: 'temple', kw: ['történ', 'histor', 'háború', 'war', 'birodalom', 'empire', 'király', 'king', 'ókor', 'ancient', 'középkor', 'medieval', 'forradalom', 'revolution', 'század', 'century', 'dinasztia', 'dynasty', 'csata', 'battle'] },
  { id: 'foldrajz', name: 'Földrajz', color: '#4fd18b', icon: 'globe', kw: ['város', 'city', 'ország', 'country', 'folyó', 'river', 'hegy', 'mountain', 'tenger', 'sea', 'főváros', 'capital', 'földrajz', 'geograph', 'régió', 'region', 'megye', 'county', 'sziget', 'island', 'kontinens', 'continent', 'település', 'settlement'] },
  { id: 'nyelv', name: 'Nyelvek', color: '#b36bff', icon: 'lang', kw: ['nyelv', 'language', 'nyelvész', 'linguist', 'írásrendszer', 'writing system', 'ábécé', 'alphabet', 'dialektus', 'dialect', 'szótár', 'dictionar', 'nyelvtan', 'grammar', 'etimológ', 'etymolog'] },
  { id: 'muveszet', name: 'Művészet', color: '#ff9a3c', icon: 'palette', kw: ['művész', 'art', 'festő', 'painter', 'zene', 'music', 'irodalom', 'literature', 'költő', 'poet', 'film', 'színház', 'theatre', 'szobr', 'sculpt', 'regény', 'novel', 'zeneszerző', 'composer', 'író', 'writer'] },
  { id: 'filozofia', name: 'Filozófia', color: '#e6a8ff', icon: 'philo', kw: ['filozóf', 'philosoph', 'etika', 'ethic', 'logika', 'logic', 'metafizi', 'metaphysic', 'tudat', 'conscious', 'vallás', 'religion', 'mítosz', 'myth', 'isten', 'god', 'ismeretelmélet', 'epistemolog'] },
  { id: 'pszicho', name: 'Pszichológia', color: '#ff8ad8', icon: 'head', kw: ['pszichológ', 'psycholog', 'viselked', 'behavio', 'érzelem', 'emotion', 'személyiség', 'personality', 'elme', 'mind', 'kognitív', 'cognit', 'motiváci', 'motivat', 'memória', 'memory'] },
  { id: 'gazdasag', name: 'Gazdaság', color: '#c8e65a', icon: 'chart', kw: ['gazdaság', 'econom', 'pénz', 'money', 'piac', 'market', 'vállalat', 'company', 'kereskedel', 'trade', 'bank', 'pénzügy', 'financ', 'befektet', 'invest', 'infláci', 'inflation'] },
  { id: 'altalanos', name: 'Általános', color: '#a9bfd6', icon: 'spark', kw: [] },
];
export const CAT = Object.fromEntries(CATEGORIES.map((c) => [c.id, c]));

// Seed topics the agents fall back to when curiosity has no frontier yet.
export const SEEDS = {
  fizika: ['Kvantummechanika', 'Relativitáselmélet', 'Sötét anyag', 'Entrópia', 'Higgs-bozon'],
  kemia: ['Periódusos rendszer', 'Katalizátor', 'Kémiai kötés', 'Grafén'],
  biologia: ['Evolúció', 'DNS', 'Fotoszintézis', 'Mitokondrium', 'CRISPR'],
  orvos: ['Immunrendszer', 'Antibiotikum', 'Neuron', 'Védőoltás'],
  matek: ['Prímszám', 'Végtelen', 'Fraktál', 'Gödel nemteljességi tételei', 'Pi'],
  csillag: ['Fekete lyuk', 'Ősrobbanás', 'Exobolygó', 'Tejútrendszer', 'Neutroncsillag'],
  tech: ['Mesterséges intelligencia', 'Kvantumszámítógép', 'Internet', 'Neurális hálózat', 'Fúziós energia'],
  tortenelem: ['Római Birodalom', 'Reneszánsz', 'Ipari forradalom', 'Honfoglalás', 'Ókori Egyiptom'],
  foldrajz: ['Amazonas', 'Himalája', 'Szahara', 'Balaton', 'Csendes-óceán'],
  nyelv: ['Magyar nyelv', 'Indoeurópai nyelvek', 'Ékírás', 'Eszperantó', 'Rovásírás'],
  muveszet: ['Leonardo da Vinci', 'Bartók Béla', 'Impresszionizmus', 'Barokk zene'],
  filozofia: ['Szókratész', 'Sztoicizmus', 'Tudat', 'Egzisztencializmus', 'Platón'],
  pszicho: ['Személyiségpszichológia', 'Emlékezet', 'Flow (pszichológia)', 'Kognitív torzítás'],
  gazdasag: ['Infláció', 'Bitcoin', 'Játékelmélet', 'Kínálat és kereslet'],
  altalanos: ['Tudomány', 'Információ', 'Rendszerelmélet'],
};

// Visual archetypes (3D forms) that agents can take.
export const FORMS = [
  { id: 'seeker', name: 'Kereső szem', hint: 'gyűrűs szem letapogató fénykúppal' },
  { id: 'analyst', name: 'Kettős kocka', hint: 'egymásban forgó kockák' },
  { id: 'linguist', name: 'Kettős spirál', hint: 'forgó spirál jelekkel' },
  { id: 'architect', name: 'Moduláris tömb', hint: 'szétnyíló és összeálló kockák' },
  { id: 'strategist', name: 'Keringő rend', hint: 'dodekaéder keringő holdakkal' },
  { id: 'crystal', name: 'Kristály', hint: 'lebegő kristályszilánkok' },
  { id: 'pulsar', name: 'Pulzár', hint: 'csomóba font fénypálya' },
  { id: 'swarm', name: 'Raj', hint: 'kavargó részecskefelhő' },
];

export const AGENT_COLORS = ['#39ff88', '#3d8bff', '#b36bff', '#ffcf3d', '#ff4d6d', '#2ee6c8', '#ff9a3c', '#ff8ad8', '#c8e65a', '#9fb7ff'];

export const STARTERS = [
  { name: 'Kutató', role: 'kutato', form: 'seeker', color: '#39ff88', desc: 'Felderíti a forrásokat, cikkeket keres és olvas.' },
  { name: 'Elemző', role: 'elemzo', form: 'analyst', color: '#3d8bff', desc: 'Keresztellenőriz: több nyelven, több forrásból vet össze.' },
  { name: 'Nyelvész', role: 'nyelvesz', form: 'linguist', color: '#b36bff', desc: 'Kulcsfogalmakat emel ki, nyelveken át fordít és rendszerez.' },
  { name: 'Építész', role: 'epitesz', form: 'architect', color: '#ffcf3d', desc: 'Összeköti a tudást: tudásgráfot épít a témák között.' },
];

export const CORE_STAGES = [
  { lvl: 1, name: 'Mag' },
  { lvl: 3, name: 'Szikra' },
  { lvl: 6, name: 'Csillag' },
  { lvl: 10, name: 'Nap' },
  { lvl: 15, name: 'Galaxis' },
  { lvl: 22, name: 'Kvazár' },
  { lvl: 30, name: 'Univerzum' },
  { lvl: 45, name: 'Mindentudás határa' },
];

// ----- Oracle profile assessment -----
// trait keys: open (nyitottság), consc (rendszeresség), intuit (intuíció), social (társas energia), skept (szkepszis)
export const ONBOARDING = [
  { id: 'name', type: 'text', q: 'Jel érzékelve. Négy születő tudat keresi a forrását. Hogyan szólítsanak téged?', placeholder: 'pl. Orákulum', def: 'Orákulum' },
  { id: 'interests', type: 'multi', q: 'Mely tudásterületek vonzanak? (Több is választható.)', options: CATEGORIES.filter((c) => c.id !== 'altalanos').map((c) => ({ v: c.id, t: c.name })) },
  {
    id: 'motive', type: 'single', q: 'Mi hajt leginkább, amikor tudást keresel?', options: [
      { v: 'megerteni', t: 'Megérteni, hogyan működik a világ' },
      { v: 'alkotni', t: 'Alkotni, építeni, létrehozni valamit' },
      { v: 'segiteni', t: 'Segíteni másokon, jobbá tenni a dolgokat' },
      { v: 'jovo', t: 'Előre látni a jövőt' },
      { v: 'rejtely', t: 'A rejtélyek és titkok megfejtése' },
    ],
  },
  {
    id: 'traits', type: 'likert', q: 'Mennyire igazak rád ezek az állítások?', items: [
      { k: 'open', t: 'Szívesen merülök el teljesen új, szokatlan ötletekben.' },
      { k: 'consc', t: 'Szeretem a dolgokat alaposan, rendszerezetten végigvinni.' },
      { k: 'intuit', t: 'Inkább ösztönből döntök, mint hosszas elemzés után.' },
      { k: 'social', t: 'Energiát ad, ha másokkal ötletelhetek.' },
      { k: 'skept', t: 'Az ellenőrzés fontosabb, mint a gyors válasz.' },
    ],
  },
  {
    id: 'depth', type: 'single', q: 'Hogyan szeretsz tanulni?', options: [
      { v: 'mely', t: 'Kevés témát, de nagyon mélyen' },
      { v: 'szeles', t: 'Sok témát, áttekintően' },
      { v: 'vegyes', t: 'Vegyesen: széles alap, néhány mély fúrás' },
    ],
  },
  { id: 'bigq', type: 'text', q: 'Mi az a kérdés, ami régóta foglalkoztat? A tanítványaid ezzel kezdik a munkát.', placeholder: 'pl. Hogyan keletkezett a tudat?', def: 'Hogyan működik a tudat?' },
];

// Follow-up questions the agents ask during play to complete the profile.
export const FOLLOWUPS = [
  { id: 'theory', q: 'Inkább az elméletek vagy a gyakorlati alkalmazások érdekelnek?', options: [{ v: 'elmelet', t: 'Elméletek' }, { v: 'gyakorlat', t: 'Gyakorlati alkalmazások' }, { v: 'mindketto', t: 'Mindkettő' }] },
  { id: 'era', q: 'Melyik idő vonz leginkább: a múlt, a jelen vagy a jövő?', options: [{ v: 'mult', t: 'A múlt', cat: 'tortenelem' }, { v: 'jelen', t: 'A jelen', cat: 'gazdasag' }, { v: 'jovo', t: 'A jövő', cat: 'tech' }] },
  { id: 'learnstyle', q: 'Hogyan tanulsz a legszívesebben?', options: [{ v: 'olvas', t: 'Olvasva' }, { v: 'kep', t: 'Képekből, ábrákból' }, { v: 'vita', t: 'Vitatkozva, beszélgetve' }, { v: 'probal', t: 'Kipróbálva' }] },
  { id: 'mystery', q: 'Mit tartasz a legnagyobb rejtélynek?', options: [{ v: 'tudat', t: 'A tudatot', cat: 'filozofia', seed: 'Tudat' }, { v: 'univerzum', t: 'Az univerzum eredetét', cat: 'csillag', seed: 'Ősrobbanás' }, { v: 'elet', t: 'Az élet keletkezését', cat: 'biologia', seed: 'Az élet keletkezése' }, { v: 'ido', t: 'Az időt', cat: 'fizika', seed: 'Idő' }] },
  { id: 'langs', q: 'Milyen nyelvű forrásokból kutassunk?', options: [{ v: 'hu', t: 'Főleg magyar' }, { v: 'huen', t: 'Magyar és angol' }, { v: 'en', t: 'Főleg angol (több tudás)' }] },
  { id: 'freeday', q: 'Mit csinálnál egy teljesen szabad napon?', options: [{ v: 'olvas', t: 'Olvasnék', cat: 'muveszet' }, { v: 'termeszet', t: 'Kimennék a természetbe', cat: 'foldrajz' }, { v: 'alkot', t: 'Alkotnék valamit', cat: 'tech' }, { v: 'beszelget', t: 'Beszélgetnék', cat: 'pszicho' }] },
  { id: 'proof', q: 'Mennyire fontos, hogy minden válasz mögött forrás legyen?', options: [{ v: 'nagyon', t: 'Nagyon, csak ellenőrzött tudás', trait: ['skept', 1] }, { v: 'kozepes', t: 'Fontos, de a gondolat is számít' }, { v: 'kevesbe', t: 'Az ötletek többet érnek', trait: ['open', 1] }] },
  { id: 'autonomy', q: 'Hagyjuk, hogy magunktól is válasszunk kutatási témát, amikor nem adsz utasítást?', options: [{ v: 'igen', t: 'Igen, legyetek kíváncsiak' }, { v: 'ritkan', t: 'Csak ritkán' }, { v: 'nem', t: 'Nem, csak az utasításaimat kövessétek' }] },
  { id: 'work', q: 'Milyen területen dolgozol vagy alkotsz? (Ebből tudjuk, miben segíthetünk.)', type: 'text', placeholder: 'pl. informatika, kereskedelem, tanítás…' },
  { id: 'fear', q: 'Mi az, amit a tudással el szeretnél kerülni vagy legyőzni?', options: [{ v: 'tevedes', t: 'A tévedést', trait: ['skept', 1] }, { v: 'tudatlansag', t: 'A tudatlanságot' }, { v: 'tehetetlenseg', t: 'A tehetetlenséget', cat: 'tech' }, { v: 'magany', t: 'Az elszigeteltséget', trait: ['social', 1] }] },
];

export const STOPWORDS = new Set(('a az és egy is hogy nem de vagy mint ami amely aki csak még már volt van lesz lett ez azt ezt meg el ki be fel le át ha mert pedig kell lehet több sok nagy első után alatt között szerint során által ő ők mi ti te én' +
  ' the of and a an in on at to for is was are were be by with as from that this which who or it its into also has have had not but their they he she his her been more most other such than then there these those can may one two first').split(/\s+/));

export const ARCHETYPES = [
  { id: 'felfedezo', name: 'A Felfedező', when: (t) => t.open >= 4 && t.intuit >= 3, desc: 'Új világokat keresel; a kíváncsiságod messzebbre visz, mint a térképek.' },
  { id: 'elemzo', name: 'Az Elemző Elme', when: (t) => t.skept >= 4 && t.consc >= 4, desc: 'Csak az ellenőrzött igazság érdekel; a pontosság a mértéked.' },
  { id: 'epito', name: 'Az Építő', when: (t, m) => m === 'alkotni', desc: 'A tudás nálad eszköz: abból építesz, amit megértesz.' },
  { id: 'latnok', name: 'A Látnok', when: (t, m) => m === 'jovo', desc: 'A jelenben a jövő mintáit keresed.' },
  { id: 'bolcs', name: 'A Bölcs', when: (t, m) => m === 'megerteni' && t.consc >= 3, desc: 'A mély megértés vonz; a miértek a hogyanok mögött.' },
  { id: 'gyogyito', name: 'A Segítő', when: (t, m) => m === 'segiteni', desc: 'A tudásod másokért van; az értelme a haszna.' },
  { id: 'misztikus', name: 'A Misztikus', when: (t, m) => m === 'rejtely', desc: 'A határokon túli kérdések vonzanak, ott, ahol a válaszok még nem léteznek.' },
  { id: 'kozvetito', name: 'A Közvetítő', when: (t) => t.social >= 4, desc: 'A tudás nálad párbeszéd: összekötöd az embereket és az eszméket.' },
  { id: 'vandor', name: 'A Vándor', when: () => true, desc: 'Sokféle ösvényen jársz; a sokszínűség az erőd.' },
];
