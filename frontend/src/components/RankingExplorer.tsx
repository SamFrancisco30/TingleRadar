"use client";

import { useMemo, useState } from "react";

const typeKeywords: Record<string, string[]> = {
  whisper: ["whisper", "耳语", "whispering"],
  roleplay: ["roleplay", "r.p", "场景"],
  tapping: ["tapping", "tap", "敲击", "knuckle"],
  makeup: ["makeup", "cosmetic", "化妆"],
  "no talking": ["no talking", "silent", "不讲话", "엄마"],
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
        items: list.items.map((item) => ({
          ...item,
          type_tags: detectTypeTags(item.video),
          language: detectLanguage(item.video),
        })),
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
          if (durationFilter) {
            const duration = item.video.duration ?? 0;
            if (durationFilter === "short" && !(duration >= 120 && duration < 300)) return false;
            if (durationFilter === "medium" && !(duration >= 300 && duration < 900)) return false;
            if (durationFilter === "long" && !(duration >= 900)) return false;
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
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 10,
          borderRadius: "1.5rem",
          border: "1px solid #262832",
          background: "#16181E",
          padding: "1.25rem",
          marginBottom: "1.5rem",
          backdropFilter: "blur(12px)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", alignItems: "center" }}>
          <div style={{ flex: 1 }}>
            <p
              style={{
                fontSize: "0.8rem",
                color: "#E2E8F0",
                margin: 0,
                marginBottom: "0.5rem",
              }}
            >
              Filters
            </p>
            <div style={{ marginBottom: "0.35rem" }}>
              <p
                style={{
                  fontSize: "0.7rem",
                  color: "#94A3B8",
                  margin: 0,
                  marginBottom: "0.2rem",
                }}
              >
                Duration
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
                {[
                  { id: "short", label: "2-5 min" },
                  { id: "medium", label: "5-15 min" },
                  { id: "long", label: "15+ min" },
                ].map((bucket) => (
                  <button
                    key={bucket.id}
                    onClick={() => setDurationFilter(durationFilter === bucket.id ? null : bucket.id)}
                    style={{
                      padding: "0.3rem 0.75rem",
                      borderRadius: "999px",
                      border: "1px solid",
                      borderColor: durationFilter === bucket.id ? "#9F7AEA" : "#374151",
                      background: durationFilter === bucket.id ? "rgba(159, 122, 234, 0.18)" : "#111827",
                      color: "#E2E8F0",
                      fontSize: "0.7rem",
                      cursor: "pointer",
                    }}
                  >
                    {bucket.label}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ marginBottom: "0.35rem" }}>
              <p
                style={{
                  fontSize: "0.7rem",
                  color: "#94A3B8",
                  margin: 0,
                  marginBottom: "0.2rem",
                }}
              >
                Type
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
                {Object.keys(typeKeywords).map((type) => (
                  <button
                    key={type}
                    onClick={() => setTypeFilter(typeFilter === type ? null : type)}
                    style={{
                      padding: "0.3rem 0.75rem",
                      borderRadius: "999px",
                      border: "1px solid",
                      borderColor: typeFilter === type ? "#9F7AEA" : "#374151",
                      background: typeFilter === type ? "rgba(159, 122, 234, 0.18)" : "#111827",
                      color: "#E2E8F0",
                      fontSize: "0.7rem",
                      cursor: "pointer",
                    }}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p
                style={{
                  fontSize: "0.7rem",
                  color: "#94A3B8",
                  margin: 0,
                  marginBottom: "0.2rem",
                }}
              >
                Language
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
                {["en", "ja", "ko", "zh"].map((code) => (
                  <button
                    key={code}
                    onClick={() => setLanguageFilter(languageFilter === code ? null : code)}
                    style={{
                      padding: "0.3rem 0.75rem",
                      borderRadius: "999px",
                      border: "1px solid",
                      borderColor: languageFilter === code ? "#9F7AEA" : "#374151",
                      background: languageFilter === code ? "rgba(159, 122, 234, 0.18)" : "#111827",
                      color: "#E2E8F0",
                      fontSize: "0.7rem",
                      cursor: "pointer",
                    }}
                  >
                    {languageLabels[code]}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div style={{ minWidth: "220px" }}>
            <p
              style={{
                fontSize: "0.7rem",
                color: "#94A3B8",
                margin: 0,
                marginBottom: "0.6rem",
              }}
            >
              Push the current filtered weekly ranking to a private YouTube playlist.
              First click authorizes with YouTube; second click updates the playlist.
            </p>
            <button
              onClick={handlePushToYouTube}
              style={{
                borderRadius: "999px",
                border: "1px solid #B19CD9",
                background: syncState === "syncing" ? "#9F7AEA" : "#B19CD9",
                color: "#fff",
                padding: "0.5rem 1.1rem",
                fontSize: "0.8rem",
                cursor: playlistRows.length && syncState !== "syncing" ? "pointer" : "not-allowed",
                transition: "transform 150ms ease, box-shadow 150ms ease, background-color 150ms ease, border-color 150ms ease",
              }}
              disabled={!playlistRows.length || syncState === "syncing"}
              onMouseEnter={(e) => {
                if (!playlistRows.length || syncState === "syncing") return;
                (e.currentTarget as HTMLButtonElement).style.transform = "scale(1.02)";
                (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 0 18px rgba(159, 122, 234, 0.45)";
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#9F7AEA";
                (e.currentTarget as HTMLButtonElement).style.borderColor = "#9F7AEA";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.transform = "scale(1.0)";
                (e.currentTarget as HTMLButtonElement).style.boxShadow = "none";
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = syncState === "syncing" ? "#9F7AEA" : "#B19CD9";
                (e.currentTarget as HTMLButtonElement).style.borderColor = "#B19CD9";
              }}
            >
              {syncState === "syncing" ? "Syncing..." : "Push to YouTube"}
            </button>
            {syncMessage && (
              <p
                style={{
                  fontSize: "0.75rem",
                  marginTop: "0.5rem",
                  color: syncState === "error" ? "#f87171" : "#34d399",
                }}
              >
                {syncMessage}
              </p>
            )}
          </div>
        </div>
      </div>
      <div
        className="space-y-8"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: "1.5rem",
        }}
      >
        {normalized.map((list) => (
          <section key={list.name} style={{ marginBottom: "0" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h2 style={{ fontSize: "1.75rem", margin: 0 }}>{list.name}</h2>
                <p style={{ color: "#94A3B8" }}>{list.description}</p>
              </div>
              <span style={{ fontSize: "0.9rem", color: "#94a3b8" }}>
                {new Date(list.published_at).toLocaleDateString()}
              </span>
            </div>
            <div style={{ marginTop: "0.75rem" }}>
              {list.items.map((item) => (
                <article
                  key={item.video.youtube_id}
                  style={{
                    display: "flex",
                    gap: "1rem",
                    marginBottom: "1rem",
                    padding: "1.15rem",
                    borderRadius: "1.25rem",
                    border: "1px solid #262832",
                    background: "#16181E",
                    boxShadow: "0 18px 40px rgba(0, 0, 0, 0.55)",
                    alignItems: "center",
                    transition: "transform 150ms ease, box-shadow 150ms ease, border-color 150ms ease",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.transform = "scale(1.02)";
                    (e.currentTarget as HTMLElement).style.boxShadow = "0 22px 55px rgba(0, 0, 0, 0.75)";
                    (e.currentTarget as HTMLElement).style.borderColor = "#2f3340";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.transform = "scale(1.0)";
                    (e.currentTarget as HTMLElement).style.boxShadow = "0 18px 40px rgba(0, 0, 0, 0.55)";
                    (e.currentTarget as HTMLElement).style.borderColor = "#262832";
                  }}
                >
                  <div style={{ minWidth: "140px", maxWidth: "170px" }}>
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
                          {tag}
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
