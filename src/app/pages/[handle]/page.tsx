'use client';

import React, { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { getStorefrontPage, getImageDisplayUrl } from '@/lib/api';
import { cmsPageMainMaxWidthClass, normalizeCmsPageLayoutWidth } from '@/lib/storePages';

function StorePageInner() {
  const params = useParams();
  const searchParams = useSearchParams();
  const handle = typeof params.handle === 'string' ? params.handle : '';
  const storeSlug = searchParams.get('store') ?? '';
  const storeIdParam = searchParams.get('store_id');
  const storeId = storeIdParam ? parseInt(storeIdParam, 10) : NaN;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState<string | null>(null);
  const [excerpt, setExcerpt] = useState<string | null>(null);
  const [featuredImage, setFeaturedImage] = useState<string | null>(null);
  const [storeName, setStoreName] = useState<string | null>(null);
  const [layoutWidth, setLayoutWidth] = useState<string>('default');

  /* eslint-disable react-hooks/set-state-in-effect -- sync loading gate before client fetch */
  useEffect(() => {
    if (!handle) {
      setLoading(false);
      setError('Invalid page');
      return;
    }
    if (!storeSlug && (Number.isNaN(storeId) || storeId <= 0)) {
      setLoading(false);
      setError('Add ?store=your-store-slug (or ?store_id=) to view this page.');
      return;
    }

    setLoading(true);
    setError(null);
    getStorefrontPage(handle, storeSlug ? { storeSlug } : { storeId })
      .then((res) => {
        setTitle(res.data.title);
        setBody(res.data.body);
        setExcerpt(res.data.excerpt ?? null);
        setFeaturedImage(res.data.featured_image ?? null);
        setStoreName(res.store?.name ?? null);
        setLayoutWidth(normalizeCmsPageLayoutWidth(res.data.layout_width));
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Page not found'))
      .finally(() => setLoading(false));
  }, [handle, storeSlug, storeId]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const storeQuery = storeSlug ? `?store=${encodeURIComponent(storeSlug)}` : `?store_id=${storeId}`;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main
        className={`mx-auto w-full px-4 py-10 sm:px-6 lg:px-8 ${cmsPageMainMaxWidthClass(layoutWidth)}`}
      >
        <nav className="mb-6 text-sm text-gray-600">
          <Link href={storeSlug ? `/?store=${encodeURIComponent(storeSlug)}` : '/'} className="hover:text-mint">
            Home
          </Link>
          <span className="mx-2">/</span>
          <span className="text-gray-800">{title || 'Page'}</span>
        </nav>

        {loading ? (
          <div className="animate-pulse space-y-4 rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
            <div className="h-8 w-2/3 rounded bg-gray-200" />
            <div className="h-4 w-full rounded bg-gray-100" />
            <div className="h-4 w-full rounded bg-gray-100" />
          </div>
        ) : error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-800">
            <p className="font-medium">{error}</p>
            <Link href="/products" className="mt-4 inline-block text-sm text-mint hover:underline">
              Browse products
            </Link>
          </div>
        ) : (
          <article className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
            {storeName ? <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-400">{storeName}</p> : null}
            {featuredImage ? (
              // CMS URLs may be arbitrary API/storage paths; next/image remotePatterns would be too broad.
              // eslint-disable-next-line @next/next/no-img-element -- dynamic storefront media URL
              <img
                src={getImageDisplayUrl(featuredImage)}
                alt=""
                className="mb-6 max-h-80 w-full rounded-lg object-cover"
              />
            ) : null}
            <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
            {excerpt ? <p className="mt-3 text-lg text-gray-600">{excerpt}</p> : null}
            {body ? (
              <div
                className="cms-page-body prose prose-gray mt-6 max-w-none text-gray-700"
                dangerouslySetInnerHTML={{ __html: body }}
              />
            ) : (
              <p className="mt-6 text-gray-500">No content yet.</p>
            )}
            <div className="mt-10 border-t border-gray-100 pt-6">
              <Link href={`/products${storeQuery}`} className="text-sm font-medium text-mint hover:underline">
                ← Back to catalog
              </Link>
            </div>
          </article>
        )}
      </main>
      <Footer />
    </div>
  );
}

export default function StoreCmsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50">
          <Header />
          <div className="mx-auto max-w-3xl px-4 py-20 text-center text-gray-500">Loading…</div>
          <Footer />
        </div>
      }
    >
      <StorePageInner />
    </Suspense>
  );
}
