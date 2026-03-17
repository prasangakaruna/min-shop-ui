'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useStore } from '@/context/StoreContext';
import { apiRequest } from '@/lib/api';

export default function NewGiftCardProductPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const { currentStore } = useStore();
  const token = (session as { access_token?: string } | null)?.access_token ?? null;

  const [title, setTitle] = useState('My Store gift card');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<'active' | 'draft' | 'archived'>('active');
  const [publishOnlineStore, setPublishOnlineStore] = useState(true);
  const [publishPOS, setPublishPOS] = useState(false);
  const [productType, setProductType] = useState('Gift card');
  const [vendor, setVendor] = useState('');
  const [collectionsText, setCollectionsText] = useState('');
  const [tagsText, setTagsText] = useState('');
  const [denominations, setDenominations] = useState<string[]>(['10.00', '25.00', '50.00', '100.00']);
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');
  const [themeTemplate, setThemeTemplate] = useState('Default product');
  const [giftCardTemplate, setGiftCardTemplate] = useState('gift_card');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleDenominationChange = (index: number, value: string) => {
    setDenominations((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  const addDenomination = () => setDenominations((prev) => [...prev, '']);
  const removeDenomination = (index: number) =>
    setDenominations((prev) => prev.filter((_, i) => i !== index));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !currentStore) return;

    const cleanDenoms = denominations
      .map((d) => d.trim())
      .filter((d) => d !== '' && !Number.isNaN(Number(d)) && Number(d) >= 0.01);

    if (!title.trim()) {
      setError('Title is required.');
      return;
    }
    if (cleanDenoms.length === 0) {
      setError('Add at least one denomination amount.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const collections = collectionsText
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      const tags = tagsText
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      const body: Record<string, unknown> = {
        title: title.trim(),
        description: description.trim() || undefined,
        category: 'Gift Cards',
        status,
        variants: cleanDenoms.map((amount) => ({
          price: Number(amount),
          inventory_quantity: 0,
        })),
        product_type: productType.trim() || undefined,
        vendor: vendor.trim() || undefined,
        collections: collections.length ? collections : undefined,
        tags: tags.length ? tags : undefined,
        seo_title: seoTitle.trim() || undefined,
        seo_description: seoDescription.trim() || undefined,
        publish_online_store: publishOnlineStore,
        publish_pos: publishPOS,
        // Additional template hints stored as metadata via product_type/vendor/etc already;
        // if needed later we can add dedicated metadata keys.
      };

      await apiRequest('/store/products', {
        method: 'POST',
        token,
        storeId: currentStore.id,
        body,
      });
      router.push('/admin/gift-cards');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create gift card product');
    } finally {
      setLoading(false);
    }
  };

  if (!currentStore) {
    return (
      <div className="p-6">
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-8 text-center">
          <p className="font-medium text-amber-800">Select a store first</p>
          <Link href="/admin/gift-cards" className="mt-3 inline-block text-sm font-medium text-mint">
            ← Gift cards
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-gray-50/60">
      <div className="border-b border-gray-200 bg-white px-6 py-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Link href="/admin/gift-cards" className="hover:text-mint">
                Gift cards
              </Link>
              <span>/</span>
              <span>Create product</span>
            </div>
            <h1 className="mt-2 text-2xl font-semibold text-gray-900">Create gift card product</h1>
            <p className="mt-0.5 text-sm text-gray-500">
              Set denominations and details for a digital gift card customers can purchase.
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/admin/gift-cards"
              className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </Link>
          </div>
        </div>
      </div>

      <div className="p-6">
        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[minmax(0,2fr),minmax(260px,1fr)]"
        >
          {/* Left column */}
          <div className="space-y-6">
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Title</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-mint focus:ring-2 focus:ring-mint/20"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Description</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-mint focus:ring-2 focus:ring-mint/20 resize-y"
                  />
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <h2 className="text-sm font-semibold text-gray-900 mb-3">Denominations</h2>
              <div className="space-y-2">
                {denominations.map((value, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm flex items-center gap-2">
                      <span className="text-gray-500 text-xs">Rs</span>
                      <input
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={value}
                        onChange={(e) => handleDenominationChange(index, e.target.value)}
                        className="w-full border-none bg-transparent text-sm outline-none"
                      />
                    </div>
                    {denominations.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeDenomination(index)}
                        className="rounded-lg border border-gray-200 px-2 py-1 text-xs text-gray-500 hover:bg-gray-100"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={addDenomination}
                className="mt-3 text-xs font-medium text-mint hover:underline"
              >
                Add denomination
              </button>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <h2 className="text-sm font-semibold text-gray-900 mb-3">Search engine listing</h2>
              <div className="space-y-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600">Title</label>
                  <input
                    type="text"
                    value={seoTitle}
                    onChange={(e) => setSeoTitle(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-mint focus:ring-2 focus:ring-mint/20"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600">
                    Description
                  </label>
                  <textarea
                    value={seoDescription}
                    onChange={(e) => setSeoDescription(e.target.value)}
                    rows={3}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-mint focus:ring-2 focus:ring-mint/20"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-lg bg-mint px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-mint-dark disabled:opacity-50"
              >
                {loading && (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/70 border-t-transparent" />
                )}
                <span>{loading ? 'Saving…' : 'Save gift card product'}</span>
              </button>
              <Link
                href="/admin/gift-cards"
                className="rounded-lg border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </Link>
            </div>
          </div>

          {/* Right column */}
          <div className="space-y-4">
            <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="space-y-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as 'active' | 'draft' | 'archived')}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-mint focus:ring-2 focus:ring-mint/20"
                  >
                    <option value="active">Active</option>
                    <option value="draft">Draft</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600">
                    Publishing
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setPublishOnlineStore((v) => !v)}
                      className={`rounded-full border px-3 py-1 text-xs font-medium ${
                        publishOnlineStore
                          ? 'border-mint bg-mint/10 text-mint'
                          : 'border-gray-200 text-gray-600'
                      }`}
                    >
                      Online Store
                    </button>
                    <button
                      type="button"
                      onClick={() => setPublishPOS((v) => !v)}
                      className={`rounded-full border px-3 py-1 text-xs font-medium ${
                        publishPOS ? 'border-mint bg-mint/10 text-mint' : 'border-gray-200 text-gray-600'
                      }`}
                    >
                      Point of Sale
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
              <h2 className="mb-3 text-sm font-semibold text-gray-900">Product organization</h2>
              <div className="space-y-3 text-sm">
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600">Type</label>
                  <input
                    type="text"
                    value={productType}
                    onChange={(e) => setProductType(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-mint focus:ring-2 focus:ring-mint/20"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600">Vendor</label>
                  <input
                    type="text"
                    value={vendor}
                    onChange={(e) => setVendor(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-mint focus:ring-2 focus:ring-mint/20"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600">Collections</label>
                  <input
                    type="text"
                    value={collectionsText}
                    onChange={(e) => setCollectionsText(e.target.value)}
                    placeholder="Separate with commas"
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-mint focus:ring-2 focus:ring-mint/20"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600">Tags</label>
                  <input
                    type="text"
                    value={tagsText}
                    onChange={(e) => setTagsText(e.target.value)}
                    placeholder="Separate with commas"
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-mint focus:ring-2 focus:ring-mint/20"
                  />
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
              <h2 className="mb-3 text-sm font-semibold text-gray-900">Templates</h2>
              <div className="space-y-3 text-sm">
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600">
                    Theme template
                  </label>
                  <select
                    value={themeTemplate}
                    onChange={(e) => setThemeTemplate(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-mint focus:ring-2 focus:ring-mint/20"
                  >
                    <option value="Default product">Default product</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600">
                    Gift card template
                  </label>
                  <select
                    value={giftCardTemplate}
                    onChange={(e) => setGiftCardTemplate(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-mint focus:ring-2 focus:ring-mint/20"
                  >
                    <option value="gift_card">gift_card</option>
                  </select>
                  <p className="mt-1 text-xs text-gray-400">
                    This is what customers see when they redeem a gift card.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

