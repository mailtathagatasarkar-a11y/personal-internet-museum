"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { COLLECTION, PLACED, ROOM_PLACES, placedById, territoryById, type PlacedObject, type RoomPlace } from "@/data/museum";
import type { TerritoryId } from "@/data/territories";
import type { Thread } from "@/data/threads";

/* ─── Masthead ───────────────────────────────────────────────────────── */

export function Masthead({ large, narrow, onReset }: { large: boolean; narrow: boolean; onReset: () => void }) {
  if (narrow) return null;
  return (
    <div className="hud" style={{ left: 28, bottom: 22 }} data-hud>
      <div className="paper-strip">
        <AnimatePresence initial={false}>
          {large && (
            <motion.div
              className="mono"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              style={{ marginBottom: 6, color: "var(--ink-2)" }}
            >
              {COLLECTION.total} objects · {COLLECTION.rooms} rooms · collecting since {COLLECTION.since}
            </motion.div>
          )}
        </AnimatePresence>
        <button type="button" className="hud-link wordmark" onClick={onReset} aria-label="Return to the whole museum">
          {COLLECTION.subtitle}
        </button>
        {COLLECTION.coffee && (
          <div className="mono" style={{ marginTop: 6 }}>
            <a className="hud-link" href={COLLECTION.coffee} target="_blank" rel="noreferrer" style={{ color: "var(--ink-3)" }}>
              Buy me a coffee ↗
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Controls ───────────────────────────────────────────────────────── */

interface ControlsProps {
  onReset: () => void;
  onSearch: () => void;
  onDrift: () => void;
  onZoom: (dir: 1 | -1) => void;
  onHelp: () => void;
  searchOpen: boolean;
  legendOpen: boolean;
  narrow: boolean;
}

export function Controls({ onReset, onSearch, onDrift, onZoom, onHelp, searchOpen, legendOpen, narrow }: ControlsProps) {
  return (
    <div
      className={`hud mono${narrow ? "" : " paper-strip"}`}
      style={
        narrow
          ? { right: 18, bottom: 14, display: "flex", gap: 18, alignItems: "baseline" }
          : { right: 28, bottom: 22, display: "flex", gap: 22, alignItems: "baseline" }
      }
      data-hud
    >
      <button type="button" className="hud-link" onClick={onReset} title="The whole museum (0)">
        Reset
      </button>
      <button type="button" className="hud-link" onClick={onSearch} aria-current={searchOpen} title="Every object, and search (/)">
        Index
      </button>
      <button type="button" className="hud-link" onClick={onDrift} title="Somewhere far from here (D)">
        Drift
      </button>
      {narrow && COLLECTION.coffee && (
        <a className="hud-link" href={COLLECTION.coffee} target="_blank" rel="noreferrer" title="Buy me a coffee">
          Coffee
        </a>
      )}
      {/* A phone pinches and double-taps to zoom, and has no keys to list. */}
      {!narrow && (
        <>
          <span style={{ display: "inline-flex", gap: 14 }}>
            <button
              type="button"
              className="hud-link"
              onClick={() => onZoom(-1)}
              aria-label="Zoom out"
              style={{ width: 14, textAlign: "center" }}
            >
              −
            </button>
            <button
              type="button"
              className="hud-link"
              onClick={() => onZoom(1)}
              aria-label="Zoom in"
              style={{ width: 14, textAlign: "center" }}
            >
              +
            </button>
          </span>
          <button
            type="button"
            className="hud-link"
            onClick={onHelp}
            aria-current={legendOpen}
            aria-label="Keys"
            style={{ width: 14, textAlign: "center" }}
          >
            ?
          </button>
        </>
      )}
    </div>
  );
}

/* ─── Legend: the keys, in museum notation ───────────────────────────── */

const KEYS: [string, string][] = [
  ["drag · wheel", "move · zoom"],
  ["click", "open an object · again: look closer"],
  ["← →", "next · previous connection"],
  ["backspace", "back along the trail"],
  ["esc", "step back"],
  ["d", "drift somewhere far"],
  ["/", "index · search"],
  ["+ − 0", "zoom in · out · this room"],
  ["[ ]", "previous · next room"],
];

export function Legend({ onClose }: { onClose: () => void }) {
  return (
    <div className="hud" data-hud style={{ left: "50%", bottom: 64, transform: "translateX(-50%)" }}>
      <motion.div
        className="sheet mono"
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 6 }}
        transition={{ duration: 0.25 }}
        style={{ display: "grid", gridTemplateColumns: "auto auto", columnGap: 22, rowGap: 4 }}
      >
        {KEYS.map(([k, v]) => (
          <div key={k} style={{ display: "contents" }}>
            <span style={{ color: "var(--ink)" }}>{k}</span>
            <span style={{ color: "var(--ink-3)", textTransform: "none", letterSpacing: "0.02em" }}>{v}</span>
          </div>
        ))}
        <button
          type="button"
          className="hud-link"
          onClick={onClose}
          style={{ gridColumn: "1 / -1", justifySelf: "start", marginTop: 6, color: "var(--ink-3)" }}
        >
          Close ×
        </button>
      </motion.div>
    </div>
  );
}

/* ─── Readout: where am I ────────────────────────────────────────────── */

interface ReadoutProps {
  room: RoomPlace;
  /** The territory under the centre of the view, or "" at the floor. */
  place: string;
  placeId: TerritoryId | null;
  scale: number;
  narrow: boolean;
  onGo: (id: TerritoryId) => void;
}

export function Readout({ room, place, placeId, scale, narrow, onGo }: ReadoutProps) {
  // A map-style ratio reads better than a percentage.
  const ratio = scale >= 1 ? `${scale.toFixed(1)} : 1` : `1 : ${(1 / scale).toFixed(1)}`;
  return (
    <div className="hud mono" style={{ left: narrow ? 20 : 28, top: narrow ? 18 : 24, color: "var(--ink-2)" }} data-hud>
      <div className="paper-strip">
        <span style={{ color: "var(--ink-3)" }}>{room.number} </span>
        <span style={{ color: "var(--ink)" }}>{room.name}</span>
        {place && (
          <>
            <span style={{ color: "var(--ink-3)" }}> · in </span>
            {placeId ? (
              <button type="button" className="hud-link" onClick={() => onGo(placeId)} title="Fit this territory">
                {place}
              </button>
            ) : (
              <span style={{ color: "var(--ink)" }}>{place}</span>
            )}
          </>
        )}
        {!narrow && <span style={{ color: "var(--ink-3)", marginLeft: 18 }}>Scale {ratio}</span>}
      </div>
    </div>
  );
}

/* ─── Dots: the rooms of the hall ────────────────────────────────────── */

interface DotsProps {
  rooms: RoomPlace[];
  current: number;
  /** Show the nudge to slide, until the visitor has turned a page once. */
  hint: boolean;
  narrow: boolean;
  onGo: (index: number) => void;
}

export function Dots({ rooms, current, hint, narrow, onGo }: DotsProps) {
  const [hover, setHover] = useState<number | null>(null);
  const shown = hover ?? current;
  if (narrow) {
    // On a phone the dots are the left half of the band, beside the controls.
    return (
      <div className="hud dots" data-hud style={{ left: 18, bottom: 12, display: "flex", alignItems: "center" }}>
        <div style={{ display: "flex", gap: 13, alignItems: "center" }}>
          {rooms.map((r) => (
            <button
              key={r.id}
              type="button"
              className="dot"
              aria-label={`Room ${r.number} · ${r.name}`}
              aria-current={r.index === current}
              onClick={() => onGo(r.index)}
            />
          ))}
        </div>
        {/* No nudge here: the band is narrow, and a row of dots on a phone
            asks to be tapped without being told. */}
      </div>
    );
  }
  return (
    <div className="hud dots" data-hud style={{ left: "50%", bottom: 22, transform: "translateX(-50%)" }}>
      <div className="paper-strip" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
        <div className="mono dots-name" data-hint={hint && hover === null ? true : undefined}>
          {hover !== null ? (
            <>
              <span style={{ color: "var(--ink-3)" }}>{rooms[shown].number} </span>
              {rooms[shown].name}
            </>
          ) : hint ? (
            narrow ? (
              "pick a room"
            ) : (
              "slide, or pick a room"
            )
          ) : (
            <>
              <span style={{ color: "var(--ink-3)" }}>{rooms[shown].number} </span>
              {rooms[shown].name}
            </>
          )}
        </div>
        <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
          {rooms.map((r) => (
            <button
              key={r.id}
              type="button"
              className="dot"
              aria-label={`Room ${r.number} · ${r.name}`}
              aria-current={r.index === current}
              onClick={() => onGo(r.index)}
              onPointerEnter={() => setHover(r.index)}
              onPointerLeave={() => setHover(null)}
              onFocus={() => setHover(r.index)}
              onBlur={() => setHover(null)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Trail: where did I come from ───────────────────────────────────── */

export function Trail({
  ids,
  current,
  narrow,
  onSelect,
}: {
  ids: string[];
  current: string | null;
  narrow: boolean;
  onSelect: (id: string) => void;
}) {
  // On a phone the reading column already names where you are; the trail would
  // sit on top of the readout.
  if (narrow || ids.length === 0) return null;
  return (
    <div className="hud mono" style={{ right: 28, top: 26, textAlign: "right", color: "var(--ink-3)" }} data-hud>
      <div>
        {ids.map((id, i) => (
          <span key={id}>
            {i > 0 && <span style={{ margin: "0 8px" }}>→</span>}
            <button
              type="button"
              className="hud-link"
              onClick={() => onSelect(id)}
              style={{ color: id === current ? "var(--ink)" : "var(--ink-3)" }}
              aria-current={id === current}
            >
              {placedById[id].title}
            </button>
          </span>
        ))}
      </div>
    </div>
  );
}

/* ─── Thread banner ──────────────────────────────────────────────────── */

export function ThreadBanner({
  thread,
  condensed,
  narrow,
  onClose,
}: {
  thread: Thread;
  condensed: boolean;
  narrow: boolean;
  onClose: () => void;
}) {
  return (
    <div
      className="hud"
      data-hud
      // Clear of the readout, which on a phone runs under where this sits.
      style={{
        left: "50%",
        top: narrow ? 48 : 30,
        transform: "translateX(-50%)",
        textAlign: "center",
        maxWidth: narrow ? "calc(100vw - 36px)" : 520,
      }}
    >
      <motion.div
        className="sheet"
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.45, ease: [0.2, 0, 0, 1] }}
      >
        <div className="mono" style={{ color: "var(--accent)" }}>
          Thread · {thread.members.length} objects
          <button type="button" className="hud-link" onClick={onClose} style={{ marginLeft: 16, color: "var(--ink-3)" }}>
            Close ×
          </button>
        </div>
        <div className="serif" style={{ fontSize: condensed ? 22 : 34, lineHeight: 1.05, marginTop: 6, transition: "font-size 0.4s" }}>
          {thread.name}
        </div>
        {!condensed && (
          <div className="serif-text italic" style={{ fontSize: 17, lineHeight: 1.3, marginTop: 8, color: "var(--ink-2)" }}>
            {thread.note}
          </div>
        )}
      </motion.div>
    </div>
  );
}

/* ─── Search ─────────────────────────────────────────────────────────── */

export function Search({ initial = "", onSelect, onClose }: { initial?: string; onSelect: (id: string) => void; onClose: () => void }) {
  const [q, setQ] = useState(initial);
  const [cursor, setCursor] = useState(0);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    input.current?.focus();
    input.current?.select();
  }, []);

  const hits = useMemo<PlacedObject[]>(() => {
    const term = q.trim().toLowerCase();
    // No query: the whole index, room by room, in the order of the floor.
    if (!term) return [...PLACED].sort((a, b) => a.room - b.room || a.territory.localeCompare(b.territory) || a.index - b.index);
    const score = (o: PlacedObject) => {
      const hay = [o.title, o.creator, o.maker ?? "", o.year, territoryById[o.territory].name, o.medium, ROOM_PLACES[o.room].name]
        .join(" ")
        .toLowerCase();
      if (o.title.toLowerCase().startsWith(term)) return 3;
      if (o.title.toLowerCase().includes(term)) return 2;
      if (hay.includes(term)) return 1;
      return 0;
    };
    return PLACED.map((o) => [o, score(o)] as const)
      .filter(([, s]) => s > 0)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 12)
      .map(([o]) => o);
  }, [q]);

  return (
    <div
      className="hud"
      data-hud
      style={{ left: "50%", top: "12vh", transform: "translateX(-50%)", width: "min(600px, calc(100vw - 48px))" }}
    >
      <motion.div
        className="sheet"
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 6 }}
        transition={{ duration: 0.3 }}
      >
        <div className="mono" style={{ color: "var(--ink-3)", marginBottom: 6 }}>
          {q.trim() ? `${hits.length} of ${PLACED.length}` : `Index · ${PLACED.length} objects`}
          <button type="button" className="hud-link" onClick={onClose} style={{ marginLeft: 16 }}>
            Esc
          </button>
        </div>
        <input
          ref={input}
          className="search-input"
          placeholder="Filter by object, designer, year, territory…"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setCursor(0);
          }}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") setCursor((c) => Math.min(hits.length - 1, c + 1));
            if (e.key === "ArrowUp") setCursor((c) => Math.max(0, c - 1));
            if (e.key === "Enter" && hits[cursor]) onSelect(hits[cursor].id);
            if (e.key === "Escape") onClose();
            e.stopPropagation();
          }}
        />
        <div className="index-list" style={{ marginTop: 12 }}>
          {hits.map((o, i) => (
            <div key={o.id} style={{ display: "contents" }}>
              {!q.trim() && (i === 0 || hits[i - 1].room !== o.room) && (
                <div className="mono index-room">
                  <span style={{ color: "var(--ink-3)" }}>{ROOM_PLACES[o.room].number} </span>
                  {ROOM_PLACES[o.room].name}
                  <span style={{ color: "var(--ink-3)", marginLeft: 12, textTransform: "none", letterSpacing: "0.02em" }}>
                    {ROOM_PLACES[o.room].line}
                  </span>
                </div>
              )}
              <button type="button" className="search-hit" data-active={i === cursor} onClick={() => onSelect(o.id)}>
                <span className="mono" style={{ color: "var(--ink-3)" }}>
                  {String(o.index).padStart(3, "0")}
                </span>
                <span>
                  <span className="serif" style={{ fontSize: 20 }}>
                    {o.title}
                  </span>
                  <span style={{ color: "var(--ink-2)", fontSize: 13, marginLeft: 10 }}>{o.creator}</span>
                </span>
                <span className="mono" style={{ color: "var(--ink-3)" }}>
                  {o.year} · {territoryById[o.territory].name}
                </span>
              </button>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
