'use client';

import React, { useState, useRef } from 'react';

interface FuturisticCardProps {
  children: React.ReactNode;
  className?: string;
  glow?: 'cyan' | 'indigo' | 'emerald' | 'amber' | 'rose';
}

export const FuturisticCard: React.FC<FuturisticCardProps> = ({
  children,
  className = '',
  glow = 'cyan'
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotX = ((y - centerY) / centerY) * -6; // 6 deg tilt
    const rotY = ((x - centerX) / centerX) * 6;

    setRotateX(rotX);
    setRotateY(rotY);
  };

  const handleMouseEnter = () => setIsHovered(true);
  const handleMouseLeave = () => {
    setIsHovered(false);
    setRotateX(0);
    setRotateY(0);
  };

  const glowBorderClass = {
    cyan: 'hover:border-sky-400/50 hover:shadow-glow-cyan',
    indigo: 'hover:border-indigo-400/50 hover:shadow-glow-purple',
    emerald: 'hover:border-emerald-400/50 hover:shadow-glow-emerald',
    amber: 'hover:border-amber-400/50 hover:shadow-[0_0_25px_rgba(251,191,36,0.25)]',
    rose: 'hover:border-rose-400/50 hover:shadow-[0_0_25px_rgba(248,113,113,0.25)]'
  }[glow];

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        transform: isHovered
          ? `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(6px)`
          : 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateZ(0px)',
        transition: isHovered ? 'transform 0.1s ease-out' : 'transform 0.4s ease-out',
        transformStyle: 'preserve-3d'
      }}
      className={`glass-panel rounded-2xl p-6 relative overflow-hidden ${glowBorderClass} ${className}`}
    >
      {/* Specular Ambient Glow Sheen */}
      {isHovered && (
        <div className="absolute inset-0 pointer-events-none rounded-2xl bg-gradient-to-tr from-transparent via-white/5 to-transparent opacity-100 z-10" />
      )}
      <div className="relative z-20">{children}</div>
    </div>
  );
};
