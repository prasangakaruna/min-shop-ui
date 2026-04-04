import type { MyOrderListItem } from '@/lib/api';

export type OrderFilterTab = 'all' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

export const ORDER_FILTER_TABS: { id: OrderFilterTab; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'processing', label: 'Processing' },
  { id: 'shipped', label: 'Shipped' },
  { id: 'delivered', label: 'Delivered' },
  { id: 'cancelled', label: 'Cancelled' },
];

export function customerOrderStatusPresentation(order: Pick<MyOrderListItem, 'financial_status' | 'fulfillment_status'>): {
  label: string;
  chipClass: string;
} {
  const f = order.financial_status;
  const fu = order.fulfillment_status;
  if (f === 'cancelled' || f === 'refunded') {
    return { label: f === 'refunded' ? 'Refunded' : 'Cancelled', chipClass: 'bg-red-100 text-red-800' };
  }
  if (f === 'pending') {
    return { label: 'Payment pending', chipClass: 'bg-amber-100 text-amber-900' };
  }
  if (fu === 'fulfilled') {
    return { label: 'Delivered', chipClass: 'bg-green-100 text-green-800' };
  }
  if (fu === 'partial') {
    return { label: 'Shipped', chipClass: 'bg-blue-100 text-blue-800' };
  }
  return { label: 'Processing', chipClass: 'bg-yellow-100 text-yellow-900' };
}

export function formatOrderDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return iso;
  }
}

export function formatMoneyAmount(value: string | number): string {
  const n = typeof value === 'string' ? parseFloat(value) : value;
  if (Number.isNaN(n)) return String(value);
  return `$${n.toFixed(2)}`;
}

export function formatAddressLines(addr: Record<string, unknown> | null | undefined): string[] {
  if (!addr || typeof addr !== 'object') return [];
  const lines: string[] = [];
  const first = [addr.first_name, addr.last_name].filter(Boolean).join(' ');
  if (first) lines.push(first);
  const a1 = addr.address1 ?? addr.address;
  if (a1) lines.push(String(a1));
  const city = addr.city;
  const province = addr.province_code ?? addr.province ?? addr.state;
  const zip = addr.zip ?? addr.postal_code;
  if (city || province || zip) {
    lines.push([city, province, zip].filter(Boolean).join(', '));
  }
  if (addr.phone) lines.push(String(addr.phone));
  return lines;
}
