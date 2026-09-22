import type { RoomLayout } from "../layout";

// Room 02 — Firsts. Composed by scripts/compose-room.mjs (seed 11); see the rules in layout.ts.
export const FIRSTS_ROOM: RoomLayout = {
  id: "firsts",
  name: "Firsts",
  line: "Nothing here was asked for. It was new before it was good.",
  headline: [
    { lines: ["Nothing", "here"], col: 0, row: 0, cols: 4, rows: 2 },
    { lines: ["was asked", "for."], col: 12, row: 5, cols: 5, rows: 2 },
    { lines: ["It was", "new"], col: 1, row: 11, cols: 4, rows: 2 },
    { lines: ["before it", "was good."], col: 19, row: 16, cols: 5, rows: 2 },
  ],
  labels: {
    technology: { col: 0, row: 2, cols: 4 },
    photography: { col: 11, row: 0, cols: 4 },
    typography: { col: 20, row: 0, cols: 4 },
    architecture: { col: 19, row: 4, cols: 4 },
    objects: { col: 0, row: 7, cols: 3 },
    design: { col: 9, row: 7, cols: 3 },
    oddities: { col: 0, row: 13, cols: 4 },
    music: { col: 10, row: 13, cols: 3 },
    film: { col: 18, row: 11, cols: 2 },
  },
  cells: {
    // ── photography (cols 11–18, rows 0–6) ──
    "niepce-le-gras": [14, 3, 3, 2],
    "boulevard-du-temple": [16, 0, 3, 2],
    "cornelius-self-portrait": [11, 3, 2, 2],
    "tartan-ribbon": [18, 6, 1, 1],
    "rontgen-hand": [18, 3, 1, 2],
    earthrise: [13, 2, 1, 1],
    "first-flight": [11, 1, 2, 1],
    // ── film (cols 18–25, rows 11–17) ──
    "roundhay-garden": [20, 13, 2, 2, "contain"],
    kinetoscope: [24, 15, 2, 3],
    "arrival-of-a-train": [25, 12, 1, 1, "contain"],
    "great-train-robbery": [18, 17, 1, 1],
    // ── typography (cols 20–25, rows 0–3) ──
    "gutenberg-bible": [21, 2, 3, 2],
    "times-new-roman": [25, 1, 1, 2],
    // ── technology (cols 0–9, rows 0–6) ──
    "jacquard-loom": [1, 4, 3, 2],
    "difference-engine": [7, 0, 3, 2],
    eniac: [7, 5, 2, 2],
    transistor: [4, 0, 1, 1],
    "intel-4004": [6, 3, 2, 1],
    "engelbart-mouse": [5, 6, 1, 1, "contain"],
    "altair-8800": [9, 3, 1, 1],
    "ibm-simon": [5, 1, 1, 2, "contain"],
    "apollo-guidance-computer": [5, 4, 1, 1],
    // ── design (cols 9–15, rows 7–12) ──
    "thonet-14": [14, 7, 2, 3],
    "red-blue-chair": [9, 10, 2, 3],
    "regency-tr1": [14, 12, 1, 1],
    "sholes-glidden": [12, 9, 1, 1],
    smiley: [9, 8, 1, 1, "contain"],
    // ── objects (cols 0–7, rows 7–12) ──
    "benz-motorwagen": [4, 8, 3, 2],
    "model-t": [0, 9, 2, 2],
    "kodak-brownie": [5, 11, 3, 2],
    "ur-leica": [0, 12, 1, 1],
    "edison-bulb": [3, 10, 1, 1],
    "rover-safety-bicycle": [2, 8, 1, 1],
    // ── architecture (cols 19–25, rows 4–10) ──
    "crystal-palace": [19, 9, 3, 2],
    "home-insurance-building": [24, 5, 2, 2],
    "eiffel-construction": [25, 10, 1, 1],
    "fagus-factory": [20, 6, 2, 1],
    // ── music (cols 10–16, rows 13–17) ──
    phonograph: [14, 14, 3, 2],
    theremin: [10, 15, 3, 2],
    "moog-modular": [14, 17, 1, 1],
    telecaster: [16, 17, 1, 1],
    "fairlight-cmi": [13, 13, 1, 1],
    // ── oddities (cols 0–8, rows 13–17) ──
    "tennis-for-two": [6, 14, 2, 2],
    spacewar: [0, 16, 3, 2],
    pong: [4, 16, 2, 2, "contain"],
    "trojan-room-coffee-pot": [8, 17, 1, 1, "contain"],
    "first-computer-bug": [2, 14, 1, 1],
    sputnik: [8, 13, 1, 1],
  },
};
