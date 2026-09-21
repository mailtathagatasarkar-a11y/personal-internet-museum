// Turns the raw Commons downloads into the two sizes the museum serves:
//   public/objects/<id>.(jpg|png)   full image, longest edge <= 1400
//   public/objects/t/<id>.(jpg|png) thumbnail, longest edge <= 480 (far/medium zoom)
// PNG is kept only where the source has real transparency (cut-out product shots).
// Raw downloads are moved to .cache/raw/ so they stay out of the served folder.
// Usage: node scripts/process-images.mjs
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const OBJ = path.resolve("public/objects");
const THUMB = path.join(OBJ, "t");
const RAW = path.resolve(".cache/raw");
const MANIFEST = path.resolve("src/data/images.json");
fs.mkdirSync(THUMB, { recursive: true });
fs.mkdirSync(RAW, { recursive: true });

const manifest = JSON.parse(fs.readFileSync(MANIFEST, "utf8"));

// Move any raw download still sitting in public/objects into the cache.
for (const f of fs.readdirSync(OBJ)) {
  const p = path.join(OBJ, f);
  if (fs.statSync(p).isDirectory()) continue;
  const id = f.replace(/\.(jpg|png)$/, "");
  if (manifest[id] && !manifest[id].processed) fs.renameSync(p, path.join(RAW, f));
}

async function hasRealAlpha(file) {
  const meta = await sharp(file).metadata();
  if (!meta.hasAlpha) return false;
  const { data } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  let transparent = 0;
  for (let i = 3; i < data.length; i += 4) if (data[i] < 250) transparent++;
  return transparent / (data.length / 4) > 0.01;
}

for (const [id, entry] of Object.entries(manifest)) {
  const raw = ["jpg", "png"].map((e) => path.join(RAW, `${id}.${e}`)).find((p) => fs.existsSync(p));
  if (!raw) { console.log("no raw for", id); continue; }
  // Cut-outs are flattened onto the paper colour: the museum floor is a flat
  // tone, so a JPEG on paper reads exactly like a transparent PNG at a
  // fraction of the weight.
  const alpha = false; void hasRealAlpha;
  const ext = alpha ? "png" : "jpg";
  const full = path.join(OBJ, `${id}.${ext}`);
  const thumb = path.join(THUMB, `${id}.${ext}`);

  let pipeline = sharp(raw).rotate().resize({ width: 1400, height: 1400, fit: "inside", withoutEnlargement: true });
  pipeline = alpha ? pipeline.png({ compressionLevel: 9, palette: false }) : pipeline.flatten({ background: "#f2eee6" }).jpeg({ quality: 82, mozjpeg: true });
  const info = await pipeline.toFile(full);

  let tp = sharp(raw).rotate().resize({ width: 480, height: 480, fit: "inside", withoutEnlargement: true });
  tp = alpha ? tp.png({ compressionLevel: 9 }) : tp.flatten({ background: "#f2eee6" }).jpeg({ quality: 72, mozjpeg: true });
  await tp.toFile(thumb);

  manifest[id] = {
    ...entry,
    src: `/objects/${id}.${ext}`,
    thumb: `/objects/t/${id}.${ext}`,
    width: info.width,
    height: info.height,
    processed: true,
  };
  console.log("ok", id.padEnd(22), `${info.width}x${info.height}`, ext, (fs.statSync(full).size / 1024).toFixed(0) + "kb");
}
fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2));
console.log("done");
