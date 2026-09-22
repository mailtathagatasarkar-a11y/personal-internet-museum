import type { RoomLayout } from "../layout";

// Room 04 — Systems. Composed by scripts/compose-room.mjs (seed 3); see the rules in layout.ts.
export const SYSTEMS_ROOM: RoomLayout = {
  id: "systems",
  name: "Systems",
  line: "Not pictures. Instructions. Maps of how things fit. Read the key, go anywhere.",
  headline: [
    { lines: ["Not", "pictures."], col: 0, row: 0, cols: 4, rows: 2 },
    { lines: ["Instructions", "for looking."], col: 12, row: 5, cols: 6, rows: 2 },
    { lines: ["Maps of how", "things fit."], col: 1, row: 12, cols: 5, rows: 2 },
    { lines: ["Read the key.", "Go anywhere."], col: 18, row: 15, cols: 6, rows: 2 },
  ],
  labels: {
    oddities: { col: 0, row: 2, cols: 4 },
    design: { col: 11, row: 0, cols: 3 },
    typography: { col: 20, row: 0, cols: 4 },
    technology: { col: 0, row: 7, cols: 4 },
    architecture: { col: 11, row: 8, cols: 4 },
    music: { col: 19, row: 7, cols: 3 },
    film: { col: 0, row: 15, cols: 2 },
    photography: { col: 10, row: 15, cols: 4 },
  },
  cells: {
    // ── design (cols 11–18, rows 0–7) ──
    "booth-poverty-map": [17, 0, 2, 2],
    "iso-216": [11, 2, 2, 3, "contain"],
    munsell: [15, 3, 2, 2, "contain"],
    "sbb-clock": [18, 7, 1, 1],
    "goethe-colour-wheel": [11, 6, 1, 2],
    "van-de-graaf-canon": [14, 7, 1, 1, "contain"],
    "exit-sign": [15, 0, 1, 1, "contain"],
    "signal-flags": [13, 1, 2, 1],
    "aiga-symbols": [18, 3, 1, 1, "contain"],
    // ── typography (cols 20–25, rows 0–6) ──
    braille: [22, 5, 2, 2, "contain"],
    "morse-code": [22, 2, 3, 2, "contain"],
    "din-1451": [24, 0, 2, 1, "contain"],
    hangul: [20, 4, 2, 1],
    "rosetta-stone": [25, 6, 1, 1],
    "transport-typeface": [25, 4, 1, 1],
    // ── technology (cols 0–9, rows 7–14) ──
    qwerty: [0, 9, 3, 2, "contain"],
    "ascii-table": [7, 13, 3, 2, "contain"],
    "upc-barcode": [7, 7, 2, 2, "contain"],
    "qr-code": [2, 14, 2, 1, "contain"],
    "punch-card": [4, 10, 2, 1],
    "von-neumann": [9, 10, 1, 1, "contain"],
    "arpanet-map": [6, 11, 2, 1, "contain"],
    antikythera: [3, 8, 2, 1],
    "chappe-telegraph": [0, 12, 1, 1],
    // ── oddities (cols 0–9, rows 0–6) ──
    minard: [7, 1, 3, 2, "contain"],
    "snow-cholera-map": [0, 4, 2, 2],
    "nightingale-rose": [4, 5, 3, 2],
    "mendeleev-table": [9, 6, 1, 1],
    "feynman-diagram": [4, 0, 2, 2, "contain"],
    "pioneer-plaque": [5, 3, 1, 1],
    "arecibo-message": [8, 4, 1, 2, "contain"],
    voynich: [2, 6, 1, 1],
    "snellen-chart": [3, 4, 1, 1, "contain"],
    "metre-bar": [2, 3, 1, 1],
    // ── architecture (cols 11–17, rows 8–13) ──
    "nolli-map": [11, 11, 2, 2],
    "vitruvian-man": [16, 9, 2, 3],
    "villa-rotonda-plan": [17, 13, 1, 1],
    "manhattan-grid": [14, 12, 2, 1],
    "cerda-barcelona": [13, 9, 2, 1],
    // ── music (cols 19–25, rows 7–12) ──
    "circle-of-fifths": [23, 11, 2, 2, "contain"],
    "guidonian-hand": [19, 9, 2, 2],
    metronome: [24, 7, 1, 1],
    "tuning-fork": [22, 9, 2, 1],
    // ── film (cols 0–8, rows 15–17) ──
    "smpte-bars": [3, 16, 2, 2, "contain"],
    zoetrope: [6, 16, 3, 2],
    // ── photography (cols 10–15, rows 15–17) ──
    "cyanotype-atkins": [11, 16, 2, 2],
    "grey-card": [14, 17, 2, 1, "contain"],
  },
};
