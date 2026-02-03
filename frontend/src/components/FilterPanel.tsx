"use client";

import { useMemo, useState } from "react";

export type FilterState = {
  duration: string | null;
  triggerFilters: string[];
  talkingStyleFilters: string[];
  roleplayScenes: string[];
  languageFilters: string[];
  excludeTags: string[]; // tags to exclude from results
};

export const durationBuckets = [
  { id: "short", label: "2-5 min" },
  { id: "medium", label: "5-15 min" },
  { id: "long", label: "15+ min" },
];

export const triggerTypeOptions: string[] = [
  "tapping",
  "scratching",
  "crinkling",
  "brushing",
  "ear_cleaning",
  "mouth_sounds",
  "white_noise",
  "binaural",
  "visual_asmr",
  "layered",
  "roleplay", // kept in the internal list for parsing/URL mapping
];

const ROLEPLAY_TRIGGER_ID = "roleplay";

export const talkingStyleOptions: string[] = [
  "whisper",
  "soft_spoken",
  "no_talking",
];

export const roleplaySceneOptions: string[] = [
  "rp_haircut",
  "rp_cranial",
  "rp_dentist",
];

export const languageOptions = ["en", "ja", "ko", "zh"];

export const languageLabels: Record<string, string> = {
  en: "English",
  ja: "Japanese",
  ko: "Korean",
  zh: "Chinese",
};

const typeLabels: Record<string, string> = {
  tapping: "Tapping",
  scratching: "Scratching",
  crinkling: "Crinkling",
  brushing: "Brushing",
  ear_cleaning: "Ear cleaning",
  mouth_sounds: "Mouth sounds",
  white_noise: "White noise",
  binaural: "Binaural",
  visual_asmr: "Visual ASMR",
  layered: "Layered sounds",
  whisper: "Whisper",
  soft_spoken: "Soft spoken",
  no_talking: "No talking",
  roleplay: "Roleplay",
  rp_haircut: "Haircut",
  rp_cranial: "Cranial nerve exam",
  rp_dentist: "Dentist",
};

export const displayTag = (tag: string): string => {
  if (typeLabels[tag]) return typeLabels[tag];
  return tag
    .split("_")
    .map((part) => (part ? part[0].toUpperCase() + part.slice(1) : ""))
    .join(" ");
};

export const chipStyle = (active?: boolean) => ({
  padding: "0.35rem 0.75rem",
  borderRadius: "999px",
  border: "1px solid",
  borderColor: active ? "#059669" : "#475569",
  background: active ? "#059669" : "#0f172a",
  color: active ? "#fff" : "#e2e8f0",
  fontSize: "0.7rem",
  cursor: "pointer",
  transition: "border-color 150ms ease, background 150ms ease",
});

export type FilterPanelProps = {
  state: FilterState;
  onChange: (state: FilterState) => void;
};

const EXCLUDABLE_TAGS = Array.from(
  new Set([...triggerTypeOptions, ...talkingStyleOptions, ...roleplaySceneOptions])
);

