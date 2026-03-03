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
    <section className="py-16 bg-gradient-to-br from-mint/10 via-white to-mint/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-800 mb-2">Why Choose Mint Hub?</h2>
          <p className="text-gray-600">Experience the difference with our premium marketplace</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-white rounded-xl p-6 shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100"
            >
              <div className="w-12 h-12 bg-mint/10 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl">{feature.icon}</span>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
