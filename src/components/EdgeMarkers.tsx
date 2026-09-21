"use client";

import { useEffect, useRef } from "react";
import type { CameraApi } from "@/lib/useCamera";
import { placedById, type PlacedObject } from "@/data/museum";
import type { RelationKind } from "@/data/objects";

interface Target {
  id: string;
  kind: RelationKind;
}

interface Props {
  camera: CameraApi;
  /** The object the lines leave from. */
  from: PlacedObject;
  targets: Target[];
  hot: string | null;
  /** Narrow layouts stack the column under the object instead of beside it. */
  narrow: boolean;
  onSelect: (id: string) => void;
  onHover: (id: string | null) => void;
}

const INSET = 26;

/**
 * Off-screen relations, pinned to the edge of the frame in the direction they
 * lie. A connection that leaves the viewport should still be followable —
 * this is how you end up somewhere unexpected.
 *
 * Positions are written straight to the DOM on every camera change; React
 * only renders the markers themselves.
 */
export function EdgeMarkers({ camera, from, targets, hot, narrow, onSelect, onHover }: Props) {
  const wrap = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const nodes = Array.from(el.querySelectorAll<HTMLElement>("[data-edge]"));
    let raf: number | null = null;

    const update = () => {
      raf = null;
      const cam = camera.get();
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      // Lines leave from the selected object; markers follow the same rays.
      const ox = from.x * cam.s + cam.x;
      const oy = from.y * cam.s + cam.y;
      // The stage: everything except the reading column.
      const left = INSET;
      const top = narrow ? INSET : 72;
      const right = narrow ? vw - INSET : vw * 0.62 - 10;
      const bottom = narrow ? vh * 0.5 - 24 : vh - 56;
      const placed: { node: HTMLElement; x: number; y: number; w: number; h: number; angle: number }[] = [];

      for (const node of nodes) {
        const t = placedById[node.dataset.edge!];
        const tx = t.x * cam.s + cam.x;
        const ty = t.y * cam.s + cam.y;
        const halfW = (t.w * cam.s) / 2;
        const halfH = (t.h * cam.s) / 2;
        // Anything under the reading column counts as off stage.
        const visible = tx + halfW > 0 && tx - halfW < right + 40 && ty + halfH > 0 && ty - halfH < bottom + 40;
        if (visible) {
          node.classList.remove("on");
          continue;
        }
        // Ray from the origin toward the target, clipped to the inset frame.
        const dx = tx - ox;
        const dy = ty - oy;
        let k = Infinity;
        if (dx > 0) k = Math.min(k, (right - ox) / dx);
        if (dx < 0) k = Math.min(k, (left - ox) / dx);
        if (dy > 0) k = Math.min(k, (bottom - oy) / dy);
        if (dy < 0) k = Math.min(k, (top - oy) / dy);
        if (!Number.isFinite(k) || k < 0) k = 0;
        const px = Math.min(right, Math.max(left, ox + dx * k));
        const py = Math.min(bottom, Math.max(top, oy + dy * k));
        const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
        // Keep the label inside the frame: flip its anchor on the right/bottom edges.
        const w = node.offsetWidth;
        const h = node.offsetHeight;
        const ax = px > (left + right) / 2 ? px - w : px;
        const ay = py > (top + bottom) / 2 ? py - h : py;
        placed.push({ node, x: ax, y: ay, w, h, angle });
      }

      // Markers that share a stretch of edge stack instead of overlapping.
      placed.sort((a, b) => a.y - b.y);
      for (let i = 1; i < placed.length; i++) {
        const m = placed[i];
        for (let j = 0; j < i; j++) {
          const p = placed[j];
          const overlapX = m.x < p.x + p.w + 12 && m.x + m.w + 12 > p.x;
          const overlapY = m.y < p.y + p.h + 8 && m.y + m.h + 8 > p.y;
          if (!overlapX || !overlapY) continue;
          // Push down, unless that runs off the frame — then stack upward.
          m.y = p.y + p.h + 8 + m.h > bottom ? p.y - m.h - 8 : p.y + p.h + 8;
        }
      }
      for (const m of placed) {
        m.node.style.transform = `translate3d(${Math.round(m.x)}px, ${Math.round(m.y)}px, 0)`;
        const arrow = m.node.querySelector<HTMLElement>(".arrow");
        if (arrow) arrow.style.transform = `rotate(${m.angle}deg)`;
        m.node.classList.add("on");
      }
    };

    const schedule = () => {
      if (raf === null) raf = requestAnimationFrame(update);
    };
    const unsubs = [camera.x.on("change", schedule), camera.y.on("change", schedule), camera.s.on("change", schedule)];
    window.addEventListener("resize", schedule);
    // Let the markers mount before measuring them.
    const t = setTimeout(update, 30);
    return () => {
      unsubs.forEach((u) => u());
      window.removeEventListener("resize", schedule);
      clearTimeout(t);
      if (raf !== null) cancelAnimationFrame(raf);
    };
  }, [camera, from, targets, narrow]);

  return (
    <div ref={wrap} className="hud" style={{ inset: 0 }} data-hud>
      {targets.map((t) => {
        const o = placedById[t.id];
        return (
          <button
            key={t.id}
            type="button"
            data-edge={t.id}
            className={`edge${hot === t.id ? " hot" : ""}`}
            style={{ left: 0, top: 0 }}
            onClick={() => onSelect(t.id)}
            onPointerEnter={() => onHover(t.id)}
            onPointerLeave={() => onHover(null)}
          >
            <span className="arrow">
              <svg viewBox="0 0 10 10" aria-hidden="true">
                <path d="M1 5h7M5 1.5L8.5 5 5 8.5" fill="none" stroke="currentColor" strokeWidth="1.2" />
              </svg>
            </span>
            <span>
              <span className="name">{o.title}</span>
              <br />
              <span className="kind">{t.kind}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
