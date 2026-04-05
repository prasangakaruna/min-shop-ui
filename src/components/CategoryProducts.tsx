'use client';

import React, { useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
import { useStorefront } from '@/context/StorefrontContext';
import ProductImage from '@/components/ProductImage';
import type { StorefrontProduct } from '@/lib/storefrontApi';
import { formatCategoryLabel, isCategoryHiddenFromStorefrontBrowse } from '@/lib/categories';
import {
  STOREFRONT_PRIMARY_BODY_LINK_CLASS,
  STOREFRONT_PRIMARY_PRICE_CLASS,
  STOREFRONT_PRIMARY_BUTTON_STYLE,
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

  if (loading) {
    return (
      <section className="py-16 bg-white border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-10 w-64 mx-auto mb-8 animate-pulse rounded bg-gray-100" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-72 animate-pulse rounded-2xl bg-gray-100" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (byCategory.length === 0) {
    return (
      <section className="py-16 bg-white border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
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
    <section className="py-16 bg-white border-t border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <h2 className="text-3xl md:text-4xl font-extrabold sf-heading-color">Shop by Category</h2>
          <p className="mt-2 text-gray-600">Browse products from your favorite categories</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          <div className="lg:w-64 flex-shrink-0">
            <div className="bg-gray-50 rounded-2xl p-4 space-y-1 border border-gray-100 sticky top-8">
              <h3 className="text-lg font-bold sf-heading-color mb-3">Categories</h3>
              {byCategory.map(([cat]) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`w-full rounded-xl px-4 py-2.5 text-left text-sm font-medium transition ${
                    selectedCategory === cat
                      ? `text-white ${STOREFRONT_PRIMARY_SOLID_HOVER_CLASS}`
                      : 'text-gray-700 hover:bg-[color:color-mix(in_srgb,var(--sf-color-button,var(--sf-color-primary,#4FD1C7))_12%,transparent)]'
                  }`}
                  style={selectedCategory === cat ? STOREFRONT_PRIMARY_BUTTON_STYLE : undefined}
                >
                  {formatCategoryLabel(cat)}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-xl font-bold sf-heading-color">{formatCategoryLabel(displayCategory)}</h3>
              <Link
                href={storeSlug ? `/products?category=${encodeURIComponent(displayCategory)}&store=${encodeURIComponent(storeSlug)}` : `/products?category=${encodeURIComponent(displayCategory)}`}
                className={`text-sm ${STOREFRONT_PRIMARY_BODY_LINK_CLASS}`}
              >
                View all
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {selectedProducts.map((product) => (
                <Link
                  key={`${product.store_id}-${product.id}`}
                  href={`/product/${product.id}${product.store?.slug ? `?store=${product.store.slug}` : ''}`}
                  prefetch={false}
                  className="group rounded-2xl border border-gray-100 bg-white p-4 transition hover:border-[color:color-mix(in_srgb,var(--sf-color-primary,#4FD1C7)_22%,transparent)] hover:shadow-lg"
                >
                  <ProductImage
                    imageUrl={product.image_url}
                    alt={product.title}
                    productId={product.id}
                    containerClassName="h-32 rounded-xl group-hover:bg-[color:color-mix(in_srgb,var(--sf-color-primary,#4FD1C7)_6%,transparent)]"
                  />
                  <h3 className="mt-3 font-semibold text-gray-900 line-clamp-2">{product.title}</h3>
                  <p className="mt-1 text-xs text-gray-500">{product.store?.name ?? `Store #${product.store_id}`}</p>
                  <p className={`mt-2 text-lg ${STOREFRONT_PRIMARY_PRICE_CLASS}`}>${product.price}</p>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
