'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useStore } from '@/context/StoreContext';
import { apiRequest, getImageDisplayUrl } from '@/lib/api';
import type { StoreContentPage } from '@/lib/storePages';

export default function AdminPagePreview() {
  const params = useParams();
  const pageId = typeof params?.pageId === 'string' ? params.pageId : '';
  const { data: session } = useSession();
  const token = (session as { access_token?: string } | null)?.access_token ?? null;
  const { currentStore } = useStore();
  const [page, setPage] = useState<StoreContentPage | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  /* eslint-disable react-hooks/set-state-in-effect -- admin preview fetch */
  useEffect(() => {
    if (!token || !currentStore || !pageId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    apiRequest<{ data: StoreContentPage }>(`/store/pages/${pageId}`, { token, storeId: currentStore.id })
      .then((res) => setPage(res.data))
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load'))
      .finally(() => setLoading(false));
  }, [token, currentStore, pageId]);
  /* eslint-enable react-hooks/set-state-in-effect */

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="border-b border-amber-200 bg-amber-100 px-4 py-2 text-center text-sm text-amber-950">
        Draft preview — this is how the page will look on your store (including drafts).{' '}
        <Link href={`/admin/content/pages/${pageId}`} className="font-semibold underline">
          ← Back to editor
        </Link>
      </div>
      <div className="mx-auto max-w-3xl px-4 py-10">
        {loading ? (
          <p className="text-gray-500">Loading…</p>
        ) : error ? (
          <p className="text-red-600">{error}</p>
        ) : page ? (
          <article className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
            {page.featured_image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={getImageDisplayUrl(page.featured_image)}
                alt=""
                className="mb-6 max-h-72 w-full rounded-lg object-cover"
              />
            ) : null}
            <h1 className="text-3xl font-bold text-gray-900">{page.title}</h1>
            {page.excerpt ? <p className="mt-3 text-lg text-gray-600">{page.excerpt}</p> : null}
            {page.body ? (
              <div
                className="cms-page-body prose prose-gray mt-6 max-w-none text-gray-700"
                dangerouslySetInnerHTML={{ __html: page.body }}
              />
            ) : (
              <p className="mt-6 text-gray-500">No content.</p>
            )}
          </article>
        ) : null}
      </div>
    </div>
  );
}
