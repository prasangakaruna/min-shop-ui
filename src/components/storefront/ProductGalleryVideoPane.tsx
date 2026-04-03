'use client';

import React from 'react';
import type { ProductVideoEmbed } from '@/lib/productVideoEmbed';

/** Matches the main product image frame in StorefrontProductDetail (ProductHoverZoom). */
const FRAME_WRAP = 'relative w-full min-w-0';
const FRAME_INNER =
  'relative aspect-square w-full overflow-hidden rounded-2xl border border-gray-200 bg-gray-50 shadow-sm sm:aspect-[4/3] lg:max-w-[min(100%,520px)]';

export default function ProductGalleryVideoPane({
  parsed,
  productTitle,
}: {
  parsed: ProductVideoEmbed;
  productTitle: string;
}) {
  const title = `${productTitle} — product video`;

  if (parsed.kind === 'youtube' || parsed.kind === 'vimeo') {
    return (
      <div className={FRAME_WRAP}>
        <div className={`${FRAME_INNER} bg-gray-950`}>
          <div className="flex h-full w-full items-center justify-center p-2 sm:p-3">
            <div className="relative aspect-video w-full max-w-full overflow-hidden rounded-xl ring-1 ring-white/10">
              <iframe
                src={parsed.embedSrc}
                className="absolute inset-0 h-full w-full"
                title={title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (parsed.kind === 'html5') {
    return (
      <div className={FRAME_WRAP}>
        <div className={`${FRAME_INNER} bg-gray-950`}>
          <div className="flex h-full w-full items-center justify-center p-2 sm:p-3">
            <video
              src={parsed.src}
              controls
              className="max-h-full w-full max-w-full rounded-xl object-contain ring-1 ring-white/10"
              playsInline
              preload="metadata"
              aria-label={title}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={FRAME_WRAP}>
      <div
        className={`${FRAME_INNER} flex flex-col items-center justify-center gap-4 bg-gradient-to-b from-teal-50/60 to-gray-50 p-6 text-center`}
      >
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-600 text-white shadow-md shadow-teal-900/20">
          <svg className="h-7 w-7 translate-x-0.5" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <path d="M8 5v14l11-7L8 5z" />
          </svg>
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-900">Video on another site</p>
          <p className="mt-1 text-sm text-gray-600">Open the link below to watch in a new tab.</p>
        </div>
        <a
          href={parsed.href}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700"
        >
          {parsed.title}
          <span aria-hidden>→</span>
        </a>
      </div>
    </div>
  );
}
