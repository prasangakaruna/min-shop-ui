'use client';

import React from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { PlanSelector } from '@/components/PlanSelector';

export default function ProAdminPlansPage() {
  const { data: session } = useSession();

  return (
    <div className="min-h-full bg-gray-50 text-gray-900">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-5xl px-6 py-6 flex items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center rounded-full bg-mint/10 px-2.5 py-1 text-[11px] font-semibold text-mint tracking-wide mb-2">
              PRO &amp; ADMIN
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
              Plans for Pro admins
            </h1>
            <p className="mt-1 text-sm text-gray-500 max-w-xl">
              Unlock or upgrade your Pro &amp; Admin workspace to manage multiple stores, teams,
              and advanced analytics.
            </p>
          </div>
          <Link
            href="/admin/pro"
            className="inline-flex items-center rounded-full border border-gray-200 bg-white px-4 py-2 text-xs font-medium text-gray-700 hover:border-mint hover:text-mint"
          >
            ← Back to overview
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-8 space-y-6">
        <PlanSelector
          ownerType="user"
          ownerId={null}
          contextLabel="Pro & admin workspace"
        />
      </main>
    </div>
  );
}

