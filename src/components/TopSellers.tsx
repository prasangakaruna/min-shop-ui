import React from 'react';
import Image from 'next/image';
import Link from 'next/link';

const topSellers = [
  {
    id: '4',
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80',
    title: 'Pro Wireless ANC Headphones',
    price: '$299.00',
    originalPrice: '$349.00',
    sales: '1,247',
    rating: 4.9,
  },
  {
    id: '5',
    image: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&q=80',
    title: 'Lumix X1 Mirrorless Camera',
    price: '$1,499.00',
    sales: '892',
    rating: 4.7,
  },
  {
    id: '10',
    image: 'https://images.unsplash.com/photo-1541140532154-b024d705b90a?w=800&q=80',
    title: 'Tactile RGB Gaming Keyboard',
    price: '$159.00',
    sales: '654',
    rating: 4.8,
  },
  {
    id: '9',
    image: 'https://images.unsplash.com/photo-1572569511254-d8f925fe2cbb?w=800&q=80',
    title: 'Aura Smart Voice Assistant',
    price: '$89.00',
    originalPrice: '$129.00',
    sales: '523',
    rating: 4.5,
  },
];

export default function TopSellers() {
  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-12">
          <div>
            <h2 className="text-4xl font-bold text-gray-800 mb-2">Top Sellers</h2>
            <p className="text-gray-600">Best performing products this month</p>
          </div>
          <Link
            href="/products"
            className="text-mint font-semibold hover:text-mint-dark transition-colors flex items-center space-x-1"
          >
            <span>View All</span>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {topSellers.map((product, index) => (
            <div
              key={product.id}
              className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 group border border-gray-100 relative"
            >
              {/* Rank Badge */}
              <div className="absolute top-4 left-4 z-10">
                <div className="bg-yellow-400 text-gray-800 w-10 h-10 rounded-full flex items-center justify-center font-bold shadow-lg">
                  #{index + 1}
                </div>
              </div>

              {/* Image */}
              <Link href={`/product/${product.id}`} className="block relative h-48 overflow-hidden">
                <Image
                  src={product.image}
                  alt={product.title}
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-300"
                />
                <div className="absolute top-4 right-4">
                  <span className="bg-mint text-white px-3 py-1 rounded-full text-xs font-medium shadow-lg">
                    Top Seller
                  </span>
                </div>
              </Link>

              {/* Content */}
              <div className="p-5">
                <Link href={`/product/${product.id}`}>
                  <h3 className="text-lg font-bold text-gray-800 mb-2 hover:text-mint transition-colors line-clamp-2">
                    {product.title}
                  </h3>
                </Link>
                <div className="flex items-center space-x-2 mb-2">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <svg
                        key={i}
                        className={`w-4 h-4 ${i < Math.floor(product.rating) ? 'text-yellow-400' : 'text-gray-300'}`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <span className="text-sm text-gray-600">({product.rating})</span>
                </div>
                <div className="flex items-center space-x-2 mb-3">
                  <span className="text-2xl font-bold text-mint">{product.price}</span>
                  {product.originalPrice && (
                    <span className="text-sm text-gray-400 line-through">{product.originalPrice}</span>
                  )}
                </div>
                <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                  <span>{product.sales} sold</span>
                </div>
                <Link
                  href={`/product/${product.id}`}
                  className="block w-full bg-mint text-white py-2.5 rounded-lg font-semibold hover:bg-mint-dark transition-all shadow-sm hover:shadow-md text-center text-sm"
                >
                  View Details
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
