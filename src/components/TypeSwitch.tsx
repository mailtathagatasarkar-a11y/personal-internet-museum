"use client";

import { useEffect, useSyncExternalStore } from "react";

/**
 * Review-only: cycles the museum's type pairing. The URL is the state
 * (`?type=a`), so a choice can be shared and the T key just rewrites it.
 */
export const TYPE_PAIRINGS = [
  { id: "", label: "Grotesk", fonts: "Inter Tight · Fragment Mono" },
  { id: "t", label: "Times", fonts: "Times · Fragment Mono" },
];

const EVENT = "museum:type";

function subscribe(cb: () => void) {
  window.addEventListener("popstate", cb);
  window.addEventListener(EVENT, cb);
  return () => {
    window.removeEventListener("popstate", cb);
    window.removeEventListener(EVENT, cb);
  };
}

const read = () => new URLSearchParams(window.location.search).get("type") ?? "";

export function setType(id: string) {
  const url = new URL(window.location.href);
  if (id) url.searchParams.set("type", id);
  else url.searchParams.delete("type");
  window.history.replaceState(null, "", url);
  window.dispatchEvent(new Event(EVENT));
}

export function TypeSwitch() {
  const current = useSyncExternalStore(subscribe, read, () => "");
  const index = Math.max(
    0,
    TYPE_PAIRINGS.findIndex((t) => t.id === current),
  );
  const pairing = TYPE_PAIRINGS[index];

  useEffect(() => {
    document.documentElement.dataset.type = pairing.id;
  }, [pairing.id]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      if (e.key === "t" || e.key === "T") setType(TYPE_PAIRINGS[(index + 1) % TYPE_PAIRINGS.length].id);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index]);

  // Chrome only while comparing; the chosen pairing shows nothing, and stills never do.
  if (!pairing.id || new URLSearchParams(window.location.search).has("still")) return null;
  return (
    <div className="hud mono" data-hud style={{ left: "50%", bottom: 22, transform: "translateX(-50%)", color: "var(--ink-3)" }}>
      <button type="button" className="hud-link paper-strip" onClick={() => setType(TYPE_PAIRINGS[(index + 1) % TYPE_PAIRINGS.length].id)}>
        Type {pairing.id ? pairing.id.toUpperCase() : "0"} · {pairing.label} — {pairing.fonts} · press T
      </button>
    </div>
  );
}
