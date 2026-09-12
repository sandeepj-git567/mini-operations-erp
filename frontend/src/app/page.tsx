'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { Activity } from 'lucide-react';

export default function Home() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (user) {
        router.push('/dashboard');
      } else {
        router.push('/login');
      }
    }
  }, [user, loading, router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#070a12] text-white font-sans relative overflow-hidden">
      <div className="flex flex-col items-center space-y-4 relative z-10 p-8 rounded-2xl bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 shadow-2xl shadow-cyan-950/40">
        <div className="relative">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center animate-pulse">
            <Activity className="w-6 h-6 text-white" />
          </div>
          <div className="absolute inset-0 rounded-xl bg-cyan-400 blur-lg opacity-40 animate-ping" />
        </div>
        <div className="text-center">
          <div className="text-lg font-black tracking-widest font-display text-white">MINI OPERATIONS ERP</div>
          <div className="text-xs text-slate-400 font-mono mt-1">INITIALIZING SECURITY & LOGISTICS PROTOCOLS...</div>
        </div>
      </div>
    </div>
  );
}

