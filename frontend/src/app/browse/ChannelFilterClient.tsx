"use client";

import { useMemo, useState } from "react";
import type { ChannelSummary } from "./channels";

interface Props {
  channels: ChannelSummary[];
  duration: string | null;
  tagsParam: string;
  channel: string | null;
}

export function ChannelFilterClient({ channels, duration, tagsParam, channel }: Props) {
  const [query, setQuery] = useState<string>(() => {
    const current = channels.find((c) => c.channel_id === channel);
    return current ? current.channel_title : "";
  });

  const normalizedQuery = query.trim().toLowerCase();

  const filtered = useMemo(() => {
    if (!normalizedQuery) return channels.slice(0, 20);
    return channels
      .filter((c) => c.channel_title.toLowerCase().includes(normalizedQuery))
      .slice(0, 20);
  }, [channels, normalizedQuery]);

  const applyChannel = (channelId: string | null) => {
    const params = new URLSearchParams();
    params.set("page", "1");
    if (duration) params.set("duration", duration);
    if (tagsParam) params.set("tags", tagsParam);
    if (channelId) params.set("channel", channelId);
    window.location.href = `/browse?${params.toString()}`;
  };

  return (
    <div style={{ position: "relative", maxWidth: "360px", width: "100%" }}>
      <div style={{ display: "flex", gap: "0.4rem", alignItems: "center" }}>
        <input
          type="text"
          placeholder="Type to search channels"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{
            flex: 1,
            padding: "0.35rem 0.6rem",
            borderRadius: "0.5rem",
            border: "1px solid #4b5563",
            background: "#020617",
            color: "#e5e7eb",
            fontSize: "0.8rem",
          }}
        />
        <button
          type="button"
          onClick={() => {
            setQuery("");
            applyChannel(null);
          }}
          style={{
            padding: "0.3rem 0.7rem",
            borderRadius: "999px",
            border: "1px solid #4b5563",
            background: "#020617",
            color: "#e5e7eb",
            fontSize: "0.75rem",
            cursor: "pointer",
            whiteSpace: "nowrap",
          }}
        >
          All
        </button>
      </div>

      {filtered.length > 0 && (
        <div
          style={{
            position: "absolute",
            top: "2.3rem",
            left: 0,
            right: 0,
            maxHeight: "260px",
            overflowY: "auto",
            background: "#020617",
            borderRadius: "0.75rem",
            border: "1px solid #1f2937",
            boxShadow: "0 15px 40px rgba(2, 6, 23, 0.8)",
            zIndex: 30,
          }}
        >
          {filtered.map((c) => {
            const isActive = c.channel_id === channel;
            return (
              <button
                key={c.channel_id}
                type="button"
                onClick={() => applyChannel(c.channel_id)}
                style={{
                  width: "100%",
                  textAlign: "left",
                  padding: "0.45rem 0.75rem",
                  border: "none",
                  background: isActive ? "rgba(37, 99, 235, 0.22)" : "transparent",
                  color: "#e5e7eb",
                  fontSize: "0.8rem",
                  cursor: "pointer",
                }}
              >
                <span>{c.channel_title}</span>
                <span style={{ color: "#6b7280", fontSize: "0.75rem", marginLeft: "0.35rem" }}>
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
