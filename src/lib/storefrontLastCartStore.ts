/** Same key as legacy cart page — last storefront used for cart/checkout. */
export const STOREFRONT_LAST_CART_STORE_KEY = 'mint_cart_store_id';

export function getLastCartStoreId(): number | null {
  if (typeof window === 'undefined') return null;
  const id = localStorage.getItem(STOREFRONT_LAST_CART_STORE_KEY);
  const n = id ? parseInt(id, 10) : NaN;
  return !isNaN(n) && n > 0 ? n : null;
}

export function setLastCartStoreId(storeId: number): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STOREFRONT_LAST_CART_STORE_KEY, String(storeId));
}
