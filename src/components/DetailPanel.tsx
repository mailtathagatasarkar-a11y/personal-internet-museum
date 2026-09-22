"use client";

import { motion } from "motion/react";
import { accession, placedById, territoryById, threadsFor, type PlacedObject } from "@/data/museum";
import type { Thread } from "@/data/threads";

interface Props {
  obj: PlacedObject;
  hot: string | null;
  activeThread: Thread | null;
  narrow: boolean;
  onSelect: (id: string) => void;
  onHover: (id: string | null) => void;
  onFollowThread: (id: string) => void;
  /** Pointing at a thread shows its members in the museum before you follow it. */
  onPreviewThread: (id: string | null) => void;
  onTerritory: (id: string) => void;
  /** Open the search with a query: the creator, or the decade. */
  onSearch: (query: string) => void;
}

/**
 * The reading column. Not a modal: the museum stays behind it and the object
 * stays where it is — this is the wall text next to the artefact.
 */
export function DetailPanel({
  obj,
  hot,
  activeThread,
  narrow,
  onSelect,
  onHover,
  onFollowThread,
  onPreviewThread,
  onTerritory,
  onSearch,
}: Props) {
  const territory = territoryById[obj.territory];
  const threads = threadsFor(obj.id);
  // "1958" → the fifties; "113 AD" and "c. 1910" fall back to the string itself.
  const decade = /^(\d{3})\d$/.exec(obj.year)?.[1] ?? obj.year;
  const firstCreator = obj.creator.split(/ & | and |, /)[0];

  return (
    <motion.aside
      key={obj.id}
      className="panel"
      data-hud
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8, transition: { duration: 0.25 } }}
      transition={{ duration: 0.7, delay: 0.45, ease: [0.2, 0, 0, 1] }}
      style={
        narrow
          ? { left: 0, right: 0, top: "46vh", bottom: 48, overflowY: "auto" }
          : { left: "62vw", width: "min(34vw, 500px)", top: 0, bottom: 56, overflowY: "auto" }
      }
    >
      <div className={`panel-paper${narrow ? " narrow" : ""}`}>
        <div className="mono" style={{ color: "var(--ink-3)", marginBottom: 14 }}>
          {accession(obj.index)} ·{" "}
          <button type="button" className="hud-link" onClick={() => onTerritory(obj.territory)} title={`Go to ${territory.name}`}>
            {territory.name}
          </button>
        </div>

        <h1 className="serif" style={{ fontSize: narrow ? 34 : 44, lineHeight: 0.96, margin: 0 }}>
          {obj.title}
        </h1>
        <div
          className="serif italic"
          style={{
            fontSize: narrow ? 24 : 30,
            lineHeight: 1.1,
            marginTop: 6,
            color: "var(--ink-2)",
            fontWeight: "var(--serif-text-weight)",
            letterSpacing: "-0.02em",
          }}
        >
          <button type="button" className="hud-link" onClick={() => onSearch(decade)} title={`Others from the ${decade}0s`}>
            {obj.year}
          </button>
        </div>
        <div style={{ fontSize: 15, lineHeight: 1.4, marginTop: 14, fontWeight: 600 }}>
          <button type="button" className="hud-link" onClick={() => onSearch(firstCreator)} title={`Others by ${firstCreator}`}>
            {obj.creator}
          </button>
          {obj.maker && <span style={{ color: "var(--ink-2)", fontWeight: 400 }}> · {obj.maker}</span>}
        </div>

        <div style={{ marginTop: 20 }}>
          <div className="row">
            <span className="mono" style={{ color: "var(--ink-3)" }}>
              Source
            </span>
            <span className="mono">
              <a className="hud-link" href={obj.sourceUrl} target="_blank" rel="noreferrer">
                {obj.source} ↗
              </a>
            </span>
          </div>
          <div className="row">
            <span className="mono" style={{ color: "var(--ink-3)" }}>
              Medium
            </span>
            <span className="mono" style={{ textTransform: "none", letterSpacing: "0.02em" }}>
              {obj.medium}
            </span>
          </div>
        </div>

        <div style={{ marginTop: 20 }}>
          <div className="mono" style={{ color: "var(--ink-3)", marginBottom: 6 }}>
            Note
          </div>
          <p className="serif-text" style={{ fontSize: narrow ? 20 : 23, lineHeight: 1.28, margin: 0 }}>
            “{obj.note}”
          </p>
        </div>

        {obj.relations.length > 0 && (
          <div style={{ marginTop: 22 }}>
            <div className="mono" style={{ color: "var(--ink-3)", marginBottom: 6 }}>
              Connections · {String(obj.relations.length).padStart(2, "0")}
            </div>
            <div>
              {obj.relations.map((r) => {
                const o = placedById[r.to];
                return (
                  <button
                    key={r.to}
                    type="button"
                    className={`rel${hot === r.to ? " hot" : ""}`}
                    onClick={() => onSelect(r.to)}
                    onPointerEnter={() => onHover(r.to)}
                    onPointerLeave={() => onHover(null)}
                  >
                    <span className="name">{o.title}</span>
                    <span className="kind">{r.kind}</span>
                    <span className="why">{r.why}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {threads.length > 0 && (
          <div style={{ marginTop: 26 }}>
            <div className="mono" style={{ color: "var(--ink-3)", marginBottom: 8 }}>
              Threads
            </div>
            {threads.map((t) => (
              <div key={t.id} style={{ padding: "6px 0" }}>
                <button
                  type="button"
                  className="hud-link serif"
                  aria-current={activeThread?.id === t.id}
                  style={{ fontSize: 22, lineHeight: 1.15, color: activeThread?.id === t.id ? "var(--accent)" : "var(--ink)" }}
                  onClick={() => onFollowThread(t.id)}
                  onPointerEnter={() => onPreviewThread(t.id)}
                  onPointerLeave={() => onPreviewThread(null)}
                >
                  {t.name} →
                </button>
                <span className="mono" style={{ color: "var(--ink-3)", marginLeft: 12 }}>
                  {t.members.length} objects
                </span>
              </div>
            ))}
          </div>
        )}

        <div
          className="mono"
          style={{ color: "var(--ink-4)", marginTop: 34, fontSize: 9.5, textTransform: "none", letterSpacing: "0.03em" }}
        >
          Image: {obj.image.artist || "unknown"} · {obj.image.license || "—"} ·{" "}
          <a className="hud-link" href={obj.image.page} target="_blank" rel="noreferrer">
            Wikimedia Commons
          </a>
        </div>
      </div>
    </motion.aside>
  );
}
