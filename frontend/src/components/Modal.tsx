'use client';

import React from 'react';
import { X, ShieldAlert } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg bg-cyber-surface/95 border-2 border-cyber-cyan/60 rounded-2xl shadow-[0_0_50px_rgba(0,243,255,0.3)] cyber-clip overflow-hidden">
        
        {/* Holographic Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-cyber-cyan/30 bg-cyber-bg/80">
          <h2 className="font-orbitron font-bold text-base text-cyber-cyan tracking-wider flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-cyber-cyan animate-pulse" />
            {title}
          </h2>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-cyber-pink hover:bg-cyber-pink/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 text-slate-200">{children}</div>

      </div>
    </div>
  );
};
