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
  Users 
} from 'lucide-react';

export const Sidebar = () => {
  const pathname = usePathname();
  const { user } = useAuth();

  if (!user) return null;

  const navItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: ['ADMIN', 'OPERATIONS_USER', 'SALES_USER'] },
    { name: 'Inventory', href: '/inventory', icon: Boxes, roles: ['ADMIN', 'OPERATIONS_USER', 'SALES_USER'] },
    { name: 'Work Orders', href: '/work-orders', icon: ClipboardList, roles: ['ADMIN', 'OPERATIONS_USER'] },
    { name: 'Internal Transfers', href: '/transfers', icon: ArrowLeftRight, roles: ['ADMIN', 'OPERATIONS_USER'] },
    { name: 'Customer Orders', href: '/customer-orders', icon: ShoppingCart, roles: ['ADMIN', 'SALES_USER'] },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 min-h-[calc(100vh-4rem)] p-4 flex flex-col justify-between">
      <div className="space-y-1">
        <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
          Main Navigation
        </div>
        {navItems
          .filter(item => item.roles.includes(user.role))
          .map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30'
                    : 'hover:bg-slate-800 hover:text-white text-slate-300'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.name}</span>
              </Link>
            );
          })}
      </div>

      <div className="bg-slate-800/60 rounded-lg p-3 text-xs border border-slate-700/50">
        <div className="font-semibold text-slate-200 mb-1">Active Scope</div>
        <div className="text-slate-400">Role: <span className="text-sky-400 font-mono">{user.role}</span></div>
        <div className="text-slate-400">Location: <span className="text-slate-300">{user.location?.name || 'Global'}</span></div>
      </div>
    </aside>
  );
};
