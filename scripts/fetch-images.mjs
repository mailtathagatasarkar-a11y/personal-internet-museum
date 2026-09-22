// Downloads the chosen Wikimedia Commons image for every museum object into
// public/objects/ and writes src/data/images.json (dimensions + attribution).
// Usage: node scripts/fetch-images.mjs [--width 1400]
import fs from "node:fs";
import path from "node:path";

const UA = "PersonalInternetMuseum-prototype/0.1 (local research script)";
const WIDTH = Number(process.argv[process.argv.indexOf("--width") + 1]) || 1400;
const OUT = path.resolve("public/objects");
const MANIFEST = path.resolve("src/data/images.json");
fs.mkdirSync(OUT, { recursive: true });
fs.mkdirSync(path.dirname(MANIFEST), { recursive: true });

// id -> Commons file title. Room 01 was chosen by hand from contact sheets;
// later rooms come from scripts/sources.json, written by find-images.mjs.
const ROOM_ONE = {
  "braun-t3": "File:Braun-t4-transistor-radio-design-dieter-rams-only-once-shop-4.jpg",
  "braun-sk4": "File:1956 Braun Phonosuper SK4 Schneewittchensarg.JPG",
  "vitsoe-606": "File:606-Universal-Shelving-System.jpg",
  "braun-et66": "File:1987 Braun calculator ET66 by Dieter Rams (13964223413).jpg",
  "olivetti-valentine": "File:Olivetti-Valentine.jpg",
  "lettera-22": "File:Olivetti Lettera 22 by LjL.jpeg",
  tizio: "File:Lampada Tizio.jpg",
  helvetica: "File:HelveticaSpecimenCH.svg",
  futura: "File:Futura Inline Type Specimen (8056809802).jpg",
  johnston: "File:Victoria underground roundel 2007-06-04.jpg",
  trajan: "File:Trajan (2959610060).jpg",
  "comic-sans": "File:ComicSansSpec3.svg",
  "barcelona-pavilion": "File:The Barcelona Pavilion, Barcelona, 2010.jpg",
  farnsworth: "File:Farnsworth House by Mies Van Der Rohe - exterior-8.jpg",
  "casa-malaparte": "File:Villa Malaparte view from above.jpg",
  nakagin: "File:Nakagin.jpg",
  chandigarh: "File:Palace of Assembly Chandigarh.jpg",
  "iim-ahmedabad": "File:Louis Kahn Plaza, IIM Ahmedabad.jpg",
  barbican: "File:1352667 II BARBICAN, Cromwell Tower City of London London 20250613 0001.jpg",
  "eames-lounge": "File:Ngv design, charles eames and herman miller, lounge chair 670, 1956.JPG",
  "barcelona-chair": "File:Ngv design, ludwig mies van der rohe & co, barcelona chair.JPG",
  wassily: "File:Marcel Breuer - Wassily Chair.jpg",
  anglepoise:
    "File:Type 1227 desk lamp, Anglepoise, designed by George Carwardine, manufactured by Herbert Terry and Sons, 1935 - Design Museum, Kensington - London - DSC01571.jpg",
  "leica-m3": "File:Leica M3 mg 3848.jpg",
  moka: "File:Moka Express Bialetti.png",
  "casio-f91w": "File:Casio F-91W 5051.jpg",
  "lamy-2000": "File:Lamy 2000 (26986461785).jpg",
  "migrant-mother": "File:Lange-MigrantMother02.jpg",
  muybridge: "File:The Horse in Motion high res.jpg",
  atget: "File:Boutique Journaux, Rue de Sèvres, Paris MET DP124590.jpg",
  blossfeldt: "File:Picture from Urformen derKunst by Karl Blossfeldt, p. 10.jpg",
  "pale-blue-dot": "File:Pale Blue Dot from Voyager 1 - PIA23645.png",
  metropolis: "File:1927 Boris Bilinski (1900-1948) Plakat für den Film Metropolis, Staatliche Museen zu Berlin.jpg",
  "man-with-movie-camera": "File:Man with a Movie Camera by Dziga Vertov.jpg",
  "trip-to-the-moon": "File:A Trip to the Moon (Le Voyage dans la Lune).jpg",
  "pather-panchali": "File:Publicity still from Pather Panchali.jpg",
  cinematographe: "File:Institut Lumière - CINEMATOGRAPHE Camera.jpg",
  "tr-808": "File:Roland TR-808 (large).jpg",
  "sl-1200": "File:Technics SL-1200 Original 1972.jpg",
  "op-1": "File:The OP-1 by Teenage Engineering.jpg",
  walkman: "File:Original Sony Walkman TPS-L2.JPG",
  "golden-record": "File:The Sounds of Earth Record Cover - GPN-2000-001978.jpg",
  ipod: "File:IPod1stWIKIPEDIA.png",
  "imac-g3": "File:IMac G3 Bondi Blue, three-quarters view.png",
  macintosh: "File:Computer macintosh 128k, 1984 (all about Apple onlus).jpg",
  "xerox-alto": "File:Xero Alto Computer.jpg",
  "game-boy": "File:Game-Boy-Original.jpg",
  thinkpad: "File:IBM ThinkPad 720C.jpg",
  "nokia-3310": "File:Nokia 3310 grey front (tidied and enhanced).jpg",
  "next-cern": "File:First Web Server.jpg",
  "utah-teapot": "File:Utah Teapot circa 1974, Computer History Museum.jpg",
  "stanford-bunny": "File:Stanford bunny qem.png",
  "lego-patent":
    "File:US3005282A Toy building brick (1958 filed, 1961 published) by Christiansen Godtfred Kirk - Lego brick, p.2, Fig. 7~12.png",
};

