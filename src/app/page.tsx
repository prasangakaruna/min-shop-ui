import { headers } from 'next/headers';
import { auth } from '@/auth';
import { PublicMaintenancePage } from '@/components/maintenance/PublicMaintenancePage';
import StorefrontHomeBody from '@/components/StorefrontHomeBody';
import { StorefrontProvider } from '@/context/StorefrontContext';
import { evaluateMarketplaceMaintenanceGate } from '@/lib/platformConfig';
import { publicHostnameForStorefrontSlug, storeSlugFromHost } from '@/lib/storeSlug';

export const dynamic = 'force-dynamic';

async function resolveSearchParams(
  searchParams: Promise<{ store?: string | string[] }> | undefined,
): Promise<{ store?: string | string[] }> {
  if (searchParams == null) {
    return {};
  }
  return searchParams;
}

async function storeSlugFromRequestHost(): Promise<string | null> {
  const h = await headers();
  const host = publicHostnameForStorefrontSlug(h.get('host'), h.get('x-forwarded-host'));
  if (!host) return null;
  return storeSlugFromHost(host);
}

/**
 * `/` = global Mint marketplace unless a store context applies:
 * - `/?store=your-store-slug` — that store’s theme + logo
 * - Production: `https://{slug}.mint-shop.pro` (subdomain = store slug, from Host)
 * - Apex only: set `NEXT_PUBLIC_MARKETPLACE_HOME_STORE_SLUG` so `/` loads that store’s `storefront_home` (see /system/marketplace-theme).
 */
export default async function Home({
  searchParams,
}: {
  searchParams?: Promise<{ store?: string | string[] }>;
}) {
  const sp = await resolveSearchParams(searchParams);
  const raw = sp?.store;
  const fromQuery = Array.isArray(raw) ? raw[0] : raw ?? null;
  const q = typeof fromQuery === 'string' && fromQuery.trim() !== '' ? fromQuery.trim() : null;
  const fromHost = await storeSlugFromRequestHost();
  const storeSlug = q ?? fromHost;

  const session = await auth();
  const gate = await evaluateMarketplaceMaintenanceGate({
    pathname: '/',
    storeSlug,
    searchParams: sp as Record<string, string | string[] | undefined>,
    isSuperAdmin: Boolean(session?.isSuperAdmin),
  });
  if (gate.show) {
    return <PublicMaintenancePage payload={gate.payload} />;
  }

  return (
    <StorefrontProvider storeSlug={storeSlug}>
      <StorefrontHomeBody storeSlug={storeSlug} />
    </StorefrontProvider>
  );
}
