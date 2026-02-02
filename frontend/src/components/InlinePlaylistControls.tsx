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
        Playlist size: {size} videos
      </span>
      <button
        onClick={onToggleInlinePlayer}
        style={{
          borderRadius: "999px",
          border: "1px solid #4b5563",
          background: showInlinePlayer ? "#111827" : "#020617",
          color: showInlinePlayer ? "#e5e7eb" : "#cbd5f5",
          padding: "0.35rem 0.85rem",
          fontSize: "0.75rem",
          cursor: size ? "pointer" : "not-allowed",
          opacity: size ? 1 : 0.4,
        }}
        disabled={!size}
      >
        {showInlinePlayer ? "Hide inline player" : "Play filtered list here"}
      </button>
      {showInlinePlayer && (
        <>
          <button
            onClick={onPrev}
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
            onClick={onNext}
            disabled={currentIndex >= size - 1}
            style={{
              padding: "0.25rem 0.6rem",
              fontSize: "0.75rem",
              borderRadius: "999px",
              border: "1px solid #4b5563",
              background: currentIndex >= size - 1 ? "#020617" : "#020617",
              color: currentIndex >= size - 1 ? "#4b5563" : "#e5e7eb",
              cursor: currentIndex >= size - 1 ? "not-allowed" : "pointer",
            }}
          >
            Next
          </button>
          <span style={{ fontSize: "0.75rem", color: "#9ca3b8" }}>
            Now playing {size === 0 ? 0 : currentIndex + 1} / {size}
          </span>
        </>
      )}
    </div>
  );
}
