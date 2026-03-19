"use client";

import { useEffect, useMemo, useState } from "react";
import { VideoCard } from "./VideoCard";
import { FilterPanel, FilterState, durationBuckets } from "./FilterPanel";
import { FilterHeader } from "./FilterHeader";
import { detectLanguage, detectTypeTags, type BasicVideoFromApi } from "../lib/videoModel";
import { resolveBackendApiBase } from "../lib/backendApi";
import { InlinePlayer } from "./InlinePlayer";
import { InlinePlaylistControls } from "./InlinePlaylistControls";

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
  const [filtersCollapsed, setFiltersCollapsed] = useState(false);

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

        if (triggerFilters.length > 0 && !triggerFilters.some((tag) => item.type_tags.includes(tag))) {
          return false;
        }
        if (
          talkingStyleFilters.length > 0 &&
          !talkingStyleFilters.some((tag) => item.type_tags.includes(tag))
        ) {
          return false;
        }
        if (roleplayScenes.length > 0) {
          if (!item.type_tags.includes("roleplay")) {
            return false;
          }
          if (!roleplayScenes.some((scene) => item.type_tags.includes(scene))) {
            return false;
          }
        }
        if (excludeTags.length > 0 && excludeTags.some((tag) => item.type_tags.includes(tag))) {
          return false;
        }
        if (languageFilters.length > 0 && !languageFilters.includes(item.language)) {
          return false;
        }
        if (duration && !filterByDuration(item, duration)) {
          return false;
        }
        return true;
      }),
    }),
    [normalized, filters]
  );

  const playlistRows = useMemo(() => filtered.items ?? [], [filtered]);
  const videoIds = useMemo(() => playlistRows.map((item: any) => item.video.youtube_id), [playlistRows]);

  useEffect(() => {
    if (!showInlinePlayer) {
      return;
    }
    if (!playlistRows.length) {
      setCurrentIndex(0);
      return;
    }
    setCurrentIndex((index) => Math.min(index, playlistRows.length - 1));
  }, [playlistRows, showInlinePlayer]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(max-width: 768px)");
    setFiltersCollapsed(mq.matches);
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
    } catch {
      return response.statusText || "YouTube request failed";
    }
  };

  const API_BASE = resolveBackendApiBase();

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

  const activeCount =
    (filters.duration ? 1 : 0) +
    filters.triggerFilters.length +
    filters.talkingStyleFilters.length +
    filters.roleplayScenes.length +
    filters.languageFilters.length;

  return (
    <div className="list-stack">
      <div className="control-panel">
        <FilterHeader
          label="Filter catalog"
          activeCount={activeCount}
          hasAnyFilter={hasAnyFilter}
          filtersCollapsed={filtersCollapsed}
          hasBody={!filtersCollapsed}
          onToggleCollapsed={() => setFiltersCollapsed((value) => !value)}
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

      <div className="surface-panel">
        <div className="section-heading">
          <div>
            <h2 className="section-title">Weekly Tingles</h2>
            <p className="section-copy">
              Move through the freshest list quickly, then let the inline player hold your place.
            </p>
          </div>
          <div className="page-kicker">
            <span className="metric-pill">{playlistRows.length} videos in view</span>
            <span className="metric-pill">Published {new Date(ranking.published_at).toLocaleDateString()}</span>
          </div>
        </div>

        <div className="toolbar-row" style={{ marginBottom: syncMessage ? "0.35rem" : "1rem" }}>
          <InlinePlaylistControls
            size={playlistRows.length}
            currentIndex={currentIndex}
            onPrev={() => setCurrentIndex((i) => Math.max(0, i - 1))}
            onNext={() => setCurrentIndex((i) => Math.min(playlistRows.length - 1, i + 1))}
            showInlinePlayer={showInlinePlayer}
            onToggleInlinePlayer={() => {
              if (!playlistRows.length) return;
              if (!showInlinePlayer) {
                setCurrentIndex(0);
                setShowInlinePlayer(true);
              } else {
                setShowInlinePlayer(false);
              }
            }}
          />

          <button
            onClick={handlePushToYouTube}
            className={syncState === "syncing" ? "subtle-button" : "ghost-button"}
            disabled={!playlistRows.length || syncState === "syncing"}
          >
            {syncState === "syncing" ? "Syncing..." : "Push to YouTube"}
          </button>
        </div>

        {syncMessage && (
          <p
            style={{
              margin: "0 0 1rem",
              fontSize: "0.8rem",
              color: syncState === "error" ? "var(--danger)" : "var(--accent)",
            }}
          >
            {syncMessage}
          </p>
        )}

        {showInlinePlayer && playlistRows.length > 0 && (
          <InlinePlayer videoIds={videoIds} currentIndex={currentIndex} onIndexChange={setCurrentIndex} />
        )}

        <div className="list-stack">
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
      </div>
    </div>
  );
}
