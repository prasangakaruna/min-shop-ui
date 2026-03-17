'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useStore } from '@/context/StoreContext';

const STEPS = [
  { title: 'Create your store', description: 'Give your store a name and choose a plan. You can add more stores later.', href: '/admin/stores/new', cta: 'Create store' },
  { title: 'Add products', description: 'Upload products with images, prices, and inventory. Your store will appear on the marketplace.', href: '/admin/products/add', cta: 'Add product' },
  { title: 'Configure settings', description: 'Set your store domain, payment, and shipping options when you\'re ready.', href: '/admin/settings', cta: 'Open settings' },
];

export default function AdminSetupPage() {
  const router = useRouter();
  const { stores, loading } = useStore();

  useEffect(() => {
    if (loading) return;
    if (stores.length > 0) {
      router.replace('/admin');
    }
  }, [stores.length, loading, router]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="animate-spin h-10 w-10 rounded-full border-2 border-mint border-t-transparent" />
      </div>
    );
  }

  if (stores.length > 0) {
    return null;
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-gray-900">Set up your store</h1>
        <p className="mt-2 text-gray-600">
          Get started in a few steps. Create your first store to manage products, orders, and customers.
        </p>
      </div>

      <div className="space-y-6">
        {STEPS.map((step, index) => (
          <div
            key={step.href}
            className="relative rounded-2xl border border-gray-200 bg-white p-6 shadow-sm hover:border-mint/40 hover:shadow-md transition-all"
          >
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-mint/10 text-mint font-semibold">
                {index + 1}
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-lg font-semibold text-gray-900">{step.title}</h2>
                <p className="mt-1 text-sm text-gray-600">{step.description}</p>
                <Link
                  href={step.href}
                  className="mt-4 inline-flex items-center gap-2 rounded-lg bg-mint px-4 py-2.5 text-sm font-medium text-white hover:bg-mint-dark"
                >
                  {step.cta}
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      <p className="mt-8 text-center text-sm text-gray-500">
        Need help?{' '}
        <Link href="/admin" className="text-mint hover:underline">
          Skip to dashboard
        </Link>
      </p>
    </div>
  );
}
