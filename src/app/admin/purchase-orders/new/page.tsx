 'use client';

 import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useStore } from '@/context/StoreContext';
import {
  apiRequest,
  type Order,
  type StorefrontProduct,
  getStorefrontProducts,
  getPaymentTerms,
  getShippingCarriers,
} from '@/lib/api';
import { ProductSelectModal } from '@/components/admin/ProductSelectModal';

interface LineItem {
  title: string;
  quantity: number;
  price: string;
}

export default function NewPurchaseOrderPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const { currentStore } = useStore();
  const token = (session as { access_token?: string } | null)?.access_token ?? null;

  const [supplier, setSupplier] = useState('');
  const [destination, setDestination] = useState('Shop location');
  const [paymentTerms, setPaymentTerms] = useState('None');
  const [currency, setCurrency] = useState('LKR Rs');
  const [estimatedArrival, setEstimatedArrival] = useState('');
  const [shippingCarrier, setShippingCarrier] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [noteToSupplier, setNoteToSupplier] = useState('');
  const [tags, setTags] = useState('');

  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [products, setProducts] = useState<StorefrontProduct[]>([]);
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [productModalLoading, setProductModalLoading] = useState(false);
  const [selectedProductIds, setSelectedProductIds] = useState<number[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [paymentTermsOptions, setPaymentTermsOptions] = useState<string[]>([]);
  const [shippingCarriersOptions, setShippingCarriersOptions] = useState<string[]>([]);

  useEffect(() => {
    if (!token || !currentStore) return;

    const load = async () => {
      try {
        const [terms, carriers] = await Promise.all([
          getPaymentTerms({ token, storeId: currentStore.id }),
          getShippingCarriers({ token, storeId: currentStore.id }),
        ]);
        setPaymentTermsOptions(terms);
        setShippingCarriersOptions(carriers);
      } catch {
        // fall back to built-in defaults below
      }
    };

    void load();
  }, [token, currentStore]);

  const subtotal = useMemo(
    () =>
      lineItems.reduce((sum, l) => {
        const qty = Number(l.quantity) || 0;
        const price = Number(l.price) || 0;
        return sum + qty * price;
      }, 0),
    [lineItems],
  );

  const handleBrowseProducts = async () => {
    setProductModalOpen(true);
    if (products.length > 0) return;
    setProductModalLoading(true);
    try {
      const res = await getStorefrontProducts({ per_page: 50 });
      setProducts(res.data ?? []);
    } catch {
      // ignore – UI still works, just without suggestions
    } finally {
      setProductModalLoading(false);
    }
  };

  const toggleProductSelected = (id: number) => {
    setSelectedProductIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const handleAddSelectedProducts = () => {
    if (selectedProductIds.length === 0) return;
    const selected = products.filter((p) => selectedProductIds.includes(p.id));
    if (selected.length === 0) return;
    setLineItems((prev) => [
      ...prev,
      ...selected.map((p) => ({
        title: p.title,
        quantity: 1,
        price: String(p.price ?? '0'),
      })),
    ]);
    setSelectedProductIds([]);
    setProductModalOpen(false);
  };

  const updateLine = (i: number, field: keyof LineItem, value: string | number) => {
    setLineItems((prev) => {
      const next = [...prev];
      next[i] = { ...next[i], [field]: value };
      return next;
    });
  };

  const removeLine = (i: number) => {
    setLineItems((prev) => prev.filter((_, idx) => idx !== i));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !currentStore) return;

    const items = lineItems.filter((l) => l.title.trim());
    if (!supplier.trim()) {
      setError('Select a supplier.');
      return;
    }
    if (items.length === 0) {
      setError('Add at least one product.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const body = {
        email: null,
        line_items: items.map((l) => ({
          title: l.title,
          quantity: Number(l.quantity) || 1,
          price: Number(l.price) || 0,
        })),
        note: noteToSupplier || undefined,
        financial_status: 'pending',
        tags: tags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
        market: destination,
        currency,
        metadata: {
          supplier,
          destination,
          payment_terms: paymentTerms,
          estimated_arrival: estimatedArrival || null,
          shipping_carrier: shippingCarrier || null,
          tracking_number: trackingNumber || null,
          reference_number: referenceNumber || null,
        },
      };

      const order = await apiRequest<Order>('/store/orders', {
        method: 'POST',
        token,
        storeId: currentStore.id,
        body,
      });
      router.push(`/admin/orders/${order.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create purchase order');
    } finally {
      setLoading(false);
    }
  };

  if (!currentStore) {
    return (
      <div className="p-6">
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-center">
          <p className="font-medium text-amber-800">Select a store</p>
          <Link href="/admin/purchase-orders" className="mt-2 inline-block text-sm text-mint">
            ← Purchase orders
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-gray-50/60 p-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Link href="/admin/purchase-orders" className="hover:text-mint">
              Purchase orders
            </Link>
            <span>/</span>
            <span>Create</span>
          </div>
          <h1 className="mt-2 text-2xl font-semibold text-gray-900">Create purchase order</h1>
          <p className="text-sm text-gray-500">
            Create a purchase order to track inventory you order from suppliers.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            disabled={loading}
            onClick={handleSubmit}
            className="inline-flex items-center gap-2 rounded-lg bg-mint px-5 py-2.5 text-sm font-medium text-white hover:bg-mint-dark disabled:opacity-50"
          >
            {loading && (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/70 border-t-transparent" />
            )}
            <span>{loading ? 'Saving…' : 'Save purchase order'}</span>
          </button>
          <Link
            href="/admin/purchase-orders"
            className="rounded-lg border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </Link>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid gap-4 lg:grid-cols-3">
        {/* Left column */}
        <div className="space-y-4 lg:col-span-2">
          {/* Supplier / destination */}
          <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="grid gap-4 border-b border-gray-100 px-4 py-4 sm:grid-cols-2">
              <div>
                <p className="mb-1 text-xs font-medium text-gray-600">Supplier</p>
                <select
                  value={supplier}
                  onChange={(e) => setSupplier(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-mint focus:ring-2 focus:ring-mint/20"
                >
                  <option value="">Select supplier</option>
                  <option value="Default supplier">Default supplier</option>
                </select>
              </div>
              <div>
                <p className="mb-1 text-xs font-medium text-gray-600">Destination</p>
                <select
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-mint focus:ring-2 focus:ring-mint/20"
                >
                  <option value="Shop location">Shop location</option>
                </select>
              </div>
            </div>

            <div className="grid gap-4 px-4 py-4 sm:grid-cols-2">
              <div>
                <p className="mb-1 text-xs font-medium text-gray-600">Payment terms (optional)</p>
                <select
                  value={paymentTerms}
                  onChange={(e) => setPaymentTerms(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-mint focus:ring-2 focus:ring-mint/20"
                >
                  {(paymentTermsOptions.length > 0
                    ? paymentTermsOptions
                    : [
                        'None',
                        'Cash on delivery',
                        'Payment on receipt',
                        'Payment in advance',
                        'Net 7',
                        'Net 15',
                        'Net 30',
                        'Net 45',
                        'Net 60',
                      ]
                  ).map((term) => (
                    <option key={term} value={term}>
                      {term}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <p className="mb-1 text-xs font-medium text-gray-600">Supplier currency</p>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-mint focus:ring-2 focus:ring-mint/20"
                >
                  <option value="LKR Rs">Sri Lankan Rupee (LKR Rs)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Shipment details */}
          <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-100 px-4 py-3">
              <h2 className="text-sm font-semibold text-gray-900">Shipment details</h2>
            </div>
            <div className="grid gap-4 px-4 py-4 sm:grid-cols-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">
                  Estimated arrival
                </label>
                <input
                  type="date"
                  value={estimatedArrival}
                  onChange={(e) => setEstimatedArrival(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-mint focus:ring-2 focus:ring-mint/20"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">
                  Shipping carrier
                </label>
                <select
                  value={shippingCarrier}
                  onChange={(e) => setShippingCarrier(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-mint focus:ring-2 focus:ring-mint/20"
                >
                  <option value="">All Carriers</option>
                  {(shippingCarriersOptions.length > 0
                    ? shippingCarriersOptions
                    : [
                        '4PX',
                        '99 Minutos',
                        'Aeronet',
                        'AGS',
                        'Amazon',
                        'Amazon Logistics UK',
                        'Amm Spedition',
                        'An Post',
                      ]
                  ).map((carrier) => (
                    <option key={carrier} value={carrier}>
                      {carrier}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">
                  Tracking number
                </label>
                <input
                  type="text"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-mint focus:ring-2 focus:ring-mint/20"
                />
              </div>
            </div>
          </div>

          {/* Add products */}
          <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
              <h2 className="text-sm font-semibold text-gray-900">Add products</h2>
              <button
                type="button"
                onClick={handleBrowseProducts}
                className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
              >
                Browse
              </button>
            </div>
            <div className="border-b border-gray-100 px-4 py-3">
              <input
                type="text"
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                placeholder="Search products"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-mint focus:ring-2 focus:ring-mint/20"
              />
            </div>
            <div className="divide-y divide-gray-100">
              {lineItems.length === 0 ? (
                <div className="px-4 py-8 text-center text-sm text-gray-500">
                  Search or browse to add products to this purchase order.
                </div>
              ) : (
                lineItems.map((line, i) => (
                  <div
                    key={i}
                    className="flex flex-wrap items-center gap-2 px-4 py-3 text-sm"
                  >
                    <input
                      type="text"
                      value={line.title}
                      onChange={(e) => updateLine(i, 'title', e.target.value)}
                      className="min-w-[140px] flex-1 rounded border border-gray-200 px-3 py-2"
                    />
                    <input
                      type="number"
                      min={1}
                      value={line.quantity}
                      onChange={(e) => updateLine(i, 'quantity', e.target.value)}
                      className="w-20 rounded border border-gray-200 px-3 py-2 text-right"
                    />
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={line.price}
                      onChange={(e) => updateLine(i, 'price', e.target.value)}
                      placeholder="Price"
                      className="w-24 rounded border border-gray-200 px-3 py-2 text-right"
                    />
                    <button
                      type="button"
                      onClick={() => removeLine(i)}
                      className="rounded p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-600"
                    >
                      <span className="sr-only">Remove</span>×
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Additional details */}
          <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-100 px-4 py-3">
              <h2 className="text-sm font-semibold text-gray-900">Additional details</h2>
            </div>
            <div className="space-y-4 px-4 py-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">
                  Reference number
                </label>
                <input
                  type="text"
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-mint focus:ring-2 focus:ring-mint/20"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">
                  Note to supplier
                </label>
                <textarea
                  value={noteToSupplier}
                  onChange={(e) => setNoteToSupplier(e.target.value)}
                  rows={3}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-mint focus:ring-2 focus:ring-mint/20"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Tags</label>
                <input
                  type="text"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="Separate tags with commas"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-mint focus:ring-2 focus:ring-mint/20"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right column: cost summary */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-100 px-4 py-3">
              <h2 className="text-sm font-semibold text-gray-900">Cost summary</h2>
            </div>
            <div className="space-y-3 px-4 py-4 text-sm">
              <div className="flex items-center justify-between text-gray-600">
                <span>Taxes (Included)</span>
                <span>
                  {currency} 0.00
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Subtotal</span>
                <span className="text-gray-800">
                  {currency} {subtotal.toFixed(2)}
                </span>
              </div>
              <div className="flex items-center justify-between text-gray-600">
                <span>Cost adjustments</span>
                <span className="text-xs text-gray-400">Shipping not included</span>
              </div>
              <div className="mt-2 border-t border-gray-200 pt-3 flex items-center justify-between">
                <span className="text-gray-800 text-sm font-medium">Total</span>
                <span className="text-gray-900 text-base font-semibold">
                  {currency} {subtotal.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </form>

      <ProductSelectModal
        open={productModalOpen}
        loading={productModalLoading}
        products={products}
        currencyLabel={currency}
        search={productSearch}
        onSearchChange={setProductSearch}
        selectedProductIds={selectedProductIds}
        onToggleProductSelected={toggleProductSelected}
        onClose={() => {
          setProductModalOpen(false);
          setSelectedProductIds([]);
        }}
        onAddSelected={handleAddSelectedProducts}
      />
    </div>
  );
}

