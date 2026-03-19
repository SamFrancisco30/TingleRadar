"use client";

import { useEffect, useMemo, useRef, useState } from "react";

export type FilterState = {
  duration: string | null;
  triggerFilters: string[];
  talkingStyleFilters: string[];
  roleplayScenes: string[];
  languageFilters: string[];
  excludeTags: string[];
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
  "roleplay",
];

const ROLEPLAY_TRIGGER_ID = "roleplay";

export const talkingStyleOptions: string[] = ["whisper", "soft_spoken", "no_talking"];

export const roleplaySceneOptions: string[] = ["rp_haircut", "rp_cranial", "rp_dentist"];

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
  padding: "0.42rem 0.8rem",
  borderRadius: "999px",
  border: "1px solid",
  borderColor: active ? "rgba(141, 196, 177, 0.3)" : "rgba(148, 184, 171, 0.14)",
  background: active ? "rgba(86, 149, 129, 0.22)" : "rgba(13, 24, 29, 0.92)",
  color: active ? "#f1f7f3" : "var(--text-1)",
  fontSize: "0.75rem",
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

type FilterSectionProps = {
  title: string;
  children: React.ReactNode;
};

function FilterSection({ title, children }: FilterSectionProps) {
  return (
    <div className="filter-group">
      <p className="filter-group-title">{title}</p>
      {children}
    </div>
  );
}

export function FilterPanel({ state, onChange }: FilterPanelProps) {
  const { duration, triggerFilters, talkingStyleFilters, roleplayScenes, languageFilters, excludeTags } =
    state;

  const [excludeSearchOpen, setExcludeSearchOpen] = useState(false);
  const [excludeQuery, setExcludeQuery] = useState("");
  const excludePanelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!excludeSearchOpen) return;

    const handleClick = (event: MouseEvent) => {
      if (!excludePanelRef.current) return;
      if (!excludePanelRef.current.contains(event.target as Node)) {
        setExcludeSearchOpen(false);
        setExcludeQuery("");
      }
    };

    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [excludeSearchOpen]);

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
    <div className="filter-panel-grid">
      <FilterSection title="Duration">
        <div className="chip-row">
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
      </FilterSection>

      <FilterSection title="Trigger Type">
        <div className="chip-row">
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
      </FilterSection>

      <FilterSection title="Roleplay">
        <div className="chip-row">
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
                roleplayScenes: active ? [] : state.roleplayScenes,
              });
            }}
          >
            {displayTag(ROLEPLAY_TRIGGER_ID)}
          </button>
        </div>
      </FilterSection>

      {(triggerFilters.includes("roleplay") || roleplayScenes.length > 0) && (
        <FilterSection title="Roleplay scene">
          <div className="chip-row">
            {roleplaySceneOptions.map((scene) => {
              const active = roleplayScenes.includes(scene);
              return (
                <button
                  key={scene}
                  style={chipStyle(active)}
                  onClick={() => {
                    if (active) {
                      onChange({
                        ...state,
                        roleplayScenes: roleplayScenes.filter((s) => s !== scene),
                      });
                    } else {
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
        </FilterSection>
      )}

      <FilterSection title="Talking style">
        <div className="chip-row">
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
      </FilterSection>

      <FilterSection title="Language">
        <div className="chip-row">
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
      </FilterSection>

      <FilterSection title="Exclude tags">
        <div className="chip-row">
          {excludeTags.map((tag) => (
            <button
              key={tag}
              style={chipStyle(true)}
              onClick={() => {
                onChange({
                  ...state,
                  excludeTags: excludeTags.filter((t) => t !== tag),
                });
              }}
            >
              {displayTag(tag)}
            </button>
          ))}

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
            ref={excludePanelRef}
            style={{
              marginTop: "0.6rem",
              borderRadius: "1rem",
              border: "1px solid rgba(148, 184, 171, 0.12)",
              background: "rgba(7, 15, 19, 0.92)",
              padding: "0.6rem 0.75rem",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: "0.5rem",
                marginBottom: "0.35rem",
              }}
            >
              <input
                type="text"
                autoFocus
                placeholder="Search tags to exclude..."
                value={excludeQuery}
                onChange={(e) => setExcludeQuery(e.target.value)}
                className="input-shell"
                style={{ flex: 1, fontSize: "0.8rem" }}
              />
              <button
                type="button"
                onClick={() => {
                  setExcludeSearchOpen(false);
                  setExcludeQuery("");
                }}
                className="ghost-button"
                style={{ minHeight: "1.9rem", padding: "0.25rem 0.7rem", fontSize: "0.72rem" }}
              >
                Done
              </button>
            </div>
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
                  }}
                  style={{
                    display: "block",
                    width: "100%",
                    textAlign: "left",
                    padding: "0.3rem 0.3rem",
                    border: "none",
                    background: "transparent",
                    color: "var(--text-1)",
                    fontSize: "0.78rem",
                    cursor: "pointer",
                  }}
                >
                  {displayTag(tag)}
                </button>
              ))}
              {filteredExcludeOptions.length === 0 && (
                <p style={{ fontSize: "0.72rem", color: "var(--text-3)", margin: 0 }}>
                  No matching tags.
                </p>
              )}
            </div>
          </div>
        )}
      </FilterSection>
    </div>
  );
}
