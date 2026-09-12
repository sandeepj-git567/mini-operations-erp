'use client';

import React from 'react';
import { X, Sparkles } from 'lucide-react';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg bg-slate-900/90 border border-slate-800 rounded-2xl shadow-2xl shadow-sky-500/10 overflow-hidden">
        
        {/* Glass Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/40">
          <h2 className="font-outfit font-bold text-base text-white tracking-tight flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-sky-400" />
            {title}
          </h2>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 text-slate-200">{children}</div>

      </div>
    </div>
  );
};
