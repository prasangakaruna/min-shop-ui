'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { storefrontRequest } from '@/lib/storefrontApi';
import {
  STOREFRONT_PRIMARY_BUTTON_STYLE,
  STOREFRONT_PRIMARY_SOLID_HOVER_CLASS,
} from '@/lib/storefrontHomeTheme';

const DEFAULT_OFFERS = [
  {
    id: '1',
    title: 'Flash Sale',
    badge: 'Up to 50% Off',
    description: 'Limited time offers on premium electronics',
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80',
    link: '/products?category=electronics',
    accent: 'mint' as const,
    icon: '⚡',
  },
  {
    id: '2',
    title: 'New Arrivals',
    badge: 'Fresh Stock',
    description: 'Check out our latest additions',
    image: 'https://images.unsplash.com/photo-1572569511254-d8f925fe2cbb?w=800&q=80',
    link: '/products',
    accent: 'mint' as const,
    icon: '🆕',
  },
  {
    id: '3',
    title: 'Premium Deals',
    badge: 'Luxury Items',
    description: 'Exclusive deals on high-end products',
    image: 'https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?w=800&q=80',
    link: '/products',
    accent: 'mint' as const,
    icon: '💎',
  },
];

type Accent = 'red' | 'blue' | 'mint' | 'teal';

const ACCENT_STYLES: Record<Accent, { gradient: string; badgeColor: string }> = {
  red: { gradient: 'from-red-500/20 to-red-600/20', badgeColor: 'bg-red-500' },
  blue: { gradient: 'from-blue-500/20 to-blue-600/20', badgeColor: 'bg-blue-500' },
  mint: {
    gradient:
      'from-[color:color-mix(in_srgb,var(--sf-color-primary,#4FD1C7)_18%,transparent)] to-[color:color-mix(in_srgb,var(--sf-color-primary,#4FD1C7)_32%,transparent)]',
    badgeColor: 'bg-[color:var(--sf-color-button,var(--sf-color-primary,#4FD1C7))]',
  },
  teal: { gradient: 'from-teal-500/20 to-teal-700/20', badgeColor: 'bg-teal-500' },
};

interface SpecialOfferApi {
  id?: string;
  title?: string;
  badge?: string;
  description?: string;
  image_url?: string;
  href?: string;
  icon?: string;
  accent?: string;
}

interface SpecialOffersResponse {
  data?: SpecialOfferApi[];
}

type DisplayOffer = {
  id: string;
  title: string;
  badge: string;
  description: string;
  image: string;
  link: string;
  accent: Accent;
  icon: string;
  gradient: string;
  badgeColor: string;
};

function normalizeAccent(raw: string | undefined): Accent {
  const a = (raw || '').toLowerCase();
  if (a === 'red' || a === 'blue' || a === 'mint' || a === 'teal') return a;
  return 'mint';
}

function mapApiToDisplay(items: SpecialOfferApi[]): DisplayOffer[] {
  return items.slice(0, 3).map((row, i) => {
    const accent = normalizeAccent(row.accent);
    const styles = ACCENT_STYLES[accent];
    const title = typeof row.title === 'string' && row.title.trim() ? row.title.trim() : `Offer ${i + 1}`;
    const image =
      typeof row.image_url === 'string' && row.image_url.trim()
        ? row.image_url.trim()
        : DEFAULT_OFFERS[i % DEFAULT_OFFERS.length].image;
    const link = typeof row.href === 'string' && row.href.trim() ? row.href.trim() : '/products';
    return {
      id: String(row.id ?? i),
      title,
      badge: typeof row.badge === 'string' && row.badge.trim() ? row.badge.trim() : 'Special',
      description:
        typeof row.description === 'string' && row.description.trim()
          ? row.description.trim()
          : 'Shop the collection.',
      image,
      link,
      accent,
      icon: typeof row.icon === 'string' && row.icon.trim() ? row.icon.trim() : '✨',
      gradient: styles.gradient,
      badgeColor: styles.badgeColor,
    };
  });
}

function defaultOffersDisplay(): DisplayOffer[] {
  return DEFAULT_OFFERS.map((o) => {
    const styles = ACCENT_STYLES[o.accent];
    return {
      ...o,
      gradient: styles.gradient,
      badgeColor: styles.badgeColor,
    };
  });
}

