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
    icon: '⚡',
    gradient: 'from-red-500/20 to-red-600/20',
    badgeColor: 'bg-red-500',
  },
  {
    id: 2,
    title: 'New Arrivals',
    subtitle: 'Fresh Stock',
    description: 'Check out our latest additions',
    image: 'https://images.unsplash.com/photo-1572569511254-d8f925fe2cbb?w=800&q=80',
    link: '/products',
    color: 'bg-blue-500',
    icon: '🆕',
    gradient: 'from-blue-500/20 to-blue-600/20',
    badgeColor: 'bg-blue-500',
  },
  {
    id: 3,
    title: 'Premium Deals',
    subtitle: 'Luxury Items',
    description: 'Exclusive deals on high-end products',
    image: 'https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?w=800&q=80',
    link: '/products',
    color: 'bg-mint',
    icon: '💎',
    gradient: 'from-mint/20 to-mint-dark/20',
    badgeColor: 'bg-mint',
  },
];

export default function SpecialOffers({ storeSlug }: { storeSlug?: string | null }) {
  const withStore = (href: string) => {
    if (!storeSlug) return href;
    const joiner = href.includes('?') ? '&' : '?';
    return `${href}${joiner}store=${encodeURIComponent(storeSlug)}`;
  };

  return (
    <section className="py-16 bg-gray-50 relative overflow-hidden border-t border-gray-100">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%234FD1C7' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}></div>
      </div>
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <div className="flex items-center justify-center gap-3 mb-3">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-red-400/30 to-transparent"></div>
            <div className="inline-flex items-center gap-2 bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-bold border border-red-200 shadow-sm">
              <span className="w-1.5 h-1.5 bg-red-600 rounded-full animate-pulse"></span>
              ⏰ LIMITED TIME
            </div>
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-red-400/30 to-transparent"></div>
          </div>
          <div className="space-y-1.5">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-gray-900 leading-tight">
              Special{' '}
              <span className="relative inline-block">
                <span className="relative z-10 bg-gradient-to-r from-mint to-mint-dark bg-clip-text text-transparent">
                  Offers
                </span>
                <span className="absolute bottom-1.5 left-0 right-0 h-2.5 bg-mint/20 -z-0 transform -skew-x-12"></span>
              </span>
            </h2>
            <p className="text-base md:text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Don't miss out on these amazing deals and exclusive offers
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {offers.map((offer) => (
            <Link
              key={offer.id}
              href={withStore(offer.link)}
              className="relative group overflow-hidden rounded-2xl bg-white shadow-xl hover:shadow-2xl transition-all duration-300 border border-gray-100 hover:border-mint/30 hover:-translate-y-1"
            >
              {/* Image Background */}
              <div
                className="relative h-64 bg-cover bg-center group-hover:scale-110 transition-transform duration-700"
                style={{ backgroundImage: `url(${offer.image})` }}
              >
                {/* Gradient Overlays */}
                <div className={`absolute inset-0 bg-gradient-to-br ${offer.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 via-gray-900/30 to-transparent"></div>
                
                {/* Icon Badge */}
                <div className="absolute top-4 left-4 z-10">
                  <div className="w-14 h-14 bg-white/90 backdrop-blur-sm rounded-xl flex items-center justify-center text-3xl shadow-lg group-hover:scale-110 group-hover:bg-white transition-all duration-300">
                    {offer.icon}
                  </div>
                </div>
                
                {/* Discount Badge */}
                <div className={`absolute top-4 right-4 ${offer.badgeColor} text-white px-4 py-2 rounded-xl text-sm font-bold shadow-xl group-hover:scale-110 transition-transform duration-300`}>
                  {offer.subtitle}
                </div>
                
                {/* Content */}
                <div className="absolute bottom-0 left-0 right-0 p-6 text-white z-10">
                  <h3 className="text-2xl font-bold mb-2 group-hover:text-mint-light transition-colors duration-300">
                    {offer.title}
                  </h3>
                  <p className="text-white/90 text-sm mb-4 leading-relaxed">{offer.description}</p>
                  <div className="flex items-center text-white group-hover:text-mint-light transition-colors duration-300">
                    <span className="text-base font-semibold mr-2">Shop Now</span>
                    <svg className="w-5 h-5 group-hover:translate-x-2 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
        
        {/* View All Offers Button */}
        <div className="text-center mt-10">
          <Link 
            href={withStore('/products')}
            className="inline-flex items-center space-x-2 bg-mint text-white px-8 py-3 rounded-xl font-semibold hover:bg-mint-dark transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
          >
            <span>View All Offers</span>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
}
