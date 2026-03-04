import React from 'react';
import Image from 'next/image';
import Link from 'next/link';

const newArrivals = [
  {
    id: '10',
    image: 'https://images.unsplash.com/photo-1541140532154-b024d705b90a?w=800&q=80',
    tag: { text: 'Just In', position: 'left' },
    title: 'Tactile RGB Gaming Keyboard',
    price: '$159.00',
    location: 'Las Vegas, NV',
    tags: ['Mechanical', 'RGB'],
  },
  {
    id: '11',
    image: 'https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?w=800&q=80',
    tag: { text: 'New', position: 'right' },
    title: 'Ultra-Sync HDMI 2.1 Cable',
    price: '$24.99',
    location: 'Phoenix, AZ',
    tags: ['8K Ready', 'Premium'],
  },
  {
    id: '12',
    image: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=800&q=80',
    tag: { text: 'Hot', position: 'left' },
    title: 'Sunglasses Pro Collection',
    price: '$199.00',
    location: 'San Diego, CA',
    tags: ['UV Protection', 'Designer'],
  },
  {
    id: '13',
    image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&q=80',
    tag: { text: 'Fresh', position: 'right' },
    title: 'Organic Farm Fresh Produce',
    price: '$45.99',
    location: 'Sacramento, CA',
    tags: ['Organic', 'Local'],
  },
  {
    id: '14',
    image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&q=80',
    tag: { text: 'Trending', position: 'left' },
    title: 'Designer Fashion Collection',
    price: '$349.00',
    location: 'New York, NY',
    tags: ['Designer', 'Limited'],
  },
  {
    id: '15',
    image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&q=80',
    tag: { text: 'New', position: 'right' },
    title: 'Modern Luxury Furniture Set',
    price: '$2,899.00',
    location: 'Boston, MA',
    tags: ['Premium', 'Complete Set'],
  },
];

export default function NewArrivals() {
  return (
    <section className="py-16 bg-white border-t border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-12 gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-bold border border-blue-200 shadow-sm">
                <span className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-pulse"></span>
                NEW ARRIVALS
              </div>
              <div className="flex-1 h-px bg-gradient-to-r from-blue-400/30 to-transparent"></div>
            </div>
            <div className="space-y-1.5">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-gray-900 leading-tight">
                New{' '}
                <span className="relative inline-block">
                  <span className="relative z-10 bg-gradient-to-r from-mint to-mint-dark bg-clip-text text-transparent">
                    Arrivals
                  </span>
                  <span className="absolute bottom-1.5 left-0 right-0 h-2.5 bg-mint/20 -z-0 transform -skew-x-12"></span>
                </span>
              </h2>
              <p className="text-base md:text-lg text-gray-600 max-w-2xl leading-relaxed">
                Latest additions to our marketplace
              </p>
            </div>
          </div>
          <div className="flex-shrink-0">
            <Link
              href="/products"
              className="inline-flex items-center space-x-2 group bg-white border-2 border-mint/30 text-mint-dark px-5 py-2.5 rounded-xl font-semibold hover:bg-mint hover:text-white hover:border-mint transition-all duration-300 shadow-md hover:shadow-xl"
            >
              <span>View All</span>
              <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>

        {/* Listing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {newArrivals.map((listing) => (
            <div
              key={listing.id}
              className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-all duration-300 group border border-gray-100"
            >
              {/* Image */}
              <Link href={`/product/${listing.id}`} className="block relative h-40 overflow-hidden">
                <Image
                  src={listing.image}
                  alt={listing.title}
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-300"
                />
                {listing.tag && (
                  <div
                    className={`absolute top-4 ${
                      listing.tag.position === 'left' ? 'left-4' : 'right-4'
                    }`}
                  >
                    <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-medium shadow-lg">
                      {listing.tag.text}
                    </span>
                  </div>
                )}
              </Link>

              {/* Content */}
              <div className="p-4">
                <Link href={`/product/${listing.id}`}>
                  <h3 className="text-base font-bold text-gray-900 mb-1.5 hover:text-mint transition-colors line-clamp-2">
                    {listing.title}
                  </h3>
                </Link>
                <p className="text-xl font-bold text-mint mb-2">{listing.price}</p>
                <p className="text-xs text-gray-600 mb-3 flex items-center">
                  <svg className="w-3 h-3 mr-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {listing.location}
                </p>
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {listing.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full text-xs font-medium"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <Link
                  href={`/product/${listing.id}`}
                  className="block w-full bg-mint text-white py-2 rounded-lg font-semibold hover:bg-mint-dark transition-all shadow-sm hover:shadow-md text-center text-xs"
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