export default function SpecialOffers({ storeSlug }: { storeSlug?: string | null }) {
  const [offers, setOffers] = useState<DisplayOffer[] | null>(null);
  const [loading, setLoading] = useState(() => Boolean(storeSlug));

  const withStore = (href: string) => {
    if (!storeSlug) return href;
    const joiner = href.includes('?') ? '&' : '?';
    return `${href}${joiner}store=${encodeURIComponent(storeSlug)}`;
  };

  useEffect(() => {
    if (!storeSlug) {
      setOffers(defaultOffersDisplay());
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setOffers(null);
    storefrontRequest<SpecialOffersResponse>('/storefront/special-offers', { store: storeSlug })
      .then((body) => {
        if (cancelled) return;
        const raw = Array.isArray(body?.data) ? body.data : [];
        if (raw.length > 0) {
          setOffers(mapApiToDisplay(raw));
        } else {
          setOffers(defaultOffersDisplay());
        }
      })
      .catch(() => {
        if (!cancelled) setOffers(defaultOffersDisplay());
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [storeSlug]);

  const displayOffers = useMemo(() => offers ?? defaultOffersDisplay(), [offers]);
  const showSkeleton = Boolean(storeSlug) && loading;

  return (
    <section className="py-16 bg-gray-50 relative overflow-hidden border-t border-gray-100">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%234FD1C7' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <div className="flex items-center justify-center gap-3 mb-3">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-red-400/30 to-transparent" />
            <div className="inline-flex items-center gap-2 bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-bold border border-red-200 shadow-sm">
              <span className="w-1.5 h-1.5 bg-red-600 rounded-full animate-pulse" />
              ⏰ LIMITED TIME
            </div>
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-red-400/30 to-transparent" />
          </div>
          <div className="space-y-1.5">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold sf-heading-color leading-tight">
              Special{' '}
              <span className="relative inline-block">
                <span
                  className="relative z-10 bg-clip-text text-transparent"
                  style={{
                    backgroundImage:
                      'linear-gradient(to right, var(--sf-color-primary, #4FD1C7), color-mix(in srgb, var(--sf-color-primary, #4FD1C7) 62%, #0f172a))',
                  }}
                >
                  Offers
                </span>
                <span
                  className="absolute bottom-1.5 left-0 right-0 -z-0 h-2.5 -skew-x-12 transform opacity-30"
                  style={{ backgroundColor: 'var(--sf-color-primary, #4FD1C7)' }}
                />
              </span>
            </h2>
            <p className="text-base md:text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Don&apos;t miss out on these amazing deals and exclusive offers
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {showSkeleton
            ? [0, 1, 2].map((k) => (
                <div
                  key={k}
                  className="rounded-2xl bg-white shadow-xl border border-gray-100 overflow-hidden animate-pulse"
                >
                  <div className="h-64 bg-gray-200" />
                </div>
              ))
            : displayOffers.map((offer) => (
                <Link
                  key={offer.id}
                  href={withStore(offer.link)}
                  prefetch={false}
                  className="group relative overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-xl transition-all duration-300 hover:-translate-y-1 hover:border-[color:color-mix(in_srgb,var(--sf-color-primary,#4FD1C7)_22%,transparent)] hover:shadow-2xl"
                >
                  <div
                    className="relative h-64 bg-cover bg-center group-hover:scale-110 transition-transform duration-700"
                    style={{ backgroundImage: `url(${offer.image})` }}
                  >
                    <div
                      className={`absolute inset-0 bg-gradient-to-br ${offer.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 via-gray-900/30 to-transparent" />

                    <div className="absolute top-4 left-4 z-10">
                      <div className="w-14 h-14 bg-white/90 backdrop-blur-sm rounded-xl flex items-center justify-center text-3xl shadow-lg group-hover:scale-110 group-hover:bg-white transition-all duration-300">
                        {offer.icon}
                      </div>
                    </div>

                    <div
                      className={`absolute top-4 right-4 ${offer.badgeColor} text-white px-4 py-2 rounded-xl text-sm font-bold shadow-xl group-hover:scale-110 transition-transform duration-300`}
                    >
                      {offer.badge}
                    </div>

                    <div className="absolute bottom-0 left-0 right-0 p-6 text-white z-10">
                      <h3 className="mb-2 text-2xl font-bold transition-colors duration-300 group-hover:text-[color:var(--sf-color-accent,var(--sf-color-primary,#4FD1C7))]">
                        {offer.title}
                      </h3>
                      <p className="text-white/90 text-sm mb-4 leading-relaxed">{offer.description}</p>
                      <div className="flex items-center text-white transition-colors duration-300 group-hover:text-[color:var(--sf-color-accent,var(--sf-color-primary,#4FD1C7))]">
                        <span className="text-base font-semibold mr-2">Shop Now</span>
                        <svg
                          className="w-5 h-5 group-hover:translate-x-2 transition-transform duration-300"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
        </div>

        <div className="text-center mt-10">
          <Link
            href={withStore('/products')}
            className={`inline-flex items-center space-x-2 rounded-xl px-8 py-3 font-semibold shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl ${STOREFRONT_PRIMARY_SOLID_HOVER_CLASS}`}
            style={STOREFRONT_PRIMARY_BUTTON_STYLE}
          >
            <span>View All Offers</span>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
}
