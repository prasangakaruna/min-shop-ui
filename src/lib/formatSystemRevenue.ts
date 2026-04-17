/** Format monetary amounts for the system console (multi-tenant; currencies may differ). */

export function formatRevenueCompact(amount: number, isoCurrency?: string | null): string {
  const n = Number.isFinite(amount) ? amount : 0;
  const code = isoCurrency?.trim().toUpperCase();
  if (code && /^[A-Z]{3}$/.test(code)) {
    try {
      return new Intl.NumberFormat(undefined, { style: 'currency', currency: code, maximumFractionDigits: 2 }).format(n);
    } catch {
      /* fall through */
    }
  }
  return new Intl.NumberFormat(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
}
