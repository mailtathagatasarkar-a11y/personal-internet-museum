"use client";

import { memo } from "react";
import { GRID, HEADLINE, MARGIN, WORLD, cellX, cellY } from "@/data/museum";

/**
 * The floor: a hairline grid the whole museum is set on, and the opening
 * line broken into fragments among the objects. Each fragment owns a block
 * of cells and sits inside it the way type sits in a poster's grid.
 */
function GridLayerImpl() {
  const vertical = Array.from({ length: GRID.cols + 1 }, (_, i) => MARGIN + i * GRID.cell);
  const horizontal = Array.from({ length: GRID.rows + 1 }, (_, i) => MARGIN + i * GRID.cell);
  return (
    <>
      <svg className="grid" width={WORLD.width} height={WORLD.height} viewBox={`0 0 ${WORLD.width} ${WORLD.height}`} aria-hidden="true">
        {vertical.map((x) => (
          <line key={`v${x}`} x1={x} y1={MARGIN} x2={x} y2={WORLD.height - MARGIN} />
        ))}
        {horizontal.map((y) => (
          <line key={`h${y}`} x1={MARGIN} y1={y} x2={WORLD.width - MARGIN} y2={y} />
        ))}
      </svg>
      {HEADLINE.map((f) => (
        <div
          key={f.lines.join(" ")}
          className="headline"
          style={{ left: cellX(f.col), top: cellY(f.row), width: f.cols * GRID.cell, height: f.rows * GRID.cell }}
          aria-hidden="true"
        >
          <div>
            {f.lines.map((l) => (
              <div key={l}>{l}</div>
            ))}
          </div>
        </div>
      ))}
    </>
  );
}

export const GridLayer = memo(GridLayerImpl);
