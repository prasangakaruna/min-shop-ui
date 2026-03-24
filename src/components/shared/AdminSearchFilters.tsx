'use client';

import React from 'react';

type StatusOption = { value: string; label: string };

type AdminSearchFiltersProps = {
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  onSearchSubmit?: () => void;
  showSearchButton?: boolean;
  statusValue?: string;
  onStatusChange?: (value: string) => void;
  statusOptions?: StatusOption[];
  className?: string;
};

export default function AdminSearchFilters({
  searchValue,
  onSearchChange,
  searchPlaceholder = 'Search...',
  onSearchSubmit,
  showSearchButton = false,
  statusValue,
  onStatusChange,
  statusOptions = [],
  className = '',
}: AdminSearchFiltersProps) {
  const hasStatus = typeof statusValue === 'string' && typeof onStatusChange === 'function' && statusOptions.length > 0;

  return (
    <div className={`flex flex-col gap-3 sm:flex-row sm:items-center ${className}`}>
      <div className="flex flex-1 gap-2">
        <div className="relative flex-1">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </span>
          <input
            type="text"
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onSearchSubmit?.()}
            placeholder={searchPlaceholder}
            className="w-full rounded-lg border border-gray-200 py-2.5 pl-10 pr-3 text-sm focus:border-mint focus:ring-2 focus:ring-mint/20"
          />
        </div>
        {showSearchButton && (
          <button
            type="button"
            onClick={onSearchSubmit}
            className="rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Search
          </button>
        )}
      </div>

      {hasStatus && (
        <select
          value={statusValue}
          onChange={(e) => onStatusChange(e.target.value)}
          className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:border-mint focus:ring-2 focus:ring-mint/20"
        >
          {statusOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}

