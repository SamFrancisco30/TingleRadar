"use client";

import React, { useState } from "react";
import { languageLabels } from "./FilterPanel";
import { describeTag } from "./tagCatalog";
import { resolveBackendApiBase } from "../lib/backendApi";

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
  const [menuOpen, setMenuOpen] = useState(false);
  const [editTagsMode, setEditTagsMode] = useState(false);
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const [tagEditMode, setTagEditMode] = useState<"downvote" | "add" | null>(null);

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

  const sendTagVote = async (tagId: string, vote: 1 | -1) => {
    const backendUrl = resolveBackendApiBase();
    if (!backendUrl) return;
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
      // Silent failure keeps the card interaction lightweight.
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
    if (!tagEditMode || selectedTags.size === 0) {
      setSelectedTags(new Set());
      setEditTagsMode(false);
      setTagEditMode(null);
      return;
    }
    const voteValue: 1 | -1 = tagEditMode === "downvote" ? -1 : 1;
    await Promise.all(Array.from(selectedTags).map((tag) => sendTagVote(tag, voteValue)));
    setSelectedTags(new Set());
    setEditTagsMode(false);
    setTagEditMode(null);
  };

  return (
    <article className={`video-card${active ? " active" : ""}`}>
      <div className="video-card-thumbnail">
        {thumbnailUrl ? (
          <img
            src={thumbnailUrl}
            alt={title}
            style={{
              filter: active ? "brightness(1)" : "brightness(0.9)",
            }}
          />
        ) : (
          <div
            style={{
              width: "100%",
              height: "120px",
              borderRadius: "18px",
              background: "rgba(7, 15, 19, 0.92)",
            }}
          />
        )}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        {typeof rank === "number" && <p className="video-card-rank">#{rank}</p>}
        <a
          href={`https://youtube.com/watch?v=${youtubeId}`}
          target="_blank"
          rel="noreferrer"
          className="video-card-title"
        >
          {title}
        </a>
        <div className="video-card-channel">{channelTitle}</div>
        <div className="video-card-meta">
          Views {viewCount.toLocaleString()} · Likes {likeCount.toLocaleString()} ·{" "}
          {formatDuration(durationSeconds)}
          {publishedAt && ` · Published ${formatRelativeDate(publishedAt)}`}
        </div>

        {Boolean((typeTags && typeTags.length) || languageLabel || (extraChips && extraChips.length)) && (
          <div className="video-card-tags">
            {typeTags?.map((tagId) => {
              const selected = editTagsMode && selectedTags.has(tagId);
              return (
                <button
                  type="button"
                  key={tagId}
                  onClick={(e) => {
                    if (!editTagsMode) return;
                    e.stopPropagation();
                    toggleTagSelection(tagId);
                  }}
                  className={`tag-chip${selected ? " selected" : ""}`}
                  style={{ cursor: editTagsMode ? "pointer" : "default" }}
                >
                  {describeTag(tagId).label}
                </button>
              );
            })}
            {languageLabel && (
              <button
                type="button"
                onClick={(e) => {
                  if (!editTagsMode) return;
                  e.stopPropagation();
                  toggleTagSelection(languageLabel);
                }}
                className={`tag-chip${editTagsMode && selectedTags.has(languageLabel) ? " selected" : ""}`}
                style={{ cursor: editTagsMode ? "pointer" : "default" }}
              >
                {languageLabels[languageLabel] || languageLabel}
              </button>
            )}
            {extraChips?.map((chip) => (
              <span key={chip} className="tag-chip">
                {formatChipLabel(chip)}
              </span>
            ))}
          </div>
        )}

        {(onPlayClick || editTagsMode || typeTags) && (
          <div className="video-card-footer">
            <div className="video-card-actions">
              {onPlayClick && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onPlayClick();
                  }}
                  aria-label="Play in inline player"
                  className={`icon-button${active ? " active" : ""}`}
                >
                  ▶
                </button>
              )}

              {typeTags && typeTags.length > 0 && (
                <div style={{ position: "relative" }}>
                  {!editTagsMode ? (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setMenuOpen((open) => !open);
                      }}
                      className="icon-button"
                    >
                      ⋯
                    </button>
                  ) : (
                    <button type="button" onClick={handleDoneEditing} className="primary-button">
                      Done
                    </button>
                  )}

                  {menuOpen && !editTagsMode && (
                    <div className="inline-menu">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setMenuOpen(false);
                          setEditTagsMode(true);
                          setTagEditMode("add");
                          setSelectedTags(new Set());
                        }}
                      >
                        Add tags
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setMenuOpen(false);
                          setEditTagsMode(true);
                          setTagEditMode("downvote");
                          setSelectedTags(new Set());
                        }}
                      >
                        Downvote tags
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </article>
  );
};
