'use client';

import React, { useEffect, useRef, useCallback } from 'react';

interface Blade {
  x: number;
  height: number;
  width: number;
  phase: number;
  speed: number;
  hue: number;
  lightness: number;
  saturation: number;
}

export const GrassFooter: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const bladesRef = useRef<Blade[]>([]);
  const frameRef = useRef(0);
  const timeRef = useRef(0);
  const lastTimeRef = useRef(0);

  const initBlades = useCallback((width: number) => {
    // Dense grass: ~1 blade per 1.5px
    const count = Math.floor(width / 1.5);
    const blades: Blade[] = [];

    for (let i = 0; i < count; i++) {
      const x = (i / count) * width + (Math.random() - 0.5) * 3;
      // Taller grass blades: 60-320px
      const height = 60 + Math.random() * 260;
      blades.push({
        x,
        height,
        width: 1.0 + Math.random() * 2.8,
        phase: Math.random() * Math.PI * 2,
        speed: 0.6 + Math.random() * 1.0,
        hue: 95 + Math.random() * 45,        // 95-140: yellow-green to green
        saturation: 50 + Math.random() * 25,  // 50-75%
        lightness: 15 + Math.random() * 28,   // 15-43%
      });
    }

    // Sort by height (tallest in back = drawn first)
    blades.sort((a, b) => b.height - a.height);
    bladesRef.current = blades;
  }, []);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio, 2);
    const w = canvas.width / dpr;
    const h = canvas.height / dpr;
    const blades = bladesRef.current;
    const t = timeRef.current;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let i = 0; i < blades.length; i++) {
      const b = blades[i];

      // Wind: 3 layered sine waves for organic sway
      const sway1 = Math.sin(t * b.speed + b.phase) * 14;
      const sway2 = Math.sin(t * b.speed * 0.6 + b.phase * 1.4) * 7;
      const sway3 = Math.cos(t * 0.35 + b.x * 0.008) * 5;
      const totalSway = sway1 + sway2 + sway3;

      const baseX = b.x;
      const baseY = h;
      const tipX = baseX + totalSway;
      const tipY = h - b.height;

      // Control point: creates a natural arc/bend
      const cpX = baseX + totalSway * 0.55;
      const cpY = h - b.height * 0.5;

      ctx.beginPath();
      ctx.moveTo(baseX - b.width / 2, baseY);
      ctx.quadraticCurveTo(cpX - b.width * 0.25, cpY, tipX, tipY);
      ctx.quadraticCurveTo(cpX + b.width * 0.25, cpY, baseX + b.width / 2, baseY);
      ctx.closePath();

      // Gradient: dark roots → vibrant middle → lighter tip
      const grad = ctx.createLinearGradient(baseX, baseY, tipX, tipY);
      const darkL = Math.max(6, b.lightness - 14);
      const brightL = Math.min(55, b.lightness + 12);
      grad.addColorStop(0, `hsl(${b.hue + 5}, ${b.saturation - 10}%, ${darkL}%)`);
      grad.addColorStop(0.3, `hsl(${b.hue}, ${b.saturation}%, ${b.lightness}%)`);
      grad.addColorStop(0.7, `hsl(${b.hue - 3}, ${b.saturation + 5}%, ${b.lightness + 5}%)`);
      grad.addColorStop(1, `hsl(${b.hue - 8}, ${b.saturation - 5}%, ${brightL}%)`);

      ctx.fillStyle = grad;
      ctx.fill();
    }
  }, []);

  const animate = useCallback(() => {
    const now = performance.now();
    const dt = (now - lastTimeRef.current) / 1000;
    lastTimeRef.current = now;
    timeRef.current += dt;
    draw();
    frameRef.current = requestAnimationFrame(animate);
  }, [draw]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio, 2);
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.scale(dpr, dpr);
      initBlades(rect.width);
    };

    resize();
    lastTimeRef.current = performance.now();
    frameRef.current = requestAnimationFrame(animate);

    window.addEventListener('resize', resize);
    return () => {
      cancelAnimationFrame(frameRef.current);
      window.removeEventListener('resize', resize);
    };
  }, [animate, initBlades]);

  return (
    <div className="grass-footer">
      <canvas
        ref={canvasRef}
        style={{ display: 'block', width: '100%', height: '100%' }}
      />
    </div>
  );
};
