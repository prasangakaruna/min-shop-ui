'use client';

import React from 'react';
import Link from 'next/link';
import { getImageDisplayUrl, type StorefrontProduct } from '@/lib/api';

type HeaderSearchSuggestionsProps = {
  open: boolean;
  loading: boolean;
  results: StorefrontProduct[];
  query: string;
  storeSlug: string;
  onRequestClose: () => void;
};

function searchResultsUrl(query: string, storeSlug: string): string {
  const params = new URLSearchParams();
  params.set('q', query.trim());
  if (storeSlug.trim()) {
    params.set('store', storeSlug.trim());
  }
  return `/search?${params.toString()}`;
}

export default function HeaderSearchSuggestions({
  open,
  loading,
  results,
  query,
  storeSlug,
  onRequestClose,
}: HeaderSearchSuggestionsProps) {
  if (!open) {
    return null;
  }

  const trimmed = query.trim();
  const showEmpty = !loading && trimmed.length >= 1 && results.length === 0;

  return (
    <div
      className="absolute z-[60] left-0 right-0 mt-1 rounded-xl border border-gray-200 bg-white shadow-lg overflow-hidden"
      onMouseDown={(e) => e.preventDefault()}
      role="listbox"
      aria-label="Search suggestions"
    >
      {loading && results.length === 0 && trimmed.length >= 1 && (
        <div className="px-4 py-6 text-center text-sm text-gray-500">Searching…</div>
      )}
      {loading && results.length > 0 && (
        <div className="px-3 py-1.5 text-center text-xs text-gray-500 border-b border-gray-100 bg-gray-50/50">
          Updating results…
        </div>
      )}
      {results.length > 0 && (
        <ul className="max-h-[min(70vh,22rem)] overflow-y-auto py-1">
          {results.map((p) => {
            const img =
              p.image_urls?.length && p.image_urls[0]
                ? getImageDisplayUrl(p.image_urls[0])
                : p.image_url
                  ? getImageDisplayUrl(p.image_url)
                  : '';
            return (
              <li key={p.id} role="option">
                <Link
                  href={`/product/${p.id}`}
                  onClick={onRequestClose}
                  className="flex items-center gap-3 px-3 py-2.5 hover:bg-mint/10 transition-colors"
                >
                  <div className="relative h-12 w-12 shrink-0 rounded-md bg-gray-100 overflow-hidden">
                    {img ? (
                      // eslint-disable-next-line @next/next/no-img-element -- product URLs come from many hosts (S3, API)
                      <img src={img} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-gray-400 text-xs">—</div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1 text-left">
                    <p className="text-sm font-medium text-gray-900 line-clamp-2">{p.title}</p>
                    {p.category ? (
                      <p className="text-xs text-gray-500 truncate">{p.category}</p>
                    ) : null}
                    <p className="text-sm text-mint font-semibold mt-0.5">{p.price}</p>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
      {showEmpty && (
        <div className="px-4 py-5 text-center text-sm text-gray-500">No matching products yet. Try full search.</div>
      )}
      {trimmed.length >= 1 && (
        <div className="border-t border-gray-100 bg-gray-50/80">
          <Link
            href={searchResultsUrl(trimmed, storeSlug)}
            onClick={onRequestClose}
            className="block px-4 py-3 text-center text-sm font-medium text-mint hover:bg-mint/10 transition-colors"
          >
            View all results for &ldquo;{trimmed.length > 40 ? `${trimmed.slice(0, 40)}…` : trimmed}&rdquo;
          </Link>
        </div>
      )}
    </div>
  );
}
