'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { storefrontRequest } from '@/lib/storefrontApi';

type WhyFeature = { icon: string; title: string; description: string };

type WhyChooseUsPayload = {
  badge?: string;
  title_before?: string;
  title_highlight?: string;
  title_after?: string;
  subtitle?: string;
  features?: WhyFeature[];
};

const FALLBACK: Required<Omit<WhyChooseUsPayload, 'features'>> & { features: WhyFeature[] } = {
  badge: 'WHY US',
  title_before: 'Why Choose',
  title_highlight: 'Mint Hub',
  title_after: '?',
  subtitle: 'Experience the difference with our premium marketplace',
  features: [
    { icon: '✓', title: 'Verified Sellers', description: 'All sellers are verified and trusted' },
    { icon: '🚚', title: 'Fast Delivery', description: 'Quick and secure shipping worldwide' },
    { icon: '🔒', title: 'Secure Payment', description: '100% secure payment processing' },
    { icon: '💬', title: '24/7 Support', description: 'Round-the-clock customer service' },
    { icon: '↩️', title: 'Easy Returns', description: 'Hassle-free return policy' },
    { icon: '⭐', title: 'Quality Guaranteed', description: 'Premium quality products only' },
  ],
};

function normalizePayload(raw: WhyChooseUsPayload | null | undefined): typeof FALLBACK {
  if (!raw || typeof raw !== 'object') return FALLBACK;
  const features = Array.isArray(raw.features)
    ? raw.features
        .filter(
          (f): f is WhyFeature =>
            f != null &&
            typeof f === 'object' &&
            typeof f.title === 'string' &&
            f.title.trim() !== ''
        )
        .map((f) => ({
          icon: typeof f.icon === 'string' && f.icon.trim() ? f.icon.trim() : '✨',
          title: f.title.trim(),
          description: typeof f.description === 'string' ? f.description.trim() : '',
        }))
    : [];
  return {
    badge: typeof raw.badge === 'string' && raw.badge.trim() ? raw.badge.trim() : FALLBACK.badge,
    title_before:
      typeof raw.title_before === 'string' && raw.title_before.trim()
        ? raw.title_before.trim()
        : FALLBACK.title_before,
    title_highlight:
      typeof raw.title_highlight === 'string' && raw.title_highlight.trim()
        ? raw.title_highlight.trim()
        : FALLBACK.title_highlight,
    title_after:
      typeof raw.title_after === 'string' && raw.title_after.trim()
        ? raw.title_after.trim()
        : FALLBACK.title_after,
    subtitle:
      typeof raw.subtitle === 'string' && raw.subtitle.trim() ? raw.subtitle.trim() : FALLBACK.subtitle,
    features: features.length > 0 ? features : FALLBACK.features,
  };
}

export default function WhyChooseUs({ storeSlug }: { storeSlug?: string | null }) {
  const [payload, setPayload] = useState<typeof FALLBACK | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    storefrontRequest<{ data?: WhyChooseUsPayload }>(
      '/storefront/why-choose-us',
      storeSlug ? { store: storeSlug } : undefined
    )
      .then((res) => {
        if (cancelled) return;
        setPayload(normalizePayload(res.data));
      })
      .catch(() => {
        if (!cancelled) setPayload(FALLBACK);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [storeSlug]);

  const data = useMemo(() => payload ?? FALLBACK, [payload]);

  return (
    <section className="py-16 bg-gray-50 border-t border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-3">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-mint/30 to-transparent" />
            <div className="inline-flex items-center gap-2 bg-mint/10 text-mint-dark px-3 py-1 rounded-full text-xs font-bold border border-mint/20 shadow-sm">
              <span className="w-1.5 h-1.5 bg-mint rounded-full animate-pulse" />
              {data.badge}
            </div>
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-mint/30 to-transparent" />
          </div>
          <div className="space-y-1.5">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold sf-heading-color leading-tight">
              {data.title_before}{' '}
              <span className="relative inline-block">
                <span className="relative z-10 bg-gradient-to-r from-mint to-mint-dark bg-clip-text text-transparent">
                  {data.title_highlight}
                </span>
                <span className="absolute bottom-1.5 left-0 right-0 h-2.5 bg-mint/20 -z-0 transform -skew-x-12" />
              </span>
              {data.title_after}
            </h2>
            <p className="text-base md:text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
              {data.subtitle}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {loading
            ? Array.from({ length: 6 }).map((_, index) => (
                <div
                  key={index}
                  className="bg-white rounded-xl p-5 shadow-md border border-gray-100 animate-pulse"
                >
                  <div className="w-12 h-12 bg-gray-200 rounded-xl mb-4" />
                  <div className="h-5 bg-gray-200 rounded w-3/4 mb-2" />
                  <div className="h-4 bg-gray-100 rounded w-full" />
                </div>
              ))
            : data.features.map((feature, index) => (
                <div
                  key={`${feature.title}-${index}`}
                  className="bg-white rounded-xl p-5 shadow-md hover:shadow-lg transition-all duration-300 border border-gray-100 group hover:-translate-y-1"
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-mint/20 to-mint/10 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                    <span className="text-2xl">{feature.icon}</span>
                  </div>
                  <h3 className="text-lg font-bold sf-heading-color mb-2">{feature.title}</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">{feature.description}</p>
                </div>
              ))}
        </div>
      </div>
    </section>
  );
}
