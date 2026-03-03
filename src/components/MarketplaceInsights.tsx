import React from 'react';

const trendingAssets = [
  { icon: '🚗', title: 'Electric Vehicles', subtitle: 'High Liquidity', value: '+$12.4k' },
  { icon: '🏠', title: 'Residential Plots', subtitle: 'Trending Search', value: '+$45.1k' },
  { icon: '🎮', title: 'Gaming Hardware', subtitle: 'Fast Mover', value: '+$1.2k' },
];

export default function MarketplaceInsights() {
  return (
    <section className="py-16 bg-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div>
            <h2 className="text-4xl font-bold mb-4">
              <span className="text-gray-200">Marketplace</span>{' '}
              <span className="text-mint">Insights for Pros</span>
            </h2>
            <p className="text-gray-300 text-lg mb-8">
              Real-time data for smart sellers. Track trending assets, monitor sold prices, and grow your business with Mint Hub analytics.
            </p>

            {/* Data Points */}
            <div className="grid grid-cols-2 gap-6 mb-8">
              <div>
                <div className="text-3xl font-bold text-mint mb-1">15% ↑</div>
                <div className="text-gray-400">Luxury SUV Demand</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-mint mb-1">4.2m</div>
                <div className="text-gray-400">Monthly Active Buyers</div>
              </div>
            </div>
          </div>

          {/* Right Content */}
          <div className="bg-gray-700 rounded-lg p-6">
            <div className="mb-6">
              <div className="text-sm text-gray-400 mb-1">This Month</div>
              <h3 className="text-2xl font-bold text-white">Trending Assets</h3>
            </div>

            <div className="space-y-4 mb-6">
              {trendingAssets.map((asset, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 bg-gray-600 rounded-lg"
                >
                  <div className="flex items-center space-x-4">
                    <div className="text-2xl">{asset.icon}</div>
                    <div>
                      <div className="text-white font-medium">{asset.title}</div>
                      <div className="text-gray-400 text-sm">{asset.subtitle}</div>
                    </div>
                  </div>
                  <div className="text-mint font-bold">{asset.value}</div>
                </div>
              ))}
            </div>

            <button className="w-full bg-mint text-white py-3 rounded-lg font-medium hover:bg-mint-dark transition-colors">
              Unlock Full Pro Report
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
