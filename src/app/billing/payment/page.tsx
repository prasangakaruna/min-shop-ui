'use client';

import React, { Suspense, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  getPlanDefinition,
  updateSubscription,
  PlanCode,
  BillingPeriod,
  fetchActiveSubscription,
} from '@/lib/subscription';

function formatPeriodLabel(period: BillingPeriod): string {
  if (period === 'week') return 'weekly';
  if (period === 'year') return 'yearly';
  return 'monthly';
}

function BillingPaymentPageInner() {
  const router = useRouter();
  const search = useSearchParams();
  const { data: session } = useSession();
  const token = (session as { access_token?: string | null } | null)?.access_token ?? null;

  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');
  const [name, setName] = useState('');
  const [billingAddress, setBillingAddress] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ownerType = search.get('ownerType') === 'store' ? 'store' : 'user';
  const planCode = (search.get('plan') as PlanCode | null) ?? 'starter';
  const period = (search.get('period') as BillingPeriod | null) ?? 'month';
  const intent = search.get('intent') === 'update-card' ? 'update-card' : 'subscribe';
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

  const plan = getPlanDefinition(planCode);

  useEffect(() => {
    if (!token) return;
    if (intent !== 'update-card') return;
    let cancelled = false;
    const redirectTo = ownerType === 'store' ? '/admin/settings/plan' : '/dashboard/billing/plan';

    fetchActiveSubscription({
      token,
      ownerType,
      ownerId: ownerType === 'store' ? ownerId ?? undefined : undefined,
    })
      .then((sub) => {
        if (cancelled) return;
        if (!sub) router.replace(redirectTo);
      })
      .catch(() => {
        if (cancelled) return;
        router.replace(redirectTo);
      });

    return () => {
      cancelled = true;
    };
  }, [intent, ownerId, ownerType, router, token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      setError('We could not identify your account. Please sign in again.');
      return;
    }
    if (ownerType === 'store' && ownerId == null) {
      setError('We could not identify the store. Please select a store and try again.');
      return;
    }
    if (!cardNumber || !expiry || !cvc || !name) {
      setError('Please fill in all required card details.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const trimmed = cardNumber.replace(/\s+/g, '');
      const last4 = trimmed.slice(-4);
      const brand =
        trimmed.startsWith('4') ? 'Visa' : trimmed.startsWith('5') ? 'Mastercard' : 'Card';

      if (intent === 'update-card') {
        await updateSubscription({
          token,
          ownerType,
          ownerId: ownerType === 'store' ? ownerId ?? undefined : undefined,
          cardLast4: last4,
          cardBrand: brand,
        });
      } else {
        await updateSubscription({
          token,
          ownerType,
          ownerId: ownerType === 'store' ? ownerId ?? undefined : undefined,
          planCode,
          billingPeriod: period,
          cardLast4: last4,
          cardBrand: brand,
        });
      }

      const params = new URLSearchParams({
        ownerType,
        plan: planCode,
        period,
      });
      if (ownerType === 'store' && ownerId != null) {
        params.set('owner_id', String(ownerId));
      }
      router.replace(`/billing/confirmation?${params.toString()}`);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Payment failed. Please try again.';
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-lg border border-gray-200 p-6 sm:p-8">
        <div className="mb-6">
          <p className="text-xs font-semibold tracking-wide text-mint uppercase">
            Secure card payment
          </p>
          <h1 className="mt-2 text-xl sm:text-2xl font-semibold text-gray-900">
            {intent === 'update-card' ? 'Update payment method' : `Pay for ${plan.name}`}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            We redirect you to a secure card form. Mint never stores your card number.
          </p>
        </div>

        <div className="mb-5 rounded-xl bg-gray-50 border border-gray-200 px-4 py-3 text-sm flex items-center justify-between gap-3">
          <div>
            <p className="font-medium text-gray-900">
              {plan.name}{' '}
              <span className="ml-1 rounded-full bg-mint/10 px-2 py-0.5 text-xs font-semibold text-mint">
                {formatPeriodLabel(period)}
              </span>
            </p>
            <p className="text-xs text-gray-500">
              {plan.description}
            </p>
          </div>
          <p className="text-base font-semibold text-gray-900 tabular-nums">
            ${plan.prices[period]}
            <span className="text-xs font-normal text-gray-500"> / {formatPeriodLabel(period)}</span>
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Cardholder name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Name on card"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-mint focus:ring-2 focus:ring-mint/20"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Card number
            </label>
            <input
              type="text"
              value={cardNumber}
              onChange={(e) => setCardNumber(e.target.value)}
              placeholder="1234 1234 1234 1234"
              inputMode="numeric"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm tracking-[0.18em] focus:border-mint focus:ring-2 focus:ring-mint/20"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Expiry
              </label>
              <input
                type="text"
                value={expiry}
                onChange={(e) => setExpiry(e.target.value)}
                placeholder="MM / YY"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-mint focus:ring-2 focus:ring-mint/20"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                CVC
              </label>
              <input
                type="password"
                value={cvc}
                onChange={(e) => setCvc(e.target.value)}
                placeholder="123"
                inputMode="numeric"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-mint focus:ring-2 focus:ring-mint/20"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Billing address
            </label>
            <textarea
              value={billingAddress}
              onChange={(e) => setBillingAddress(e.target.value)}
              rows={2}
              placeholder="Address, city, country"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-mint focus:ring-2 focus:ring-mint/20"
            />
          </div>
          <p className="text-[11px] text-gray-500">
            Your card details are processed by a payment provider. Mint only stores a safe
            reference (last 4 digits and card brand).
          </p>
          <button
            type="submit"
            disabled={saving}
            className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-mint px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-mint-dark disabled:opacity-60"
          >
            {saving && (
              <span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
            )}
            <span>{intent === 'update-card' ? 'Update card' : 'Pay and activate plan'}</span>
          </button>
        </form>
      </div>
    </div>
  );
}

export default function BillingPaymentPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-10">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-lg border border-gray-200 p-6 sm:p-8 text-center">
            <div className="mx-auto mb-3 h-10 w-10 animate-spin rounded-full border-2 border-mint border-t-transparent" />
            <p className="text-sm text-gray-500">Loading payment…</p>
          </div>
        </div>
      }
    >
      <BillingPaymentPageInner />
    </Suspense>
  );
}

