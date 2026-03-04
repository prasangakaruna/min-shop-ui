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
        <div className="text-center mb-8">
          <div className="inline-block bg-mint/10 text-mint-dark px-3 py-1 rounded-full text-xs font-semibold mb-2">
            WHY US
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">Why Choose Mint Hub?</h2>
          <p className="text-base text-gray-600 max-w-2xl mx-auto">Experience the difference with our premium marketplace</p>
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
