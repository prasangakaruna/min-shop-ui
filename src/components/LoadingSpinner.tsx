import React from 'react';
import { MintShopLoaderRing, type MintShopLoaderRingSize } from '@/components/MintShopLoader';

interface LoadingSpinnerProps {
  size?: MintShopLoaderRingSize;
  className?: string;
}

export default function LoadingSpinner({ size = 'md', className = '' }: LoadingSpinnerProps) {
  return <MintShopLoaderRing size={size} className={className} />;
}
