"use client";

export type FilterState = {
  duration: string | null;
  triggerFilters: string[];
  talkingStyleFilters: string[];
  roleplayScenes: string[];
  languageFilters: string[];
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
  onChange: (next: FilterState) => void;
};

export function FilterPanel({ state, onChange }: FilterPanelProps) {
  const { duration, triggerFilters, talkingStyleFilters, roleplayScenes, languageFilters } = state;

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
          {triggerTypeOptions.map((type) => {
            const active = triggerFilters.includes(type);
            return (
              <button
                key={type}
                style={chipStyle(active)}
                onClick={() => {
                  const next = active
                    ? triggerFilters.filter((t) => t !== type)
                    : [...triggerFilters, type];
                  // If roleplay is turned off, also clear roleplay scenes.
                  onChange({
                    ...state,
                    triggerFilters: next,
                    roleplayScenes:
                      type === "roleplay" && active
                        ? []
                        : state.roleplayScenes,
                  });
                }}
              >
                {displayTag(type)}
              </button>
            );
          })}
        </div>
      </div>

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
                    const next = active
                      ? roleplayScenes.filter((s) => s !== scene)
                      : [...roleplayScenes, scene];
                    onChange({
                      ...state,
                      roleplayScenes: next,
                    });
                  }}
                >
                  {displayTag(scene)}
                </button>
              );
            })}
          </div>
        </div>
      )}

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
                  const next = active
                    ? languageFilters.filter((c) => c !== code)
                    : [...languageFilters, code];
                  onChange({
                    ...state,
                    languageFilters: next,
                  });
                }}
              >
                {languageLabels[code]}
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}
