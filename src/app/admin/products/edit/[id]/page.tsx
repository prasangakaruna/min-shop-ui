'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useStore } from '@/context/StoreContext';
import { apiRequest, uploadProductImage, getImageDisplayUrl, type Product, type ProductVariant } from '@/lib/api';

export default function EditProductPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const { data: session } = useSession();
  const { currentStore } = useStore();
  const token = (session as { access_token?: string } | null)?.access_token ?? null;

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState<{
    title: string;
    description: string;
    image_urls: string[];
    key_features: string;
    category: string;
    status: string;
  }>({
    title: '',
    description: '',
    image_urls: [],
    key_features: '',
    category: '',
    status: 'active',
  });
  const [variantQty, setVariantQty] = useState<Record<number, number>>({});
  const [variantPrice, setVariantPrice] = useState<Record<number, string>>({});
  const [variantCompareAtPrice, setVariantCompareAtPrice] = useState<Record<number, string>>({});
  const [savingVariantId, setSavingVariantId] = useState<number | null>(null);
  const [newVariantForm, setNewVariantForm] = useState({
    price: '',
    compareAtPrice: '',
    inventoryQuantity: '0',
    sku: '',
    title: '',
  });
  const [uploadingImageIndex, setUploadingImageIndex] = useState<number | null>(null);
  const [uploadingMultiple, setUploadingMultiple] = useState(false);
  const [dropZoneActive, setDropZoneActive] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
  const ACCEPTED_TYPES = 'image/jpeg,image/png,image/webp,image/jpg';

  const processFiles = async (files: FileList | File[]) => {
    setUploadError(null);
    const fileArray = Array.from(files);
    const valid: File[] = [];
    const tooBig: string[] = [];
    for (const file of fileArray) {
      if (!file.type.match(/^image\/(jpeg|png|webp|jpg)$/i)) continue;
      if (file.size > MAX_FILE_SIZE_BYTES) {
        tooBig.push(file.name);
      } else {
        valid.push(file);
      }
    }
    if (tooBig.length > 0) {
      setUploadError(`Skipped (max 5 MB each): ${tooBig.join(', ')}`);
    } else {
      setUploadError(null);
    }
    if (valid.length === 0 || !token || !currentStore) return;
    setUploadingMultiple(true);
    try {
      const results = await Promise.all(
        valid.map((file) => uploadProductImage(file, { token, storeId: currentStore.id }))
      );
      const newUrls = results.map((r) => r.url).filter(Boolean);
      if (newUrls.length > 0) {
        setForm((f) => ({ ...f, image_urls: [...f.image_urls, ...newUrls] }));
      }
    } finally {
      setUploadingMultiple(false);
    }
  };

  useEffect(() => {
    if (!token || !currentStore || !id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    apiRequest<Product>(`/store/products/${id}`, { token, storeId: currentStore.id })
      .then((data) => {
        setProduct(data);
        const urls = (data.image_urls && data.image_urls.length > 0)
          ? data.image_urls
          : (data.image_url ? [data.image_url] : []);
        const keyFeaturesText = (data.key_features && Array.isArray(data.key_features))
          ? data.key_features.join('\n')
          : '';
        setForm({
          title: data.title ?? '',
          description: data.description ?? '',
          image_urls: urls,
          key_features: keyFeaturesText,
          category: data.category ?? '',
          status: data.status ?? 'active',
        });
        const qty: Record<number, number> = {};
        const price: Record<number, string> = {};
        const compareAt: Record<number, string> = {};
        (data.variants ?? []).forEach((v) => {
          qty[v.id] = v.inventory_quantity ?? 0;
          price[v.id] = v.price ?? '';
          compareAt[v.id] = (v.compare_at_price != null && v.compare_at_price !== '') ? String(v.compare_at_price) : '';
        });
        setVariantQty(qty);
        setVariantPrice(price);
        setVariantCompareAtPrice(compareAt);
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Product not found'))
      .finally(() => setLoading(false));
  }, [token, currentStore, id]);

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !currentStore || !product) return;
    setSaving(true);
    setError('');
    try {
      const updated = await apiRequest<Product>(`/store/products/${id}`, {
        method: 'PATCH',
        token,
        storeId: currentStore.id,
        body: {
          title: form.title,
          description: form.description,
          image_urls: form.image_urls.filter((u) => u.trim() !== ''),
          key_features: form.key_features
            .split(/\n/)
            .map((s) => s.trim())
            .filter(Boolean),
          category: form.category || undefined,
          status: form.status,
        },
      });
      setProduct(updated);

      const priceTrim = newVariantForm.price.trim();
      if (priceTrim !== '') {
        const priceNum = parseFloat(priceTrim);
        if (!isNaN(priceNum) && priceNum >= 0) {
          const variant = await apiRequest<ProductVariant>(`/store/products/${id}/variants`, {
            method: 'POST',
            token,
            storeId: currentStore.id,
            body: {
              price: priceNum,
              compare_at_price: newVariantForm.compareAtPrice.trim() ? parseFloat(newVariantForm.compareAtPrice) || null : null,
              inventory_quantity: Math.max(0, parseInt(newVariantForm.inventoryQuantity, 10) || 0),
              sku: newVariantForm.sku.trim() || null,
              title: newVariantForm.title.trim() || null,
            },
          });
          setProduct((prev) =>
            prev ? { ...prev, variants: [...(prev.variants ?? []), variant] } : null
          );
          setVariantQty((prev) => ({ ...prev, [variant.id]: variant.inventory_quantity }));
          setVariantPrice((prev) => ({ ...prev, [variant.id]: String(variant.price) }));
          setVariantCompareAtPrice((prev) => ({
            ...prev,
            [variant.id]: variant.compare_at_price ? String(variant.compare_at_price) : '',
          }));
          setNewVariantForm({ price: '', compareAtPrice: '', inventoryQuantity: '0', sku: '', title: '' });
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveVariant = async (variant: ProductVariant) => {
    if (!token || !currentStore) return;
    const qty = variantQty[variant.id] ?? 0;
    const priceStr = variantPrice[variant.id] ?? '';
    const compareStr = variantCompareAtPrice[variant.id] ?? '';
    const priceNum = priceStr.trim() !== '' ? parseFloat(priceStr) : undefined;
    const compareNum = compareStr.trim() !== '' ? parseFloat(compareStr) : undefined;
    setSavingVariantId(variant.id);
    setError('');
    try {
      const body: { inventory_quantity: number; price?: number; compare_at_price?: number | null } = {
        inventory_quantity: qty,
      };
      if (priceNum !== undefined && !isNaN(priceNum)) body.price = priceNum;
      if (compareNum !== undefined && !isNaN(compareNum)) body.compare_at_price = compareNum;
      else if (compareStr.trim() === '') body.compare_at_price = null;
      await apiRequest(`/store/products/variants/${variant.id}`, {
        method: 'PATCH',
        token,
        storeId: currentStore.id,
        body,
      });
      setProduct((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          variants: (prev.variants ?? []).map((v) =>
            v.id === variant.id
              ? {
                  ...v,
                  inventory_quantity: qty,
                  price: priceNum !== undefined && !isNaN(priceNum) ? String(priceNum) : v.price,
                  compare_at_price: body.compare_at_price != null ? String(body.compare_at_price) : v.compare_at_price,
                }
              : v
          ),
        };
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update variant');
    } finally {
      setSavingVariantId(null);
    }
  };

  const handleDelete = async () => {
    if (!token || !currentStore || !id) return;
    setDeleting(true);
    setError('');
    try {
      await apiRequest(`/store/products/${id}`, { method: 'DELETE', token, storeId: currentStore.id });
      router.push('/admin/products');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete product');
      setShowDeleteConfirm(false);
    } finally {
      setDeleting(false);
    }
  };

  if (!currentStore) {
    return (
      <div className="p-6">
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-8 text-center">
          <p className="font-medium text-amber-800">Select a store</p>
          <Link href="/admin/products" className="mt-3 inline-block text-sm text-mint">← Products</Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="border-b border-gray-200 bg-white px-6 py-5">
          <div className="h-4 w-48 animate-pulse rounded bg-gray-200" />
          <div className="mt-2 h-4 w-64 animate-pulse rounded bg-gray-100" />
        </div>
        <div className="p-6 space-y-6 max-w-3xl">
          <div className="rounded-xl border border-gray-200 bg-white p-6 space-y-4">
            <div className="h-4 w-20 animate-pulse rounded bg-gray-100" />
            <div className="h-10 w-full animate-pulse rounded bg-gray-100" />
            <div className="h-24 w-full animate-pulse rounded bg-gray-100" />
            <div className="h-10 w-32 animate-pulse rounded bg-gray-100" />
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <div className="h-4 w-32 animate-pulse rounded bg-gray-100 mb-4" />
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="h-16 w-full animate-pulse rounded-lg bg-gray-50" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error && !product) {
    return (
      <div className="p-6">
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
          <p className="font-medium text-red-800">{error}</p>
          <Link href="/admin/products" className="mt-4 inline-block text-sm font-medium text-mint">← Back to products</Link>
        </div>
      </div>
    );
  }

  if (!product) return null;

  const displayTitle = product.title ?? 'Untitled product';

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="border-b border-gray-200 bg-white px-6 py-4">
        <div className="max-w-6xl mx-auto flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <nav className="flex items-center gap-2 text-xs sm:text-sm text-gray-500">
              <Link href="/admin" className="hover:text-mint">Home</Link>
              <span>/</span>
              <Link href="/admin/products" className="hover:text-mint">Products</Link>
              <span>/</span>
              <span className="text-gray-900 font-medium truncate max-w-[200px] sm:max-w-xs" title={displayTitle}>{displayTitle}</span>
            </nav>
            <h1 className="mt-2 text-2xl font-bold text-gray-900">Edit product</h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              This is how your product appears in the marketplace. Update content, imagery, and stock levels.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`/product/${product.id}${currentStore?.slug ? `?store=${encodeURIComponent(currentStore.slug)}` : ''}`}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg border border-mint bg-mint/10 px-4 py-2.5 text-sm font-medium text-mint hover:bg-mint/20"
            >
              View as customer
            </Link>
            <Link
              href="/admin/products"
              className="rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              ← Back to products
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSaveProduct} className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Left column: visual preview */}
          <div className="lg:col-span-1">
            <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
              <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                Storefront preview
              </h2>
              <div className="space-y-3">
                <div className="relative w-full h-56 rounded-lg overflow-hidden bg-gray-100">
                  {form.image_urls.length > 0 && form.image_urls[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={getImageDisplayUrl(form.image_urls[0])}
                      alt={displayTitle}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-gray-400 text-xs text-center px-4">
                      No images — add URLs or upload below. First image is the main storefront image.
                    </div>
                  )}
                </div>
                {form.image_urls.length > 1 && (
                  <p className="text-xs text-gray-500 mt-1">{form.image_urls.length} images in gallery</p>
                )}
                <div className="space-y-1">
                  <p className="text-xs font-medium text-gray-500 uppercase">
                    {form.category || 'Category'}
                  </p>
                  <p className="text-sm font-semibold text-gray-900 line-clamp-2">
                    {form.title || 'Product title'}
                  </p>
                  <p className="text-xs text-gray-500 line-clamp-2">
                    {form.description || 'Short description of the product for customers browsing your store.'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right column: editing form */}
          <div className="space-y-6 lg:col-span-2">
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="text-base font-semibold text-gray-900 mb-1">Product images</h2>
                  <p className="text-sm text-gray-500 mb-4">Upload or paste image URLs. First image is the main product image on the storefront.</p>
                  <label
                    className={`block rounded-xl border-2 border-dashed transition-colors ${
                      dropZoneActive ? 'border-mint bg-mint/10' : 'border-gray-200 bg-gray-50/50 hover:border-gray-300 hover:bg-gray-50'
                    } ${(!token || !currentStore || uploadingImageIndex !== null || uploadingMultiple) ? 'pointer-events-none opacity-60' : 'cursor-pointer'}`}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (token && currentStore && !uploadingMultiple && uploadingImageIndex === null) setDropZoneActive(true);
                    }}
                    onDragLeave={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setDropZoneActive(false);
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setDropZoneActive(false);
                      const files = e.dataTransfer?.files;
                      if (files?.length) processFiles(files);
                    }}
                  >
                    <input
                      type="file"
                      accept={ACCEPTED_TYPES}
                      multiple
                      className="sr-only"
                      disabled={!token || !currentStore || uploadingImageIndex !== null || uploadingMultiple}
                      onChange={(e) => {
                        const files = e.target.files;
                        if (files?.length) processFiles(files);
                        e.target.value = '';
                      }}
                    />
                    <div className="flex flex-col items-center justify-center py-10 px-6 text-center">
                      {uploadingMultiple ? (
                        <>
                          <span className="h-12 w-12 animate-spin rounded-full border-2 border-mint border-t-transparent mb-3" />
                          <p className="text-sm font-semibold text-gray-700">Uploading…</p>
                        </>
                      ) : (
                        <>
                          <div className="w-14 h-14 rounded-lg bg-gray-200 flex items-center justify-center mb-3 text-gray-500">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14" />
                            </svg>
                          </div>
                          <p className="text-sm font-semibold text-gray-900">Select multiple images</p>
                          <p className="mt-1 text-xs text-gray-500">
                            Click or drag files here · JPEG, PNG, WebP · max 5 MB each
                          </p>
                        </>
                      )}
                    </div>
                  </label>
                  {uploadError && (
                    <p className="mt-2 text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-2">{uploadError}</p>
                  )}
                  <ul className="mt-4 space-y-3">
                    {form.image_urls.map((url, index) => (
                      <li key={index} className="flex gap-3 items-start rounded-lg border border-gray-200 bg-gray-50/50 p-3">
                        <div className="w-16 h-16 shrink-0 rounded-lg overflow-hidden bg-gray-200 relative">
                          {url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={getImageDisplayUrl(url)}
                              alt=""
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                const fallback = e.currentTarget.nextElementSibling;
                                if (fallback) (fallback as HTMLElement).style.display = 'flex';
                              }}
                            />
                          ) : null}
                          <div
                            className="w-full h-full flex items-center justify-center text-gray-400 text-xs absolute inset-0 bg-gray-100"
                            style={{ display: url ? 'none' : 'flex' }}
                          >
                            {url ? 'Failed to load' : 'No image'}
                          </div>
                        </div>
                        <div className="min-w-0 flex-1">
                          <input
                            type="url"
                            value={url}
                            onChange={(e) =>
                              setForm((f) => ({
                                ...f,
                                image_urls: f.image_urls.map((u, i) => (i === index ? e.target.value : u)),
                              }))
                            }
                            placeholder="https://example.com/image.jpg"
                            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-mint focus:ring-2 focus:ring-mint/20"
                          />
                          <div className="mt-2 flex gap-2">
                            <label className="cursor-pointer inline-flex items-center gap-1.5 rounded border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50">
                              <input
                                type="file"
                                accept="image/jpeg,image/png,image/webp,image/jpg"
                                className="sr-only"
                                disabled={!token || !currentStore || uploadingImageIndex !== null}
                                onChange={async (e) => {
                                  const file = e.target.files?.[0];
                                  if (!file || !token || !currentStore) return;
                                  e.target.value = '';
                                  setUploadingImageIndex(index);
                                  try {
                                    const { url: uploadedUrl } = await uploadProductImage(file, {
                                      token,
                                      storeId: currentStore.id,
                                    });
                                    setForm((f) => ({
                                      ...f,
                                      image_urls: f.image_urls.map((u, i) => (i === index ? uploadedUrl : u)),
                                    }));
                                  } finally {
                                    setUploadingImageIndex(null);
                                  }
                                }}
                              />
                              {uploadingImageIndex === index ? (
                                <span className="h-3 w-3 animate-spin rounded-full border-2 border-mint border-t-transparent" />
                              ) : (
                                <span>Upload</span>
                              )}
                            </label>
                            <button
                              type="button"
                              onClick={() =>
                                setForm((f) => ({
                                  ...f,
                                  image_urls: f.image_urls.filter((_, i) => i !== index),
                                }))
                              }
                              className="text-xs font-medium text-red-600 hover:text-red-700"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                  <button
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, image_urls: [...f.image_urls, ''] }))}
                    className="mt-3 rounded-lg border-2 border-dashed border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 hover:border-mint hover:bg-mint/5 hover:text-mint"
                  >
                    + Add image
                  </button>
                </div>

            {/* Basic information — same as add page */}
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="text-base font-semibold text-gray-900 mb-4">Basic information</h2>
              <div className="space-y-5">
                <div>
                  <label htmlFor="edit-title" className="block text-sm font-medium text-gray-700 mb-1.5">Title *</label>
                  <input
                    id="edit-title"
                    type="text"
                    value={form.title}
                    onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                    required
                    placeholder="e.g. Pro Wireless ANC Headphones"
                    className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:border-mint focus:ring-2 focus:ring-mint/20"
                  />
                </div>
                <div>
                  <label htmlFor="edit-desc" className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
                  <textarea
                    id="edit-desc"
                    value={form.description}
                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                    rows={4}
                    placeholder="Describe your product: benefits, materials, use cases..."
                    className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:border-mint focus:ring-2 focus:ring-mint/20 resize-y"
                  />
                </div>
                <div>
                  <label htmlFor="edit-key-features" className="block text-sm font-medium text-gray-700 mb-1.5">Key features</label>
                  <textarea
                    id="edit-key-features"
                    value={form.key_features}
                    onChange={(e) => setForm((f) => ({ ...f, key_features: e.target.value }))}
                    rows={4}
                    placeholder={'One feature per line, e.g.:\nActive Noise Cancellation\n30-hour battery life\nQuick charge (5 min = 3 hours)'}
                    className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:border-mint focus:ring-2 focus:ring-mint/20 resize-y"
                  />
                  <p className="mt-1 text-xs text-gray-500">Shown as a bullet list on the product page.</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label htmlFor="edit-category" className="block text-sm font-medium text-gray-700 mb-1.5">Category</label>
                    <input
                      id="edit-category"
                      type="text"
                      value={form.category}
                      onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                      placeholder="e.g. AUDIO & HEADPHONES, Electronics"
                      className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:border-mint focus:ring-2 focus:ring-mint/20"
                    />
                  </div>
                  <div>
                    <label htmlFor="edit-status" className="block text-sm font-medium text-gray-700 mb-1.5">Status</label>
                    <select
                      id="edit-status"
                      value={form.status}
                      onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                      className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:border-mint focus:ring-2 focus:ring-mint/20"
                    >
                      <option value="active">Active — visible in store</option>
                      <option value="draft">Draft — not visible</option>
                      <option value="archived">Archived</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-lg bg-mint px-5 py-2.5 text-sm font-medium text-white hover:bg-mint-dark disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Saving…
                    </>
                  ) : (
                    'Save changes'
                  )}
                </button>
                <Link
                  href={`/product/${product.id}${currentStore?.slug ? `?store=${encodeURIComponent(currentStore.slug)}` : ''}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  View as customer
                </Link>
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="text-base font-semibold text-gray-900 mb-1">Pricing & stock</h2>
              <p className="text-sm text-gray-500 mb-4">Update price, compare-at price, and inventory for each variant. Add a new variant using the fields below and save with the button above.</p>
              {(product.variants ?? []).length > 0 ? (
                <ul className="space-y-4">
                  {(product.variants ?? []).map((v) => {
                    const qty = variantQty[v.id] ?? 0;
                    const isLow = qty > 0 && qty < 10;
                    const isOut = qty === 0;
                    return (
                      <li key={v.id} className="rounded-lg border border-gray-200 bg-gray-50/50 p-4">
                        <p className="font-medium text-gray-900 mb-3">{v.title || v.sku || `Variant #${v.id}`}</p>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                          <div>
                            <label htmlFor={`price-${v.id}`} className="block text-sm font-medium text-gray-700 mb-1.5">Price *</label>
                            <input
                              id={`price-${v.id}`}
                              type="number"
                              step="0.01"
                              min={0}
                              value={variantPrice[v.id] ?? v.price ?? ''}
                              onChange={(e) => setVariantPrice((prev) => ({ ...prev, [v.id]: e.target.value }))}
                              placeholder="299.00"
                              className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:border-mint focus:ring-2 focus:ring-mint/20"
                            />
                          </div>
                          <div>
                            <label htmlFor={`compare-${v.id}`} className="block text-sm font-medium text-gray-700 mb-1.5">Compare at price (optional)</label>
                            <input
                              id={`compare-${v.id}`}
                              type="number"
                              step="0.01"
                              min={0}
                              value={variantCompareAtPrice[v.id] ?? ''}
                              onChange={(e) => setVariantCompareAtPrice((prev) => ({ ...prev, [v.id]: e.target.value }))}
                              placeholder="349.00"
                              className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:border-mint focus:ring-2 focus:ring-mint/20"
                            />
                            <p className="mt-1 text-xs text-gray-500">Shown struck through as original price.</p>
                          </div>
                          <div>
                            <label htmlFor={`qty-${v.id}`} className="block text-sm font-medium text-gray-700 mb-1.5">Inventory quantity</label>
                            <input
                              id={`qty-${v.id}`}
                              type="number"
                              min={0}
                              value={variantQty[v.id] ?? 0}
                              onChange={(e) => setVariantQty((prev) => ({ ...prev, [v.id]: Number(e.target.value) }))}
                              className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm tabular-nums focus:border-mint focus:ring-2 focus:ring-mint/20"
                            />
                            {(isLow || isOut) && (
                              <p className={`mt-1 text-xs font-medium ${isOut ? 'text-red-600' : 'text-amber-600'}`}>
                                {isOut ? 'Out of stock' : 'Low stock'}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="mt-3 flex justify-end">
                          <button
                            type="button"
                            onClick={() => handleSaveVariant(v)}
                            disabled={savingVariantId === v.id}
                            className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                          >
                            {savingVariantId === v.id ? 'Updating…' : 'Update variant'}
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              ) : null}
              <div className="mt-4 rounded-lg border border-dashed border-gray-200 bg-gray-50/50 p-4">
                <p className="text-sm font-medium text-gray-700 mb-3">New variant</p>
                <p className="text-xs text-gray-500 mb-3">Fill in at least Price, then use the &quot;Save changes&quot; button above to add this variant.</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                  <div>
                    <label htmlFor="new-variant-price" className="block text-sm font-medium text-gray-700 mb-1.5">Price *</label>
                    <input
                      id="new-variant-price"
                      type="number"
                      step="0.01"
                      min={0}
                      value={newVariantForm.price}
                      onChange={(e) => setNewVariantForm((f) => ({ ...f, price: e.target.value }))}
                      placeholder="299.00"
                      className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:border-mint focus:ring-2 focus:ring-mint/20"
                    />
                  </div>
                  <div>
                    <label htmlFor="new-variant-compare" className="block text-sm font-medium text-gray-700 mb-1.5">Compare at price (optional)</label>
                    <input
                      id="new-variant-compare"
                      type="number"
                      step="0.01"
                      min={0}
                      value={newVariantForm.compareAtPrice}
                      onChange={(e) => setNewVariantForm((f) => ({ ...f, compareAtPrice: e.target.value }))}
                      placeholder="349.00"
                      className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:border-mint focus:ring-2 focus:ring-mint/20"
                    />
                  </div>
                  <div>
                    <label htmlFor="new-variant-qty" className="block text-sm font-medium text-gray-700 mb-1.5">Inventory quantity</label>
                    <input
                      id="new-variant-qty"
                      type="number"
                      min={0}
                      value={newVariantForm.inventoryQuantity}
                      onChange={(e) => setNewVariantForm((f) => ({ ...f, inventoryQuantity: e.target.value }))}
                      className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:border-mint focus:ring-2 focus:ring-mint/20"
                    />
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label htmlFor="new-variant-sku" className="block text-sm font-medium text-gray-700 mb-1.5">SKU (optional)</label>
                    <input
                      id="new-variant-sku"
                      type="text"
                      value={newVariantForm.sku}
                      onChange={(e) => setNewVariantForm((f) => ({ ...f, sku: e.target.value }))}
                      placeholder="e.g. HD-BLK-01"
                      className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:border-mint focus:ring-2 focus:ring-mint/20"
                    />
                  </div>
                  <div>
                    <label htmlFor="new-variant-title" className="block text-sm font-medium text-gray-700 mb-1.5">Title (optional)</label>
                    <input
                      id="new-variant-title"
                      type="text"
                      value={newVariantForm.title}
                      onChange={(e) => setNewVariantForm((f) => ({ ...f, title: e.target.value }))}
                      placeholder="e.g. Default, Black"
                      className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:border-mint focus:ring-2 focus:ring-mint/20"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-red-100 bg-red-50/50 p-6">
              <h2 className="text-sm font-semibold text-red-900">Danger zone</h2>
              <p className="mt-1 text-sm text-red-700">Permanently delete this product. This cannot be undone.</p>
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="mt-4 rounded-lg border border-red-200 bg-white px-4 py-2.5 text-sm font-medium text-red-700 hover:bg-red-50"
              >
                Delete product
              </button>
            </div>
          </div>
        </form>

        {showDeleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-sm rounded-xl border border-gray-200 bg-white p-6 shadow-lg">
              <h3 className="text-lg font-semibold text-gray-900">Delete product?</h3>
              <p className="mt-2 text-sm text-gray-600">This will permanently delete &quot;{product.title}&quot;. This action cannot be undone.</p>
              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={deleting}
                  className="flex-1 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleting}
                  className="flex-1 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                >
                  {deleting ? 'Deleting…' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
