'use client';

import React from 'react';

interface ProductImageProps {
  imageUrl: string | null | undefined;
  alt: string;
  /** Optional: used for deterministic dummy image when imageUrl is missing */
  productId?: number;
  className?: string;
  containerClassName?: string;
}

/** Build a deterministic placeholder image URL (picsum) when product has no image. */
function dummyImageUrl(seed: string | number): string {
  return `https://picsum.photos/seed/${encodeURIComponent(String(seed))}/400/400`;
}

/** Renders product image, or a dummy placeholder (unique per product) when no image_url. */
export default function ProductImage({ imageUrl, alt, productId, className = 'object-cover', containerClassName = '' }: ProductImageProps) {
  const raw = imageUrl?.trim();
  const url = raw || (productId != null ? dummyImageUrl(productId) : dummyImageUrl(alt.replace(/\s+/g, '-').toLowerCase() || 'product'));
  return (
    <div className={`flex items-center justify-center overflow-hidden bg-gray-50 ${containerClassName}`}>
      <img src={url} alt={alt} className={`w-full h-full ${className}`} />
    </div>
  );
}
