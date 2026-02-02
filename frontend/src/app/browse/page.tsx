import type { Metadata } from "next";

import { fetchPopularChannels, type ChannelSummary } from "./channels";
import { ChannelFilterClient } from "./ChannelFilterClient";
import { VideoCard } from "../../components/VideoCard";

const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;

export const metadata: Metadata = {
  title: "Browse all ASMR videos — TingleRadar",
  description: "Explore the full catalog of ASMR videos collected by TingleRadar.",
};

export type ApiVideo = {
  youtube_id: string;
  title: string;
  channel_title: string;
  channel_id: string;
  thumbnail_url?: string | null;
  view_count: number;
  like_count: number;
  description?: string | null;
  duration?: number | null;
  tags?: string[] | null;
  computed_tags?: string[];
  published_at: string;
};

export type BrowseResponse = {
  items: ApiVideo[];
  total: number;
  page: number;
  page_size: number;
};

async function fetchVideos(
  page: number,
  options?: {
    duration?: string | null;
    tags?: string[];
    channels?: string[];
    language?: string | null;
    sort?: string | null;
  }
): Promise<BrowseResponse | null> {
  if (!backendUrl) return null;

  const params = new URLSearchParams();
  params.set("page", String(page));
  params.set("page_size", "30");
  if (options?.duration) {
    params.set("duration_bucket", options.duration);
  }
  if (options?.tags && options.tags.length > 0) {
    params.set("tags", options.tags.join(","));
  }
  if (options?.channels && options.channels.length > 0) {
    params.set("channels", options.channels.join(","));
  }
  if (options?.language) {
    params.set("language", options.language);
  }
  if (options?.sort) {
    params.set("sort", options.sort);
  }

  const res = await fetch(`${backendUrl}/videos?${params.toString()}`, {
    cache: "no-store",
  });

  if (!res.ok) {
    return null;
  }

  const data = (await res.json()) as BrowseResponse;
  return data;
}

