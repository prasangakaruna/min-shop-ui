'use client';

import React from 'react';
import { PlanSelector } from '@/components/PlanSelector';

export default function DashboardBillingPlanPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 py-5">
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">
            Billing &amp; plan
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            View and manage your Mint plan, billing period, and payment method.
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 sm:px-6 py-6 space-y-6">
        <PlanSelector
          ownerType="user"
          ownerId={null}
          contextLabel="account"
        />
      </main>
    </div>
  );
}

