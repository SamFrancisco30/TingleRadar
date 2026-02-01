import type { Metadata } from "next";
import { RankingExplorer } from "../components/RankingExplorer";

type RankingItem = {
  rank: number;
  score: number;
  video: {
    youtube_id: string;
    title: string;
    channel_title: string;
    thumbnail_url: string;
    view_count: number;
    like_count: number;
    description?: string | null;
    duration?: number | null;
    tags?: string[] | null;
    computed_tags?: string[];
  };
};

type RankingList = {
  name: string;
  description: string;
  published_at: string;
  items: RankingItem[];
};

export const metadata: Metadata = {
  title: "TingleRadar — ASMR rankings",
  description:
    "Weekly ASMR leaderboard built for whisper, no-talking, and immersive roleplay content.",
};

const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;

type ApiRankingItem = {
  rank: number;
  score: number;
  video: {
    youtube_id: string;
    title: string;
    channel_title: string;
    thumbnail_url: string;
    view_count: number;
    like_count: number;
    description?: string | null;
    duration?: number | null;
    tags?: string[] | null;
    computed_tags?: string[];
  };
};

type ApiRankingList = {
  name: string;
  description: string;
  published_at: string;
  items: ApiRankingItem[];
};

async function fetchRankings(): Promise<RankingList[]> {
  if (!backendUrl) {
    return [];
  }

  const response = await fetch(`${backendUrl}/rankings/weekly`, {
    // This is a server component; fetch happens on the server.
    cache: "no-store",
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Failed to load rankings from backend");
  }

  const data = (await response.json()) as ApiRankingList[];

  return data.map((list) => ({
    name: list.name,
    description: list.description ?? "",
    published_at: list.published_at,
    items: (list.items ?? [])
      .map((item) => ({
        rank: item.rank,
        score: item.score,
        video: {
          youtube_id: item.video.youtube_id,
          title: item.video.title,
          channel_title: item.video.channel_title,
          thumbnail_url: item.video.thumbnail_url,
          view_count: item.video.view_count ?? 0,
          like_count: item.video.like_count ?? 0,
          description: item.video.description ?? null,
          duration: item.video.duration ?? null,
          tags: item.video.tags ?? null,
          // Keep computed_tags in the object so the explorer can use it.
          computed_tags: item.video.computed_tags ?? [],
        } as any,
      }))
      .filter((item) => item.video.youtube_id),
  }));
}

export default async function HomePage() {
  let rankings: RankingList[] = [];
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
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(180deg, #040710, #0b1222 60%, #06050a)",
        color: "#f5f5f5",
      }}
    >
      <div style={{ maxWidth: "960px", margin: "0 auto", padding: "2.5rem 1.25rem" }}>
        <header style={{ marginBottom: "2rem" }}>
          <p style={{ letterSpacing: "0.4em", fontSize: "0.8rem", color: "#6b7280" }}>ASMR BOARD</p>
          <h1 style={{ fontSize: "3rem", margin: "0.5rem 0" }}>TingleRadar</h1>
          <p style={{ color: "#cbd5f5", fontSize: "1rem", maxWidth: "640px" }}>
            Weekly ASMR leaderboard powered by community tags and curated signals.
          </p>
        </header>

        <div
          style={{
            borderRadius: "1.5rem",
            background: "rgba(15, 20, 36, 0.75)",
            border: "1px solid #1e293b",
            padding: "2rem",
            boxShadow: "0 20px 80px rgba(5, 6, 15, 0.45)",
          }}
        >
          <RankingExplorer rankings={rankings} />
        </div>
      </div>
    </div>
  );
}
