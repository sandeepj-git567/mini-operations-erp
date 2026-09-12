'use client';

import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiRequest } from '../../lib/api';
import { Cyber3DCard } from '../../components/Cyber3DCard';
import { ShieldCheck, UserCheck, ShoppingBag, Terminal, Lock, Mail, Cpu, ArrowRight } from 'lucide-react';

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
    <div className="min-h-screen bg-cyber-bg flex items-center justify-center p-4 relative overflow-hidden">
      
      {/* Ambient Cyber Neon Background Orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyber-cyan/10 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyber-pink/10 rounded-full blur-3xl pointer-events-none animate-pulse" style={{ animationDuration: '4s' }} />

      <Cyber3DCard className="w-full max-w-md bg-cyber-surface/90 border-2 border-cyber-cyan/40 p-8 space-y-6 shadow-[0_0_50px_rgba(0,243,255,0.25)]">
        
        {/* Terminal Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-cyber-cyan/30 to-cyber-purple/40 border-2 border-cyber-cyan rounded-2xl text-cyber-cyan shadow-[0_0_20px_rgba(0,243,255,0.5)] mb-1">
            <Cpu className="w-8 h-8 animate-pulse" />
          </div>
          <h1 className="text-2xl font-orbitron font-extrabold text-white tracking-widest text-neon-cyan">
            BIOMETRIC ACCESS
          </h1>
          <p className="text-xs font-mono-code text-cyber-cyan/70 tracking-tight flex items-center justify-center gap-1">
            <Terminal className="w-3.5 h-3.5" />
            SECURE QUANTUM OPERATIONS MATRIX
          </p>
        </div>

        {error && (
          <div className="bg-cyber-pink/10 border border-cyber-pink/50 text-cyber-pink px-4 py-3 rounded-xl text-xs font-orbitron font-bold tracking-wider text-neon-pink">
            [ACCESS DENIED]: {error}
          </div>
        )}

        {/* Credentials Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[11px] font-orbitron font-bold text-cyber-cyan/90 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-cyber-cyan" />
              IDENTIFIER (EMAIL)
            </label>
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-cyber-bg/90 border border-cyber-cyan/30 focus:border-cyber-cyan rounded-xl px-4 py-3 text-white font-mono-code text-xs placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-cyber-cyan/50 transition-all"
                placeholder="operator@matrix.net"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-orbitron font-bold text-cyber-cyan/90 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-cyber-cyan" />
              SECURITY KEY (PASSWORD)
            </label>
            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-cyber-bg/90 border border-cyber-cyan/30 focus:border-cyber-cyan rounded-xl px-4 py-3 text-white font-mono-code text-xs placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-cyber-cyan/50 transition-all"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full cyber-button py-3.5 rounded-xl font-orbitron font-bold text-xs tracking-widest flex items-center justify-center space-x-2 disabled:opacity-50 mt-2"
          >
            <span>{loading ? 'SYNCHRONIZING CREDENTIALS...' : 'AUTHENTICATE ACCESS'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Cyber Quick Switcher */}
        <div className="pt-4 border-t border-cyber-cyan/20 space-y-3">
          <div className="text-[10px] font-orbitron font-bold text-center text-slate-400 uppercase tracking-wider">
            PRESET SECURITY ROLE OVERRIDES:
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => setDemoUser('admin@example.com')}
              className="flex flex-col items-center p-2.5 bg-cyber-bg/80 hover:bg-cyber-cyan/20 border border-cyber-cyan/30 hover:border-cyber-cyan rounded-xl transition-all text-slate-300 hover:text-white group"
            >
              <ShieldCheck className="w-5 h-5 text-cyber-cyan mb-1 group-hover:scale-110 transition-transform" />
              <span className="text-[10px] font-orbitron font-bold">ADMIN</span>
            </button>

            <button
              onClick={() => setDemoUser('operations@example.com')}
              className="flex flex-col items-center p-2.5 bg-cyber-bg/80 hover:bg-cyber-green/20 border border-cyber-green/30 hover:border-cyber-green rounded-xl transition-all text-slate-300 hover:text-white group"
            >
              <UserCheck className="w-5 h-5 text-cyber-green mb-1 group-hover:scale-110 transition-transform" />
              <span className="text-[10px] font-orbitron font-bold">OPS USER</span>
            </button>

            <button
              onClick={() => setDemoUser('sales@example.com')}
              className="flex flex-col items-center p-2.5 bg-cyber-bg/80 hover:bg-cyber-yellow/20 border border-cyber-yellow/30 hover:border-cyber-yellow rounded-xl transition-all text-slate-300 hover:text-white group"
            >
              <ShoppingBag className="w-5 h-5 text-cyber-yellow mb-1 group-hover:scale-110 transition-transform" />
              <span className="text-[10px] font-orbitron font-bold">SALES</span>
            </button>
          </div>
        </div>

      </Cyber3DCard>
    </div>
  );
}
