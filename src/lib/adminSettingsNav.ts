/**
 * Settings sidebar: only items with a real page or `?section=` on `/admin/settings`.
 * Add entries here when new sections ship — avoid placeholder buttons.
 */
export const ADMIN_SETTINGS_NAV_PRIMARY = [
  { label: 'General', href: '/admin/settings' },
  { label: 'Plan', href: '/admin/settings?section=plan' },
  { label: 'Billing', href: '/admin/settings?section=billing' },
  { label: 'Customer accounts', href: '/admin/settings?section=customer-accounts' },
  { label: 'Locations', href: '/admin/settings?section=locations' },
] as const;

export const ADMIN_SETTINGS_NAV_INTEGRATIONS = [
  { label: 'API Settings', href: '/admin/settings/api' },
  { label: 'Webhooks', href: '/admin/settings/api#store-webhooks' },
] as const;

export function isAdminSettingsPrimaryNavActive(
  itemHref: string,
  pathname: string,
  section: string | null
): boolean {
  if (pathname !== '/admin/settings') return false;
  try {
    const u = new URL(itemHref, 'http://localhost');
    const itemSection = u.searchParams.get('section');
    if (itemSection === null || itemSection === '') {
      return !section;
    }
    return section === itemSection;
  } catch {
    return false;
  }
}
