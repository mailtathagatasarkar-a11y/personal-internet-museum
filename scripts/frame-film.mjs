// Sets a screen recording into a floating window on a coloured ground, the
// way a product film is usually presented: rounded corners, a soft shadow,
// and the museum's one colour behind it.
//
//   node scripts/frame-film.mjs <recording.webm> <out.mp4> [--trim 1.4] [--dur 32.6]
//
// Writes the ground and the corner mask to .cache/, then composites with
// ffmpeg. The window is drawn at the recording's own pixel size, so nothing
// is scaled and the small type stays as crisp as it was on screen.
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const [input, output] = process.argv.slice(2);
if (!input || !output) {
  console.error("usage: node scripts/frame-film.mjs <recording.webm> <out.mp4> [--trim s] [--dur s]");
  process.exit(1);
}
const arg = (name, fallback) => {
  const i = process.argv.indexOf(name);
  return i > -1 ? Number(process.argv[i + 1]) : fallback;
};
const TRIM = arg("--trim", 1.4);
const DUR = arg("--dur", 32.6);
const groundName = process.argv.includes("--ground") ? process.argv[process.argv.indexOf("--ground") + 1] : "ink";

const CACHE = path.resolve(".cache/film");
fs.mkdirSync(CACHE, { recursive: true });

// The window, at the size it was recorded.
const probe = JSON.parse(
  execFileSync("ffprobe", ["-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height", "-of", "json", input], {
    encoding: "utf8",
  }),
);
const W = probe.streams[0].width;
const H = probe.streams[0].height;

// The ground: 3:2, the proportions a product film usually sits in.
const PAD_X = Math.round(W * 0.079);
const FRAME_W = W + PAD_X * 2;
const FRAME_H = Math.round(FRAME_W / 1.5 / 2) * 2;
const X = PAD_X;
const Y = Math.round((FRAME_H - H) / 2 / 2) * 2;
const RADIUS = 18;

/** Grounds to float the window on. `ink` lets the paper glow; `orange` is the museum's one colour, loud. */
const GROUNDS = {
  ink: { stops: ["#3a322b", "#231e19", "#121010"], shadow: "#000000" },
  orange: { stops: ["#e06a3c", "#c04a1d", "#6f2810"], shadow: "#2a0d03" },
};
const { stops, shadow } = GROUNDS[groundName] ?? GROUNDS.ink;

const ground = `<svg width="${FRAME_W}" height="${FRAME_H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="g" cx="50%" cy="39%" r="81%">
      <stop offset="0%" stop-color="${stops[0]}"/>
      <stop offset="53%" stop-color="${stops[1]}"/>
      <stop offset="100%" stop-color="${stops[2]}"/>
    </radialGradient>
    <filter id="sh" x="-40%" y="-40%" width="180%" height="180%">
      <feGaussianBlur stdDeviation="38"/>
    </filter>
  </defs>
  <rect width="${FRAME_W}" height="${FRAME_H}" fill="url(#g)"/>
  <rect x="${X}" y="${Y + 18}" width="${W}" height="${H}" rx="${RADIUS}" fill="${shadow}" opacity="0.5" filter="url(#sh)"/>
</svg>`;

const mask = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${W}" height="${H}" rx="${RADIUS}" fill="#fff"/>
</svg>`;

const groundPath = path.join(CACHE, "ground.png");
const maskPath = path.join(CACHE, "mask.png");
await sharp(Buffer.from(ground)).png().toFile(groundPath);
await sharp(Buffer.from(mask)).flatten({ background: "#000" }).png().toFile(maskPath);

// Pass one: trim the recording and fade its content up from paper and back.
const PAPER = "0xE8E3D7";
const content = path.join(CACHE, "content.mp4");
execFileSync(
  "ffmpeg",
  [
    "-hide_banner", "-loglevel", "error",
    "-ss", String(TRIM), "-i", input, "-t", String(DUR),
    "-vf", `fade=t=in:st=0:d=0.4:color=${PAPER},fade=t=out:st=${(DUR - 0.5).toFixed(2)}:d=0.5:color=${PAPER}`,
    "-r", "30", "-c:v", "libx264", "-preset", "medium", "-crf", "16", "-pix_fmt", "yuv420p", "-an",
    content, "-y",
  ],
  { stdio: "inherit" },
);

// Pass two: round the window's corners and set it on the ground.
execFileSync(
  "ffmpeg",
  [
    "-hide_banner", "-loglevel", "error",
    "-loop", "1", "-i", groundPath,
    "-i", content,
    "-i", maskPath,
    "-filter_complex",
    "[2:v]format=gray[m];[1:v]format=yuva420p[v];[v][m]alphamerge[w];[0:v][w]overlay=" + X + ":" + Y + ":shortest=1[o]",
    "-map", "[o]",
    "-r", "30", "-c:v", "libx264", "-preset", "slow", "-crf", "20", "-pix_fmt", "yuv420p",
    "-movflags", "+faststart", "-an",
    output, "-y",
  ],
  { stdio: "inherit" },
);

console.log(`${output} — ${FRAME_W}x${FRAME_H}, ${groundName} ground, window ${W}x${H} at ${X},${Y}`);
