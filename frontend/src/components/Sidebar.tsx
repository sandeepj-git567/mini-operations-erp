'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  Boxes, 
  ClipboardList, 
  ArrowLeftRight, 
  ShoppingCart, 
  Terminal,
  Activity
} from 'lucide-react';

export const Sidebar = () => {
  const pathname = usePathname();
  const { user } = useAuth();

  if (!user) return null;

  const navItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: ['ADMIN', 'OPERATIONS_USER', 'SALES_USER'] },
    { name: 'Inventory Matrix', href: '/inventory', icon: Boxes, roles: ['ADMIN', 'OPERATIONS_USER', 'SALES_USER'] },
    { name: 'Work Orders', href: '/work-orders', icon: ClipboardList, roles: ['ADMIN', 'OPERATIONS_USER'] },
    { name: 'Stock Transfers', href: '/transfers', icon: ArrowLeftRight, roles: ['ADMIN', 'OPERATIONS_USER'] },
    { name: 'Customer Orders', href: '/customer-orders', icon: ShoppingCart, roles: ['ADMIN', 'SALES_USER'] },
  ];

  return (
    <aside className="w-64 bg-cyber-surface/90 border-r border-cyber-cyan/20 min-h-[calc(100vh-4rem)] p-4 flex flex-col justify-between backdrop-blur-md relative z-40">
      
      {/* Navigation Header & Links */}
      <div className="space-y-3">
        <div className="px-3 py-1.5 text-[10px] font-orbitron font-bold uppercase tracking-widest text-cyber-cyan/70 flex items-center gap-1.5 border-b border-cyber-cyan/20 pb-2">
          <Terminal className="w-3.5 h-3.5 text-cyber-cyan" />
          <span>NAVIGATION PROTOCOLS</span>
        </div>

        <div className="space-y-1.5">
          {navItems
            .filter(item => item.roles.includes(user.role))
            .map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`cyber-clip-sm flex items-center space-x-3 px-3.5 py-3 rounded-lg text-xs font-orbitron font-semibold tracking-wider transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-cyber-cyan/30 to-cyber-purple/40 text-cyber-cyan border border-cyber-cyan shadow-[0_0_15px_rgba(0,243,255,0.4)]'
                      : 'hover:bg-cyber-cyan/10 hover:text-cyber-cyan border border-transparent text-slate-400'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-cyber-cyan animate-pulse' : 'text-slate-500'}`} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
        </div>
      </div>

      {/* Cyberpunk Active Scope Telemetry Box */}
      <div className="bg-cyber-bg/90 border border-cyber-cyan/30 rounded-xl p-3.5 text-xs cyber-clip-sm space-y-2 shadow-[inset_0_0_15px_rgba(0,243,255,0.05)]">
        <div className="font-orbitron font-bold text-white text-[11px] flex items-center justify-between border-b border-cyber-cyan/20 pb-1">
          <span className="flex items-center gap-1.5 text-cyber-cyan">
            <Activity className="w-3.5 h-3.5 text-cyber-green" />
            SECURITY MATRIX
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-cyber-green animate-ping" />
        </div>
        <div className="space-y-1 font-mono-code text-[11px]">
          <div className="flex justify-between text-slate-400">
            <span>ACTIVE ROLE:</span>
            <span className="text-cyber-cyan font-bold">{user.role}</span>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>AZ LOCATION:</span>
            <span className="text-slate-200 font-semibold">{user.location?.name || 'GLOBAL'}</span>
          </div>
        </div>
      </div>

    </aside>
  );
};
