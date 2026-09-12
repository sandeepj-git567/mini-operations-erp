'use client';

import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiRequest } from '../../lib/api';
import { FuturisticCard } from '../../components/FuturisticCard';
import { ShieldCheck, UserCheck, ShoppingBag, Layers, Lock, Mail, ArrowRight, Sparkles } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('admin@example.com');
  const [password, setPassword] = useState('Password123!');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });
      login(res.token, res.user);
    } catch (err: any) {
      setError(err.message || 'Authentication Matrix Failed');
    } finally {
      setLoading(false);
    }
  };

  const setDemoUser = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('Password123!');
  };

  return (
    <div className="min-h-screen bg-dark-bg flex items-center justify-center p-4 relative overflow-hidden">
      
      {/* Ambient Radial Gradient Aura */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-sky-500/10 rounded-full blur-[140px] pointer-events-none" />

      <FuturisticCard glow="cyan" className="w-full max-w-md bg-slate-900/80 border border-slate-800 p-8 space-y-6 shadow-2xl shadow-sky-500/10">
        
        {/* Brand Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-tr from-sky-600 to-indigo-600 rounded-2xl text-white shadow-xl shadow-sky-500/25 mb-1">
            <Layers className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-outfit font-extrabold text-white tracking-tight flex items-center justify-center gap-2">
            MINI OPERATIONS ERP
          </h1>
          <p className="text-xs text-slate-400 font-medium tracking-tight flex items-center justify-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-sky-400" />
            Enterprise Realtime Operations Matrix
          </p>
        </div>

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 px-4 py-3 rounded-xl text-xs font-semibold">
            {error}
          </div>
        )}

        {/* Credentials Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-outfit font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-sky-400" />
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-slate-950/80 border border-slate-800 focus:border-sky-500 rounded-xl px-4 py-3 text-white font-medium text-xs placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-sky-500/40 transition-all"
              placeholder="user@example.com"
            />
          </div>

          <div>
            <label className="block text-xs font-outfit font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-sky-400" />
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full bg-slate-950/80 border border-slate-800 focus:border-sky-500 rounded-xl px-4 py-3 text-white font-medium text-xs placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-sky-500/40 transition-all"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-futuristic py-3.5 rounded-xl font-outfit font-bold text-xs tracking-wider flex items-center justify-center space-x-2 disabled:opacity-50 mt-2"
          >
            <span>{loading ? 'Authenticating...' : 'Sign In to Portal'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Demo Role Switcher */}
        <div className="pt-4 border-t border-slate-800/80 space-y-3">
          <div className="text-[11px] font-outfit font-bold text-center text-slate-400 uppercase tracking-wider">
            Quick One-Click Demo Role Accounts:
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => setDemoUser('admin@example.com')}
              className="flex flex-col items-center p-2.5 bg-slate-950/60 hover:bg-slate-800 border border-slate-800 hover:border-sky-500/40 rounded-xl transition-all text-slate-300 hover:text-white group"
            >
              <ShieldCheck className="w-5 h-5 text-sky-400 mb-1 group-hover:scale-110 transition-transform" />
              <span className="text-[11px] font-outfit font-bold">Admin</span>
            </button>

            <button
              onClick={() => setDemoUser('operations@example.com')}
              className="flex flex-col items-center p-2.5 bg-slate-950/60 hover:bg-slate-800 border border-slate-800 hover:border-emerald-500/40 rounded-xl transition-all text-slate-300 hover:text-white group"
            >
              <UserCheck className="w-5 h-5 text-emerald-400 mb-1 group-hover:scale-110 transition-transform" />
              <span className="text-[11px] font-outfit font-bold">Operations</span>
            </button>

            <button
              onClick={() => setDemoUser('sales@example.com')}
              className="flex flex-col items-center p-2.5 bg-slate-950/60 hover:bg-slate-800 border border-slate-800 hover:border-amber-500/40 rounded-xl transition-all text-slate-300 hover:text-white group"
            >
              <ShoppingBag className="w-5 h-5 text-amber-400 mb-1 group-hover:scale-110 transition-transform" />
              <span className="text-[11px] font-outfit font-bold">Sales</span>
            </button>
          </div>
        </div>

      </FuturisticCard>
    </div>
  );
}