const EXTRA_PATH = path.resolve("scripts/sources.json");
const SOURCES = { ...ROOM_ONE, ...(fs.existsSync(EXTRA_PATH) ? JSON.parse(fs.readFileSync(EXTRA_PATH, "utf8")) : {}) };
const REDO = process.argv.includes("--redo");
// --only a,b,c: fetch just these ids again (after a better file was chosen).
const onlyArg = process.argv.indexOf("--only");
const ONLY = onlyArg > -1 ? new Set(process.argv[onlyArg + 1].split(",")) : null;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const clean = (s) =>
  (s || "")
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();

async function get(url, attempt = 0) {
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (res.status === 429 && attempt < 5) {
    const wait = Number(res.headers.get("retry-after") || 0) * 1000 || 5000 * (attempt + 1);
    console.log(`  429 -> waiting ${wait}ms`);
    await sleep(wait);
    return get(url, attempt + 1);
  }
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res;
}

const existing = fs.existsSync(MANIFEST) ? JSON.parse(fs.readFileSync(MANIFEST, "utf8")) : {};
// Already processed images are left alone unless asked.
const wanted = Object.fromEntries(Object.entries(SOURCES).filter(([id]) => (ONLY ? ONLY.has(id) : REDO || !existing[id]?.processed)));

// Resolve thumbnails + metadata in batches of 40 titles.
const titles = Object.values(wanted);
const info = {};
for (let i = 0; i < titles.length; i += 40) {
  const u = new URL("https://commons.wikimedia.org/w/api.php");
  u.search = new URLSearchParams({
    action: "query",
    titles: titles.slice(i, i + 40).join("|"),
    prop: "imageinfo",
    iiprop: "url|size|mime|extmetadata",
    iiurlwidth: String(WIDTH),
    format: "json",
  });
  const j = await (await get(u)).json();
  const alias = {};
  for (const n of j.query?.normalized || []) alias[n.from] = n.to;
  for (const p of Object.values(j.query?.pages || {})) info[p.title] = p;
  for (const t of titles.slice(i, i + 40)) if (alias[t] && info[alias[t]]) info[t] = info[alias[t]];
  await sleep(1000);
}

const manifest = { ...existing };
for (const [id, title] of Object.entries(wanted)) {
  const p = info[title];
  if (!p || p.missing !== undefined || !p.imageinfo) {
    console.log("MISSING", id, title);
    continue;
  }
  const ii = p.imageinfo[0];
  const em = ii.extmetadata || {};
  // The original when it is not huge: rendered thumbnails are rate-limited far harder than originals.
  const useOriginal = ii.size && ii.size < 6_000_000 && !/svg/.test(ii.mime);
  const thumb = useOriginal ? ii.url : ii.thumburl || ii.url;
  const ext = ((useOriginal ? ii.mime : ii.thumbmime || ii.mime) || "image/jpeg").includes("png") ? "png" : "jpg";
  const file = path.join(OUT, `${id}.${ext}`);
  if (ONLY)
    for (const f of [file, path.join(OUT, `${id}.jpg`), path.join(OUT, `${id}.png`), path.join(OUT, "t", `${id}.jpg`)])
      if (fs.existsSync(f)) fs.unlinkSync(f);
  if (!fs.existsSync(file)) {
    const res = await get(thumb);
    fs.writeFileSync(file, Buffer.from(await res.arrayBuffer()));
    await sleep(1200);
  }
  manifest[id] = {
    src: `/objects/${id}.${ext}`,
    width: useOriginal ? ii.width : ii.thumbwidth || ii.width,
    height: useOriginal ? ii.height : ii.thumbheight || ii.height,
    license: em.LicenseShortName?.value || "",
    artist: clean(em.Artist?.value).slice(0, 80),
    page: ii.descriptionurl,
  };
  console.log("ok", id.padEnd(22), `${manifest[id].width}x${manifest[id].height}`, ext, manifest[id].license);
}
fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2));
console.log("wrote", MANIFEST, Object.keys(manifest).length, "images");
