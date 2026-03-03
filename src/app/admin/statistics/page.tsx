'use client';

import React, { useState } from 'react';

export default function StatisticsPage() {
  const [timeRange, setTimeRange] = useState('month');

  const chartData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    revenue: [45000, 52000, 48000, 61000, 55000, 67000],
    orders: [320, 380, 350, 420, 390, 450],
  };

  const topSellingProducts = [
    { name: 'Pro Wireless ANC Headphones', sales: 1247, revenue: '$373,253', growth: '+15%' },
    { name: 'Lumix X1 Mirrorless Camera', sales: 892, revenue: '$1,337,108', growth: '+12%' },
    { name: 'Aura Smart Voice Assistant', sales: 654, revenue: '$58,206', growth: '+8%' },
    { name: 'Tactile RGB Gaming Keyboard', sales: 523, revenue: '$83,157', growth: '+22%' },
    { name: '34" Curved UltraWide Monitor', sales: 421, revenue: '$231,129', growth: '+18%' },
  ];

  const customerStats = [
    { label: 'New Customers', value: '1,247', change: '+12.5%', trend: 'up' },
    { label: 'Returning Customers', value: '3,892', change: '+8.3%', trend: 'up' },
    { label: 'Customer Retention', value: '75.8%', change: '+2.1%', trend: 'up' },
    { label: 'Average Order Value', value: '$127.50', change: '+5.7%', trend: 'up' },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Statistics & Analytics</h1>
          <p className="text-gray-600">Comprehensive analytics and performance metrics</p>
        </div>
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          className="border-2 border-gray-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-mint focus:border-mint"
        >
          <option value="week">This Week</option>
          <option value="month">This Month</option>
          <option value="quarter">This Quarter</option>
          <option value="year">This Year</option>
        </select>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {customerStats.map((stat, index) => (
          <div key={index} className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
            <h3 className="text-gray-600 text-sm font-medium mb-2">{stat.label}</h3>
            <div className="flex items-end justify-between">
              <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
              <span className={`text-sm font-semibold ${
                stat.trend === 'up' ? 'text-green-600' : 'text-red-600'
              }`}>
                {stat.change}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Revenue Chart */}
      <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-6">Revenue Trend</h2>
        <div className="h-64 flex items-end justify-between space-x-2">
          {chartData.revenue.map((value, index) => {
            const maxValue = Math.max(...chartData.revenue);
            const height = (value / maxValue) * 100;
            return (
              <div key={index} className="flex-1 flex flex-col items-center">
                <div className="w-full bg-gray-200 rounded-t-lg relative" style={{ height: '200px' }}>
                  <div
                    className="absolute bottom-0 w-full bg-mint rounded-t-lg transition-all hover:bg-mint-dark"
                    style={{ height: `${height}%` }}
                  ></div>
                </div>
                <span className="mt-2 text-xs text-gray-600">{chartData.labels[index]}</span>
                <span className="text-xs font-semibold text-gray-800">${(value / 1000).toFixed(0)}k</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Orders Chart */}
      <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-6">Orders Trend</h2>
        <div className="h-64 flex items-end justify-between space-x-2">
          {chartData.orders.map((value, index) => {
            const maxValue = Math.max(...chartData.orders);
            const height = (value / maxValue) * 100;
            return (
              <div key={index} className="flex-1 flex flex-col items-center">
                <div className="w-full bg-gray-200 rounded-t-lg relative" style={{ height: '200px' }}>
                  <div
                    className="absolute bottom-0 w-full bg-blue-500 rounded-t-lg transition-all hover:bg-blue-600"
                    style={{ height: `${height}%` }}
                  ></div>
                </div>
                <span className="mt-2 text-xs text-gray-600">{chartData.labels[index]}</span>
                <span className="text-xs font-semibold text-gray-800">{value}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Top Selling Products */}
      <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-6">Top Selling Products</h2>
        <div className="space-y-4">
          {topSellingProducts.map((product, index) => (
            <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-4 flex-1">
                <div className="w-10 h-10 bg-mint rounded-lg flex items-center justify-center text-white font-bold">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-800">{product.name}</p>
                  <div className="flex items-center space-x-4 mt-1">
                    <span className="text-sm text-gray-600">{product.sales} sales</span>
                    <span className="text-sm font-semibold text-mint">{product.revenue}</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <span className="text-sm font-semibold text-green-600">{product.growth}</span>
                <p className="text-xs text-gray-500">Growth</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Conversion Rate</h2>
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-32 h-32 rounded-full border-8 border-mint border-t-transparent mb-4">
              <div className="text-center">
                <p className="text-3xl font-bold text-mint">3.2%</p>
                <p className="text-sm text-gray-600">+0.5%</p>
              </div>
            </div>
            <p className="text-sm text-gray-600">Visitor to Customer Conversion</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Average Order Value</h2>
          <div className="text-center">
            <p className="text-4xl font-bold text-mint mb-2">$127.50</p>
            <p className="text-sm text-gray-600 mb-4">+5.7% from last month</p>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Last Month</span>
                <span className="font-semibold text-gray-800">$120.65</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">This Month</span>
                <span className="font-semibold text-mint">$127.50</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
