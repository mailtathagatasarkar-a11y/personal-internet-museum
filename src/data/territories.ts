// The museum's territories. Where they sit on the floor is decided by the
// cells their objects occupy (see layout.ts); the name is the only thing
// that is fixed here.

export type TerritoryId =
  | "design"
  | "typography"
  | "architecture"
  | "objects"
  | "technology"
  | "photography"
  | "film"
  | "music"
  | "oddities";

export interface Territory {
  id: TerritoryId;
  name: string;
}

export const TERRITORIES: Territory[] = [
  { id: "design", name: "Design" },
  { id: "typography", name: "Typography" },
  { id: "architecture", name: "Architecture" },
  { id: "objects", name: "Objects" },
  { id: "technology", name: "Technology" },
  { id: "photography", name: "Photography" },
  { id: "film", name: "Film" },
  { id: "music", name: "Music" },
  { id: "oddities", name: "Internet Oddities" },
];

export const territoryById = Object.fromEntries(TERRITORIES.map((t) => [t.id, t])) as Record<TerritoryId, Territory>;
