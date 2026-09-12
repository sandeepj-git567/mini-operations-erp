'use client';

import React, { useState, useRef } from 'react';

interface Cyber3DCardProps {
  children: React.ReactNode;
  className?: string;
  glowColor?: 'cyan' | 'pink' | 'purple' | 'green';
}

export const Cyber3DCard: React.FC<Cyber3DCardProps> = ({
  children,
  className = '',
  glowColor = 'cyan'
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

    const rotX = ((y - centerY) / centerY) * -8; // Max tilt 8 deg
    const rotY = ((x - centerX) / centerX) * 8;

    setRotateX(rotX);
    setRotateY(rotY);
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setRotateX(0);
    setRotateY(0);
  };

  const glowBorderClass = {
    cyan: 'hover:border-cyan-400 hover:shadow-[0_0_25px_rgba(0,243,255,0.3)]',
    pink: 'hover:border-pink-500 hover:shadow-[0_0_25px_rgba(255,0,85,0.3)]',
    purple: 'hover:border-purple-500 hover:shadow-[0_0_25px_rgba(157,78,221,0.3)]',
    green: 'hover:border-emerald-400 hover:shadow-[0_0_25px_rgba(0,255,102,0.3)]'
  }[glowColor];

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        transform: isHovered
          ? `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(10px)`
          : 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateZ(0px)',
        transition: isHovered ? 'transform 0.1s ease-out' : 'transform 0.5s ease-out',
        transformStyle: 'preserve-3d'
      }}
      className={`cyber-card cyber-clip rounded-xl p-6 transition-all duration-300 ${glowBorderClass} ${className}`}
    >
      {/* Specular Highlight Sheen */}
      {isHovered && (
        <div
          className="absolute inset-0 pointer-events-none rounded-xl bg-gradient-to-tr from-transparent via-cyan-400/10 to-transparent opacity-60 z-10"
        />
      )}
      <div className="relative z-20">{children}</div>
    </div>
  );
};
