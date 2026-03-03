import React from 'react';
import Link from 'next/link';

const offers = [
  {
    id: 1,
    title: 'Flash Sale',
    subtitle: 'Up to 50% Off',
    description: 'Limited time offers on premium electronics',
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80',
    link: '/products?category=electronics',
    color: 'bg-red-500',
  },
  {
    id: 2,
    title: 'New Arrivals',
    subtitle: 'Fresh Stock',
    description: 'Check out our latest additions',
    image: 'https://images.unsplash.com/photo-1572569511254-d8f925fe2cbb?w=800&q=80',
    link: '/products',
    color: 'bg-blue-500',
  },
  {
    id: 3,
    title: 'Premium Deals',
    subtitle: 'Luxury Items',
    description: 'Exclusive deals on high-end products',
    image: 'https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?w=800&q=80',
    link: '/products',
    color: 'bg-mint',
  },
];

export default function SpecialOffers() {
  return (
    <section className="py-16 bg-gradient-to-br from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <h2 className="text-4xl font-bold text-gray-800 mb-2">Special Offers</h2>
          <p className="text-gray-600">Don't miss out on these amazing deals</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {offers.map((offer) => (
            <Link
              key={offer.id}
              href={offer.link}
              className="relative group overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300"
            >
              <div
                className="relative h-64 bg-cover bg-center"
                style={{ backgroundImage: `url(${offer.image})` }}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent"></div>
                <div className={`absolute top-4 right-4 ${offer.color} text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg`}>
                  {offer.subtitle}
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                  <h3 className="text-2xl font-bold mb-2 group-hover:text-mint transition-colors">
                    {offer.title}
                  </h3>
                  <p className="text-gray-200 text-sm mb-4">{offer.description}</p>
                  <div className="flex items-center text-mint font-semibold">
                    <span>Shop Now</span>
                    <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
