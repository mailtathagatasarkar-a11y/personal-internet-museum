import images from "./images.json";
import { CELLS, GRID, HEADLINE, TERRITORY_LABELS } from "./layout";
import { OBJECTS, objectById, type MuseumObject } from "./objects";
import { TERRITORIES, territoryById, type TerritoryId } from "./territories";
import { THREADS, threadById, threadsFor } from "./threads";

interface ImageEntry {
  src: string;
  thumb: string;
  width: number;
  height: number;
  license: string;
  artist: string;
  page: string;
}

const IMAGES = images as Record<string, ImageEntry>;

/** Half a cell of empty grid around everything, like the poster's margin. */
export const MARGIN = GRID.cell * 0.5;
export const WORLD = { width: GRID.cell * GRID.cols + MARGIN * 2, height: GRID.cell * GRID.rows + MARGIN * 2 } as const;
/** Cell coordinates → world units. */
export const cellX = (col: number) => MARGIN + col * GRID.cell;
export const cellY = (row: number) => MARGIN + row * GRID.cell;

/** An object with everything the museum needs to place and draw it. */
export interface PlacedObject extends MuseumObject {
  /** Accession number, 1-based, in collection order. */
  index: number;
  /** Centre and box, in world units, from the object's cells. */
  x: number;
  y: number;
  w: number;
  h: number;
  left: number;
  top: number;
  /** Cut-outs stay whole inside their cells; photographs fill them. */
  fit: "cover" | "contain";
  image: ImageEntry;
}

export const PLACED: PlacedObject[] = OBJECTS.map((o, i) => {
  const image = IMAGES[o.id];
  if (!image) throw new Error(`No image for ${o.id}`);
  const cell = CELLS[o.id];
  if (!cell) throw new Error(`No cells for ${o.id}`);
  const [col, row, cols, rows, fit = "cover"] = cell;
  const w = cols * GRID.cell;
  const h = rows * GRID.cell;
  const left = cellX(col);
  const top = cellY(row);
  return { ...o, index: i + 1, x: left + w / 2, y: top + h / 2, w, h, left, top, fit, image };
});

export const placedById: Record<string, PlacedObject> = Object.fromEntries(PLACED.map((o) => [o.id, o]));

export const COUNT_BY_TERRITORY = TERRITORIES.reduce(
  (acc, t) => ({ ...acc, [t.id]: PLACED.filter((o) => o.territory === t.id).length }),
  {} as Record<TerritoryId, number>,
);

/** Where a territory is: the centroid of its objects, plus where its name is set. */
export const TERRITORY_PLACES = TERRITORIES.map((t) => {
  const members = PLACED.filter((o) => o.territory === t.id);
  const cx = members.reduce((a, o) => a + o.x, 0) / members.length;
  const cy = members.reduce((a, o) => a + o.y, 0) / members.length;
  const label = TERRITORY_LABELS[t.id];
  return { ...t, center: { x: cx, y: cy }, label: { x: cellX(label.col), y: cellY(label.row), w: label.cols * GRID.cell } };
});

export const territoryPlaceById = Object.fromEntries(TERRITORY_PLACES.map((t) => [t.id, t])) as Record<
  TerritoryId,
  (typeof TERRITORY_PLACES)[number]
>;

/** Museum-wide numbers shown on the masthead. The collection is larger than what is on view. */
export const COLLECTION = {
  owner: "Tathagata",
  subtitle: "A personal internet museum",
  headline: HEADLINE,
  /** What is actually here. The brief imagines 184; the collection grows toward it. */
  total: PLACED.length,
  onView: PLACED.length,
  since: 2026,
} as const;

export function accession(n: number): string {
  return `№ ${String(n).padStart(3, "0")}`;
}

export { OBJECTS, objectById, TERRITORIES, territoryById, THREADS, threadById, threadsFor, GRID, HEADLINE };
