"use client";

import { useMemo, useState } from "react";

const durationBuckets = [
  { id: "short", label: "2-5 min", min: 120, max: 300 },
  { id: "medium", label: "5-15 min", min: 300, max: 900 },
  { id: "long", label: "15+ min", min: 900 },
];

// Keyword-based fallback rules for when the backend doesn't provide computed_tags.
// Keys here are internal tag ids (snake_case) so they align with backend tagging.
const typeKeywords: Record<string, string[]> = {
  whisper: ["whisper", "耳语", "whispering"],
  soft_spoken: ["soft spoken", "soft-spoken"],
  no_talking: ["no talking", "no-talking", "不讲话"],

  tapping: ["tapping", "敲击", "knuckle"],
  scratching: ["scratching", "scratch", "抓挠"],
  crinkling: ["crinkle", "crinkling", "包装袋", "塑料袋"],
  brushing: ["brushing", "brush sounds", "耳刷", "hair brushing"],
  ear_cleaning: ["ear cleaning", "ear massage", "耳搔", "耳朵清洁"],
  mouth_sounds: ["mouth sounds", "口腔音", "tongue clicking"],
  white_noise: ["white noise", "fan noise", "air conditioner", "雨声", "rain sounds"],
  binaural: ["binaural", "3dio", "双耳"],
  visual_asmr: ["visual asmr", "light triggers", "hand movements", "tracing", "visual triggers"],
  layered: ["layered asmr", "layered sounds", "soundscape", "multi-layer"],

  roleplay: ["roleplay", "r.p", "场景", "girlfriend roleplay", "doctor roleplay"],
};

// Internal tags that should appear as Type filter chips.
const triggerTypeOptions: string[] = [
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
  "whisper",
  "soft_spoken",
  "no_talking",
  "roleplay",
];

// Human-friendly labels for internal tag ids.
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
};

const languageDetectors: [string, RegExp][] = [
  ["ja", /[\u3040-\u30ff\u31f0-\u31ff]/],
  ["ko", /[\uac00-\ud7af]/],
  ["zh", /[\u4e00-\u9fff]/],
];

const languageLabels: Record<string, string> = {
  en: "English",
  ja: "Japanese",
  ko: "Korean",
  zh: "Chinese",
};

// Display helper: convert internal tag ids (snake_case) to human-friendly labels.
const displayTag = (tag: string): string => {
  if (typeLabels[tag]) return typeLabels[tag];
  // Fallback: split on underscore and capitalize first letter of each word.
  return tag
    .split("_")
    .map((part) => (part ? part[0].toUpperCase() + part.slice(1) : ""))
    .join(" ");
};

