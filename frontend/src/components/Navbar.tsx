'use client';

import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../lib/socket';
import { LogOut, User as UserIcon, Radio, ShieldCheck, Layers } from 'lucide-react';

export const Navbar = () => {
  const { user, logout } = useAuth();
  const { isConnected } = useSocket();

  if (!user) return null;

  return (
    <header className="bg-slate-900/80 border-b border-slate-800/80 backdrop-blur-xl sticky top-0 z-50 shadow-xl shadow-black/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand & Logo */}
        <div className="flex items-center space-x-3">
          <div className="bg-gradient-to-tr from-sky-600 to-indigo-600 p-2 rounded-xl text-white shadow-lg shadow-sky-500/25 flex items-center justify-center">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-outfit font-extrabold text-white text-lg leading-tight tracking-tight flex items-center gap-2">
              MINI OPERATIONS ERP
              <span className="text-[10px] font-mono-code font-bold bg-sky-500/10 border border-sky-500/30 text-sky-400 px-2 py-0.5 rounded-full">
                v1.0.0
              </span>
            </h1>
            <p className="text-xs text-slate-400 font-medium">Realtime Enterprise Concurrency Engine</p>
          </div>
        </div>

        {/* Telemetry & User Controls */}
        <div className="flex items-center space-x-5">
          
          {/* Live WebSocket Realtime Indicator */}
          <div className="flex items-center space-x-2 bg-slate-950/80 px-3.5 py-1.5 rounded-full border border-slate-800 shadow-inner">
            <span className={`w-2.5 h-2.5 rounded-full ${isConnected ? 'bg-emerald-400 shadow-[0_0_10px_#34d399] animate-pulse' : 'bg-rose-500 shadow-[0_0_10px_#f87171]'}`} />
            <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5 font-outfit">
              <Radio className={`w-3.5 h-3.5 ${isConnected ? 'text-emerald-400 animate-pulse' : 'text-rose-400'}`} />
              <span className={isConnected ? 'text-emerald-400' : 'text-rose-400'}>
                {isConnected ? 'Realtime Connected' : 'Disconnected'}
              </span>
            </span>
          </div>

          {/* User info */}
          <div className="flex items-center space-x-3 pl-4 border-l border-slate-800">
            <div className="bg-slate-800 p-2 rounded-xl text-sky-400 border border-slate-700/60 shadow-md">
              <UserIcon className="w-4 h-4" />
            </div>
            <div className="text-left hidden sm:block">
              <div className="font-outfit font-bold text-sm text-white">{user.name}</div>
              <div className="text-[11px] font-mono-code font-semibold text-sky-400 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-sky-400" />
                {user.role}
              </div>
            </div>
            
            <button
              onClick={logout}
              className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/30 rounded-xl transition-all"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

        </div>
      </div>
    </header>
  );
};
