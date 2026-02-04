"use client";

import { useMemo, useState } from "react";
import { InlinePlayer } from "../../components/InlinePlayer";
import { InlinePlaylistControls } from "../../components/InlinePlaylistControls";
import { VideoCard } from "../../components/VideoCard";
import { displayTag } from "../../components/FilterPanel";
import type { ApiVideo } from "./page";

export type BrowsePlayerClientProps = {
  items: ApiVideo[];
};

export function BrowsePlayerClient({ items }: BrowsePlayerClientProps) {
  const videoIds = useMemo(() => items.map((v) => v.youtube_id), [items]);
  const [showInlinePlayer, setShowInlinePlayer] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const size = videoIds.length;

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
        {items.map((video, index) => {
          const isActive =
            showInlinePlayer &&
            size > 0 &&
            video.youtube_id === videoIds[currentIndex];
          return (
            <VideoCard
              key={video.youtube_id}
              youtubeId={video.youtube_id}
              title={video.title}
              channelTitle={video.channel_title}
              thumbnailUrl={video.thumbnail_url}
              viewCount={video.view_count}
              likeCount={video.like_count}
              durationSeconds={video.duration}
              publishedAt={video.published_at}
              extraChips={video.computed_tags?.map((tag) => displayTag(tag))}
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
