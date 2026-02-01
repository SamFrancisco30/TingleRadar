import { createClient } from "@supabase/supabase-js";
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

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase =
  supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

type SupabaseRankingItem = {
  position: number;
  score: number;
  video: {
    youtube_id: string;
    title: string;
    channel_title: string;
    thumbnail_url: string;
    view_count: number | null;
    like_count: number | null;
  } | null;
};

type SupabaseRankingList = {
  name: string;
  description: string | null;
  created_at: string;
  ranking_items: SupabaseRankingItem[] | null;
};

async function fetchRankings(): Promise<RankingList[]> {
  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from("ranking_lists")
    .select(
      `name,description,created_at,ranking_items(position,score,video:videos(youtube_id,title,channel_title,thumbnail_url,view_count,like_count,description,duration,tags))`
    )
    .order("created_at", { ascending: false })
    .limit(3);

  if (error) {
    throw new Error(error.message);
  }

  const rows = (data as SupabaseRankingList[]) ?? [];

  return rows.map((list) => ({
    name: list.name,
    description: list.description ?? "",
    published_at: list.created_at,
    items: (list.ranking_items ?? [])
      .map((item) => ({
        rank: item.position,
        score: item.score,
        video: {
          youtube_id: item.video?.youtube_id || "",
          title: item.video?.title || "",
          channel_title: item.video?.channel_title || "",
          thumbnail_url: item.video?.thumbnail_url || "",
          view_count: item.video?.view_count ?? 0,
          like_count: item.video?.like_count ?? 0,
        },
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
