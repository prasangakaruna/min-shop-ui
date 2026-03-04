import React from 'react';

const features = [
  {
    icon: '✓',
    title: 'Verified Sellers',
    description: 'All sellers are verified and trusted',
  },
  {
    icon: '🚚',
    title: 'Fast Delivery',
    description: 'Quick and secure shipping worldwide',
  },
  {
    icon: '🔒',
    title: 'Secure Payment',
    description: '100% secure payment processing',
  },
  {
    icon: '💬',
    title: '24/7 Support',
    description: 'Round-the-clock customer service',
  },
  {
    icon: '↩️',
    title: 'Easy Returns',
    description: 'Hassle-free return policy',
  },
  {
    icon: '⭐',
    title: 'Quality Guaranteed',
    description: 'Premium quality products only',
  },
];

export default function WhyChooseUs() {
  return (
    <section className="py-16 bg-gray-50 border-t border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-3">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-mint/30 to-transparent"></div>
            <div className="inline-flex items-center gap-2 bg-mint/10 text-mint-dark px-3 py-1 rounded-full text-xs font-bold border border-mint/20 shadow-sm">
              <span className="w-1.5 h-1.5 bg-mint rounded-full animate-pulse"></span>
              WHY US
            </div>
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-mint/30 to-transparent"></div>
          </div>
          <div className="space-y-1.5">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-gray-900 leading-tight">
              Why Choose{' '}
              <span className="relative inline-block">
                <span className="relative z-10 bg-gradient-to-r from-mint to-mint-dark bg-clip-text text-transparent">
                  Mint Hub
                </span>
                <span className="absolute bottom-1.5 left-0 right-0 h-2.5 bg-mint/20 -z-0 transform -skew-x-12"></span>
              </span>
              ?
            </h2>
            <p className="text-base md:text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Experience the difference with our premium marketplace
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-white rounded-xl p-5 shadow-md hover:shadow-lg transition-all duration-300 border border-gray-100 group hover:-translate-y-1"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-mint/20 to-mint/10 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <span className="text-2xl">{feature.icon}</span>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">{feature.title}</h3>
              <p className="text-gray-600 text-sm leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
