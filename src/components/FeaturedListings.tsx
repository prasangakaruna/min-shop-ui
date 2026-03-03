import React from 'react';
import Image from 'next/image';

const listings = [
  {
    id: 1,
    image: 'https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?w=800&q=80',
    tag: { text: 'Verified Mint', position: 'left' },
    title: '2024 Electric Signature...',
    price: '$84,900',
    location: 'Los Angeles, CA',
    tags: ['Automatic', 'Electric', '0 miles'],
  },
  {
    id: 2,
    image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80',
    tag: { text: 'New Listing', position: 'right' },
    title: 'Waterfront Modern Villa',
    price: '$2.4M',
    location: 'Miami Beach, FL',
    tags: ['5 Bed', '6 Bath', '4,200 sqft'],
  },
  {
    id: 3,
    image: 'https://images.unsplash.com/photo-1606983340126-99ab4feaa64a?w=800&q=80',
    tag: null,
    title: '8K Professional Cinema...',
    price: '$12,500',
    location: 'New York, NY',
    tags: ['Gently Used', 'Complete Kit'],
  },
];

export default function FeaturedListings() {
  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <h2 className="text-4xl font-bold text-gray-800 mb-12">Featured Listings</h2>

        {/* Listing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {listings.map((listing) => (
            <div
              key={listing.id}
              className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300"
            >
              {/* Image */}
              <div className="relative h-48 overflow-hidden">
                <Image
                  src={listing.image}
                  alt={listing.title}
                  fill
                  className="object-cover"
                />
                {listing.tag && (
                  <div
                    className={`absolute top-4 ${
                      listing.tag.position === 'left' ? 'left-4' : 'right-4'
                    }`}
                  >
                    <span className="bg-mint text-white px-3 py-1 rounded-full text-sm font-medium">
                      {listing.tag.text}
                    </span>
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-800 mb-2">{listing.title}</h3>
                <p className="text-2xl font-bold text-mint mb-3">{listing.price}</p>
                <p className="text-gray-600 mb-4">{listing.location}</p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {listing.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <button className="w-full bg-mint text-white py-2.5 rounded-lg font-medium hover:bg-mint-dark transition-all shadow-sm hover:shadow-md">
                  View Details
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
