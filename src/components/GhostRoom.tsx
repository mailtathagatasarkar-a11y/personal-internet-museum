"use client";

import { memo } from "react";
import { GRID, MARGIN, PLACED, ROOM_PLACES, ROOM_SIZE, TERRITORY_PLACES, cellX, cellY } from "@/data/museum";

/**
 * A room shown where the hall wraps: the last room standing to the left of the
 * first, and the first to the right of the last, so the museum has no ends.
 *
 * It is the room as the floor shows it — the grid, the line, the names, the
 * prints — and nothing more: no labels, no full-size images, nothing to click.
 * The camera crosses onto one of these and is then moved a whole hall along,
 * onto the room itself, which looks exactly the same.
 */
function GhostRoomImpl({ index, dx }: { index: number; dx: number }) {
  const room = ROOM_PLACES[index];
  const vertical = Array.from({ length: GRID.cols + 1 }, (_, i) => MARGIN + i * GRID.cell);
  const horizontal = Array.from({ length: GRID.rows + 1 }, (_, i) => MARGIN + i * GRID.cell);
  return (
    <div className="ghost" style={{ left: room.left + dx, top: room.top, width: room.w, height: room.h }} aria-hidden="true">
      <svg className="grid" width={ROOM_SIZE.w} height={ROOM_SIZE.h} viewBox={`0 0 ${ROOM_SIZE.w} ${ROOM_SIZE.h}`}>
        {vertical.map((x) => (
          <line key={`v${x}`} x1={x} y1={MARGIN} x2={x} y2={ROOM_SIZE.h - MARGIN} />
        ))}
        {horizontal.map((y) => (
          <line key={`h${y}`} x1={MARGIN} y1={y} x2={ROOM_SIZE.w - MARGIN} y2={y} />
        ))}
      </svg>
      <div className="folio mono">
        {room.number} — {room.name}
      </div>
      {room.headline.map((f) => (
        <div
          key={f.lines.join(" ")}
          className="headline"
          style={{
            left: cellX(f.col, index) - room.left,
            top: cellY(f.row),
            width: f.cols * GRID.cell,
            height: f.rows * GRID.cell,
          }}
        >
          <div>
            {f.lines.map((l) => (
              <div key={l}>{l}</div>
            ))}
          </div>
        </div>
      ))}
      {TERRITORY_PLACES.filter((t) => t.room === index).map((t) => (
        <div key={t.id} className="territory" style={{ left: t.label.x - room.left, top: t.label.y, width: t.label.w, height: GRID.cell }}>
          <span className="territory-name">{t.name}</span>
          <span className="territory-count">{String(t.count).padStart(2, "0")}</span>
        </div>
      ))}
      {PLACED.filter((o) => o.room === index).map((o) => (
        <div key={o.id} className="obj" style={{ left: o.left - room.left, top: o.top, width: o.w, height: o.h }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            className="obj-img thumb"
            src={o.image.thumb}
            alt=""
            draggable={false}
            decoding="async"
            loading="lazy"
            style={{ objectFit: o.fit }}
          />
        </div>
      ))}
    </div>
  );
}

export const GhostRoom = memo(GhostRoomImpl);
