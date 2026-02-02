"use client";

import { useMemo, useState } from "react";
import { InlinePlayer } from "../../components/InlinePlayer";
import { InlinePlaylistControls } from "../../components/InlinePlaylistControls";
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
    </>
  );
}