export function FilterPanel({ state, onChange }: FilterPanelProps) {
  const { duration, triggerFilters, talkingStyleFilters, roleplayScenes, languageFilters, excludeTags } = state;

  const [excludeSearchOpen, setExcludeSearchOpen] = useState(false);
  const [excludeQuery, setExcludeQuery] = useState("");

  const filteredExcludeOptions = useMemo(() => {
    const q = excludeQuery.toLowerCase().trim();
    return EXCLUDABLE_TAGS.filter((tag) => {
      if (excludeTags.includes(tag)) return false;
      if (!q) return true;
      const label = displayTag(tag).toLowerCase();
      return label.includes(q) || tag.includes(q);
    });
  }, [excludeQuery, excludeTags]);

  return (
    <>
      {/* Duration */}
      <div style={{ marginTop: "0.9rem" }}>
        <p
          style={{
            fontSize: "0.65rem",
            letterSpacing: "0.3em",
            textTransform: "uppercase",
            color: "#9ca3af",
            marginBottom: "0.3rem",
          }}
        >
          Duration
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
          {durationBuckets.map((bucket) => (
            <button
              key={bucket.id}
              style={chipStyle(duration === bucket.id)}
              onClick={() =>
                onChange({
                  ...state,
                  duration: duration === bucket.id ? null : bucket.id,
                })
              }
            >
              {bucket.label}
            </button>
          ))}
        </div>
      </div>

      {/* Trigger type */}
      <div style={{ marginTop: "0.9rem" }}>
        <p
          style={{
            fontSize: "0.65rem",
            letterSpacing: "0.3em",
            textTransform: "uppercase",
            color: "#9ca3af",
            marginBottom: "0.3rem",
          }}
        >
          Trigger Type
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem" }}>
          {triggerTypeOptions
            .filter((type) => type !== ROLEPLAY_TRIGGER_ID)
            .map((type) => {
              const active = triggerFilters.includes(type);
              return (
                <button
                  key={type}
                  style={chipStyle(active)}
                  onClick={() => {
                    onChange({
                      ...state,
                      triggerFilters: active
                        ? triggerFilters.filter((t) => t !== type)
                        : [...triggerFilters, type],
                    });
                  }}
                >
                  {displayTag(type)}
                </button>
              );
            })}
        </div>
      </div>

      {/* Roleplay */}
      <div style={{ marginTop: "0.9rem" }}>
        <p
          style={{
            fontSize: "0.65rem",
            letterSpacing: "0.3em",
            textTransform: "uppercase",
            color: "#9ca3af",
            marginBottom: "0.3rem",
          }}
        >
          Roleplay
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem" }}>
          <button
            type="button"
            style={chipStyle(triggerFilters.includes(ROLEPLAY_TRIGGER_ID))}
            onClick={() => {
              const active = triggerFilters.includes(ROLEPLAY_TRIGGER_ID);
              onChange({
                ...state,
                triggerFilters: active
                  ? triggerFilters.filter((t) => t !== ROLEPLAY_TRIGGER_ID)
                  : [...triggerFilters, ROLEPLAY_TRIGGER_ID],
                // If roleplay is turned off, also clear roleplay scenes.
                roleplayScenes: active ? [] : state.roleplayScenes,
              });
            }}
          >
            {displayTag(ROLEPLAY_TRIGGER_ID)}
          </button>
        </div>
      </div>

      {/* Roleplay scenes: show when Roleplay is selected OR any scene is active */}
      {(triggerFilters.includes("roleplay") || roleplayScenes.length > 0) && (
        <div style={{ marginTop: "0.9rem" }}>
          <p
            style={{
              fontSize: "0.65rem",
              letterSpacing: "0.3em",
              textTransform: "uppercase",
              color: "#9ca3af",
              marginBottom: "0.3rem",
            }}
          >
            Roleplay scene
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem" }}>
            {roleplaySceneOptions.map((scene) => {
              const active = roleplayScenes.includes(scene);
              return (
                <button
                  key={scene}
                  style={chipStyle(active)}
                  onClick={() => {
                    if (active) {
                      // Removing a scene does not auto-toggle off the Roleplay chip.
                      onChange({
                        ...state,
                        roleplayScenes: roleplayScenes.filter((s) => s !== scene),
                      });
                    } else {
                      // Adding a scene should also ensure the generic Roleplay chip is active.
                      const nextScenes = [...roleplayScenes, scene];
                      const hasRoleplay = triggerFilters.includes(ROLEPLAY_TRIGGER_ID);
                      onChange({
                        ...state,
                        roleplayScenes: nextScenes,
                        triggerFilters: hasRoleplay
                          ? triggerFilters
                          : [...triggerFilters, ROLEPLAY_TRIGGER_ID],
                      });
                    }
                  }}
                >
                  {displayTag(scene)}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Talking style */}
      <div style={{ marginTop: "0.9rem" }}>
        <p
          style={{
            fontSize: "0.65rem",
            letterSpacing: "0.3em",
            textTransform: "uppercase",
            color: "#9ca3af",
            marginBottom: "0.3rem",
          }}
        >
          Talking style
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem" }}>
          {talkingStyleOptions.map((style) => {
            const active = talkingStyleFilters.includes(style);
            return (
              <button
                key={style}
                style={chipStyle(active)}
                onClick={() => {
                  onChange({
                    ...state,
                    talkingStyleFilters: active
                      ? talkingStyleFilters.filter((s) => s !== style)
                      : [...talkingStyleFilters, style],
                  });
                }}
              >
                {displayTag(style)}
              </button>
            );
          })}
        </div>
      </div>

      {/* Language */}
      <div style={{ marginTop: "0.9rem" }}>
        <p
          style={{
            fontSize: "0.65rem",
            letterSpacing: "0.3em",
            textTransform: "uppercase",
            color: "#9ca3af",
            marginBottom: "0.3rem",
          }}
        >
          Language
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem" }}>
          {languageOptions.map((code) => {
            const active = languageFilters.includes(code);
            return (
              <button
                key={code}
                style={chipStyle(active)}
                onClick={() => {
                  onChange({
                    ...state,
                    languageFilters: active
                      ? languageFilters.filter((c) => c !== code)
                      : [...languageFilters, code],
                  });
                }}
              >
                {languageLabels[code]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Exclude tags */}
      <div style={{ marginTop: "0.9rem" }}>
        <p
          style={{
            fontSize: "0.65rem",
            letterSpacing: "0.3em",
            textTransform: "uppercase",
            color: "#9ca3af",
            marginBottom: "0.3rem",
          }}
        >
          Exclude tags
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem", flexWrap: "wrap" }}>
          {/* Quick toggles for common exclusions */}
          {["mouth_sounds", "roleplay", "visual_asmr", "white_noise"].map((tag) => {
            const active = excludeTags.includes(tag);
            return (
              <button
                key={tag}
                style={chipStyle(active)}
                onClick={() => {
                  onChange({
                    ...state,
                    excludeTags: active
                      ? excludeTags.filter((t) => t !== tag)
                      : [...excludeTags, tag],
                  });
                }}
              >
                {displayTag(tag)}
              </button>
            );
          })}

          {/* Add more via search */}
          <button
            type="button"
            style={chipStyle(false)}
            onClick={() => {
              setExcludeSearchOpen(true);
              setExcludeQuery("");
            }}
          >
            + Add tag
          </button>
        </div>

        {excludeSearchOpen && (
          <div
            style={{
              marginTop: "0.5rem",
              borderRadius: "0.75rem",
              border: "1px solid #1f2937",
              background: "#020617",
              padding: "0.6rem 0.75rem",
            }}
          >
            <input
              type="text"
              autoFocus
              placeholder="Search tags to exclude..."
              value={excludeQuery}
              onChange={(e) => setExcludeQuery(e.target.value)}
              style={{
                width: "100%",
                padding: "0.35rem 0.5rem",
                borderRadius: "0.5rem",
                border: "1px solid #4b5563",
                background: "#020617",
                color: "#e5e7eb",
                fontSize: "0.75rem",
                marginBottom: "0.4rem",
              }}
            />
            <div style={{ maxHeight: "180px", overflowY: "auto" }}>
              {filteredExcludeOptions.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => {
                    onChange({
                      ...state,
                      excludeTags: [...excludeTags, tag],
                    });
                    setExcludeSearchOpen(false);
                    setExcludeQuery("");
                  }}
                  style={{
                    display: "block",
                    width: "100%",
                    textAlign: "left",
                    padding: "0.3rem 0.3rem",
                    border: "none",
                    background: "transparent",
                    color: "#cbd5f5",
                    fontSize: "0.75rem",
                    cursor: "pointer",
                  }}
                >
                  {displayTag(tag)}
                </button>
              ))}
              {filteredExcludeOptions.length === 0 && (
                <p
                  style={{
                    fontSize: "0.7rem",
                    color: "#6b7280",
                    margin: 0,
                  }}
                >
                  No matching tags.
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
