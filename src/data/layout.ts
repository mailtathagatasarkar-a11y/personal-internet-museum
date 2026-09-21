import type { TerritoryId } from "./territories";

// The floor is a grid. Everything — objects, the headline, the territory
// names — sits in cells, the way a poster is set. Coordinates are cells;
// the museum converts them to world units.
//
// The composition rules, so it stays a poster and not a pile:
//   · an image never shares an edge with another image (corners may touch)
//   · text blocks own whole cells; images may sit against text
//   · roughly half the cells stay empty

export const GRID = { cell: 370, cols: 26, rows: 18 } as const;

/** [col, row, cols, rows, fit]. `contain` keeps cut-outs whole; photographs are cropped to their cells. */
export type Cell = [col: number, row: number, cols: number, rows: number, fit?: "cover" | "contain"];

export const CELLS: Record<string, Cell> = {
  // ── Design (cols 0–7, rows 2–7) ───────────────────────────────────────
  "lettera-22": [3, 2, 1, 1],
  "braun-sk4": [5, 2, 2, 1],
  "braun-t3": [2, 4, 3, 2],
  "braun-et66": [7, 4, 1, 2],
  "vitsoe-606": [0, 6, 2, 2],
  "olivetti-valentine": [5, 6, 2, 2, "contain"],
  "tizio": [3, 7, 1, 1, "contain"],
  // ── Typography (cols 9–14, rows 0–5) ──────────────────────────────────
  "helvetica": [10, 1, 2, 2],
  "futura": [13, 1, 2, 1],
  "johnston": [9, 3, 1, 1],
  "trajan": [13, 3, 1, 2],
  // ── Architecture (cols 16–25, rows 0–6) ───────────────────────────────
  "barcelona-pavilion": [16, 1, 3, 2],
  "farnsworth": [23, 1, 2, 1],
  "chandigarh": [20, 2, 2, 2],
  "barbican": [25, 2, 1, 2],
  "nakagin": [19, 4, 1, 2],
  "iim-ahmedabad": [22, 4, 2, 1],
  "casa-malaparte": [24, 5, 1, 2],
  // ── Objects (cols 0–8, rows 8–13) ─────────────────────────────────────
  "anglepoise": [7, 8, 1, 1, "contain"],
  "eames-lounge": [0, 9, 3, 2],
  "barcelona-chair": [5, 9, 2, 2],
  "wassily": [0, 12, 2, 2],
  "lamy-2000": [7, 12, 2, 1],
  "leica-m3": [4, 13, 1, 1],
  "moka": [6, 13, 1, 1, "contain"],
  // ── Internet oddities (cols 0–8, rows 14–17) ──────────────────────────
  "lego-patent": [5, 14, 1, 2],
  "casio-f91w": [7, 14, 1, 1, "contain"],
  "utah-teapot": [1, 15, 2, 2, "contain"],
  "golden-record": [7, 16, 2, 2],
  "comic-sans": [0, 17, 1, 1],
  "stanford-bunny": [3, 17, 3, 1],
  // ── Technology (cols 9–16, rows 7–12) ─────────────────────────────────
  "imac-g3": [15, 7, 2, 2, "contain"],
  "xerox-alto": [9, 8, 2, 3],
  "ipod": [12, 8, 2, 3, "contain"],
  "macintosh": [15, 10, 2, 2],
  "nokia-3310": [11, 11, 1, 1, "contain"],
  "game-boy": [10, 12, 1, 1, "contain"],
  "thinkpad": [12, 12, 2, 1],
  "next-cern": [16, 13, 2, 1],
  // ── Photography (cols 17–25, rows 7–11) ───────────────────────────────
  "muybridge": [18, 8, 3, 2],
  "migrant-mother": [22, 8, 2, 3],
  "atget": [25, 8, 1, 2],
  "blossfeldt": [18, 11, 2, 1],
  "pale-blue-dot": [25, 11, 1, 1],
  // ── Music (cols 9–15, rows 13–17) ─────────────────────────────────────
  "op-1": [9, 14, 2, 2],
  "tr-808": [12, 14, 3, 2],
  "walkman": [15, 16, 1, 2],
  "sl-1200": [12, 17, 2, 1],
  // ── Film (cols 17–25, rows 12–17) ─────────────────────────────────────
  "metropolis": [19, 13, 3, 2],
  "pather-panchali": [23, 13, 2, 2],
  "cinematographe": [17, 15, 1, 2],
  "man-with-movie-camera": [18, 17, 1, 1],
  "trip-to-the-moon": [24, 16, 2, 2],
};

/** A block of text set into the grid: the headline in fragments, and the territory names. */
export interface TextBlock {
  lines: string[];
  col: number;
  row: number;
  cols: number;
  rows: number;
}

/** The museum's opening line, in four fragments that zigzag down the floor. */
export const HEADLINE: TextBlock[] = [
  { lines: ["Everything", "I saved"], col: 0, row: 0, cols: 5, rows: 2 },
  { lines: ["from the", "internet."], col: 14, row: 5, cols: 5, rows: 2 },
  { lines: ["None of it", "is mine."], col: 2, row: 11, cols: 5, rows: 2 },
  { lines: ["All of it", "is me."], col: 19, row: 16, cols: 5, rows: 2 },
];

/** Where each territory's name sits: one row, a few cells wide. */
export const TERRITORY_LABELS: Record<TerritoryId, { col: number; row: number; cols: number }> = {
  design: { col: 0, row: 3, cols: 3 },
  typography: { col: 9, row: 0, cols: 4 },
  architecture: { col: 19, row: 0, cols: 4 },
  objects: { col: 0, row: 8, cols: 3 },
  technology: { col: 9, row: 7, cols: 4 },
  photography: { col: 17, row: 7, cols: 4 },
  oddities: { col: 0, row: 14, cols: 4 },
  music: { col: 9, row: 13, cols: 3 },
  film: { col: 17, row: 12, cols: 2 },
};
