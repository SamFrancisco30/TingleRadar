"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { ChannelSummary } from "./channels";

interface Props {
  channels: ChannelSummary[];
  duration: string | null;
  tagsParam: string;
  selectedChannelIds: string[];
}

export function ChannelFilterClient({ channels, duration, tagsParam, selectedChannelIds }: Props) {
  const [query, setQuery] = useState<string>("");
  const [open, setOpen] = useState<boolean>(false);
  const router = useRouter();

  const normalizedQuery = query.trim().toLowerCase();

  const filtered = useMemo(() => {
    if (!normalizedQuery) return channels.slice(0, 20);
    return channels
      .filter((c) => c.channel_title.toLowerCase().includes(normalizedQuery))
      .slice(0, 20);
  }, [channels, normalizedQuery]);

  const appliedChannels = useMemo(
    () => channels.filter((c) => selectedChannelIds.includes(c.channel_id)),
    [channels, selectedChannelIds]
  );

  const applyChannels = (channelIds: string[]) => {
    const params = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
    params.set("page", "1");
    if (duration) params.set("duration", duration);
    else params.delete("duration");
    if (tagsParam) params.set("tags", tagsParam);
    else params.delete("tags");
    if (channelIds.length > 0) params.set("channels", channelIds.join(","));
    else params.delete("channels");

    setOpen(false);
    router.push(`/browse?${params.toString()}`, { scroll: false });
  };

  return (
    <div style={{ position: "relative", maxWidth: "360px", width: "100%" }}>
      {appliedChannels.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem", marginBottom: "0.45rem" }}>
          {appliedChannels.map((c) => (
            <button
              key={c.channel_id}
              type="button"
              onClick={() => {
                const next = selectedChannelIds.filter((id) => id !== c.channel_id);
                applyChannels(next);
              }}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.25rem",
                padding: "0.2rem 0.55rem",
                borderRadius: "999px",
                border: "1px solid rgba(148, 184, 171, 0.14)",
                background: "rgba(13, 24, 29, 0.92)",
                color: "var(--text-1)",
                fontSize: "0.72rem",
                cursor: "pointer",
              }}
            >
              <span>{c.channel_title}</span>
              <span style={{ fontSize: "0.8rem", color: "var(--text-3)" }}>×</span>
            </button>
          ))}
        </div>
      )}

      <div style={{ display: "flex", gap: "0.4rem", alignItems: "center" }}>
        <input
          type="text"
          placeholder="Type to search channels"
          value={query}
          onFocus={() => setOpen(true)}
          onBlur={() => {
            setTimeout(() => setOpen(false), 100);
          }}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          className="input-shell"
          style={{ flex: 1, fontSize: "0.82rem" }}
        />
        <button
          type="button"
          onClick={() => {
            setQuery("");
            setOpen(false);
            applyChannels([]);
          }}
          className="ghost-button"
          style={{ whiteSpace: "nowrap" }}
        >
          All
        </button>
      </div>

      {open && filtered.length > 0 && (
        <div
          style={{
            position: "absolute",
            top: "3rem",
            left: 0,
            right: 0,
            maxHeight: "260px",
            overflowY: "auto",
            background: "rgba(7, 15, 19, 0.98)",
            borderRadius: "1rem",
            border: "1px solid rgba(148, 184, 171, 0.12)",
            boxShadow: "var(--shadow-md)",
            zIndex: 30,
          }}
        >
          {filtered.map((c) => {
            const isActive = selectedChannelIds.includes(c.channel_id);
            return (
              <button
                key={c.channel_id}
                type="button"
                onClick={() => {
                  const next = isActive
                    ? selectedChannelIds.filter((id) => id !== c.channel_id)
                    : [...selectedChannelIds, c.channel_id];
                  applyChannels(next);
                }}
                style={{
                  width: "100%",
                  textAlign: "left",
                  padding: "0.45rem 0.75rem",
                  border: "none",
                  background: isActive ? "rgba(86, 149, 129, 0.18)" : "transparent",
                  color: "var(--text-1)",
                  fontSize: "0.8rem",
                  cursor: "pointer",
                }}
              >
                <span>{c.channel_title}</span>
                <span style={{ color: "var(--text-3)", fontSize: "0.75rem", marginLeft: "0.35rem" }}>
                  ({c.video_count})
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
