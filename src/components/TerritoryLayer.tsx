"use client";

import { memo } from "react";
import { COUNT_BY_TERRITORY, GRID, TERRITORY_PLACES } from "@/data/museum";
import type { TerritoryId } from "@/data/territories";

/**
 * Territory names at two levels. Far out they are set into the grid like the
 * poster's smaller lines, with their count beside them; closer in they
 * collapse to a monospace marker.
 */
function TerritoryLayerImpl({ onSelect, onHover }: { onSelect: (id: string) => void; onHover: (id: TerritoryId | null) => void }) {
  return (
    <>
      {TERRITORY_PLACES.map((t) => (
        <div
          key={t.id}
          className="territory"
          style={{ left: t.label.x, top: t.label.y, width: t.label.w, height: GRID.cell }}
          onClick={() => onSelect(t.id)}
          onPointerEnter={() => onHover(t.id)}
          onPointerLeave={() => onHover(null)}
        >
          <span className="territory-name">{t.name}</span>
          <span className="territory-count">{String(COUNT_BY_TERRITORY[t.id]).padStart(2, "0")}</span>
        </div>
      ))}
      {TERRITORY_PLACES.map((t) => (
        <div
          key={`${t.id}-marker`}
          className="territory-marker"
          style={{ left: t.label.x + t.label.w / 2, top: t.label.y + GRID.cell / 2 }}
          onClick={(e) => {
            e.stopPropagation();
            onSelect(t.id);
          }}
        >
          {t.name}
        </div>
      ))}
    </>
  );
}

export const TerritoryLayer = memo(TerritoryLayerImpl);
