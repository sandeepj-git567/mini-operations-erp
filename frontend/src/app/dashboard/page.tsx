'use client';

import React, { useEffect, useState } from 'react';
import { Navbar } from '../../components/Navbar';
import { Sidebar } from '../../components/Sidebar';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../lib/socket';
import { apiRequest } from '../../lib/api';
import { 
  Boxes, 
  AlertTriangle, 
  ClipboardList, 
  ArrowLeftRight, 
  ShoppingCart,
  TrendingUp
} from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const { user } = useAuth();
  const { subscribe } = useSocket();
  const [stats, setStats] = useState({
    totalItems: 0,
    lowStockCount: 0,
    openWorkOrders: 0,
    pendingTransfers: 0,
    todayOrders: 0
  });
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      const [inv, wo, trf, ord] = await Promise.all([
        apiRequest('/inventory'),
        apiRequest('/work-orders'),
        apiRequest('/transfers'),
        apiRequest('/orders')
      ]);

      const lowStock = inv.filter((item: any) => item.availableQuantity < 10);
      const openWO = wo.filter((item: any) => item.status !== 'COMPLETED');
      const pendingTRF = trf.filter((item: any) => item.status === 'REQUESTED' || item.status === 'DISPATCHED');

      setStats({
        totalItems: inv.length,
        lowStockCount: lowStock.length,
        openWorkOrders: openWO.length,
        pendingTransfers: pendingTRF.length,
        todayOrders: ord.length
      });
    } catch (err) {
      console.error('Failed loading dashboard metrics', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();

    // Subscribe to realtime updates
    const unsubInv = subscribe('INVENTORY_UPDATED', fetchDashboardData);
    const unsubWO = subscribe('WORK_ORDER_UPDATED', fetchDashboardData);
    const unsubTRF = subscribe('TRANSFER_DISPATCHED', fetchDashboardData);
    const unsubOrd = subscribe('ORDER_RESERVED', fetchDashboardData);

    return () => {
      unsubInv();
      unsubWO();
      unsubTRF();
      unsubOrd();
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-8 max-w-7xl mx-auto space-y-8">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">Operations Dashboard</h1>
            <p className="text-sm text-slate-500">Real-time overview of inventory levels, work orders, transfers, and customer demand.</p>
          </div>

          {/* Metric Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Items</span>
                <div className="p-2 bg-sky-50 text-sky-600 rounded-xl">
                  <Boxes className="w-5 h-5" />
                </div>
              </div>
              <div className="text-3xl font-extrabold text-slate-800">{loading ? '...' : stats.totalItems}</div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Low Stock</span>
                <div className="p-2 bg-rose-50 text-rose-600 rounded-xl">
                  <AlertTriangle className="w-5 h-5" />
                </div>
              </div>
              <div className="text-3xl font-extrabold text-slate-800">{loading ? '...' : stats.lowStockCount}</div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Open Work Orders</span>
                <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                  <ClipboardList className="w-5 h-5" />
                </div>
              </div>
              <div className="text-3xl font-extrabold text-slate-800">{loading ? '...' : stats.openWorkOrders}</div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pending Transfers</span>
                <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
                  <ArrowLeftRight className="w-5 h-5" />
                </div>
              </div>
              <div className="text-3xl font-extrabold text-slate-800">{loading ? '...' : stats.pendingTransfers}</div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Orders</span>
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                  <ShoppingCart className="w-5 h-5" />
                </div>
              </div>
              <div className="text-3xl font-extrabold text-slate-800">{loading ? '...' : stats.todayOrders}</div>
            </div>
          </div>

          {/* Quick Flow Navigation */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <h2 className="text-lg font-bold text-slate-800">Complete Business Lifecycle Workflow</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Link href="/inventory" className="group p-4 bg-slate-50 hover:bg-sky-50 border border-slate-200 hover:border-sky-300 rounded-xl transition-all">
                <div className="flex items-center space-x-3 mb-2">
                  <div className="p-2 bg-sky-600 text-white rounded-lg">
                    <Boxes className="w-5 h-5" />
                  </div>
                  <div className="font-bold text-slate-800 group-hover:text-sky-600">1. Stock Check</div>
                </div>
                <p className="text-xs text-slate-500">Monitor physical, reserved, and available quantity across warehouses.</p>
              </Link>

              <Link href="/work-orders" className="group p-4 bg-slate-50 hover:bg-amber-50 border border-slate-200 hover:border-amber-300 rounded-xl transition-all">
                <div className="flex items-center space-x-3 mb-2">
                  <div className="p-2 bg-amber-600 text-white rounded-lg">
                    <ClipboardList className="w-5 h-5" />
                  </div>
                  <div className="font-bold text-slate-800 group-hover:text-amber-600">2. Work Orders</div>
                </div>
                <p className="text-xs text-slate-500">Create work orders, check material availability, and identify shortages.</p>
              </Link>

              <Link href="/transfers" className="group p-4 bg-slate-50 hover:bg-purple-50 border border-slate-200 hover:border-purple-300 rounded-xl transition-all">
                <div className="flex items-center space-x-3 mb-2">
                  <div className="p-2 bg-purple-600 text-white rounded-lg">
                    <ArrowLeftRight className="w-5 h-5" />
                  </div>
                  <div className="font-bold text-slate-800 group-hover:text-purple-600">3. Stock Transfers</div>
                </div>
                <p className="text-xs text-slate-500">Transfer stock between Bangalore and Chennai with dispatch & receive controls.</p>
              </Link>

              <Link href="/customer-orders" className="group p-4 bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 rounded-xl transition-all">
                <div className="flex items-center space-x-3 mb-2">
                  <div className="p-2 bg-emerald-600 text-white rounded-lg">
                    <ShoppingCart className="w-5 h-5" />
                  </div>
                  <div className="font-bold text-slate-800 group-hover:text-emerald-600">4. Customer Orders</div>
                </div>
                <p className="text-xs text-slate-500">Create sales orders and execute atomic PostgreSQL stock reservations.</p>
              </Link>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
