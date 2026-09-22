// Finds a Wikimedia Commons file for each new object: an exact title when one
// is known, otherwise the best search hit that is a real bitmap or SVG of a
// usable size. Writes scripts/sources.json (id -> "File:…"), which
// fetch-images.mjs reads. Everything on Commons is freely licensed; the exact
// licence and author are recorded by fetch-images.mjs into images.json.
// Usage: node scripts/find-images.mjs scripts/wanted-<room>.json
import fs from "node:fs";
import path from "node:path";

const UA = "PersonalInternetMuseum-prototype/0.1 (local research script)";
const WANTED = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));
const SOURCES_PATH = path.resolve("scripts/sources.json");
const sources = fs.existsSync(SOURCES_PATH) ? JSON.parse(fs.readFileSync(SOURCES_PATH, "utf8")) : {};
const CANDIDATES_PATH = path.resolve(".cache/candidates.json");
fs.mkdirSync(path.dirname(CANDIDATES_PATH), { recursive: true });
const candidates = fs.existsSync(CANDIDATES_PATH) ? JSON.parse(fs.readFileSync(CANDIDATES_PATH, "utf8")) : {};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function api(params, attempt = 0) {
  const u = new URL("https://commons.wikimedia.org/w/api.php");
  u.search = new URLSearchParams({ format: "json", ...params });
  const res = await fetch(u, { headers: { "User-Agent": UA } });
  if (res.status === 429 && attempt < 6) {
    const wait = Number(res.headers.get("retry-after") || 0) * 1000 || 4000 * (attempt + 1);
    console.log(`  429 -> waiting ${wait}ms`);
    await sleep(wait);
    return api(params, attempt + 1);
  }
  if (!res.ok) throw new Error(`${res.status} ${u}`);
  return res.json();
}

const OK_MIME = /^image\/(jpeg|png|svg\+xml|gif|tiff)$/;
async function infoFor(titles) {
  const j = await api({
    action: "query",
    titles: titles.join("|"),
    prop: "imageinfo",
    iiprop: "url|size|mime|extmetadata",
    iiurlwidth: "360",
  });
  const alias = {};
  for (const n of j.query?.normalized || []) alias[n.from] = n.to;
  const out = {};
  for (const p of Object.values(j.query?.pages || {})) if (p.imageinfo) out[p.title] = p.imageinfo[0];
  for (const t of titles) if (alias[t] && out[alias[t]]) out[t] = out[alias[t]];
  return out;
}

for (const [id, want] of Object.entries(WANTED)) {
  if (sources[id] && !process.argv.includes("--redo")) continue;
  const tried = [];
  if (want.t) {
    const info = await infoFor([want.t]);
    const ii = info[want.t];
    if (ii && OK_MIME.test(ii.mime) && (ii.mime === "image/svg+xml" || ii.width >= (want.min ?? 500))) {
      sources[id] = want.t;
      candidates[id] = [{ title: want.t, w: ii.width, h: ii.height, thumb: ii.thumburl, exact: true }];
      console.log("exact ", id.padEnd(24), want.t);
      await sleep(600);
      continue;
    }
    tried.push(want.t);
  }
  const j = await api({ action: "query", list: "search", srsearch: want.q, srnamespace: "6", srlimit: "12" });
  const hits = (j.query?.search || []).map((h) => h.title);
  await sleep(700);
  const info = hits.length ? await infoFor(hits) : {};
  const good = hits
    .map((t) => ({ title: t, ii: info[t] }))
    .filter(
      ({ ii }) =>
        ii &&
        OK_MIME.test(ii.mime) &&
        (ii.mime === "image/svg+xml" || (ii.width >= (want.min ?? 600) && ii.height >= (want.min ?? 400))) &&
        !/\.(pdf|djvu)$/i.test(ii.url),
    )
    .slice(0, 4)
    .map(({ title, ii }) => ({ title, w: ii.width, h: ii.height, thumb: ii.thumburl }));
  candidates[id] = good;
  if (good.length) {
    sources[id] = good[0].title;
    console.log("search", id.padEnd(24), good[0].title, `(+${good.length - 1})`);
  } else console.log("NONE  ", id.padEnd(24), want.q, tried.join(" / "));
  await sleep(900);
}
fs.writeFileSync(SOURCES_PATH, JSON.stringify(sources, null, 2));
fs.writeFileSync(CANDIDATES_PATH, JSON.stringify(candidates, null, 2));
console.log("wrote", Object.keys(sources).length, "sources");
