"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import { animate, useMotionTemplate, useMotionValue, type AnimationPlaybackControls, type MotionValue } from "motion/react";
import { MAX_SCALE, clamp, constrain, lerp, toWorld, worldCenter, zoomAt, type Camera, type Size } from "./camera";

export interface CameraApi {
  /** Motion values driving the world transform; never re-render React. */
  x: MotionValue<number>;
  y: MotionValue<number>;
  s: MotionValue<number>;
  transform: MotionValue<string>;
  get: () => Camera;
  set: (c: Camera) => void;
  /** Animate to a camera state. Long trips lift the camera slightly on the way. */
  flyTo: (target: Camera, opts?: { duration?: number; lift?: boolean }) => Promise<void>;
  stop: () => void;
  /** Bind pan / wheel / pinch / double-click gestures to the viewport element. Returns the unbind. */
  bind: (el: HTMLElement | null) => (() => void) | undefined;
  /** Whether the last pointer interaction was a drag (so clicks can be ignored). */
  wasDrag: () => boolean;
  minScale: () => number;
}

interface Options {
  viewport: () => Size;
  world: Size;
  minScale: () => number;
  /** Fired on every user gesture, so selection state can react to manual travel. */
  onGesture?: (kind: "pan" | "zoom") => void;
  onDoubleClick?: (world: { x: number; y: number }) => void;
}

const EASE: [number, number, number, number] = [0.66, 0, 0.22, 1];

