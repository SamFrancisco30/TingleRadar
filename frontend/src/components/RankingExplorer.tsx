"use client";

import { useEffect, useMemo, useRef, useState } from "react";

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
  "roleplay",
];

// Internal tags that should appear as Talking Style filter chips.
const talkingStyleOptions: string[] = [
  "whisper",
  "soft_spoken",
  "no_talking",
];

// Roleplay scenes (only shown when roleplay trigger is active).
const roleplaySceneOptions: string[] = [
  "rp_haircut",
  "rp_cranial",
  "rp_dentist",
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
  rp_haircut: "Haircut",
  rp_cranial: "Cranial nerve exam",
  rp_dentist: "Dentist",
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
  const title = (video.title || "").toLowerCase();
  for (const [code, regex] of languageDetectors) {
    if (regex.test(title)) {
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
  const [triggerFilters, setTriggerFilters] = useState<string[]>([]);
  const [talkingStyleFilters, setTalkingStyleFilters] = useState<string[]>([]);
  const [languageFilters, setLanguageFilters] = useState<string[]>([]);
  const [roleplayScenes, setRoleplayScenes] = useState<string[]>([]);
  const [durationFilter, setDurationFilter] = useState<string | null>(null);
  const [syncState, setSyncState] = useState<"idle" | "syncing" | "success" | "error">("idle");
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [showInlinePlayer, setShowInlinePlayer] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentVideoId, setCurrentVideoId] = useState<string | null>(null);
  const playerContainerRef = useRef<HTMLDivElement | null>(null);
  const playerRef = useRef<any | null>(null);

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
          // Trigger Type: OR within, AND with others
          if (triggerFilters.length > 0 && !triggerFilters.some((tag) => item.type_tags.includes(tag))) {
            return false;
          }
          // Talking Style: OR within, AND with others
          if (talkingStyleFilters.length > 0 && !talkingStyleFilters.some((tag) => item.type_tags.includes(tag))) {
            return false;
          }
          // Roleplay scenes: only when any scene is selected
          if (roleplayScenes.length > 0) {
            // must have base roleplay tag
            if (!item.type_tags.includes("roleplay")) {
              return false;
            }
            // and at least one selected scene tag
            if (!roleplayScenes.some((scene) => item.type_tags.includes(scene))) {
              return false;
            }
          }
          // Language: OR within, AND with others
          if (languageFilters.length > 0 && !languageFilters.includes(item.language)) {
            return false;
          }
          // Duration: single bucket
          if (durationFilter && !filterByDuration(item, durationFilter)) {
            return false;
          }
          return true;
        }),
      })),
    [normalized, triggerFilters, talkingStyleFilters, roleplayScenes, languageFilters, durationFilter]
  );

  const playlistRows = useMemo(() => filtered[0]?.items ?? [], [filtered]);

  const [isMobile, setIsMobile] = useState(false);

  // Track viewport size so we can make the inline player sticky only on mobile.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(max-width: 768px)");
    const handleChange = (event: MediaQueryListEvent | MediaQueryList) => {
      setIsMobile(event.matches);
    };
    // Initial value
    handleChange(mq as any);
    mq.addEventListener("change", handleChange as any);
    return () => mq.removeEventListener("change", handleChange as any);
  }, []);

  // Keep the currently playing video in sync with the filtered list,
  // but only when the inline player is visible.
  useEffect(() => {
    if (!showInlinePlayer) {
      return;
    }
    if (!playlistRows.length) {
      setCurrentVideoId(null);
      setCurrentIndex(0);
      return;
    }
    // Clamp currentIndex to valid range.
    const clampedIndex = Math.min(currentIndex, playlistRows.length - 1);
    if (clampedIndex !== currentIndex) {
      setCurrentIndex(clampedIndex);
      return;
    }
    const nextId = playlistRows[clampedIndex].video.youtube_id;
    if (nextId !== currentVideoId) {
      setCurrentVideoId(nextId);
    }
  }, [playlistRows, currentIndex, currentVideoId, showInlinePlayer]);

  // Initialize and control the YouTube IFrame Player API for inline playback.
  useEffect(() => {
    // When the inline player is hidden, tear down the existing player so
    // that re-opening it creates a fresh instance attached to the new DOM node.
    if (!showInlinePlayer || !currentVideoId) {
      if (playerRef.current && typeof playerRef.current.destroy === "function") {
        playerRef.current.destroy();
        playerRef.current = null;
      }
      return;
    }

    const loadPlayer = () => {
      const YT = (window as any).YT;
      if (!YT || !YT.Player || !playerContainerRef.current) return;

      if (!playerRef.current) {
        playerRef.current = new YT.Player(playerContainerRef.current, {
          videoId: currentVideoId,
          playerVars: {
            autoplay: 1,
            rel: 0,
          },
          events: {
            onStateChange: (event: any) => {
              const ENDED = (window as any).YT?.PlayerState?.ENDED;
              if (ENDED != null && event.data === ENDED) {
                // Auto advance to next video if available.
                setCurrentIndex((idx) => {
                  if (idx < playlistRows.length - 1) {
                    return idx + 1;
                  }
                  return idx;
                });
              }
            },
          },
        });
      } else {
        // If player exists, just load the new video id.
        try {
          playerRef.current.loadVideoById(currentVideoId);
        } catch {
          // no-op
        }
      }
    };

    if (!(window as any).YT || !(window as any).YT.Player) {
      // Load the IFrame API script once.
      const existingScript = document.getElementById("youtube-iframe-api");
      if (!existingScript) {
        const tag = document.createElement("script");
        tag.src = "https://www.youtube.com/iframe_api";
        tag.id = "youtube-iframe-api";
        document.body.appendChild(tag);
      }
      const prev = (window as any).onYouTubeIframeAPIReady;
      (window as any).onYouTubeIframeAPIReady = () => {
        if (typeof prev === "function") prev();
        loadPlayer();
      };
    } else {
      loadPlayer();
    }

    // We intentionally do not destroy the player here so controls remain responsive
    // while the player is visible. Cleanup happens when the component unmounts.
    return () => {
      // Do nothing on dependency change; player is managed globally while visible.
    };
  }, [showInlinePlayer, currentVideoId, playlistRows.length]);

  // Cleanup on unmount.
  useEffect(() => {
    return () => {
      if (playerRef.current && typeof playerRef.current.destroy === "function") {
        playerRef.current.destroy();
      }
    };
  }, []);

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
          {(triggerFilters.length || talkingStyleFilters.length || roleplayScenes.length || languageFilters.length || durationFilter) && (
            <button
              onClick={() => {
                setTriggerFilters([]);
                setTalkingStyleFilters([]);
                setRoleplayScenes([]);
                setLanguageFilters([]);
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
          <p style={{ fontSize: "0.65rem", letterSpacing: "0.3em", textTransform: "uppercase", color: "#9ca3af", marginBottom: "0.3rem" }}>Trigger Type</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem" }}>
            {triggerTypeOptions.map((type) => {
              const active = triggerFilters.includes(type);
              return (
                <button
                  key={type}
                  style={chipStyle(active)}
                  onClick={() =>
                    setTriggerFilters((prev) =>
                      prev.includes(type)
                        ? prev.filter((t) => t !== type)
                        : [...prev, type]
                    )
                  }
                >
                  {typeLabels[type] || type}
                </button>
              );
            })}
          </div>
        </div>
        <div style={{ marginTop: "0.9rem" }}>
          <p style={{ fontSize: "0.65rem", letterSpacing: "0.3em", textTransform: "uppercase", color: "#9ca3af", marginBottom: "0.3rem" }}>Talking style</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem" }}>
            {talkingStyleOptions.map((style) => {
              const active = talkingStyleFilters.includes(style);
              return (
                <button
                  key={style}
                  style={chipStyle(active)}
                  onClick={() =>
                    setTalkingStyleFilters((prev) =>
                      prev.includes(style)
                        ? prev.filter((s) => s !== style)
                        : [...prev, style]
                    )
                  }
                >
                  {typeLabels[style] || displayTag(style)}
                </button>
              );
            })}
          </div>
        </div>
        {triggerFilters.includes("roleplay") && (
          <div style={{ marginTop: "0.9rem" }}>
            <p style={{ fontSize: "0.65rem", letterSpacing: "0.3em", textTransform: "uppercase", color: "#9ca3af", marginBottom: "0.3rem" }}>Roleplay scene</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem" }}>
              {roleplaySceneOptions.map((scene) => {
                const active = roleplayScenes.includes(scene);
                return (
                  <button
                    key={scene}
                    style={chipStyle(active)}
                    onClick={() =>
                      setRoleplayScenes((prev) =>
                        prev.includes(scene)
                          ? prev.filter((s) => s !== scene)
                          : [...prev, scene]
                      )
                    }
                  >
                    {typeLabels[scene] || displayTag(scene)}
                  </button>
                );
              })}
            </div>
          </div>
        )}
        <div style={{ marginTop: "0.9rem" }}>
          <p style={{ fontSize: "0.65rem", letterSpacing: "0.3em", textTransform: "uppercase", color: "#9ca3af", marginBottom: "0.3rem" }}>Language</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem" }}>
            {languageOptions.map((code) => {
              const active = languageFilters.includes(code);
              return (
                <button
                  key={code}
                  style={chipStyle(active)}
                  onClick={() =>
                    setLanguageFilters((prev) =>
                      prev.includes(code)
                        ? prev.filter((c) => c !== code)
                        : [...prev, code]
                    )
                  }
                >
                  {languageLabels[code]}
                </button>
              );
            })}
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
        <button
          onClick={() => {
            if (!playlistRows.length) return;
            if (!showInlinePlayer) {
              setCurrentIndex(0);
              setShowInlinePlayer(true);
            } else {
              setShowInlinePlayer(false);
            }
          }}
          style={{
            borderRadius: "999px",
            border: "1px solid #10b981",
            background: showInlinePlayer ? "#047857" : "transparent",
            color: showInlinePlayer ? "#ecfdf5" : "#6ee7b7",
            padding: "0.35rem 0.85rem",
            fontSize: "0.75rem",
            cursor: playlistRows.length ? "pointer" : "not-allowed",
            opacity: playlistRows.length ? 1 : 0.4,
          }}
          disabled={!playlistRows.length}
        >
          {showInlinePlayer ? "Hide inline player" : "Play filtered list here"}
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

      {showInlinePlayer && currentVideoId && (
        <div
          style={{
            position: isMobile ? "sticky" : "relative",
            top: isMobile ? 0 : undefined,
            zIndex: isMobile ? 40 : 1,
            marginBottom: "1.5rem",
            paddingTop: isMobile ? "0.5rem" : 0,
            background: isMobile
              ? "linear-gradient(180deg, rgba(5,7,10,0.98) 0%, rgba(5,7,10,0.9) 60%, rgba(5,7,10,0) 100%)"
              : "transparent",
          }}
        >
          <div
            style={{
              borderRadius: "1.25rem",
              overflow: "hidden",
              border: "1px solid #1f2937",
              background: "#020617",
            }}
          >
            <div
              style={{
                position: "relative",
                paddingBottom: isMobile ? "56.25%" : "40%",
                height: 0,
              }}
            >
              <div
                ref={playerContainerRef}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "100%",
                }}
              />
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "0.5rem 0.75rem 0.75rem",
                alignItems: "center",
              }}
            >
              <span style={{ fontSize: "0.75rem", color: "#9ca3af" }}>
                Now playing {currentIndex + 1} / {playlistRows.length}
              </span>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button
                  onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
                  disabled={currentIndex <= 0}
                  style={{
                    padding: "0.25rem 0.6rem",
                    fontSize: "0.75rem",
                    borderRadius: "999px",
                    border: "1px solid #4b5563",
                    background: currentIndex <= 0 ? "#020617" : "#020617",
                    color: currentIndex <= 0 ? "#4b5563" : "#e5e7eb",
                    cursor: currentIndex <= 0 ? "not-allowed" : "pointer",
                  }}
                >
                  Prev
                </button>
                <button
                  onClick={() => setCurrentIndex((i) => Math.min(playlistRows.length - 1, i + 1))}
                  disabled={currentIndex >= playlistRows.length - 1}
                  style={{
                    padding: "0.25rem 0.6rem",
                    fontSize: "0.75rem",
                    borderRadius: "999px",
                    border: "1px solid #4b5563",
                    background: currentIndex >= playlistRows.length - 1 ? "#020617" : "#020617",
                    color: currentIndex >= playlistRows.length - 1 ? "#4b5563" : "#e5e7eb",
                    cursor: currentIndex >= playlistRows.length - 1 ? "not-allowed" : "pointer",
                  }}
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
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
              {list.items.map((item, idx) => {
                const isActive =
                  showInlinePlayer &&
                  playlistRows[currentIndex] &&
                  playlistRows[currentIndex].video.youtube_id === item.video.youtube_id;
                return (
                <article
                  key={item.video.youtube_id}
                  onClick={() => {
                    if (!showInlinePlayer) {
                      setShowInlinePlayer(true);
                    }
                    setCurrentIndex(idx);
                  }}
                  className="video-card"
                  style={{
                    display: "flex",
                    gap: "1rem",
                    marginBottom: "1rem",
                    padding: "1rem",
                    borderRadius: "1.25rem",
                    border: isActive ? "1px solid #4ade80" : "1px solid #1e293b",
                    background: isActive ? "rgba(22, 163, 74, 0.16)" : "rgba(15, 23, 42, 0.75)",
                    boxShadow: "0 15px 40px rgba(2, 6, 23, 0.55)",
                    alignItems: "center",
                  }}
                >
                  <div className="video-card-thumbnail" style={{ minWidth: "180px", maxWidth: "220px" }}>
                    <img
                      src={item.video.thumbnail_url}
                      alt={item.video.title}
                      style={{
                        width: "100%",
                        height: "auto",
                        aspectRatio: "16 / 9",
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
              )})}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
