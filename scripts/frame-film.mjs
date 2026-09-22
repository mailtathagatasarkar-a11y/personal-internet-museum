// Sets a screen recording into a window floating on a coloured ground, the
// way a product film is usually presented — and moves the window rather than
// the camera inside it: it sits inset while the whole room is worth seeing,
// then scales up and drifts when one object is, running off three sides of
// the frame and leaving the ground showing on one.
//
//   node scripts/frame-film.mjs <recording.webm> <out.mp4> [--ground ink|orange]
//                               [--trim 1.4] [--dur 32.6] [--still 12.0]
//
// --still writes a single frame instead of the film, for checking a move.
// Frames are streamed between two ffmpeg processes, so nothing but the
// finished film touches the disk.
import { execFileSync, spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const [input, output] = process.argv.slice(2);
if (!input || !output) {
  console.error("usage: node scripts/frame-film.mjs <recording.webm> <out.mp4> [--ground ink|orange] [--trim s] [--dur s] [--still s]");
  process.exit(1);
}
const flag = (name, fallback) => {
  const i = process.argv.indexOf(name);
  return i > -1 ? process.argv[i + 1] : fallback;
};
const num = (name, fallback) => {
  const v = flag(name, null);
  return v === null ? fallback : Number(v);
};
const TRIM = num("--trim", 1.4);
const DUR = num("--dur", 32.6);
const STILL = num("--still", null);
const GROUND = flag("--ground", "ink");
const FPS = 30;

const CACHE = path.resolve(".cache/film");
fs.mkdirSync(CACHE, { recursive: true });

// ── The window, at the size it was recorded, and the ground around it ──────
const probe = JSON.parse(
  execFileSync("ffprobe", ["-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height", "-of", "json", input], {
    encoding: "utf8",
  }),
);
const W = probe.streams[0].width;
const H = probe.streams[0].height;
const even = (n) => Math.round(n / 2) * 2;

/** At rest the window sits inset by this much of the frame, on the long side. */
const INSET = 0.037;
const FRAME_W = even(W / (1 - INSET * 2));
const FRAME_H = even(FRAME_W / 1.5);
const RADIUS = 20;
/** How far the shadow reaches past the window at rest. */
const SPREAD = 150;

// ── The moves ─────────────────────────────────────────────────────────────
// [second, scale, focus x, focus y] — the focus point of the window, in its
// own 0..1 coordinates, is what sits at the centre of the frame. Scale 1 is
// the window at its recorded size, inset in the frame.
const MOVES = [
  [0.0, 1.0, 0.5, 0.5], // arriving: the whole room
  [6.6, 1.0, 0.5, 0.5],
  [7.4, 1.34, 0.4, 0.52], // toward the object being opened
  [10.6, 1.34, 0.46, 0.5],
  [11.4, 1.5, 0.56, 0.48], // the reading column, close
  [14.4, 1.5, 0.52, 0.5],
  [15.2, 1.34, 0.45, 0.5], // travelling to the next object
  [18.4, 1.34, 0.5, 0.5],
  [19.4, 1.0, 0.5, 0.5], // back out: the thread across the whole room
  [32.6, 1.0, 0.5, 0.5],
];

const smooth = (t) => t * t * (3 - 2 * t);
function stateAt(t) {
  if (t <= MOVES[0][0]) return MOVES[0].slice(1);
  for (let i = 1; i < MOVES.length; i++) {
    const [t1, ...b] = MOVES[i];
    const [t0, ...a] = MOVES[i - 1];
    if (t <= t1) {
      const k = smooth((t - t0) / Math.max(t1 - t0, 1e-6));
      return a.map((v, j) => v + (b[j] - v) * k);
    }
  }
  return MOVES[MOVES.length - 1].slice(1);
}

// ── The ground: a gradient, a glow behind the window, and a little grain ──
const GROUNDS = {
  ink: { a: "#4a4038", b: "#282220", c: "#0f0d0d", glow: "#6b5a4a", shadow: "#000000" },
  orange: { a: "#e8764a", b: "#c0491c", c: "#5e2109", glow: "#ff9a6b", shadow: "#2a0d03" },
};
const g = GROUNDS[GROUND] ?? GROUNDS.ink;

const groundSvg = `<svg width="${FRAME_W}" height="${FRAME_H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="lin" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${g.a}"/>
      <stop offset="50%" stop-color="${g.b}"/>
      <stop offset="100%" stop-color="${g.c}"/>
    </linearGradient>
    <radialGradient id="glow" cx="50%" cy="42%" r="62%">
      <stop offset="0%" stop-color="${g.glow}" stop-opacity="0.55"/>
      <stop offset="100%" stop-color="${g.glow}" stop-opacity="0"/>
    </radialGradient>
    <filter id="grain" x="0" y="0" width="100%" height="100%">
      <feTurbulence type="fractalNoise" baseFrequency="0.82" numOctaves="3" stitchTiles="stitch" result="t"/>
      <feColorMatrix in="t" type="saturate" values="0" result="mono"/>
      <feComponentTransfer in="mono"><feFuncA type="linear" slope="0.085"/></feComponentTransfer>
    </filter>
  </defs>
  <rect width="${FRAME_W}" height="${FRAME_H}" fill="url(#lin)"/>
  <rect width="${FRAME_W}" height="${FRAME_H}" fill="url(#glow)"/>
  <rect width="${FRAME_W}" height="${FRAME_H}" filter="url(#grain)"/>
</svg>`;
const ground = await sharp(Buffer.from(groundSvg)).removeAlpha().raw().toBuffer();

/** The shadow, drawn once with room to blur into and resized with the window. */
const shadowSvg = `<svg width="${W + SPREAD * 2}" height="${H + SPREAD * 2}" xmlns="http://www.w3.org/2000/svg">
  <defs><filter id="b" x="-25%" y="-25%" width="150%" height="150%"><feGaussianBlur stdDeviation="42"/></filter></defs>
  <rect x="${SPREAD}" y="${SPREAD + 26}" width="${W}" height="${H}" rx="${RADIUS}" fill="${g.shadow}" opacity="0.55" filter="url(#b)"/>
</svg>`;
const shadowSprite = await sharp(Buffer.from(shadowSvg)).png().toBuffer();

// ── Placing a layer that may hang off the edges of the frame ──────────────
// Layers are raw RGBA: sharp applies a composite last, after any extract, so
// a mask and a crop cannot share one pipeline — the mask would outgrow it.
async function place(buf, w, h, x, y) {
  const left = Math.round(x);
  const top = Math.round(y);
  const cropL = Math.max(0, -left);
  const cropT = Math.max(0, -top);
  const cropW = Math.min(w - cropL, FRAME_W - Math.max(0, left));
  const cropH = Math.min(h - cropT, FRAME_H - Math.max(0, top));
  if (cropW <= 0 || cropH <= 0) return null;
  if (cropL === 0 && cropT === 0 && cropW === w && cropH === h) {
    return { input: buf, raw: { width: w, height: h, channels: 4 }, left, top };
  }
  const cropped = await sharp(buf, { raw: { width: w, height: h, channels: 4 } })
    .extract({ left: cropL, top: cropT, width: cropW, height: cropH })
    .raw()
    .toBuffer();
  return { input: cropped, raw: { width: cropW, height: cropH, channels: 4 }, left: Math.max(0, left), top: Math.max(0, top) };
}

const maskCache = new Map();
function maskFor(w, h) {
  const key = `${w}x${h}`;
  if (!maskCache.has(key)) {
    const r = Math.round(RADIUS * (w / W));
    maskCache.set(
      key,
      Buffer.from(
        `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg"><rect width="${w}" height="${h}" rx="${r}" fill="#fff"/></svg>`,
      ),
    );
  }
  return maskCache.get(key);
}

const shadowCache = new Map();
async function shadowFor(w, h) {
  const key = `${w}x${h}`;
  if (!shadowCache.has(key)) shadowCache.set(key, await sharp(shadowSprite).resize(w, h).ensureAlpha().raw().toBuffer());
  return shadowCache.get(key);
}

/** One finished frame: the ground, the shadow, then the window. */
async function compose(frameRaw, t) {
  const [scale, fx, fy] = stateAt(t);
  const w = even(W * scale);
  const h = even(H * scale);
  const x = FRAME_W / 2 - fx * w;
  const y = FRAME_H / 2 - fy * h;

  const layers = [];
  const sw = Math.round((W + SPREAD * 2) * scale);
  const sh = Math.round((H + SPREAD * 2) * scale);
  const shadow = await place(await shadowFor(sw, sh), sw, sh, x - SPREAD * scale, y - SPREAD * scale);
  if (shadow) layers.push(shadow);

  const win = await sharp(frameRaw, { raw: { width: W, height: H, channels: 3 } })
    .resize(w, h)
    .composite([{ input: maskFor(w, h), blend: "dest-in" }])
    .ensureAlpha()
    .raw()
    .toBuffer();
  const placed = await place(win, w, h, x, y);
  if (placed) layers.push(placed);

  return sharp(ground, { raw: { width: FRAME_W, height: FRAME_H, channels: 3 } }).composite(layers);
}

// ── Trim the recording and fade its content up from paper ─────────────────
const PAPER = "0xE8E3D7";
const content = path.join(CACHE, "content.mp4");
execFileSync(
  "ffmpeg",
  [
    "-hide_banner",
    "-loglevel",
    "error",
    "-ss",
    String(TRIM),
    "-i",
    input,
    "-t",
    String(DUR),
    "-vf",
    `fade=t=in:st=0:d=0.4:color=${PAPER},fade=t=out:st=${(DUR - 0.5).toFixed(2)}:d=0.5:color=${PAPER}`,
    "-r",
    String(FPS),
    "-c:v",
    "libx264",
    "-preset",
    "medium",
    "-crf",
    "16",
    "-pix_fmt",
    "yuv420p",
    "-an",
    content,
    "-y",
  ],
  { stdio: "inherit" },
);

// ── A single frame, for checking a move ───────────────────────────────────
if (STILL !== null) {
  const raw = execFileSync(
    "ffmpeg",
    [
      "-hide_banner",
      "-loglevel",
      "error",
      "-ss",
      String(STILL),
      "-i",
      content,
      "-frames:v",
      "1",
      "-f",
      "rawvideo",
      "-pix_fmt",
      "rgb24",
      "pipe:1",
    ],
    { maxBuffer: 1 << 28 },
  );
  await (await compose(raw, STILL)).png().toFile(output);
  console.log(`${output} — frame at ${STILL}s, ${FRAME_W}x${FRAME_H}, ${GROUND} ground`);
  process.exit(0);
}

// ── The film: decode → compose → encode, all through pipes ────────────────
const FRAME_BYTES = W * H * 3;
const decoder = spawn("ffmpeg", ["-hide_banner", "-loglevel", "error", "-i", content, "-f", "rawvideo", "-pix_fmt", "rgb24", "pipe:1"], {
  stdio: ["ignore", "pipe", "inherit"],
});
const encoder = spawn(
  "ffmpeg",
  [
    "-hide_banner",
    "-loglevel",
    "error",
    "-f",
    "image2pipe",
    "-c:v",
    "png",
    "-framerate",
    String(FPS),
    "-i",
    "pipe:0",
    "-r",
    String(FPS),
    "-c:v",
    "libx264",
    "-preset",
    "slow",
    "-crf",
    "20",
    "-pix_fmt",
    "yuv420p",
    "-movflags",
    "+faststart",
    "-an",
    output,
    "-y",
  ],
  { stdio: ["pipe", "inherit", "inherit"] },
);

const write = (buf) => new Promise((resolve) => (encoder.stdin.write(buf) ? resolve() : encoder.stdin.once("drain", resolve)));

let pending = Buffer.alloc(0);
let n = 0;
for await (const chunk of decoder.stdout) {
  pending = pending.length ? Buffer.concat([pending, chunk]) : chunk;
  while (pending.length >= FRAME_BYTES) {
    const raw = pending.subarray(0, FRAME_BYTES);
    pending = pending.subarray(FRAME_BYTES);
    await write(await (await compose(raw, n / FPS)).png({ compressionLevel: 1 }).toBuffer());
    n++;
    if (n % 120 === 0) process.stdout.write(`\r  ${n} frames`);
  }
}
encoder.stdin.end();
await new Promise((resolve, reject) => encoder.on("close", (code) => (code ? reject(new Error(`encoder exited ${code}`)) : resolve())));
console.log(`\r${output} — ${FRAME_W}x${FRAME_H}, ${GROUND} ground, ${n} frames, window ${W}x${H}`);
