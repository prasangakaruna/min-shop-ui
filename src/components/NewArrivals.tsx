'use client';

import React from 'react';
import Link from 'next/link';
import { useStorefront } from '@/context/StorefrontContext';
import StorefrontProductTeaserCard from '@/components/StorefrontProductTeaserCard';
import type { StorefrontProduct } from '@/lib/storefrontApi';
import { STOREFRONT_PRIMARY_LINK_CLASS } from '@/lib/storefrontHomeTheme';

interface NewArrivalsProps {
  products?: StorefrontProduct[];
  loading?: boolean;
}

export default function NewArrivals({ products: propProducts, loading: propLoading }: NewArrivalsProps = {}) {
  const storefront = useStorefront();
  const products = propProducts ?? (storefront ? storefront.products.slice(0, 6) : []);
  const loading = propLoading ?? storefront?.loading ?? false;
  const storeSlug = storefront?.storeSlug ?? null;

  if (loading) {
    return (
      <section className="border-t border-gray-100 bg-white py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 h-10 w-44 animate-pulse rounded-lg bg-gray-100 md:mb-12" />
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-8 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-[18.5rem] animate-pulse rounded-xl bg-gray-100 ring-1 ring-gray-100" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (products.length === 0) return null;

  return (
    <section className="border-t border-gray-100 bg-white py-16 md:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 flex flex-col gap-6 md:mb-12 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-3xl font-extrabold sf-heading-color md:text-4xl">New Arrivals</h2>
            <p className="mt-2 text-base text-gray-600 md:text-lg">Latest additions to the storefront</p>
          </div>
          <Link
            href={storeSlug ? `/products?store=${encodeURIComponent(storeSlug)}` : '/products'}
            className={`inline-flex shrink-0 items-center gap-2 self-start md:self-auto ${STOREFRONT_PRIMARY_LINK_CLASS}`}
          >
            View all
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
              showCategory
              showStoreName
              ctaLabel="View details"
            />
          ))}
        </div>
      </div>
    </section>
  );
}
