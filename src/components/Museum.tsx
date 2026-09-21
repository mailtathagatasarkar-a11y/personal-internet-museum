"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useMotionValueEvent } from "motion/react";
import {
  GRID,
  PLACED,
  TERRITORY_PLACES,
  WORLD,
  cellX,
  cellY,
  placedById,
  territoryById,
  territoryPlaceById,
  threadById,
} from "@/data/museum";
import type { TerritoryId } from "@/data/territories";
import { centerOn, clamp, fitRect, fitScale, frameObject, toScreen, union, worldCenter, zoomAt, type Size } from "@/lib/camera";
import { useCamera } from "@/lib/useCamera";
import { Connections } from "./Connections";
import { GridLayer } from "./GridLayer";
import { LabelLayer } from "./LabelLayer";
import { DetailPanel } from "./DetailPanel";
import { EdgeMarkers } from "./EdgeMarkers";
import { Controls, Legend, Masthead, Readout, Search, ThreadBanner, Trail } from "./Hud";
import { ObjectNode, type ObjectState } from "./ObjectNode";
import { TerritoryLayer } from "./TerritoryLayer";

type Tier = "far" | "medium" | "close";

const WORLD_SIZE: Size = { w: WORLD.width, h: WORLD.height };

const smooth = (a: number, b: number, v: number) => {
  const t = clamp((v - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};

const rectOf = (o: { left: number; top: number; w: number; h: number }) => ({
  left: o.left,
  top: o.top,
  w: o.w,
  h: o.h,
});

/** Camera for an exported still. Regions are in cells; see layout.ts. */
function stillFrame(mode: string, vp: Size, home: ReturnType<typeof centerOn>, minS: number) {
  const cell = (c: number, r: number, w: number, h: number) => ({
    left: cellX(c),
    top: cellY(r),
    w: w * GRID.cell,
    h: h * GRID.cell,
  });
  switch (mode) {
    // The share card: the top-left of the floor, first line of the manifesto legible.
    case "og":
      return fitRect(cell(-0.3, -0.25, 13.6, 7.15), vp, 0, minS * 0.5, 3);
    // A hover frame: a few objects with their labels, at reading zoom.
    case "close":
      return fitRect(cell(1.6, 3.55, 5.8, 3.62), vp, 0, minS * 0.5, 3);
    default:
      return home;
  }
}

export default function Museum() {
  const viewportRef = useRef<HTMLDivElement>(null);
  const worldRef = useRef<HTMLDivElement>(null);

  const vpRef = useRef<Size>({ w: 1440, h: 900 });
  const [narrow, setNarrow] = useState(false);

  // Fit the whole museum: the poster view. A phone is too narrow for the
  // poster, so it starts inside DESIGN at a readable size and pans from there.
  const homeCamera = useCallback(() => {
    const vp = vpRef.current;
    if (vp.w < 760) {
      const s = Math.max(fitScale(vp, WORLD_SIZE, 24), Math.min(0.24, (vp.h - 120) / WORLD.height));
      const design = territoryPlaceById.design.center;
      return centerOn(vp, design.x, design.y, s);
    }
    // Centred exactly, so the zoom floor and the poster agree to the pixel.
    return centerOn(vp, WORLD.width / 2, WORLD.height / 2, fitScale(vp, WORLD_SIZE, 44));
  }, []);
  const [measured, setMeasured] = useState(false);
  const measuredRef = useRef(false);
  // The whole museum, framed, is as far out as anyone can go.
  const minScale = useCallback(() => homeCamera().s, [homeCamera]);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [threadId, setThreadId] = useState<string | null>(null);
  /** Relation currently pointed at (a row, an edge marker, or the object itself). */
  const [hot, setHot] = useState<string | null>(null);
  /** Object under the pointer anywhere in the museum. */
  const [hoverId, setHoverId] = useState<string | null>(null);
  /** Territory name under the pointer at far zoom. */
  const [hoverTerritory, setHoverTerritory] = useState<TerritoryId | null>(null);
  /** Thread pointed at in the reading column, previewed before it is followed. */
  const [previewThreadId, setPreviewThreadId] = useState<string | null>(null);
  const [inspecting, setInspecting] = useState(false);
  const [tier, setTier] = useState<Tier>("far");
  const [trail, setTrail] = useState<string[]>([]);
  const [search, setSearch] = useState<{ open: boolean; query: string }>({
    open: false,
    query: "",
  });
  const [legendOpen, setLegendOpen] = useState(false);
  const [ready, setReady] = useState(false);
  /** Render for a still: no HUD, no entry flight, a fixed frame. `?still=home|og|close`. */
  const [still, setStill] = useState<string | null>(null);
  const [place, setPlace] = useState<{ label: string; id: TerritoryId | null }>({ label: "the museum", id: null });
  const [scaleReadout, setScaleReadout] = useState(0.2);

  const selected = selectedId ? placedById[selectedId] : null;
  const thread = threadId ? threadById[threadId] : null;
  const previewThread = previewThreadId ? threadById[previewThreadId] : null;
  const mode = selected ? "object" : thread ? "thread" : "museum";

  // Event handlers (gestures, keys) read state through refs so they never go
  // stale without being re-bound.
  const selectedRef = useRef(selected);
  const threadRef = useRef(thread);
  const trailRef = useRef(trail);
  const inspectingRef = useRef(inspecting);
  useEffect(() => {
    selectedRef.current = selected;
    threadRef.current = thread;
    trailRef.current = trail;
    inspectingRef.current = inspecting;
  }, [selected, thread, trail, inspecting]);
  // Until the visitor moves, a resize simply re-fits the poster.
  const touchedRef = useRef(false);
  // Where ← → have got to among the current object's connections.
  const stepRef = useRef(0);

  // ── Camera ────────────────────────────────────────────────────────────
  const camera = useCamera({
    viewport: () => vpRef.current,
    world: WORLD_SIZE,
    minScale,
    onGesture: (kind) => {
      touchedRef.current = true;
      // Dragging away from an object is how you leave it; zooming is how you look closer.
      if (kind === "pan" && selectedRef.current) setSelectedId(null);
    },
    onDoubleClick: (w) => {
      const cam = camera.get();
      const p = toScreen(cam, w.x, w.y);
      camera.flyTo(zoomAt(cam, p.x, p.y, 2.2, minScale()), {
        duration: 0.7,
        lift: false,
      });
    },
  });

  // Viewport size, kept in a ref for the camera and in state only where layout depends on it.
  useEffect(() => {
    const el = viewportRef.current!;
    const measure = () => {
      // A hidden pane reports 0×0; keep the last real size rather than poisoning the camera.
      if (el.clientWidth < 10 || el.clientHeight < 10) return;
      const changed = el.clientWidth !== vpRef.current.w || el.clientHeight !== vpRef.current.h;
      vpRef.current = { w: el.clientWidth, h: el.clientHeight };
      setNarrow(el.clientWidth < 760);
      // A real resize before the visitor has moved re-fits the poster. (The
      // observer's first callback repeats the initial size; it must not fly.)
      if (measuredRef.current && changed && !touchedRef.current) camera.flyTo(homeCamera(), { duration: 0.5, lift: false });
      measuredRef.current = true;
      setMeasured(true);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Gestures.
  useEffect(() => camera.bind(viewportRef.current), [camera]);

  // Entry. A link to an object or a thread opens there; otherwise the museum
  // opens inside DESIGN and pulls back until the whole place is in view.
  useEffect(() => {
    if (!measured) return;
    const vp = vpRef.current;
    const params = new URLSearchParams(window.location.search);
    const stillMode = params.get("still");
    if (stillMode) {
      touchedRef.current = true;
      camera.set(stillFrame(stillMode, vp, homeCamera(), minScale()));
      const timer = setTimeout(() => {
        setStill(stillMode);
        setReady(true);
      }, 0);
      return () => clearTimeout(timer);
    }
    const o = params.get("o");
    const t = params.get("t");
    if (o && placedById[o]) {
      touchedRef.current = true;
      camera.set(frameObject(rectOf(placedById[o]), vp, minScale()));
      const timer = setTimeout(() => {
        setSelectedId(o);
        setTrail([o]);
        setReady(true);
      }, 0);
      return () => clearTimeout(timer);
    }
    if (t && threadById[t]) {
      touchedRef.current = true;
      const rect = union(threadById[t].members.map((m) => rectOf(placedById[m])));
      camera.set(fitRect(rect, vp, Math.min(140, vp.w * 0.12), minScale(), 0.8));
      const timer = setTimeout(() => {
        setThreadId(t);
        setReady(true);
      }, 0);
      return () => clearTimeout(timer);
    }
    const home = homeCamera();
    const t3 = placedById["braun-t3"];
    camera.set(vp.w < 760 ? home : centerOn(vp, t3.x + 260, t3.y + 140, Math.max(home.s * 2.6, 0.42)));
    const timer = setTimeout(() => {
      setReady(true);
      camera.flyTo(home, { duration: 2.6, lift: false });
    }, 120);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [measured]);

  // The address follows the visit, so a place can be sent to someone.
  useEffect(() => {
    if (!ready) return;
    const url = new URL(window.location.href);
    if (selectedId) url.searchParams.set("o", selectedId);
    else url.searchParams.delete("o");
    if (threadId) url.searchParams.set("t", threadId);
    else url.searchParams.delete("t");
    window.history.replaceState(null, "", url);
  }, [ready, selectedId, threadId]);

  // Zoom → disclosure. CSS variables on the world do the fading; React only
  // learns about tier changes.
  useMotionValueEvent(camera.s, "change", (v) => {
    const el = worldRef.current;
    if (!el) return;
    const far = 1 - smooth(0.23, 0.36, v);
    const mid = smooth(0.27, 0.4, v) * (1 - smooth(0.62, 0.8, v));
    const close = smooth(0.62, 0.86, v);
    el.style.setProperty("--inv", (1 / v).toFixed(4));
    el.style.setProperty("--half", (1 / Math.sqrt(v)).toFixed(4));
    el.style.setProperty("--far", far.toFixed(3));
    el.style.setProperty("--mid", mid.toFixed(3));
    el.style.setProperty("--close", close.toFixed(3));
    setTier(v < 0.31 ? "far" : v < 0.72 ? "medium" : "close");
  });

  // Where am I: nearest territory to the centre of the view, throttled.
  useEffect(() => {
    let raf: number | null = null;
    const update = () => {
      raf = null;
      const cam = camera.get();
      const c = worldCenter(cam, vpRef.current);
      const ranked = TERRITORY_PLACES.map((t) => ({
        t,
        d: Math.hypot(t.center.x - c.cx, t.center.y - c.cy),
      })).sort((a, b) => a.d - b.d);
      const [a, b] = ranked;
      if (cam.s < minScale() * 1.35) setPlace({ label: "the museum", id: null });
      else if (b && b.d < a.d * 1.3) setPlace({ label: `${a.t.name} · ${b.t.name}`, id: a.t.id });
      else setPlace({ label: a.t.name, id: a.t.id });
      setScaleReadout(Math.round(cam.s * 100) / 100);
    };
    const schedule = () => {
      if (raf === null) raf = requestAnimationFrame(update);
    };
    const unsubs = [camera.x.on("change", schedule), camera.s.on("change", schedule)];
    schedule();
    return () => {
      unsubs.forEach((u) => u());
      if (raf !== null) cancelAnimationFrame(raf);
    };
  }, [camera, minScale]);

  // Warm the cache with the full-size images once the museum is on screen.
  useEffect(() => {
    if (!ready) return;
    const queue = PLACED.map((o) => o.image.src);
    let cancelled = false;
    const next = () => {
      if (cancelled || queue.length === 0) return;
      const img = new Image();
      img.onload = img.onerror = () => setTimeout(next, 40);
      img.src = queue.shift()!;
    };
    const idle = (window as Window & { requestIdleCallback?: (cb: () => void) => number }).requestIdleCallback;
    const handle = idle ? idle(next) : window.setTimeout(next, 1200);
    return () => {
      cancelled = true;
      if (!idle) clearTimeout(handle);
    };
  }, [ready]);

  // ── Actions ───────────────────────────────────────────────────────────
  const select = useCallback(
    (id: string) => {
      const o = placedById[id];
      const vp = vpRef.current;
      touchedRef.current = true;
      // Clicking the object you are already reading looks closer; again steps back.
      if (selectedRef.current?.id === id) {
        const next = !inspectingRef.current;
        setInspecting(next);
        if (next) {
          const cam = camera.get();
          const p = toScreen(cam, o.x, o.y);
          camera.flyTo(zoomAt(cam, p.x, p.y, 1.9, minScale()), {
            duration: 0.7,
            lift: false,
          });
        } else {
          camera.flyTo(frameObject(rectOf(o), vp, minScale()), {
            duration: 0.7,
            lift: false,
          });
        }
        return;
      }
      setSelectedId(id);
      setInspecting(false);
      setHot(null);
      setPreviewThreadId(null);
      setSearch({ open: false, query: "" });
      stepRef.current = 0;
      setTrail((t) => [...t.filter((x) => x !== id), id].slice(-6));
      camera.flyTo(frameObject(rectOf(o), vp, minScale()));
    },
    [camera, minScale],
  );

  const deselect = useCallback(() => {
    const o = selectedRef.current;
    setSelectedId(null);
    setInspecting(false);
    setHot(null);
    setPreviewThreadId(null);
    if (o) {
      // Step back to the wall the object hangs on.
      camera.flyTo(centerOn(vpRef.current, o.x, o.y, clamp(0.5, minScale(), 0.6)), { duration: 0.8, lift: false });
    }
  }, [camera, minScale]);

  const followThread = useCallback(
    (id: string) => {
      const t = threadById[id];
      setThreadId(id);
      setSelectedId(null);
      setInspecting(false);
      setHot(null);
      setPreviewThreadId(null);
      stepRef.current = 0;
      const rect = union(t.members.map((m) => rectOf(placedById[m])));
      const vp = vpRef.current;
      camera.flyTo(fitRect(rect, vp, Math.min(140, vp.w * 0.12), minScale(), 0.8));
    },
    [camera, minScale],
  );

  const reset = useCallback(() => {
    setSelectedId(null);
    setThreadId(null);
    setInspecting(false);
    setHot(null);
    setPreviewThreadId(null);
    setSearch({ open: false, query: "" });
    camera.flyTo(homeCamera());
  }, [camera, homeCamera]);

  const goToTerritory = useCallback(
    (id: string) => {
      touchedRef.current = true;
      setSelectedId(null);
      setInspecting(false);
      setHoverTerritory(null);
      const members = PLACED.filter((o) => o.territory === (id as TerritoryId));
      const rect = union(members.map(rectOf));
      const vp = vpRef.current;
      camera.flyTo(fitRect(rect, vp, Math.min(120, vp.w * 0.1), minScale(), 0.7));
    },
    [camera, minScale],
  );

  /** Bring an object into view without opening it (keyboard focus). */
  const peekAt = useCallback(
    (id: string) => {
      const o = placedById[id];
      const cam = camera.get();
      const vp = vpRef.current;
      const p = toScreen(cam, o.x, o.y);
      const inView = p.x > 80 && p.x < vp.w - 80 && p.y > 80 && p.y < vp.h - 80;
      if (inView && cam.s >= 0.3) return;
      camera.flyTo(centerOn(vp, o.x, o.y, Math.max(cam.s, 0.45)), {
        duration: 0.6,
        lift: false,
      });
    },
    [camera],
  );

  const zoom = useCallback(
    (dir: 1 | -1) => {
      const vp = vpRef.current;
      camera.flyTo(zoomAt(camera.get(), vp.w / 2, vp.h / 2, dir > 0 ? 1.6 : 1 / 1.6, minScale()), { duration: 0.55, lift: false });
    },
    [camera, minScale],
  );

  /** Somewhere far from here, chosen for you. Getting lost is part of the museum. */
  const drift = useCallback(() => {
    const cam = camera.get();
    const c = worldCenter(cam, vpRef.current);
    const seen = new Set(trailRef.current);
    const ranked = PLACED.filter((o) => !seen.has(o.id) && o.id !== selectedRef.current?.id)
      .map((o) => ({ o, d: Math.hypot(o.x - c.cx, o.y - c.cy) }))
      .sort((a, b) => b.d - a.d);
    // The farther half of the museum, then chance.
    const pool = ranked.slice(0, Math.max(6, Math.floor(ranked.length / 2)));
    const pick = pool[Math.floor(Math.random() * pool.length)];
    if (pick) select(pick.o.id);
  }, [camera, select]);

  /** One step back along the trail. */
  const back = useCallback(() => {
    const t = trailRef.current;
    if (t.length < 2) return deselect();
    const last = t[t.length - 1];
    const prev = t[t.length - 2];
    select(prev);
    setTrail((x) => x.filter((id) => id !== last));
  }, [deselect, select]);

  /** ← → step through the current object's connections, or the thread's members. */
  const step = useCallback(
    (dir: 1 | -1) => {
      const sel = selectedRef.current;
      const th = threadRef.current;
      const list = sel ? sel.relations.map((r) => r.to) : th ? th.members : [];
      if (list.length === 0) return;
      const i = (((stepRef.current + (dir > 0 ? 0 : -2)) % list.length) + list.length) % list.length;
      stepRef.current = i + 1;
      select(list[i]);
    },
    [select],
  );

  const openSearch = useCallback((query = "") => setSearch({ open: true, query }), []);

  // Keyboard.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      if (e.metaKey || e.ctrlKey || e.altKey) {
        if (e.key === "k") {
          e.preventDefault();
          openSearch();
        }
        return;
      }
      switch (e.key) {
        case "Escape":
          if (legendOpen) setLegendOpen(false);
          else if (search.open) setSearch({ open: false, query: "" });
          else if (selectedRef.current) deselect();
          else if (threadRef.current) setThreadId(null);
          break;
        case "+":
        case "=":
          zoom(1);
          break;
        case "-":
        case "_":
          zoom(-1);
          break;
        case "0":
          reset();
          break;
        case "/":
          e.preventDefault();
          openSearch();
          break;
        case "?":
          setLegendOpen((v) => !v);
          break;
        case "ArrowRight":
          step(1);
          break;
        case "ArrowLeft":
          step(-1);
          break;
        case "Backspace":
          if (selectedRef.current) {
            e.preventDefault();
            back();
          }
          break;
        case "d":
        case "D":
          drift();
          break;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [back, deselect, drift, legendOpen, openSearch, reset, search.open, step, zoom]);

  // ── Derived per-object state ──────────────────────────────────────────
  const relatedIds = useMemo(() => new Set(selected?.relations.map((r) => r.to) ?? []), [selected]);
  const relationKind = useMemo(() => new Map(selected?.relations.map((r) => [r.to, r.kind]) ?? []), [selected]);
  const memberIndex = useMemo(() => {
    const t = previewThread ?? thread;
    return new Map(t?.members.map((m, i) => [m, i]) ?? []);
  }, [thread, previewThread]);

  const stateFor = useCallback(
    (id: string): ObjectState => {
      if (selected) {
        if (id === selected.id) return "selected";
        if (previewThread) return memberIndex.has(id) ? "member" : "dim";
        if (relatedIds.has(id)) return "related";
        return "dim";
      }
      if (thread) return memberIndex.has(id) ? "member" : "dim";
      return "idle";
    },
    [selected, thread, previewThread, relatedIds, memberIndex],
  );

  const tagFor = useCallback(
    (id: string) => {
      if (selected && !previewThread && relatedIds.has(id)) return { text: relationKind.get(id)! };
      if ((previewThread || (!selected && thread)) && memberIndex.has(id) && id !== selected?.id) {
        return {
          n: String(memberIndex.get(id)! + 1).padStart(2, "0"),
          text: placedById[id].title,
        };
      }
      return null;
    },
    [selected, thread, previewThread, relatedIds, relationKind, memberIndex],
  );

  const onHoverObject = useCallback(
    (id: string | null) => {
      setHoverId(id);
      // Hovering a related object highlights its line, like hovering its row.
      if (selectedRef.current) setHot(id && relatedIds.has(id) ? id : null);
    },
    [relatedIds],
  );

  // Lines: from the object being read, or — with nothing open — from the one under the pointer.
  const hovered = !selected && hoverId ? placedById[hoverId] : null;
  const linesFrom = selected ?? hovered;
  const linesTo = useMemo(() => (linesFrom ? linesFrom.relations.map((r) => r.to) : []), [linesFrom]);

  return (
    <>
      <div ref={viewportRef} className="viewport" onClick={() => (selected ? deselect() : thread ? setThreadId(null) : null)}>
        <motion.div
          ref={worldRef}
          className="world"
          data-mode={mode}
          data-tier={tier}
          data-preview={hoverTerritory ?? ""}
          style={{
            width: WORLD.width,
            height: WORLD.height,
            transform: camera.transform,
          }}
          initial={false}
          animate={{ opacity: ready ? 1 : 0 }}
          transition={{ duration: 1.4, ease: "easeOut" }}
        >
          <GridLayer />
          <TerritoryLayer onSelect={goToTerritory} onHover={setHoverTerritory} />
          <Connections
            from={linesFrom}
            to={linesTo}
            peek={!selected}
            hot={hot}
            thread={previewThread?.members ?? thread?.members ?? null}
          />
          {PLACED.map((o) => {
            const st = stateFor(o.id);
            return (
              <ObjectNode
                key={o.id}
                obj={o}
                state={st}
                wantFull={tier === "close" || st === "selected" || st === "related" || st === "member"}
                onSelect={select}
                onHover={onHoverObject}
                onFocus={peekAt}
                wasDrag={camera.wasDrag}
              />
            );
          })}
          <LabelLayer stateFor={stateFor} tagFor={tagFor} hoverId={hoverId} />
        </motion.div>
      </div>

      <div className="grain" aria-hidden="true" />

      {still ? null : (
        <>
          <Masthead large={tier === "far" && !selected && !thread} narrow={narrow} onReset={reset} />
          <Trail ids={narrow ? trail.slice(-2) : trail} current={selectedId} onSelect={select} />
          <Readout
            place={selected ? territoryById[selected.territory].name : place.label}
            placeId={selected ? selected.territory : place.id}
            scale={scaleReadout}
            narrow={narrow}
            onGo={goToTerritory}
          />
          <Controls
            onReset={reset}
            onSearch={() => (search.open ? setSearch({ open: false, query: "" }) : openSearch())}
            onDrift={drift}
            onZoom={zoom}
            onHelp={() => setLegendOpen((v) => !v)}
            searchOpen={search.open}
            legendOpen={legendOpen}
            narrow={narrow}
          />

          <AnimatePresence>{legendOpen && <Legend key="legend" onClose={() => setLegendOpen(false)} />}</AnimatePresence>
        </>
      )}

      <AnimatePresence>
        {thread && <ThreadBanner key={thread.id} thread={thread} condensed={!!selected} onClose={() => setThreadId(null)} />}
      </AnimatePresence>

      <AnimatePresence>
        {selected && (
          <DetailPanel
            key={selected.id}
            obj={selected}
            hot={hot}
            activeThread={thread}
            narrow={narrow}
            onSelect={select}
            onHover={setHot}
            onFollowThread={followThread}
            onPreviewThread={setPreviewThreadId}
            onTerritory={goToTerritory}
            onSearch={openSearch}
          />
        )}
      </AnimatePresence>

      {selected && !narrow && !previewThread && (
        <EdgeMarkers
          camera={camera}
          from={selected}
          targets={selected.relations.map((r) => ({ id: r.to, kind: r.kind }))}
          hot={hot}
          narrow={narrow}
          onSelect={select}
          onHover={setHot}
        />
      )}

      <AnimatePresence>
        {search.open && (
          <Search key="search" initial={search.query} onSelect={select} onClose={() => setSearch({ open: false, query: "" })} />
        )}
      </AnimatePresence>
    </>
  );
}
