import React from 'react';

const stats = [
  {
    number: '4.2M+',
    label: 'Active Buyers',
    icon: '👥',
    color: 'text-blue-600',
  },
  {
    number: '125K+',
    label: 'Verified Sellers',
    icon: '✅',
    color: 'text-green-600',
  },
  {
    number: '$2.4B+',
    label: 'Total Sales',
    icon: '💰',
    color: 'text-yellow-600',
  },
  {
    number: '98.5%',
    label: 'Satisfaction Rate',
    icon: '⭐',
    color: 'text-mint',
  },
];

export default function StatsSection() {
  return (
    <section className="py-16 bg-white relative overflow-hidden border-t border-gray-100">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%234FD1C7' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-3">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-mint/30 to-transparent"></div>
            <div className="inline-flex items-center gap-2 bg-mint/10 text-mint-dark px-3 py-1 rounded-full text-xs font-bold border border-mint/20 shadow-sm">
              <span className="w-1.5 h-1.5 bg-mint rounded-full animate-pulse"></span>
              TRUSTED BY MILLIONS
            </div>
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-mint/30 to-transparent"></div>
          </div>
          <div className="space-y-1.5">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-gray-900 leading-tight">
              Trusted by{' '}
              <span className="relative inline-block">
                <span className="relative z-10 bg-gradient-to-r from-mint to-mint-dark bg-clip-text text-transparent">
                  Millions
                </span>
                <span className="absolute bottom-1.5 left-0 right-0 h-2.5 bg-mint/20 -z-0 transform -skew-x-12"></span>
              </span>
              {' '}Worldwide
            </h2>
            <p className="text-base md:text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Join the community of satisfied buyers and sellers
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="text-center group"
            >
              <div className="inline-flex items-center justify-center w-14 h-14 bg-mint/10 rounded-xl mb-3 group-hover:bg-mint/20 transition-all duration-300">
                <span className="text-2xl">{stat.icon}</span>
              </div>
              <div className={`text-3xl md:text-4xl font-bold ${stat.color} mb-2`}>
                {stat.number}
              </div>
              <div className="text-gray-600 font-medium text-sm">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