function formatDuration(seconds?: number | null): string {
  if (!seconds) return "Unknown";
  const mins = Math.round(seconds / 60);
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

const durationBuckets = [
  { id: "short", label: "2-5 min" },
  { id: "medium", label: "5-15 min" },
  { id: "long", label: "15+ min" },
];

// Mirror a subset of RankingExplorer's internal tag ids for triggers and talking styles.
const triggerTypeOptions: string[] = [
  "tapping",
  "scratching",
  "crinkling",
  "brushing",
  "ear_cleaning",
  "mouth_sounds",
  "white_noise",
  "binaural",
  "visual_asmr",
  "layered",
  "roleplay",
];

const talkingStyleOptions: string[] = ["whisper", "soft_spoken", "no_talking"];

const roleplaySceneOptions: string[] = ["rp_haircut", "rp_cranial", "rp_dentist"];

const humanizeTag = (tag: string): string =>
  tag
    .split("_")
    .map((part) => (part ? part[0].toUpperCase() + part.slice(1) : ""))
    .join(" ");

export default async function BrowsePage({
  searchParams,
}: {
  searchParams?: {
    page?: string;
    duration?: string;
    tags?: string;
    channels?: string;
    language?: string;
    sort?: string;
  };
}) {
  const page = Number(searchParams?.page ?? "1") || 1;
  const duration = searchParams?.duration ?? null;
  const language = searchParams?.language ?? null;
  const sort = searchParams?.sort ?? null;
  const channelsParam = searchParams?.channels ?? "";
  const tagsParam = searchParams?.tags ?? "";
  const selectedTags = tagsParam
    ? tagsParam
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean)
    : [];

  const selectedChannelIds = channelsParam
    ? channelsParam
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean)
    : [];

  const channels: ChannelSummary[] = await fetchPopularChannels();

  const data = await fetchVideos(page, {
    duration,
    tags: selectedTags,
    channels: selectedChannelIds,
    language,
    sort,
  });

  if (!backendUrl) {
    return (
      <div style={{ minHeight: "100vh", background: "#05070a", color: "#eee", padding: "3rem" }}>
        <h1 style={{ fontSize: "2.4rem", marginBottom: "1rem" }}>Browse</h1>
        <p>Backend URL is not configured.</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div style={{ minHeight: "100vh", background: "#05070a", color: "#eee", padding: "3rem" }}>
        <h1 style={{ fontSize: "2.4rem", marginBottom: "1rem" }}>Browse</h1>
        <p>Failed to load videos from backend.</p>
      </div>
    );
  }

  const { items, total, page: currentPage, page_size } = data;
  const hasNext = currentPage * page_size < total;
  const hasPrev = currentPage > 1;
  const totalPages = Math.max(1, Math.ceil(total / page_size));

  const Pagination = () => (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        rowGap: "0.5rem",
        marginBottom: "1rem",
        marginTop: "0.5rem",
      }}
    >
      <span style={{ fontSize: "0.85rem", color: "#cbd5f5" }}>
        Page {currentPage} / {totalPages} · {items.length} videos · total {total}
      </span>
      <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
        <a
          href={currentPage > 1 ? `/browse?page=1` : "#"}
          style={{
            padding: "0.35rem 0.8rem",
            borderRadius: "999px",
            border: "1px solid #4b5563",
            background: "#020617",
            color: currentPage > 1 ? "#e5e7eb" : "#4b5563",
            fontSize: "0.75rem",
            pointerEvents: currentPage > 1 ? "auto" : "none",
            textDecoration: "none",
          }}
        >
          First
        </a>
        <a
          href={hasPrev ? `/browse?page=${currentPage - 1}` : "#"}
          style={{
            padding: "0.35rem 0.85rem",
            borderRadius: "999px",
            border: "1px solid #4b5563",
            background: "#020617",
            color: hasPrev ? "#e5e7eb" : "#4b5563",
            fontSize: "0.75rem",
            pointerEvents: hasPrev ? "auto" : "none",
            textDecoration: "none",
          }}
        >
          Prev
        </a>
        <a
          href={hasNext ? `/browse?page=${currentPage + 1}` : "#"}
          style={{
            padding: "0.35rem 0.85rem",
            borderRadius: "999px",
            border: "1px solid #4b5563",
            background: "#020617",
            color: hasNext ? "#e5e7eb" : "#4b5563",
            fontSize: "0.75rem",
            pointerEvents: hasNext ? "auto" : "none",
            textDecoration: "none",
          }}
        >
          Next
        </a>
        <form
          action="/browse"
          method="get"
          style={{ display: "flex", alignItems: "center", gap: "0.3rem", marginLeft: "0.5rem" }}
        >
          <input
            type="number"
            name="page"
            min={1}
            max={totalPages}
            defaultValue={currentPage}
            placeholder="Pg"
            style={{
              width: "3rem",
              padding: "0.2rem 0.35rem",
              borderRadius: "0.4rem",
              border: "1px solid #4b5563",
              background: "#020617",
              color: "#e5e7eb",
              fontSize: "0.75rem",
              textAlign: "center",
              WebkitAppearance: "none",
              MozAppearance: "textfield",
            }}
          />
          <button
            type="submit"
            style={{
              padding: "0.25rem 0.6rem",
              borderRadius: "999px",
              border: "1px solid #4b5563",
              background: "#020617",
              color: "#e5e7eb",
              fontSize: "0.75rem",
              cursor: "pointer",
            }}
          >
            Go
          </button>
        </form>
      </div>
    </div>
  );

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(180deg, #040710, #0b1222 60%, #06050a)",
        color: "#f5f5f5",
      }}
    >
      <div style={{ maxWidth: "960px", margin: "0 auto", padding: "2.5rem 1.25rem" }}>
        <header style={{ marginBottom: "2rem" }}>
          <p style={{ letterSpacing: "0.4em", fontSize: "0.8rem", color: "#6b7280" }}>
            ASMR CATALOG
          </p>
          <h1 style={{ fontSize: "2.4rem", margin: "0.5rem 0" }}>Browse all videos</h1>
          <p style={{ color: "#cbd5f5", fontSize: "0.95rem", maxWidth: "640px" }}>
            This is an early explorer over the full TingleRadar video catalog. Use it to
            skim channels, triggers, and durations beyond the weekly leaderboard.
          </p>
        </header>

        <div
          style={{
            borderRadius: "1.5rem",
            background: "rgba(15, 20, 36, 0.75)",
            border: "1px solid #1e293b",
            padding: "1.5rem",
            boxShadow: "0 20px 80px rgba(5, 6, 15, 0.45)",
          }}
        >
          {/* Filters */}
          <div
            style={{
              borderRadius: "1.25rem",
              border: "1px solid #1f2937",
              background: "rgba(15, 23, 42, 0.75)",
              padding: "1rem",
              marginBottom: "1rem",
              backdropFilter: "blur(8px)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-end",
                marginBottom: "0.6rem",
              }}
            >
              <div>
                <p
                  style={{
                    fontSize: "0.6rem",
                    letterSpacing: "0.3em",
                    textTransform: "uppercase",
                    color: "#94a3b8",
                    margin: 0,
                  }}
                >
                  Filter catalog
                </p>
                <p style={{ margin: "0.25rem 0 0", fontSize: "0.9rem", color: "#cbd5f5" }}>
                  Narrow by channels, duration, triggers, language, and more.
                </p>
              </div>
              {(duration || selectedTags.length > 0 || selectedChannelIds.length > 0 || language || sort) && (
                <a
                  href="/browse"
                  style={{
                    border: "1px solid #475569",
                    background: "transparent",
                    color: "#cbd5f5",
                    padding: "0.35rem 0.8rem",
                    borderRadius: "999px",
                    fontSize: "0.7rem",
                    textDecoration: "none",
                  }}
                >
                  Clear filters
                </a>
              )}
            </div>

            {/* Channel */}
            <div style={{ marginTop: "0.4rem" }}>
              <p
                style={{
                  fontSize: "0.65rem",
                  letterSpacing: "0.3em",
                  textTransform: "uppercase",
                  color: "#9ca3af",
                  marginBottom: "0.3rem",
                }}
              >
                Channel
              </p>
              <ChannelFilterClient
                channels={channels}
                duration={duration}
                tagsParam={tagsParam}
                selectedChannelIds={selectedChannelIds}
              />
            </div>

            {/* Sort */}
            <div style={{ marginTop: "0.4rem" }}>
              <p
                style={{
                  fontSize: "0.65rem",
                  letterSpacing: "0.3em",
                  textTransform: "uppercase",
                  color: "#9ca3af",
                  marginBottom: "0.3rem",
                }}
              >
                Sort by
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem" }}>
                {[{ id: "published_desc", label: "Newest" }, { id: "views_desc", label: "Most viewed" }, { id: "likes_desc", label: "Most liked" }].map(
                  (opt) => {
                    const active = (sort || "published_desc") === opt.id;
                    const href = new URLSearchParams({
                      page: "1",
                      ...(duration ? { duration } : {}),
                      ...(tagsParam ? { tags: tagsParam } : {}),
                      ...(selectedChannelIds.length
                        ? { channels: selectedChannelIds.join(",") }
                        : {}),
                      ...(opt.id !== "published_desc" ? { sort: opt.id } : {}),
                      ...(language ? { language } : {}),
                    }).toString();
                    return (
                      <a
                        key={opt.id}
                        href={`/browse?${href}`}
                        style={{
                          padding: "0.35rem 0.75rem",
                          borderRadius: "999px",
                          border: "1px solid",
                          borderColor: active ? "#2563eb" : "#475569",
                          background: active ? "#2563eb" : "#0f172a",
                          color: active ? "#fff" : "#e2e8f0",
                          fontSize: "0.7rem",
                          textDecoration: "none",
                        }}
                      >
                        {opt.label}
                      </a>
                    );
                  }
                )}
              </div>
            </div>

            {/* Duration */}
            <div style={{ marginTop: "0.4rem" }}>
              <p
                style={{
                  fontSize: "0.65rem",
                  letterSpacing: "0.3em",
                  textTransform: "uppercase",
                  color: "#9ca3af",
                  marginBottom: "0.3rem",
                }}
              >
                Duration
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
                {durationBuckets.map((b) => {
                  const active = duration === b.id;
                  const href = new URLSearchParams({
                    page: "1",
                    ...(active ? {} : { duration: b.id, tags: tagsParam }),
                    ...(selectedChannelIds.length
                      ? { channels: selectedChannelIds.join(",") }
                      : {}),
                  }).toString();
                  return (
                    <a
                      key={b.id}
                      href={`/browse?${href}`}
                      style={{
                        padding: "0.35rem 0.75rem",
                        borderRadius: "999px",
                        border: "1px solid",
                        borderColor: active ? "#059669" : "#475569",
                        background: active ? "#059669" : "#0f172a",
                        color: active ? "#fff" : "#e2e8f0",
                        fontSize: "0.7rem",
                        textDecoration: "none",
                      }}
                    >
                      {b.label}
                    </a>
                  );
                })}
              </div>
            </div>

            {/* Trigger type */}
            <div style={{ marginTop: "0.8rem" }}>
              <p
                style={{
                  fontSize: "0.65rem",
                  letterSpacing: "0.3em",
                  textTransform: "uppercase",
                  color: "#9ca3af",
                  marginBottom: "0.3rem",
                }}
              >
                Trigger Type
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem" }}>
                {triggerTypeOptions.map((tag) => {
                  const active = selectedTags.includes(tag);
                  const nextTags = active
                    ? selectedTags.filter((t) => t !== tag)
                    : [...selectedTags, tag];
                  const href = new URLSearchParams({
                    page: "1",
                    ...(duration ? { duration } : {}),
                    ...(nextTags.length ? { tags: nextTags.join(",") } : {}),
                    ...(selectedChannelIds.length
                      ? { channels: selectedChannelIds.join(",") }
                      : {}),
                  }).toString();
                  return (
                    <a
                      key={tag}
                      href={`/browse?${href}`}
                      style={{
                        padding: "0.35rem 0.75rem",
                        borderRadius: "999px",
                        border: "1px solid",
                        borderColor: active ? "#059669" : "#475569",
                        background: active ? "#059669" : "#0f172a",
                        color: active ? "#fff" : "#e2e8f0",
                        fontSize: "0.7rem",
                        textDecoration: "none",
                      }}
                    >
                      {humanizeTag(tag)}
                    </a>
                  );
                })}
              </div>
            </div>

            {/* Talking style */}
            <div style={{ marginTop: "0.8rem" }}>
              <p
                style={{
                  fontSize: "0.65rem",
                  letterSpacing: "0.3em",
                  textTransform: "uppercase",
                  color: "#9ca3af",
                  marginBottom: "0.3rem",
                }}
              >
                Talking style
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem" }}>
                {talkingStyleOptions.map((tag) => {
                  const active = selectedTags.includes(tag);
                  const nextTags = active
                    ? selectedTags.filter((t) => t !== tag)
                    : [...selectedTags, tag];
                  const href = new URLSearchParams({
                    page: "1",
                    ...(duration ? { duration } : {}),
                    ...(nextTags.length ? { tags: nextTags.join(",") } : {}),
                    ...(selectedChannelIds.length
                      ? { channels: selectedChannelIds.join(",") }
                      : {}),
                  }).toString();
                  return (
                    <a
                      key={tag}
                      href={`/browse?${href}`}
                      style={{
                        padding: "0.35rem 0.75rem",
                        borderRadius: "999px",
                        border: "1px solid",
                        borderColor: active ? "#059669" : "#475569",
                        background: active ? "#059669" : "#0f172a",
                        color: active ? "#fff" : "#e2e8f0",
                        fontSize: "0.7rem",
                        textDecoration: "none",
                      }}
                    >
                      {humanizeTag(tag)}
                    </a>
                  );
                })}
              </div>
            </div>

            {/* Roleplay scenes: only when roleplay is selected */}
            {selectedTags.includes("roleplay") && (
              <div style={{ marginTop: "0.8rem" }}>
                <p
                  style={{
                    fontSize: "0.65rem",
                    letterSpacing: "0.3em",
                    textTransform: "uppercase",
                    color: "#9ca3af",
                    marginBottom: "0.3rem",
                  }}
                >
                  Roleplay scene
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem" }}>
                  {roleplaySceneOptions.map((tag) => {
                    const active = selectedTags.includes(tag);
                    const nextTags = active
                      ? selectedTags.filter((t) => t !== tag)
                      : [...selectedTags, tag];
                    const href = new URLSearchParams({
                      page: "1",
                      ...(duration ? { duration } : {}),
                      ...(nextTags.length ? { tags: nextTags.join(",") } : {}),
                      ...(selectedChannelIds.length
                        ? { channels: selectedChannelIds.join(",") }
                        : {}),
                      ...(language ? { language } : {}),
                      ...(sort && sort !== "published_desc" ? { sort } : {}),
                    }).toString();
                    return (
                      <a
                        key={tag}
                        href={`/browse?${href}`}
                        style={{
                          padding: "0.35rem 0.75rem",
                          borderRadius: "999px",
                          border: "1px solid",
                          borderColor: active ? "#059669" : "#475569",
                          background: active ? "#059669" : "#0f172a",
                          color: active ? "#fff" : "#e2e8f0",
                          fontSize: "0.7rem",
                          textDecoration: "none",
                        }}
                      >
                        {humanizeTag(tag)}
                      </a>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Language */}
            <div style={{ marginTop: "0.8rem" }}>
              <p
                style={{
                  fontSize: "0.65rem",
                  letterSpacing: "0.3em",
                  textTransform: "uppercase",
                  color: "#9ca3af",
                  marginBottom: "0.3rem",
                }}
              >
                Language
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem" }}>
                {["en", "ja", "ko", "zh"].map((code) => {
                  const active = language === code;
                  const href = new URLSearchParams({
                    page: "1",
                    ...(duration ? { duration } : {}),
                    ...(tagsParam ? { tags: tagsParam } : {}),
                    ...(selectedChannelIds.length
                      ? { channels: selectedChannelIds.join(",") }
                      : {}),
                    ...(sort && sort !== "published_desc" ? { sort } : {}),
                    ...(active ? {} : { language: code }),
                  }).toString();
                  return (
                    <a
                      key={code}
                      href={`/browse?${href}`}
                      style={{
                        padding: "0.35rem 0.75rem",
                        borderRadius: "999px",
                        border: "1px solid",
                        borderColor: active ? "#059669" : "#475569",
                        background: active ? "#059669" : "#0f172a",
                        color: active ? "#fff" : "#e2e8f0",
                        fontSize: "0.7rem",
                        textDecoration: "none",
                      }}
                    >
                      {code === "en" && "English"}
                      {code === "ja" && "Japanese"}
                      {code === "ko" && "Korean"}
                      {code === "zh" && "Chinese"}
                    </a>
                  );
                })}
              </div>
            </div>
          </div>

          <div style={{ marginTop: "0.75rem" }}>
            {items.map((video) => (
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
                extraChips={video.computed_tags?.map((tag) =>
                  tag
                    .split("_")
                    .map((part) => (part ? part[0].toUpperCase() + part.slice(1) : ""))
                    .join(" ")
                )}
              />
            ))}

            {items.length === 0 && (
              <p style={{ fontSize: "0.9rem", color: "#9ca3af" }}>
                No videos found yet. Try again after the next ingestion run.
              </p>
            )}
          </div>

          <Pagination />
        </div>
      </div>
    </div>
  );
}
