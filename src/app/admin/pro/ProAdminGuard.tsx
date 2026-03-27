'use client';

import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { apiRequest, type StoreListResponse, type StoreSummary } from '@/lib/api';
import { fetchActiveSubscription } from '@/lib/subscription';

function isStoreOnboardingComplete(store: StoreSummary): boolean {
  const s = store.settings ?? {};
  if (s.onboarding_completed) return true;
  const ob = s.onboarding ?? {};
  return Boolean(
    (store.name ?? '').trim() &&
      (s.business_country ?? '').toString().trim() &&
      (ob.store_category ?? '').toString().trim() &&
      (ob.business_stage === 'new' || ob.business_stage === 'existing') &&
      Array.isArray(ob.sell_types) &&
      ob.sell_types.length > 0 &&
      Array.isArray(ob.sell_places) &&
      ob.sell_places.length > 0
  );
}

/**
 * Shared gate for Pro admin routes: onboarding, Pro subscription, and pro_admin user type.
 */
export function ProAdminGuard({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const router = useRouter();
  const token = (session as { access_token?: string | null } | null)?.access_token ?? null;

  const [onboardingChecked, setOnboardingChecked] = useState(false);
  const [proAccessState, setProAccessState] = useState<'loading' | 'ok' | 'blocked'>('loading');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const done = window.localStorage.getItem('mint_admin_onboarding_completed_v1') === 'true';
    if (done) {
      setOnboardingChecked(true);
      return;
    }
    if (!token) return;
    let cancelled = false;
    apiRequest<StoreListResponse>('/me/stores', { token, query: { per_page: 1 } })
      .then(async (res) => {
        if (cancelled) return;
        const storeId = res.data?.[0]?.id;
        if (!storeId) {
          router.replace('/admin/onboarding');
          return;
        }
        const store = await apiRequest<StoreSummary>('/store', { token, storeId });
        if (isStoreOnboardingComplete(store)) {
          window.localStorage.setItem('mint_admin_onboarding_completed_v1', 'true');
          setOnboardingChecked(true);
        } else {
          router.replace('/admin/onboarding');
        }
      })
      .catch(() => router.replace('/admin/onboarding'));
    return () => {
      cancelled = true;
    };
  }, [router, token]);

  useEffect(() => {
    if (!token) return;
    if (!onboardingChecked) return;

    let cancelled = false;
    setProAccessState('loading');

    fetchActiveSubscription({ token, ownerType: 'user' })
      .then((sub) => {
        if (cancelled) return;
        const ok = Boolean(sub && sub.status === 'active' && sub.plan_code === 'pro');
        setProAccessState(ok ? 'ok' : 'blocked');
        if (!ok) router.replace('/admin/pro/plans');
      })
      .catch(() => {
        if (cancelled) return;
        setProAccessState('blocked');
        router.replace('/admin/pro/plans');
      });

    return () => {
      cancelled = true;
    };
  }, [token, onboardingChecked, router]);

  useEffect(() => {
    if (!token) return;
    const userTypeCookie =
      typeof document !== 'undefined' ? document.cookie.match(/(?:^|;\s*)USER_TYPE=([^;]+)/)?.[1] : null;
    const decodedType = userTypeCookie ? decodeURIComponent(userTypeCookie) : null;
    if (decodedType && decodedType !== 'pro_admin') {
      router.replace('/admin');
    }
  }, [token, router]);

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500 text-sm">Signing you in…</p>
      </div>
    );
  }

  if (!onboardingChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 rounded-full border-2 border-mint border-t-transparent animate-spin" />
          <p className="text-sm text-gray-500">Preparing your admin workspace…</p>
        </div>
      </div>
    );
  }

  if (proAccessState === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 rounded-full border-2 border-mint border-t-transparent animate-spin" />
          <p className="text-sm text-gray-500">Checking your Pro access…</p>
        </div>
      </div>
    );
  }

  if (proAccessState === 'blocked') {
    return null;
  }

  return <>{children}</>;
}
