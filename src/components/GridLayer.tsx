"use client";

import { memo } from "react";
import { GRID, MARGIN, ROOM_PLACES, ROOM_SIZE, cellX, cellY } from "@/data/museum";

/**
 * The floor, room by room: a hairline grid each poster is set on, the room's
 * line broken into fragments among the objects, and a folio in the margin
 * saying which room this is. Each fragment owns a block of cells and sits
 * inside it the way type sits in a poster's grid.
 */
function GridLayerImpl() {
  const vertical = Array.from({ length: GRID.cols + 1 }, (_, i) => MARGIN + i * GRID.cell);
  const horizontal = Array.from({ length: GRID.rows + 1 }, (_, i) => MARGIN + i * GRID.cell);
  return (
    <>
      {ROOM_PLACES.map((room) => (
        <div
          key={room.id}
          className="room"
          style={{ left: room.left, top: room.top, width: room.w, height: room.h }}
          data-room={room.index}
        >
          <svg className="grid" width={ROOM_SIZE.w} height={ROOM_SIZE.h} viewBox={`0 0 ${ROOM_SIZE.w} ${ROOM_SIZE.h}`} aria-hidden="true">
            {vertical.map((x) => (
              <line key={`v${x}`} x1={x} y1={MARGIN} x2={x} y2={ROOM_SIZE.h - MARGIN} />
            ))}
            {horizontal.map((y) => (
              <line key={`h${y}`} x1={MARGIN} y1={y} x2={ROOM_SIZE.w - MARGIN} y2={y} />
            ))}
          </svg>
          <div className="folio mono" aria-hidden="true">
            {room.number} — {room.name}
          </div>
        </div>
      ))}
      {ROOM_PLACES.flatMap((room) =>
        room.headline.map((f) => (
          <div
            key={`${room.id}:${f.lines.join(" ")}`}
            className="headline"
            style={{ left: cellX(f.col, room.index), top: cellY(f.row), width: f.cols * GRID.cell, height: f.rows * GRID.cell }}
            aria-hidden="true"
          >
            <div>
              {f.lines.map((l) => (
                <div key={l}>{l}</div>
              ))}
            </div>
          </div>
        )),
      )}
    </>
  );
}

export const GridLayer = memo(GridLayerImpl);
