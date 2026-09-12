'use client';

import React, { useEffect, useState } from 'react';
import { Navbar } from '../../components/Navbar';
import { Sidebar } from '../../components/Sidebar';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../lib/socket';
import { apiRequest } from '../../lib/api';
import { Cyber3DCard } from '../../components/Cyber3DCard';
import { 
  Boxes, 
  AlertTriangle, 
  ClipboardList, 
  ArrowLeftRight, 
  ShoppingCart,
  Zap,
  Activity,
  Terminal
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
    <div className="min-h-screen bg-cyber-bg flex flex-col">
      <Navbar />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-6 max-w-7xl mx-auto space-y-6">
          
          {/* Header & Status Banner */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-cyber-cyan/20 pb-4">
            <div>
              <h1 className="text-2xl font-orbitron font-extrabold text-white tracking-widest text-neon-cyan flex items-center gap-2">
                <Activity className="w-6 h-6 text-cyber-cyan animate-pulse" />
                QUANTUM TELEMETRY DASHBOARD
              </h1>
              <p className="text-xs font-mono-code text-cyber-cyan/70 mt-1">Real-time dynamic monitoring across inventory nodes & transfer vectors.</p>
            </div>
            <div className="flex items-center gap-2 bg-cyber-surface/90 border border-cyber-green/40 px-3.5 py-1.5 rounded-xl text-xs font-orbitron font-bold text-cyber-green">
              <Zap className="w-4 h-4 text-cyber-green animate-pulse" />
              <span>ATOMIC SYNC ENGINE: ACTIVE</span>
            </div>
          </div>

          {/* 3D Cyber Metric Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            
            <Cyber3DCard glowColor="cyan" className="p-4 bg-cyber-surface/80 flex flex-col justify-between space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-orbitron font-bold text-cyber-cyan/80 uppercase tracking-widest">TOTAL ITEMS</span>
                <div className="p-2 bg-cyber-cyan/10 border border-cyber-cyan/40 text-cyber-cyan rounded-lg">
                  <Boxes className="w-4 h-4" />
                </div>
              </div>
              <div className="text-3xl font-orbitron font-extrabold text-white text-neon-cyan">{loading ? '...' : stats.totalItems}</div>
            </Cyber3DCard>

            <Cyber3DCard glowColor="pink" className="p-4 bg-cyber-surface/80 flex flex-col justify-between space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-orbitron font-bold text-cyber-pink/80 uppercase tracking-widest">LOW STOCK</span>
                <div className="p-2 bg-cyber-pink/10 border border-cyber-pink/40 text-cyber-pink rounded-lg">
                  <AlertTriangle className="w-4 h-4" />
                </div>
              </div>
              <div className="text-3xl font-orbitron font-extrabold text-cyber-pink text-neon-pink">{loading ? '...' : stats.lowStockCount}</div>
            </Cyber3DCard>

            <Cyber3DCard glowColor="purple" className="p-4 bg-cyber-surface/80 flex flex-col justify-between space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-orbitron font-bold text-cyber-purple/80 uppercase tracking-widest">OPEN WORK ORDERS</span>
                <div className="p-2 bg-cyber-purple/10 border border-cyber-purple/40 text-cyber-purple rounded-lg">
                  <ClipboardList className="w-4 h-4" />
                </div>
              </div>
              <div className="text-3xl font-orbitron font-extrabold text-white">{loading ? '...' : stats.openWorkOrders}</div>
            </Cyber3DCard>

            <Cyber3DCard glowColor="cyan" className="p-4 bg-cyber-surface/80 flex flex-col justify-between space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-orbitron font-bold text-cyber-cyan/80 uppercase tracking-widest">TRANSFERS</span>
                <div className="p-2 bg-cyber-cyan/10 border border-cyber-cyan/40 text-cyber-cyan rounded-lg">
                  <ArrowLeftRight className="w-4 h-4" />
                </div>
              </div>
              <div className="text-3xl font-orbitron font-extrabold text-white">{loading ? '...' : stats.pendingTransfers}</div>
            </Cyber3DCard>

            <Cyber3DCard glowColor="green" className="p-4 bg-cyber-surface/80 flex flex-col justify-between space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-orbitron font-bold text-cyber-green/80 uppercase tracking-widest">DEMAND ORDERS</span>
                <div className="p-2 bg-cyber-green/10 border border-cyber-green/40 text-cyber-green rounded-lg">
                  <ShoppingCart className="w-4 h-4" />
                </div>
              </div>
              <div className="text-3xl font-orbitron font-extrabold text-cyber-green text-neon-green">{loading ? '...' : stats.todayOrders}</div>
            </Cyber3DCard>

          </div>

          {/* Futuristic Business Protocol Flow */}
          <Cyber3DCard glowColor="cyan" className="p-6 bg-cyber-surface/90 space-y-4">
            <div className="flex items-center justify-between border-b border-cyber-cyan/20 pb-3">
              <h2 className="font-orbitron font-bold text-base text-white tracking-wider flex items-center gap-2">
                <Terminal className="w-5 h-5 text-cyber-cyan" />
                OPERATIONAL LIFECYCLE PROTOCOLS
              </h2>
              <span className="text-[10px] font-mono-code text-cyber-cyan bg-cyber-cyan/10 px-2.5 py-1 rounded border border-cyber-cyan/40">
                POSTGRES ATOMIC ENGINE
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              
              <Link href="/inventory">
                <div className="cyber-card p-4 rounded-xl border border-cyber-cyan/30 hover:border-cyber-cyan transition-all group space-y-2">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-cyber-cyan/20 border border-cyber-cyan text-cyber-cyan rounded-lg group-hover:scale-110 transition-transform">
                      <Boxes className="w-5 h-5" />
                    </div>
                    <div className="font-orbitron font-bold text-xs text-white group-hover:text-cyber-cyan tracking-wider">1. STOCK MATRIX</div>
                  </div>
                  <p className="text-[11px] font-mono-code text-slate-400">Monitor physical, reserved & available items across warehouses.</p>
                </div>
              </Link>

              <Link href="/work-orders">
                <div className="cyber-card p-4 rounded-xl border border-cyber-yellow/30 hover:border-cyber-yellow transition-all group space-y-2">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-cyber-yellow/20 border border-cyber-yellow text-cyber-yellow rounded-lg group-hover:scale-110 transition-transform">
                      <ClipboardList className="w-5 h-5" />
                    </div>
                    <div className="font-orbitron font-bold text-xs text-white group-hover:text-cyber-yellow tracking-wider">2. WORK ORDERS</div>
                  </div>
                  <p className="text-[11px] font-mono-code text-slate-400">Issue assembly work orders, calculate material shortages & check availability.</p>
                </div>
              </Link>

              <Link href="/transfers">
                <div className="cyber-card p-4 rounded-xl border border-cyber-purple/30 hover:border-cyber-purple transition-all group space-y-2">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-cyber-purple/20 border border-cyber-purple text-cyber-purple rounded-lg group-hover:scale-110 transition-transform">
                      <ArrowLeftRight className="w-5 h-5" />
                    </div>
                    <div className="font-orbitron font-bold text-xs text-white group-hover:text-cyber-purple tracking-wider">3. STOCK TRANSFERS</div>
                  </div>
                  <p className="text-[11px] font-mono-code text-slate-400">Transfer stock between BLR & MAA hubs with atomic dispatch & receipt.</p>
                </div>
              </Link>

              <Link href="/customer-orders">
                <div className="cyber-card p-4 rounded-xl border border-cyber-green/30 hover:border-cyber-green transition-all group space-y-2">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-cyber-green/20 border border-cyber-green text-cyber-green rounded-lg group-hover:scale-110 transition-transform">
                      <ShoppingCart className="w-5 h-5" />
                    </div>
                    <div className="font-orbitron font-bold text-xs text-white group-hover:text-cyber-green tracking-wider">4. ATOMIC RESERVATIONS</div>
                  </div>
                  <p className="text-[11px] font-mono-code text-slate-400">Execute PostgreSQL SELECT FOR UPDATE stock reservations with 409 protection.</p>
                </div>
              </Link>

            </div>
          </Cyber3DCard>

        </main>
      </div>
    </div>
  );
}