const chipStyle = (active?: boolean) => ({
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

type RankingItem = {
  rank: number;
  score: number;
  video: {
    youtube_id: string;
    title: string;
    channel_title: string;
    thumbnail_url: string;
    view_count: number;
    like_count: number;
    description?: string | null;
    duration?: number | null;
    tags?: string[] | null;
    computed_tags?: string[];
  };
};

type RankingList = {
  name: string;
  description: string;
  published_at: string;
  items: RankingItem[];
};

const getSearchBag = (video: RankingItem["video"]) => {
  const { title, description, tags } = video;
  return [title, description, ...(tags ?? [])].join(" ").toLowerCase();
};

const detectTypeTags = (video: RankingItem["video"]): string[] => {
  const bag = getSearchBag(video);
  return Object.entries(typeKeywords)
    .filter(([, keywords]) => keywords.some((keyword) => bag.includes(keyword)))
    .map(([key]) => key);
};

const detectLanguage = (video: RankingItem["video"]): string => {
  const bag = getSearchBag(video);
  for (const [code, regex] of languageDetectors) {
    if (regex.test(bag)) {
      return code;
    }
  }
  return "en";
};

const filterByDuration = (item: RankingItem, bucketId: string) => {
  const duration = item.video.duration ?? 0;
  const bucket = durationBuckets.find((b) => b.id === bucketId);
  if (!bucket) {
    return true;
  }

  if (bucket.max) {
    return duration >= bucket.min && duration < bucket.max;
  }

  return duration >= bucket.min;
};

const languageOptions = ["en", "ja", "ko", "zh"];

export function RankingExplorer({ rankings }: { rankings: RankingList[] }) {
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [languageFilter, setLanguageFilter] = useState<string | null>(null);
  const [durationFilter, setDurationFilter] = useState<string | null>(null);
  const [syncState, setSyncState] = useState<"idle" | "syncing" | "success" | "error">("idle");
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  const normalized = useMemo(
    () =>
      rankings.map((list) => ({
        ...list,
        items: list.items.map((item) => {
          const computed = (item.video as any).computed_tags as string[] | undefined;
          const typeTags = computed && computed.length ? computed : detectTypeTags(item.video);
          return {
            ...item,
            type_tags: typeTags,
            language: detectLanguage(item.video),
          };
        }),
      })),
    [rankings]
  );

  const filtered = useMemo(
    () =>
      normalized.map((list) => ({
        ...list,
        items: list.items.filter((item) => {
          if (typeFilter && !item.type_tags.includes(typeFilter)) {
            return false;
          }
          if (languageFilter && item.language !== languageFilter) {
            return false;
          }
          if (durationFilter && !filterByDuration(item, durationFilter)) {
            return false;
          }
          return true;
        }),
      })),
    [normalized, typeFilter, languageFilter, durationFilter]
  );

  const playlistRows = filtered[0]?.items ?? [];

  const playlistName = filtered[0]?.name ?? "TingleRadar Weekly Playlist";
  const playlistDescription = filtered[0]?.description ?? "Weekly ASMR playlist curated by TingleRadar.";

  const parseResponseError = async (response: Response) => {
    try {
      const payload = await response.json();
      if (payload?.detail) {
        return payload.detail;
      }
      if (payload?.message) {
        return payload.message;
      }
      return response.statusText || "YouTube request failed";
    } catch (err) {
      return response.statusText || "YouTube request failed";
    }
  };

  const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || "";

  const handlePushToYouTube = async () => {
    if (!playlistRows.length) {
      return;
    }
    setSyncState("syncing");
    setSyncMessage(null);
    try {
      const statusResponse = await fetch(`${API_BASE}/youtube/status`);
      if (!statusResponse.ok) {
        throw new Error(await parseResponseError(statusResponse));
      }
      const statusData = await statusResponse.json();
      if (!statusData.authorized) {
        window.location.href = `${API_BASE}/youtube/auth`;
        return;
      }
      const payload = {
        title: playlistName,
        description: playlistDescription,
        video_ids: playlistRows.map((item) => item.video.youtube_id),
      };
      const syncResponse = await fetch(`${API_BASE}/playlists/weekly/sync`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!syncResponse.ok) {
        throw new Error(await parseResponseError(syncResponse));
      }
      const syncData = await syncResponse.json();
      setSyncState("success");
      setSyncMessage(`YouTube playlist updated · ${syncData.playlist_url}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "YouTube sync failed";
      setSyncState("error");
      setSyncMessage(message);
    }
  };

  return (
    <div>
      <div style={{
        borderRadius: "1.5rem",
        border: "1px solid #1f2937",
        background: "rgba(15, 23, 42, 0.6)",
        padding: "1.25rem",
        marginBottom: "1rem",
        backdropFilter: "blur(10px)",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div>
            <p style={{ fontSize: "0.6rem", letterSpacing: "0.3em", textTransform: "uppercase", color: "#94a3b8", margin: 0 }}>Filter by</p>
            <p style={{ margin: "0.25rem 0 0", fontSize: "0.9rem", color: "#cbd5f5" }}>Tap a chip to narrow the leaderboard</p>
          </div>
          {(typeFilter || languageFilter || durationFilter) && (
            <button
              onClick={() => {
                setTypeFilter(null);
                setLanguageFilter(null);
                setDurationFilter(null);
              }}
              style={{
                border: "1px solid #475569",
                background: "transparent",
                color: "#cbd5f5",
                padding: "0.4rem 0.9rem",
                borderRadius: "999px",
                fontSize: "0.7rem",
                cursor: "pointer",
              }}
            >
              Clear filters
            </button>
          )}
        </div>
        <div style={{ marginTop: "0.9rem" }}>
          <p style={{ fontSize: "0.65rem", letterSpacing: "0.3em", textTransform: "uppercase", color: "#9ca3af", marginBottom: "0.3rem" }}>Duration</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
            {durationBuckets.map((bucket) => (
              <button
                key={bucket.id}
                style={chipStyle(durationFilter === bucket.id)}
                onClick={() => setDurationFilter(durationFilter === bucket.id ? null : bucket.id)}
              >
                {bucket.label}
              </button>
            ))}
          </div>
        </div>
        <div style={{ marginTop: "0.9rem" }}>
          <p style={{ fontSize: "0.65rem", letterSpacing: "0.3em", textTransform: "uppercase", color: "#9ca3af", marginBottom: "0.3rem" }}>Type</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem" }}>
            {triggerTypeOptions.map((type) => (
              <button
                key={type}
                style={chipStyle(typeFilter === type)}
                onClick={() => setTypeFilter(typeFilter === type ? null : type)}
              >
                {typeLabels[type] || type}
              </button>
            ))}
          </div>
        </div>
        <div style={{ marginTop: "0.9rem" }}>
          <p style={{ fontSize: "0.65rem", letterSpacing: "0.3em", textTransform: "uppercase", color: "#9ca3af", marginBottom: "0.3rem" }}>Language</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem" }}>
            {languageOptions.map((code) => (
              <button
                key={code}
                style={chipStyle(languageFilter === code)}
                onClick={() => setLanguageFilter(languageFilter === code ? null : code)}
              >
                {languageLabels[code]}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", alignItems: "center", marginBottom: "1.25rem" }}>
        <span style={{ fontSize: "0.8rem", color: "#cbd5f5" }}>Playlist size: {playlistRows.length} videos</span>
        <button
          onClick={handlePushToYouTube}
          style={{
            borderRadius: "999px",
            border: "1px solid #2563eb",
            background: syncState === "syncing" ? "#1d4ed8" : "#2563eb",
            color: "#fff",
            padding: "0.35rem 0.85rem",
            fontSize: "0.75rem",
            cursor: playlistRows.length && syncState !== "syncing" ? "pointer" : "not-allowed",
          }}
          disabled={!playlistRows.length || syncState === "syncing"}
        >
          {syncState === "syncing" ? "Syncing..." : "Push to YouTube"}
        </button>
      </div>
      {syncMessage && (
        <p
          style={{
            fontSize: "0.75rem",
            marginTop: "0.15rem",
            color: syncState === "error" ? "#f87171" : "#34d399",
          }}
        >
          {syncMessage}
        </p>
      )}
      <div className="space-y-8">
        {filtered.map((list) => (
          <section key={list.name} style={{ marginBottom: "2rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h2 style={{ fontSize: "1.75rem", margin: 0 }}>{list.name}</h2>
                <p style={{ color: "#94a3b8" }}>{list.description}</p>
              </div>
              <span style={{ fontSize: "0.9rem", color: "#94a3b8" }}>
                {new Date(list.published_at).toLocaleDateString()}
              </span>
            </div>
            <div style={{ marginTop: "1rem" }}>
              {list.items.map((item) => (
                <article
                  key={item.video.youtube_id}
                  style={{
                    display: "flex",
                    gap: "1rem",
                    marginBottom: "1rem",
                    padding: "1rem",
                    borderRadius: "1.25rem",
                    border: "1px solid #1e293b",
                    background: "rgba(15, 23, 42, 0.75)",
                    boxShadow: "0 15px 40px rgba(2, 6, 23, 0.55)",
                    alignItems: "center",
                  }}
                >
                  <div style={{ minWidth: "120px", maxWidth: "140px" }}>
                    <img
                      src={item.video.thumbnail_url}
                      alt={item.video.title}
                      style={{
                        width: "100%",
                        height: "74px",
                        objectFit: "cover",
                        borderRadius: "1rem",
                        filter: "brightness(0.9)",
                      }}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ letterSpacing: "0.3em", fontSize: "0.65rem", color: "#475569" }}>#{item.rank}</p>
                    <a
                      href={`https://youtube.com/watch?v=${item.video.youtube_id}`}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        color: "#c084fc",
                        fontSize: "1.2rem",
                        fontWeight: 600,
                        textDecoration: "none",
                      }}
                    >
                      {item.video.title}
                    </a>
                    <div style={{ color: "#94a3b8", marginTop: "0.25rem" }}>{item.video.channel_title}</div>
                    <div style={{ fontSize: "0.85rem", color: "#94a3b8" }}>
                      Views {item.video.view_count.toLocaleString()} · Likes {item.video.like_count.toLocaleString()}
                    </div>
                    <div style={{ marginTop: "0.5rem", display: "flex", flexWrap: "wrap", gap: "0.35rem" }}>
                      {item.type_tags.map((tag) => (
                        <span
                          key={tag}
                          style={{
                            fontSize: "0.65rem",
                            borderRadius: "999px",
                            border: "1px solid #475569",
                            padding: "0.2rem 0.6rem",
                            color: "#cbd5f5",
                          }}
                        >
                          {displayTag(tag)}
                        </span>
                      ))}
                      <span
                        style={{
                          fontSize: "0.65rem",
                          borderRadius: "999px",
                          border: "1px solid #475569",
                          padding: "0.2rem 0.6rem",
                          color: "#cbd5f5",
                        }}
                      >
                        {languageLabels[item.language] || "English"}
                      </span>
                      <span
                        style={{
                          fontSize: "0.65rem",
                          borderRadius: "999px",
                          border: "1px solid #475569",
                          padding: "0.2rem 0.6rem",
                          color: "#cbd5f5",
                        }}
                      >
                        {item.video.duration ? `${Math.round(item.video.duration / 60)} min` : "Unknown"}
                      </span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
