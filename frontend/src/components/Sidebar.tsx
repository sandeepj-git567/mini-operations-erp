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
  Activity,
  Compass
} from 'lucide-react';

export const Sidebar = () => {
  const pathname = usePathname();
  const { user } = useAuth();

  if (!user) return null;

  const navItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: ['ADMIN', 'OPERATIONS_USER', 'SALES_USER'] },
    { name: 'Inventory Matrix', href: '/inventory', icon: Boxes, roles: ['ADMIN', 'OPERATIONS_USER', 'SALES_USER'] },
    { name: 'Work Orders', href: '/work-orders', icon: ClipboardList, roles: ['ADMIN', 'OPERATIONS_USER'] },
    { name: 'Internal Transfers', href: '/transfers', icon: ArrowLeftRight, roles: ['ADMIN', 'OPERATIONS_USER'] },
    { name: 'Customer Orders', href: '/customer-orders', icon: ShoppingCart, roles: ['ADMIN', 'SALES_USER'] },
  ];

  return (
    <aside className="w-64 bg-slate-900/60 border-r border-slate-800/80 min-h-[calc(100vh-4rem)] p-4 flex flex-col justify-between backdrop-blur-xl relative z-40">
      
      <div className="space-y-3">
        <div className="px-3 py-1.5 text-[11px] font-outfit font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 border-b border-slate-800/80 pb-2">
          <Compass className="w-3.5 h-3.5 text-sky-400" />
          <span>System Modules</span>
        </div>

        <div className="space-y-1">
          {navItems
            .filter(item => item.roles.includes(user.role))
            .map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center space-x-3 px-3.5 py-3 rounded-xl text-xs font-outfit font-bold tracking-wide transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-sky-500/20 to-indigo-500/20 text-sky-400 border border-sky-500/40 shadow-lg shadow-sky-500/10'
                      : 'hover:bg-slate-800/60 hover:text-white border border-transparent text-slate-400'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-sky-400' : 'text-slate-500'}`} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
        </div>
      </div>

      {/* Futuristic System Scope Info Card */}
      <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 text-xs space-y-2 shadow-inner">
        <div className="font-outfit font-bold text-slate-200 text-xs flex items-center justify-between border-b border-slate-800/80 pb-1.5">
          <span className="flex items-center gap-1.5 text-sky-400">
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
            ACTIVE ENVIRONMENT
          </span>
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        </div>
        <div className="space-y-1 font-mono-code text-[11px]">
          <div className="flex justify-between text-slate-400">
            <span>ROLE:</span>
            <span className="text-sky-400 font-bold">{user.role}</span>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>LOCATION:</span>
            <span className="text-slate-200 font-medium">{user.location?.name || 'Global'}</span>
          </div>
        </div>
      </div>

    </aside>
  );
};
