"use client";

import { memo } from "react";
import { GRID, TERRITORY_PLACES, type TerritoryPlace } from "@/data/museum";
import type { TerritoryId } from "@/data/territories";

/**
 * Territory names at two levels, in every room they appear in. Far out they
 * are set into the grid like the poster's smaller lines, with their count
 * beside them; closer in they collapse to a monospace marker.
 */
function TerritoryLayerImpl({ onSelect, onHover }: { onSelect: (t: TerritoryPlace) => void; onHover: (id: TerritoryId | null) => void }) {
  return (
    <>
      {TERRITORY_PLACES.map((t) => (
        <div
          key={`${t.room}:${t.id}`}
          className="territory"
          style={{ left: t.label.x, top: t.label.y, width: t.label.w, height: GRID.cell }}
          onClick={() => onSelect(t)}
          onPointerEnter={() => onHover(t.id)}
          onPointerLeave={() => onHover(null)}
        >
          <span className="territory-name">{t.name}</span>
          <span className="territory-count">{String(t.count).padStart(2, "0")}</span>
        </div>
      ))}
      {TERRITORY_PLACES.map((t) => (
        <div
          key={`${t.room}:${t.id}-marker`}
          className="territory-marker"
          style={{ left: t.label.x + t.label.w / 2, top: t.label.y + GRID.cell / 2 }}
          onClick={(e) => {
            e.stopPropagation();
            onSelect(t);
          }}
        >
          {t.name}
        </div>
      ))}
    </>
  );
}

export const TerritoryLayer = memo(TerritoryLayerImpl);
