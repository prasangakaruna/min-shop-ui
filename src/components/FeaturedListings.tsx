'use client';

import React from 'react';
import Link from 'next/link';
import { useStorefront } from '@/context/StorefrontContext';
import type { StorefrontProduct } from '@/lib/storefrontApi';
import StorefrontProductTeaserCard from '@/components/StorefrontProductTeaserCard';
import {
  STOREFRONT_PRIMARY_BUTTON_STYLE,
  STOREFRONT_PRIMARY_LINK_CLASS,
  STOREFRONT_PRIMARY_SOLID_HOVER_CLASS,
} from '@/lib/storefrontHomeTheme';

interface FeaturedListingsProps {
  products?: StorefrontProduct[];
  loading?: boolean;
}

export default function FeaturedListings({ products: propProducts, loading: propLoading }: FeaturedListingsProps = {}) {
  const storefront = useStorefront();
  const products = propProducts ?? (storefront ? storefront.products.slice(0, 6) : []);
  const loading = propLoading ?? storefront?.loading ?? false;
  const storeSlug = storefront?.storeSlug ?? null;
  const productsHref = storeSlug ? `/products?store=${encodeURIComponent(storeSlug)}` : '/products';

  if (loading) {
    return (
      <section className="relative overflow-hidden border-t border-gray-100 bg-gradient-to-b from-gray-50/90 via-white to-gray-50/50 py-16 md:py-20">
        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 flex flex-col gap-4 md:mb-12 md:flex-row md:items-end md:justify-between">
            <div className="space-y-3">
              <div className="h-6 w-32 animate-pulse rounded-full bg-gray-200" />
              <div className="h-10 w-64 animate-pulse rounded-lg bg-gray-200 md:h-12 md:w-80" />
              <div className="h-5 w-full max-w-md animate-pulse rounded bg-gray-100" />
            </div>
            <div className="h-10 w-28 animate-pulse rounded-lg bg-gray-100" />
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-8 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-[18.5rem] animate-pulse rounded-xl bg-gray-100/80 ring-1 ring-gray-100" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (products.length === 0) return null;

  return (
    <section
      className="relative overflow-hidden border-t border-gray-100 bg-gradient-to-b from-gray-50/90 via-white to-gray-50/50 py-16 md:py-20"
      aria-labelledby="featured-listings-heading"
    >
      <div className="pointer-events-none absolute inset-0 opacity-[0.35]" aria-hidden>
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2394a3b8' fill-opacity='0.09'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 flex flex-col gap-6 md:mb-14 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl space-y-1.5">
            <div className="mb-3 flex flex-wrap items-center gap-3">
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
                Featured picks
              </div>
              <div
                className="hidden h-px flex-1 sm:block"
                style={{
                  background: `linear-gradient(to right, color-mix(in srgb, var(--sf-color-primary, #4FD1C7) 28%, transparent), transparent)`,
                }}
              />
            </div>
            <h2
              id="featured-listings-heading"
              className="text-3xl font-extrabold leading-tight sf-heading-color md:text-4xl lg:text-5xl"
            >
              Featured{' '}
              <span className="relative inline-block">
                <span
                  className="relative z-10 bg-clip-text text-transparent"
                  style={{
                    backgroundImage:
                      'linear-gradient(to right, var(--sf-color-primary, #4FD1C7), color-mix(in srgb, var(--sf-color-primary, #4FD1C7) 62%, #0f172a))',
                  }}
                >
                  Listings
                </span>
                <span
                  className="absolute bottom-1 left-0 right-0 -z-0 h-2 -skew-x-12 transform opacity-25 md:bottom-1.5 md:h-2.5"
                  style={{ backgroundColor: 'var(--sf-color-primary, #4FD1C7)' }}
                />
              </span>
            </h2>
            <p className="text-base leading-relaxed text-gray-600 md:text-lg">
              Curated highlights from this storefront — quality-checked and ready to shop.
            </p>
          </div>
          <Link href={productsHref} className={`inline-flex shrink-0 items-center gap-2 self-start md:self-auto ${STOREFRONT_PRIMARY_LINK_CLASS}`}>
            View catalog
            <span className="text-lg leading-none" aria-hidden>
              →
            </span>
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-8 lg:grid-cols-3">
          {products.map((product) => (
            <StorefrontProductTeaserCard
              key={`${product.store_id}-${product.id}`}
              product={product}
              imageBadgeLabel="Featured"
              showCategory
              showStoreName
            />
          ))}
        </div>

        {products.length >= 6 ? (
          <div className="mt-12 flex justify-center md:mt-14">
            <Link
              href={productsHref}
              className={`inline-flex items-center gap-2 rounded-xl px-8 py-3.5 text-sm font-semibold shadow-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-xl ${STOREFRONT_PRIMARY_SOLID_HOVER_CLASS}`}
              style={STOREFRONT_PRIMARY_BUTTON_STYLE}
            >
              <span>Browse all listings</span>
              <svg className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        ) : null}
      </div>
    </section>
  );
}
