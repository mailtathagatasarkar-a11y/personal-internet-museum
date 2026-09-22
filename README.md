# A Personal Internet Museum

Phase 01 prototype. A spatial museum built from hardcoded demo data; no landing page,
no accounts, no backend. The museum is the homepage. It is a hall of four rooms, each a
poster on the same grid with its own line, and 197 objects between them.

```bash
npm install
npm run dev
```

Open <http://localhost:3000>. Desktop is the hero; phones start inside a room's first
territory and pan.

## The loop it prototypes

Enter → explore → notice → move toward it → open → understand why it was saved →
notice a connection → follow it → end up somewhere unexpected.

The demo sequence: zoomed out → click **DESIGN** → click the **Braun T3** →
follow **Functional minimalism →** in the reading column → select the **iPod** →
the readout now says *Technology*.

## Controls

| Input | Effect |
| --- | --- |
| Drag | Pan (with inertia) |
| Wheel / pinch | Zoom toward the cursor — never further out than one room |
| Drag sideways at the floor | Turn the page: the hall slides to the next room and settles |
| The dots (bottom centre) · `[` `]` · `PageUp` `PageDown` | Pick a room · previous / next room |
| Double-click on the floor | Zoom in |
| Click a territory name (far zoom) | Fly to that territory |
| Click an object | Open it: the camera moves, the reading column appears |
| Click a connection row / edge marker / related object | Travel to it |
| Click a thread | Pull back to see its members together |
| Drag away, click the floor, `Esc` | Step back to the wall |
| Hover an object | Its label, and hairlines to what it is connected to |
| Hover a territory name | The rest of the museum steps back |
| Hover a thread in the column | Its members light up before you follow it |
| Click the open object | Look closer; again to step back |
| Click the creator / the year / the territory in the column | Others by them · others from that decade · that territory |
| `←` `→` | Next / previous connection (or thread member) |
| `Backspace` | Back along the trail |
| `D` / **Drift** | Somewhere far from here, chosen for you |
| `+` `−` `0` `/` `?` | Zoom in, out, reset, index/search, keys |
| **Reset** · **Index** · **Drift** | This room, whole · every object, room by room (type to filter) · somewhere far, maybe another room |
| `Tab` | Objects are focusable; focus brings one into view, `Enter` opens it |
| `?o=braun-t3` · `?t=functional-minimalism` · `?r=3` | The address follows the visit, so a place can be sent |

## Type & layout

The register is the grid poster: warm grey paper, a hairline square grid, images set
into cells (some spanning several), and one bold, tight, all-caps grotesk — **Inter
Tight** — doing the headline, the territory names, the titles and the text, with
**Fragment Mono** for notation. Each room's line is set in fragments among the objects
on its floor:

> 01 THE COLLECTION — EVERYTHING I SAVED / FROM THE INTERNET. / NONE OF IT IS MINE. / ALL OF IT IS ME.
> 02 FIRSTS — NOTHING HERE / WAS ASKED FOR. / IT WAS NEW / BEFORE IT WAS GOOD.
> 03 TOOLS — MADE TO BE USED. / WORN BY USE. / BETTER FOR IT. / STILL HERE.
> 04 SYSTEMS — NOT PICTURES. / INSTRUCTIONS FOR LOOKING. / MAPS OF HOW THINGS FIT. / READ THE KEY. GO ANYWHERE.

The rooms sit side by side in one world with two cells of paper between them, so moving
between rooms is a camera slide, connections and threads can run across the hall, and
the next room's edge shows at the side of the frame at the floor. Each room's layout
lives in `src/data/rooms/<room>.ts`: the headline fragments, the territory label cells,
and every object's cell span (`[col, row, cols, rows, fit]`). The grid is 26 × 18 and the
composition follows three rules: an image never shares an edge with another image, text
blocks own whole cells, and about half the cells stay empty. Room 01 was composed by
hand; rooms 02–04 by `scripts/compose-room.mjs` from a zone map in `scripts/rooms/`, under
the same rules. Times (the WSJ/Ogilvy register) stays reachable for comparison with
`?type=t` or by pressing `T`.

