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
    // Start from current query string so other filters (language, sort, etc.) are preserved.
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
      {/* Selected channel chips */}
      {appliedChannels.length > 0 && (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "0.35rem",
            marginBottom: "0.4rem",
          }}
        >
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
                border: "1px solid #4b5563",
                background: "rgba(15, 23, 42, 0.9)",
                color: "#e5e7eb",
                fontSize: "0.7rem",
                cursor: "pointer",
              }}
            >
              <span>{c.channel_title}</span>
              <span style={{ fontSize: "0.8rem", color: "#9ca3af" }}>×</span>
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
            // Delay closing slightly so clicks on the dropdown still register.
            setTimeout(() => setOpen(false), 100);
          }}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
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
            setOpen(false);
            applyChannels([]);
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

      {open && filtered.length > 0 && (
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
