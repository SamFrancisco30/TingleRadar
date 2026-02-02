import type { Metadata } from "next";

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

async function fetchVideos(page: number): Promise<BrowseResponse | null> {
  if (!backendUrl) return null;

  const res = await fetch(`${backendUrl}/videos?page=${page}&page_size=50`, {
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

export default async function BrowsePage({
  searchParams,
}: {
  searchParams?: { page?: string };
}) {
  const page = Number(searchParams?.page ?? "1") || 1;
  const data = await fetchVideos(page);

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
          <span style={{ fontSize: "0.75rem", color: "#9ca3af" }}>Go to</span>
          <input
            type="number"
            name="page"
            min={1}
            max={totalPages}
            defaultValue={currentPage}
            style={{
              width: "3rem",
              padding: "0.2rem 0.35rem",
              borderRadius: "0.4rem",
              border: "1px solid #4b5563",
              background: "#020617",
              color: "#e5e7eb",
              fontSize: "0.75rem",
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
          <Pagination />

          <div style={{ marginTop: "0.75rem" }}>
            {items.map((video) => (
              <article
                key={video.youtube_id}
                style={{
                  display: "flex",
                  gap: "1rem",
                  marginBottom: "1rem",
                  padding: "1rem",
                  borderRadius: "1.25rem",
                  border: "1px solid #1e293b",
                  background: "rgba(15, 23, 42, 0.75)",
                  boxShadow: "0 15px 40px rgba(2, 6, 23, 0.55)",
                  alignItems: "center",
                }}
              >
                <div style={{ minWidth: "180px", maxWidth: "220px" }}>
                  {video.thumbnail_url ? (
                    <img
                      src={video.thumbnail_url}
                      alt={video.title}
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
                  <a
                    href={`https://youtube.com/watch?v=${video.youtube_id}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      color: "#c084fc",
                      fontSize: "1.2rem",
                      fontWeight: 600,
                      textDecoration: "none",
                    }}
                  >
                    {video.title}
                  </a>
                  <div style={{ color: "#94a3b8", marginTop: "0.25rem", fontSize: "0.9rem" }}>
                    {video.channel_title}
                  </div>
                  <div style={{ fontSize: "0.85rem", color: "#9ca3af", marginTop: "0.15rem" }}>
                    Views {video.view_count.toLocaleString()} · Likes {video.like_count.toLocaleString()} ·
                    {" "}
                    {formatDuration(video.duration)}
                  </div>

                  {video.computed_tags && video.computed_tags.length > 0 && (
                    <div
                      style={{
                        marginTop: "0.5rem",
                        display: "flex",
                        flexWrap: "wrap",
                        gap: "0.35rem",
                      }}
                    >
                      {video.computed_tags.map((tag) => (
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
                          {tag
                            .split("_")
                            .map((part) => (part ? part[0].toUpperCase() + part.slice(1) : ""))
                            .join(" ")}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </article>
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
