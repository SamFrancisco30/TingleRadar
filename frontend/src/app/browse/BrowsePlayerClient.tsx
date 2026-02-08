"use client";

import { useMemo, useState } from "react";
import { InlinePlayer } from "../../components/InlinePlayer";
import { InlinePlaylistControls } from "../../components/InlinePlaylistControls";
import { VideoCard } from "../../components/VideoCard";
import type { ApiVideo } from "./page";
import { normalizeVideo } from "../../lib/videoModel";

export type BrowsePlayerClientProps = {
  items: ApiVideo[];
};

export function BrowsePlayerClient({ items }: BrowsePlayerClientProps) {
  const normalizedItems = useMemo(() => items.map((v) => normalizeVideo(v)), [items]);
  const videoIds = useMemo(() => normalizedItems.map((v) => v.youtubeId), [normalizedItems]);
  const [showInlinePlayer, setShowInlinePlayer] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const size = normalizedItems.length;

  const handleToggle = () => {
    if (!size) return;
    if (!showInlinePlayer) {
      setCurrentIndex(0);
      setShowInlinePlayer(true);
    } else {
      setShowInlinePlayer(false);
    }
  };

  const handlePrev = () => {
    setCurrentIndex((i) => Math.max(0, i - 1));
  };

  const handleNext = () => {
    setCurrentIndex((i) => Math.min(size - 1, i + 1));
  };

  const handleCardClick = (index: number) => {
    if (!size) return;
    if (!showInlinePlayer) {
      setShowInlinePlayer(true);
    }
    setCurrentIndex(index);
  };

  return (
    <>
      <InlinePlaylistControls
        size={size}
        currentIndex={currentIndex}
        onPrev={handlePrev}
        onNext={handleNext}
        showInlinePlayer={showInlinePlayer}
        onToggleInlinePlayer={handleToggle}
      />
      {showInlinePlayer && size > 0 && (
        <InlinePlayer
          videoIds={videoIds}
          currentIndex={currentIndex}
          onIndexChange={setCurrentIndex}
        />
      )}

      <div style={{ marginTop: "0.75rem" }}>
        {normalizedItems.map((video, index) => {
          const isActive =
            showInlinePlayer &&
            size > 0 &&
            video.youtubeId === videoIds[currentIndex];
          return (
            <VideoCard
              key={video.youtubeId}
              youtubeId={video.youtubeId}
              title={video.title}
              channelTitle={video.channelTitle}
              thumbnailUrl={video.thumbnailUrl}
              viewCount={video.viewCount}
              likeCount={video.likeCount}
              durationSeconds={video.durationSeconds}
              publishedAt={video.publishedAt}
              typeTags={video.typeTags}
              languageLabel={video.language}
              extraChips={[]}
              active={isActive}
              onPlayClick={() => handleCardClick(index)}
            />
          );
        })}

        {items.length === 0 && (
          <p style={{ fontSize: "0.9rem", color: "#9ca3af" }}>
            No videos found yet. Try again after the next ingestion run.
          </p>
        )}
      </div>
    </>
  );
}
