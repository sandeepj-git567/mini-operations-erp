'use client';

import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiRequest } from '../../lib/api';
import { ShieldCheck, UserCheck, ShoppingBag, ArrowRight } from 'lucide-react';

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
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const setDemoUser = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('Password123!');
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-800 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-sky-600 rounded-xl text-white font-bold text-xl mb-2">
            ERP
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Mini Operations ERP</h1>
          <p className="text-sm text-slate-400">Sign in to access real-time inventory & operations</p>
        </div>

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 px-4 py-3 rounded-xl text-sm font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all text-sm"
              placeholder="user@example.com"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all text-sm"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-sky-600 hover:bg-sky-500 text-white font-semibold py-3 rounded-xl shadow-lg shadow-sky-600/30 transition-all flex items-center justify-center space-x-2 text-sm disabled:opacity-50"
          >
            <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Demo Quick Switcher */}
        <div className="pt-4 border-t border-slate-700/60 space-y-3">
          <div className="text-xs text-center text-slate-400 font-medium">
            Quick One-Click Demo Role Accounts:
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => setDemoUser('admin@example.com')}
              className="flex flex-col items-center p-2.5 bg-slate-900/60 hover:bg-slate-700 border border-slate-700 rounded-xl transition-all text-slate-300 hover:text-white"
            >
              <ShieldCheck className="w-5 h-5 text-sky-400 mb-1" />
              <span className="text-[11px] font-semibold">Admin</span>
            </button>

            <button
              onClick={() => setDemoUser('operations@example.com')}
              className="flex flex-col items-center p-2.5 bg-slate-900/60 hover:bg-slate-700 border border-slate-700 rounded-xl transition-all text-slate-300 hover:text-white"
            >
              <UserCheck className="w-5 h-5 text-emerald-400 mb-1" />
              <span className="text-[11px] font-semibold">Operations</span>
            </button>

            <button
              onClick={() => setDemoUser('sales@example.com')}
              className="flex flex-col items-center p-2.5 bg-slate-900/60 hover:bg-slate-700 border border-slate-700 rounded-xl transition-all text-slate-300 hover:text-white"
            >
              <ShoppingBag className="w-5 h-5 text-amber-400 mb-1" />
              <span className="text-[11px] font-semibold">Sales</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
