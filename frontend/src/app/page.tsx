'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { Cpu } from 'lucide-react';

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
    <div className="min-h-screen flex flex-col items-center justify-center bg-cyber-bg text-white font-orbitron">
      <div className="flex flex-col items-center space-y-4">
        <div className="p-4 bg-cyber-cyan/10 border-2 border-cyber-cyan rounded-2xl shadow-[0_0_30px_rgba(0,243,255,0.4)]">
          <Cpu className="w-10 h-10 text-cyber-cyan animate-spin" style={{ animationDuration: '3s' }} />
        </div>
        <div className="text-lg font-bold text-cyber-cyan text-neon-cyan tracking-widest animate-pulse">
          INITIALIZING QUANTUM MATRIX...
        </div>
      </div>
    </div>
  );
}
