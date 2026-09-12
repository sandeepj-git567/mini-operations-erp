'use client';

import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../lib/socket';
import { LogOut, User as UserIcon, Radio, Cpu, ShieldCheck } from 'lucide-react';

export const Navbar = () => {
  const { user, logout } = useAuth();
  const { isConnected } = useSocket();

  if (!user) return null;

  return (
    <header className="bg-cyber-surface/80 border-b border-cyber-cyan/30 backdrop-blur-md sticky top-0 z-50 shadow-[0_4px_25px_rgba(0,243,255,0.15)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand & Logo */}
        <div className="flex items-center space-x-3">
          <div className="relative group cursor-pointer">
            <div className="absolute -inset-1 bg-gradient-to-r from-cyber-cyan to-cyber-pink rounded-lg blur opacity-75 group-hover:opacity-100 transition duration-300"></div>
            <div className="relative bg-cyber-bg border border-cyber-cyan text-cyber-cyan font-orbitron font-extrabold text-sm px-3 py-1.5 rounded-lg tracking-widest flex items-center gap-1.5 shadow-[0_0_15px_rgba(0,243,255,0.4)]">
              <Cpu className="w-4 h-4 animate-spin text-cyber-cyan" style={{ animationDuration: '6s' }} />
              <span>MINI ERP</span>
            </div>
          </div>
          <div>
            <h1 className="font-orbitron font-bold text-white text-base tracking-wider flex items-center gap-2">
              SYSTEM COMMAND CENTER
              <span className="text-[10px] bg-cyber-cyan/20 border border-cyber-cyan/50 text-cyber-cyan px-2 py-0.5 rounded font-mono-code">
                v1.0.0-PROD
              </span>
            </h1>
            <p className="text-xs text-cyber-cyan/70 font-mono-code tracking-tight">Realtime Concurrency Control Matrix</p>
          </div>
        </div>

        {/* Telemetry & Controls */}
        <div className="flex items-center space-x-6">
          
          {/* Live Realtime Telemetry Indicator */}
          <div className="flex items-center space-x-2 bg-cyber-bg/90 px-3.5 py-1.5 rounded-full border border-cyber-cyan/30 shadow-[0_0_15px_rgba(0,243,255,0.1)]">
            <span className={`w-2.5 h-2.5 rounded-full ${isConnected ? 'bg-cyber-green shadow-[0_0_10px_#00ff66] animate-pulse' : 'bg-cyber-pink shadow-[0_0_10px_#ff0055]'}`} />
            <span className="text-xs font-orbitron font-semibold text-slate-300 flex items-center gap-1.5">
              <Radio className={`w-3.5 h-3.5 ${isConnected ? 'text-cyber-green animate-pulse' : 'text-cyber-pink'}`} />
              <span className={isConnected ? 'text-cyber-green text-neon-green' : 'text-cyber-pink text-neon-pink'}>
                {isConnected ? 'LIVE WEBSOCKET ATTACHED' : 'DISCONNECTED'}
              </span>
            </span>
          </div>

          {/* User Profile & Security Scope */}
          <div className="flex items-center space-x-3 pl-4 border-l border-cyber-cyan/20">
            <div className="relative">
              <div className="bg-cyber-cyan/20 p-2 rounded-xl border border-cyber-cyan/50 text-cyber-cyan shadow-[0_0_10px_rgba(0,243,255,0.3)]">
                <UserIcon className="w-4 h-4" />
              </div>
            </div>
            
            <div className="text-left hidden sm:block">
              <div className="font-orbitron font-bold text-xs text-white tracking-wide">{user.name}</div>
              <div className="text-[11px] font-mono-code font-bold text-cyber-cyan flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                {user.role}
              </div>
            </div>

            {/* Cyber Logout Button */}
            <button
              onClick={logout}
              className="p-2 text-slate-400 hover:text-cyber-pink hover:bg-cyber-pink/10 border border-transparent hover:border-cyber-pink/40 rounded-xl transition-all shadow-none hover:shadow-[0_0_15px_rgba(255,0,85,0.3)]"
              title="Terminate Session"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

        </div>
      </div>
    </header>
  );
};
