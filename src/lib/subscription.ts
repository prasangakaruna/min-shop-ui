import { apiRequest } from '@/lib/api';

export type BillingPeriod = 'week' | 'month' | 'year';

export type PlanCode = 'starter' | 'growth' | 'pro';

export interface PlanDefinition {
  code: PlanCode;
  name: string;
  description: string;
  features: string[];
  prices: Record<BillingPeriod, number>;
  recommended?: boolean;
}

// Matches the JSON returned by `GET /billing/subscription` and stored in DB.
export interface ActiveSubscription {
  id: number;
  owner_type: 'user' | 'store';
  owner_id: number;
  plan_code: PlanCode;
  billing_period: BillingPeriod;
  status: 'active' | 'past_due' | 'canceled' | 'incomplete';
  cancel_at_period_end: boolean;
  current_period_start: string | null;
  current_period_end: string | null;
  next_billing_date: string | null;
  payment_provider: string | null;
  provider_customer_id: string | null;
  provider_subscription_id: string | null;
  card_last4: string | null;
  card_brand: string | null;
}

export const PLANS: PlanDefinition[] = [
  {
    code: 'starter',
    name: 'Starter',
    description: 'For trying Mint with a single store.',
    prices: { week: 4, month: 12, year: 120 },
    features: ['1 active store', 'Core admin tools', 'Email support'],
  },
  {
    code: 'growth',
    name: 'Growth',
    description: 'For growing brands that need more power.',
    prices: { week: 9, month: 29, year: 290 },
    features: ['Up to 5 stores', 'Advanced analytics', 'Priority support'],
    recommended: true,
  },
  {
    code: 'pro',
    name: 'Pro',
    description: 'For Pro & Admin teams managing many stores.',
    prices: { week: 19, month: 79, year: 790 },
    features: ['Unlimited stores', 'Pro Admin workspace', 'Dedicated onboarding'],
  },
];

export function getPlanDefinition(code: PlanCode): PlanDefinition {
  const plan = PLANS.find((p) => p.code === code);
  if (!plan) throw new Error(`Unknown plan code: ${code}`);
  return plan;
}


export async function fetchActiveSubscription(params: {
  token: string;
  ownerType: 'user' | 'store';
  ownerId?: number;
}): Promise<ActiveSubscription | null> {
  const res = await apiRequest<{ data: ActiveSubscription | null }>('/billing/subscription', {
    token: params.token,
    query: {
      owner_type: params.ownerType,
      ...(params.ownerId ? { owner_id: params.ownerId } : {}),
    },
  });
  return res.data ?? null;
}

export async function updateSubscription(params: {
  token: string;
  ownerType: 'user' | 'store';
  ownerId?: number;
  planCode?: PlanCode;
  billingPeriod?: BillingPeriod;
  cancelAtPeriodEnd?: boolean;
  cardLast4?: string;
  cardBrand?: string;
}): Promise<ActiveSubscription> {
  const body: Record<string, unknown> = {
    owner_type: params.ownerType,
    ...(params.ownerId ? { owner_id: params.ownerId } : {}),
  };

  if (params.planCode) body.plan_code = params.planCode;
  if (params.billingPeriod) body.billing_period = params.billingPeriod;
  if (typeof params.cancelAtPeriodEnd === 'boolean') body.cancel_at_period_end = params.cancelAtPeriodEnd;
  if (params.cardLast4) body.card_last4 = params.cardLast4;
  if (params.cardBrand) body.card_brand = params.cardBrand;

  const res = await apiRequest<{ data: ActiveSubscription }>('/billing/subscription', {
    method: 'PATCH',
    token: params.token,
    body,
  });
  return res.data;
}

