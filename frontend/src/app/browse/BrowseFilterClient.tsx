"use client";

import { useMemo, useState, useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChannelFilterClient } from "./ChannelFilterClient";
import type { ChannelSummary } from "./channels";
import {
  FilterPanel,
  FilterState,
  triggerTypeOptions,
  talkingStyleOptions,
  roleplaySceneOptions,
} from "../../components/FilterPanel";
import { FilterHeader } from "../../components/FilterHeader";

function parseFiltersFromSearchParams(searchParams: URLSearchParams): FilterState {
  const duration = searchParams.get("duration");
  const tagsParam = searchParams.get("tags") || "";
  const languageParam = searchParams.get("language") || "";
  const excludeParam = searchParams.get("exclude") || "";

  const tagList = tagsParam
    ? tagsParam
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean)
    : [];

  const rawTriggerFilters = tagList.filter((t) => triggerTypeOptions.includes(t));
  const talkingStyleFilters = tagList.filter((t) => talkingStyleOptions.includes(t));
  const roleplayScenes = tagList.filter((t) => roleplaySceneOptions.includes(t));

  // 如果 URL 里有具体的 roleplay scene（rp_*），但没有显式带 roleplay，
  // 在 UI 层仍然把 Roleplay 视为选中，以保持视觉和语义一致。
  const triggerFilters =
    roleplayScenes.length > 0 && !rawTriggerFilters.includes("roleplay")
      ? [...rawTriggerFilters, "roleplay"]
      : rawTriggerFilters;

  const languageFilters = languageParam ? [languageParam] : [];

  const excludeTags = excludeParam
    ? excludeParam
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean)
    : [];

  return {
    duration: duration || null,
    triggerFilters,
    talkingStyleFilters,
    roleplayScenes,
    languageFilters,
    excludeTags,
  };
}

function buildTagsFromFilters(filters: FilterState, existingTags: string[]): string[] {
  const base = existingTags.filter(
    (t) =>
      !triggerTypeOptions.includes(t) &&
      !talkingStyleOptions.includes(t) &&
      !roleplaySceneOptions.includes(t)
  );

  // When any roleplay scene is selected, drop the generic "roleplay" tag so
  // the backend OR logic actually narrows results to the specific scenes.
  const triggerTags =
    filters.roleplayScenes.length > 0
      ? filters.triggerFilters.filter((t) => t !== "roleplay")
      : filters.triggerFilters;

  return [
    ...base,
    ...triggerTags,
    ...filters.talkingStyleFilters,
    ...filters.roleplayScenes,
  ];
}

export type BrowseFilterClientProps = {
  channels: ChannelSummary[];
};

export function BrowseFilterClient({ channels }: BrowseFilterClientProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const params = useMemo(() => new URLSearchParams(searchParams.toString()), [searchParams]);

  const [filtersCollapsed, setFiltersCollapsed] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(max-width: 768px)");
    setFiltersCollapsed(mq.matches);
  }, []);

  const filters = useMemo(() => parseFiltersFromSearchParams(params), [params]);

  const channelsParam = params.get("channels") || "";
  const selectedChannelIds = channelsParam
    ? channelsParam
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean)
    : [];

  const sort = params.get("sort");
  const tagsParam = params.get("tags") || "";

  const selectedTags = tagsParam
    ? tagsParam
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean)
    : [];

  const hasAnyFilter =
    filters.duration !== null ||
    filters.triggerFilters.length > 0 ||
    filters.talkingStyleFilters.length > 0 ||
    filters.roleplayScenes.length > 0 ||
    filters.languageFilters.length > 0 ||
    filters.excludeTags.length > 0 ||
    selectedChannelIds.length > 0 ||
    !!sort;

  const activeCount =
    (filters.duration ? 1 : 0) +
    filters.triggerFilters.length +
    filters.talkingStyleFilters.length +
    filters.roleplayScenes.length +
    filters.languageFilters.length +
    filters.excludeTags.length +
    (selectedChannelIds.length ? 1 : 0) +
    (sort && sort !== "published_desc" ? 1 : 0);

  const updateSearchParams = (nextFilters: FilterState) => {
    const nextParams = new URLSearchParams(searchParams.toString());

    // Duration
    if (nextFilters.duration) {
      nextParams.set("duration", nextFilters.duration);
    } else {
      nextParams.delete("duration");
    }

    // Language: single param, take first language filter if any
    if (nextFilters.languageFilters[0]) {
      nextParams.set("language", nextFilters.languageFilters[0]);
    } else {
      nextParams.delete("language");
    }

    // Tags: merge with any unknown tags
    const existingTags = selectedTags;
    const mergedTags = buildTagsFromFilters(nextFilters, existingTags);
    if (mergedTags.length) {
      nextParams.set("tags", mergedTags.join(","));
    } else {
      nextParams.delete("tags");
    }

    // Exclude tags
    if (nextFilters.excludeTags.length) {
      nextParams.set("exclude", nextFilters.excludeTags.join(","));
    } else {
      nextParams.delete("exclude");
    }

    nextParams.set("page", "1");

    router.push(`${pathname}?${nextParams.toString()}`, { scroll: false });
  };

  const handleClearFilters = () => {
    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.delete("duration");
    nextParams.delete("tags");
    nextParams.delete("language");
    nextParams.delete("sort");
    nextParams.delete("page");
    nextParams.delete("exclude");
    router.push(`${pathname}?${nextParams.toString()}`, { scroll: false });
  };

  return (
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
      <FilterHeader
        label="Filter catalog"
        activeCount={activeCount}
        hasAnyFilter={hasAnyFilter}
        filtersCollapsed={filtersCollapsed}
        hasBody={!filtersCollapsed}
        onToggleCollapsed={() => setFiltersCollapsed((v) => !v)}
        onClear={hasAnyFilter ? handleClearFilters : undefined}
      />

      {!filtersCollapsed && (
        <>
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
              duration={filters.duration}
              tagsParam={selectedTags.join(",")}
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
              {[
                { id: "published_desc", label: "Newest" },
                { id: "views_desc", label: "Most viewed" },
                { id: "likes_desc", label: "Most liked" },
              ].map((opt) => {
                const active = (sort || "published_desc") === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      const nextParams = new URLSearchParams(searchParams.toString());

                      if (opt.id === "published_desc") {
                        // Always reset to default: remove sort param
                        nextParams.delete("sort");
                      } else if (active) {
                        // Clicking the active non-default sort returns to default
                        nextParams.delete("sort");
                      } else {
                        nextParams.set("sort", opt.id);
                      }

                      nextParams.set("page", "1");
                      router.push(`${pathname}?${nextParams.toString()}`, { scroll: false });
                    }}
                    style={{
                      padding: "0.35rem 0.75rem",
                      borderRadius: "999px",
                      border: "1px solid",
                      borderColor: active ? "#2563eb" : "#475569",
                      background: active ? "#2563eb" : "#0f172a",
                      color: active ? "#fff" : "#e2e8f0",
                      fontSize: "0.7rem",
                      textDecoration: "none",
                      cursor: "pointer",
                    }}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Shared duration + trigger + talking style + roleplay scene + language */}
          <FilterPanel state={filters} onChange={updateSearchParams} />
        </>
      )}
    </div>
  );
}
