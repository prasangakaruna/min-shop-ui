'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Link from 'next/link';

export default function ProductDetailPage({ params }: { params: { id: string } }) {
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);

  const similarProducts = [
    {
      id: '1',
      title: 'Premium Wireless Earbuds',
      image: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800&q=80',
      price: '$199.00',
      originalPrice: '$249.00',
      rating: 4.7,
      badge: 'New',
    },
    {
      id: '2',
      title: 'Studio Quality Headphones',
      image: 'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=800&q=80',
      price: '$349.00',
      rating: 4.8,
      badge: 'Popular',
    },
    {
      id: '3',
      title: 'Bluetooth Speaker Pro',
      image: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=800&q=80',
      price: '$179.00',
      originalPrice: '$229.00',
      rating: 4.6,
    },
    {
      id: '4',
      title: 'Gaming Headset with Mic',
      image: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=800&q=80',
      price: '$159.00',
      rating: 4.5,
      badge: 'Sale',
    },
  ];

  const product = {
    id: params.id,
    title: 'Pro Wireless ANC Headphones',
    category: 'AUDIO & HEADPHONES',
    price: '$299.00',
    originalPrice: '$349.00',
    rating: 4.9,
    reviews: 1247,
    images: [
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80',
      'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=800&q=80',
      'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=800&q=80',
    ],
    description: 'Experience premium sound quality with our Pro Wireless ANC Headphones. Featuring active noise cancellation, 30-hour battery life, and superior comfort for extended listening sessions.',
    features: [
      'Active Noise Cancellation',
      '30-hour battery life',
      'Quick charge (5 min = 3 hours)',
      'Premium comfort design',
      'Hi-Fi audio quality',
    ],
    inStock: true,
    stockCount: 15,
  };

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumbs */}
        <nav className="mb-6">
          <ol className="flex items-center space-x-2 text-sm text-gray-600">
            <li><Link href="/" className="hover:text-mint">Home</Link></li>
            <li>/</li>
            <li><Link href="/products" className="hover:text-mint">Products</Link></li>
            <li>/</li>
            <li className="text-gray-800">{product.title}</li>
          </ol>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-12">
          {/* Product Images */}
          <div>
            <div className="relative h-96 mb-4 rounded-lg overflow-hidden bg-gray-100">
              <Image
                src={product.images[selectedImage]}
                alt={product.title}
                fill
                className="object-cover"
              />
            </div>
            <div className="grid grid-cols-4 gap-4">
              {product.images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={`relative h-24 rounded-lg overflow-hidden border-2 transition-colors ${
                    selectedImage === index ? 'border-mint' : 'border-transparent'
                  }`}
                >
                  <Image
                    src={image}
                    alt={`${product.title} view ${index + 1}`}
                    fill
                    className="object-cover"
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Product Info */}
          <div>
            <p className="text-sm text-gray-500 uppercase mb-2">{product.category}</p>
            <h1 className="text-4xl font-bold text-gray-800 mb-4">{product.title}</h1>
            
            {/* Rating */}
            <div className="flex items-center mb-4">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <svg
                    key={i}
                    className={`w-5 h-5 ${i < Math.floor(product.rating) ? 'text-yellow-400' : 'text-gray-300'}`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <span className="ml-2 text-gray-600">{product.rating} ({product.reviews} reviews)</span>
            </div>

            {/* Price */}
            <div className="mb-6">
              <div className="flex items-center space-x-4">
                <span className="text-4xl font-bold text-mint">{product.price}</span>
                {product.originalPrice && (
                  <span className="text-2xl text-gray-500 line-through">{product.originalPrice}</span>
                )}
              </div>
            </div>

            {/* Description */}
            <p className="text-gray-600 mb-6">{product.description}</p>

            {/* Features */}
            <div className="mb-6">
              <h3 className="font-semibold text-gray-800 mb-3">Key Features:</h3>
              <ul className="space-y-2">
                {product.features.map((feature, index) => (
                  <li key={index} className="flex items-center text-gray-600">
                    <svg className="w-5 h-5 text-mint mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>

            {/* Stock Status */}
            <div className="mb-6">
              {product.inStock ? (
                <p className="text-green-600 font-medium">✓ In Stock ({product.stockCount} available)</p>
              ) : (
                <p className="text-red-600 font-medium">Out of Stock</p>
              )}
            </div>

            {/* Quantity and Add to Cart */}
            <div className="flex items-center space-x-4 mb-6">
              <div className="flex items-center border border-gray-300 rounded-lg">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-4 py-2 text-black hover:bg-gray-100 transition-colors"
                >
                  -
                </button>
                <span className="px-6 text-black py-2 border-x border-gray-300">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="px-4 py-2 text-black hover:bg-gray-100 transition-colors"
                >
                  +
                </button>
              </div>
            </div>

            <div className="flex space-x-4">
              <button className="flex-1 bg-mint text-white py-3 rounded-lg font-medium hover:bg-mint-dark transition-colors flex items-center justify-center space-x-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <span>Add to Cart</span>
              </button>
              <button className="px-6 py-3 border-2 border-mint text-mint rounded-lg font-medium hover:bg-mint/10 transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Similar Products Section */}
        <section className="mt-16 mb-12">
          <div className="mb-8">
            <div className="inline-block bg-mint/10 text-mint-dark px-3 py-1 rounded-full text-xs font-semibold mb-2">
              YOU MAY ALSO LIKE
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">Similar Products</h2>
            <p className="text-base text-gray-600">Products you might be interested in</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {similarProducts.map((item) => (
              <Link
                key={item.id}
                href={`/product/${item.id}`}
                className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 group border border-gray-100 hover:border-mint/30"
              >
                {/* Image */}
                <div className="relative h-48 overflow-hidden">
                  <Image
                    src={item.image}
                    alt={item.title}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  {item.badge && (
                    <div className="absolute top-3 left-3">
                      <span className="bg-mint text-white px-3 py-1 rounded-full text-xs font-medium shadow-lg">
                        {item.badge}
                      </span>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-4">
                  <h3 className="text-base font-bold text-gray-900 mb-2 hover:text-mint transition-colors line-clamp-2">
                    {item.title}
                  </h3>
                  <div className="flex items-center space-x-1 mb-2">
                    {[...Array(5)].map((_, i) => (
                      <svg
                        key={i}
                        className={`w-3 h-3 ${i < Math.floor(item.rating) ? 'text-yellow-400' : 'text-gray-300'}`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                    <span className="text-xs text-gray-600 ml-1">({item.rating})</span>
                  </div>
                  <div className="flex items-center space-x-2 mb-3">
                    <span className="text-xl font-bold text-mint">{item.price}</span>
                    {item.originalPrice && (
                      <span className="text-sm text-gray-400 line-through">{item.originalPrice}</span>
                    )}
                  </div>
                  <button className="w-full bg-mint text-white py-2 rounded-lg font-semibold hover:bg-mint-dark transition-all shadow-sm hover:shadow-md text-center text-sm">
                    View Details
                  </button>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
