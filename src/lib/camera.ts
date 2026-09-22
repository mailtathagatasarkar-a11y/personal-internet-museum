// Pure camera maths. The camera is a translation + uniform scale:
//   screen = world * s + (x, y)
// Everything here is side-effect free so it can be reasoned about in isolation.

export interface Camera {
  x: number;
  y: number;
  s: number;
}

export interface Size {
  w: number;
  h: number;
}

export interface Rect {
  left: number;
  top: number;
  w: number;
  h: number;
}

export const MAX_SCALE = 3.2;

export const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Scale at which the whole world fits inside the viewport with `pad` px around it. */
export function fitScale(vp: Size, world: Size, pad = 40): number {
  return Math.min((vp.w - pad * 2) / world.w, (vp.h - pad * 2) / world.h);
}

/** Camera that puts world point (cx, cy) at screen point (px, py) at scale s. */
export function anchor(cx: number, cy: number, s: number, px: number, py: number): Camera {
  return { x: px - cx * s, y: py - cy * s, s };
}

export function centerOn(vp: Size, cx: number, cy: number, s: number): Camera {
  return anchor(cx, cy, s, vp.w / 2, vp.h / 2);
}

export function worldCenter(cam: Camera, vp: Size) {
  return { cx: (vp.w / 2 - cam.x) / cam.s, cy: (vp.h / 2 - cam.y) / cam.s };
}

export function toWorld(cam: Camera, px: number, py: number) {
  return { x: (px - cam.x) / cam.s, y: (py - cam.y) / cam.s };
}

export function toScreen(cam: Camera, wx: number, wy: number) {
  return { x: wx * cam.s + cam.x, y: wy * cam.s + cam.y };
}

/** Zoom by `factor` keeping the world point under screen (px, py) fixed. */
export function zoomAt(cam: Camera, px: number, py: number, factor: number, minS: number, maxS = MAX_SCALE): Camera {
  const s = clamp(cam.s * factor, minS, maxS);
  const k = s / cam.s;
  return { x: px - (px - cam.x) * k, y: py - (py - cam.y) * k, s };
}

/**
 * Keep the museum in the frame. When the world is smaller than the viewport
 * along an axis it sits centred and cannot be dragged; when larger, its edge
 * may come inside the frame by up to 45% of the viewport, so the poster is
 * never left floating in a corner. That allowance grows with the overflow
 * from zero, so zooming out to the floor slides the poster into the centre
 * instead of snapping it there on the frame it first fits.
 */
export function constrain(cam: Camera, vp: Size, world: Size): Camera {
  const ww = world.w * cam.s;
  const wh = world.h * cam.s;
  const axis = (pos: number, size: number, view: number) => {
    if (size <= view) return (view - size) / 2;
    const m = Math.min(view * 0.45, (size - view) / 2);
    return clamp(pos, view - m - size, m);
  };
  return { x: axis(cam.x, ww, vp.w), y: axis(cam.y, wh, vp.h), s: cam.s };
}

/** Camera that shows `rect` with `pad` px around it, never closer than maxS. */
export function fitRect(rect: Rect, vp: Size, pad: number, minS: number, maxS: number): Camera {
  const s = clamp(Math.min((vp.w - pad * 2) / rect.w, (vp.h - pad * 2) / rect.h), minS, maxS);
  return centerOn(vp, rect.left + rect.w / 2, rect.top + rect.h / 2, s);
}

export function union(rects: Rect[]): Rect {
  const left = Math.min(...rects.map((r) => r.left));
  const top = Math.min(...rects.map((r) => r.top));
  const right = Math.max(...rects.map((r) => r.left + r.w));
  const bottom = Math.max(...rects.map((r) => r.top + r.h));
  return { left, top, w: right - left, h: bottom - top };
}

/**
 * Frame an object for the detail view. On wide screens the object sits in the
 * left part of the composition and the reading column takes the right; on
 * narrow screens the object takes the upper part.
 */
export function frameObject(rect: Rect, vp: Size, minS: number): Camera {
  const narrow = vp.w < 760;
  const availW = narrow ? vp.w * 0.82 : vp.w * 0.44;
  const availH = narrow ? vp.h * 0.38 : vp.h * 0.7;
  const s = clamp(Math.min(availW / rect.w, availH / rect.h), minS, 2.6);
  const px = narrow ? vp.w / 2 : vp.w * 0.28;
  const py = narrow ? vp.h * 0.26 : vp.h * 0.5;
  return anchor(rect.left + rect.w / 2, rect.top + rect.h / 2, s, px, py);
}

/** Distance the camera would travel, in screen pixels at the mean scale of the two states. */
export function travel(a: Camera, b: Camera, vp: Size): number {
  const ca = worldCenter(a, vp);
  const cb = worldCenter(b, vp);
  const d = Math.hypot(cb.cx - ca.cx, cb.cy - ca.cy);
  return d * Math.sqrt(a.s * b.s);
}
