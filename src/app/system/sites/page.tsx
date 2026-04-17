import { ManageSiteSection } from '@/components/system/ManageSiteSection';

export default function SystemManageSitePage() {
  return (
    <div className="mx-auto max-w-[1400px] space-y-6 pb-12">
      <header>
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-mint-dark">System console</p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">Manage Site</h1>
        <p className="mt-2 max-w-2xl text-sm text-gray-600">
          Search and filter tenant storefronts, open store dashboards, and review domains and API keys.
        </p>
      </header>
      <ManageSiteSection />
    </div>
  );
}
