'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { formatCategoryLabel, isCategoryHiddenFromStorefrontBrowse } from '@/lib/categories';
import {
  storefrontRequest,
  type StorefrontBrowseCategoryRow,
  type StorefrontBrowseCategoriesResponse,
} from '@/lib/storefrontApi';
import { STOREFRONT_PRIMARY_BUTTON_STYLE, STOREFRONT_PRIMARY_SOLID_HOVER_CLASS } from '@/lib/storefrontHomeTheme';

function buildProductsHref(opts: { storeSlug?: string; search?: string; categoryId?: string | null }) {
  const params = new URLSearchParams();
  if (opts.storeSlug) params.set('store', opts.storeSlug);
  if (opts.search && opts.search.trim()) params.set('search', opts.search.trim());
  if (opts.categoryId && opts.categoryId.trim()) params.set('category', opts.categoryId.trim());
  const qs = params.toString();
  return qs ? `/products?${qs}` : '/products';
}

function categoryIsActive(selected: string, rowId: string): boolean {
  if (!selected.trim()) return false;
  return selected.trim() === rowId.trim();
}

interface FilterSidebarProps {
  /** Raw `category` query value (decoded). */
  category?: string;
  storeSlug?: string;
  search?: string;
}

export default function FilterSidebar({ category = '', storeSlug, search }: FilterSidebarProps) {
  const [rows, setRows] = useState<StorefrontBrowseCategoryRow[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setRows(null);
    setLoadError(null);
    storefrontRequest<StorefrontBrowseCategoriesResponse>('/storefront/browse-categories', {
      ...(storeSlug ? { store: storeSlug } : {}),
    })
      .then((r) => {
        if (cancelled) return;
        const raw = Array.isArray(r.data?.categories) ? r.data!.categories! : [];
        setRows(raw.filter((row) => !isCategoryHiddenFromStorefrontBrowse(row.id)));
      })
      .catch(() => {
        if (!cancelled) {
          setRows([]);
          setLoadError('Could not load categories.');
        }
      });
    return () => {
      cancelled = true;
    };
  }, [storeSlug]);

  const totalFromCategories = useMemo(() => rows?.reduce((s, r) => s + (r.count ?? 0), 0) ?? 0, [rows]);

  const allHref = useMemo(
    () => buildProductsHref({ storeSlug, search, categoryId: null }),
    [storeSlug, search]
  );

  if (rows === null) {
    return (
      <aside className="w-full space-y-4 lg:w-64" aria-busy="true">
        <div className="h-6 w-32 animate-pulse rounded bg-gray-200" />
        <ul className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <li key={i} className="h-10 animate-pulse rounded-lg bg-gray-100" />
          ))}
        </ul>
      </aside>
    );
  }

  const showEmpty = rows.length === 0;

  return (
    <aside className="w-full space-y-6 lg:w-64">
      <div>
        <h3 className="mb-4 flex items-center text-lg font-bold text-gray-800">
          <svg
            className="mr-2 h-5 w-5 shrink-0 text-[color:var(--sf-color-primary,#4FD1C7)]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
            />
          </svg>
          Categories
        </h3>
        {loadError ? <p className="mb-2 text-sm text-amber-800">{loadError}</p> : null}
        {showEmpty ? (
          <p className="text-sm text-gray-600">No categories yet for this catalog.</p>
        ) : null}
        <ul className="space-y-2">
          <li>
            <Link
              href={allHref}
              scroll={false}
              className={`flex items-center justify-between rounded-lg px-3 py-2 font-medium transition-colors ${
                !category.trim()
                  ? `text-white ${STOREFRONT_PRIMARY_SOLID_HOVER_CLASS}`
                  : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
              }`}
              style={!category.trim() ? STOREFRONT_PRIMARY_BUTTON_STYLE : undefined}
            >
              <span>All products</span>
              <span className={`text-sm tabular-nums ${!category.trim() ? 'text-white/80' : 'text-gray-500'}`}>
                {totalFromCategories}
              </span>
            </Link>
          </li>
          {rows.map((row) => {
            const active = categoryIsActive(category, row.id);
            const href = buildProductsHref({ storeSlug, search, categoryId: row.id });
            return (
              <li key={row.id}>
                <Link
                  href={href}
                  scroll={false}
                  className={`flex items-center justify-between rounded-lg px-3 py-2 font-medium transition-colors ${
                    active ? `text-white ${STOREFRONT_PRIMARY_SOLID_HOVER_CLASS}` : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                  }`}
                  style={active ? STOREFRONT_PRIMARY_BUTTON_STYLE : undefined}
                >
                  <span className="line-clamp-2 pr-2">{formatCategoryLabel(row.id)}</span>
                  <span className={`shrink-0 text-sm tabular-nums ${active ? 'text-white/80' : 'text-gray-500'}`}>
                    {row.count}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="border-t border-gray-200 pt-4">
        <p className="text-xs text-gray-500">Counts reflect active products in this storefront.</p>
      </div>
    </aside>
  );
}
