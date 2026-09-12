'use client';

import React, { useEffect, useState } from 'react';
import { Navbar } from '../../components/Navbar';
import { Sidebar } from '../../components/Sidebar';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../lib/socket';
import { apiRequest } from '../../lib/api';
import { FuturisticCard } from '../../components/FuturisticCard';
import { 
  Boxes, 
  AlertTriangle, 
  ClipboardList, 
  ArrowLeftRight, 
  ShoppingCart,
  Zap,
  Activity,
  Compass
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
    <div className="min-h-screen bg-dark-bg flex flex-col">
      <Navbar />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-6 max-w-7xl mx-auto space-y-6">
          
          {/* Header Banner */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
            <div>
              <h1 className="text-2xl font-outfit font-extrabold text-white tracking-tight flex items-center gap-2">
                <Activity className="w-6 h-6 text-sky-400" />
                OPERATIONS MATRIX DASHBOARD
              </h1>
              <p className="text-xs text-slate-400 font-medium mt-1">Real-time dynamic monitoring across inventory nodes & transfer vectors.</p>
            </div>
            <div className="flex items-center gap-2 bg-slate-900/80 border border-emerald-500/30 px-3.5 py-1.5 rounded-xl text-xs font-outfit font-bold text-emerald-400 shadow-md">
              <Zap className="w-4 h-4 text-emerald-400 animate-pulse" />
              <span>ATOMIC CONCURRENCY ENGINE: ACTIVE</span>
            </div>
          </div>

          {/* 3D Metric Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            
            <FuturisticCard glow="cyan" className="p-4 flex flex-col justify-between space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-outfit font-bold text-slate-400 uppercase tracking-wider">TOTAL ITEMS</span>
                <div className="p-2 bg-sky-500/10 border border-sky-500/30 text-sky-400 rounded-xl">
                  <Boxes className="w-4 h-4" />
                </div>
              </div>
              <div className="text-3xl font-outfit font-extrabold text-white">{loading ? '...' : stats.totalItems}</div>
            </FuturisticCard>

            <FuturisticCard glow="rose" className="p-4 flex flex-col justify-between space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-outfit font-bold text-slate-400 uppercase tracking-wider">LOW STOCK</span>
                <div className="p-2 bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-xl">
                  <AlertTriangle className="w-4 h-4" />
                </div>
              </div>
              <div className="text-3xl font-outfit font-extrabold text-rose-400">{loading ? '...' : stats.lowStockCount}</div>
            </FuturisticCard>

            <FuturisticCard glow="amber" className="p-4 flex flex-col justify-between space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-outfit font-bold text-slate-400 uppercase tracking-wider">OPEN WORK ORDERS</span>
                <div className="p-2 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-xl">
                  <ClipboardList className="w-4 h-4" />
                </div>
              </div>
              <div className="text-3xl font-outfit font-extrabold text-amber-400">{loading ? '...' : stats.openWorkOrders}</div>
            </FuturisticCard>

            <FuturisticCard glow="indigo" className="p-4 flex flex-col justify-between space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-outfit font-bold text-slate-400 uppercase tracking-wider">PENDING TRANSFERS</span>
                <div className="p-2 bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 rounded-xl">
                  <ArrowLeftRight className="w-4 h-4" />
                </div>
              </div>
              <div className="text-3xl font-outfit font-extrabold text-indigo-400">{loading ? '...' : stats.pendingTransfers}</div>
            </FuturisticCard>

            <FuturisticCard glow="emerald" className="p-4 flex flex-col justify-between space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-outfit font-bold text-slate-400 uppercase tracking-wider">DEMAND ORDERS</span>
                <div className="p-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-xl">
                  <ShoppingCart className="w-4 h-4" />
                </div>
              </div>
              <div className="text-3xl font-outfit font-extrabold text-emerald-400">{loading ? '...' : stats.todayOrders}</div>
            </FuturisticCard>

          </div>

          {/* Futuristic Business Workflow Portal */}
          <FuturisticCard glow="cyan" className="p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <h2 className="font-outfit font-bold text-base text-white tracking-tight flex items-center gap-2">
                <Compass className="w-5 h-5 text-sky-400" />
                OPERATIONAL BUSINESS PROTOCOLS
              </h2>
              <span className="text-[10px] font-mono-code font-bold text-sky-400 bg-sky-500/10 px-2.5 py-1 rounded-full border border-sky-500/30">
                POSTGRES ATOMIC ENGINE
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              
              <Link href="/inventory">
                <div className="glass-panel p-4 rounded-xl border border-slate-800 hover:border-sky-500/50 transition-all group space-y-2">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-sky-500/20 border border-sky-500/40 text-sky-400 rounded-xl group-hover:scale-110 transition-transform">
                      <Boxes className="w-5 h-5" />
                    </div>
                    <div className="font-outfit font-bold text-xs text-white group-hover:text-sky-400 tracking-wide">1. Inventory Control</div>
                  </div>
                  <p className="text-[11px] font-medium text-slate-400">Monitor physical, reserved & available stock levels across warehouses.</p>
                </div>
              </Link>

              <Link href="/work-orders">
                <div className="glass-panel p-4 rounded-xl border border-slate-800 hover:border-amber-500/50 transition-all group space-y-2">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-amber-500/20 border border-amber-500/40 text-amber-400 rounded-xl group-hover:scale-110 transition-transform">
                      <ClipboardList className="w-5 h-5" />
                    </div>
                    <div className="font-outfit font-bold text-xs text-white group-hover:text-amber-400 tracking-wide">2. Work Orders</div>
                  </div>
                  <p className="text-[11px] font-medium text-slate-400">Issue assembly work orders, calculate material shortages & check availability.</p>
                </div>
              </Link>

              <Link href="/transfers">
                <div className="glass-panel p-4 rounded-xl border border-slate-800 hover:border-indigo-500/50 transition-all group space-y-2">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-indigo-500/20 border border-indigo-500/40 text-indigo-400 rounded-xl group-hover:scale-110 transition-transform">
                      <ArrowLeftRight className="w-5 h-5" />
                    </div>
                    <div className="font-outfit font-bold text-xs text-white group-hover:text-indigo-400 tracking-wide">3. Stock Transfers</div>
                  </div>
                  <p className="text-[11px] font-medium text-slate-400">Transfer stock between BLR & MAA hubs with atomic dispatch & receipt.</p>
                </div>
              </Link>

              <Link href="/customer-orders">
                <div className="glass-panel p-4 rounded-xl border border-slate-800 hover:border-emerald-500/50 transition-all group space-y-2">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 rounded-xl group-hover:scale-110 transition-transform">
                      <ShoppingCart className="w-5 h-5" />
                    </div>
                    <div className="font-outfit font-bold text-xs text-white group-hover:text-emerald-400 tracking-wide">4. Customer Orders</div>
                  </div>
                  <p className="text-[11px] font-medium text-slate-400">Execute PostgreSQL SELECT FOR UPDATE stock reservations with 409 protection.</p>
                </div>
              </Link>

            </div>
          </FuturisticCard>

        </main>
      </div>
    </div>
  );
}
