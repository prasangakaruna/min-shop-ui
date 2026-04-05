'use client';

import React from 'react';
import Link from 'next/link';
import ProductImage from '@/components/ProductImage';
import type { StorefrontProduct } from '@/lib/storefrontApi';
import { formatCategoryLabel } from '@/lib/categories';
import {
  STOREFRONT_PRIMARY_BUTTON_STYLE,
  STOREFRONT_PRIMARY_HOVER_HEADING_CLASS,
  STOREFRONT_PRIMARY_PRICE_CLASS,
  STOREFRONT_PRIMARY_SOLID_HOVER_CLASS,
} from '@/lib/storefrontHomeTheme';

export function storefrontProductHref(product: StorefrontProduct): string {
  const q = product.store?.slug ? `?store=${encodeURIComponent(product.store.slug)}` : '';
  return `/product/${product.id}${q}`;
}

type StorefrontProductTeaserCardProps = {
  product: StorefrontProduct;
  /** 1-based rank; circular badge on the image (e.g. top sellers) */
  rank?: number;
  /** Uppercase-style label on the image when `rank` is not set (e.g. “Featured”) */
  imageBadgeLabel?: string;
  showCategory?: boolean;
  showStoreName?: boolean;
  /** Slightly smaller type for dense grids (e.g. 4-column top sellers) */
  compact?: boolean;
  ctaLabel?: string;
};

export default function StorefrontProductTeaserCard({
  product,
  rank,
  imageBadgeLabel,
  showCategory = false,
  showStoreName = false,
  compact = false,
  ctaLabel = 'View product',
}: StorefrontProductTeaserCardProps) {
  const href = storefrontProductHref(product);
  const categoryLabel = showCategory && product.category ? formatCategoryLabel(product.category) : null;
  const showImageBadge = rank != null && rank >= 1;
  const showLabelBadge = Boolean(imageBadgeLabel?.trim()) && !showImageBadge;

  return (
    <article className="group flex flex-col overflow-hidden rounded-xl border border-gray-100/90 bg-white shadow-sm ring-1 ring-black/[0.03] transition-all duration-300 hover:-translate-y-0.5 hover:border-[color:color-mix(in_srgb,var(--sf-color-primary,#4FD1C7)_24%,transparent)] hover:shadow-lg">
      <Link href={href} prefetch={false} className="relative block aspect-[5/3] w-full overflow-hidden bg-gray-100 sm:aspect-[3/2]">
        <div className="absolute inset-0 z-0 origin-center transition-transform duration-500 ease-out group-hover:scale-[1.04]">
          <ProductImage
            imageUrl={product.image_url}
            alt={product.title}
            productId={product.id}
            containerClassName="h-full w-full"
            className="object-cover"
          />
        </div>
        <div className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-50 transition-opacity duration-300 group-hover:opacity-70" />
        {showImageBadge ? (
          <span
            className="absolute left-2 top-2 z-[2] flex h-8 min-w-8 items-center justify-center rounded-full px-1.5 text-[11px] font-extrabold tabular-nums text-white shadow-md ring-2 ring-white/90"
            style={{
              background: `linear-gradient(135deg, var(--sf-color-button, var(--sf-color-primary, #4FD1C7)), color-mix(in srgb, var(--sf-color-button, var(--sf-color-primary, #4FD1C7)) 55%, #0f172a))`,
            }}
            aria-label={`Rank ${rank}`}
          >
            #{rank}
          </span>
        ) : null}
        {showLabelBadge ? (
          <span
            className="absolute left-2 top-2 z-[2] rounded-md px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white shadow-md backdrop-blur-[2px]"
            style={{
              backgroundColor: 'color-mix(in srgb, var(--sf-color-button, var(--sf-color-primary, #4FD1C7)) 92%, #0f172a)',
            }}
          >
            {imageBadgeLabel!.trim()}
          </span>
        ) : null}
      </Link>

      <div className="flex flex-1 flex-col p-3 md:p-3.5">
        {categoryLabel ? (
          <p className="mb-0.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-gray-400">{categoryLabel}</p>
        ) : null}
        <Link href={href} prefetch={false}>
          <h3
            className={`line-clamp-2 font-semibold leading-snug text-gray-900 ${compact ? 'text-xs md:text-sm' : 'text-sm md:text-[15px]'} ${STOREFRONT_PRIMARY_HOVER_HEADING_CLASS}`}
          >
            {product.title}
          </h3>
        </Link>
        <p
          className={`mt-1 tabular-nums tracking-tight ${compact ? 'text-base font-bold md:text-lg' : 'text-lg font-bold md:text-xl'} ${STOREFRONT_PRIMARY_PRICE_CLASS}`}
        >
          ${product.price}
        </p>
        {showStoreName ? (
          <p className="mt-0.5 line-clamp-1 text-[11px] text-gray-500">{product.store?.name ?? `Store #${product.store_id}`}</p>
        ) : null}

        <div className="mt-auto pt-2 md:pt-2.5">
          <Link
            href={href}
            prefetch={false}
            className={`flex w-full items-center justify-center gap-1.5 rounded-lg py-2 text-[11px] font-semibold md:text-xs ${STOREFRONT_PRIMARY_SOLID_HOVER_CLASS}`}
            style={STOREFRONT_PRIMARY_BUTTON_STYLE}
          >
            {ctaLabel}
            <svg className="h-3 w-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    </article>
  );
}
