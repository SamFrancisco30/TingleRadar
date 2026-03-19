import type { Metadata } from "next";

import { fetchPopularChannels, type ChannelSummary } from "./channels";
import { BrowseFilterClient } from "./BrowseFilterClient";
import { BrowsePlayerClient } from "./BrowsePlayerClient";
import { resolveBackendApiBase } from "../../lib/backendApi";

const backendUrl = resolveBackendApiBase();

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

const roleplaySceneOptions = ["rp_haircut", "rp_cranial", "rp_dentist"];

async function fetchVideos(
  page: number,
  options?: {
    duration?: string | null;
    tags?: string[];
    channels?: string[];
    language?: string | null;
    sort?: string | null;
    exclude?: string[];
  }
): Promise<BrowseResponse | null> {
  if (!backendUrl) return null;

  const params = new URLSearchParams();
  params.set("page", String(page));
  params.set("page_size", "30");
  if (options?.duration) params.set("duration_bucket", options.duration);
  if (options?.tags && options.tags.length > 0) params.set("tags", options.tags.join(","));
  if (options?.channels && options.channels.length > 0) params.set("channels", options.channels.join(","));
  if (options?.language) params.set("language", options.language);
  if (options?.sort) params.set("sort", options.sort);
  if (options?.exclude && options.exclude.length > 0) params.set("exclude", options.exclude.join(","));

  const res = await fetch(`${backendUrl}/videos?${params.toString()}`, {
    cache: "no-store",
  });

  if (!res.ok) {
    return null;
  }

  return (await res.json()) as BrowseResponse;
}

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
    exclude?: string;
  };
}) {
  const page = Number(searchParams?.page ?? "1") || 1;
  const duration = searchParams?.duration ?? null;
  const language = searchParams?.language ?? null;
  const sort = searchParams?.sort ?? null;
  const channelsParam = searchParams?.channels ?? "";
  const tagsParam = searchParams?.tags ?? "";
  const excludeParam = searchParams?.exclude ?? "";

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

  const selectedExcludeTags = excludeParam
    ? excludeParam
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean)
    : [];

  const hasSceneTag = selectedTags.some((t) => roleplaySceneOptions.includes(t));
  const tagsForFetch =
    hasSceneTag && selectedTags.includes("roleplay")
      ? selectedTags.filter((t) => t !== "roleplay")
      : selectedTags;

  const channels: ChannelSummary[] = await fetchPopularChannels();

  const data = await fetchVideos(page, {
    duration,
    tags: tagsForFetch,
    channels: selectedChannelIds,
    language,
    sort,
    exclude: selectedExcludeTags,
  });

  if (!backendUrl) {
    return (
      <main className="page-shell">
        <div className="app-shell">
          <div className="surface-panel">
            <p className="eyebrow">Browse</p>
            <h1 className="page-title">Catalog offline</h1>
            <p className="page-description">Backend URL is not configured.</p>
          </div>
        </div>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="page-shell">
        <div className="app-shell">
          <div className="surface-panel">
            <p className="eyebrow">Browse</p>
            <h1 className="page-title">Catalog unavailable</h1>
            <p className="page-description">Failed to load videos from backend.</p>
          </div>
        </div>
      </main>
    );
  }

  const { items, total, page: currentPage, page_size } = data;
  const hasNext = currentPage * page_size < total;
  const hasPrev = currentPage > 1;
  const totalPages = Math.max(1, Math.ceil(total / page_size));

  const Pagination = () => (
    <div className="pagination-row">
      <span className="playlist-status">
        Page {currentPage} / {totalPages} · {items.length} videos · total {total}
      </span>
      <div className="toolbar-row" style={{ gap: "0.5rem" }}>
        <a href={currentPage > 1 ? `/browse?page=1` : "#"} className="ghost-button">
          First
        </a>
        <a href={hasPrev ? `/browse?page=${currentPage - 1}` : "#"} className="ghost-button">
          Prev
        </a>
        <a href={hasNext ? `/browse?page=${currentPage + 1}` : "#"} className="ghost-button">
          Next
        </a>
        <form action="/browse" method="get" style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
          <input
            type="number"
            name="page"
            min={1}
            max={totalPages}
            defaultValue={currentPage}
            placeholder="Pg"
            className="input-shell"
            style={{ width: "4rem", textAlign: "center", padding: "0.48rem 0.6rem" }}
          />
          <button type="submit" className="subtle-button">
            Go
          </button>
        </form>
      </div>
    </div>
  );

  return (
    <main className="page-shell">
      <div className="app-shell">
        <div className="page-intro">
          <div className="hero-panel hero-grid">
            <div className="hero-meta">
              <div>
                <p className="eyebrow">ASMR Catalog</p>
                <h1 className="page-title">Browse deeper without losing the quiet pace.</h1>
              </div>
              <p className="page-description">
                Explore the full TingleRadar catalog with the same low-glare shell as the weekly
                board, then keep results moving with a pinned inline player.
              </p>
            </div>
            <div className="hero-aside">
              <div className="aside-card">
                <p className="aside-label">Scope</p>
                <p className="aside-value">{total} videos across the current ingestion window.</p>
              </div>
              <div className="aside-card">
                <p className="aside-label">Use case</p>
                <p className="aside-value">Great for channel dives, trigger mixes, and late-night reranking.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="surface-panel">
          <BrowseFilterClient channels={channels} />
          <BrowsePlayerClient items={items} />
          <Pagination />
        </div>
      </div>
    </main>
  );
}
