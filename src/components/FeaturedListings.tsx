import React from 'react';
import Image from 'next/image';
import Link from 'next/link';

const listings = [
  {
    id: '1',
    image: 'https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?w=800&q=80',
    tag: { text: 'Verified Mint', position: 'left' },
    title: '2024 Electric Signature SUV',
    price: '$84,900',
    location: 'Los Angeles, CA',
    tags: ['Automatic', 'Electric', '0 miles'],
  },
  {
    id: '2',
    image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80',
    tag: { text: 'New Listing', position: 'right' },
    title: 'Waterfront Modern Villa',
    price: '$2.4M',
    location: 'Miami Beach, FL',
    tags: ['5 Bed', '6 Bath', '4,200 sqft'],
  },
  {
    id: '3',
    image: 'https://images.unsplash.com/photo-1606983340126-99ab4feaa64a?w=800&q=80',
    tag: { text: 'Best Deal', position: 'left' },
    title: '8K Professional Cinema Camera',
    price: '$12,500',
    location: 'New York, NY',
    tags: ['Gently Used', 'Complete Kit'],
  },
  {
    id: '4',
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80',
    tag: { text: 'Top Seller', position: 'right' },
    title: 'Pro Wireless ANC Headphones',
    price: '$299.00',
    location: 'San Francisco, CA',
    tags: ['Noise Cancelling', '30hr Battery'],
  },
  {
    id: '5',
    image: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&q=80',
    tag: { text: 'Premium', position: 'left' },
    title: 'Lumix X1 Mirrorless Camera',
    price: '$1,499.00',
    location: 'Seattle, WA',
    tags: ['4K Video', 'Professional'],
  },
  {
    id: '6',
    image: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=800&q=80',
    tag: { text: 'Hot Deal', position: 'right' },
    title: '2023 Luxury Sports Sedan',
    price: '$65,000',
    location: 'Austin, TX',
    tags: ['Low Miles', 'Certified'],
  },
  {
    id: '7',
    image: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=800&q=80',
    tag: { text: 'Fresh', position: 'left' },
    title: 'Organic Premium Grocery Bundle',
    price: '$89.99',
    location: 'Portland, OR',
    tags: ['Organic', 'Fresh Daily'],
  },
  {
    id: '8',
    image: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=800&q=80',
    tag: { text: 'New Arrival', position: 'right' },
    title: '34" Curved UltraWide Monitor',
    price: '$549.00',
    location: 'Denver, CO',
    tags: ['4K Display', '144Hz'],
  },
  {
    id: '9',
    image: 'https://images.unsplash.com/photo-1572569511254-d8f925fe2cbb?w=800&q=80',
    tag: { text: 'Smart Home', position: 'left' },
    title: 'Aura Smart Voice Assistant',
    price: '$89.00',
    originalPrice: '$129.00',
    location: 'Chicago, IL',
    tags: ['AI Powered', 'Voice Control'],
  },
];

export default function FeaturedListings() {
  // Show first 6 listings, rest can be viewed via "View All"
  const displayedListings = listings.slice(0, 6);

  return (
    <section className="py-16 bg-white relative overflow-hidden border-t border-gray-100">
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-12 gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <div className="inline-flex items-center gap-2 bg-mint/10 text-mint-dark px-3 py-1 rounded-full text-xs font-bold border border-mint/20 shadow-sm">
                <span className="w-1.5 h-1.5 bg-mint rounded-full animate-pulse"></span>
                FEATURED
              </div>
              <div className="flex-1 h-px bg-gradient-to-r from-mint/30 to-transparent"></div>
            </div>
            <div className="space-y-1.5">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-gray-900 leading-tight">
                Featured{' '}
                <span className="relative inline-block">
                  <span className="relative z-10 bg-gradient-to-r from-mint to-mint-dark bg-clip-text text-transparent">
                    Listings
                  </span>
                  <span className="absolute bottom-1.5 left-0 right-0 h-2.5 bg-mint/20 -z-0 transform -skew-x-12"></span>
                </span>
              </h2>
              <p className="text-base md:text-lg text-gray-600 max-w-2xl leading-relaxed">
                Premium assets from verified sellers
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
          {displayedListings.map((listing) => (
            <div
              key={listing.id}
              className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 group border border-mint/10 hover:border-mint/30"
            >
              {/* Image */}
              <Link href={`/product/${listing.id}`} className="block relative h-40 overflow-hidden">
                <Image
                  src={listing.image}
                  alt={listing.title}
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-white/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                {listing.tag && (
                  <div
                    className={`absolute top-4 ${
                      listing.tag.position === 'left' ? 'left-4' : 'right-4'
                    }`}
                  >
                    <span className="bg-mint text-white px-3 py-1 rounded-full text-sm font-medium shadow-lg">
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
                      className="bg-mint/10 text-mint-dark px-2 py-0.5 rounded-full text-xs font-medium"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <Link
                  href={`/product/${listing.id}`}
                  className="block w-full bg-mint text-white py-2 rounded-lg font-semibold hover:bg-mint-dark transition-all shadow-sm hover:shadow-md text-center text-sm"
                >
                  View Details
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* View More Button */}
        {listings.length > 6 && (
          <div className="mt-12 text-center">
            <Link
              href="/products"
              className="inline-block bg-mint text-white px-8 py-3 rounded-lg font-semibold hover:bg-mint-dark transition-all shadow-md hover:shadow-lg"
            >
              View All {listings.length} Listings
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
