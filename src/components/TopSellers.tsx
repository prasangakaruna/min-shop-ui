'use client';

import React from 'react';
import Link from 'next/link';
import { useStorefront } from '@/context/StorefrontContext';
import ProductImage from '@/components/ProductImage';
import type { StorefrontProduct } from '@/lib/storefrontApi';

interface TopSellersProps {
  products?: StorefrontProduct[];
  loading?: boolean;
}

export default function TopSellers({ products: propProducts, loading: propLoading }: TopSellersProps = {}) {
  const storefront = useStorefront();
  const products = propProducts ?? (storefront ? storefront.products.slice(0, 4) : []);
  const loading = propLoading ?? storefront?.loading ?? false;
  if (loading) {
    return (
      <section className="py-16 bg-gray-50 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-10 w-40 mb-8 animate-pulse rounded bg-gray-200" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-64 animate-pulse rounded-xl bg-gray-200" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (products.length === 0) return null;

  return (
    <section className="py-16 bg-gray-50 border-t border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-12 gap-6">
          <div>
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900">Top Sellers</h2>
            <p className="mt-2 text-gray-600">Best performing products</p>
          </div>
          <Link href="/products" className="inline-flex items-center gap-2 text-mint font-semibold hover:underline">
            View All <span className="text-lg">→</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {products.map((product, index) => (
            <div
              key={`${product.store_id}-${product.id}`}
              className="bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-lg transition relative"
            >
              <div className="absolute top-3 left-3 z-10 w-8 h-8 rounded-full bg-yellow-400 text-gray-800 flex items-center justify-center font-bold text-sm">
                #{index + 1}
              </div>
              <Link href={`/product/${product.id}${product.store?.slug ? `?store=${product.store.slug}` : ''}`} className="block relative h-40">
                <ProductImage imageUrl={product.image_url} alt={product.title} productId={product.id} containerClassName="h-40 w-full" />
              </Link>
              <div className="p-4">
                <Link href={`/product/${product.id}${product.store?.slug ? `?store=${product.store.slug}` : ''}`}>
                  <h3 className="font-bold text-gray-900 line-clamp-2 hover:text-mint text-sm">{product.title}</h3>
                </Link>
                <p className="text-lg font-bold text-mint mt-2">${product.price}</p>
                <Link
                  href={`/product/${product.id}${product.store?.slug ? `?store=${product.store.slug}` : ''}`}
                  className="mt-2 block w-full bg-mint text-white py-2 rounded-lg font-semibold text-center text-xs hover:bg-mint-dark"
                >
                  View Details
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
