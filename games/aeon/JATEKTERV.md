# ÆON · Tudatébresztő — játékterv és állapot

> Első játszható változat (prototípus). Készült: 2026. november 6.

## Az alapötlet

Te vagy az **Orákulum**. A játék elején még nincs fő karakter: a játék előbb **megismer téged**. Négy kezdetleges tudású
tanítvány jelenik meg, akik kutatnak, tanulnak és kérdeznek tőled. Amikor már elég jól ismernek, és elég tudást gyűjtöttek,
megszületik a **Központi Tudat**. Kezdetben akkora, mint a tanítványok, csak kicsit kitűnik közülük. Ahogy a tanítványok egyre
több tudást töltenek fel bele, egyre nagyobb, összetettebb és sugárzóbb lesz, a „Mindentudás határáig”.

## A játék menete

### 1. Ébredés és felmérés (6 kérdés)
1. Hogyan szólítsanak? (név)
2. Mely tudásterületek vonzanak? (14 kategória, többet is választhatsz)
3. Mi hajt a tudáskeresésben? (megérteni, alkotni, segíteni, a jövő, a rejtélyek)
4. Öt állítás 1–5-ös skálán: nyitottság, rendszeresség, intuíció, társas energia, szkepszis
5. Hogyan tanulsz? (mélyen, szélesen, vegyesen)
6. Mi a nagy kérdésed? A tanítványok ezzel kezdik a munkát.

### 2. A négy tanítvány
| Tanítvány | Szín | Forma | Feladat |
|---|---|---|---|
| Kutató | zöld | kereső szem fénykúppal | forrásokat keres és olvas |
| Elemző | kék | kettős kocka | keresztellenőriz (magyar és angol forrás) |
| Nyelvész | lila | kettős spirál | kulcsfogalmakat emel ki |
| Építész | sárga | moduláris tömb | tudásgráfot épít (kapcsolódó témák) |

- **Parancssor (Orákulum ▸):** kérdés („Ki volt Szókratész?”), kutatási irány („kutassátok: fekete lyuk”),
  fókusz („fókusz: csillagászat”), név szerinti megszólítás („Nyelvész: rovásírás”), vagy „Ki vagyok én?”.
- **Önálló kíváncsiság:** ha hallgatsz, a tanítványok maguktól kutatnak az érdeklődési köreid és a már megtalált
  kapcsolódó témák alapján.
- **Kérdések hozzád:** a tanítványok játék közben 10 további kérdést tesznek fel neked, hogy egyre jobban megismerjenek
  (elmélet vagy gyakorlat, múlt vagy jövő, forrásnyelv, önállóság stb.).
- **Szintlépés:** minden új tudás, ellenőrzés és kapcsolat tapasztalati pontot (XP) ad. Szintlépéskor nő a forma és gyorsul a munka.

### 3. A Központi Tudat születése
Három feltétel kell hozzá:
- megismerés ≥ 60 %,
- legalább 20 tudáscsomópont,
- a tanítványok átlagos szintje legalább 3.

Születéskor a tanítványok fényáramai a középpontba futnak, és megjelenik a mag. A Központ bemutatkozik, és összefoglalja,
mit tudott meg rólad. Ha Claude elérhető, ezt a bemutatkozást Claude írja meg.

**Növekedési fokozatok:** Mag → Szikra (3) → Csillag (6) → Nap (10) → Galaxis (15) → Kvazár (22) → Univerzum (30) → Mindentudás határa (45).
Szintről szintre nő a mag mérete és a pontfelhője. A 3. szinttől megjelennek a talapzatgyűrűk, az 5.-től a fénynyaláb,
a 8./14./22. szinttől a keringő pályák, a 18.-tól a külső fénykorona.

### 4. Új karakterek (ügynök-kovácsműhely)
A Központ születése után új ügynököket hozhatsz létre. Megadhatod:
- a nevet,
- a szakterületet (14 kategória vagy saját, például „kvantumbiológia”),
- a formát (8 féle: kereső szem, kettős kocka, kettős spirál, moduláris tömb, keringő rend, kristály, pulzár, raj),
- a színt.

