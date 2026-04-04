'use client';

import React, { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useSession } from 'next-auth/react';
import { getStorefrontPage, getImageDisplayUrl } from '@/lib/api';
import { cmsPageMainMaxWidthClass, normalizeCmsPageLayoutWidth } from '@/lib/storePages';

function StorePageInner() {
  const params = useParams();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const token = (session as { access_token?: string } | null)?.access_token ?? null;
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
    getStorefrontPage(handle, {
      ...(storeSlug ? { storeSlug } : { storeId }),
      token: token ?? undefined,
    })
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
  }, [handle, storeSlug, storeId, token]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const storeQuery = storeSlug ? `?store=${encodeURIComponent(storeSlug)}` : `?store_id=${storeId}`;
  const homeHref = storeSlug ? `/?store=${encodeURIComponent(storeSlug)}` : '/';

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-50">
      <Header />
      <main
        className={`mx-auto w-full px-4 py-8 sm:px-6 lg:px-8 lg:py-10 ${cmsPageMainMaxWidthClass(layoutWidth)}`}
      >
        <nav className="mb-6 flex flex-wrap items-center gap-2 text-sm text-gray-600 md:mb-8">
          <Link href={homeHref} className="transition-colors hover:text-mint-dark">
            Home
          </Link>
          <span className="text-gray-300" aria-hidden>
            /
          </span>
          <span className="font-medium text-gray-900">{title || 'Page'}</span>
        </nav>

        {loading ? (
          <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
            <div className="aspect-[21/9] max-h-72 animate-pulse bg-gray-200" />
            <div className="space-y-4 p-8 md:p-10">
              <div className="h-4 w-32 rounded bg-gray-200" />
              <div className="h-10 w-2/3 max-w-md rounded bg-gray-200" />
              <div className="h-4 w-full rounded bg-gray-100" />
              <div className="h-4 w-full rounded bg-gray-100" />
            </div>
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50/90 p-8 text-red-800 shadow-sm">
            <p className="font-medium">{error}</p>
            <Link
              href={`/products${storeQuery}`}
              className="mt-4 inline-block text-sm font-semibold text-mint hover:text-mint-dark"
            >
              Browse products
            </Link>
          </div>
        ) : (
          <article className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
            {featuredImage ? (
              <div className="relative w-full min-h-[200px] max-h-[min(28rem,42vh)] aspect-[21/9] bg-gray-100">
                {/* CMS URLs may be arbitrary API/storage paths; next/image remotePatterns would be too broad. */}
                {/* eslint-disable-next-line @next/next/no-img-element -- dynamic storefront media URL */}
                <img
                  src={getImageDisplayUrl(featuredImage)}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover"
                />
              </div>
            ) : null}
            <div className="px-6 py-8 md:px-10 md:py-10 lg:px-12">
              {storeName ? (
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-mint-dark">
                  {storeName}
                </p>
              ) : null}
              <h1 className="text-3xl font-bold tracking-tight text-gray-900 md:text-4xl">{title}</h1>
              {excerpt ? (
                <p className="mt-4 max-w-3xl text-lg leading-relaxed text-gray-600 md:text-xl">{excerpt}</p>
              ) : null}
              {body ? (
                <div
                  className="cms-page-body prose prose-gray prose-lg mt-8 max-w-none text-gray-700 prose-headings:scroll-mt-24 prose-headings:font-bold prose-headings:text-gray-900 prose-a:font-medium prose-a:text-mint prose-a:no-underline hover:prose-a:text-mint-dark hover:prose-a:underline"
                  dangerouslySetInnerHTML={{ __html: body }}
                />
              ) : (
                <p className="mt-8 text-gray-500">No content yet.</p>
              )}
              <div className="mt-12 flex flex-wrap gap-4 border-t border-gray-100 pt-8">
                <Link
                  href={`/products${storeQuery}`}
                  className="text-sm font-semibold text-mint transition-colors hover:text-mint-dark"
                >
                  ← Back to catalog
                </Link>
                <Link href={homeHref} className="text-sm font-semibold text-gray-600 hover:text-gray-900">
                  Home
                </Link>
              </div>
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
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
          <Header />
          <div className="mx-auto max-w-7xl px-4 py-20 text-center text-gray-500 sm:px-6 lg:px-8">
            Loading…
          </div>
          <Footer />
        </div>
      }
    >
      <StorePageInner />
    </Suspense>
  );
}
