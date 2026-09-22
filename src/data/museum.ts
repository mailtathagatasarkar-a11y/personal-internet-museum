import images from "./images.json";
import { GRID, ROOMS, type RoomLayout } from "./layout";
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

/** Half a cell of empty grid around each room, like the poster's margin. */
export const MARGIN = GRID.cell * 0.5;
/** One room: one poster. Every room is the same size, so the floor is the same floor everywhere. */
export const ROOM_SIZE = { w: GRID.cell * GRID.cols + MARGIN * 2, h: GRID.cell * GRID.rows + MARGIN * 2 } as const;
/** Paper between rooms. At the floor the next room's edge shows at the side of the frame. */
export const GUTTER = GRID.cell * 2;

/** A room placed in the hall. */
export interface RoomPlace extends RoomLayout {
  /** 0-based position in the hall. */
  index: number;
  /** "02" */
  number: string;
  left: number;
  top: number;
  w: number;
  h: number;
  center: { x: number; y: number };
}

export const ROOM_PLACES: RoomPlace[] = ROOMS.map((r, i) => {
  const left = i * (ROOM_SIZE.w + GUTTER);
  return {
    ...r,
    index: i,
    number: String(i + 1).padStart(2, "0"),
    left,
    top: 0,
    w: ROOM_SIZE.w,
    h: ROOM_SIZE.h,
    center: { x: left + ROOM_SIZE.w / 2, y: ROOM_SIZE.h / 2 },
  };
});
export const roomById = Object.fromEntries(ROOM_PLACES.map((r) => [r.id, r])) as Record<string, RoomPlace>;

/** One step along the hall: a room and the paper after it. */
export const STRIDE = ROOM_SIZE.w + GUTTER;
/**
 * The hall is a ring. Going past the last room arrives at the first, so the
 * museum has no ends: this is the distance after which it repeats.
 */
export const HALL = STRIDE * ROOMS.length;

/** The hall: rooms side by side. */
export const WORLD = {
  width: ROOMS.length * ROOM_SIZE.w + (ROOMS.length - 1) * GUTTER,
  height: ROOM_SIZE.h,
} as const;

/**
 * A slot is a place in the hall, which may be one turn of the ring away from
 * the room that stands there: slot −1 is the last room, slot `rooms` the first.
 */
export const slotRoom = (slot: number) => ((slot % ROOMS.length) + ROOMS.length) % ROOMS.length;
export const slotLeft = (slot: number) => slot * STRIDE;
export const slotCenter = (slot: number) => ({ x: slot * STRIDE + ROOM_SIZE.w / 2, y: ROOM_SIZE.h / 2 });
/** How far the camera may travel: the hall, plus the room it wraps around to at either end. */
export const TRAVEL = { origin: { x: -STRIDE, y: 0 }, size: { w: HALL + STRIDE + ROOM_SIZE.w, h: ROOM_SIZE.h } } as const;

/** Cell coordinates → world units, within a room. */
export const cellX = (col: number, room = 0) => ROOM_PLACES[room].left + MARGIN + col * GRID.cell;
export const cellY = (row: number) => MARGIN + row * GRID.cell;

/** Which room an object hangs in: the one whose layout places it. */
const roomOf: Record<string, number> = {};
ROOMS.forEach((r, i) => {
  for (const id of Object.keys(r.cells)) roomOf[id] = i;
});

/** An object with everything the museum needs to place and draw it. */
export interface PlacedObject extends MuseumObject {
  /** Accession number, 1-based, in collection order. */
  index: number;
  /** The room it hangs in, 0-based. */
  room: number;
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

/** Stands in for an image not yet fetched, in development only; a build refuses. */
const MISSING: ImageEntry = {
  src: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='4' height='3'%3E%3Crect width='4' height='3' fill='%23d9d3c5'/%3E%3C/svg%3E",
  thumb:
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='4' height='3'%3E%3Crect width='4' height='3' fill='%23d9d3c5'/%3E%3C/svg%3E",
  width: 4,
  height: 3,
  license: "",
  artist: "",
  page: "",
};

export const PLACED: PlacedObject[] = OBJECTS.map((o, i) => {
  let image = IMAGES[o.id];
  if (!image) {
    if (process.env.NODE_ENV === "production") throw new Error(`No image for ${o.id}`);
    console.warn(`No image yet for ${o.id}`);
    image = MISSING;
  }
  const room = roomOf[o.id];
  if (room === undefined) throw new Error(`No room places ${o.id}`);
  const [col, row, cols, rows, fit = "cover"] = ROOMS[room].cells[o.id];
  const w = cols * GRID.cell;
  const h = rows * GRID.cell;
  const left = cellX(col, room);
  const top = cellY(row);
  return { ...o, index: i + 1, room, x: left + w / 2, y: top + h / 2, w, h, left, top, fit, image };
});

export const placedById: Record<string, PlacedObject> = Object.fromEntries(PLACED.map((o) => [o.id, o]));

/** A territory as it appears in one room: its objects' centroid, and where its name is set. */
export interface TerritoryPlace {
  id: TerritoryId;
  name: string;
  room: number;
  count: number;
  center: { x: number; y: number };
  label: { x: number; y: number; w: number };
}

export const TERRITORY_PLACES: TerritoryPlace[] = ROOM_PLACES.flatMap((room) =>
  TERRITORIES.flatMap((t) => {
    const members = PLACED.filter((o) => o.room === room.index && o.territory === t.id);
    const label = room.labels[t.id];
    if (!members.length || !label) return [];
    const cx = members.reduce((a, o) => a + o.x, 0) / members.length;
    const cy = members.reduce((a, o) => a + o.y, 0) / members.length;
    return [
      {
        id: t.id,
        name: t.name,
        room: room.index,
        count: members.length,
        center: { x: cx, y: cy },
        label: { x: cellX(label.col, room.index), y: cellY(label.row), w: label.cols * GRID.cell },
      },
    ];
  }),
);

/** A territory's place in a given room, if it has one there. */
export const territoryPlace = (id: TerritoryId, room: number) => TERRITORY_PLACES.find((t) => t.id === id && t.room === room);

/** Museum-wide numbers shown on the masthead. */
export const COLLECTION = {
  owner: "Tathagata",
  subtitle: "A personal internet museum",
  /** What is actually here. The collection grows room by room. */
  total: PLACED.length,
  rooms: ROOMS.length,
  since: 2026,
} as const;

export function accession(n: number): string {
  return `№ ${String(n).padStart(3, "0")}`;
}

export { OBJECTS, objectById, TERRITORIES, territoryById, THREADS, threadById, threadsFor, GRID, ROOMS };