export function useCamera(opts: Options): CameraApi {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const s = useMotionValue(0.2);
  const transform = useMotionTemplate`translate3d(${x}px, ${y}px, 0) scale(${s})`;

  const optsRef = useRef(opts);
  useEffect(() => {
    optsRef.current = opts;
  });

  const flight = useRef<AnimationPlaybackControls | null>(null);
  const inertia = useRef<number | null>(null);
  const wheel = useRef<{ raf: number | null; targetLog: number; px: number; py: number }>({
    raf: null,
    targetLog: 0,
    px: 0,
    py: 0,
  });
  const drag = useRef({ moved: false });

  const get = useCallback((): Camera => ({ x: x.get(), y: y.get(), s: s.get() }), [x, y, s]);
  const set = useCallback(
    (c: Camera) => {
      x.set(c.x);
      y.set(c.y);
      s.set(c.s);
    },
    [x, y, s],
  );

  const stop = useCallback(() => {
    flight.current?.stop();
    flight.current = null;
    if (inertia.current) cancelAnimationFrame(inertia.current);
    inertia.current = null;
    if (wheel.current.raf) cancelAnimationFrame(wheel.current.raf);
    wheel.current.raf = null;
  }, []);

  const flyTo = useCallback(
    (target: Camera, o: { duration?: number; lift?: boolean } = {}) => {
      stop();
      const vp = optsRef.current.viewport();
      const from = get();
      const c0 = worldCenter(from, vp);
      const c1 = worldCenter(target, vp);
      const l0 = Math.log(from.s);
      const l1 = Math.log(target.s);
      // Screen-space distance at the geometric mean of the two scales.
      const dist = Math.hypot(c1.cx - c0.cx, c1.cy - c0.cy) * Math.sqrt(from.s * target.s);
      const reduced = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const duration = reduced ? 0.01 : (o.duration ?? clamp(0.55 + dist / 2600 + Math.abs(l1 - l0) * 0.18, 0.55, 1.6));
      // Pull back mid-flight on long trips so the journey reads as travel.
      const lift = o.lift === false ? 0 : clamp(dist / (1.3 * Math.max(vp.w, 1)), 0, 1) * 0.55;

      // Land exactly on the target even if interrupted late.
      const ctrl = animate(0, 1, {
        duration,
        ease: EASE,
        onUpdate: (t) => {
          const ls = lerp(l0, l1, t) - lift * Math.sin(Math.PI * t);
          const sc = Math.exp(ls);
          const cx = lerp(c0.cx, c1.cx, t);
          const cy = lerp(c0.cy, c1.cy, t);
          set({ x: vp.w / 2 - cx * sc, y: vp.h / 2 - cy * sc, s: sc });
        },
      });
      flight.current = ctrl;
      return ctrl.finished.then(() => {
        if (flight.current === ctrl) {
          set(target);
          flight.current = null;
        }
      });
    },
    [get, set, stop],
  );

  const applyUser = useCallback((c: Camera) => set(constrain(c, optsRef.current.viewport(), optsRef.current.world)), [set]);

  const bind = useCallback(
    (el: HTMLElement | null) => {
      if (!el) return;
      const pointers = new Map<number, { x: number; y: number }>();
      let last = { x: 0, y: 0, t: 0 };
      let start = { x: 0, y: 0 };
      let velocity = { x: 0, y: 0 };
      let pinch: { dist: number; mid: { x: number; y: number } } | null = null;

      const onDown = (e: PointerEvent) => {
        if (e.button !== 0) return;
        // Let the HUD keep its own pointer behaviour.
        if ((e.target as HTMLElement).closest("[data-hud]")) return;
        stop();
        pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
        drag.current.moved = false;
        start = { x: e.clientX, y: e.clientY };
        last = { x: e.clientX, y: e.clientY, t: performance.now() };
        velocity = { x: 0, y: 0 };
        if (pointers.size === 2) {
          const [a, b] = [...pointers.values()];
          pinch = { dist: Math.hypot(b.x - a.x, b.y - a.y), mid: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 } };
          // A pinch is never a click, so both pointers can be captured at once.
          for (const id of pointers.keys()) el.setPointerCapture(id);
        }
      };

      const onMove = (e: PointerEvent) => {
        if (!pointers.has(e.pointerId)) return;
        pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
        if (pointers.size >= 2 && pinch) {
          const [a, b] = [...pointers.values()];
          const dist = Math.hypot(b.x - a.x, b.y - a.y);
          const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
          let cam = zoomAt(get(), mid.x, mid.y, dist / pinch.dist, optsRef.current.minScale(), MAX_SCALE);
          cam = { ...cam, x: cam.x + (mid.x - pinch.mid.x), y: cam.y + (mid.y - pinch.mid.y) };
          applyUser(cam);
          pinch = { dist, mid };
          drag.current.moved = true;
          optsRef.current.onGesture?.("zoom");
          return;
        }
        const now = performance.now();
        const dx = e.clientX - last.x;
        const dy = e.clientY - last.y;
        const dt = Math.max(1, now - last.t);
        // Exponential smoothing keeps the release velocity honest on jittery input.
        velocity = { x: lerp(velocity.x, dx / dt, 0.6), y: lerp(velocity.y, dy / dt, 0.6) };
        last = { x: e.clientX, y: e.clientY, t: now };
        if (!drag.current.moved && Math.hypot(e.clientX - start.x, e.clientY - start.y) > 4) {
          drag.current.moved = true;
          // Capture only once this is a drag: capturing on pointerdown would
          // retarget the pointerup and swallow every click on an object.
          el.setPointerCapture(e.pointerId);
          optsRef.current.onGesture?.("pan");
        }
        if (drag.current.moved) {
          const cam = get();
          applyUser({ ...cam, x: cam.x + dx, y: cam.y + dy });
        }
      };

      const onUp = (e: PointerEvent) => {
        if (!pointers.has(e.pointerId)) return;
        pointers.delete(e.pointerId);
        if (el.hasPointerCapture(e.pointerId)) el.releasePointerCapture(e.pointerId);
        if (pointers.size > 0) {
          pinch = null;
          const p = [...pointers.values()][0];
          last = { x: p.x, y: p.y, t: performance.now() };
          velocity = { x: 0, y: 0 };
          return;
        }
        pinch = null;
        if (!drag.current.moved) return;
        // Inertia: the camera has weight, so it coasts to a stop.
        const stale = performance.now() - last.t > 80;
        let v = stale ? { x: 0, y: 0 } : { ...velocity };
        if (Math.hypot(v.x, v.y) < 0.05) return;
        let prev = performance.now();
        const step = (now: number) => {
          const dt = Math.min(48, now - prev);
          prev = now;
          const decay = Math.exp(-dt / 300);
          const cam = get();
          const next = constrain({ ...cam, x: cam.x + v.x * dt, y: cam.y + v.y * dt }, optsRef.current.viewport(), optsRef.current.world);
          if (next.x !== cam.x + v.x * dt) v.x = 0;
          if (next.y !== cam.y + v.y * dt) v.y = 0;
          set(next);
          v = { x: v.x * decay, y: v.y * decay };
          if (Math.hypot(v.x, v.y) > 0.01) inertia.current = requestAnimationFrame(step);
          else inertia.current = null;
        };
        inertia.current = requestAnimationFrame(step);
      };

      const onWheel = (e: WheelEvent) => {
        // The reading column scrolls; the museum zooms.
        if ((e.target as HTMLElement).closest("[data-hud]")) return;
        e.preventDefault();
        const rect = el.getBoundingClientRect();
        const px = e.clientX - rect.left;
        const py = e.clientY - rect.top;
        // Trackpads report fine-grained, often two-axis deltas; a mouse wheel
        // reports coarse vertical steps. Pinch arrives as ctrl+wheel.
        const isPinch = e.ctrlKey || e.metaKey;
        const isWheel = !isPinch && e.deltaX === 0 && Math.abs(e.deltaY) >= 40 && Number.isInteger(e.deltaY);
        if (isPinch || isWheel) {
          optsRef.current.onGesture?.("zoom");
          const k = isPinch ? -0.011 : -0.0026;
          const w = wheel.current;
          if (w.raf === null) w.targetLog = Math.log(get().s);
          w.targetLog = clamp(w.targetLog + e.deltaY * k, Math.log(optsRef.current.minScale()), Math.log(MAX_SCALE));
          w.px = px;
          w.py = py;
          if (w.raf === null) {
            flight.current?.stop();
            flight.current = null;
            const tick = () => {
              const cam = get();
              const cur = Math.log(cam.s);
              const nextLog = lerp(cur, w.targetLog, 0.28);
              const done = Math.abs(w.targetLog - nextLog) < 0.002;
              const target = Math.exp(done ? w.targetLog : nextLog);
              applyUser(zoomAt(cam, w.px, w.py, target / cam.s, optsRef.current.minScale(), MAX_SCALE));
              w.raf = done ? null : requestAnimationFrame(tick);
            };
            w.raf = requestAnimationFrame(tick);
          }
        } else {
          optsRef.current.onGesture?.("pan");
          stop();
          const cam = get();
          applyUser({ ...cam, x: cam.x - e.deltaX, y: cam.y - e.deltaY });
        }
      };

      const onDbl = (e: MouseEvent) => {
        // Only the empty floor zooms on double-click; labels and objects already fly on click.
        if ((e.target as HTMLElement).closest("[data-hud], .obj, .territory")) return;
        const rect = el.getBoundingClientRect();
        optsRef.current.onDoubleClick?.(toWorld(get(), e.clientX - rect.left, e.clientY - rect.top));
      };

      el.addEventListener("pointerdown", onDown);
      el.addEventListener("pointermove", onMove);
      el.addEventListener("pointerup", onUp);
      el.addEventListener("pointercancel", onUp);
      el.addEventListener("wheel", onWheel, { passive: false });
      el.addEventListener("dblclick", onDbl);
      return () => {
        el.removeEventListener("pointerdown", onDown);
        el.removeEventListener("pointermove", onMove);
        el.removeEventListener("pointerup", onUp);
        el.removeEventListener("pointercancel", onUp);
        el.removeEventListener("wheel", onWheel);
        el.removeEventListener("dblclick", onDbl);
      };
    },
    [applyUser, get, set, stop],
  );

  useEffect(() => () => stop(), [stop]);

  return useMemo(
    () => ({
      x,
      y,
      s,
      transform,
      get,
      set,
      flyTo,
      stop,
      bind,
      wasDrag: () => drag.current.moved,
      minScale: () => optsRef.current.minScale(),
    }),
    [x, y, s, transform, get, set, flyTo, stop, bind],
  );
}
