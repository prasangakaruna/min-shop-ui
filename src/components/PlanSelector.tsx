import React from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  BillingPeriod,
  PLANS,
  PlanCode,
  ActiveSubscription,
  fetchActiveSubscription,
  getPlanDefinition,
  updateSubscription,
} from '@/lib/subscription';

export type PlanOwnerType = 'user' | 'store';

interface PlanSelectorProps {
  ownerType: PlanOwnerType;
  ownerId: number | null;
  contextLabel: string;
  fallbackCurrentPlanCode?: PlanCode | null;
}

const PERIODS: BillingPeriod[] = ['week', 'month', 'year'];

function periodLabel(period: BillingPeriod): string {
  if (period === 'week') return 'Weekly';
  if (period === 'year') return 'Yearly';
  return 'Monthly';
}

function periodSuffix(period: BillingPeriod): string {
  if (period === 'week') return '/week';
  if (period === 'year') return '/year';
  return '/month';
}

export function PlanSelector({ ownerType, ownerId, contextLabel, fallbackCurrentPlanCode = null }: PlanSelectorProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const token = (session as { access_token?: string | null } | null)?.access_token ?? null;
  const [period, setPeriod] = React.useState<BillingPeriod>('month');
  const [selectedPlan, setSelectedPlan] = React.useState<PlanCode>('growth');
  const [active, setActive] = React.useState<ActiveSubscription | null>(null);
  const [activeLoading, setActiveLoading] = React.useState(false);
  const showLoadingHint = activeLoading && !active;

  React.useEffect(() => {
    if (!token) return;
    if (ownerType === 'store' && ownerId == null) return;

    let cancelled = false;
    setActiveLoading(true);
    fetchActiveSubscription({
      token,
      ownerType,
      ownerId: ownerType === 'store' ? ownerId ?? undefined : undefined,
    })
      .then((sub) => {
        if (!cancelled) setActive(sub);
      })
      .catch(() => {
        if (!cancelled) setActive(null);
      })
      .finally(() => {
        if (!cancelled) setActiveLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [token, ownerType, ownerId]);

  React.useEffect(() => {
    if (!active) return;
    setSelectedPlan(active.plan_code);
  }, [active]);

  React.useEffect(() => {
    if (active) return;
    if (!fallbackCurrentPlanCode) return;
    setSelectedPlan(fallbackCurrentPlanCode);
  }, [active, fallbackCurrentPlanCode]);

  const handleChoose = (planCode: PlanCode) => {
    if (!token) router.push('/login');
    const params = new URLSearchParams({
      ownerType,
      plan: planCode,
      period,
      intent: 'subscribe',
    });
    if (ownerType === 'store' && ownerId != null) {
      params.set('owner_id', String(ownerId));
    }
    router.push(`/billing/payment?${params.toString()}`);
  };

  const handleUpdateCard = () => {
    const params = new URLSearchParams({
      ownerType,
      plan: active?.plan_code ?? 'growth',
      period: active?.billing_period ?? period,
      intent: 'update-card',
    });
    if (ownerType === 'store' && ownerId != null) {
      params.set('owner_id', String(ownerId));
    }
    router.push(`/billing/payment?${params.toString()}`);
  };

  const handleCancelAtPeriodEnd = async () => {
    if (!token || !active) return;
    await updateSubscription({
      token,
      ownerType,
      ownerId: ownerType === 'store' ? ownerId ?? active.owner_id : undefined,
      cancelAtPeriodEnd: true,
    });
    const sub = await fetchActiveSubscription({
      token,
      ownerType,
      ownerId: ownerType === 'store' ? ownerId ?? undefined : undefined,
    });
    setActive(sub);
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold text-mint tracking-wide uppercase">
          Step 1 – Pick a plan
        </p>
        <h2 className="mt-1 text-xl font-semibold text-gray-900">
          Choose the plan for this {contextLabel}
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Switch between weekly, monthly, or yearly billing. You can change or cancel anytime.
        </p>
        {showLoadingHint && (
          <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-600">
            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-gray-300 border-t-mint" />
            Loading your subscription...
          </div>
        )}
      </div>

      <div className="inline-flex items-center justify-between rounded-full bg-gray-100 p-1 text-xs font-medium text-gray-600">
        {PERIODS.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setPeriod(p)}
            className={`flex-1 rounded-full px-3 py-1 transition ${
              period === p ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
            }`}
          >
            {periodLabel(p)}
          </button>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {PLANS.map((plan) => {
          const isActive = active
            ? active.plan_code === plan.code
            : fallbackCurrentPlanCode === plan.code;
          const isSelected = selectedPlan === plan.code;
          return (
            <button
              key={plan.code}
              type="button"
              onClick={() => {
                setSelectedPlan(plan.code);
                handleChoose(plan.code);
              }}
              className={`relative flex flex-col rounded-2xl border bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
                plan.recommended ? 'border-mint/70' : 'border-gray-200'
              }`}
            >
              {plan.recommended && (
                <span className="absolute right-3 top-3 rounded-full bg-mint px-2 py-0.5 text-[10px] font-semibold text-white">
                  Most popular
                </span>
              )}
              <div className="mb-3">
                <p className="text-sm font-semibold text-gray-900">{plan.name}</p>
                <p className="mt-0.5 text-xs text-gray-500">{plan.description}</p>
              </div>
              <p className="text-xl font-semibold text-gray-900">
                ${plan.prices[period]}
                <span className="text-xs font-normal text-gray-500">
                  {' '}
                  {periodSuffix(period)}
                </span>
              </p>
              <ul className="mt-3 space-y-1.5 text-xs text-gray-600">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-1.5">
                    <span className="mt-0.5 h-3 w-3 rounded-full bg-mint/10 text-[9px] text-mint flex items-center justify-center">
                      ✓
                    </span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-4">
                <span
                  className={`inline-flex w-full items-center justify-center rounded-xl px-3 py-2 text-xs font-semibold transition ${
                    isActive
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : isSelected
                      ? 'bg-mint text-white'
                      : 'bg-gray-900 text-white'
                  }`}
                >
                  {isActive ? 'Current plan' : 'Choose plan'}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {active && (
        <div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-xs text-blue-900 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            {active.status === 'past_due' && (
              <p className="font-semibold text-red-800">
                We couldn&apos;t renew your plan. Please update your card.
              </p>
            )}

            <p className="font-semibold">
              Current plan: {getPlanDefinition(active.plan_code).name} ({periodLabel(active.billing_period)} billing)
            </p>
            <p className="mt-0.5">
              Next charge on{' '}
              {active.next_billing_date
                ? new Date(active.next_billing_date).toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })
                : '—'}
              .{' '}
              {active.cancel_at_period_end
                ? 'Renewal is cancelled — you will drop back to the free level after this date.'
                : 'You can change plan, switch billing period, cancel renewal, or update your card below.'}
            </p>
          </div>
          <div className="flex flex-wrap gap-2 mt-2 sm:mt-0">
            <button
              type="button"
              onClick={handleUpdateCard}
              className="rounded-full border border-blue-300 bg-white px-3 py-1.5 text-[11px] font-medium text-blue-900 hover:bg-blue-100"
            >
              Update card
            </button>
            {!active.cancel_at_period_end && (
              <button
                type="button"
                onClick={handleCancelAtPeriodEnd}
                className="rounded-full border border-transparent bg-blue-900 px-3 py-1.5 text-[11px] font-medium text-white hover:bg-blue-800"
              >
                Cancel at end of period
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

