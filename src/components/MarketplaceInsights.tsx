import React from 'react';

const trendingAssets = [
  { icon: '🚗', title: 'Electric Vehicles', subtitle: 'High Liquidity', value: '+$12.4k' },
  { icon: '🏠', title: 'Residential Plots', subtitle: 'Trending Search', value: '+$45.1k' },
  { icon: '🎮', title: 'Gaming Hardware', subtitle: 'Fast Mover', value: '+$1.2k' },
];

export default function MarketplaceInsights() {
  return (
    <section className="py-16 bg-gray-50 border-t border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          {/* Left Content */}
          <div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              <span className="text-gray-800">Marketplace</span>{' '}
              <span className="text-mint">Insights for Pros</span>
            </h2>
            <p className="text-gray-600 text-base mb-6">
              Real-time data for smart sellers. Track trending assets, monitor sold prices, and grow your business with Mint Hub analytics.
            </p>

            {/* Data Points */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <div className="text-2xl font-bold text-mint mb-1">15% ↑</div>
                <div className="text-gray-600 text-sm">Luxury SUV Demand</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-mint mb-1">4.2m</div>
                <div className="text-gray-600 text-sm">Monthly Active Buyers</div>
              </div>
            </div>
          </div>

          {/* Right Content */}
          <div className="bg-white rounded-xl p-5 shadow-lg border border-gray-100">
            <div className="mb-5">
              <div className="text-xs text-gray-500 mb-1">This Month</div>
              <h3 className="text-xl font-bold text-gray-900">Trending Assets</h3>
            </div>

            <div className="space-y-3 mb-5">
              {trendingAssets.map((asset, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100"
                >
                  <div className="flex items-center space-x-3">
                    <div className="text-xl">{asset.icon}</div>
                    <div>
                      <div className="text-gray-900 font-medium text-sm">{asset.title}</div>
                      <div className="text-gray-600 text-xs">{asset.subtitle}</div>
                    </div>
                  </div>
                  <div className="text-mint font-bold text-sm">{asset.value}</div>
                </div>
              ))}
            </div>

            <button className="w-full bg-mint text-white py-2.5 rounded-lg font-medium hover:bg-mint-dark transition-colors text-sm">
              Unlock Full Pro Report
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
