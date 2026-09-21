"use client";

import { memo } from "react";
import { PLACED } from "@/data/museum";
import type { ObjectState } from "./ObjectNode";

interface Props {
  stateFor: (id: string) => ObjectState;
  tagFor: (id: string) => { n?: string; text: string } | null;
  /** The object under the pointer: its label shows whatever the zoom. */
  hoverId: string | null;
}

/**
 * Labels live above the objects, not inside them: on a grid, the object
 * below would otherwise cover the label of the one above. Each label sits
 * on a small strip of paper, like one stuck to the wall under a print.
 */
function LabelLayerImpl({ stateFor, tagFor, hoverId }: Props) {
  return (
    <>
      {PLACED.map((o) => {
        const state = stateFor(o.id);
        const tag = tagFor(o.id);
        const short = o.title.length > 26 ? o.title.slice(0, 24).trimEnd() + "…" : o.title;
        return (
          <div
            key={o.id}
            className="label"
            data-state={state}
            data-hover={o.id === hoverId || undefined}
            style={{ left: o.left, top: o.top, width: o.w, height: o.h }}
          >
            <div className="obj-micro">
              {short} · {o.year}
            </div>
            <figcaption className="obj-caption">
              <div className="title">{o.title}</div>
              <div className="creator">
                {o.creator} · {o.year}
              </div>
              <div className="medium">{o.medium}</div>
            </figcaption>
            {tag && (
              <div className="obj-tag">
                {tag.n && <span className="n">{tag.n}</span>}
                {tag.text}
              </div>
            )}
          </div>
        );
      })}
    </>
  );
}

export const LabelLayer = memo(LabelLayerImpl);
