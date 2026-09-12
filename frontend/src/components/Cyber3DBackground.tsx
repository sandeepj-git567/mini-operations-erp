'use client';

import React, { useEffect, useRef } from 'react';

export const Cyber3DBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    let mouseX = width / 2;
    let mouseY = height / 2;

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove);

    // Particle Matrix System
    const particleCount = 65;
    const particles = Array.from({ length: particleCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      z: Math.random() * width,
      size: Math.random() * 2.5 + 0.8,
      speedZ: Math.random() * 1.5 + 0.5,
      color: Math.random() > 0.35 ? '#00f3ff' : '#ff0055'
    }));

    let gridOffset = 0;

    const render = () => {
      // Clear with dark transparent void gradient
      const bgGradient = ctx.createRadialGradient(
        width / 2, height / 2, 50,
        width / 2, height / 2, Math.max(width, height)
      );
      bgGradient.addColorStop(0, '#0c102b');
      bgGradient.addColorStop(0.6, '#050714');
      bgGradient.addColorStop(1, '#020309');

      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, width, height);

      // Render 3D Horizon Grid
      ctx.save();
      ctx.strokeStyle = 'rgba(0, 243, 255, 0.08)';
      ctx.lineWidth = 1;

      const horizonY = height * 0.65;
      const fov = 350;

      // Draw Vertical Perspective Lines
      const numPerspectiveLines = 28;
      for (let i = -numPerspectiveLines; i <= numPerspectiveLines; i++) {
        const xStart = width / 2 + (i * 45);
        const xEnd = width / 2 + (i * 240);
        ctx.beginPath();
        ctx.moveTo(xStart, horizonY);
        ctx.lineTo(xEnd, height);
        ctx.stroke();
      }

      // Draw Horizontal Moving Grid Lines
      gridOffset = (gridOffset + 1.2) % 40;
      for (let z = 10; z < height - horizonY; z += 35) {
        const currentZ = (z + gridOffset) % (height - horizonY);
        const y = horizonY + currentZ;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Draw Horizon Neon Laser Glow
      const laserGlow = ctx.createLinearGradient(0, horizonY - 2, 0, horizonY + 4);
      laserGlow.addColorStop(0, 'rgba(0, 243, 255, 0)');
      laserGlow.addColorStop(0.5, 'rgba(0, 243, 255, 0.8)');
      laserGlow.addColorStop(1, 'rgba(255, 0, 85, 0)');

      ctx.fillStyle = laserGlow;
      ctx.fillRect(0, horizonY - 2, width, 6);
      ctx.restore();

      // Render Floating 3D Cyber Particles
      particles.forEach((p) => {
        p.z -= p.speedZ;
        if (p.z <= 0) {
          p.z = width;
          p.x = Math.random() * width;
          p.y = Math.random() * height;
        }

        const k = fov / p.z;
        const px = (p.x - width / 2) * k + width / 2 + (mouseX - width / 2) * 0.02;
        const py = (p.y - height / 2) * k + height / 2 + (mouseY - height / 2) * 0.02;
        const pSize = p.size * k;

        if (px >= 0 && px <= width && py >= 0 && py <= height) {
          ctx.beginPath();
          ctx.arc(px, py, Math.max(0.5, pSize), 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          ctx.shadowBlur = 12;
          ctx.shadowColor = p.color;
          ctx.globalAlpha = Math.min(1, (width - p.z) / width);
          ctx.fill();
          ctx.globalAlpha = 1.0;
          ctx.shadowBlur = 0;
        }
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0 opacity-80"
    />
  );
};
