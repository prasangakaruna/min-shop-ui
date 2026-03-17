import React from 'react';

const levels = [
  {
    title: 'Everyday Shopper',
    tag: 'Customer',
    icon: '🛍️',
    accent: 'from-mint/20 to-mint/5',
    description:
      'Browse verified products, save favourites, and check out in seconds with a clean, personal shopping experience.',
    highlights: ['Smart search & filters', 'Secure, saved checkout', 'Order tracking & history'],
    primaryAction: 'Start shopping',
  },
  {
    title: 'Store Owner',
    tag: 'Seller',
    icon: '🏬',
    accent: 'from-emerald-200/60 to-emerald-50',
    description:
      'Open a Mint store in minutes and manage products, inventory, and orders from one simple workspace.',
    highlights: ['Product & inventory management', 'Customer & order timelines', 'Discounts and promotions'],
    primaryAction: 'Open a store',
  },
  {
    title: 'Pro & Admin',
    tag: 'Advanced',
    icon: '📊',
    accent: 'from-sky-200/60 to-sky-50',
    description:
      'Get a birds‑eye view across stores, finances, and teams with advanced reporting and controls.',
    highlights: ['Multi‑store finance overview', 'Team roles & permissions', 'Deep performance insights'],
    primaryAction: 'View admin tools',
  },
];

export default function UserLevels() {
  return (
    <section className="py-20 bg-gradient-to-b from-white via-mint/5 to-white border-t border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-mint/10 text-mint-dark px-3 py-1 rounded-full text-[11px] font-semibold border border-mint/20 shadow-sm mb-4 tracking-wide">
            <span className="w-1.5 h-1.5 bg-mint rounded-full animate-pulse" />
            USER LEVELS
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-[2.7rem] font-extrabold text-gray-900 mb-3">
            Built for every kind&nbsp;of user
          </h2>
          <p className="text-base md:text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
            From first‑time shoppers to power sellers and admins, Mint tailors the experience, tools, and dashboards
            to the role you play.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {levels.map((level) => (
            <div
              key={level.title}
              className="relative bg-white rounded-2xl p-6 shadow-md hover:shadow-2xl border border-gray-100 transition-all duration-300 hover:-translate-y-1.5 overflow-hidden"
            >
              <div
                className={`pointer-events-none absolute inset-x-0 -top-16 h-32 bg-gradient-to-b ${level.accent} opacity-70`}
              />
              <div className="relative flex items-center justify-between mb-4">
                <div className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold bg-white/90 text-mint border border-mint/30 shadow-sm">
                  {level.tag}
                </div>
                <div className="w-9 h-9 rounded-2xl bg-white/80 flex items-center justify-center text-lg shadow-sm border border-white/70">
                  <span>{level.icon}</span>
                </div>
              </div>

              <h3 className="relative text-xl font-semibold text-gray-900 mb-2">{level.title}</h3>
              <p className="relative text-sm text-gray-600 mb-4 leading-relaxed">{level.description}</p>

              <ul className="relative space-y-1.5 text-sm text-gray-700 mb-5">
                {level.highlights.map((h) => (
                  <li key={h} className="flex items-start gap-2">
                    <span className="mt-0.5 text-mint">•</span>
                    <span>{h}</span>
                  </li>
                ))}
              </ul>

              <button
                type="button"
                className="relative inline-flex items-center gap-1.5 text-[13px] font-semibold text-mint hover:text-mint-dark mt-auto"
              >
                <span>{level.primaryAction}</span>
                <span aria-hidden="true">→</span>
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

