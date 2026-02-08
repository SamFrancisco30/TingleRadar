// Shared video normalization helpers for Weekly + Browse views.

export type BasicVideoFromApi = {
  youtube_id: string;
  title: string;
  channel_title: string;
  thumbnail_url?: string | null;
  view_count: number;
  like_count: number;
  published_at?: string | null;
  description?: string | null;
  duration?: number | null;
  tags?: string[] | null;
  computed_tags?: string[];
};

// Keyword-based fallback rules for when the backend doesn't provide computed_tags.
// Keys here are internal tag ids (snake_case) so they align with backend tagging.
const typeKeywords: Record<string, string[]> = {
  whisper: ["whisper", "耳语", "whispering"],
  soft_spoken: ["soft spoken", "soft-spoken"],
  no_talking: ["no talking", "no-talking", "不讲话"],

  tapping: ["tapping", "敲击", "knuckle"],
  scratching: ["scratching", "scratch", "抓挠"],
  crinkling: ["crinkle", "crinkling", "包装袋", "塑料袋"],
  brushing: ["brushing", "brush sounds", "耳刷", "hair brushing"],
  ear_cleaning: ["ear cleaning", "ear massage", "耳搔", "耳朵清洁"],
  mouth_sounds: ["mouth sounds", "口腔音", "tongue clicking"],
  white_noise: ["white noise", "fan noise", "air conditioner", "雨声", "rain sounds"],
  binaural: ["binaural", "3dio", "双耳"],
  visual_asmr: ["visual asmr", "light triggers", "hand movements", "tracing", "visual triggers"],
  layered: ["layered asmr", "layered sounds", "soundscape", "multi-layer"],

  roleplay: ["roleplay", "r.p", "场景", "girlfriend roleplay", "doctor roleplay"],
};

const languageDetectors: [string, RegExp][] = [
  ["ja", /[\u3040-\u30ff\u31f0-\u31ff]/],
  ["ko", /[\uac00-\ud7af]/],
  ["zh", /[\u4e00-\u9fff]/],
];

const getSearchBag = (video: BasicVideoFromApi) => {
  const { title, description, tags } = video;
  return [title, description, ...(tags ?? [])].join(" ").toLowerCase();
};

export const detectTypeTags = (video: BasicVideoFromApi): string[] => {
  const bag = getSearchBag(video);
  return Object.entries(typeKeywords)
    .filter(([, keywords]) => keywords.some((keyword) => bag.includes(keyword)))
    .map(([key]) => key);
};

export const detectLanguage = (video: BasicVideoFromApi): string => {
  const title = (video.title || "").toLowerCase();
  for (const [code, regex] of languageDetectors) {
    if (regex.test(title)) {
      return code;
    }
  }
  return "en";
};

export type NormalizedVideo = {
  youtubeId: string;
  title: string;
  channelTitle: string;
  thumbnailUrl?: string | null;
  viewCount: number;
  likeCount: number;
  durationSeconds?: number | null;
  publishedAt?: string | null;
  typeTags: string[]; // internal tag ids (snake_case)
  language: string; // e.g. "en", "ja", "ko", "zh"
  rawTags?: string[] | null;
  computedTags?: string[];
};

export function normalizeVideo(video: BasicVideoFromApi): NormalizedVideo {
  const computed = video.computed_tags;
  const typeTags = computed && computed.length ? computed : detectTypeTags(video);
  const language = detectLanguage(video);

  return {
    youtubeId: video.youtube_id,
    title: video.title,
    channelTitle: video.channel_title,
    thumbnailUrl: video.thumbnail_url ?? undefined,
    viewCount: video.view_count,
    likeCount: video.like_count,
    durationSeconds: video.duration ?? undefined,
    publishedAt: video.published_at ?? undefined,
    typeTags,
    language,
    rawTags: video.tags ?? null,
    computedTags: video.computed_tags ?? [],
  };
}
