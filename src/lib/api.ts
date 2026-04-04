/**
 * API client for Mint E-commerce API.
 * All store-scoped requests require X-Store-Id (or X-Store-Slug).
 * Auth: Keycloak JWT via Authorization: Bearer <access_token>.
 */

import type { StorefrontHomeTheme } from '@/lib/storefrontHomeTheme';

const getBaseUrl = () =>
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') || '';

/** Use for img src when the URL may point at the API (e.g. uploads). Normalizes relative/localhost URLs to the API origin so images load. */
export function getImageDisplayUrl(url: string | null | undefined): string {
  if (!url) return '';
  const base = getBaseUrl();
  if (!base) return url;
  try {
    // Handle relative URLs like "/storage/..." coming from the API
    if (url.startsWith('/')) {
      return base + url;
    }
    const u = new URL(url);
    if (u.hostname === 'localhost' && (u.port === '' || u.port === '80')) {
      return base + u.pathname + u.search;
    }
    return url;
  } catch {
    return url;
  }
}

export type ApiError = { message: string; errors?: Record<string, string[]>; error?: string };

export async function apiRequest<T>(
  path: string,
  options: {
    method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
    token?: string | null;
    storeId?: number | null;
    body?: unknown;
    query?: Record<string, string | number | undefined>;
  } = {}
): Promise<T> {
  const { method = 'GET', token, storeId, body, query } = options;
  const base = getBaseUrl();
  if (!base) throw new Error('NEXT_PUBLIC_API_URL is not set');

  const url = new URL(path.startsWith('http') ? path : `${base}${path.startsWith('/') ? '' : '/'}${path}`);
  if (query) {
    Object.entries(query).forEach(([k, v]) => {
      if (v !== undefined && v !== '') url.searchParams.set(k, String(v));
    });
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (storeId != null) headers['X-Store-Id'] = String(storeId);

  const res = await fetch(url.toString(), {
    method,
    headers,
    ...(body !== undefined && { body: JSON.stringify(body) }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err: ApiError = (data?.message && { message: data.message }) || { message: res.statusText };
    if (data?.errors) err.errors = data.errors;
    if (data?.error) err.error = data.error;
    const out = Object.assign(new Error(err.message) as Error & ApiError & { status: number }, err, { status: res.status });
    throw out;
  }
  return data as T;
}

/** Admin: DB-backed pages + collections for menu link picker */
export type NavigationPageOption = {
  id: number;
  title: string;
  handle: string;
  url: string;
  published: boolean;
  status?: string;
};

export type NavigationCollectionOption = { name: string; url: string };

export async function getStoreNavigationOptions(options: {
  token: string;
  storeId: number;
}): Promise<{ pages: NavigationPageOption[]; collections: NavigationCollectionOption[] }> {
  return apiRequest<{ pages: NavigationPageOption[]; collections: NavigationCollectionOption[] }>(
    '/store/navigation-options',
    { token: options.token, storeId: options.storeId }
  );
}

/** Public store CMS page (About, Contact, …) */
export type StorefrontPagePayload = {
  data: {
    id: number;
    title: string;
    handle: string;
    body: string | null;
    excerpt: string | null;
    featured_image: string | null;
    layout_width?: string | null;
  };
  store: { id: number; name: string; slug: string };
};

export async function getStorefrontPage(
  handle: string,
  options: { storeSlug?: string; storeId?: number; token?: string | null } = {}
): Promise<StorefrontPagePayload> {
  const base = getBaseUrl();
  if (!base) throw new Error('NEXT_PUBLIC_API_URL is not set');
  const params = new URLSearchParams();
  if (options.storeSlug) params.set('store', options.storeSlug);
  else if (options.storeId != null) params.set('store_id', String(options.storeId));
  const q = params.toString();
  const url = `${base}/storefront/pages/${encodeURIComponent(handle)}${q ? `?${q}` : ''}`;
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (options.token) headers.Authorization = `Bearer ${options.token}`;
  const res = await fetch(url, { headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err: ApiError = (data?.message && { message: data.message }) || { message: res.statusText };
    const out = Object.assign(new Error(err.message) as Error & ApiError & { status: number }, err, {
      status: res.status,
    });
    throw out;
  }
  return data as StorefrontPagePayload;
}

/** Upload a product image; returns the public URL. */
export async function uploadProductImage(
  file: File,
  options: { token: string; storeId: number }
): Promise<{ url: string }> {
  const base = getBaseUrl();
  if (!base) throw new Error('NEXT_PUBLIC_API_URL is not set');
  const form = new FormData();
  form.append('image', file);
  const url = `${base}/store/products/upload-image`;
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (options.token) headers['Authorization'] = `Bearer ${options.token}`;
  headers['X-Store-Id'] = String(options.storeId);
  const res = await fetch(url, { method: 'POST', headers, body: form });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err: ApiError = (data?.message && { message: data.message }) || { message: res.statusText };
    if (data?.errors) err.errors = data.errors;
    const out = Object.assign(new Error(err.message) as Error & ApiError, err);
    throw out;
  }
  return data as { url: string };
}

/** Upload a content library file (images, PDFs, video, etc.); registers entry in store content. */
export async function uploadContentLibraryFile(
  file: File,
  options: { token: string; storeId: number }
): Promise<{ data: { id: string; name: string; url: string; mime_type: string | null; size: number | null; created_at: string } }> {
  const base = getBaseUrl();
  if (!base) throw new Error('NEXT_PUBLIC_API_URL is not set');
  const form = new FormData();
  form.append('file', file);
  const url = `${base}/store/content/upload-file`;
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (options.token) headers['Authorization'] = `Bearer ${options.token}`;
  headers['X-Store-Id'] = String(options.storeId);
  const res = await fetch(url, { method: 'POST', headers, body: form });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err: ApiError = (data?.message && { message: data.message }) || { message: res.statusText };
    if (data?.errors) err.errors = data.errors;
    const out = Object.assign(new Error(err.message) as Error & ApiError, err);
    throw out;
  }
  return data as { data: { id: string; name: string; url: string; mime_type: string | null; size: number | null; created_at: string } };
}

// Response types matching API (see routes/api.php and docs)
export type UserType = 'customer' | 'store_admin' | 'pro_admin';

export type UserPreferences = {
  locale: string;
  currency: string;
  notifications: {
    email_orders: boolean;
    email_marketing: boolean;
    sms_orders: boolean;
  };
  privacy: {
    product_recommendations: boolean;
    share_anonymous_usage: boolean;
  };
};

export type PatchMyPreferencesBody = {
  locale?: string;
  currency?: string;
  notifications?: Partial<UserPreferences['notifications']>;
  privacy?: Partial<UserPreferences['privacy']>;
};

export interface Me {
  id: number;
  keycloak_id: string | null;
  name: string;
  email: string;
  /** Set only after user has chosen account type (first time); null = must show type selection */
  user_type: UserType | null;
  preferences: UserPreferences;
  password_managed_by: 'keycloak' | 'local';
  /** Keycloak account console when issuer is configured and user is linked */
  keycloak_account_url: string | null;
}

export async function getMe(token: string): Promise<Me> {
  return apiRequest<Me>('/me', { token });
}

export async function patchMe(options: { token: string; name: string }): Promise<Me> {
  return apiRequest<Me>('/me', {
    method: 'PATCH',
    token: options.token,
    body: { name: options.name.trim() },
  });
}

export async function patchMyPreferences(options: {
  token: string;
  body: PatchMyPreferencesBody;
}): Promise<Me> {
  return apiRequest<Me>('/me/preferences', {
    method: 'PATCH',
    token: options.token,
    body: options.body,
  });
}

/** POST /me/register-store-customer — shopper linked to a tenant store (admin Customers list). */
export type RegisterStoreCustomerResponse = {
  id: number;
  store_id: number;
  email: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  accepts_marketing: boolean;
  orders_count: number;
  total_spent: string;
};

export async function registerMeAsStoreCustomer(options: {
  token: string;
  storeSlug: string;
}): Promise<RegisterStoreCustomerResponse> {
  return apiRequest<RegisterStoreCustomerResponse>('/me/register-store-customer', {
    method: 'POST',
    token: options.token,
    body: { store_slug: options.storeSlug.trim() },
  });
}

export type MyOrderLineItem = {
  id: number;
  title: string;
  quantity: number;
  price: string;
  total: string;
  image_url: string | null;
};

export type MyOrderStore = { id: number; name: string; slug: string } | null;

export type MyOrderListItem = {
  id: number;
  store_id: number;
  number: string;
  financial_status: string;
  fulfillment_status: string;
  total: string;
  created_at: string | null;
  line_items: MyOrderLineItem[];
  store: MyOrderStore;
};

export type MyOrdersResponse = {
  data: MyOrderListItem[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
};

export type MyOrderDetail = MyOrderListItem & {
  subtotal: string;
  shipping_address: Record<string, unknown> | null;
  billing_address: Record<string, unknown> | null;
  tax_lines: unknown[];
};

export async function getMyOrders(options: {
  token: string;
  status?: 'all' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  page?: number;
  perPage?: number;
}): Promise<MyOrdersResponse> {
  const { token, status, page, perPage } = options;
  return apiRequest<MyOrdersResponse>('/me/orders', {
    token,
    query: {
      ...(status && status !== 'all' ? { status } : {}),
      ...(page != null && page > 1 ? { page } : {}),
      ...(perPage != null ? { per_page: perPage } : {}),
    },
  });
}

export async function getMyOrder(options: { token: string; orderId: number }): Promise<MyOrderDetail> {
  return apiRequest<MyOrderDetail>(`/me/orders/${options.orderId}`, { token: options.token });
}

export type MyOrdersSummary = {
  total: number;
  processing: number;
  shipped: number;
  delivered: number;
  cancelled: number;
};

export async function getMyOrdersSummary(token: string): Promise<MyOrdersSummary> {
  return apiRequest<MyOrdersSummary>('/me/orders/summary', { token });
}

export type MyAddress = {
  id: number;
  customer_id: number;
  store_id: number | null;
  store: { id: number; name: string; slug: string } | null;
  first_name: string | null;
  last_name: string | null;
  company: string | null;
  address1: string | null;
  address2: string | null;
  city: string | null;
  province: string | null;
  country: string | null;
  zip: string | null;
  phone: string | null;
  is_default: boolean;
};

export async function getMyAddresses(token: string): Promise<{ data: MyAddress[] }> {
  return apiRequest<{ data: MyAddress[] }>('/me/addresses', { token });
}

export type CreateMyAddressBody = {
  store_slug: string;
  first_name: string;
  last_name: string;
  company?: string | null;
  address1: string;
  address2?: string | null;
  city: string;
  province: string;
  zip: string;
  country: string;
  phone?: string | null;
  is_default?: boolean;
};

export async function createMyAddress(token: string, body: CreateMyAddressBody): Promise<MyAddress> {
  return apiRequest<MyAddress>('/me/addresses', { method: 'POST', token, body });
}

export type UpdateMyAddressBody = Partial<{
  first_name: string;
  last_name: string;
  company: string | null;
  address1: string;
  address2: string | null;
  city: string;
  province: string;
  zip: string;
  country: string;
  phone: string | null;
  is_default: boolean;
}>;

export async function updateMyAddress(token: string, id: number, body: UpdateMyAddressBody): Promise<MyAddress> {
  return apiRequest<MyAddress>(`/me/addresses/${id}`, { method: 'PATCH', token, body });
}

export async function deleteMyAddress(token: string, id: number): Promise<void> {
  await apiRequest<unknown>(`/me/addresses/${id}`, { method: 'DELETE', token });
}

/** Pro admin home (`/admin/pro`) layout and copy — stored per store; only applies when that store is selected in the admin header. */
export interface ProDashboardSettings {
  title?: string | null;
  subtitle?: string | null;
  badge_label?: string | null;
  /** When true, KPI numbers reflect only the selected store; when false, all owned stores. */
  kpis_scope?: 'current_store' | 'all_stores';
  show_top_kpis?: boolean;
  show_kpi_total_revenue?: boolean;
  show_kpi_total_orders?: boolean;
  show_kpi_store_count?: boolean;
  show_stores_table?: boolean;
  /** Optional banner behind the hero (URL from upload). */
  hero_image_url?: string | null;
  /** Optional logo beside the hero title (URL from upload). */
  header_logo_url?: string | null;
  /** @deprecated Use Theme editor global colors; no longer shown in Customize Pro home. */
  accent_color?: string | null;
  /** Extra note shown on the page (plain text). */
  custom_note?: string | null;
  primary_action_label?: string | null;
  primary_action_href?: string | null;
}

/** Persisted app embeds for the storefront (loaded via GET /storefront/store-branding). */
export type StorefrontAppEmbed = {
  id: string;
  name: string;
  /** HTTPS URL to a `.js` snippet loader (e.g. analytics). */
  script_url?: string | null;
  enabled?: boolean;
};

/** GET /store/theme — `themes` row + synced storefront_home and embeds (admin theme editor). */
export type StoreThemeResource = {
  id?: number | null;
  name?: string | null;
  role?: string;
  updated_at?: string | null;
  storefront_home: StorefrontHomeTheme | null;
  storefront_app_embeds: StorefrontAppEmbed[];
};

export interface StoreSettings {
  plan_price?: number;
  currency_display?: string;
  backup_region?: string;
  unit_system?: 'metric' | 'imperial';
  default_weight_unit?: string;
  timezone?: string | null;
  order_id_prefix?: string | null;
  order_id_suffix?: string | null;
  business_entity?: string | null;
  business_country?: string | null;
  contact_phone?: string | null;
  contact_address?: string | null;
  // Storefront branding (subdomain storefront header/footer)
  company_description?: string | null;
  company_logo_url?: string | null;
  company_cover_image_url?: string | null;
  social_links?: {
    facebook?: string | null;
    instagram?: string | null;
    x?: string | null; // twitter/x
    twitter?: string | null;
    linkedin?: string | null;
    youtube?: string | null;
    tiktok?: string | null;
  };
  onboarding?: {
    store_category?: string | null;
    business_stage?: 'new' | 'existing' | null;
    sell_types?: string[] | null;
    sell_places?: string[] | null;
  };
  onboarding_completed?: boolean;
  onboarding_completed_at?: string | null;
  order_processing?: {
    mode?: 'auto_all' | 'auto_gift_cards' | 'manual';
    auto_archive?: boolean;
  };
  pro_dashboard?: ProDashboardSettings;
  /** Sections + theme for public store home (?store=slug); see lib/storefrontHomeTheme.ts */
  storefront_home?: StorefrontHomeTheme | null;
  /** Third-party script embeds (analytics, chat, etc.); see Theme editor App Embeds. */
  storefront_app_embeds?: StorefrontAppEmbed[] | null;
  /** Bulk-order auto discount; omit to use server env defaults (see /admin/pro/promotions). */
  storefront_volume_promo?: {
    enabled?: boolean;
    min_subtotal?: number;
    percent?: number;
    starts_at?: string | null;
    ends_at?: string | null;
  } | null;
}

export interface StoreSummary {
  id: number;
  owner_id: number;
  name: string;
  slug: string;
  domain: string | null;
  email: string | null;
  plan: string;
  is_active: boolean;
  settings?: StoreSettings;
}

export interface StoreListResponse {
  data: StoreSummary[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

/** GET /store/api-keys/stats */
export interface ApiKeysStats {
  system_health_percent: number | null;
  uptime_trend: string | null;
  api_requests_total: number;
  api_requests_trend: string | null;
  active_webhooks: number;
  webhooks_integrations_label: string;
  active_api_keys?: number;
}

/** GET /store/api-keys list item */
export interface StoreApiKeyItem {
  id: number;
  name: string;
  key_prefix: string;
  key_suffix?: string | null;
  status: string;
  last_used_at: string | null;
  created_at: string;
}

/** POST /store/api-keys response (full key returned once) */
export interface StoreApiKeyCreated {
  id: number;
  name: string;
  key: string;
  key_prefix: string;
  key_suffix?: string | null;
  status: string;
  created_at: string;
}

export interface ProductVariant {
  id: number;
  product_id: number;
  sku: string | null;
  title: string | null;
  price: string;
  compare_at_price: string | null;
  inventory_quantity: number;
  /** Option map matching product option_definitions names, e.g. { Color: "Navy", Size: "M" } */
  options: Record<string, string> | null;
}

/** Drag-ordered option groups (e.g. Color, Size) stored in product metadata. */
export interface ProductOptionValue {
  id: string;
  label: string;
}

export interface ProductOptionGroup {
  id: string;
  name: string;
  values: ProductOptionValue[];
}

/** Optional PDP fields (product metadata); shown on public product page. */
export type ProductSpecificationRow = { label: string; value: string };

/** Grocery-style nutrition panel (optional PDP block). */
export type NutritionFactsRow = {
  label: string;
  amount: string;
  dv?: string | null;
  indent?: number;
};

export type NutritionFacts = {
  serves_about?: string | null;
  serving_size?: string | null;
  serving_weight?: string | null;
  calories?: string | null;
  rows?: NutritionFactsRow[];
};

export interface Product {
  id: number;
  store_id: number;
  title: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  /** Multiple image URLs (storefront gallery). Falls back to [image_url] when empty. */
  image_urls?: string[];
  /** Key features (bullet list on storefront). From product metadata. */
  key_features?: string[];
  status: string;
  category: string | null;
  /** Collection names from product metadata (admin / menu link picker). */
  collections?: string[];
  /** Ordered option groups for variants (admin drag-and-drop). */
  option_groups?: ProductOptionGroup[];
  variants: ProductVariant[];
  brand?: string | null;
  ingredients?: string | null;
  directions?: string | null;
  warnings?: string | null;
  package_size?: string | null;
  /** Net weight in ounces; used with price for ¢/oz style unit pricing on PDP. */
  weight_oz?: number | null;
  specifications?: ProductSpecificationRow[];
  rating?: { average: number; count: number } | null;
  we_love_this_for?: string[];
  ingredients_allergen?: string | null;
  nutrition_facts?: NutritionFacts | null;
  /** YouTube, Vimeo, or direct video file URL (https). */
  video_url?: string | null;
}

export interface ProductsResponse {
  data: Product[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

/** Normalizes GET /store/product-categories (may be `{ data: string[] }`, a string array, or legacy objects). */
export type ProductCategoryOption = { id: string; name: string };

export function parseStoreProductCategoriesResponse(raw: unknown): ProductCategoryOption[] {
  const rows: unknown[] = Array.isArray(raw)
    ? raw
    : raw && typeof raw === 'object' && Array.isArray((raw as { data?: unknown }).data)
      ? ((raw as { data: unknown[] }).data ?? [])
      : [];
  return rows.map((item): ProductCategoryOption => {
    if (typeof item === 'string') {
      const t = item.trim();
      return { id: t, name: t };
    }
    if (item && typeof item === 'object' && 'name' in item) {
      const o = item as { id?: unknown; name: unknown };
      const name = String(o.name ?? '').trim();
      const id = String(o.id ?? name).trim();
      return { id: id || name, name: name || id };
    }
    const s = String(item).trim();
    return { id: s, name: s };
  });
}

/** Category slugs for admin product filters (defaults + custom + any slug still on products). */
export async function getStoreProductCategories(options: {
  token: string;
  storeId: number;
}): Promise<string[]> {
  const res = await apiRequest<unknown>('/store/product-category-slugs', {
    token: options.token,
    storeId: options.storeId,
  });
  if (res && typeof res === 'object' && Array.isArray((res as { data?: unknown }).data)) {
    return ((res as { data: string[] }).data ?? []).filter((s) => typeof s === 'string');
  }
  return [];
}

/** Product as returned by GET /storefront/products and /storefront/products/:id (no auth) */
export interface StorefrontProduct {
  id: number;
  store_id: number;
  title: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  image_urls: string[];
  key_features: string[];
  category: string | null;
  price: string;
  option_groups?: ProductOptionGroup[];
  variants: ProductVariant[];
  store: { id: number; name: string; slug: string } | null;
  brand?: string | null;
  ingredients?: string | null;
  directions?: string | null;
  warnings?: string | null;
  package_size?: string | null;
  weight_oz?: number | null;
  specifications?: ProductSpecificationRow[];
  rating?: { average: number; count: number } | null;
  we_love_this_for?: string[];
  ingredients_allergen?: string | null;
  nutrition_facts?: NutritionFacts | null;
  /** YouTube, Vimeo, or direct video file URL (https). */
  video_url?: string | null;
}

/** Fetch a single product for the storefront (no auth). */
export async function getStorefrontProduct(productId: number | string): Promise<StorefrontProduct> {
  const base = getBaseUrl();
  if (!base) throw new Error('NEXT_PUBLIC_API_URL is not set');
  const res = await fetch(`${base}/storefront/products/${productId}`, { headers: { Accept: 'application/json' } });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err: ApiError = (data?.message && { message: data.message }) || { message: res.statusText };
    const out = Object.assign(new Error(err.message) as Error & ApiError, err, { status: res.status });
    throw out;
  }
  return data as StorefrontProduct;
}

/** Fetch storefront product list (no auth). Uses GET /storefront/products from the API. */
export async function getStorefrontProducts(options?: {
  page?: number;
  per_page?: number;
  category?: string;
  search?: string;
  /** Store slug (query param `store`). */
  store?: string;
  /** Store id (query param `store_id`). */
  storeId?: number;
}): Promise<{ data: StorefrontProduct[]; total: number }> {
  const base = getBaseUrl();
  if (!base) throw new Error('NEXT_PUBLIC_API_URL is not set. Set it in .env.local to your API base (e.g. http://localhost:8000/api).');
  const params = new URLSearchParams();
  if (options?.page != null) params.set('page', String(options.page));
  if (options?.per_page != null) params.set('per_page', String(options.per_page));
  if (options?.category) params.set('category', options.category);
  if (options?.search) params.set('search', options.search);
  if (options?.store) params.set('store', options.store);
  if (options?.storeId != null) params.set('store_id', String(options.storeId));
  const url = `${base}/storefront/products${params.toString() ? `?${params}` : ''}`;
  const res = await fetch(url, {
    headers: { Accept: 'application/json' },
    cache: 'no-store',
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = (data?.message as string) || res.statusText;
    if (res.status === 0 || res.type === 'error') {
      throw new Error(`Cannot reach the API at ${base}. Is it running? Check NEXT_PUBLIC_API_URL in .env.local.`);
    }
    throw new Error(msg);
  }
  return {
    data: (data.data ?? []) as StorefrontProduct[],
    total: (data.total ?? 0) as number,
  };
}

// --- Storefront cart (no auth; identified by store_id + cart_token) ---

const CART_TOKEN_KEY_PREFIX = 'mint_cart_token_';
const CART_COUNT_KEY = 'mint_cart_count';
export const CART_UPDATED_EVENT = 'mint-cart-updated';

/** Get cart item count for header badge (total quantity across lines). */
export function getCartCount(): number {
  if (typeof window === 'undefined') return 0;
  const v = localStorage.getItem(CART_COUNT_KEY);
  return v ? Math.max(0, parseInt(v, 10)) : 0;
}

/** Update stored cart count and notify header. Call after cart load/add/update/remove. */
export function setCartCount(count: number): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(CART_COUNT_KEY, String(Math.max(0, count)));
  window.dispatchEvent(new CustomEvent(CART_UPDATED_EVENT));
}

export function getCartTokenForStore(storeId: number): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(CART_TOKEN_KEY_PREFIX + storeId);
}

export function setCartTokenForStore(storeId: number, token: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(CART_TOKEN_KEY_PREFIX + storeId, token);
}

export interface StorefrontCartLine {
  id: number;
  product_variant_id: number;
  quantity: number;
  title: string;
  price: string;
  image_url: string | null;
}

/** Bulk-order auto discount (API: config mint.volume_promo + optional store settings). */
export interface StorefrontVolumePromo {
  enabled: boolean;
  min_subtotal: string;
  percent: number;
  discount_amount: string;
  /** Amount still needed to unlock the promo; null when qualified or disabled. */
  remaining_to_qualify?: string | null;
  starts_at?: string | null;
  ends_at?: string | null;
  /** False when outside optional start/end window. */
  schedule_active?: boolean;
}

export interface StorefrontCart {
  id: number;
  store_id: number;
  lines: StorefrontCartLine[];
  lines_count: number;
  cart_token?: string;
  /** Line totals before discount (API v2). */
  subtotal?: string;
  /** Coupon portion only (for breakdown). */
  coupon_discount?: string;
  /** Coupon + volume promo (capped at subtotal). */
  discount_total?: string;
  total?: string;
  coupon_code?: string | null;
  volume_promo?: StorefrontVolumePromo | null;
}

export async function getStorefrontCart(storeId: number, cartToken?: string | null): Promise<StorefrontCart> {
  const base = getBaseUrl();
  if (!base) throw new Error('NEXT_PUBLIC_API_URL is not set');
  const token = cartToken ?? getCartTokenForStore(storeId);
  const url = `${base}/storefront/cart?store_id=${storeId}${token ? `&cart_token=${encodeURIComponent(token)}` : ''}`;
  const headers: Record<string, string> = { Accept: 'application/json', 'X-Store-Id': String(storeId) };
  if (token) headers['X-Cart-Token'] = token;
  const res = await fetch(url, { headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data?.message as string) || res.statusText);
  const out = data as StorefrontCart;
  if (out.cart_token) setCartTokenForStore(storeId, out.cart_token);
  return out;
}

export async function addStorefrontCartLine(
  storeId: number,
  productVariantId: number,
  quantity: number,
  cartToken?: string | null
): Promise<StorefrontCart> {
  const base = getBaseUrl();
  if (!base) throw new Error('NEXT_PUBLIC_API_URL is not set');
  const token = cartToken ?? getCartTokenForStore(storeId);
  const headers: Record<string, string> = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  };
  if (token) headers['X-Cart-Token'] = token;
  const res = await fetch(`${base}/storefront/cart/lines`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      store_id: storeId,
      product_variant_id: productVariantId,
      quantity,
      ...(token && { cart_token: token }),
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data?.message as string) || res.statusText);
  const out = data as StorefrontCart;
  if (out.cart_token) setCartTokenForStore(storeId, out.cart_token);
  return out;
}

export async function updateStorefrontCartLine(
  storeId: number,
  lineId: number,
  quantity: number,
  cartToken?: string | null
): Promise<StorefrontCart> {
  const base = getBaseUrl();
  if (!base) throw new Error('NEXT_PUBLIC_API_URL is not set');
  const token = cartToken ?? getCartTokenForStore(storeId);
  if (!token) throw new Error('Cart token required');
  const headers: Record<string, string> = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    'X-Store-Id': String(storeId),
    'X-Cart-Token': token,
  };
  const res = await fetch(`${base}/storefront/cart/lines/${lineId}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ quantity }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data?.message as string) || res.statusText);
  return data as StorefrontCart;
}

export async function removeStorefrontCartLine(
  storeId: number,
  lineId: number,
  cartToken?: string | null
): Promise<StorefrontCart> {
  const base = getBaseUrl();
  if (!base) throw new Error('NEXT_PUBLIC_API_URL is not set');
  const token = cartToken ?? getCartTokenForStore(storeId);
  if (!token) throw new Error('Cart token required');
  const headers: Record<string, string> = {
    Accept: 'application/json',
    'X-Store-Id': String(storeId),
    'X-Cart-Token': token,
  };
  const res = await fetch(`${base}/storefront/cart/lines/${lineId}`, { method: 'DELETE', headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data?.message as string) || res.statusText);
  return data as StorefrontCart;
}

export async function applyStorefrontCoupon(storeId: number, code: string, cartToken?: string | null): Promise<StorefrontCart> {
  const base = getBaseUrl();
  if (!base) throw new Error('NEXT_PUBLIC_API_URL is not set');
  const token = cartToken ?? getCartTokenForStore(storeId);
  if (!token) throw new Error('Cart token required. Add something to your cart first.');
  const res = await fetch(`${base}/storefront/cart/coupon`, {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify({ store_id: storeId, code: code.trim(), cart_token: token }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data?.message as string) || res.statusText);
  const out = data as StorefrontCart;
  if (out.cart_token) setCartTokenForStore(storeId, out.cart_token);
  return out;
}

export async function removeStorefrontCoupon(storeId: number, cartToken?: string | null): Promise<StorefrontCart> {
  const base = getBaseUrl();
  if (!base) throw new Error('NEXT_PUBLIC_API_URL is not set');
  const token = cartToken ?? getCartTokenForStore(storeId);
  if (!token) throw new Error('Cart token required');
  const url = `${base}/storefront/cart/coupon?store_id=${storeId}&cart_token=${encodeURIComponent(token)}`;
  const res = await fetch(url, {
    method: 'DELETE',
    headers: { Accept: 'application/json', 'X-Store-Id': String(storeId), 'X-Cart-Token': token },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data?.message as string) || res.statusText);
  return data as StorefrontCart;
}

/** Fetch order by number for storefront (e.g. confirmation page). No auth. */
export async function getStorefrontOrder(
  storeId: number,
  orderNumber: string
): Promise<StorefrontOrder> {
  const base = getBaseUrl();
  if (!base) throw new Error('NEXT_PUBLIC_API_URL is not set');
  const url = `${base}/storefront/order?store_id=${storeId}&number=${encodeURIComponent(orderNumber)}`;
  const headers: Record<string, string> = { Accept: 'application/json', 'X-Store-Id': String(storeId) };
  const res = await fetch(url, { headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data?.message as string) || res.statusText);
  return data as StorefrontOrder;
}

/** Create a real order from the storefront cart (demo checkout; marks order paid). */
export async function completeStorefrontCheckout(
  storeId: number,
  options: {
    cartToken: string;
    email?: string | null;
    shipping_address?: Record<string, unknown>;
    billing_address?: Record<string, unknown>;
  }
): Promise<StorefrontOrder> {
  const base = getBaseUrl();
  if (!base) throw new Error('NEXT_PUBLIC_API_URL is not set');
  const { cartToken, email, shipping_address, billing_address } = options;
  const res = await fetch(`${base}/storefront/checkout/complete`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'X-Store-Id': String(storeId),
      'X-Cart-Token': cartToken,
    },
    body: JSON.stringify({
      store_id: storeId,
      cart_token: cartToken,
      ...(email ? { email } : {}),
      ...(shipping_address && Object.keys(shipping_address).length > 0 ? { shipping_address } : {}),
      ...(billing_address && Object.keys(billing_address).length > 0 ? { billing_address } : {}),
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data?.message as string) || res.statusText);
  return data as StorefrontOrder;
}

export interface OrderLineItem {
  id: number;
  title: string;
  quantity: number;
  price: string;
  total: string;
}

export interface Order {
  id: number;
  store_id: number;
  number: string;
  email: string | null;
  financial_status: string;
  fulfillment_status: string;
  total: string;
  subtotal: string;
  created_at: string | null;
  line_items: OrderLineItem[];
}

/** Order with address fields (storefront confirmation). */
export interface StorefrontOrder extends Order {
  shipping_address: Record<string, unknown> | null;
  billing_address: Record<string, unknown> | null;
}

export interface Customer {
  id: number;
  store_id: number;
  email: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  accepts_marketing: boolean;
  orders_count: number;
  total_spent: string;
}

export interface CustomersResponse {
  data: Customer[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

/** Admin list: GET /store/gift-cards */
export interface AdminGiftCard {
  id: number;
  store_id: number;
  customer_id: number | null;
  code: string;
  initial_value: string;
  balance: string;
  currency: string;
  expires_at: string | null;
  note: string | null;
  created_at: string | null;
}

export interface GiftCardsListResponse {
  data: AdminGiftCard[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export type PaymentTerm = string;
export type ShippingCarrier = string;

export async function getPaymentTerms(options: {
  token: string;
  storeId: number;
}): Promise<PaymentTerm[]> {
  const result = await apiRequest<PaymentTerm[]>('/store/payment-terms', {
    token: options.token,
    storeId: options.storeId,
  });
  return result;
}

export async function getShippingCarriers(options: {
  token: string;
  storeId: number;
}): Promise<ShippingCarrier[]> {
  const result = await apiRequest<ShippingCarrier[]>('/store/shipping-carriers', {
    token: options.token,
    storeId: options.storeId,
  });
  return result;
}
