"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { VideoCard } from "./VideoCard";
import {
  FilterPanel,
  FilterState,
  durationBuckets,
} from "./FilterPanel";
import { FilterHeader } from "./FilterHeader";
import { detectLanguage, detectTypeTags, type BasicVideoFromApi } from "../lib/videoModel";

type RankingItem = {
  rank: number;
  score: number;
  video: BasicVideoFromApi;
};

type RankingList = {
  id: number;
  name: string;
  description: string;
  published_at: string;
  items: RankingItem[];
};

const filterByDuration = (item: RankingItem, bucketId: string) => {
  const duration = item.video.duration ?? 0;
  const bucket = durationBuckets.find((b) => b.id === bucketId);
  if (!bucket) {
    return true;
  }

  if ((bucket as any).max) {
    return duration >= (bucket as any).min && duration < (bucket as any).max;
  }

  return duration >= (bucket as any).min;
};

export function RankingExplorer({ ranking }: { ranking: RankingList }) {
  // Filters apply over a single latest weekly list; older weeks are kept only
  // for historical analysis and aren't exposed in the main UI.
  const [filters, setFilters] = useState<FilterState>({
    duration: null,
    triggerFilters: [],
    talkingStyleFilters: [],
    roleplayScenes: [],
    languageFilters: [],
    excludeTags: [],
  });
  const [syncState, setSyncState] = useState<"idle" | "syncing" | "success" | "error">("idle");
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [showInlinePlayer, setShowInlinePlayer] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentVideoId, setCurrentVideoId] = useState<string | null>(null);
  const playerContainerRef = useRef<HTMLDivElement | null>(null);
  const playerRef = useRef<any | null>(null);

  const normalized = useMemo(
    () => ({
      ...ranking,
      items: ranking.items.map((item) => {
        const computed = (item.video as any).computed_tags as string[] | undefined;
        const typeTags = computed && computed.length ? computed : detectTypeTags(item.video);
        return {
          ...item,
          type_tags: typeTags,
          language: detectLanguage(item.video),
        } as RankingItem & { type_tags: string[]; language: string };
      }),
    }),
    [ranking]
  );

  const filtered = useMemo(
    () => ({
      ...normalized,
      items: normalized.items.filter((item: any) => {
          const {
            triggerFilters,
            talkingStyleFilters,
            roleplayScenes,
            languageFilters,
            duration,
            excludeTags,
          } = filters;

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
          // Excluded tags: if any selected exclude tag is present, drop the item.
          if (excludeTags.length > 0 && excludeTags.some((tag) => item.type_tags.includes(tag))) {
            return false;
          }
          // Language: OR within, AND with others
          if (languageFilters.length > 0 && !languageFilters.includes(item.language)) {
            return false;
          }
          // Duration: single bucket
          if (duration && !filterByDuration(item, duration)) {
            return false;
          }
          return true;
        }),
      }),
    [normalized, filters]
  );

  const playlistRows = useMemo(() => filtered.items ?? [], [filtered]);

  const [isMobile, setIsMobile] = useState(false);

  // Track viewport size so we can adapt inline player behavior for mobile vs desktop.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(max-width: 768px)");
    const handleChange = (event: MediaQueryListEvent | MediaQueryList) => {
      setIsMobile((event as MediaQueryList).matches ?? (event as MediaQueryListEvent).matches);
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

  const playlistName = filtered.name ?? "TingleRadar Weekly Playlist";
  const playlistDescription = filtered.description ?? "Weekly ASMR playlist curated by TingleRadar.";

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

  const env = process.env.NEXT_PUBLIC_TINGLE_ENV ?? "product";
  const API_BASE =
    env === "test"
      ? process.env.NEXT_PUBLIC_BACKEND_URL_TEST ?? "http://localhost:8000"
      : process.env.NEXT_PUBLIC_BACKEND_URL || "";

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
        video_ids: playlistRows.map((item: any) => item.video.youtube_id),
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

  const hasAnyFilter =
    filters.duration !== null ||
    filters.triggerFilters.length > 0 ||
    filters.talkingStyleFilters.length > 0 ||
    filters.roleplayScenes.length > 0 ||
    filters.languageFilters.length > 0;

  const [filtersCollapsed, setFiltersCollapsed] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(max-width: 768px)");
    const isMobileInitial = mq.matches;
    setFiltersCollapsed(isMobileInitial);
  }, []);

  const activeCount =
    (filters.duration ? 1 : 0) +
    filters.triggerFilters.length +
    filters.talkingStyleFilters.length +
    filters.roleplayScenes.length +
    filters.languageFilters.length;

  return (
    <div>
      <div
        style={{
          borderRadius: "1.5rem",
          border: "1px solid #1f2937",
          background: "rgba(15, 23, 42, 0.6)",
          padding: "1.25rem",
          marginBottom: "1rem",
          backdropFilter: "blur(10px)",
        }}
      >
        <FilterHeader
          label="Filter catalog"
          activeCount={activeCount}
          hasAnyFilter={hasAnyFilter}
          filtersCollapsed={filtersCollapsed}
          hasBody={!filtersCollapsed}
          onToggleCollapsed={() => setFiltersCollapsed((v) => !v)}
          onClear={
            hasAnyFilter
              ? () =>
                  setFilters({
                    duration: null,
                    triggerFilters: [],
                    talkingStyleFilters: [],
                    roleplayScenes: [],
                    languageFilters: [],
                    excludeTags: [],
                  })
              : undefined
          }
        />

        {!filtersCollapsed && <FilterPanel state={filters} onChange={setFilters} />}
      </div>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "0.75rem",
          alignItems: "center",
          marginBottom: "1.25rem",
        }}
      >
        <span style={{ fontSize: "0.8rem", color: "#cbd5f5" }}>
          Playlist size: {playlistRows.length} videos
        </span>
        <button
          onClick={handlePushToYouTube}
          style={{
            borderRadius: "999px",
            border: "1px solid #8b5cf6",
            background: syncState === "syncing" ? "#6d28d9" : "#4c1d95",
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
            border: "1px solid #4b5563",
            background: showInlinePlayer ? "#111827" : "#020617",
            color: showInlinePlayer ? "#e5e7eb" : "#cbd5f5",
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
            zIndex: 40,
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
                paddingBottom: isMobile ? "56.25%" : "56.25%",
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
              <span style={{ fontSize: "0.75rem", color: "#9ca3b8" }}>
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
        <section key={filtered.id} style={{ marginBottom: "2rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <h2
                style={{
                  fontSize: "1.6rem", // slightly smaller to avoid wrapping on mobile
                  margin: 0,
                  whiteSpace: "nowrap",
                }}
              >
                Weekly Tingles
              </h2>
            </div>
          </div>
          <div style={{ marginTop: "1rem" }}>
            {filtered.items.map((item: any, idx: number) => {
              const isActive =
                showInlinePlayer &&
                playlistRows[currentIndex] &&
                playlistRows[currentIndex].video.youtube_id === item.video.youtube_id;
              return (
                <VideoCard
                  key={item.video.youtube_id}
                  youtubeId={item.video.youtube_id}
                  title={item.video.title}
                  channelTitle={item.video.channel_title}
                  thumbnailUrl={item.video.thumbnail_url}
                  viewCount={item.video.view_count}
                  likeCount={item.video.like_count}
                  durationSeconds={item.video.duration}
                  publishedAt={item.video.published_at}
                  rank={item.rank}
                  typeTags={item.type_tags}
                  languageLabel={item.language}
                  extraChips={[]}
                  active={isActive}
                  onPlayClick={() => {
                    if (!showInlinePlayer) {
                      setShowInlinePlayer(true);
                    }
                    setCurrentIndex(idx);
                  }}
                />
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
