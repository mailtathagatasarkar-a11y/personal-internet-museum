import type { RoomLayout } from "../layout";

// Room 03 — Tools. Composed by scripts/compose-room.mjs (seed 5); see the rules in layout.ts.
export const TOOLS_ROOM: RoomLayout = {
  id: "tools",
  name: "Tools",
  line: "Made to be used. Worn by use. Better for it. Still here.",
  headline: [
    { lines: ["Made", "to be used."], col: 0, row: 0, cols: 5, rows: 2 },
    { lines: ["Worn", "by use."], col: 12, row: 5, cols: 4, rows: 2 },
    { lines: ["Better", "for it."], col: 2, row: 11, cols: 4, rows: 2 },
    { lines: ["Still", "here."], col: 20, row: 16, cols: 4, rows: 2 },
  ],
  labels: {
    objects: { col: 0, row: 2, cols: 3 },
    technology: { col: 12, row: 0, cols: 4 },
    typography: { col: 18, row: 0, cols: 4 },
    design: { col: 0, row: 7, cols: 3 },
    music: { col: 11, row: 7, cols: 3 },
    photography: { col: 18, row: 6, cols: 4 },
    oddities: { col: 0, row: 13, cols: 4 },
    film: { col: 8, row: 13, cols: 2 },
    architecture: { col: 16, row: 12, cols: 4 },
  },
  cells: {
    // ── design (cols 0–9, rows 7–12) ──
    "bic-cristal": [6, 10, 2, 2],
    "fiskars-scissors": [0, 9, 3, 2],
    "polaroid-sx70": [8, 8, 2, 2],
    "kikkoman-bottle": [4, 8, 1, 1],
    chemex: [9, 12, 1, 1],
    "g-shock-dw5600": [1, 12, 1, 1],
    "citroen-2cv": [6, 8, 1, 1],
    vespa: [4, 10, 1, 1, "contain"],
    brompton: [5, 9, 1, 1],
    // ── objects (cols 0–10, rows 0–6) ──
    "opinel-no8": [1, 5, 3, 2, "contain"],
    "swiss-army-knife": [8, 1, 3, 2],
    "leatherman-pst": [5, 5, 3, 2],
    zippo: [5, 1, 1, 1],
    "stanley-knife": [9, 5, 2, 2],
    maglite: [5, 3, 1, 1],
    nalgene: [0, 4, 1, 1],
    "duct-tape": [8, 4, 1, 1],
    "post-it": [7, 0, 1, 1],
    "paper-clip": [2, 3, 2, 1],
    "land-rover-series-1": [7, 3, 1, 1],
    // ── technology (cols 12–16, rows 0–6) ──
    "ibm-selectric": [14, 2, 3, 2],
    "hp-35": [16, 6, 1, 1],
    "model-m": [12, 3, 1, 1, "contain"],
    "palm-pilot": [13, 1, 1, 1],
    "slide-rule": [16, 0, 1, 1],
    // ── photography (cols 18–25, rows 6–11) ──
    "hasselblad-500c": [18, 8, 2, 2],
    "nikon-f": [24, 6, 2, 2],
    rolleiflex: [25, 11, 1, 1],
    "tri-x": [21, 11, 2, 1],
    // ── music (cols 11–16, rows 7–12) ──
    stratocaster: [13, 10, 2, 3],
    "shure-sm58": [15, 8, 2, 1],
    "akai-mpc60": [11, 9, 1, 1],
    "yamaha-dx7": [16, 11, 1, 1],
    "koss-porta-pro": [12, 8, 2, 1],
    // ── film (cols 8–14, rows 13–17) ──
    "bolex-h16": [11, 16, 2, 2],
    "arriflex-35": [8, 15, 2, 2],
    steadicam: [14, 14, 1, 1],
    clapperboard: [11, 13, 2, 1],
    // ── typography (cols 18–25, rows 0–5) ──
    linotype: [22, 3, 3, 2],
    "composing-stick": [18, 3, 2, 2],
    letraset: [25, 0, 1, 1],
    "type-case": [20, 5, 2, 1],
    // ── architecture (cols 16–25, rows 12–17) ──
    "shipping-container": [23, 12, 2, 2],
    "quonset-hut": [16, 16, 2, 2],
    airstream: [25, 17, 1, 1],
    // ── oddities (cols 0–6, rows 13–17) ──
    "rubiks-cube": [0, 15, 2, 2],
    pallet: [4, 15, 3, 2],
    "traffic-cone": [3, 17, 1, 1],
    "cable-tie": [4, 13, 2, 1],
  },
};
