# A Personal Internet Museum

Phase 01 prototype. One spatial museum built from hardcoded demo data; no landing page,
no accounts, no backend. The museum is the homepage.

```bash
npm install
npm run dev
```

Open <http://localhost:3000>. Desktop is the hero; phones start inside DESIGN and pan.

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
| Wheel / pinch | Zoom toward the cursor — never further out than the whole museum |
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
| **Reset** · **Index** · **Drift** | The whole museum · every object as a list (type to filter) · somewhere far |
| `Tab` | Objects are focusable; focus brings one into view, `Enter` opens it |
| `?o=braun-t3` · `?t=functional-minimalism` | The address follows the visit, so a place can be sent |

## Type & layout

The register is the grid poster: warm grey paper, a hairline square grid, images set
into cells (some spanning several), and one bold, tight, all-caps grotesk — **Inter
Tight** — doing the headline, the territory names, the titles and the text, with
**Fragment Mono** for notation. The museum's opening line is set in fragments among the
objects on the floor:

> EVERYTHING I SAVED / FROM THE INTERNET. / NONE OF IT IS MINE. / ALL OF IT IS ME.

Every object's cell span lives in `src/data/layout.ts` (`[col, row, cols, rows, fit]`),
alongside the headline fragments and the territory label cells. The grid is 26 × 18 and
the composition follows three rules: an image never shares an edge with another image,
text blocks own whole cells, and about half the cells stay empty. Times (the WSJ/Ogilvy
register) stays reachable for comparison with `?type=t` or by pressing `T`.

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

Every image is a public-domain or Creative-Commons file from Wikimedia Commons, chosen
by hand and served locally so the museum runs offline. Attribution and licence for each
object are in `src/data/images.json` and shown at the foot of its reading column.
Regenerate with `node scripts/fetch-images.mjs && node scripts/process-images.mjs`.

Judgement calls worth knowing:

- The **Braun T3** is photographed as its near-identical 1959 successor, the T4 — no
  usable T3 photograph exists on Commons. The object is titled T3 as the brief specifies.
- **Villa Savoye** was swapped for the **Barbican Estate**: France has no freedom of
  panorama, so no exterior photographs of it are on Commons.
- The ThinkPad shown is the **720C** (1993), the second of Sapper's black boxes.
- The masthead counts what is actually here (53). The brief imagines 184; growing the
  collection toward that is a content job through the same pipeline.

## Out of scope (deliberately)

Authentication, database, landing page, Taste Map, timeline, exhibition builder,
profiles, social, extension, AI, scraping, payments, settings, onboarding.
