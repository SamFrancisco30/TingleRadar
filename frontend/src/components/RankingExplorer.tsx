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

const rankingTypeOptions = Object.keys(typeKeywords);
const languageOptions = ["en", "ja", "ko", "zh"];

export function RankingExplorer({ rankings }: { rankings: RankingList[] }) {
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

  const playlistRows = normalized[0]?.items ?? [];
  const playlistName = normalized[0]?.name ?? "TingleRadar Weekly Playlist";
  const playlistDescription = normalized[0]?.description ?? "Weekly ASMR playlist curated by TingleRadar.";

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
          borderRadius: "1.5rem",
          border: "1px solid #1f2937",
          background: "rgba(15, 23, 42, 0.6)",
          padding: "1.25rem",
          marginBottom: "1.25rem",
          backdropFilter: "blur(10px)",
        }}
      >
        <p
          style={{
            fontSize: "0.75rem",
            color: "#cbd5f5",
            margin: 0,
            marginBottom: "0.5rem",
          }}
        >
          Push the current weekly ranking to a private YouTube playlist.
        </p>
        <p
          style={{
            fontSize: "0.7rem",
            color: "#9ca3af",
            margin: 0,
            marginBottom: "0.75rem",
          }}
        >
          This feature requires YouTube authorization. The first click will take you to Google to authorize;
          after authorization, come back and click &quot;Push to YouTube&quot; again to actually update the playlist.
        </p>
        <button
          onClick={handlePushToYouTube}
          style={{
            borderRadius: "999px",
            border: "1px solid #2563eb",
            background: syncState === "syncing" ? "#1d4ed8" : "#2563eb",
            color: "#fff",
            padding: "0.4rem 1rem",
            fontSize: "0.8rem",
            cursor: playlistRows.length && syncState !== "syncing" ? "pointer" : "not-allowed",
          }}
          disabled={!playlistRows.length || syncState === "syncing"}
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
      <div className="space-y-8">
        {normalized.map((list) => (
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
