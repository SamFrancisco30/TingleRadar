"use client";

import React, { useState } from "react";

export type VideoCardProps = {
  youtubeId: string;
  title: string;
  channelTitle: string;
  thumbnailUrl?: string | null;
  viewCount: number;
  likeCount: number;
  durationSeconds?: number | null;
  publishedAt?: string | null;
  rank?: number;
  typeTags?: string[];
  languageLabel?: string;
  extraChips?: string[];
  onPlayClick?: () => void;
  active?: boolean;
};

const ROLEPLAY_SCENE_LABELS: Record<string, string> = {
  "Rp Haircut": "Haircut",
  "Rp Cranial": "Cranial nerve exam",
  "Rp Dentist": "Dentist",
};

function formatChipLabel(label: string): string {
  if (ROLEPLAY_SCENE_LABELS[label]) return ROLEPLAY_SCENE_LABELS[label];
  return label;
}

function formatDuration(seconds?: number | null): string {
  if (!seconds) return "Unknown";
  const mins = Math.round(seconds / 60);
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

function formatRelativeDate(dateStr?: string | null): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "";
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const sec = Math.max(0, Math.floor(diffMs / 1000));
  const min = Math.floor(sec / 60);
  const hour = Math.floor(min / 60);
  const day = Math.floor(hour / 24);

  if (day <= 0) {
    if (hour <= 0) return "Just now";
    if (hour === 1) return "1 hour ago";
    return `${hour} hours ago`;
  }
  if (day < 7) {
    if (day === 1) return "1 day ago";
    return `${day} days ago`;
  }
  const week = Math.floor(day / 7);
  if (week < 5) {
    if (week === 1) return "1 week ago";
    return `${week} weeks ago`;
  }
  const month = Math.floor(day / 30);
  if (month < 12) {
    if (month === 1) return "1 month ago";
    return `${month} months ago`;
  }
  const year = Math.floor(day / 365);
  if (year === 1) return "1 year ago";
  return `${year} years ago`;
}

