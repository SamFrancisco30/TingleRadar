"use client";

import React from "react";

export type FilterHeaderProps = {
  label: string;
  activeCount: number;
  hasAnyFilter: boolean;
  filtersCollapsed: boolean;
  hasBody?: boolean;
  onToggleCollapsed: () => void;
  onClear?: () => void;
};

export const FilterHeader: React.FC<FilterHeaderProps> = ({
  label,
  activeCount,
  hasAnyFilter,
  filtersCollapsed,
  hasBody = true,
  onToggleCollapsed,
  onClear,
}) => {
  return (
    <div className="filter-header" style={{ marginBottom: hasBody ? "0.8rem" : 0 }}>
      <div className="filter-heading">
        <h2 className="filter-title">{label}</h2>
        <p style={{ margin: 0, color: "var(--text-2)", fontSize: "0.82rem" }}>
          {activeCount > 0
            ? `${activeCount} active filters shaping this list.`
            : "Narrow the catalog without losing the calm overview."}
        </p>
      </div>
      <div className="filter-actions">
        {hasAnyFilter && onClear && (
          <button type="button" onClick={onClear} className="ghost-button">
            Clear
          </button>
        )}
        <button
          type="button"
          onClick={onToggleCollapsed}
          className="subtle-button"
          style={{ whiteSpace: "nowrap" }}
        >
          {filtersCollapsed ? "Show filters" : "Hide filters"}
        </button>
      </div>
    </div>
  );
};
