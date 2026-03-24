'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { fetchActiveSubscription, getPlanDefinition, type BillingPeriod, type PlanCode, type ActiveSubscription } from '@/lib/subscription';

type BillingTab = 'all' | 'paid' | 'unpaid';

function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

function periodLabel(period: BillingPeriod): string {
  if (period === 'week') return 'weekly';
  if (period === 'year') return 'yearly';
  return 'monthly';
}

function isToday(iso: string | null | undefined): boolean {
  if (!iso) return false;
  const d = new Date(iso);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
}

export function AdminBillingSection() {
  const router = useRouter();
  const { data: session } = useSession();
  const token = (session as { access_token?: string | null } | null)?.access_token ?? null;

  const [activeSub, setActiveSub] = useState<ActiveSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<BillingTab>('all');

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    setLoading(true);
    fetchActiveSubscription({ token, ownerType: 'user' })
      .then((sub) => {
        if (!cancelled) setActiveSub(sub);
      })
      .catch(() => {
        if (!cancelled) setActiveSub(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [token]);

  const upcoming = useMemo(() => {
    const planCode = activeSub?.plan_code ?? ('growth' as PlanCode);
    const period = (activeSub?.billing_period ?? ('month' as BillingPeriod)) as BillingPeriod;
    const plan = getPlanDefinition(planCode);
    return {
      amount: plan.prices[period],
      planName: plan.name,
      nextDate: activeSub?.next_billing_date ?? null,
      card: activeSub?.card_last4 ? `${activeSub.card_brand ?? 'Card'} ending in ${activeSub.card_last4}` : null,
      status: activeSub?.status ?? null,
      period,
    };
  }, [activeSub]);

  const nextChargeLabel = useMemo(() => {
    if (!upcoming.nextDate) return 'Next bill date not scheduled';
    return isToday(upcoming.nextDate) ? 'Next bill will be charged today' : `Next bill will be charged on ${formatDate(upcoming.nextDate)}`;
  }, [upcoming.nextDate]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Billing</h1>
          <p className="mt-1 text-sm text-gray-500">Manage your subscription and payment method.</p>
        </div>
        <button
          type="button"
          onClick={() => router.push('/admin/settings?section=plan')}
          className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Billing profile
        </button>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Upcoming bill</p>
            <p className="mt-2 text-3xl font-semibold text-gray-900 tabular-nums">
              ${upcoming.amount.toFixed(2)}
            </p>
            <p className="mt-1 text-sm text-gray-500">{nextChargeLabel}</p>
          </div>

          <div className="w-full sm:w-auto">
            <button
              type="button"
              onClick={() => router.push('/admin/settings?section=plan')}
              className="w-full rounded-xl bg-mint px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-mint-dark disabled:opacity-60 sm:w-auto"
              disabled={loading}
            >
              + Add payment method
            </button>
            {upcoming.card && (
              <p className="mt-2 text-xs text-gray-500">
                Card on file: {upcoming.card}.
              </p>
            )}
            {upcoming.status === 'past_due' && (
              <p className="mt-2 text-xs font-semibold text-red-700">
                Your subscription is past due. Update your payment method.
              </p>
            )}
          </div>
        </div>

        {activeSub && (
          <div className="mt-5 rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm text-gray-700">
            <span className="font-semibold">{upcoming.planName}</span> · {periodLabel(upcoming.period)} billing
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-gray-900">Past bills</h2>
            <p className="mt-1 text-xs text-gray-500">All your previous subscription charges.</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="inline-flex items-center rounded-full bg-gray-100 p-1 text-xs font-medium text-gray-600">
              {(['all', 'paid', 'unpaid'] as BillingTab[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTab(t)}
                  className={`rounded-full px-3 py-1 transition ${
                    tab === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  {t === 'all' ? 'All' : t === 'paid' ? 'Paid' : 'Unpaid'}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-gray-100 bg-white px-4 py-8">
          <div className="text-center">
            <p className="text-sm font-medium text-gray-700">Your past bills will appear here.</p>
            <p className="mt-1 text-xs text-gray-500">
              This demo app only tracks the active subscription for now.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

