'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useStorefront } from '@/context/StorefrontContext';
import ProductImage from '@/components/ProductImage';
import {
  storefrontRequest,
  type StorefrontStore,
  type StorefrontProduct,
  type StorefrontStoresResponse,
  type StorefrontProductsResponse,
} from '@/lib/storefrontApi';

function useStores(initial?: StorefrontStore[] | null, initialLoading?: boolean, initialError?: string | null) {
  const [stores, setStores] = useState<StorefrontStore[]>(initial ?? []);
  const [loading, setLoading] = useState(initialLoading ?? true);
  const [error, setError] = useState<string | null>(initialError ?? null);
  const parentProvided = initial != null;
  const useParentData = parentProvided && initialLoading === false;
  useEffect(() => {
    if (parentProvided) return;
    storefrontRequest<StorefrontStoresResponse>('/storefront/stores', { per_page: 24 })
      .then((res) => setStores(res.data || []))
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load stores'))
      .finally(() => setLoading(false));
    return () => {};
  }, [parentProvided]);
  if (useParentData) return { stores: initial!, loading: false, error: initialError ?? null };
  if (parentProvided && initialLoading) return { stores: initial!, loading: true, error: null };
  return { stores, loading, error };
}

function useProducts(initial?: StorefrontProduct[] | null, initialLoading?: boolean, initialError?: string | null) {
  const [products, setProducts] = useState<StorefrontProduct[]>(initial ?? []);
  const [loading, setLoading] = useState(initialLoading ?? true);
  const [error, setError] = useState<string | null>(initialError ?? null);
  const parentProvided = initial != null;
  const useParentData = parentProvided && initialLoading === false;
  useEffect(() => {
    if (parentProvided) return;
    storefrontRequest<StorefrontProductsResponse>('/storefront/products', { per_page: 100 })
      .then((res) => setProducts(res.data || []))
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load products'))
      .finally(() => setLoading(false));
    return () => {};
  }, [parentProvided]);
  if (useParentData) return { products: initial!, loading: false, error: initialError ?? null };
  if (parentProvided && initialLoading) return { products: initial!, loading: true, error: null };
  return { products, loading, error };
}

interface MarketplaceStoresAndProductsProps {
  initialStores?: StorefrontStore[] | null;
  initialProducts?: StorefrontProduct[] | null;
  initialLoading?: boolean;
  initialError?: string | null;
}

export default function MarketplaceStoresAndProducts(props: MarketplaceStoresAndProductsProps = {}) {
  const storefront = useStorefront();
  const {
    initialStores = storefront?.stores ?? null,
    initialProducts = storefront?.products ?? null,
    initialLoading = storefront?.loading ?? false,
    initialError = storefront?.error ?? null,
  } = props;
  const { stores, loading: storesLoading, error: storesError } = useStores(initialStores, initialLoading, initialError);
  const { products, loading: productsLoading, error: productsError } = useProducts(initialProducts, initialLoading, initialError);

  const byCategory = React.useMemo(() => {
    const map = new Map<string, StorefrontProduct[]>();
    products.forEach((p) => {
      const cat = p.category && p.category.trim() ? p.category.trim() : 'Other';
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(p);
    });
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [products]);

  const noData = !storesLoading && !productsLoading && stores.length === 0 && products.length === 0;
  const noApi = storesError && productsError;

  return (
    <section className="border-t border-gray-100 bg-white py-12 md:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {noApi && (
          <div className="mb-8 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Marketplace data is unavailable. Check that the API is running and NEXT_PUBLIC_API_URL is set.
          </div>
        )}

        {/* Stores */}
        <div className="mb-14">
          <h2 className="text-2xl font-bold text-gray-900">Stores</h2>
          <p className="mt-1 text-sm text-gray-500">Shop from these stores on the marketplace.</p>
          {storesLoading ? (
            <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-28 animate-pulse rounded-xl bg-gray-100" />
              ))}
            </div>
          ) : stores.length === 0 ? (
            <p className="mt-6 text-sm text-gray-500">No stores yet.</p>
          ) : (
            <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {stores.map((store) => (
                <Link
                  key={store.id}
                  href={`/products?store=${store.slug}`}
                  className="flex flex-col items-center rounded-xl border border-gray-200 bg-gray-50/50 p-4 text-center transition hover:border-mint/40 hover:bg-mint/5"
                >
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-mint/20 text-xl font-semibold text-mint">
                    {store.name.charAt(0).toUpperCase()}
                  </span>
                  <span className="mt-2 block font-medium text-gray-900">{store.name}</span>
                  <span className="mt-0.5 block text-xs text-gray-500">{store.slug}</span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Products by category: under one category, similar products from different stores with different prices */}
        <div id="products-by-category">
          <h2 className="text-2xl font-bold text-gray-900">Products by category</h2>
          <p className="mt-1 text-sm text-gray-500">
            In each category you may see similar products from different stores with different prices.
          </p>
          {productsLoading ? (
            <div className="mt-6 space-y-10">
              {[1, 2].map((i) => (
                <div key={i}>
                  <div className="h-6 w-32 animate-pulse rounded bg-gray-100" />
                  <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                    {Array.from({ length: 4 }).map((_, j) => (
                      <div key={j} className="h-48 animate-pulse rounded-xl bg-gray-100" />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : byCategory.length === 0 ? (
            <p className="mt-6 text-sm text-gray-500">No products yet. Add products with a category in the admin.</p>
          ) : (
            <div className="mt-6 space-y-10">
              {byCategory.map(([category, items]) => (
                <div key={category}>
                  <h3 className="text-lg font-semibold text-gray-900">{category}</h3>
                  <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                    {items.map((product) => (
                      <Link
                        key={`${product.store_id}-${product.id}`}
                        href={`/products?category=${encodeURIComponent(category)}&store=${product.store?.slug ?? product.store_id}`}
                        className="group flex flex-col rounded-xl border border-gray-200 bg-white p-4 transition hover:border-mint/40 hover:shadow-md"
                      >
                        <ProductImage imageUrl={product.image_url} alt={product.title} productId={product.id} containerClassName="h-24 rounded-lg group-hover:bg-mint/5" />
                        <p className="mt-3 line-clamp-2 font-medium text-gray-900">{product.title}</p>
                        <p className="mt-1 text-xs text-gray-500">
                          {product.store?.name ?? `Store #${product.store_id}`}
                        </p>
                        <p className="mt-2 text-lg font-semibold text-mint">${product.price}</p>
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {noData && !noApi && (
          <p className="mt-8 text-center text-sm text-gray-500">
            No stores or products yet. Create a store and add products in the{' '}
            <Link href="/admin" className="font-medium text-mint hover:underline">
              admin panel
            </Link>
            .
          </p>
        )}
      </div>
    </section>
  );
}
