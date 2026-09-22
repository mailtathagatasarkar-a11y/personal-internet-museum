"use client";

import { memo, useState } from "react";
import type { PlacedObject } from "@/data/museum";

export type ObjectState = "idle" | "dim" | "selected" | "related" | "member";

interface Props {
  obj: PlacedObject;
  state: ObjectState;
  /** Whether the full-resolution image should be shown (close zoom, or active). */
  wantFull: boolean;
  onSelect: (id: string) => void;
  onHover: (id: string | null) => void;
  /** Keyboard focus: bring the object into view without opening it. */
  onFocus: (id: string) => void;
  wasDrag: () => boolean;
}

function ObjectNodeImpl({ obj, state, wantFull, onSelect, onHover, onFocus, wasDrag }: Props) {
  // Once the full image has been requested it stays mounted, so tier changes
  // never re-fetch or flash.
  const [full, setFull] = useState(wantFull);
  const [loaded, setLoaded] = useState(false);
  if (wantFull && !full) setFull(true);

  return (
    <div
      className="obj"
      data-id={obj.id}
      data-state={state}
      data-territory={obj.territory}
      data-room={obj.room}
      role="button"
      tabIndex={0}
      aria-label={`${obj.title}, ${obj.creator}, ${obj.year}`}
      style={{
        left: obj.left,
        top: obj.top,
        width: obj.w,
        height: obj.h,
        // Small artefacts sit above large ones so they stay reachable.
        zIndex: state === "selected" ? 2000 : 1000 - Math.round(obj.w / 8),
      }}
      onClick={(e) => {
        e.stopPropagation();
        if (wasDrag()) return;
        onSelect(obj.id);
      }}
      onPointerEnter={() => onHover(obj.id)}
      onPointerLeave={() => onHover(null)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          e.stopPropagation();
          onSelect(obj.id);
        }
      }}
      onFocus={(e) => {
        if (e.currentTarget.matches(":focus-visible")) onFocus(obj.id);
      }}
    >
      {/* Plain <img>: the museum scales these itself, so next/image's sizing would fight the camera.
          The first room's thumbnails arrive with the page; the other rooms' as they come into view, or are warmed after entry. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        className="obj-img thumb"
        src={obj.image.thumb}
        alt=""
        draggable={false}
        decoding="async"
        loading={obj.room === 0 ? "eager" : "lazy"}
        style={{ objectFit: obj.fit }}
      />
      {full && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          className={`obj-img full${loaded ? " loaded" : ""}`}
          style={{ objectFit: obj.fit }}
          src={obj.image.src}
          alt={`${obj.title}, ${obj.creator}, ${obj.year}`}
          draggable={false}
          decoding="async"
          onLoad={() => setLoaded(true)}
        />
      )}
    </div>
  );
}

export const ObjectNode = memo(ObjectNodeImpl);
