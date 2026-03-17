'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Link from 'next/link';
import {
  getStorefrontProduct,
  getStorefrontProducts,
  getImageDisplayUrl,
  addStorefrontCartLine,
  setCartTokenForStore,
  setCartCount,
} from '@/lib/api';
import type { StorefrontProduct } from '@/lib/api';

const LAST_CART_STORE_KEY = 'mint_cart_store_id';

function setLastCartStoreId(storeId: number) {
  if (typeof window !== 'undefined') localStorage.setItem(LAST_CART_STORE_KEY, String(storeId));
}

export default function ProductDetailPage() {
  const params = useParams();
  const idParam = params?.id as string | undefined;
  const productId = idParam ? parseInt(idParam, 10) : NaN;

  const router = useRouter();
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [product, setProduct] = useState<StorefrontProduct | null>(null);
  const [similarProducts, setSimilarProducts] = useState<StorefrontProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addingToCart, setAddingToCart] = useState(false);
  const [addToCartMessage, setAddToCartMessage] = useState<string | null>(null);

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
    getStorefrontProducts({ per_page: 4, category: product.category ?? undefined })
      .then(({ data }) => setSimilarProducts(data.filter((p) => p.id !== product.id).slice(0, 4)))
      .catch(() => setSimilarProducts([]));
  }, [product?.id, product?.category]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div className="h-96 bg-gray-200 rounded-lg" />
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
          <Link href="/" className="text-mint font-medium hover:underline">Back to home</Link>
        </main>
        <Footer />
      </div>
    );
  }

  const images = product.image_urls?.length ? product.image_urls : (product.image_url ? [product.image_url] : []);
  const firstVariant = product.variants?.[0];
  const compareAtPrice = firstVariant?.compare_at_price ?? null;
  const totalStock = product.variants?.reduce((sum, v) => sum + (v.inventory_quantity ?? 0), 0) ?? 0;
  const inStock = totalStock > 0;

  const handleAddToCart = async () => {
    if (!product || !firstVariant || !inStock) return;
    setAddingToCart(true);
    setAddToCartMessage(null);
    try {
      const cart = await addStorefrontCartLine(product.store_id, firstVariant.id, quantity);
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

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <nav className="mb-6">
          <ol className="flex items-center space-x-2 text-sm text-gray-600">
            <li><Link href="/" className="hover:text-mint">Home</Link></li>
            <li>/</li>
            <li><Link href="/" className="hover:text-mint">Products</Link></li>
            <li>/</li>
            <li className="text-gray-800 truncate max-w-[200px]">{product.title}</li>
          </ol>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-12">
          <div>
            <div className="relative h-96 mb-4 rounded-lg overflow-hidden bg-gray-100">
              {images.length > 0 ? (
                <img
                  src={getImageDisplayUrl(images[selectedImage])}
                  alt={product.title}
                  className="w-full h-full object-cover"
                  style={{ objectFit: 'cover' }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">No image</div>
              )}
            </div>
            {images.length > 1 && (
              <div className="grid grid-cols-4 gap-4">
                {images.map((url, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => setSelectedImage(index)}
                    className={`relative h-24 rounded-lg overflow-hidden border-2 transition-colors ${
                      selectedImage === index ? 'border-mint' : 'border-transparent'
                    }`}
                  >
                    <img
                      src={getImageDisplayUrl(url)}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            {product.category && (
              <p className="text-sm text-gray-500 uppercase mb-2">{product.category}</p>
            )}
            <h1 className="text-4xl font-bold text-gray-800 mb-4">{product.title}</h1>

            <div className="mb-6 flex items-center space-x-4">
              <span className="text-4xl font-bold text-mint">${product.price}</span>
              {compareAtPrice && (
                <span className="text-2xl text-gray-500 line-through">${compareAtPrice}</span>
              )}
            </div>

            {product.description && (
              <p className="text-gray-600 mb-6">{product.description}</p>
            )}

            {product.key_features && product.key_features.length > 0 && (
              <div className="mb-6">
                <h3 className="font-semibold text-gray-800 mb-3">Key Features</h3>
                <ul className="space-y-2">
                  {product.key_features.map((feature, index) => (
                    <li key={index} className="flex items-center text-gray-600">
                      <svg className="w-5 h-5 text-mint mr-2 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="mb-6">
              {inStock ? (
                <p className="text-green-600 font-medium">✓ In Stock ({totalStock} available)</p>
              ) : (
                <p className="text-red-600 font-medium">Out of Stock</p>
              )}
            </div>

            <div className="flex items-center space-x-4 mb-6">
              <div className="flex items-center border border-gray-300 rounded-lg">
                <button
                  type="button"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-4 py-2 text-black hover:bg-gray-100 transition-colors"
                >
                  -
                </button>
                <span className="px-6 py-2 border-x border-gray-300 min-w-[3rem] text-center">{quantity}</span>
                <button
                  type="button"
                  onClick={() => setQuantity(quantity + 1)}
                  className="px-4 py-2 text-black hover:bg-gray-100 transition-colors"
                >
                  +
                </button>
              </div>
            </div>

            {addToCartMessage && (
              <p className={`text-sm mb-2 ${addToCartMessage === 'Added to cart' ? 'text-green-600' : 'text-red-600'}`}>
                {addToCartMessage}
              </p>
            )}
            <div className="flex space-x-4">
              <button
                type="button"
                disabled={!inStock || addingToCart}
                onClick={handleAddToCart}
                className="flex-1 bg-mint text-white py-3 rounded-lg font-medium hover:bg-mint-dark transition-colors flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {addingToCart ? (
                  <span>Adding…</span>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <span>Add to Cart</span>
                  </>
                )}
              </button>
              <button
                type="button"
                className="px-6 py-3 border-2 border-mint text-mint rounded-lg font-medium hover:bg-mint/10 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {similarProducts.length > 0 && (
          <section className="mt-16 mb-12">
            <div className="mb-8">
              <div className="inline-block bg-mint/10 text-mint-dark px-3 py-1 rounded-full text-xs font-semibold mb-2">
                YOU MAY ALSO LIKE
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">Similar Products</h2>
              <p className="text-base text-gray-600">Products you might be interested in</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {similarProducts.map((item) => {
                const img = item.image_urls?.[0] ?? item.image_url ?? '';
                return (
                  <Link
                    key={item.id}
                    href={`/product/${item.id}`}
                    className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 group border border-gray-100 hover:border-mint/30"
                  >
                    <div className="relative h-48 overflow-hidden bg-gray-100">
                      {img ? (
                        <img
                          src={getImageDisplayUrl(img)}
                          alt={item.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">No image</div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="text-base font-bold text-gray-900 mb-2 hover:text-mint transition-colors line-clamp-2">
                        {item.title}
                      </h3>
                      <div className="flex items-center space-x-2 mb-3">
                        <span className="text-xl font-bold text-mint">${item.price}</span>
                        {item.variants?.[0]?.compare_at_price && (
                          <span className="text-sm text-gray-400 line-through">${item.variants[0].compare_at_price}</span>
                        )}
                      </div>
                      <span className="block w-full bg-mint text-white py-2 rounded-lg font-semibold hover:bg-mint-dark transition-all shadow-sm text-center text-sm">
                        View Details
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
}
