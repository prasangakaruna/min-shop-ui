'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useStore } from '@/context/StoreContext';
import { apiRequest, type StoreSummary } from '@/lib/api';
import { ProHomeCustomizePanel } from '../ProHomeCustomizePanel';
import { ProAdminGuard } from '../ProAdminGuard';

export default function CustomizeProHomePage() {
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
    <ProAdminGuard>
      <div className="min-h-full bg-gray-50 text-gray-900">
        <div className="border-b border-gray-200 bg-white px-6 py-5">
          <Link href="/admin/pro" className="text-sm text-gray-600 hover:text-mint">
            ← Pro overview
          </Link>
          <h1 className="mt-2 text-xl font-semibold text-gray-900">Customize Pro home</h1>
          <p className="mt-1 text-sm text-gray-500">
            Upload a header logo and hero image, edit copy, and KPI visibility for{' '}
            <span className="font-medium text-gray-700">/admin/pro</span>. Global colors are in{' '}
            <Link href="/admin/theme" className="text-mint hover:text-mint-dark font-medium">
              Theme editor
            </Link>
            . Select the store in the header — settings are saved per store.
          </p>
        </div>

        <div className="mx-auto max-w-6xl px-6 py-6">
          {!storeCtxLoading && !currentStore && (
            <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              Select a store in the header to edit its Pro home settings.
            </div>
          )}

          {storeCtxLoading || storeDetailLoading ? (
            <div className="flex items-center gap-3 text-sm text-gray-500">
              <div className="h-8 w-8 rounded-full border-2 border-mint border-t-transparent animate-spin" />
              Loading store settings…
            </div>
          ) : token && storeDetail ? (
            <ProHomeCustomizePanel token={token} store={storeDetail} onSaved={setStoreDetail} />
          ) : (
            <p className="text-sm text-gray-500">Unable to load store settings.</p>
          )}
        </div>
      </div>
    </ProAdminGuard>
  );
}