## How it is built

- **Next.js 16 · React 19 · TypeScript · Tailwind 4 · Motion 13.**
- **Rendering:** one DOM container with a single `translate3d() scale()` transform.
  Objects are absolutely positioned `<img>`s in world units. Text stays crisp, images
  lazy-load natively, and nothing re-renders in React while the camera moves.
- **Camera:** three motion values (`x`, `y`, `s`). Flights interpolate the world
  centre linearly and the scale logarithmically, with a slight pull-back on long trips
  so travel reads as travel (`src/lib/useCamera.ts`, `src/lib/camera.ts`).
- **Zoom = information:** the camera writes `--far`, `--mid`, `--close`, `--inv` and
  `--half` onto the world element every frame; CSS does the disclosure. Far: territory
  names and image fragments. Medium: micro labels at constant screen size. Close:
  world-sized captions (title, creator, year, medium) that grow slower than the image.
- **A place, not a page:** the floor is a grid the whole museum is set on; images are
  multiply-blended so they print into the paper rather than sit on it; a faint network of
  every relation is visible from far away; labels sit on paper strips in a layer above
  the objects; the museum opens inside DESIGN and pulls back.
- **Object view:** not a modal. The camera frames the object left; the reading column
  is a strip of the same paper on the right. Hairlines run to related objects in world
  space; relations that leave the frame become edge markers you can follow.
- **Threads:** ideas that run through the collection. Following one fits its members in
  view and chains them with an accent line.

```
src/
  app/            layout (fonts), globals.css (tokens, world, objects, HUD)
  components/     Museum (state + camera), GridLayer, ObjectNode, LabelLayer,
                  TerritoryLayer, Connections, EdgeMarkers, DetailPanel, Hud
  data/           layout.ts (grid cells, headline, label cells), objects.ts (53 objects,
                  notes, relations), territories.ts, threads.ts, museum.ts (placement),
                  images.json (generated)
  lib/            camera.ts (pure maths), useCamera.ts (motion values + gestures)
scripts/          fetch-images.mjs (Wikimedia Commons → .cache/raw)
                  process-images.mjs (→ public/objects, public/objects/t)
```

## Imagery

Every image is a public-domain or Creative-Commons file from Wikimedia Commons, served
locally so the museum runs offline. Attribution and licence for each object are in
`src/data/images.json` and shown at the foot of its reading column. Room 01's files were
chosen by hand from contact sheets; the later rooms' by `scripts/find-images.mjs`
(an exact title where one is known, otherwise the best search hit of a usable size),
recorded in `scripts/sources.json` and reviewed on contact sheets. Regenerate with
`node scripts/fetch-images.mjs && node scripts/process-images.mjs`.

Judgement calls worth knowing:

- The **Braun T3** is photographed as its near-identical 1959 successor, the T4 — no
  usable T3 photograph exists on Commons. The object is titled T3 as the brief specifies.
- **Villa Savoye** was swapped for the **Barbican Estate**: France has no freedom of
  panorama, so no exterior photographs of it are on Commons.
- The ThinkPad shown is the **720C** (1993), the second of Sapper's black boxes.
- **Harry Beck's Tube map** has no free image (Beck died in 1974), so Systems has
  **Charles Booth's poverty map** of 1889 instead — a stronger "read the key" object anyway.
- The **Ur-Leica** is shown as the first photograph taken with it (the Eisenmarkt, Wetzlar,
  1914); the **Leatherman** as a later model of the PST; the **Akai MPC** as the 2000XL. Each
  card says so.
- The masthead counts what is actually here: 197 objects in four rooms.

## Out of scope (deliberately)

Authentication, database, landing page, Taste Map, timeline, exhibition builder,
profiles, social, extension, AI, scraping, payments, settings, onboarding.
