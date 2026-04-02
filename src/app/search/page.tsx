'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ProductCard from '@/components/ProductCard';
import FilterSidebar from '@/components/FilterSidebar';
import Pagination from '@/components/Pagination';
import { useStorefrontStoreScope } from '@/hooks/useStorefrontStoreScope';
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
    rating: p.rating?.average,
    badge: null as string | null,
    badgeColor: 'mint' as const,
    storeId: p.store_id,
    productVariantId: firstVariant?.id,
    onAddToCart: opts?.onAddToCart,
    addToCartLoading: opts?.addingVariantId != null && opts.addingVariantId === firstVariant?.id,
  };
}

function SearchContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const query = (searchParams.get('q') ?? '').trim();
  const categoryParam = searchParams.get('category') ?? '';
  const storeParam = searchParams.get('store') ?? '';
  const scopedStore = useStorefrontStoreScope(storeParam);
  const pageParam = searchParams.get('page');

  const [products, setProducts] = useState<StorefrontProduct[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [addingVariantId, setAddingVariantId] = useState<number | null>(null);

  const currentPage = Math.max(1, parseInt(pageParam ?? '1', 10) || 1);
  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));

  const setPage = useCallback(
    (page: number) => {
      const params = new URLSearchParams(searchParams.toString());
      if (page <= 1) params.delete('page');
      else params.set('page', String(page));
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [searchParams, router, pathname]
  );

  const handleAddToCart = useCallback(
    async (storeId: number, productVariantId: number) => {
      setAddingVariantId(productVariantId);
      try {
        const cart = await addStorefrontCartLine(storeId, productVariantId, 1);
        if (cart.cart_token) setCartTokenForStore(storeId, cart.cart_token);
        if (typeof window !== 'undefined') localStorage.setItem(LAST_CART_STORE_KEY, String(storeId));
        const count = (cart.lines ?? []).reduce((sum, l) => sum + l.quantity, 0);
        setCartCount(count);
        window.location.href = `/cart?store_id=${storeId}`;
      } catch {
        setAddingVariantId(null);
      }
    },
    []
  );

  useEffect(() => {
    if (!query) {
      setProducts([]);
      setTotal(0);
      setLoading(false);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    getStorefrontProducts({
      page: currentPage,
      per_page: PER_PAGE,
      search: query,
      category: categoryParam || undefined,
      store: scopedStore || undefined,
    })
      .then((res) => {
        setProducts(res.data);
        setTotal(res.total);
      })
      .catch((e) => {
        setError(e instanceof Error ? e.message : 'Failed to load search results');
        setProducts([]);
        setTotal(0);
      })
      .finally(() => setLoading(false));
  }, [query, currentPage, categoryParam, scopedStore]);

  const startIndex = total === 0 ? 0 : (currentPage - 1) * PER_PAGE + 1;
  const endIndex = Math.min(currentPage * PER_PAGE, total);

  const productsHref =
    scopedStore || categoryParam
      ? `/products?${new URLSearchParams({
          ...(scopedStore ? { store: scopedStore } : {}),
          ...(categoryParam ? { category: categoryParam } : {}),
        }).toString()}`
      : '/products';

  return (
    <>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <nav className="mb-6">
          <ol className="flex items-center space-x-2 text-sm text-gray-600">
            <li>
              <Link href={scopedStore ? `/?store=${encodeURIComponent(scopedStore)}` : '/'} className="hover:text-mint">
                Home
              </Link>
            </li>
            <li>/</li>
            <li className="text-gray-800">Search Results</li>
          </ol>
        </nav>

        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            {query ? `Search results for “${query}”` : 'Search'}
          </h1>
          {!query ? (
            <p className="text-gray-600">
              {scopedStore
                ? 'Use the search bar above to find products in this store.'
                : 'Use the search bar above to find products across the marketplace.'}
            </p>
          ) : loading ? (
            <p className="text-gray-600">Searching…</p>
          ) : error ? (
            <p className="text-red-600">{error}</p>
          ) : (
            <p className="text-gray-600">
              {total} {total === 1 ? 'result' : 'results'} found
              {categoryParam ? ` · category: ${categoryParam}` : ''}
            </p>
          )}
        </div>

        {!query ? (
          <div className="text-center py-16 rounded-xl bg-white border border-gray-100 shadow-sm">
            <svg className="mx-auto h-24 w-24 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Start from the header search</h2>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Or browse the full catalog — same filters and pagination as the products page.
            </p>
            <Link
              href={productsHref}
              className="inline-block bg-mint text-white px-6 py-3 rounded-lg font-medium hover:bg-mint-dark transition-colors"
            >
              Browse products
            </Link>
          </div>
        ) : loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {[...Array(Math.min(PER_PAGE, 9))].map((_, i) => (
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
          <div className="text-center py-16 max-w-lg mx-auto rounded-xl border border-red-100 bg-red-50/80 px-6 py-8">
            <p className="text-red-800 font-medium mb-2">Search could not load</p>
            <p className="text-red-700 text-sm mb-4">{error}</p>
            <p className="text-gray-600 text-sm mb-4">
              Confirm the Laravel API is running and <code className="bg-white px-1 rounded border text-xs">NEXT_PUBLIC_API_URL</code> in{' '}
              <code className="bg-white px-1 rounded border text-xs">min-shop-ui/.env.local</code> points to it (e.g.{' '}
              <code className="bg-white px-1 rounded border text-xs">http://localhost:8000/api</code>).
            </p>
            <button type="button" onClick={() => window.location.reload()} className="text-mint font-medium hover:underline">
              Try again
            </button>
          </div>
        ) : total === 0 ? (
          <div className="text-center py-16">
            <svg className="mx-auto h-24 w-24 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">No results found</h2>
            <p className="text-gray-600 mb-6">Try different keywords or browse all products.</p>
            <Link
              href={productsHref}
              className="inline-block bg-mint text-white px-6 py-3 rounded-lg font-medium hover:bg-mint-dark transition-colors"
            >
              Browse all products
            </Link>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-8">
            <div className="lg:w-64 flex-shrink-0">
              <FilterSidebar category={categoryParam} />
            </div>

            <div className="flex-1">
              <div className="flex items-center justify-between mb-6">
                <p className="text-gray-600">
                  Showing {startIndex}-{endIndex} of {total}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
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
                <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setPage} />
              )}
            </div>
          </div>
        )}
      </main>
    </>
  );
}

export default function SearchPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <Suspense
        fallback={
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center py-16">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-mint mx-auto" />
              <p className="mt-4 text-gray-600">Loading search…</p>
            </div>
          </main>
        }
      >
        <SearchContent />
      </Suspense>
      <Footer />
    </div>
  );
}
