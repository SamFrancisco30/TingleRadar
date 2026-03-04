import { resolveBackendApiBase } from "../../lib/backendApi";

const backendUrl = resolveBackendApiBase();

export type ChannelSummary = {
  channel_id: string;
  channel_title: string;
  video_count: number;
};

export async function fetchPopularChannels(): Promise<ChannelSummary[]> {
  if (!backendUrl) return [];

  const res = await fetch(`${backendUrl}/channels/popular?limit=40`, {
    cache: "no-store",
  });

  if (!res.ok) {
    return [];
  }

  const data = (await res.json()) as ChannelSummary[];
  return data;
}