export const VideoCard: React.FC<VideoCardProps> = ({
  youtubeId,
  title,
  channelTitle,
  thumbnailUrl,
  viewCount,
  likeCount,
  durationSeconds,
  publishedAt,
  rank,
  typeTags,
  languageLabel,
  extraChips,
  onPlayClick,
  active,
}) => {
  const Wrapper: React.ElementType = "article";

  const [menuOpen, setMenuOpen] = useState(false);
  const [editTagsMode, setEditTagsMode] = useState(false);
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());

  const getFingerprint = (): string => {
    if (typeof window === "undefined") return "anonymous";
    try {
      const key = "tr_fingerprint";
      let id = window.localStorage.getItem(key);
      if (!id) {
        id = (window.crypto?.randomUUID?.() || Math.random().toString(36).slice(2)) as string;
        window.localStorage.setItem(key, id);
      }
      return id;
    } catch {
      return "anonymous";
    }
  };

  const sendTagVote = async (tagLabel: string, vote: 1 | -1) => {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
    if (!backendUrl) return;
    const tagId = tagLabel; // TODO: 将来这里可以从 display 文案映射回内部 tag id
    try {
      await fetch(`${backendUrl}/videos/${youtubeId}/tags/${encodeURIComponent(tagId)}/vote`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-User-Fingerprint": getFingerprint(),
        },
        body: JSON.stringify({ vote }),
      });
    } catch {
      // 静默失败即可，不打扰用户
    }
  };

  const toggleTagSelection = (tag: string) => {
    setSelectedTags((prev) => {
      const next = new Set(prev);
      if (next.has(tag)) {
        next.delete(tag);
      } else {
        next.add(tag);
      }
      return next;
    });
  };

  const handleDoneEditing = async (e: React.MouseEvent) => {
    e.stopPropagation();
    // 对所有选中 tag 批量 downvote
    await Promise.all(Array.from(selectedTags).map((tag) => sendTagVote(tag, -1)));
    setSelectedTags(new Set());
    setEditTagsMode(false);
  };

  return (
    <Wrapper
      className="video-card"
      style={{
        display: "flex",
        gap: "1rem",
        marginBottom: "1rem",
        padding: "1rem",
        borderRadius: "1.25rem",
        border: active ? "1px solid #4ade80" : "1px solid #1e293b",
        background: active ? "rgba(22, 163, 74, 0.16)" : "rgba(15, 23, 42, 0.75)",
        boxShadow: "0 15px 40px rgba(2, 6, 23, 0.55)",
        alignItems: "center",
        width: "100%",
        textAlign: "left",
        cursor: "default",
        borderColor: active ? "#4ade80" : "#1e293b",
        position: "relative",
      }}
    >
      <div className="video-card-thumbnail" style={{ minWidth: "180px", maxWidth: "220px" }}>
        {thumbnailUrl ? (
          <img
            src={thumbnailUrl}
            alt={title}
            style={{
              width: "100%",
              height: "auto",
              aspectRatio: "16 / 9",
              objectFit: "cover",
              borderRadius: "1rem",
              filter: "brightness(0.9)",
            }}
          />
        ) : (
          <div
            style={{
              width: "100%",
              height: "120px",
              borderRadius: "1rem",
              background: "#020617",
            }}
          />
        )}
      </div>

      <div style={{ flex: 1 }}>
        {typeof rank === "number" && (
          <p style={{ letterSpacing: "0.3em", fontSize: "0.65rem", color: "#475569" }}>#{rank}</p>
        )}
        <a
          href={`https://youtube.com/watch?v=${youtubeId}`}
          target="_blank"
          rel="noreferrer"
          style={{
            color: "#c084fc",
            fontSize: "1.2rem",
            fontWeight: 600,
            textDecoration: "none",
          }}
        >
          {title}
        </a>
        <div style={{ color: "#94a3b8", marginTop: "0.25rem", fontSize: "0.9rem" }}>{channelTitle}</div>
        <div style={{ fontSize: "0.85rem", color: "#9ca3af", marginTop: "0.15rem" }}>
          Views {viewCount.toLocaleString()} · Likes {likeCount.toLocaleString()} · {formatDuration(durationSeconds)}
          {publishedAt && ` · Published ${formatRelativeDate(publishedAt)}`}
        </div>

        {Boolean((typeTags && typeTags.length) || languageLabel || (extraChips && extraChips.length)) && (
          <div
            style={{
              marginTop: "0.5rem",
              display: "flex",
              flexWrap: "wrap",
              gap: "0.35rem",
              position: "relative",
            }}
          >
            {typeTags?.map((tag) => {
              const selected = editTagsMode && selectedTags.has(tag);
              return (
                <button
                  type="button"
                  key={tag}
                  onClick={(e) => {
                    if (!editTagsMode) return;
                    e.stopPropagation();
                    toggleTagSelection(tag);
                  }}
                  style={{
                    fontSize: "0.65rem",
                    borderRadius: "999px",
                    border: "1px solid",
                    borderColor: selected ? "#b91c1c" : "#475569",
                    padding: "0.2rem 0.6rem",
                    color: selected ? "#fecaca" : "#cbd5f5",
                    background: selected ? "#450a0a" : "transparent",
                    cursor: editTagsMode ? "pointer" : "default",
                  }}
                >
                  {tag}
                </button>
              );
            })}
            {languageLabel && (
              <span
                style={{
                  fontSize: "0.65rem",
                  borderRadius: "999px",
                  border: "1px solid #475569",
                  padding: "0.2rem 0.6rem",
                  color: "#cbd5f5",
                }}
              >
                {languageLabel}
              </span>
            )}
            {extraChips?.map((chip) => (
              <span
                key={chip}
                style={{
                  fontSize: "0.65rem",
                  borderRadius: "999px",
                  border: "1px solid #475569",
                  padding: "0.2rem 0.6rem",
                  color: "#cbd5f5",
                }}
              >
                {formatChipLabel(chip)}
              </span>
            ))}
          </div>
        )}

        {/* Footer actions: play + tag feedback */}
        {(onPlayClick || editTagsMode || typeTags) && (
          <div
            style={{
              marginTop: "0.6rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "0.5rem",
            }}
          >
            <div>
              {onPlayClick && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onPlayClick();
                  }}
                  style={{
                    borderRadius: "999px",
                    border: "1px solid #4b5563",
                    background: "#020617",
                    color: "#e5e7eb",
                    fontSize: "0.75rem",
                    padding: "0.25rem 0.8rem",
                    cursor: "pointer",
                  }}
                >
                  Play here
                </button>
              )}
            </div>

            {typeTags && typeTags.length > 0 && (
              <div style={{ position: "relative" }}>
                {!editTagsMode ? (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setMenuOpen((open) => !open);
                    }}
                    style={{
                      borderRadius: "999px",
                      border: "1px solid #4b5563",
                      background: "#020617",
                      color: "#9ca3af",
                      fontSize: "0.7rem",
                      padding: "0.2rem 0.55rem",
                      cursor: "pointer",
                    }}
                  >
                    ⋯
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleDoneEditing}
                    style={{
                      borderRadius: "999px",
                      border: "1px solid #16a34a",
                      background: "#022c22",
                      color: "#bbf7d0",
                      fontSize: "0.7rem",
                      padding: "0.2rem 0.7rem",
                      cursor: "pointer",
                    }}
                  >
                    Done
                  </button>
                )}

                {menuOpen && !editTagsMode && (
                  <div
                    style={{
                      position: "absolute",
                      right: 0,
                      marginTop: "0.25rem",
                      borderRadius: "0.5rem",
                      border: "1px solid #1f2937",
                      background: "#020617",
                      boxShadow: "0 10px 20px rgba(0,0,0,0.6)",
                      padding: "0.25rem 0.4rem",
                      minWidth: "140px",
                      zIndex: 10,
                    }}
                  >
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setMenuOpen(false);
                        setEditTagsMode(true);
                        setSelectedTags(new Set());
                      }}
                      style={{
                        width: "100%",
                        textAlign: "left",
                        border: "none",
                        background: "transparent",
                        color: "#e5e7eb",
                        fontSize: "0.75rem",
                        padding: "0.2rem 0.1rem",
                        cursor: "pointer",
                      }}
                    >
                      Tag feedback
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </Wrapper>
  );
};
