import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "TingleRadar — ASMR rankings",
  description:
    "Weekly ASMR leaderboard built for whisper, no-talking, and immersive roleplay content.",
};

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function fetchRankings() {
  const res = await fetch(`${API_BASE}/api/rankings/weekly`, { cache: "no-store" });
  if (!res.ok) {
    throw new Error("Failed to load rankings");
  }
  return res.json();
}

export default async function HomePage() {
  let rankings: any[] = [];
  try {
    rankings = await fetchRankings();
  } catch (error) {
    return (
      <div style={{ minHeight: "100vh", background: "#05070a", color: "#eee", padding: "3rem" }}>
        <h1 style={{ fontSize: "2.8rem", marginBottom: "1rem" }}>TingleRadar</h1>
        <p style={{ fontSize: "1.1rem" }}>{(error as Error).message}</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#05070a", color: "#f5f5f5" }}>
      <div style={{ maxWidth: "960px", margin: "0 auto", padding: "2.5rem 1.25rem" }}>
        <header>
          <p style={{ letterSpacing: "0.4em", fontSize: "0.8rem", color: "#6b7280" }}>ASMR BOARD</p>
          <h1 style={{ fontSize: "3rem", margin: "1rem 0" }}>TingleRadar</h1>
          <p style={{ color: "#9ca3af", fontSize: "1rem" }}>
            Weekly ASMR leaderboard powered by community tags and curated signals.
          </p>
        </header>

        <main style={{ marginTop: "2rem", display: "flex", flexDirection: "column", gap: "2rem" }}>
          {rankings.map((list) => (
            <section
              key={list.name}
              style={{
                borderRadius: "1.5rem",
                padding: "1.5rem",
                background: "rgba(15, 23, 42, 0.85)",
                border: "1px solid #1f2937",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "1rem",
                }}
              >
                <div>
                  <h2 style={{ fontSize: "1.8rem", margin: 0 }}>{list.name}</h2>
                  <p style={{ margin: 0, fontSize: "0.95rem", color: "#9ca3af" }}>{list.description}</p>
                </div>
                <span style={{ fontSize: "0.85rem", color: "#6b7280" }}>
                  {new Date(list.published_at).toLocaleDateString()}
                </span>
              </div>

              <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem" }}>
                {list.items.map((item) => (
                  <article
                    key={item.video.youtube_id}
                    style={{
                      flex: "1 1 320px",
                      borderRadius: "1rem",
                      border: "1px solid #1f2937",
                      padding: "1rem",
                      display: "flex",
                      gap: "1rem",
                      background: "rgba(255, 255, 255, 0.02)",
                    }}
                  >
                    <img
                      src={item.video.thumbnail_url}
                      alt={item.video.title}
                      style={{ width: "100px", height: "72px", objectFit: "cover", borderRadius: "0.6rem" }}
                    />
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: "0", fontSize: "0.75rem", color: "#6b7280" }}>#{item.rank}</p>
                      <a
                        style={{
                          color: "#f5f5f5",
                          textDecoration: "none",
                          fontSize: "1.05rem",
                          fontWeight: 600,
                        }}
                        href={`https://youtube.com/watch?v=${item.video.youtube_id}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {item.video.title}
                      </a>
                      <p style={{ margin: "0.35rem 0", fontSize: "0.85rem", color: "#9ca3af" }}>
                        {item.video.channel_title}
                      </p>
                      <p style={{ margin: 0, fontSize: "0.75rem", color: "#fbbf24" }}>Score {item.score}</p>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </main>
      </div>
    </div>
  );
}
