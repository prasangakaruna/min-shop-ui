'use client';

import React, { Suspense, useEffect, useMemo, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  BillingPeriod,
  fetchActiveSubscription,
  getPlanDefinition,
  PlanCode,
  type ActiveSubscription,
} from '@/lib/subscription';
import { apiRequest, type StoreSummary } from '@/lib/api';

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
      (ob.sell_types?.length ?? 0) > 0 &&
      Array.isArray(ob.sell_places) &&
      (ob.sell_places?.length ?? 0) > 0
  );
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function formatPeriod(period: BillingPeriod): string {
  if (period === 'week') return 'weekly';
  if (period === 'year') return 'yearly';
  return 'monthly';
}

function BillingConfirmationPageInner() {
  const search = useSearchParams();
  const router = useRouter();
  const { data: session } = useSession();
  const token = (session as { access_token?: string | null } | null)?.access_token ?? null;

  const ownerType = search.get('ownerType') === 'store' ? 'store' : 'user';
  const planCode = (search.get('plan') as PlanCode | null) ?? 'starter';
  const period = (search.get('period') as BillingPeriod | null) ?? 'month';
  const ownerIdFromQuery = search.get('owner_id');

  const ownerId = useMemo(() => {
    if (ownerType === 'store') {
      if (ownerIdFromQuery) {
        const n = Number(ownerIdFromQuery);
        return Number.isFinite(n) ? n : null;
      }
      return null;
    }
    return null;
  }, [ownerType, ownerIdFromQuery, session]);

  const [subscription, setSubscription] = useState<ActiveSubscription | null>(null);
  const plan = getPlanDefinition(planCode);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    fetchActiveSubscription({
      token,
      ownerType,
      ownerId: ownerType === 'store' ? ownerId ?? undefined : undefined,
    })
      .then((sub) => {
        if (!cancelled) setSubscription(sub);
      })
      .catch(() => {
        if (!cancelled) setSubscription(null);
      });

    return () => {
      cancelled = true;
    };
  }, [token, ownerType, ownerId]);

  const effectivePeriod = subscription?.billing_period ?? period;

  // Mandatory: if a store subscription is activated, the store must finish onboarding.
  useEffect(() => {
    if (!token) return;
    if (ownerType !== 'store') return;
    if (!ownerId) return;
    if (!subscription || subscription.status !== 'active') return;

    let cancelled = false;
    apiRequest<StoreSummary>('/store', { token, storeId: ownerId })
      .then((store) => {
        if (cancelled) return;
        if (!isStoreOnboardingComplete(store)) router.replace('/admin/onboarding');
      })
      .catch(() => {
        // If we can't load store onboarding state, fail open (do not block confirmation page).
      });

    return () => {
      cancelled = true;
    };
  }, [token, ownerType, ownerId, subscription, router]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-xl rounded-2xl bg-white shadow-lg border border-gray-200 p-6 sm:p-8 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-mint/10">
          <span className="h-8 w-8 rounded-full bg-mint text-white flex items-center justify-center text-lg font-semibold">
            ✓
          </span>
        </div>
        <h1 className="text-2xl font-semibold text-gray-900">
          You&apos;re now on {plan.name}
        </h1>
        <p className="mt-2 text-sm text-gray-500">
          Your subscription is active and your features are unlocked.
        </p>

        <div className="mt-6 grid gap-4 rounded-2xl border border-gray-100 bg-gray-50 px-4 py-4 text-left sm:grid-cols-3">
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Plan
            </p>
            <p className="mt-1 text-sm font-semibold text-gray-900">
              {plan.name}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Billing period
            </p>
            <p className="mt-1 text-sm font-semibold text-gray-900">
              {formatPeriod(effectivePeriod)}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Next billing date
            </p>
            <p className="mt-1 text-sm font-semibold text-gray-900">
              {subscription?.next_billing_date ? formatDate(subscription.next_billing_date) : '—'}
            </p>
          </div>
        </div>

        {subscription && subscription.card_last4 && (
          <p className="mt-3 text-xs text-gray-500">
            Card on file: {subscription.card_brand ?? 'Card'} ending in {subscription.card_last4}.
          </p>
        )}

        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={() =>
              router.push(
                ownerType === 'store'
                  ? '/admin/settings/plan'
                  : '/dashboard/billing/plan'
              )
            }
            className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            View billing / plan
          </button>
          <button
            type="button"
            onClick={() =>
              router.push(ownerType === 'store' ? '/admin' : '/dashboard')
            }
            className="rounded-xl bg-mint px-4 py-2.5 text-sm font-semibold text-white hover:bg-mint-dark"
          >
            Go back to the app
          </button>
        </div>
      </div>
    </div>
  );
}

export default function BillingConfirmationPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-10">
          <div className="w-full max-w-xl rounded-2xl bg-white shadow-lg border border-gray-200 p-6 sm:p-8 text-center">
            <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-mint border-t-transparent" />
            <p className="text-sm text-gray-500">Loading your subscription…</p>
          </div>
        </div>
      }
    >
      <BillingConfirmationPageInner />
    </Suspense>
  );
}

