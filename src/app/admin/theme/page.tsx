'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useStore } from '@/context/StoreContext';
import { apiRequest, type StoreSummary } from '@/lib/api';
import StoreThemeEditor from '@/components/admin/StoreThemeEditor';

export default function AdminThemeEditorPage() {
  const { data: session } = useSession();
  const token = (session as { access_token?: string | null } | null)?.access_token ?? null;
  const { currentStore, loading: storeCtxLoading } = useStore();
  const [storeDetail, setStoreDetail] = useState<StoreSummary | null>(null);
  const [storeDetailLoading, setStoreDetailLoading] = useState(true);

  useEffect(() => {
    if (!token || !currentStore?.id) {
      setStoreDetail(null);
      setStoreDetailLoading(false);
      return;
    }
    let cancelled = false;
    setStoreDetailLoading(true);
    apiRequest<StoreSummary>('/store', { token, storeId: currentStore.id })
      .then((s) => {
        if (!cancelled) setStoreDetail(s);
      })
      .catch(() => {
        if (!cancelled) setStoreDetail(null);
      })
      .finally(() => {
        if (!cancelled) setStoreDetailLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [token, currentStore?.id]);

  return (
    <div className="min-h-full bg-gray-50 text-gray-900">
      <div className="border-b border-gray-200 bg-white px-6 py-5">
        <Link href="/admin" className="text-sm text-gray-600 hover:text-mint">
          ← Admin home
        </Link>
        <h1 className="mt-2 text-xl font-semibold text-gray-900">Theme editor</h1>
        <div className="mt-2 space-y-2 text-sm text-gray-600">
          <p>
            Customize this store’s public home: sections, typography, colors, and layout. The built-in{' '}
            <span className="font-medium text-gray-800">Mint Marketplace</span> preset matches the same block order as the global home page{' '}
            <code className="text-xs bg-gray-100 px-1 rounded">/</code>. Click <span className="font-medium text-gray-800">Save</span> to publish.
          </p>
          <p className="rounded-lg border border-amber-200/80 bg-amber-50/90 px-3 py-2 text-amber-950 text-[13px] leading-relaxed">
            <span className="font-semibold">Where it appears:</span> The marketplace home{' '}
            <code className="text-xs bg-white/80 px-1 rounded border border-amber-200/60">/</code> lists all stores and does <em>not</em> use this theme. Your edited layout matches{' '}
            <code className="text-xs bg-white/80 px-1 rounded border border-amber-200/60">
              /?store={storeDetail?.slug ?? 'your-slug'}
            </code>{' '}
            (and your store subdomain when configured). Use <span className="font-medium">Open storefront</span> in the editor to preview the right URL.
          </p>
        </div>
      </div>

      <div className="p-4 lg:p-6">
        {!storeCtxLoading && !currentStore && (
          <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Select a store in the header to edit its theme.
          </div>
        )}

        {storeCtxLoading || storeDetailLoading ? (
          <div className="flex items-center gap-3 text-sm text-gray-500">
            <div className="h-8 w-8 rounded-full border-2 border-mint border-t-transparent animate-spin" />
            Loading store…
          </div>
        ) : token && storeDetail ? (
          <StoreThemeEditor token={token} store={storeDetail} onSaved={setStoreDetail} />
        ) : (
          <p className="text-sm text-gray-500">Unable to load store.</p>
        )}
      </div>
    </div>
  );
}
