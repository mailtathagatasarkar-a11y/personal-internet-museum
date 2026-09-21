// Threads are ideas that run through the collection. Following one pulls the
// camera back so its members can be seen together, wherever they sit.

export interface Thread {
  id: string;
  name: string;
  note: string;
  members: string[];
}

export const THREADS: Thread[] = [
  {
    id: "functional-minimalism",
    name: "Functional minimalism",
    note: "Less, but better. A line that runs from Ulm to Cupertino to Stockholm.",
    members: ["braun-t3", "braun-sk4", "vitsoe-606", "braun-et66", "ipod", "op-1"],
  },
  {
    id: "pocket-machines",
    name: "Pocket machines",
    note: "Everything that fit in a hand and changed how people moved through a city.",
    members: ["braun-t3", "walkman", "game-boy", "casio-f91w", "nokia-3310", "ipod"],
  },
  {
    id: "glass-and-steel",
    name: "Glass and steel",
    note: "Mies, Breuer, and the moment furniture learned from buildings.",
    members: ["barcelona-pavilion", "farnsworth", "barcelona-chair", "wassily"],
  },
  {
    id: "motion-before-cinema",
    name: "Motion before cinema",
    note: "How photographs learned to move.",
    members: ["muybridge", "cinematographe", "trip-to-the-moon", "man-with-movie-camera", "metropolis"],
  },
  {
    id: "concrete-in-the-sun",
    name: "Concrete in the sun",
    note: "Raw concrete, hard light, and the buildings that made me want to travel.",
    members: ["chandigarh", "iim-ahmedabad", "barbican", "nakagin", "casa-malaparte"],
  },
  {
    id: "shared-objects",
    name: "The internet's shared objects",
    note: "Things that only make sense because everyone online has already seen them.",
    members: ["utah-teapot", "stanford-bunny", "comic-sans", "golden-record", "lego-patent", "next-cern", "pale-blue-dot"],
  },
  {
    id: "italian-line",
    name: "The Italian line",
    note: "Olivetti, Artemide, Bialetti, Libera — industry with a sense of humour.",
    members: ["olivetti-valentine", "lettera-22", "tizio", "moka", "casa-malaparte"],
  },
  {
    id: "letters-cut-and-cast",
    name: "Letters cut and cast",
    note: "From a stone in Rome to a specimen in Basel.",
    members: ["trajan", "johnston", "futura", "helvetica", "lettera-22", "comic-sans"],
  },
  {
    id: "music-as-hardware",
    name: "Music as hardware",
    note: "Instruments and players I saved because they look like they sound.",
    members: ["braun-sk4", "sl-1200", "tr-808", "walkman", "op-1", "golden-record"],
  },
];

export const threadById: Record<string, Thread> = Object.fromEntries(THREADS.map((t) => [t.id, t]));

/** Threads an object belongs to, in declaration order. */
export function threadsFor(objectId: string): Thread[] {
  return THREADS.filter((t) => t.members.includes(objectId));
}
