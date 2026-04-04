import React from 'react';

const sizeClasses = {
  sm: 'h-4 w-4 border-2',
  md: 'h-8 w-8 border-[3px]',
  lg: 'h-14 w-14 border-[3px]',
} as const;

export type MintShopLoaderRingSize = keyof typeof sizeClasses;

/**
 * Inline / overlay spinner — Mint marketplace theme (mint-shop.pro).
 * Use {@link MintShopLoader} for full-page route transitions.
 */
export function MintShopLoaderRing({
  size = 'md',
  className = '',
}: {
  size?: MintShopLoaderRingSize;
  className?: string;
}) {
  return (
    <div className={`inline-flex ${className}`} role="status" aria-label="Loading">
      <div
        className={`${sizeClasses[size]} animate-spin rounded-full border-mint/20 border-t-mint border-r-mint/50 shadow-[0_0_20px_rgba(79,209,199,0.25)]`}
      />
      <span className="sr-only">Loading…</span>
    </div>
  );
}

type MintShopLoaderProps = {
  /** Shown under the spinner */
  label?: string;
  className?: string;
};

/**
 * Full-page loader for App Router `loading.tsx` and heavy Suspense fallbacks.
 * Single Mint-branded treatment site-wide.
 */
export default function MintShopLoader({ label = 'Loading…', className = '' }: MintShopLoaderProps) {
  return (
    <div
      className={`flex min-h-screen w-full flex-col items-center justify-center bg-gradient-to-b from-white via-[#f0faf9] to-gray-50 ${className}`}
    >
      <div className="relative flex flex-col items-center">
        <div
          className="pointer-events-none absolute -inset-8 rounded-full bg-mint/20 blur-2xl animate-pulse"
          aria-hidden
        />
        <MintShopLoaderRing size="lg" className="relative" />
        <p className="relative mt-8 text-sm font-medium tracking-wide text-mint-dark/90">{label}</p>
        <p className="relative mt-1 text-xs text-gray-500">mint-shop.pro</p>
      </div>
    </div>
  );
}
