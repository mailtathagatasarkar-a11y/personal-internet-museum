// Composes a room: sets its objects into the grid by territory, following the
// poster rules in src/data/layout.ts, and writes src/data/rooms/<id>.ts.
//   · an image never shares an edge with another image (corners may touch)
//   · text blocks (headline, territory names) own whole cells
//   · roughly half the cells stay empty
// Sizes come from each image's aspect; the first objects of a territory are
// set larger. Placement prefers the spot farthest from other images in the
// zone, with a little seeded chance so no two rooms look alike.
// Usage: node scripts/compose-room.mjs scripts/rooms/<id>.json [--seed 7]
import fs from "node:fs";
import path from "node:path";

const spec = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));
const seedArg = process.argv.indexOf("--seed");
const SEED = seedArg > -1 ? Number(process.argv[seedArg + 1]) : (spec.seed ?? 1);
const COLS = 26;
const ROWS = 18;

// Objects of this room: id + territory, read straight from the catalogue file.
const src = fs.readFileSync(path.resolve(`src/data/objects/${spec.id}.ts`), "utf8");
const objects = [...src.matchAll(/id: "([^"]+)"[\s\S]*?territory: "([^"]+)"/g)].map((m) => ({ id: m[1], territory: m[2] }));

// Image aspects, from what the finder chose (or the manifest, once fetched).
const manifest = fs.existsSync("src/data/images.json") ? JSON.parse(fs.readFileSync("src/data/images.json", "utf8")) : {};
const candidates = fs.existsSync(".cache/candidates.json") ? JSON.parse(fs.readFileSync(".cache/candidates.json", "utf8")) : {};
const sources = fs.existsSync("scripts/sources.json") ? JSON.parse(fs.readFileSync("scripts/sources.json", "utf8")) : {};
const aspectOf = (id) => {
  const m = manifest[id];
  if (m) return m.width / m.height;
  const c = (candidates[id] || []).find((x) => x.title === sources[id]) || (candidates[id] || [])[0];
  return c ? c.w / c.h : 1;
};
const isCutout = (id) => /\.(png|svg)$/i.test(sources[id] || manifest[id]?.src || "");

// Seeded random.
let s = SEED >>> 0 || 1;
const rnd = () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296;

// The floor.
const grid = Array.from({ length: ROWS }, () => Array(COLS).fill(null));
const mark = (c, r, w, h, v) => {
  for (let y = r; y < r + h; y++) for (let x = c; x < c + w; x++) grid[y][x] = v;
};
for (const f of spec.headline) mark(f.col, f.row, f.cols, f.rows, "T");
for (const [, l] of Object.entries(spec.labels)) mark(l.col, l.row, l.cols, 1, "T");

const inside = (c, r, w, h, z) => c >= z.col && r >= z.row && c + w <= z.col + z.cols && r + h <= z.row + z.rows;
const free = (c, r, w, h) => {
  if (c < 0 || r < 0 || c + w > COLS || r + h > ROWS) return false;
  for (let y = r; y < r + h; y++) for (let x = c; x < c + w; x++) if (grid[y][x]) return false;
  // No shared edges with another image: the four sides.
  for (let x = c; x < c + w; x++) {
    if (r > 0 && grid[r - 1][x] === "I") return false;
    if (r + h < ROWS && grid[r + h][x] === "I") return false;
  }
  for (let y = r; y < r + h; y++) {
    if (c > 0 && grid[y][c - 1] === "I") return false;
    if (c + w < COLS && grid[y][c + w] === "I") return false;
  }
  return true;
};

// Size options by aspect and rank within the territory. Cells are square.
const sizesFor = (aspect, rank, n) => {
  const wide = aspect > 1.35;
  const tall = aspect < 0.75;
  const hero = rank === 0;
  const big = rank === 1 || (n >= 6 && rank === 2);
  if (hero)
    return wide
      ? [
          [3, 2],
          [2, 1],
          [2, 2],
        ]
      : tall
        ? [
            [2, 3],
            [1, 2],
            [2, 2],
          ]
        : [
            [2, 2],
            [2, 1],
            [1, 1],
          ];
  if (big)
    return wide
      ? [
          [3, 2],
          [2, 1],
          [1, 1],
        ]
      : tall
        ? [
            [2, 3],
            [1, 2],
            [1, 1],
          ]
        : [
            [2, 2],
            [1, 1],
          ];
  // The rest: mostly a pair of cells, a single every third, so a third of the floor is image.
  if (wide)
    return rank % 3 === 2
      ? [
          [1, 1],
          [2, 1],
        ]
      : [
          [2, 1],
          [1, 1],
        ];
  if (tall)
    return rank % 3 === 2
      ? [
          [1, 1],
          [1, 2],
        ]
      : [
          [1, 2],
          [1, 1],
        ];
  return rank % 3 === 1
    ? [
        [2, 2],
        [1, 1],
      ]
    : [[1, 1]];
};

