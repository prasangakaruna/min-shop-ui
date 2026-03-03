'use client';

import React from 'react';
import Link from 'next/link';

export default function AdminDashboard() {
  const stats = [
    {
      title: 'Total Revenue',
      value: '$124,580',
      change: '+12.5%',
      changeType: 'positive',
      icon: '💰',
      color: 'bg-green-500',
    },
    {
      title: 'Total Orders',
      value: '1,247',
      change: '+8.2%',
      changeType: 'positive',
      icon: '🛒',
      color: 'bg-blue-500',
    },
    {
      title: 'Total Products',
      value: '2,450',
      change: '+15',
      changeType: 'positive',
      icon: '📦',
      color: 'bg-mint',
    },
    {
      title: 'Active Users',
      value: '8,924',
      change: '+5.3%',
      changeType: 'positive',
      icon: '👥',
      color: 'bg-purple-500',
    },
  ];

  const recentOrders = [
    { id: 'ORD-001', customer: 'John Doe', amount: '$299.00', status: 'Delivered', date: '2024-03-15' },
    { id: 'ORD-002', customer: 'Jane Smith', amount: '$458.98', status: 'Shipped', date: '2024-03-14' },
    { id: 'ORD-003', customer: 'Mike Johnson', amount: '$89.00', status: 'Processing', date: '2024-03-14' },
    { id: 'ORD-004', customer: 'Sarah Williams', amount: '$159.00', status: 'Delivered', date: '2024-03-13' },
    { id: 'ORD-005', customer: 'David Brown', amount: '$549.00', status: 'Shipped', date: '2024-03-13' },
  ];

  const topProducts = [
    { name: 'Pro Wireless ANC Headphones', sales: 1247, revenue: '$373,253' },
    { name: 'Lumix X1 Mirrorless Camera', sales: 892, revenue: '$1,337,108' },
    { name: 'Aura Smart Voice Assistant', sales: 654, revenue: '$58,206' },
    { name: 'Tactile RGB Gaming Keyboard', sales: 523, revenue: '$83,157' },
    { name: '34" Curved UltraWide Monitor', sales: 421, revenue: '$231,129' },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Dashboard Overview</h1>
        <p className="text-gray-600">Welcome back! Here&apos;s what&apos;s happening with your store today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white rounded-xl shadow-md p-6 border border-gray-100 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 ${stat.color} rounded-lg flex items-center justify-center text-2xl`}>
                {stat.icon}
              </div>
              <span className={`text-sm font-semibold ${
                stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
              }`}>
                {stat.change}
              </span>
            </div>
            <h3 className="text-gray-600 text-sm font-medium mb-1">{stat.title}</h3>
            <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-800">Recent Orders</h2>
            <Link href="/admin/orders" className="text-mint hover:text-mint-dark text-sm font-medium">
              View All →
            </Link>
          </div>
          <div className="space-y-4">
            {recentOrders.map((order) => (
              <div key={order.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div>
                  <p className="font-semibold text-gray-800">{order.id}</p>
                  <p className="text-sm text-gray-600">{order.customer}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-800">{order.amount}</p>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    order.status === 'Delivered'
                      ? 'bg-green-100 text-green-800'
                      : order.status === 'Shipped'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {order.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-800">Top Products</h2>
            <Link href="/admin/products" className="text-mint hover:text-mint-dark text-sm font-medium">
              View All →
            </Link>
          </div>
          <div className="space-y-4">
            {topProducts.map((product, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-mint rounded-lg flex items-center justify-center text-white font-bold">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">{product.name}</p>
                    <p className="text-xs text-gray-600">{product.sales} sales</p>
                  </div>
                </div>
                <p className="font-bold text-mint">{product.revenue}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/admin/products/add"
            className="p-4 bg-mint text-white rounded-lg font-medium hover:bg-mint-dark transition-colors flex items-center justify-center space-x-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>Add New Product</span>
          </Link>
          <Link
            href="/admin/orders"
            className="p-4 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors flex items-center justify-center space-x-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>Manage Orders</span>
          </Link>
          <Link
            href="/admin/finance"
            className="p-4 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 transition-colors flex items-center justify-center space-x-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <span>View Finance</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
