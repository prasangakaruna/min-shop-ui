import { Suspense } from 'react';
import { MarketplaceThemeClient } from './MarketplaceThemeClient';

export default function SystemMarketplaceThemePage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-6xl rounded-xl border border-gray-200 bg-white p-8 text-sm text-gray-500 shadow-sm">
          Loading theme editor…
        </div>
      }
    >
      <MarketplaceThemeClient />
    </Suspense>
  );
}