const cells = {};
const placedRects = [];
for (const [terr, zone] of Object.entries(spec.zones)) {
  const members = objects.filter((o) => o.territory === terr);
  const mine = [];
  members.forEach((o, rank) => {
    const aspect = aspectOf(o.id);
    const options = sizesFor(aspect, rank, members.length);
    let done = false;
    for (const [w, h] of options) {
      // Every valid spot in the zone; pick the one farthest from this territory's other images, with some chance.
      const spots = [];
      for (let r = zone.row; r <= zone.row + zone.rows - h; r++)
        for (let c = zone.col; c <= zone.col + zone.cols - w; c++) if (inside(c, r, w, h, zone) && free(c, r, w, h)) spots.push([c, r]);
      if (!spots.length) continue;
      const scored = spots.map(([c, r]) => {
        const cx = c + w / 2;
        const cy = r + h / 2;
        const d = mine.length ? Math.min(...mine.map((m) => Math.hypot(m.cx - cx, m.cy - cy))) : 2 + rnd();
        // Keep the first placements away from the label row, so the name breathes.
        const label = spec.labels[terr];
        const nearLabel = label && Math.abs(r - label.row) <= 1 && c < label.col + label.cols + 1 ? 0.6 : 1;
        return { c, r, score: d * nearLabel + rnd() * 1.4 };
      });
      scored.sort((a, b) => b.score - a.score);
      const { c, r } = scored[0];
      mark(c, r, w, h, "I");
      const cell = [c, r, w, h];
      const cellAspect = w / h;
      if (isCutout(o.id) || Math.max(aspect / cellAspect, cellAspect / aspect) > 1.6) cell.push("contain");
      cells[o.id] = cell;
      mine.push({ cx: c + w / 2, cy: r + h / 2 });
      placedRects.push({ id: o.id, c, r, w, h });
      done = true;
      break;
    }
    if (!done) console.log("UNPLACED", o.id, terr);
  });
}

// Report.
const total = COLS * ROWS;
const img = grid.flat().filter((v) => v === "I").length;
const txt = grid.flat().filter((v) => v === "T").length;
console.log(
  `${spec.id}: ${Object.keys(cells).length}/${objects.length} placed · images ${Math.round((100 * img) / total)}% · text ${Math.round((100 * txt) / total)}% · empty ${Math.round((100 * (total - img - txt)) / total)}%`,
);
for (let y = 0; y < ROWS; y++) console.log(grid[y].map((v) => (v === "I" ? "▪" : v === "T" ? "≡" : "·")).join(" "));

// Write the room.
const byTerr = {};
for (const o of objects) (byTerr[o.territory] ||= []).push(o.id);
const cellLines = Object.entries(byTerr)
  .map(([t, ids]) => {
    const z = spec.zones[t];
    const head = `    // ── ${t} (cols ${z.col}–${z.col + z.cols - 1}, rows ${z.row}–${z.row + z.rows - 1}) ──`;
    const rows = ids
      .filter((id) => cells[id])
      .map((id) => `    ${/^[a-z0-9]+$/.test(id) ? id : JSON.stringify(id)}: ${JSON.stringify(cells[id]).replace(/,/g, ", ")},`);
    return [head, ...rows].join("\n");
  })
  .join("\n");
const headLines = spec.headline
  .map(
    (f) => `    { lines: ${JSON.stringify(f.lines).replace(/,/g, ", ")}, col: ${f.col}, row: ${f.row}, cols: ${f.cols}, rows: ${f.rows} },`,
  )
  .join("\n");
const labelLines = Object.entries(spec.labels)
  .map(([t, l]) => `    ${t}: { col: ${l.col}, row: ${l.row}, cols: ${l.cols} },`)
  .join("\n");
const constName = `${spec.id.toUpperCase()}_ROOM`;
const out = `import type { RoomLayout } from "../layout";

// Room ${spec.number} — ${spec.name}. Composed by scripts/compose-room.mjs (seed ${SEED}); see the rules in layout.ts.
export const ${constName}: RoomLayout = {
  id: "${spec.id}",
  name: "${spec.name}",
  line: ${JSON.stringify(spec.line)},
  headline: [
${headLines}
  ],
  labels: {
${labelLines}
  },
  cells: {
${cellLines}
  },
};
`;
fs.writeFileSync(path.resolve(`src/data/rooms/${spec.id}.ts`), out);
console.log("wrote", `src/data/rooms/${spec.id}.ts`);
