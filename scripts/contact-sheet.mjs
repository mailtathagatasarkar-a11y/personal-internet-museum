// Contact sheets of a room's thumbnails, for checking the finder's choices by eye.
// Usage: node scripts/contact-sheet.mjs firsts [tools …]  →  .cache/sheets/<room>-<n>.jpg
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const OUT = path.resolve(".cache/sheets");
fs.mkdirSync(OUT, { recursive: true });
const COLS = 6;
const ROWSN = 5;
const CELL = 220;
const LABEL = 26;

for (const room of process.argv.slice(2)) {
  const src = fs.readFileSync(path.resolve(`src/data/objects/${room}.ts`), "utf8");
  const ids = [...src.matchAll(/^\s{4}id: "([^"]+)"/gm)].map((m) => m[1]);
  for (let page = 0; page * COLS * ROWSN < ids.length; page++) {
    const slice = ids.slice(page * COLS * ROWSN, (page + 1) * COLS * ROWSN);
    const W = COLS * CELL;
    const H = ROWSN * (CELL + LABEL);
    const composites = [];
    const labels = [];
    for (let i = 0; i < slice.length; i++) {
      const id = slice[i];
      const x = (i % COLS) * CELL;
      const y = Math.floor(i / COLS) * (CELL + LABEL);
      // Processed thumbnail, else the raw download still in public/objects or already in the cache.
      const file = ["public/objects/t", "public/objects", ".cache/raw"]
        .flatMap((d) => ["jpg", "png"].map((e) => path.join(d, `${id}.${e}`)))
        .find((p) => fs.existsSync(p));
      if (file) {
        const buf = await sharp(file)
          .resize({ width: CELL - 8, height: CELL - 8, fit: "inside" })
          .toBuffer();
        const meta = await sharp(buf).metadata();
        composites.push({ input: buf, left: x + Math.round((CELL - meta.width) / 2), top: y + Math.round((CELL - meta.height) / 2) });
      }
      labels.push(
        `<text x="${x + 6}" y="${y + CELL + 17}" font-family="monospace" font-size="12" fill="${file ? "#222" : "#c33"}">${id}</text>`,
      );
    }
    const svg = Buffer.from(`<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">${labels.join("")}</svg>`);
    const out = path.join(OUT, `${room}-${page + 1}.jpg`);
    await sharp({ create: { width: W, height: H, channels: 3, background: "#e8e3d7" } })
      .composite([...composites, { input: svg, left: 0, top: 0 }])
      .jpeg({ quality: 82 })
      .toFile(out);
    console.log("wrote", out, slice.length);
  }
}
