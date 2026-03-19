"use client";

export type InlinePlaylistControlsProps = {
  size: number;
  currentIndex: number;
  onPrev: () => void;
  onNext: () => void;
  showInlinePlayer: boolean;
  onToggleInlinePlayer: () => void;
};

export function InlinePlaylistControls({
  size,
  currentIndex,
  onPrev,
  onNext,
  showInlinePlayer,
  onToggleInlinePlayer,
}: InlinePlaylistControlsProps) {
  return (
    <div className="toolbar-row" style={{ marginBottom: "1rem" }}>
      <div className="playlist-summary">
        <span className="metric-pill">Playlist size: {size} videos</span>
        {showInlinePlayer && (
          <span className="playlist-status">
            Now playing {size === 0 ? 0 : currentIndex + 1} / {size}
          </span>
        )}
      </div>

      <div className="toolbar-spacer" />

      <button
        onClick={onToggleInlinePlayer}
        className={showInlinePlayer ? "subtle-button" : "primary-button"}
        disabled={!size}
      >
        {showInlinePlayer ? "Hide inline player" : "Play filtered list here"}
      </button>

      {showInlinePlayer && (
        <>
          <button onClick={onPrev} disabled={currentIndex <= 0} className="ghost-button">
            Prev
          </button>
          <button onClick={onNext} disabled={currentIndex >= size - 1} className="ghost-button">
            Next
          </button>
        </>
      )}
    </div>
  );
}
