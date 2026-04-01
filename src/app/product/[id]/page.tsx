'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Link from 'next/link';
import StorefrontProductDetail from '@/components/storefront/StorefrontProductDetail';
import {
  getStorefrontProduct,
  getStorefrontProducts,
  addStorefrontCartLine,
  setCartTokenForStore,
  setCartCount,
} from '@/lib/api';
import type { StorefrontProduct, ProductVariant } from '@/lib/api';

const LAST_CART_STORE_KEY = 'mint_cart_store_id';

function setLastCartStoreId(storeId: number) {
  if (typeof window !== 'undefined') localStorage.setItem(LAST_CART_STORE_KEY, String(storeId));
}

function variantOptionsMap(v: ProductVariant): Record<string, string> {
  const o = v.options;
  if (!o || typeof o !== 'object') return {};
  const out: Record<string, string> = {};
  for (const [k, val] of Object.entries(o)) {
    if (val === null || val === undefined) continue;
    const s = typeof val === 'string' ? val : String(val);
    if (s.trim()) out[k] = s.trim();
  }
  return out;
}

function findMatchingVariant(
  variants: ProductVariant[] | undefined,
  groupNames: { name: string }[],
  selection: Record<string, string>
): ProductVariant | undefined {
  if (!variants?.length) return undefined;
  if (!groupNames.length) return variants[0];
  const allFilled = groupNames.every((g) => (selection[g.name] ?? '').trim() !== '');
  if (!allFilled) return undefined;
  return variants.find((v) => {
    const vo = variantOptionsMap(v);
    return groupNames.every((g) => vo[g.name] === selection[g.name]);
  });
}

function ProductDetailInner() {
  const params = useParams();
  const searchParams = useSearchParams();
  const idParam = params?.id as string | undefined;
  const productId = idParam ? parseInt(idParam, 10) : NaN;
  const storeSlug = searchParams.get('store');
  const storeQuery = storeSlug ? `?store=${encodeURIComponent(storeSlug)}` : '';

  const router = useRouter();
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [product, setProduct] = useState<StorefrontProduct | null>(null);
  const [similarProducts, setSimilarProducts] = useState<StorefrontProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addingToCart, setAddingToCart] = useState(false);
  const [addToCartMessage, setAddToCartMessage] = useState<string | null>(null);
  const [optionSelection, setOptionSelection] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!idParam || isNaN(productId)) {
      setLoading(false);
      setError(idParam ? 'Invalid product' : null);
      return;
    }
    setLoading(true);
    setError(null);
    getStorefrontProduct(productId)
      .then((data) => {
        setProduct(data);
        setSelectedImage(0);
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Product not found'))
      .finally(() => setLoading(false));
  }, [productId, idParam]);

  useEffect(() => {
    if (!product) return;
    const og = product.option_groups ?? [];
    if (!og.length) {
      setOptionSelection({});
      return;
    }
    const v0 = product.variants?.[0];
    const vo = v0 ? variantOptionsMap(v0) : {};
    const init: Record<string, string> = {};
    for (const g of og) {
      init[g.name] = vo[g.name] ?? g.values[0]?.label ?? '';
    }
    setOptionSelection(init);
  }, [product?.id]);

  useEffect(() => {
    if (!product) return;
    const og = product.option_groups ?? [];
    const dv = findMatchingVariant(product.variants, og, optionSelection);
    if (!dv) return;
    const max = dv.inventory_quantity ?? 0;
    if (max <= 0) return;
    setQuantity((q) => Math.min(q, max));
  }, [optionSelection, product?.id, product?.variants, product?.option_groups]);

  useEffect(() => {
    if (!product) return;
    getStorefrontProducts({
      per_page: 8,
      category: product.category ?? undefined,
      storeId: product.store_id,
    })
      .then(({ data }) => setSimilarProducts(data.filter((p) => p.id !== product.id).slice(0, 4)))
      .catch(() => setSimilarProducts([]));
  }, [product?.id, product?.category, product?.store_id]);

  const handleAddToCart = async () => {
    if (!product) return;
    const og = product.option_groups ?? [];
    const displayVariant = findMatchingVariant(product.variants, og, optionSelection);
    const firstVariant = product.variants?.[0];
    const variant = og.length > 0 ? displayVariant : firstVariant;
    if (!variant) return;
    const variantStock = variant.inventory_quantity ?? 0;
    const totalStock = product.variants?.reduce((sum, v) => sum + (v.inventory_quantity ?? 0), 0) ?? 0;
    const inStock = og.length > 0 ? variantStock > 0 : totalStock > 0;
    if (!inStock) return;

    setAddingToCart(true);
    setAddToCartMessage(null);
    try {
      const cart = await addStorefrontCartLine(product.store_id, variant.id, quantity);
      if (cart.cart_token) setCartTokenForStore(product.store_id, cart.cart_token);
      setLastCartStoreId(product.store_id);
      const total = (cart.lines ?? []).reduce((sum, l) => sum + l.quantity, 0);
      setCartCount(total);
      setAddToCartMessage('Added to cart');
      setTimeout(() => {
        setAddToCartMessage(null);
        router.push(`/cart?store_id=${product.store_id}`);
      }, 600);
    } catch (e) {
      setAddToCartMessage(e instanceof Error ? e.message : 'Failed to add to cart');
    } finally {
      setAddingToCart(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div className="aspect-square rounded-2xl bg-gray-200" />
            <div className="space-y-4">
              <div className="h-8 bg-gray-200 rounded w-3/4" />
              <div className="h-12 bg-gray-200 rounded w-1/2" />
              <div className="h-24 bg-gray-100 rounded" />
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
          <p className="text-gray-600 mb-4">{error ?? 'Product not found.'}</p>
          <Link
            href={storeSlug ? `/?store=${encodeURIComponent(storeSlug)}` : '/'}
            className="text-teal-700 font-medium hover:underline"
          >
            Back to home
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <StorefrontProductDetail
        product={product}
        storeQuery={storeQuery}
        selectedImage={selectedImage}
        setSelectedImage={setSelectedImage}
        quantity={quantity}
        setQuantity={setQuantity}
        optionSelection={optionSelection}
        setOptionSelection={setOptionSelection}
        addingToCart={addingToCart}
        addToCartMessage={addToCartMessage}
        onAddToCart={handleAddToCart}
        similarProducts={similarProducts}
      />
      <Footer />
    </div>
  );
}

export default function ProductDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-white">
          <Header />
          <main className="max-w-7xl mx-auto px-4 py-16 text-center text-gray-500">Loading…</main>
          <Footer />
        </div>
      }
    >
      <ProductDetailInner />
    </Suspense>
  );
}
