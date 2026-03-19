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

  const triggerTags =
    filters.roleplayScenes.length > 0
      ? filters.triggerFilters.filter((t) => t !== "roleplay")
      : filters.triggerFilters;

  return [...base, ...triggerTags, ...filters.talkingStyleFilters, ...filters.roleplayScenes];
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
  const [localFilters, setLocalFilters] = useState<FilterState>(() => parseFiltersFromSearchParams(params));

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(max-width: 768px)");
    setFiltersCollapsed(mq.matches);
  }, []);

  useEffect(() => {
    setLocalFilters(parseFiltersFromSearchParams(params));
  }, [params]);

  const filters = localFilters;

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

    if (nextFilters.duration) {
      nextParams.set("duration", nextFilters.duration);
    } else {
      nextParams.delete("duration");
    }

    if (nextFilters.languageFilters[0]) {
      nextParams.set("language", nextFilters.languageFilters[0]);
    } else {
      nextParams.delete("language");
    }

    const mergedTags = buildTagsFromFilters(nextFilters, selectedTags);
    if (mergedTags.length) {
      nextParams.set("tags", mergedTags.join(","));
    } else {
      nextParams.delete("tags");
    }

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
    <div className="control-panel" style={{ marginBottom: "1rem" }}>
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
          <div className="filter-group" style={{ marginTop: "0.2rem" }}>
            <p className="filter-group-title">Channel</p>
            <ChannelFilterClient
              channels={channels}
              duration={filters.duration}
              tagsParam={selectedTags.join(",")}
              selectedChannelIds={selectedChannelIds}
            />
          </div>

          <div className="filter-group" style={{ marginTop: "0.8rem" }}>
            <p className="filter-group-title">Sort by</p>
            <div className="chip-row">
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

                      if (opt.id === "published_desc" || active) {
                        nextParams.delete("sort");
                      } else {
                        nextParams.set("sort", opt.id);
                      }

                      nextParams.set("page", "1");
                      router.push(`${pathname}?${nextParams.toString()}`, { scroll: false });
                    }}
                    style={{
                      padding: "0.42rem 0.8rem",
                      borderRadius: "999px",
                      border: "1px solid",
                      borderColor: active
                        ? "rgba(157, 191, 202, 0.3)"
                        : "rgba(148, 184, 171, 0.14)",
                      background: active ? "rgba(94, 126, 137, 0.24)" : "rgba(13, 24, 29, 0.92)",
                      color: active ? "#eef4f7" : "var(--text-1)",
                      fontSize: "0.75rem",
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

          <div style={{ marginTop: "0.8rem" }}>
            <FilterPanel state={filters} onChange={setLocalFilters} />
          </div>

          <div style={{ marginTop: "0.8rem", display: "flex", justifyContent: "flex-end" }}>
            <button type="button" onClick={() => updateSearchParams(localFilters)} className="primary-button">
              Apply filters
            </button>
          </div>
        </>
      )}
    </div>
  );
}
