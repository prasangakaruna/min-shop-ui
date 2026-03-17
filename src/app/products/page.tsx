"use client";

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ProductCard from '@/components/ProductCard';
import FilterSidebar from '@/components/FilterSidebar';
import Pagination from '@/components/Pagination';
import {
  getStorefrontProducts,
  getImageDisplayUrl,
  addStorefrontCartLine,
  setCartTokenForStore,
  setCartCount,
  type StorefrontProduct,
} from '@/lib/api';

const PER_PAGE = 24;
const LAST_CART_STORE_KEY = 'mint_cart_store_id';

function toCardProps(
  p: StorefrontProduct,
  opts?: { onAddToCart?: (storeId: number, variantId: number) => void; addingVariantId?: number | null }
) {
  const firstVariant = p.variants?.[0];
  const imageUrl = p.image_urls?.length ? p.image_urls[0] : p.image_url ?? '';
  return {
    id: String(p.id),
    image: getImageDisplayUrl(imageUrl) || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&q=80',
    title: p.title,
    category: p.category ?? '',
    price: p.price,
    originalPrice: firstVariant?.compare_at_price ?? undefined,
    rating: undefined,
    badge: null as string | null,
    badgeColor: 'mint' as const,
    storeId: p.store_id,
    productVariantId: firstVariant?.id,
    onAddToCart: opts?.onAddToCart,
    addToCartLoading: opts?.addingVariantId != null && opts.addingVariantId === firstVariant?.id,
  };
}

function ProductsPageInner() {
  const searchParams = useSearchParams();
  const categoryParam = searchParams.get('category') ?? '';
  const pageParam = searchParams.get('page');
  const searchParam = searchParams.get('search') ?? '';

  const [products, setProducts] = useState<StorefrontProduct[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addingVariantId, setAddingVariantId] = useState<number | null>(null);

  const handleAddToCart = useCallback(
    async (storeId: number, productVariantId: number) => {
      setAddingVariantId(productVariantId);
      try {
        const cart = await addStorefrontCartLine(storeId, productVariantId, 1);
        if (cart.cart_token) setCartTokenForStore(storeId, cart.cart_token);
        if (typeof window !== 'undefined') localStorage.setItem(LAST_CART_STORE_KEY, String(storeId));
        const total = (cart.lines ?? []).reduce((sum, l) => sum + l.quantity, 0);
        setCartCount(total);
        window.location.href = `/cart?store_id=${storeId}`;
      } catch {
        setAddingVariantId(null);
      }
    },
    []
  );

  const currentPage = Math.max(1, parseInt(pageParam ?? '1', 10) || 1);
  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));

  const setPage = useCallback(
    (page: number) => {
      const params = new URLSearchParams(searchParams.toString());
      if (page <= 1) params.delete('page');
      else params.set('page', String(page));
      window.history.replaceState(null, '', `${window.location.pathname}${params.toString() ? `?${params}` : ''}`);
    },
    [searchParams]
  );

  const setCategory = useCallback(
    (category: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.delete('page');
      if (category) params.set('category', category);
      else params.delete('category');
      window.history.replaceState(null, '', `${window.location.pathname}${params.toString() ? `?${params}` : ''}`);
    },
    [searchParams]
  );

  useEffect(() => {
    setLoading(true);
    setError(null);
    getStorefrontProducts({
      page: currentPage,
      per_page: PER_PAGE,
      category: categoryParam || undefined,
      search: searchParam || undefined,
    })
      .then((res) => {
        setProducts(res.data);
        setTotal(res.total);
      })
      .catch((e) => {
        setError(e instanceof Error ? e.message : 'Failed to load products');
        setProducts([]);
        setTotal(0);
      })
      .finally(() => setLoading(false));
  }, [currentPage, categoryParam, searchParam]);

  const startIndex = total === 0 ? 0 : (currentPage - 1) * PER_PAGE + 1;
  const endIndex = Math.min(currentPage * PER_PAGE, total);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <nav className="mb-6">
          <ol className="flex items-center space-x-2 text-sm text-gray-600">
            <li>
              <Link href="/" className="hover:text-mint">
                Home
              </Link>
            </li>
            <li>/</li>
            <li className="text-gray-800">Products</li>
          </ol>
        </nav>

        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Products</h1>
          {loading ? (
            <p className="text-gray-600">Loading…</p>
          ) : error ? (
            <p className="text-red-600">{error}</p>
          ) : (
            <p className="text-gray-600">{total} Result{total !== 1 ? 's' : ''}</p>
          )}
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          <div className="lg:w-64 flex-shrink-0">
            <FilterSidebar category={categoryParam} />
          </div>

          <div className="flex-1">
            {!loading && !error && (
              <div className="flex items-center justify-between mb-6">
                <p className="text-gray-600">
                  Showing {startIndex}-{endIndex} of {total} products
                </p>
                <div className="flex items-center space-x-4">
                  <select
                    className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-mint focus:border-transparent"
                    defaultValue="newest"
                    aria-label="Sort"
                  >
                    <option value="newest">Newest Arrivals</option>
                    <option value="popular">Most Popular</option>
                    <option value="price-low">Price: Low to High</option>
                    <option value="price-high">Price: High to Low</option>
                  </select>
                </div>
              </div>
            )}

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {[...Array(PER_PAGE)].map((_, i) => (
                  <div key={i} className="bg-white rounded-lg shadow overflow-hidden animate-pulse">
                    <div className="h-48 bg-gray-200" />
                    <div className="p-4 space-y-3">
                      <div className="h-3 bg-gray-200 rounded w-1/4" />
                      <div className="h-5 bg-gray-200 rounded w-3/4" />
                      <div className="h-6 bg-gray-200 rounded w-1/3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="py-12 text-center text-gray-600">
                <p className="mb-4">{error}</p>
                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="text-mint font-medium hover:underline"
                >
                  Try again
                </button>
              </div>
            ) : products.length === 0 ? (
              <div className="py-12 text-center text-gray-600">
                <p className="mb-4">No products found.</p>
                <Link href="/products" className="text-mint font-medium hover:underline">
                  View all products
                </Link>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                  {products.map((product) => (
                    <ProductCard
                      key={product.id}
                      {...toCardProps(product, {
                        onAddToCart: handleAddToCart,
                        addingVariantId,
                      })}
                    />
                  ))}
                </div>
                {totalPages > 1 && (
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setPage}
                  />
                )}
              </>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50">
          <Header />
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <p className="text-gray-600">Loading products…</p>
          </main>
          <Footer />
        </div>
      }
    >
      <ProductsPageInner />
    </Suspense>
  );
}
