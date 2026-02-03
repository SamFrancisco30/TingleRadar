"use client";

import React from "react";

export type FilterHeaderProps = {
  label: string;
  activeCount: number;
  hasAnyFilter: boolean;
  filtersCollapsed: boolean;
  onToggleCollapsed: () => void;
  onClear?: () => void;
};

export const FilterHeader: React.FC<FilterHeaderProps> = ({
  label,
  activeCount,
  hasAnyFilter,
  filtersCollapsed,
  onToggleCollapsed,
  onClear,
}) => {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: "0.75rem",
        marginBottom: "0.6rem",
      }}
    >
      <div>
        <p
          style={{
            fontSize: "0.6rem",
            letterSpacing: "0.3em",
            textTransform: "uppercase",
            color: "#94a3b8",
            margin: 0,
          }}
        >
          {label}
          {activeCount > 0 && (
            <span style={{ fontSize: "0.7rem", color: "#9ca3af", marginLeft: "0.5rem" }}>
              · {activeCount} active
            </span>
          )}
        </p>
      </div>
      <div style={{ display: "flex", gap: "0.4rem", alignItems: "center" }}>
        {hasAnyFilter && onClear && (
          <button
            type="button"
            onClick={onClear}
            style={{
              border: "1px solid #475569",
              background: "transparent",
              color: "#cbd5f5",
              padding: "0.35rem 0.8rem",
              borderRadius: "999px",
              fontSize: "0.7rem",
              cursor: "pointer",
            }}
          >
            Clear
          </button>
        )}
        <button
          type="button"
          onClick={onToggleCollapsed}
          style={{
            border: "1px solid #475569",
            background: "transparent",
            color: "#cbd5f5",
            padding: "0.35rem 0.8rem",
            borderRadius: "999px",
            fontSize: "0.7rem",
            cursor: "pointer",
            whiteSpace: "nowrap",
          }}
        >
          {filtersCollapsed ? "Show filters" : "Hide filters"}
        </button>
      </div>
    </div>
  );
};
