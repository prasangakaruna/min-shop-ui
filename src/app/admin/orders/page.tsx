'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function AdminOrdersPage() {
  const [filter, setFilter] = useState('all');

  const orders = [
    {
      id: 'ORD-2024-001234',
      customer: 'John Doe',
      email: 'john.doe@example.com',
      date: '2024-03-15',
      status: 'Delivered',
      total: '$299.00',
      items: 1,
      payment: 'Credit Card',
    },
    {
      id: 'ORD-2024-001189',
      customer: 'Jane Smith',
      email: 'jane.smith@example.com',
      date: '2024-03-14',
      status: 'Shipped',
      total: '$458.98',
      items: 2,
      payment: 'PayPal',
    },
    {
      id: 'ORD-2024-001045',
      customer: 'Mike Johnson',
      email: 'mike.j@example.com',
      date: '2024-03-14',
      status: 'Processing',
      total: '$89.00',
      items: 1,
      payment: 'Credit Card',
    },
    {
      id: 'ORD-2024-000892',
      customer: 'Sarah Williams',
      email: 'sarah.w@example.com',
      date: '2024-03-13',
      status: 'Delivered',
      total: '$159.00',
      items: 1,
      payment: 'Credit Card',
    },
    {
      id: 'ORD-2024-000756',
      customer: 'David Brown',
      email: 'david.b@example.com',
      date: '2024-03-13',
      status: 'Cancelled',
      total: '$549.00',
      items: 1,
      payment: 'Credit Card',
    },
    {
      id: 'ORD-2024-000623',
      customer: 'Emily Davis',
      email: 'emily.d@example.com',
      date: '2024-03-12',
      status: 'Shipped',
      total: '$1,499.00',
      items: 1,
      payment: 'Credit Card',
    },
  ];

  const filteredOrders = filter === 'all'
    ? orders
    : orders.filter(order => order.status.toLowerCase() === filter.toLowerCase());

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Delivered':
        return 'bg-green-100 text-green-800';
      case 'Shipped':
        return 'bg-blue-100 text-blue-800';
      case 'Processing':
        return 'bg-yellow-100 text-yellow-800';
      case 'Cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Orders Management</h1>
        <p className="text-gray-600">View and manage all customer orders</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600 text-sm">Total Orders</span>
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-800">{orders.length}</p>
        </div>
        <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600 text-sm">Pending</span>
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-800">{orders.filter(o => o.status === 'Processing').length}</p>
        </div>
        <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600 text-sm">Shipped</span>
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-800">{orders.filter(o => o.status === 'Shipped').length}</p>
        </div>
        <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600 text-sm">Total Revenue</span>
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <p className="text-2xl font-bold text-mint">${orders.reduce((sum, o) => sum + parseFloat(o.total.replace('$', '').replace(',', '')), 0).toLocaleString()}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
        <div className="flex flex-wrap gap-2">
          {['all', 'processing', 'shipped', 'delivered', 'cancelled'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === status
                  ? 'bg-mint text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Order ID</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Customer</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Date</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Items</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Total</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Payment</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredOrders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Link href={`/admin/orders/${order.id}`} className="text-sm font-semibold text-mint hover:text-mint-dark">
                      {order.id}
                    </Link>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-semibold text-gray-800">{order.customer}</div>
                      <div className="text-xs text-gray-500">{order.email}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{order.date}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{order.items}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-semibold text-gray-800">{order.total}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{order.payment}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="px-3 py-1.5 bg-mint/10 text-mint rounded-lg text-sm font-medium hover:bg-mint/20 transition-colors"
                      >
                        View
                      </Link>
                      {order.status === 'Processing' && (
                        <button className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors">
                          Ship
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
