import type { Metadata } from "next";
import { RankingExplorer } from "../components/RankingExplorer";
import { resolveBackendApiBase } from "../lib/backendApi";

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
  id: number;
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

const backendUrl = resolveBackendApiBase();

type ApiRankingList = RankingList;

async function fetchRankings(): Promise<RankingList | null> {
  if (!backendUrl) {
    return null;
  }

  const response = await fetch(`${backendUrl}/rankings/weekly`, {
    next: { revalidate: 300 },
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Failed to load rankings from backend");
  }

  const data = (await response.json()) as ApiRankingList[];
  const latest = data[0];
  if (!latest) return null;

  return {
    id: latest.id,
    name: latest.name,
    description: latest.description ?? "",
    published_at: latest.published_at,
    items: (latest.items ?? [])
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
          computed_tags: item.video.computed_tags ?? [],
        } as any,
      }))
      .filter((item) => item.video.youtube_id),
  };
}

export default async function HomePage() {
  let ranking: RankingList | null = null;
  try {
    ranking = await fetchRankings();
  } catch (error) {
    return (
      <main className="page-shell">
        <div className="app-shell">
          <div className="surface-panel">
            <p className="eyebrow">TingleRadar</p>
            <h1 className="page-title">Weekly ASMR radar</h1>
            <p className="page-description">{(error as Error).message}</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="page-shell">
      <div className="app-shell">
        {ranking && <RankingExplorer ranking={ranking} />}
      </div>
    </main>
  );
}
