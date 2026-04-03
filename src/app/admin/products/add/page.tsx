'use client';

import React, { useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useStore } from '@/context/StoreContext';
import { apiRequest, uploadProductImage, getImageDisplayUrl, parseStoreProductCategoriesResponse } from '@/lib/api';
import PageRichTextEditor from '@/components/admin/PageRichTextEditor';
import { isEmptyRichDescriptionHtml } from '@/lib/productDescriptionRichText';
import { nutritionFormToPayload } from '@/lib/productNutritionForm';

const ACCEPT = 'image/jpeg,image/png,image/webp,image/jpg';
const MAX_SIZE_MB = 5;

export default function AddProductPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const { currentStore } = useStore();
  const token = (session as { access_token?: string } | null)?.access_token ?? null;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrls, setImageUrls] = useState<string[]>(['']);
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState<'active' | 'draft' | 'archived'>('active');
  const [price, setPrice] = useState('');
  const [compareAtPrice, setCompareAtPrice] = useState('');
  const [inventoryQuantity, setInventoryQuantity] = useState('0');
  const [keyFeaturesText, setKeyFeaturesText] = useState('');
  const [storefront, setStorefront] = useState({
    brand: '',
    package_size: '',
    weight_oz: '',
    specifications_text: '',
    rating_average: '',
    rating_count: '',
    ingredients: '',
    directions: '',
    warnings: '',
    we_love_this_for: '',
    ingredients_allergen: '',
    nutrition_serves_about: '',
    nutrition_serving_size: '',
    nutrition_serving_weight: '',
    nutrition_calories: '',
    nutrition_rows_text: '',
    video_url: '',
  });
  const [productType, setProductType] = useState('');
  const [vendor, setVendor] = useState('');
  const [collectionsText, setCollectionsText] = useState('');
  const [tagsText, setTagsText] = useState('');
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');
  const [inventoryTracked, setInventoryTracked] = useState(true);
  const [isPhysical, setIsPhysical] = useState(true);
  const [weightKg, setWeightKg] = useState('0');
  const [publishOnlineStore, setPublishOnlineStore] = useState(true);
  const [publishPOS, setPublishPOS] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadingImageIndex, setUploadingImageIndex] = useState<number | null>(null);
  const [uploadingMultiple, setUploadingMultiple] = useState({ current: 0, total: 0 });
  const [uploadError, setUploadError] = useState('');
  const [error, setError] = useState('');
  const [multiDropOver, setMultiDropOver] = useState(false);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);

  useEffect(() => {
    if (!token || !currentStore) return;
    setCategoriesLoading(true);
    setCategoriesError(null);
    apiRequest<unknown>('/store/product-categories', {
      token,
      storeId: currentStore.id,
    })
      .then((res) => {
        setCategories(parseStoreProductCategoriesResponse(res));
      })
      .catch((e) => setCategoriesError(e instanceof Error ? e.message : 'Failed to load categories'))
      .finally(() => setCategoriesLoading(false));
  }, [token, currentStore]);

  const handleUploadMultiple = useCallback(
    async (fileList: FileList | null) => {
      if (!fileList?.length || !token || !currentStore) return;
      const files = Array.from(fileList).filter((f) => f.type.match(/^image\/(jpeg|png|webp|jpg)$/));
      const tooBig = files.filter((f) => f.size > MAX_SIZE_MB * 1024 * 1024);
      if (tooBig.length) {
        setUploadError(`${tooBig.length} file(s) exceed ${MAX_SIZE_MB} MB.`);
        return;
      }
      if (files.length === 0) {
        setUploadError('Please select image files (JPEG, PNG, WebP).');
        return;
      }
      setUploadError('');
      setUploadingMultiple({ current: 0, total: files.length });
      const newUrls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        setUploadingMultiple((prev) => ({ ...prev, current: i + 1 }));
        try {
          const { url } = await uploadProductImage(files[i], { token, storeId: currentStore.id });
          newUrls.push(url);
        } catch (e) {
          setUploadError(e instanceof Error ? e.message : `Upload ${i + 1} failed`);
          setUploadingMultiple({ current: 0, total: 0 });
          return;
        }
      }
      setImageUrls((prev) => {
        const filled = prev.filter((u) => u.trim() !== '');
        const hadEmpty = prev.some((u) => u.trim() === '');
        return [...filled, ...newUrls].concat(hadEmpty ? [''] : []);
      });
      setUploadingMultiple({ current: 0, total: 0 });
    },
    [token, currentStore]
  );

  const handleUpload = useCallback(
    async (file: File | null, index: number) => {
      if (!file || !token || !currentStore) return;
      if (!file.type.match(/^image\/(jpeg|png|webp|jpg)$/)) {
        setUploadError('Please choose a JPEG, PNG, or WebP image.');
        return;
      }
      if (file.size > MAX_SIZE_MB * 1024 * 1024) {
        setUploadError(`Image must be under ${MAX_SIZE_MB} MB.`);
        return;
      }
      setUploadError('');
      setUploadingImageIndex(index);
      try {
        const { url } = await uploadProductImage(file, { token, storeId: currentStore.id });
        setImageUrls((prev) => {
          const next = [...prev];
          while (next.length <= index) next.push('');
          next[index] = url;
          return next;
        });
      } catch (e) {
        setUploadError(e instanceof Error ? e.message : 'Upload failed');
      } finally {
        setUploadingImageIndex(null);
      }
    },
    [token, currentStore]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !currentStore) return;
    setLoading(true);
    setError('');
    try {
      const urls = imageUrls.filter((u) => u.trim() !== '');
      const keyFeatures = keyFeaturesText
        .split(/\n/)
        .map((s) => s.trim())
        .filter(Boolean);
      const collections = collectionsText
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      const tags = tagsText
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      const priceNum = parseFloat(price);
      if (isNaN(priceNum) || priceNum < 0) {
        setError('Please enter a valid price.');
        setLoading(false);
        return;
      }
      const specRows: { label: string; value: string }[] = [];
      for (const line of storefront.specifications_text.split('\n')) {
        const i = line.indexOf('|');
        if (i < 0) continue;
        const label = line.slice(0, i).trim();
        const value = line.slice(i + 1).trim();
        if (label && value) specRows.push({ label, value });
      }
      const weightTrim = storefront.weight_oz.trim();
      const weightNum = weightTrim === '' ? null : parseFloat(weightTrim);
      const ratingAvgTrim = storefront.rating_average.trim();
      const ratingAvgNum = ratingAvgTrim === '' ? null : parseFloat(ratingAvgTrim);
      const ratingCountTrim = storefront.rating_count.trim();
      const ratingCountNum = ratingCountTrim === '' ? null : parseInt(ratingCountTrim, 10);
      const nutrition_facts = nutritionFormToPayload({
        nutrition_serves_about: storefront.nutrition_serves_about,
        nutrition_serving_size: storefront.nutrition_serving_size,
        nutrition_serving_weight: storefront.nutrition_serving_weight,
        nutrition_calories: storefront.nutrition_calories,
        nutrition_rows_text: storefront.nutrition_rows_text,
      });
      const body: Record<string, unknown> = {
        title: title.trim(),
        description: isEmptyRichDescriptionHtml(description) ? undefined : description,
        image_urls: urls.length ? urls : undefined,
        category: category.trim() || undefined,
        status,
        key_features: keyFeatures.length ? keyFeatures : undefined,
        variants: [
          {
            price: priceNum,
            compare_at_price: compareAtPrice.trim() ? parseFloat(compareAtPrice) || undefined : undefined,
            inventory_quantity: Math.max(0, parseInt(inventoryQuantity, 10) || 0),
          },
        ],
        product_type: productType.trim() || undefined,
        vendor: vendor.trim() || undefined,
        collections: collections.length ? collections : undefined,
        tags: tags.length ? tags : undefined,
        inventory_tracked: inventoryTracked,
        is_physical: isPhysical,
        weight_kg: weightKg.trim() ? parseFloat(weightKg) || 0 : null,
        seo_title: seoTitle.trim() || undefined,
        seo_description: seoDescription.trim() || undefined,
        publish_online_store: publishOnlineStore,
        publish_pos: publishPOS,
        brand: storefront.brand.trim() || null,
        package_size: storefront.package_size.trim() || null,
        weight_oz: weightNum != null && !Number.isNaN(weightNum) && weightNum >= 0 ? weightNum : null,
        ingredients: storefront.ingredients.trim() || null,
        directions: storefront.directions.trim() || null,
        warnings: storefront.warnings.trim() || null,
        specifications: specRows.length ? specRows : null,
        rating_average: ratingAvgNum != null && !Number.isNaN(ratingAvgNum) ? ratingAvgNum : null,
        rating_count: ratingCountNum != null && !Number.isNaN(ratingCountNum) && ratingCountNum >= 0 ? ratingCountNum : null,
        we_love_this_for: storefront.we_love_this_for
          .split(/\n/)
          .map((s) => s.trim())
          .filter(Boolean),
        ingredients_allergen: storefront.ingredients_allergen.trim() || null,
        nutrition_facts,
        video_url: storefront.video_url.trim() || null,
      };
      await apiRequest('/store/products', {
        method: 'POST',
        token,
        storeId: currentStore.id,
        body,
      });
      router.push('/admin/products');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create product');
    } finally {
      setLoading(false);
    }
  };

  if (!currentStore) {
    return (
      <div className="p-6">
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-8 text-center">
          <p className="font-medium text-amber-800">Select a store first</p>
          <Link href="/admin/products" className="mt-3 inline-block text-sm font-medium text-mint">← Products</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full">
      <div className="border-b border-gray-200 bg-white px-6 py-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link href="/admin/products" className="text-sm text-gray-600 hover:text-mint">← Products</Link>
            <h1 className="mt-2 text-2xl font-semibold text-gray-900">Add product</h1>
            <p className="mt-0.5 text-sm text-gray-500">Create a new product in {currentStore.name}. Add images, pricing, and details.</p>
          </div>
          <Link
            href="/admin/products"
            className="inline-flex items-center rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </Link>
        </div>
      </div>

      <div className="p-6 max-w-4xl">
        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Images */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-base font-semibold text-gray-900 mb-1">Product images</h2>
            <p className="text-sm text-gray-500 mb-4">Upload or paste image URLs. First image is the main product image on the storefront.</p>

            <label
              onDrop={(e) => {
                e.preventDefault();
                setMultiDropOver(false);
                if (e.dataTransfer.files?.length && !uploadingMultiple.total) void handleUploadMultiple(e.dataTransfer.files);
              }}
              onDragOver={(e) => { e.preventDefault(); setMultiDropOver(true); }}
              onDragLeave={(e) => { e.preventDefault(); setMultiDropOver(false); }}
              className={`mb-4 flex flex-col items-center justify-center rounded-xl border-2 border-dashed py-8 px-4 transition-colors ${
                uploadingMultiple.total
                  ? 'border-mint bg-mint/5 pointer-events-none'
                  : multiDropOver
                    ? 'border-mint bg-mint/10 cursor-pointer'
                    : 'border-gray-200 bg-gray-50 hover:border-mint hover:bg-mint/5 cursor-pointer'
              }`}
            >
              <input
                type="file"
                accept={ACCEPT}
                multiple
                className="sr-only"
                disabled={!token || !currentStore || uploadingMultiple.total > 0}
                onChange={(e) => {
                  const list = e.target.files;
                  if (list?.length) void handleUploadMultiple(list);
                  e.target.value = '';
                }}
              />
              {uploadingMultiple.total ? (
                <>
                  <span className="h-10 w-10 animate-spin rounded-full border-2 border-mint border-t-transparent mb-2" />
                  <span className="text-sm font-medium text-gray-700">
                    Uploading {uploadingMultiple.current} of {uploadingMultiple.total}…
                  </span>
                </>
              ) : (
                <>
                  <svg className="w-10 h-10 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  </svg>
                  <span className="text-sm font-medium text-gray-700">Select multiple images</span>
                  <span className="text-xs text-gray-500 mt-0.5">Click or drag files here · JPEG, PNG, WebP · max {MAX_SIZE_MB} MB each</span>
                </>
              )}
            </label>

            <ul className="space-y-3">
              {imageUrls.map((url, index) => (
                <li key={index} className="flex gap-3 items-start rounded-lg border border-gray-200 bg-gray-50/50 p-3">
                  <div className="w-20 h-20 shrink-0 rounded-lg overflow-hidden bg-gray-200 relative">
                    {url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={getImageDisplayUrl(url)} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">No image</div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <input
                      type="url"
                      value={url}
                      onChange={(e) => {
                        const next = [...imageUrls];
                        while (next.length <= index) next.push('');
                        next[index] = e.target.value;
                        setImageUrls(next);
                        setUploadError('');
                      }}
                      placeholder="https://example.com/image.jpg"
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-mint focus:ring-2 focus:ring-mint/20"
                    />
                    <div className="mt-2 flex gap-2 flex-wrap">
                      <label className="cursor-pointer inline-flex items-center gap-1.5 rounded border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50">
                        <input
                          type="file"
                          accept={ACCEPT}
                          className="sr-only"
                          disabled={!token || !currentStore || uploadingImageIndex !== null}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) void handleUpload(file, index);
                            e.target.value = '';
                          }}
                        />
                        {uploadingImageIndex === index ? (
                          <span className="h-3 w-3 animate-spin rounded-full border-2 border-mint border-t-transparent" />
                        ) : (
                          'Upload'
                        )}
                      </label>
                      <button
                        type="button"
                        onClick={() => setImageUrls((prev) => prev.filter((_, i) => i !== index))}
                        className="text-xs font-medium text-red-600 hover:text-red-700"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            {uploadError && <p className="mt-2 text-sm text-red-600">{uploadError}</p>}
            <button
              type="button"
              onClick={() => setImageUrls((prev) => [...prev, ''])}
              className="mt-3 rounded-lg border-2 border-dashed border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 hover:border-mint hover:bg-mint/5 hover:text-mint"
            >
              + Add image
            </button>
          </div>

          {/* Basic info */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-base font-semibold text-gray-900 mb-4">Basic information</h2>
            <div className="space-y-5">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1.5">Title *</label>
                <input
                  id="title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  placeholder="e.g. Pro Wireless ANC Headphones"
                  className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:border-mint focus:ring-2 focus:ring-mint/20"
                />
              </div>
              <div>
                <span className="block text-sm font-medium text-gray-700 mb-1.5">Description</span>
                <PageRichTextEditor
                  key="product-desc-add"
                  initialHtml={description}
                  onChange={setDescription}
                  placeholder="Describe your product: benefits, materials, use cases. Use the toolbar for colors, tables, and links."
                  chrome="full"
                  uploadImageFile={
                    token && currentStore
                      ? async (file) =>
                          (await uploadProductImage(file, { token, storeId: currentStore.id })).url
                      : undefined
                  }
                />
                <p className="mt-1 text-xs text-gray-500">
                  Rich text editor (same as custom pages): text color, fonts, alignment, bullet lists, links, images, and
                  tables. You can paste from Word and adjust formatting here.
                </p>
              </div>
              <div>
                <label htmlFor="key_features" className="block text-sm font-medium text-gray-700 mb-1.5">Key features</label>
                <textarea
                  id="key_features"
                  value={keyFeaturesText}
                  onChange={(e) => setKeyFeaturesText(e.target.value)}
                  rows={4}
                  placeholder={'One feature per line, e.g.:\nActive Noise Cancellation\n30-hour battery life\nQuick charge (5 min = 3 hours)'}
                  className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:border-mint focus:ring-2 focus:ring-mint/20 resize-y"
                />
                <p className="mt-1 text-xs text-gray-500">Shown as a bullet list on the product page.</p>
              </div>

              <div className="rounded-lg border border-teal-100 bg-teal-50/40 p-4">
                <h3 className="text-sm font-semibold text-gray-900">Storefront detail (Walmart-style extras)</h3>
                <p className="mt-1 text-xs text-gray-600">
                  Optional fields for the public product page: brand, specs, ingredients, grocery-style tags and nutrition
                  panel, unit pricing, and manual ratings until you wire real reviews.
                </p>
                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label htmlFor="add-video-url" className="block text-xs font-medium text-gray-700 mb-1">
                      Product video URL
                    </label>
                    <input
                      id="add-video-url"
                      type="url"
                      inputMode="url"
                      value={storefront.video_url}
                      onChange={(e) => setStorefront((s) => ({ ...s, video_url: e.target.value }))}
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                      placeholder="https://www.youtube.com/watch?v=… or https://vimeo.com/… or direct .mp4 link"
                    />
                    <p className="mt-0.5 text-[11px] text-gray-500">
                      YouTube / Vimeo embed on the product page; direct video files play in-page; other links open in a new
                      tab.
                    </p>
                  </div>
                  <div>
                    <label htmlFor="add-brand" className="block text-xs font-medium text-gray-700 mb-1">
                      Brand
                    </label>
                    <input
                      id="add-brand"
                      type="text"
                      value={storefront.brand}
                      onChange={(e) => setStorefront((s) => ({ ...s, brand: e.target.value }))}
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                      placeholder="e.g. Zatarain's"
                    />
                  </div>
                  <div>
                    <label htmlFor="add-package" className="block text-xs font-medium text-gray-700 mb-1">
                      Package size label
                    </label>
                    <input
                      id="add-package"
                      type="text"
                      value={storefront.package_size}
                      onChange={(e) => setStorefront((s) => ({ ...s, package_size: e.target.value }))}
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                      placeholder="e.g. 40 oz bag"
                    />
                  </div>
                  <div>
                    <label htmlFor="add-weight-oz" className="block text-xs font-medium text-gray-700 mb-1">
                      Net weight (oz)
                    </label>
                    <input
                      id="add-weight-oz"
                      type="text"
                      inputMode="decimal"
                      value={storefront.weight_oz}
                      onChange={(e) => setStorefront((s) => ({ ...s, weight_oz: e.target.value }))}
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                      placeholder="e.g. 40"
                    />
                    <p className="mt-0.5 text-[11px] text-gray-500">Used with price to show ¢/oz on the product page.</p>
                  </div>
                  <div className="sm:col-span-2 grid grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="add-rating-avg" className="block text-xs font-medium text-gray-700 mb-1">
                        Rating (0–5)
                      </label>
                      <input
                        id="add-rating-avg"
                        type="text"
                        inputMode="decimal"
                        value={storefront.rating_average}
                        onChange={(e) => setStorefront((s) => ({ ...s, rating_average: e.target.value }))}
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                        placeholder="e.g. 4.6"
                      />
                    </div>
                    <div>
                      <label htmlFor="add-rating-count" className="block text-xs font-medium text-gray-700 mb-1">
                        # of ratings
                      </label>
                      <input
                        id="add-rating-count"
                        type="text"
                        inputMode="numeric"
                        value={storefront.rating_count}
                        onChange={(e) => setStorefront((s) => ({ ...s, rating_count: e.target.value }))}
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                        placeholder="e.g. 2210"
                      />
                    </div>
                  </div>
                </div>
                <div className="mt-4">
                  <label htmlFor="add-specs" className="block text-xs font-medium text-gray-700 mb-1">
                    Specifications (one per line: Label | Value)
                  </label>
                  <textarea
                    id="add-specs"
                    value={storefront.specifications_text}
                    onChange={(e) => setStorefront((s) => ({ ...s, specifications_text: e.target.value }))}
                    rows={4}
                    placeholder={'Packaged meal type | Pasta Meals\nMeat type | Chicken'}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm font-mono"
                  />
                </div>
                <div className="mt-4 grid grid-cols-1 gap-4">
                  <div>
                    <label htmlFor="add-ingredients" className="block text-xs font-medium text-gray-700 mb-1">
                      Ingredients
                    </label>
                    <textarea
                      id="add-ingredients"
                      value={storefront.ingredients}
                      onChange={(e) => setStorefront((s) => ({ ...s, ingredients: e.target.value }))}
                      rows={4}
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm resize-y"
                    />
                  </div>
                  <div>
                    <label htmlFor="add-we-love" className="block text-xs font-medium text-gray-700 mb-1">
                      We love this for (one tag per line)
                    </label>
                    <textarea
                      id="add-we-love"
                      value={storefront.we_love_this_for}
                      onChange={(e) => setStorefront((s) => ({ ...s, we_love_this_for: e.target.value }))}
                      rows={4}
                      placeholder={'Alfresco Dining\nBrunch All Day\nFamily Style'}
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm resize-y"
                    />
                    <p className="mt-0.5 text-[11px] text-gray-500">
                      Shown as tags in the optional grocery-style block on the product page (with allergen / nutrition if
                      you fill those).
                    </p>
                  </div>
                  <div>
                    <label htmlFor="add-ingredients-allergen" className="block text-xs font-medium text-gray-700 mb-1">
                      Ingredients — allergen line
                    </label>
                    <input
                      id="add-ingredients-allergen"
                      type="text"
                      value={storefront.ingredients_allergen}
                      onChange={(e) => setStorefront((s) => ({ ...s, ingredients_allergen: e.target.value }))}
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                      placeholder="e.g. CONTAINS MILK."
                    />
                  </div>
                  <div className="rounded-md border border-gray-200 bg-white/80 p-3">
                    <p className="text-xs font-semibold text-gray-800">Nutrition facts (optional panel)</p>
                    <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div>
                        <label htmlFor="add-nf-serves" className="block text-[11px] font-medium text-gray-600 mb-0.5">
                          Serves about
                        </label>
                        <input
                          id="add-nf-serves"
                          type="text"
                          value={storefront.nutrition_serves_about}
                          onChange={(e) => setStorefront((s) => ({ ...s, nutrition_serves_about: e.target.value }))}
                          className="w-full rounded border border-gray-200 px-2 py-1.5 text-sm"
                          placeholder="10"
                        />
                      </div>
                      <div>
                        <label htmlFor="add-nf-cal" className="block text-[11px] font-medium text-gray-600 mb-0.5">
                          Calories per serving
                        </label>
                        <input
                          id="add-nf-cal"
                          type="text"
                          value={storefront.nutrition_calories}
                          onChange={(e) => setStorefront((s) => ({ ...s, nutrition_calories: e.target.value }))}
                          className="w-full rounded border border-gray-200 px-2 py-1.5 text-sm"
                          placeholder="70"
                        />
                      </div>
                      <div>
                        <label htmlFor="add-nf-size" className="block text-[11px] font-medium text-gray-600 mb-0.5">
                          Serving size
                        </label>
                        <input
                          id="add-nf-size"
                          type="text"
                          value={storefront.nutrition_serving_size}
                          onChange={(e) => setStorefront((s) => ({ ...s, nutrition_serving_size: e.target.value }))}
                          className="w-full rounded border border-gray-200 px-2 py-1.5 text-sm"
                          placeholder="2 Tbsp."
                        />
                      </div>
                      <div>
                        <label htmlFor="add-nf-weight" className="block text-[11px] font-medium text-gray-600 mb-0.5">
                          Serving weight
                        </label>
                        <input
                          id="add-nf-weight"
                          type="text"
                          value={storefront.nutrition_serving_weight}
                          onChange={(e) => setStorefront((s) => ({ ...s, nutrition_serving_weight: e.target.value }))}
                          className="w-full rounded border border-gray-200 px-2 py-1.5 text-sm"
                          placeholder="23g"
                        />
                      </div>
                    </div>
                    <div className="mt-3">
                      <label htmlFor="add-nf-rows" className="block text-[11px] font-medium text-gray-600 mb-0.5">
                        Nutrient rows (one per line: Label | Amount | %DV | indent)
                      </label>
                      <textarea
                        id="add-nf-rows"
                        value={storefront.nutrition_rows_text}
                        onChange={(e) => setStorefront((s) => ({ ...s, nutrition_rows_text: e.target.value }))}
                        rows={6}
                        placeholder={
                          'Total Fat | 7g | 9% | 0\nSaturated Fat | 4.5g | 23% | 1\nTrans Fat | 0g | | 1'
                        }
                        className="w-full rounded border border-gray-200 px-2 py-1.5 font-mono text-xs"
                      />
                      <p className="mt-0.5 text-[10px] text-gray-500">
                        Indent: 0 = main row, 1–3 = nested. Leave %DV empty if not applicable.
                      </p>
                    </div>
                  </div>
                  <div>
                    <label htmlFor="add-directions" className="block text-xs font-medium text-gray-700 mb-1">
                      Directions
                    </label>
                    <textarea
                      id="add-directions"
                      value={storefront.directions}
                      onChange={(e) => setStorefront((s) => ({ ...s, directions: e.target.value }))}
                      rows={3}
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm resize-y"
                    />
                  </div>
                  <div>
                    <label htmlFor="add-warnings" className="block text-xs font-medium text-gray-700 mb-1">
                      Warnings
                    </label>
                    <textarea
                      id="add-warnings"
                      value={storefront.warnings}
                      onChange={(e) => setStorefront((s) => ({ ...s, warnings: e.target.value }))}
                      rows={2}
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm resize-y"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1.5">Category</label>
                  <select
                    id="category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:border-mint focus:ring-2 focus:ring-mint/20"
                  >
                    <option value="">{categoriesLoading ? 'Loading categories…' : 'Choose a product category'}</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-xs text-gray-500">
                    Determines tax rates and adds metafields to improve search, filters, and cross-channel sales.
                  </p>
                  {categoriesError && (
                    <p className="mt-1 text-xs text-red-600">
                      {categoriesError}
                    </p>
                  )}
                </div>
                <div>
                  <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1.5">Status</label>
                  <select
                    id="status"
                    value={status}
                    onChange={(e) => setStatus(e.target.value as 'active' | 'draft' | 'archived')}
                    className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:border-mint focus:ring-2 focus:ring-mint/20"
                  >
                    <option value="active">Active — visible in store</option>
                    <option value="draft">Draft — not visible</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Pricing & stock */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-base font-semibold text-gray-900 mb-1">Pricing & stock</h2>
            <p className="text-sm text-gray-500 mb-4">Default variant. You can add more variants after creating the product.</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div>
                <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1.5">Price *</label>
                <input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  required
                  placeholder="299.00"
                  className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:border-mint focus:ring-2 focus:ring-mint/20"
                />
              </div>
              <div>
                <label htmlFor="compare_at_price" className="block text-sm font-medium text-gray-700 mb-1.5">Compare at price (optional)</label>
                <input
                  id="compare_at_price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={compareAtPrice}
                  onChange={(e) => setCompareAtPrice(e.target.value)}
                  placeholder="349.00"
                  className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:border-mint focus:ring-2 focus:ring-mint/20"
                />
                <p className="mt-1 text-xs text-gray-500">Shown struck through as original price.</p>
              </div>
              <div>
                <label htmlFor="inventory_quantity" className="block text-sm font-medium text-gray-700 mb-1.5">Inventory quantity</label>
                <input
                  id="inventory_quantity"
                  type="number"
                  min="0"
                  value={inventoryQuantity}
                  onChange={(e) => setInventoryQuantity(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:border-mint focus:ring-2 focus:ring-mint/20"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-lg bg-mint px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-mint-dark disabled:opacity-50"
            >
              {loading ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Creating…
                </>
              ) : (
                'Create product'
              )}
            </button>
            <Link
              href="/admin/products"
              className="rounded-lg border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
