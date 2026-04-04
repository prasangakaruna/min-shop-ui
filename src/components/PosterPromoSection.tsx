'use client';

import React from 'react';
import Link from 'next/link';
import { getImageDisplayUrl } from '@/lib/api';
import {
  type PosterPromoSettings,
  getPosterPromoDisplayItems,
  shouldDisplayPosterPromo,
} from '@/lib/storefrontHomeTheme';

function PromoLink({
  href,
  children,
  className,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  const t = href.trim();
  if (t === '') return <>{children}</>;
  const external = /^https?:\/\//i.test(t) || t.startsWith('mailto:') || t.startsWith('tel:');
  if (external) {
    return (
      <a href={t} target="_blank" rel="noopener noreferrer" className={className}>
        {children}
      </a>
    );
  }
  return (
    <Link href={t} className={className}>
      {children}
    </Link>
  );
}

function PosterTile({
  item,
  className,
  compact,
}: {
  item: ReturnType<typeof getPosterPromoDisplayItems>[number];
  className?: string;
  compact?: boolean;
}) {
  const img = getImageDisplayUrl(item.imageUrl);
  const href = item.linkUrl?.trim() ?? '';
  const hasLink = href !== '';

  const inner = (
    <div
      className={`relative h-full min-h-[140px] overflow-hidden rounded-2xl bg-gray-100 shadow-sm ring-1 ring-black/5 transition hover:shadow-md ${
        hasLink ? 'cursor-pointer' : ''
      } ${className ?? ''}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- URLs from admin uploads / arbitrary CDNs */}
      <img src={img} alt="" className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/20 to-transparent" />
      {item.badge ? (
        <span
          className={`absolute right-3 top-3 rounded-full bg-[var(--sf-color-primary,#0f766e)] px-2.5 py-1 font-semibold text-white shadow ${
            compact ? 'text-[8px]' : 'text-[10px] sm:text-xs'
          }`}
        >
          {item.badge}
        </span>
      ) : null}
      <div className={`absolute bottom-0 left-0 right-0 p-3 sm:p-4 ${compact ? 'p-2' : ''}`}>
        {item.title ? (
          <p
            className={`font-semibold leading-snug text-white drop-shadow-sm ${
              compact ? 'text-[9px]' : 'text-xs sm:text-base'
            }`}
            style={{ fontFamily: 'var(--sf-font-heading, inherit)' }}
          >
            {item.title}
          </p>
        ) : null}
        {item.subtitle ? (
          <p className={`mt-0.5 text-white/90 ${compact ? 'text-[8px]' : 'text-[10px] sm:text-sm'}`}>{item.subtitle}</p>
        ) : null}
        {item.ctaLabel ? (
          <span
            className={`mt-1.5 inline-block font-semibold text-white underline decoration-white/70 underline-offset-2 ${
              compact ? 'text-[8px]' : 'text-[10px] sm:text-sm'
            }`}
          >
            {item.ctaLabel}
          </span>
        ) : null}
      </div>
    </div>
  );

  if (hasLink) {
    return (
      <PromoLink href={href} className="block h-full focus:outline-none focus-visible:ring-2 focus-visible:ring-mint rounded-2xl">
        {inner}
      </PromoLink>
    );
  }
  return inner;
}

export default function PosterPromoSection({
  config,
  wideLayout = true,
  compact = false,
}: {
  config: PosterPromoSettings;
  /** When false, inner max width matches narrow storefront sections. */
  wideLayout?: boolean;
  /** Smaller type and spacing for theme editor preview. */
  compact?: boolean;
}) {
  if (!shouldDisplayPosterPromo(config)) return null;

  const items = getPosterPromoDisplayItems(config);
  const n = items.length;
  const eyebrow = config.eyebrow?.trim() ?? '';
  const title = config.title?.trim() ?? '';
  const viewLabel = config.viewAllLabel?.trim() ?? '';
  const viewUrl = config.viewAllUrl?.trim() ?? '';

  const shell = wideLayout ? 'max-w-screen-2xl' : 'max-w-7xl';

  return (
    <section
      className={`mx-auto w-full px-4 sm:px-6 lg:px-8 ${compact ? 'py-4' : 'py-10 sm:py-12'}`}
      aria-label={title || 'Promotional highlights'}
    >
      <div className={`${shell} mx-auto`}>
        {(eyebrow || title || (viewLabel && viewUrl)) && (
          <div
            className={`mb-4 flex flex-col gap-2 sm:mb-6 sm:flex-row sm:items-end sm:justify-between ${
              compact ? 'mb-2 sm:mb-3' : ''
            }`}
          >
            <div>
              {eyebrow ? (
                <p
                  className={`font-semibold uppercase tracking-[0.2em] text-[var(--sf-color-primary,#0f766e)] ${
                    compact ? 'text-[8px]' : 'text-[10px] sm:text-xs'
                  }`}
                >
                  {eyebrow}
                </p>
              ) : null}
              {title ? (
                <h2
                  className={`mt-1 font-bold text-gray-900 ${compact ? 'text-sm' : 'text-xl sm:text-3xl'}`}
                  style={{ fontFamily: 'var(--sf-font-heading, inherit)' }}
                >
                  {title}
                </h2>
              ) : null}
            </div>
            {viewLabel && viewUrl ? (
              <PromoLink
                href={viewUrl}
                className={`shrink-0 font-semibold text-[var(--sf-color-primary,#0f766e)] hover:underline ${
                  compact ? 'text-[10px]' : 'text-sm'
                }`}
              >
                {viewLabel} →
              </PromoLink>
            ) : null}
          </div>
        )}

        {n === 1 && (
          <div className={compact ? 'min-h-[100px]' : 'min-h-[260px] sm:min-h-[380px]'}>
            <PosterTile item={items[0]!} className="h-full min-h-[inherit]" compact={compact} />
          </div>
        )}

        {n === 2 && (
          <div className={`grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 ${compact ? 'gap-2' : ''}`}>
            <div className={compact ? 'min-h-[88px]' : 'min-h-[220px] sm:min-h-[280px]'}>
              <PosterTile item={items[0]!} className="h-full min-h-[inherit]" compact={compact} />
            </div>
            <div className={compact ? 'min-h-[88px]' : 'min-h-[220px] sm:min-h-[280px]'}>
              <PosterTile item={items[1]!} className="h-full min-h-[inherit]" compact={compact} />
            </div>
          </div>
        )}

        {n === 3 && (
          <div
            className={`grid grid-cols-1 gap-3 sm:grid-cols-2 sm:grid-rows-2 sm:gap-4 ${compact ? 'gap-2 sm:gap-2' : ''}`}
          >
            <div className={`sm:row-span-2 ${compact ? 'min-h-[100px] sm:min-h-0' : 'min-h-[260px] sm:min-h-0'}`}>
              <PosterTile item={items[0]!} className="h-full min-h-[inherit] sm:min-h-[420px]" compact={compact} />
            </div>
            <div className={compact ? 'min-h-[80px]' : 'min-h-[175px] sm:min-h-[205px]'}>
              <PosterTile item={items[1]!} className="h-full min-h-[inherit]" compact={compact} />
            </div>
            <div className={compact ? 'min-h-[80px]' : 'min-h-[175px] sm:min-h-[205px]'}>
              <PosterTile item={items[2]!} className="h-full min-h-[inherit]" compact={compact} />
            </div>
          </div>
        )}

        {n >= 4 && (
          <div
            className={`grid grid-cols-1 gap-3 sm:grid-cols-12 sm:grid-rows-2 sm:gap-4 ${compact ? 'gap-2 sm:gap-2' : ''}`}
          >
            <div className="sm:col-span-6 sm:row-span-2">
              <div className={compact ? 'min-h-[100px] sm:min-h-[260px]' : 'min-h-[260px] sm:min-h-[400px]'}>
                <PosterTile item={items[0]!} className="h-full min-h-[inherit]" compact={compact} />
              </div>
            </div>
            <div className="sm:col-span-3 sm:col-start-7 sm:row-start-1">
              <div className={compact ? 'min-h-[80px]' : 'min-h-[175px] sm:min-h-[200px]'}>
                <PosterTile item={items[1]!} className="h-full min-h-[inherit]" compact={compact} />
              </div>
            </div>
            <div className="sm:col-span-3 sm:col-start-7 sm:row-start-2">
              <div className={compact ? 'min-h-[80px]' : 'min-h-[175px] sm:min-h-[200px]'}>
                <PosterTile item={items[2]!} className="h-full min-h-[inherit]" compact={compact} />
              </div>
            </div>
            <div className="sm:col-span-3 sm:col-start-10 sm:row-span-2 sm:row-start-1">
              <div className={compact ? 'min-h-[100px] sm:min-h-[260px]' : 'min-h-[260px] sm:min-h-[400px]'}>
                <PosterTile item={items[3]!} className="h-full min-h-[inherit]" compact={compact} />
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
