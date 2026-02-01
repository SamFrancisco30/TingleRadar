"use client";

import { useMemo, useState } from "react";

const durationBuckets = [
  { id: "short", label: "2-5 min", min: 120, max: 300 },
  { id: "medium", label: "5-15 min", min: 300, max: 900 },
  { id: "long", label: "15+ min", min: 900 },
];

const typeKeywords: Record<string, string[]> = {
  whisper: ["whisper", "耳语", "whispering"],
  roleplay: ["roleplay", "r.p", "场景"],
  tapping: ["tapping", "tap", "敲击", "knuckle"],
  makeup: ["makeup", "cosmetic", "化妆"],
  "no talking": ["no talking", "silent", "不讲话", "엄마"],
};

const languageDetectors: [string, RegExp][] = [
  ["ja", /[\u3040-\u30ff\u31f0-\u31ff]/],
  ["ko", /[\uac00-\ud7af]/],
  ["zh", /[\u4e00-\u9fff]/],
];

const languageLabels: Record<string, string> = {
  en: "English",
  ja: "Japanese",
  ko: "Korean",
  zh: "Chinese",
};

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

const getSearchBag = (video: RankingItem["video"]) => {
  const { title, description, tags } = video;
  return [title, description, ...(tags ?? [])].join(" ").toLowerCase();
};

const detectTypeTags = (video: RankingItem["video"]): string[] => {
  const bag = getSearchBag(video);
  return Object.entries(typeKeywords)
    .filter(([, keywords]) => keywords.some((keyword) => bag.includes(keyword)))
    .map(([key]) => key);
};

const detectLanguage = (video: RankingItem["video"]): string => {
  const bag = getSearchBag(video);
  for (const [code, regex] of languageDetectors) {
    if (regex.test(bag)) {
      return code;
    }
  }
  return "en";
};

const filterByDuration = (item: RankingItem, bucketId: string) => {
  const duration = item.video.duration ?? 0;
  const bucket = durationBuckets.find((b) => b.id === bucketId);
  if (!bucket) {
    return true;
  }

  if (bucket.max) {
    return duration >= bucket.min && duration < bucket.max;
  }

  return duration >= bucket.min;
};

const rankingTypeOptions = Object.keys(typeKeywords);
const languageOptions = ["en", "ja", "ko", "zh"];

export function RankingExplorer({ rankings }: { rankings: RankingList[] }) {
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [languageFilter, setLanguageFilter] = useState<string | null>(null);
  const [durationFilter, setDurationFilter] = useState<string | null>(null);

  const normalized = useMemo(
    () =>
      rankings.map((list) => ({
        ...list,
        items: list.items.map((item) => ({
          ...item,
          type_tags: detectTypeTags(item.video),
          language: detectLanguage(item.video),
        })),
      })),
    [rankings]
  );

  const filtered = useMemo(
    () =>
      normalized.map((list) => ({
        ...list,
        items: list.items.filter((item) => {
          if (typeFilter && !item.type_tags.includes(typeFilter)) {
            return false;
          }
          if (languageFilter && item.language !== languageFilter) {
            return false;
          }
          if (durationFilter && !filterByDuration(item, durationFilter)) {
            return false;
          }
          return true;
        }),
      })),
    [normalized, typeFilter, languageFilter, durationFilter]
  );

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-4">
        {durationBuckets.map((bucket) => (
          <button
            key={bucket.id}
            className={`px-3 py-1 rounded-full border ${
              durationFilter === bucket.id ? "bg-emerald-600 text-white" : "border-slate-600"
            }`}
            onClick={() => setDurationFilter(durationFilter === bucket.id ? null : bucket.id)}
          >
            {bucket.label}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-2 mb-4">
        {rankingTypeOptions.map((type) => (
          <button
            key={type}
            className={`px-3 py-1 rounded-full border ${
              typeFilter === type ? "bg-emerald-600 text-white" : "border-slate-600"
            }`}
            onClick={() => setTypeFilter(typeFilter === type ? null : type)}
          >
            {type}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-2 mb-6">
        {languageOptions.map((code) => (
          <button
            key={code}
            className={`px-3 py-1 rounded-full border ${
              languageFilter === code ? "bg-emerald-600 text-white" : "border-slate-600"
            }`}
            onClick={() => setLanguageFilter(languageFilter === code ? null : code)}
          >
            {languageLabels[code]}
          </button>
        ))}
      </div>
      <div className="space-y-8">
        {filtered.map((list) => (
          <section key={list.name}>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-semibold">{list.name}</h2>
                <p className="text-sm text-slate-400">{list.description}</p>
              </div>
              <span className="text-sm text-slate-500">{new Date(list.published_at).toLocaleDateString()}</span>
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {list.items.map((item) => (
                <article
                  key={item.video.youtube_id}
                  className="rounded-2xl border border-slate-800 bg-slate-900/30 p-4 flex gap-4"
                >
                  <div className="w-28">
                    <img
                      className="h-16 w-28 rounded-2xl object-cover"
                      src={item.video.thumbnail_url}
                      alt={item.video.title}
                    />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs uppercase tracking-[0.25em] text-slate-500">#{item.rank}</p>
                    <h3 className="text-lg font-semibold">
                      <a
                        className="hover:text-emerald-300"
                        href={`https://youtube.com/watch?v=${item.video.youtube_id}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {item.video.title}
                      </a>
                    </h3>
                    <p className="text-sm text-slate-400">{item.video.channel_title}</p>
                    <p className="text-xs text-slate-500">
                      Views {item.video.view_count.toLocaleString()} · Likes {item.video.like_count.toLocaleString()}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-400">
                      {item.type_tags.map((tag) => (
                        <span key={tag} className="rounded-full border border-slate-700 px-2 py-0.5">
                          {tag}
                        </span>
                      ))}
                      <span className="rounded-full border border-slate-700 px-2 py-0.5">
                        {languageLabels[item.language] || "English"}
                      </span>
                      <span className="rounded-full border border-slate-700 px-2 py-0.5">
                        {item.video.duration ? `${Math.round(item.video.duration / 60)} min` : "Unknown"}
                      </span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
