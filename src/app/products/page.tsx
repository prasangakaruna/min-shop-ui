import { auth } from '@/auth';
import { PublicMaintenancePage } from '@/components/maintenance/PublicMaintenancePage';
import { evaluateMarketplaceMaintenanceGate } from '@/lib/platformConfig';
import { resolveMarketplaceStoreSlugFromRequest } from '@/lib/resolveMarketplaceStoreSlug';
import ProductsPageClient from './ProductsPageClient';

export const dynamic = 'force-dynamic';

export default async function ProductsPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = (await searchParams) ?? {};
  const session = await auth();
  const storeSlug = await resolveMarketplaceStoreSlugFromRequest(sp);
  const gate = await evaluateMarketplaceMaintenanceGate({
    pathname: '/products',
    storeSlug,
    searchParams: sp,
    isSuperAdmin: Boolean(session?.isSuperAdmin),
  });
  if (gate.show) {
    return <PublicMaintenancePage payload={gate.payload} />;
  }
  return <ProductsPageClient />;
}
