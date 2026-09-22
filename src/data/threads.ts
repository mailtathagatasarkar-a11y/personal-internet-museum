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
  // ── Threads that run through more than one room open on their first member's room; ← → walk the rest. ──
  {
    id: "first-light",
    name: "First light",
    note: "First light, first face, first colour, first look inside, first look back.",
    members: ["niepce-le-gras", "boulevard-du-temple", "cornelius-self-portrait", "tartan-ribbon", "rontgen-hand", "earthrise"],
  },
  {
    id: "games-before-games",
    name: "Games before games",
    note: "Two games on lab equipment, one in a bar, one in a pocket.",
    members: ["tennis-for-two", "spacewar", "pong", "game-boy"],
  },
  {
    id: "the-loom-and-the-moon",
    name: "The loom and the Moon",
    note: "A pattern in holes, then a program in thread.",
    members: ["jacquard-loom", "difference-engine", "punch-card", "apollo-guidance-computer"],
  },
  {
    id: "in-every-toolbox",
    name: "In every toolbox",
    note: "Cheap, everywhere, and you'd notice if any of it changed.",
    members: ["stanley-knife", "duct-tape", "cable-tie", "paper-clip", "zippo", "bic-cristal"],
  },
  {
    id: "sixteen-pads",
    name: "Sixteen pads",
    note: "Machines that turned rhythm into a grid of buttons.",
    members: ["akai-mpc60", "tr-808", "fairlight-cmi", "op-1"],
  },
  {
    id: "kit-of-the-century",
    name: "The kit of the century",
    note: "What the people who photographed the twentieth century carried.",
    members: ["nikon-f", "leica-m3", "hasselblad-500c", "rolleiflex", "tri-x"],
  },
  {
    id: "drawing-the-dead",
    name: "Drawing the dead",
    note: "Three Victorians who found a picture changes minds faster than a table.",
    members: ["snow-cholera-map", "nightingale-rose", "minard"],
  },
  {
    id: "letters-to-nobody",
    name: "Letters to nobody",
    note: "Messages made for readers who share none of our language.",
    members: ["pioneer-plaque", "arecibo-message", "golden-record", "rosetta-stone"],
  },
  {
    id: "alphabets-for-hands",
    name: "Alphabets for hands",
    note: "Letters arranged for the body that uses them, not the eye that reads them.",
    members: ["braille", "morse-code", "qwerty", "type-case", "hangul"],
  },
];

export const threadById: Record<string, Thread> = Object.fromEntries(THREADS.map((t) => [t.id, t]));

/** Threads an object belongs to, in declaration order. */
export function threadsFor(objectId: string): Thread[] {
  return THREADS.filter((t) => t.members.includes(objectId));
}
