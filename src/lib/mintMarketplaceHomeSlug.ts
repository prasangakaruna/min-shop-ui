/**
 * Public marketplace apex (`/` with no `?store=` and no store subdomain) normally renders
 * built-in defaults only. Set `NEXT_PUBLIC_MARKETPLACE_HOME_STORE_SLUG` to an **active** store
 * slug so that home loads that store’s `storefront_home` theme (same pipeline as `/?store=slug`).
 *
 * Configure in `.env` for production (e.g. mint-shop.pro) and restart Next.js.
 */
export function mintMarketplaceHomeStoreSlug(): string | null {
  const raw = process.env.NEXT_PUBLIC_MARKETPLACE_HOME_STORE_SLUG?.trim();
  return raw && raw.length > 0 ? raw : null;
}
