import React from 'react';

export default function Hero() {
  return (
    <section className="relative h-[600px] overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-r from-white/90 via-white/80 to-transparent z-10"></div>
        <div 
          className="absolute inset-0 bg-cover bg-center filter blur-sm"
          style={{
            backgroundImage: 'url("https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1920&q=80")',
          }}
        ></div>
      </div>

      {/* Content */}
      <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center">
        <div className="max-w-2xl">
          {/* Tag */}
          <div className="inline-block bg-mint/10 text-mint-dark px-3 py-1 rounded-full text-sm font-medium mb-4">
            MINT CONDITION MARKETPLACE
          </div>

          {/* Headline */}
          <h1 className="text-5xl md:text-6xl font-bold text-gray-800 mb-6">
            Sell Your Assets{' '}
            <span className="text-mint">With Ease.</span>
          </h1>

          {/* Description */}
          <p className="text-lg text-gray-600 mb-8">
            The premier marketplace for high-value trade. Browse verified cars, luxury villas, and professional tech from trusted sellers.
          </p>

          {/* Search Interface */}
          <div className="bg-white rounded-lg shadow-lg p-4 flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-mint" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search for cars, vill"
                className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mint focus:border-transparent"
              />
            </div>
            <div className="relative">
              <select className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-3 pr-8 focus:ring-2 focus:ring-mint focus:border-transparent">
                <option>All Categories</option>
                <option>Vehicles</option>
                <option>Real Estate</option>
                <option>Electronics</option>
                <option>Industrial Equipment</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
            <button className="bg-mint text-white px-8 py-3 rounded-lg font-medium hover:bg-mint-dark transition-colors flex items-center justify-center space-x-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <span>Search</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
