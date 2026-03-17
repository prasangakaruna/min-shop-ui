'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useStore } from '@/context/StoreContext';
import { apiRequest, type Product, type ProductsResponse } from '@/lib/api';

export default function NewCollectionPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const { currentStore } = useStore();
  const token = (session as { access_token?: string } | null)?.access_token ?? null;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'manual' | 'smart'>('manual');
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  const [productResults, setProductResults] = useState<Product[]>([]);
  const [productLoading, setProductLoading] = useState(false);
  const [productError, setProductError] = useState<string | null>(null);

  const openProductModal = () => {
    setProductModalOpen(true);
    if (!productResults.length) {
      void fetchProducts('');
    }
  };

  const fetchProducts = async (search: string) => {
    if (!token || !currentStore) return;
    setProductLoading(true);
    setProductError(null);
    try {
      const res = await apiRequest<ProductsResponse>('/store/products', {
        token,
        storeId: currentStore.id,
        query: { per_page: 20, search },
      });
      setProductResults((res.data ?? []) as Product[]);
    } catch (e) {
      setProductError(e instanceof Error ? e.message : 'Failed to load products');
      setProductResults([]);
    } finally {
      setProductLoading(false);
    }
  };

  useEffect(() => {
    if (!productModalOpen) return;
    const id = setTimeout(() => {
      void fetchProducts(productSearch.trim());
    }, 300);
    return () => clearTimeout(id);
  }, [productSearch, productModalOpen]);

  return (
    <div className="min-h-full bg-gray-50/60">
      <div className="border-b border-gray-200 bg-white px-6 py-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs text-gray-500">Collections</p>
            <h1 className="mt-1 text-xl font-semibold text-gray-900">Add collection</h1>
          </div>
          <button
            type="button"
            onClick={() => router.back()}
            className="inline-flex items-center rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </div>

      <div className="p-6 max-w-6xl space-y-6 lg:grid lg:grid-cols-[minmax(0,2fr)_minmax(260px,1fr)] lg:space-y-0 lg:gap-6">
        <div className="space-y-6">
          {/* Title & description */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Summer collection, Under $100, Staff picks"
                className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:border-mint focus:ring-2 focus:ring-mint/20"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={5}
                className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:border-mint focus:ring-2 focus:ring-mint/20 resize-y"
              />
            </div>
          </div>

          {/* Collection type */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm space-y-4">
            <h2 className="text-sm font-semibold text-gray-900">Collection type</h2>
            <div className="space-y-3">
              <label className="flex items-start gap-3">
                <input
                  type="radio"
                  name="collection_type"
                  value="manual"
                  checked={type === 'manual'}
                  onChange={() => setType('manual')}
                  className="mt-1 h-4 w-4 border-gray-300 text-mint focus:ring-mint/40"
                />
                <div>
                  <p className="text-sm font-medium text-gray-900">Manual</p>
                  <p className="text-xs text-gray-500">
                    Add products to this collection one by one.
                  </p>
                </div>
              </label>
              <label className="flex items-start gap-3 opacity-60">
                <input
                  type="radio"
                  name="collection_type"
                  value="smart"
                  disabled
                  className="mt-1 h-4 w-4 border-gray-300 text-mint focus:ring-mint/40"
                />
                <div>
                  <p className="text-sm font-medium text-gray-900">Smart</p>
                  <p className="text-xs text-gray-500">
                    Existing and future products that match conditions will be added automatically.
                    (Coming soon.)
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Products */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-sm font-semibold text-gray-900">Products</h2>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <button
                  type="button"
                  onClick={openProductModal}
                  className="flex items-center rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-500 w-full sm:w-64 text-left"
                >
                  <span className="mr-2 text-gray-400">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M10.5 18a7.5 7.5 0 100-15 7.5 7.5 0 000 15z" />
                    </svg>
                  </span>
                  <span className="truncate">Search products</span>
                </button>
                <button
                  type="button"
                  onClick={openProductModal}
                  className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Browse
                </button>
                <select className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:border-mint focus:ring-2 focus:ring-mint/20">
                  <option>Sort: Best selling</option>
                </select>
              </div>
            </div>
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-200 bg-gray-50 py-10 text-center">
              {selectedProducts.length === 0 ? (
                <>
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-white text-gray-400">
                    <span className="text-lg">🏷️</span>
                  </div>
                  <p className="text-sm text-gray-600">There are no products in this collection.</p>
                  <p className="mt-1 text-xs text-gray-500">Search or browse to add products.</p>
                </>
              ) : (
                <div className="w-full max-w-md text-left">
                  <p className="mb-3 text-sm font-medium text-gray-800">
                    {selectedProducts.length} product{selectedProducts.length === 1 ? '' : 's'} in this collection:
                  </p>
                  <ul className="space-y-1 text-sm text-gray-700">
                    {selectedProducts.map((p) => (
                      <li key={p.id} className="flex items-center justify-between rounded-md bg-white px-3 py-1.5">
                        <span className="truncate">{p.title}</span>
                        <button
                          type="button"
                          onClick={() =>
                            setSelectedProducts((prev) => prev.filter((item) => item.id !== p.id))
                          }
                          className="text-xs font-medium text-red-600 hover:text-red-700"
                        >
                          Remove
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-gray-900">Publishing</h2>
                <p className="text-xs text-gray-500">Choose where this collection appears.</p>
              </div>
              <button
                type="button"
                className="text-xs font-medium text-mint hover:underline"
              >
                Manage
              </button>
            </div>
            <div className="space-y-2">
              <label className="flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2 text-xs text-gray-700">
                <span>Online store</span>
                <input type="checkbox" defaultChecked className="h-4 w-4 rounded border-gray-300 text-mint focus:ring-mint/40" />
              </label>
              <label className="flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2 text-xs text-gray-700">
                <span>Point of sale</span>
                <input type="checkbox" className="h-4 w-4 rounded border-gray-300 text-mint focus:ring-mint/40" />
              </label>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm space-y-3">
            <h2 className="text-sm font-semibold text-gray-900">Image</h2>
            <div className="flex h-32 items-center justify-center rounded-lg border-2 border-dashed border-gray-200 bg-gray-50 text-xs text-gray-500">
              <button
                type="button"
                className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
              >
                Add image
              </button>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm space-y-3">
            <h2 className="text-sm font-semibold text-gray-900">Theme template</h2>
            <select className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-mint focus:ring-2 focus:ring-mint/20">
              <option value="default">Default collection</option>
            </select>
          </div>
        </div>
      </div>
      {productModalOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-3xl rounded-xl bg-white shadow-lg">
            <div className="flex items-center justify-between border-b border-gray-200 px-5 py-3">
              <h2 className="text-sm font-semibold text-gray-900">Add products</h2>
              <button
                type="button"
                onClick={() => setProductModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
            <div className="px-5 py-4 border-b border-gray-100 flex flex-col gap-2 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  placeholder="Search products"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      void fetchProducts(productSearch.trim());
                    }
                  }}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm pl-9 focus:border-mint focus:ring-2 focus:ring-mint/20"
                />
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M10.5 18a7.5 7.5 0 100-15 7.5 7.5 0 000 15z" />
                  </svg>
                </span>
              </div>
              <select className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:border-mint focus:ring-2 focus:ring-mint/20">
                <option>Search by All</option>
              </select>
            </div>
            <div className="px-5 py-1">
              <button
                type="button"
                className="inline-flex items-center rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
              >
                Add filter +
              </button>
            </div>
            <div className="px-5 py-4 max-h-72 overflow-auto">
              {productLoading ? (
                <div className="flex items-center justify-center gap-2 py-8 text-sm text-gray-500">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-mint border-t-transparent" />
                  Searching products…
                </div>
              ) : productError ? (
                <div className="py-8 text-center text-sm text-red-600">{productError}</div>
              ) : productResults.length === 0 ? (
                <div className="py-12 text-center text-sm text-gray-500">
                  <div className="mb-3 flex items-center justify-center text-gray-400">
                    <svg className="h-9 w-9" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-5.2-5.2M16 10.5A5.5 5.5 0 1110.5 5 5.5 5.5 0 0116 10.5z" />
                    </svg>
                  </div>
                  <p className="font-medium text-gray-700">No products found</p>
                  <p className="mt-1 text-xs text-gray-500">
                    Try changing the filters or search term.
                  </p>
                </div>
              ) : (
                <ul className="divide-y divide-gray-100 text-sm">
                  {productResults.map((p) => {
                    const alreadySelected = selectedProducts.some((sp) => sp.id === p.id);
                    return (
                      <li key={p.id} className="flex items-center justify-between py-2">
                        <div className="min-w-0 flex-1 pr-4">
                          <p className="truncate font-medium text-gray-900">{p.title}</p>
                        </div>
                        <button
                          type="button"
                          disabled={alreadySelected}
                          onClick={() =>
                            setSelectedProducts((prev) =>
                              alreadySelected ? prev : [...prev, p],
                            )
                          }
                          className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                        >
                          {alreadySelected ? 'Added' : 'Add'}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
            <div className="flex items-center justify-between border-t border-gray-200 bg-gray-50 px-5 py-3">
              <button
                type="button"
                onClick={() => setProductModalOpen(false)}
                className="rounded-lg px-4 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => setProductModalOpen(false)}
                disabled={selectedProducts.length === 0}
                className="rounded-lg bg-mint px-4 py-1.5 text-sm font-medium text-white disabled:opacity-40"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

