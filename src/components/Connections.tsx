"use client";

import { memo } from "react";
import { WORLD, placedById, type PlacedObject } from "@/data/museum";

interface Props {
  /** The object whose relations are drawn. */
  from: PlacedObject | null;
  /** Ids of related objects. */
  to: string[];
  /** Relation currently hovered (line brightens). */
  hot: string | null;
  /** Lines from a hovered object rather than an opened one: fainter. */
  peek?: boolean;
  /** Members of the active thread, drawn as a chain. */
  thread: string[] | null;
}

/**
 * Hairlines in world space. Strokes never scale, so a connection is always a
 * single pixel wide whether you're looking at the whole museum or one wall.
 */
function ConnectionsImpl({ from, to, hot, thread, peek }: Props) {
  return (
    <svg className="lines" width={WORLD.width} height={WORLD.height} viewBox={`0 0 ${WORLD.width} ${WORLD.height}`}>
      {thread && thread.length > 1 && (
        <polyline
          className="thread on"
          points={thread
            .map((id) => placedById[id])
            .map((o) => `${o.x},${o.y}`)
            .join(" ")}
        />
      )}
      {from &&
        to.map((id) => {
          const o = placedById[id];
          return (
            <line
              key={id}
              className={`${peek ? "peek" : "on"}${hot === id ? " hot" : ""}`}
              x1={from.x}
              y1={from.y}
              x2={o.x}
              y2={o.y}
            />
          );
        })}
    </svg>
  );
}

export const Connections = memo(ConnectionsImpl);
