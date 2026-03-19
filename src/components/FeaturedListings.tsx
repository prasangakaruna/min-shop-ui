'use client';

import React from 'react';
import Link from 'next/link';
import { useStorefront } from '@/context/StorefrontContext';
import ProductImage from '@/components/ProductImage';
import type { StorefrontProduct } from '@/lib/storefrontApi';

interface FeaturedListingsProps {
  products?: StorefrontProduct[];
  loading?: boolean;
}

export default function FeaturedListings({ products: propProducts, loading: propLoading }: FeaturedListingsProps = {}) {
  const storefront = useStorefront();
  const products = propProducts ?? (storefront ? storefront.products.slice(0, 6) : []);
  const loading = propLoading ?? storefront?.loading ?? false;
  const storeSlug = storefront?.storeSlug ?? null;
  if (loading) {
    return (
      <section className="py-16 bg-white border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-10 w-48 mb-8 animate-pulse rounded bg-gray-100" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-80 animate-pulse rounded-xl bg-gray-100" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (products.length === 0) return null;

  return (
    <section className="py-16 bg-white border-t border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-12 gap-6">
          <div>
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900">Featured Listings</h2>
            <p className="mt-2 text-gray-600">Premium products from verified sellers</p>
          </div>
          <Link
            href={storeSlug ? `/products?store=${encodeURIComponent(storeSlug)}` : '/products'}
            className="inline-flex items-center gap-2 text-mint font-semibold hover:underline"
          >
            View All <span className="text-lg">→</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {products.map((product) => (
            <div
              key={`${product.store_id}-${product.id}`}
              className="rounded-xl border border-gray-100 bg-white overflow-hidden hover:shadow-lg hover:border-mint/20 transition"
            >
              <Link href={`/product/${product.id}${product.store?.slug ? `?store=${product.store.slug}` : ''}`} className="block relative h-40">
                <ProductImage imageUrl={product.image_url} alt={product.title} productId={product.id} containerClassName="h-40 w-full" />
              </Link>
              <div className="p-4">
                <Link href={`/product/${product.id}${product.store?.slug ? `?store=${product.store.slug}` : ''}`}>
                  <h3 className="font-bold text-gray-900 line-clamp-2 hover:text-mint">{product.title}</h3>
                </Link>
                <p className="text-xl font-bold text-mint mt-1">${product.price}</p>
                <p className="text-xs text-gray-500 mt-1">{product.store?.name ?? `Store #${product.store_id}`}</p>
                <Link
                  href={`/product/${product.id}${product.store?.slug ? `?store=${product.store.slug}` : ''}`}
                  className="mt-3 block w-full bg-mint text-white py-2 rounded-lg font-semibold text-center text-sm hover:bg-mint-dark"
                >
                  View Details
                </Link>
              </div>
            </div>
          ))}
        </div>

        {products.length >= 6 && (
          <div className="mt-12 text-center">
            <Link
              href={storeSlug ? `/products?store=${encodeURIComponent(storeSlug)}` : '/products'}
              className="inline-block bg-mint text-white px-8 py-3 rounded-lg font-semibold hover:bg-mint-dark"
            >
              View All Listings
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