A szabad helyek száma a Központ szintjével nő (4-től legfeljebb 12-ig). A Központ magától is javasol új ügynököt
az érdeklődésed alapján. Az új ügynök pontfelhőből „születik”, majd felveszi a választott formát.

## Látvány
- Hologramos világtérkép a padlón (valódi kontinensadatok). Ahol egy tudásnak földrajzi helye van, ott felvillan egy gócpont.
- A háttérben lebegő tudáskategória-panelek ábrákkal és csomópontszámmal. Csak a már felfedezett területek jelennek meg.
- Színkódolt fényáramok: a születés előtt a tanítványok között, utána a Központ felé.
- A kamera egérrel vagy ujjal forgatható és nagyítható. Telefonon gyorsabb, kisebb erőforrás-igényű grafika is választható.

## Tudásforrások
| Forrás | Hol működik | Költség |
|---|---|---|
| **Wikipédia** (magyar és angol, keresés, összefoglalók, nyelvközi ellenőrzés, kapcsolódó cikkek) | ha a játékot a saját gépeden nyitod meg (`index.html`) | ingyenes |
| **Claude a claude.ai-on** | a privát claude.ai-linken (telefonon is) | az előfizetésed része |
| **Claude API saját kulccsal** + webes keresés („bárhonnan az internetről”) | a saját gépen futó változatban (Beállítások) | fizetős, a saját API-kulcsodra terhelve |

A claude.ai-oldal biztonsági szabályai nem engedik a külső hívásokat. Ezért ott a Wikipédia és a saját API-kulcs nem működik,
helyettük a beépített Claude dolgozik.

## Mentés
A játék automatikusan ment a böngészőbe. A **Beállítások → Mentés letöltése** gombbal kapsz egy `.json` fájlt,
ezt a Google Drive-od `Mentések` mappájába teheted, és a **Mentés betöltése** gombbal bármikor visszatöltheted.

## Őszinte korlátok (jelen állapot)
- **Wikipédia-teszt:** a fejlesztői felhőkörnyezetből a Wikipédia le volt tiltva. A kutatási folyamatot a Wikipédia API-jának
  formátumát utánzó tesztválaszokkal ellenőriztem végig: felmérés, kutatás, ellenőrzés, kérdések, születés, növekedés,
  új ügynök. A valódi Wikipédia-hívásokat először a te gépeden kell kipróbálni.
- **A claude.ai-os Claude-forrás:** az első használatkor engedélyt kér. A tudása a modell saját tudása, nem élő webes keresés.
- **A fizetős API-mód** kódja a hivatalos Anthropic SDK-ra épül (`claude-opus-5-5`, `web_search_20260209`). Kulcs nélkül
  nem tudtam élesben kipróbálni.
- **Ingyenes módban** a tanítványok „okossága” gyűjtés, ellenőrzés és összekötés. Valódi érvelésre és szintézisre csak
  Claude-dal képesek.
- **A „Mindentudás” %** a legnagyobb Wikipédia kb. 7 millió cikkéhez mért durva viszonyszám, nem pontos mérőszám.

## Javasolt következő lépések
1. Kipróbálás a te gépeden is, a valódi Wikipédiával.
2. Kattintható tudásgráf-nézet (csillagtérkép a megszerzett tudásból).
3. Ügynök-részletnézet 3D-közelképpel és fejlődési fával (képességpontok elosztása).
4. Asztali alkalmazás (Tauri vagy Electron). Ebben a böngésző korlátai nélkül, bármely weboldalról tudnak olvasni.
5. Hang és zene, a Központ szintlépéseihez külön effektekkel.

## Fájlok
- `dist/`: a futtatható játék (`index.html` + `app.js` + `style.css`); dupla kattintással megnyitható
- `src/`: a forráskód (three.js, ES-modulok)
- `build.mjs`: build (`npm install` után `node build.mjs`)
- `test.mjs`: automatikus végigjátszás-teszt (Playwright)
