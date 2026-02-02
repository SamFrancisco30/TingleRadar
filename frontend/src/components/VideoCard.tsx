"use client";

import React from "react";

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
  onClick?: () => void;
  active?: boolean;
};

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
  onClick,
  active,
}) => {
  const Wrapper: React.ElementType = onClick ? "button" : "article";

  return (
    <Wrapper
      className="video-card"
      onClick={onClick}
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
        cursor: onClick ? "pointer" : "default",
        borderColor: active ? "#4ade80" : "#1e293b",
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
            }}
          >
            {typeTags?.map((tag) => (
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
                {chip}
              </span>
            ))}
          </div>
        )}
      </div>
    </Wrapper>
  );
};
