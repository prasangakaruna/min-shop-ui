 'use client';

 import React, { useMemo, useState } from 'react';
 import Link from 'next/link';
 import { useRouter } from 'next/navigation';
 import { useSession } from 'next-auth/react';
 import { useStore } from '@/context/StoreContext';
 import { apiRequest, type Order, type StorefrontProduct, type CustomersResponse, type Customer, getStorefrontProducts } from '@/lib/api';
 import { ProductSelectModal } from '@/components/admin/ProductSelectModal';

interface LineItem { title: string; quantity: number; price: string }

export default function NewOrderPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const { currentStore } = useStore();
  const token = (session as { access_token?: string } | null)?.access_token ?? null;

  const [email, setEmail] = useState('');
  const [lineItems, setLineItems] = useState<LineItem[]>([{ title: '', quantity: 1, price: '' }]);
  const [note, setNote] = useState('');
  const [financialStatus, setFinancialStatus] = useState('pending');
  const [marketCountry, setMarketCountry] = useState('Sri Lanka');
  const [currency, setCurrency] = useState('LKR Rs');
  const [customerSearch, setCustomerSearch] = useState('');
  const [tags, setTags] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [products, setProducts] = useState<StorefrontProduct[]>([]);
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [productModalLoading, setProductModalLoading] = useState(false);
  const [selectedProductIds, setSelectedProductIds] = useState<number[]>([]);
  const [customItemModalOpen, setCustomItemModalOpen] = useState(false);
  const [customItemName, setCustomItemName] = useState('');
  const [customItemPrice, setCustomItemPrice] = useState('0');
  const [customItemQuantity, setCustomItemQuantity] = useState('1');
  const [customItemTaxable, setCustomItemTaxable] = useState(true);
  const [customItemPhysical, setCustomItemPhysical] = useState(true);
  const [customItemWeight, setCustomItemWeight] = useState('0');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customersLoading, setCustomersLoading] = useState(false);
  const [customerDropdownOpen, setCustomerDropdownOpen] = useState(false);
  const [createCustomerModalOpen, setCreateCustomerModalOpen] = useState(false);
  const [creatingCustomer, setCreatingCustomer] = useState(false);
  const [customerFirstName, setCustomerFirstName] = useState('');
  const [customerLastName, setCustomerLastName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerAcceptsMarketing, setCustomerAcceptsMarketing] = useState(false);
  const [customerTaxExempt, setCustomerTaxExempt] = useState(false);
  const [customerCountry, setCustomerCountry] = useState('Sri Lanka');
  const [customerCompany, setCustomerCompany] = useState('');
  const [customerAddress1, setCustomerAddress1] = useState('');
  const [customerAddress2, setCustomerAddress2] = useState('');
  const [customerCity, setCustomerCity] = useState('');
  const [customerPostalCode, setCustomerPostalCode] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const addLine = () => setLineItems((prev) => [...prev, { title: '', quantity: 1, price: '' }]);
  const updateLine = (i: number, field: keyof LineItem, value: string | number) => {
    setLineItems((prev) => {
      const next = [...prev];
      next[i] = { ...next[i], [field]: value };
      return next;
    });
  };
  const removeLine = (i: number) => setLineItems((prev) => prev.filter((_, idx) => idx !== i));

  const subtotal = useMemo(
    () =>
      lineItems.reduce((sum, l) => {
        const qty = Number(l.quantity) || 0;
        const price = Number(l.price) || 0;
        return sum + qty * price;
      }, 0),
    [lineItems],
  );

  const searchCustomers = async (term: string) => {
    if (!token || !currentStore || !term.trim()) {
      setCustomers([]);
      return;
    }
    setCustomersLoading(true);
    try {
      const res = await apiRequest<CustomersResponse>('/store/customers', {
        token,
        storeId: currentStore.id,
        query: { search: term, per_page: 5 },
      });
      setCustomers(res.data ?? []);
    } catch {
      setCustomers([]);
    } finally {
      setCustomersLoading(false);
    }
  };

  const handleCreateCustomer = async () => {
    if (!token || !currentStore || !customerEmail.trim()) return;
    setCreatingCustomer(true);
    try {
      const payload: Record<string, unknown> = {
        email: customerEmail,
        first_name: customerFirstName || null,
        last_name: customerLastName || null,
        phone: customerPhone || null,
        accepts_marketing: customerAcceptsMarketing,
        language: 'English [Default]',
        is_tax_exempt: customerTaxExempt,
        company: customerCompany || null,
        address1: customerAddress1 || null,
        address2: customerAddress2 || null,
        city: customerCity || null,
        zip: customerPostalCode || null,
        country: customerCountry || null,
      };
      await apiRequest<Customer>('/store/customers', {
        method: 'POST',
        token,
        storeId: currentStore.id,
        body: payload,
      });
      setEmail(customerEmail);
      setCustomerSearch(customerEmail);
      setCreateCustomerModalOpen(false);
      setCustomers([]);
    } catch (err) {
      console.error(err);
    } finally {
      setCreatingCustomer(false);
    }
  };

  const handleBrowseProducts = async () => {
    setProductModalOpen(true);
    if (products.length > 0) return;
    setProductModalLoading(true);
    try {
      const res = await getStorefrontProducts({ per_page: 50 });
      setProducts(res.data ?? []);
    } catch {
      // silent – helper only; order creation still works without it
    } finally {
      setProductModalLoading(false);
    }
  };

  const handleSelectProductDirect = (p: StorefrontProduct) => {
    setLineItems((prev) => [
      ...prev,
      {
        title: p.title,
        quantity: 1,
        price: String(p.price ?? '0'),
      },
    ]);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !currentStore) return;
    const items = lineItems.filter((l) => l.title.trim());
    if (items.length === 0) {
      setError('Add at least one line item with a title.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const order = await apiRequest<Order>('/store/orders', {
        method: 'POST',
        token,
        storeId: currentStore.id,
        body: {
          email: email || null,
          line_items: items.map((l) => ({
            title: l.title,
            quantity: Number(l.quantity) || 1,
            price: Number(l.price) || 0,
          })),
          note: note || undefined,
          financial_status: financialStatus,
        },
      });
      router.push(`/admin/orders/${order.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create order');
    } finally {
      setLoading(false);
    }
  };

  if (!currentStore) {
    return (
      <div className="p-6">
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-center">
          <p className="font-medium text-amber-800">Select a store</p>
          <Link href="/admin/orders" className="mt-2 inline-block text-sm text-mint">← Orders</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-gray-50/60 p-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Link href="/admin/orders" className="hover:text-mint">
              Orders
            </Link>
            <span>/</span>
            <span>Create</span>
          </div>
          <h1 className="mt-2 text-2xl font-semibold text-gray-900">Create order</h1>
          <p className="text-sm text-gray-500">
            Draft a manual order for <span className="font-medium text-gray-700">{currentStore.name}</span>.
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
            <span>{loading ? 'Saving…' : 'Save order'}</span>
          </button>
          <Link
            href="/admin/orders"
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
        {/* Left column: products + payment */}
        <div className="space-y-4 lg:col-span-2">
          {/* Products card */}
          <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
              <div>
                <h2 className="text-sm font-semibold text-gray-900">Products</h2>
                <p className="text-xs text-gray-500">Search products or add custom items to this order.</p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleBrowseProducts}
                  className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                >
                  Browse
                </button>
                <button
                  type="button"
                  onClick={() => setCustomItemModalOpen(true)}
                  className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                >
                  Add custom item
                </button>
              </div>
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
                  Add products or custom items to this order.
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
                      placeholder="Product or title"
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

            {/* Inline helper removed; selection happens via modal triggered by Browse */}
          </div>

          {/* Payment card */}
          <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-100 px-4 py-3">
              <h2 className="text-sm font-semibold text-gray-900">Payment</h2>
            </div>
            <div className="space-y-3 px-4 py-4 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Subtotal</span>
                <span className="text-gray-800">
                  {currency} {subtotal.toFixed(2)}
                </span>
              </div>
              <div className="flex items-center justify-between text-gray-400">
                <span className="line-through">Add discount</span>
                <span>—</span>
              </div>
              <div className="flex items-center justify-between text-gray-400">
                <span className="line-through">Add shipping or delivery</span>
                <span>—</span>
              </div>
              <div className="flex items-center justify-between text-gray-400">
                <span>Estimated tax</span>
                <span className="text-xs">Not calculated</span>
              </div>
              <div className="mt-2 border-t border-gray-200 pt-3 flex items-center justify-between">
                <span className="text-gray-800 text-sm font-medium">Total</span>
                <span className="text-gray-900 text-base font-semibold">
                  {currency} {subtotal.toFixed(2)}
                </span>
              </div>
            </div>
            <div className="border-t border-gray-100 bg-gray-50 px-4 py-3 text-xs text-gray-500">
              Add a product to calculate total and view payment options.
            </div>
          </div>
        </div>

        {/* Right column: notes, customer, markets, tags */}
          <div className="space-y-4">
          {/* Notes */}
          <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-100 px-4 py-3">
              <h2 className="text-sm font-semibold text-gray-900">Notes</h2>
            </div>
            <div className="px-4 py-3">
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                placeholder="Add a note"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-mint focus:ring-2 focus:ring-mint/20"
              />
            </div>
          </div>

          {/* Customer */}
          <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-100 px-4 py-3">
              <h2 className="text-sm font-semibold text-gray-900">Customer</h2>
            </div>
            <div className="space-y-3 px-4 py-3">
              <div className="relative">
                <input
                  type="text"
                  value={customerSearch}
                  onChange={(e) => {
                    const val = e.target.value;
                    setCustomerSearch(val);
                    setCustomerDropdownOpen(true);
                    if (val.trim().length >= 2) {
                      void searchCustomers(val);
                    } else {
                      setCustomers([]);
                    }
                  }}
                  onFocus={() => {
                    setCustomerDropdownOpen(true);
                    if (customerSearch.trim().length >= 2) {
                      void searchCustomers(customerSearch);
                    }
                  }}
                  placeholder="Search or create a customer"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-mint focus:ring-2 focus:ring-mint/20"
                />
                {customerDropdownOpen && (
                  <div className="absolute z-20 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg">
                    <button
                      type="button"
                      onClick={() => {
                        setCustomerDropdownOpen(false);
                        setCreateCustomerModalOpen(true);
                      }}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-mint hover:bg-gray-50"
                    >
                      <span className="text-lg leading-none">＋</span>
                      <span>Create a new customer</span>
                    </button>
                    <div className="border-t border-gray-100 max-h-48 overflow-auto text-sm">
                      {customersLoading ? (
                        <div className="flex items-center gap-2 px-3 py-3 text-xs text-gray-500">
                          <span className="h-3 w-3 animate-spin rounded-full border-2 border-gray-300 border-t-transparent" />
                          <span>Searching customers...</span>
                        </div>
                      ) : customers.length === 0 ? (
                        <div className="px-3 py-3 text-gray-500 text-xs">
                          No customer found
                        </div>
                      ) : (
                        customers.map((c) => (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => {
                              setEmail(c.email);
                              setCustomerSearch(c.email);
                              setCustomerDropdownOpen(false);
                            }}
                            className="flex w-full flex-col items-start px-3 py-2 text-left hover:bg-gray-50"
                          >
                            <span className="text-xs font-medium text-gray-800">
                              {c.first_name || c.last_name
                                ? `${c.first_name ?? ''} ${c.last_name ?? ''}`.trim()
                                : c.email}
                            </span>
                            <span className="text-xs text-gray-500">{c.email}</span>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Customer email (optional)"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-mint focus:ring-2 focus:ring-mint/20"
              />
            </div>
          </div>

          {/* Markets */}
          <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-100 px-4 py-3">
              <h2 className="text-sm font-semibold text-gray-900">Markets</h2>
            </div>
            <div className="space-y-3 px-4 py-3 text-sm">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Market</label>
                <select
                  value={marketCountry}
                  onChange={(e) => setMarketCountry(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-mint focus:ring-2 focus:ring-mint/20"
                >
                  <option value="Sri Lanka">Sri Lanka</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Currency</label>
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

          {/* Tags */}
          <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-100 px-4 py-3">
              <h2 className="text-sm font-semibold text-gray-900">Tags</h2>
            </div>
            <div className="px-4 py-3">
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="Add tags"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-mint focus:ring-2 focus:ring-mint/20"
              />
            </div>
          </div>

          {/* Payment status */}
          <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-100 px-4 py-3">
              <h2 className="text-sm font-semibold text-gray-900">Payment status</h2>
            </div>
            <div className="px-4 py-3">
              <select
                value={financialStatus}
                onChange={(e) => setFinancialStatus(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-mint focus:ring-2 focus:ring-mint/20"
              >
                <option value="pending">Pending</option>
                <option value="paid">Paid</option>
                <option value="refunded">Refunded</option>
                <option value="cancelled">Cancelled</option>
              </select>
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

      {customItemModalOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-xl rounded-xl bg-white shadow-lg">
            <div className="flex items-center justify-between border-b border-gray-200 px-5 py-3">
              <h2 className="text-sm font-medium text-gray-900">Add custom item</h2>
              <button
                type="button"
                onClick={() => setCustomItemModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
            <div className="space-y-4 px-5 py-6 text-sm">
              <div className="grid gap-4 sm:grid-cols-[2fr,1fr,1fr]">
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600">Item name</label>
                  <input
                    type="text"
                    value={customItemName}
                    onChange={(e) => setCustomItemName(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 focus:border-mint focus:ring-2 focus:ring-mint/20"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600">Price</label>
                  <div className="flex items-center gap-1 rounded-lg border border-gray-200 px-2 py-1.5">
                    <span className="text-xs text-gray-500">{currency}</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={customItemPrice}
                      onChange={(e) => setCustomItemPrice(e.target.value)}
                      className="w-full border-none bg-transparent text-sm outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600">Quantity</label>
                  <input
                    type="number"
                    min="1"
                    value={customItemQuantity}
                    onChange={(e) => setCustomItemQuantity(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 focus:border-mint focus:ring-2 focus:ring-mint/20"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-xs text-gray-700">
                  <input
                    type="checkbox"
                    checked={customItemTaxable}
                    onChange={(e) => setCustomItemTaxable(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-mint focus:ring-mint/40"
                  />
                  <span>Item is taxable</span>
                </label>
                <label className="flex items-center gap-2 text-xs text-gray-700">
                  <input
                    type="checkbox"
                    checked={customItemPhysical}
                    onChange={(e) => setCustomItemPhysical(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-mint focus:ring-mint/40"
                  />
                  <span>Item is a physical product</span>
                </label>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">
                  Item weight (optional)
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="0"
                    value={customItemWeight}
                    onChange={(e) => setCustomItemWeight(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-mint focus:ring-2 focus:ring-mint/20"
                  />
                  <select className="w-24 rounded-lg border border-gray-200 px-2 py-2 text-xs text-gray-700">
                    <option value="kg">kg</option>
                  </select>
                </div>
                <p className="mt-1 text-xs text-gray-400">
                  Used to calculate shipping rates accurately
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between border-t border-gray-200 bg-gray-50 px-5 py-3">
              <button
                type="button"
                onClick={() => setCustomItemModalOpen(false)}
                className="rounded-lg px-4 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!customItemName.trim()}
                onClick={() => {
                  if (!customItemName.trim()) return;
                  setLineItems((prev) => [
                    ...prev,
                    {
                      title: customItemName,
                      quantity: Number(customItemQuantity) || 1,
                      price: customItemPrice || '0',
                    },
                  ]);
                  setCustomItemName('');
                  setCustomItemPrice('0');
                  setCustomItemQuantity('1');
                  setCustomItemWeight('0');
                  setCustomItemTaxable(true);
                  setCustomItemPhysical(true);
                  setCustomItemModalOpen(false);
                }}
                className="rounded-lg bg-mint px-4 py-1.5 text-sm font-medium text-white disabled:opacity-40"
              >
                Add item
              </button>
            </div>
          </div>
        </div>
      )}

      {createCustomerModalOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-xl rounded-xl bg-white shadow-lg">
            <div className="flex items-center justify-between border-b border-gray-200 px-5 py-3">
              <h2 className="text-sm font-medium text-gray-900">Create a new customer</h2>
              <button
                type="button"
                onClick={() => setCreateCustomerModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
            <div className="max-h-[70vh] space-y-4 overflow-auto px-5 py-6 text-sm">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600">First name</label>
                  <input
                    type="text"
                    value={customerFirstName}
                    onChange={(e) => setCustomerFirstName(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 focus:border-mint focus:ring-2 focus:ring-mint/20"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600">Last name</label>
                  <input
                    type="text"
                    value={customerLastName}
                    onChange={(e) => setCustomerLastName(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 focus:border-mint focus:ring-2 focus:ring-mint/20"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Language</label>
                <input
                  type="text"
                  value="English [Default]"
                  readOnly
                  className="w-full cursor-default rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-600"
                />
                <p className="mt-1 text-xs text-gray-400">
                  This customer will receive notifications in this language.
                </p>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Email</label>
                <input
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 focus:border-mint focus:ring-2 focus:ring-mint/20"
                />
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-xs text-gray-700">
                  <input
                    type="checkbox"
                    checked={customerAcceptsMarketing}
                    onChange={(e) => setCustomerAcceptsMarketing(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-mint focus:ring-mint/40"
                  />
                  <span>Customer accepts email marketing</span>
                </label>
                <label className="flex items-center gap-2 text-xs text-gray-700">
                  <input
                    type="checkbox"
                    checked={customerTaxExempt}
                    onChange={(e) => setCustomerTaxExempt(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-mint focus:ring-mint/40"
                  />
                  <span>Customer is tax exempt</span>
                </label>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Country/region</label>
                <select
                  value={customerCountry}
                  onChange={(e) => setCustomerCountry(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-mint focus:ring-2 focus:ring-mint/20"
                >
                  <option value="Sri Lanka">Sri Lanka</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Company</label>
                <input
                  type="text"
                  value={customerCompany}
                  onChange={(e) => setCustomerCompany(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 focus:border-mint focus:ring-2 focus:ring-mint/20"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Address</label>
                <input
                  type="text"
                  value={customerAddress1}
                  onChange={(e) => setCustomerAddress1(e.target.value)}
                  placeholder="Address"
                  className="mb-2 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-mint focus:ring-2 focus:ring-mint/20"
                />
                <input
                  type="text"
                  value={customerAddress2}
                  onChange={(e) => setCustomerAddress2(e.target.value)}
                  placeholder="Apartment, suite, etc"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-mint focus:ring-2 focus:ring-mint/20"
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600">City</label>
                  <input
                    type="text"
                    value={customerCity}
                    onChange={(e) => setCustomerCity(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 focus:border-mint focus:ring-2 focus:ring-mint/20"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600">Postal code</label>
                  <input
                    type="text"
                    value={customerPostalCode}
                    onChange={(e) => setCustomerPostalCode(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 focus:border-mint focus:ring-2 focus:ring-mint/20"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Phone</label>
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 focus:border-mint focus:ring-2 focus:ring-mint/20"
                />
              </div>
            </div>
            <div className="flex items-center justify-between border-t border-gray-200 bg-gray-50 px-5 py-3">
              <button
                type="button"
                onClick={() => setCreateCustomerModalOpen(false)}
                className="rounded-lg px-4 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!customerEmail.trim() || creatingCustomer}
                onClick={handleCreateCustomer}
                className="inline-flex items-center gap-2 rounded-lg bg-mint px-4 py-1.5 text-sm font-medium text-white disabled:opacity-40"
              >
                {creatingCustomer && (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/70 border-t-transparent" />
                )}
                <span>{creatingCustomer ? 'Saving…' : 'Save'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
