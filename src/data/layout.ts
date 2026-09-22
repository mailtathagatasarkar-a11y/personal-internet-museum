import type { TerritoryId } from "./territories";
import { COLLECTION_ROOM } from "./rooms/collection";
import { FIRSTS_ROOM } from "./rooms/firsts";
import { TOOLS_ROOM } from "./rooms/tools";
import { SYSTEMS_ROOM } from "./rooms/systems";

// The museum is a hall of rooms. Each room is a poster set on the same grid:
// everything — objects, the headline, the territory names — sits in cells.
// Coordinates are cells within the room; the museum converts them to world
// units and places the rooms side by side.
//
// The composition rules, so each room stays a poster and not a pile:
//   · an image never shares an edge with another image (corners may touch)
//   · text blocks own whole cells; images may sit against text
//   · roughly half the cells stay empty

export const GRID = { cell: 370, cols: 26, rows: 18 } as const;

/** [col, row, cols, rows, fit]. `contain` keeps cut-outs whole; photographs are cropped to their cells. */
export type Cell = [col: number, row: number, cols: number, rows: number, fit?: "cover" | "contain"];

/** A block of text set into the grid: the headline in fragments, and the territory names. */
export interface TextBlock {
  lines: string[];
  col: number;
  row: number;
  cols: number;
  rows: number;
}

export interface RoomLayout {
  id: string;
  /** "The Collection" — how the room is named on the dots and in the index. */
  name: string;
  /** The room's line, whole, for the index and the dots. */
  line: string;
  /** The line in fragments that zigzag down the floor. */
  headline: TextBlock[];
  /** Where each territory's name sits in this room: one row, a few cells wide. */
  labels: Partial<Record<TerritoryId, { col: number; row: number; cols: number }>>;
  cells: Record<string, Cell>;
}

/** The rooms, in the order of the hall. */
export const ROOMS: RoomLayout[] = [COLLECTION_ROOM, FIRSTS_ROOM, TOOLS_ROOM, SYSTEMS_ROOM];
