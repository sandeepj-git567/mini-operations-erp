'use client';

import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../lib/socket';
import { LogOut, User as UserIcon, Radio } from 'lucide-react';

export const Navbar = () => {
  const { user, logout } = useAuth();
  const { isConnected } = useSocket();

  if (!user) return null;

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="bg-sky-600 text-white font-bold text-lg p-2 rounded-lg tracking-wider">
            ERP
          </div>
          <div>
            <h1 className="font-bold text-slate-800 text-lg leading-tight">Mini Operations ERP</h1>
            <p className="text-xs text-slate-500">Realtime Inventory & Order Control</p>
          </div>
        </div>

        <div className="flex items-center space-x-6">
          {/* Live Realtime Indicator */}
          <div className="flex items-center space-x-2 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-200">
            <span className={`w-2.5 h-2.5 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
            <span className="text-xs font-semibold text-slate-600 flex items-center gap-1">
              <Radio className="w-3.5 h-3.5 text-slate-400" />
              {isConnected ? 'Live Connected' : 'Disconnected'}
            </span>
          </div>

          {/* User info */}
          <div className="flex items-center space-x-3 pl-4 border-l border-slate-200">
            <div className="bg-slate-100 p-2 rounded-full text-slate-600">
              <UserIcon className="w-5 h-5" />
            </div>
            <div className="text-left hidden sm:block">
              <div className="font-semibold text-sm text-slate-800">{user.name}</div>
              <div className="text-xs font-mono font-medium text-sky-600">{user.role}</div>
            </div>
            <button
              onClick={logout}
              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
