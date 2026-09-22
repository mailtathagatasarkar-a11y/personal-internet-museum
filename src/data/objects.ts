import type { TerritoryId } from "./territories";
import { COLLECTION } from "./objects/collection";
import { FIRSTS } from "./objects/firsts";
import { TOOLS } from "./objects/tools";
import { SYSTEMS } from "./objects/systems";

// Why two objects are connected. Shown as small monospace notation.
export type RelationKind =
  | "SAME DESIGNER"
  | "SAME MAKER"
  | "SHARED DESIGN PHILOSOPHY"
  | "VISUAL RELATIONSHIP"
  | "INFLUENCE"
  | "SAME ERA"
  | "SIMILAR MATERIAL LANGUAGE"
  | "PRECURSOR"
  | "SAME CITY"
  | "SAME IDEA";

export interface Relation {
  to: string;
  kind: RelationKind;
  /** One sentence, in the collector's voice, explaining the link. */
  why: string;
}

export interface MuseumObject {
  id: string;
  title: string;
  creator: string;
  /** Manufacturer, studio or institution, when different from the creator. */
  maker?: string;
  year: string;
  medium: string;
  territory: TerritoryId;
  /** Where it was saved from, as the collector would name it. */
  source: string;
  sourceUrl: string;
  /** DD MON YYYY */
  note: string;
  relations: Relation[];
}

// The catalogue, room by room. Accession numbers run straight through it.
// Copied, so mirroring relations below never writes into the room files' objects.
export const OBJECTS: MuseumObject[] = [...COLLECTION, ...FIRSTS, ...TOOLS, ...SYSTEMS].map((o) => ({ ...o, relations: [...o.relations] }));

// A relation to something not in the catalogue is a mistake worth hearing about.
const IDS = new Set(OBJECTS.map((o) => o.id));
for (const o of OBJECTS) {
  for (const r of o.relations) if (!IDS.has(r.to)) throw new Error(`${o.id} relates to unknown ${r.to}`);
}

// Every relation is mirrored so the museum reads the same from both ends.
for (const o of OBJECTS) {
  for (const r of o.relations) {
    const other = OBJECTS.find((x) => x.id === r.to)!;
    if (!other.relations.some((b) => b.to === o.id)) {
      other.relations.push({ to: o.id, kind: r.kind, why: r.why });
    }
  }
}

export const objectById: Record<string, MuseumObject> = Object.fromEntries(OBJECTS.map((o) => [o.id, o]));
