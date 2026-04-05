'use client';

import React, { useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
import { useStorefront } from '@/context/StorefrontContext';
import StorefrontProductTeaserCard from '@/components/StorefrontProductTeaserCard';
import type { StorefrontProduct } from '@/lib/storefrontApi';
import { formatCategoryLabel, isCategoryHiddenFromStorefrontBrowse } from '@/lib/categories';
import {
  STOREFRONT_PRIMARY_BODY_LINK_CLASS,
  STOREFRONT_PRIMARY_BUTTON_STYLE,
  STOREFRONT_PRIMARY_LINK_CLASS,
  STOREFRONT_PRIMARY_SOLID_HOVER_CLASS,
} from '@/lib/storefrontHomeTheme';

interface CategoryProductsProps {
  products?: StorefrontProduct[];
  loading?: boolean;
}

export default function CategoryProducts({ products: propProducts, loading: propLoading }: CategoryProductsProps = {}) {
  const storefront = useStorefront();
  const products = propProducts ?? storefront?.products ?? [];
  const loading = propLoading ?? storefront?.loading ?? false;
  const storeSlug = storefront?.storeSlug ?? null;

  const byCategory = useMemo(() => {
    const map = new Map<string, StorefrontProduct[]>();
    products.forEach((p) => {
      const cat = (p.category && p.category.trim()) || 'Other';
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(p);
    });
    return Array.from(map.entries())
      .filter(([cat]) => !isCategoryHiddenFromStorefrontBrowse(cat))
      .sort((a, b) => a[0].localeCompare(b[0]));
  }, [products]);

  const firstCategory = byCategory[0]?.[0] ?? '';
  const [selectedCategory, setSelectedCategory] = useState(firstCategory);
  useEffect(() => {
    if (firstCategory && !byCategory.some(([c]) => c === selectedCategory)) {
      setSelectedCategory(firstCategory);
    }
  }, [firstCategory, byCategory, selectedCategory]);

  const selectedProducts = byCategory.find(([c]) => c === selectedCategory)?.[1] ?? [];
  const displayCategory = selectedCategory || firstCategory;

  const categoryProductsHref =
    storeSlug != null
      ? `/products?category=${encodeURIComponent(displayCategory)}&store=${encodeURIComponent(storeSlug)}`
      : `/products?category=${encodeURIComponent(displayCategory)}`;

  if (loading) {
    return (
      <section className="relative overflow-hidden border-t border-gray-100 bg-gradient-to-b from-gray-50/90 via-white to-white py-16 md:py-20">
        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto mb-10 max-w-2xl space-y-3 text-center md:mb-12">
            <div className="mx-auto h-6 w-40 animate-pulse rounded-full bg-gray-200" />
            <div className="mx-auto h-10 w-72 animate-pulse rounded-lg bg-gray-200 md:h-12 md:w-96" />
            <div className="mx-auto h-5 max-w-md animate-pulse rounded bg-gray-100" />
          </div>
          <div className="flex flex-col gap-8 lg:flex-row">
            <div className="hidden h-64 w-full animate-pulse rounded-xl bg-gray-100 lg:block lg:w-56 lg:shrink-0" />
            <div className="grid flex-1 grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-[18.5rem] animate-pulse rounded-xl bg-gray-100 ring-1 ring-gray-100" />
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (byCategory.length === 0) {
    return (
      <section className="border-t border-gray-100 bg-gradient-to-b from-gray-50/80 to-white py-16">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <p className="text-gray-600">No products to show by category yet.</p>
          <Link
            href={storeSlug ? `/products?store=${encodeURIComponent(storeSlug)}` : '/products'}
            className={`mt-4 inline-block ${STOREFRONT_PRIMARY_BODY_LINK_CLASS}`}
          >
            View all products
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section
      className="relative overflow-hidden border-t border-gray-100 bg-gradient-to-b from-gray-50/90 via-white to-white py-16 md:py-20"
      aria-labelledby="shop-by-category-heading"
    >
      <div className="pointer-events-none absolute inset-0 opacity-[0.35]" aria-hidden>
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2394a3b8' fill-opacity='0.08'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 text-center md:mb-12">
          <div className="mb-3 flex flex-wrap items-center justify-center gap-3">
            <div
              className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-wide shadow-sm"
              style={{
                backgroundColor: 'color-mix(in srgb, var(--sf-color-primary, #4FD1C7) 10%, white)',
                borderColor: 'color-mix(in srgb, var(--sf-color-primary, #4FD1C7) 22%, #e5e7eb)',
                color: 'color-mix(in srgb, var(--sf-color-primary, #4FD1C7) 78%, #0f172a)',
              }}
            >
              <span
                className="h-1.5 w-1.5 shrink-0 rounded-full motion-safe:animate-pulse"
                style={{ backgroundColor: 'var(--sf-color-primary, #4FD1C7)' }}
              />
              Browse catalog
            </div>
          </div>
          <h2
            id="shop-by-category-heading"
            className="text-3xl font-extrabold leading-tight sf-heading-color md:text-4xl lg:text-5xl"
          >
            Shop by{' '}
            <span className="relative inline-block">
              <span
                className="relative z-10 bg-clip-text text-transparent"
                style={{
                  backgroundImage:
                    'linear-gradient(to right, var(--sf-color-primary, #4FD1C7), color-mix(in srgb, var(--sf-color-primary, #4FD1C7) 62%, #0f172a))',
                }}
              >
                Category
              </span>
              <span
                className="absolute bottom-0.5 left-0 right-0 -z-0 h-2 -skew-x-12 transform opacity-25 md:bottom-1 md:h-2.5"
                style={{ backgroundColor: 'var(--sf-color-primary, #4FD1C7)' }}
              />
            </span>
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-base text-gray-600 md:text-lg">
            Pick a category to see products, or open the full catalog anytime.
          </p>
        </div>

        {/* Mobile / tablet: horizontal category chips */}
        <div className="mb-6 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] lg:hidden [&::-webkit-scrollbar]:hidden">
          {byCategory.map(([cat]) => {
            const active = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`shrink-0 rounded-full border px-4 py-2 text-sm font-semibold shadow-sm transition ${
                  active
                    ? `border-transparent text-white ${STOREFRONT_PRIMARY_SOLID_HOVER_CLASS}`
                    : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                }`}
                style={active ? STOREFRONT_PRIMARY_BUTTON_STYLE : undefined}
              >
                {formatCategoryLabel(cat)}
              </button>
            );
          })}
        </div>

        <div className="flex min-w-0 flex-col gap-8 lg:flex-row lg:gap-10">
          {/* Desktop sidebar */}
          <aside className="hidden w-56 shrink-0 lg:block xl:w-60">
            <div className="sticky top-24 rounded-xl border border-gray-100/90 bg-white p-3 shadow-sm ring-1 ring-black/[0.03]">
              <p className="mb-3 px-2 text-[11px] font-bold uppercase tracking-[0.12em] text-gray-400">Categories</p>
              <nav className="flex flex-col gap-0.5" aria-label="Product categories">
                {byCategory.map(([cat]) => {
                  const active = selectedCategory === cat;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedCategory(cat)}
                      className={`w-full rounded-lg px-3 py-2.5 text-left text-sm font-medium transition ${
                        active
                          ? `text-white ${STOREFRONT_PRIMARY_SOLID_HOVER_CLASS}`
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                      style={active ? STOREFRONT_PRIMARY_BUTTON_STYLE : undefined}
                    >
                      {formatCategoryLabel(cat)}
                    </button>
                  );
                })}
              </nav>
            </div>
          </aside>

          <div className="min-w-0 flex-1">
            <div className="mb-5 flex flex-col gap-3 border-b border-gray-100 pb-4 sm:flex-row sm:items-center sm:justify-between md:mb-6">
              <div className="min-w-0">
                <h3 className="text-xl font-bold sf-heading-color md:text-2xl">{formatCategoryLabel(displayCategory)}</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {selectedProducts.length === 0
                    ? 'No products in this category yet.'
                    : `${selectedProducts.length} product${selectedProducts.length === 1 ? '' : 's'} in this group`}
                </p>
              </div>
              <Link
                href={categoryProductsHref}
                className={`inline-flex shrink-0 items-center gap-2 self-start text-sm font-semibold sm:self-auto ${STOREFRONT_PRIMARY_LINK_CLASS}`}
              >
                View all in category
                <span className="text-base leading-none" aria-hidden>
                  →
                </span>
              </Link>
            </div>

            {selectedProducts.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50/60 py-14 text-center">
                <p className="text-gray-600">Nothing listed here yet.</p>
                <Link href={categoryProductsHref} className={`mt-3 inline-block text-sm ${STOREFRONT_PRIMARY_BODY_LINK_CLASS}`}>
                  Browse all products
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-2 lg:gap-6 xl:grid-cols-3 min-[1600px]:grid-cols-4">
                {selectedProducts.map((product) => (
                  <StorefrontProductTeaserCard
                    key={`${product.store_id}-${product.id}`}
                    product={product}
                    compact
                    showStoreName
                    ctaLabel="View details"
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
