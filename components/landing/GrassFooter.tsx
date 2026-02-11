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
}

export const GrassFooter: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const bladesRef = useRef<Blade[]>([]);
  const frameRef = useRef(0);
  const timeRef = useRef(0);

  const initBlades = useCallback((width: number) => {
    const count = Math.floor(width / 2.2);
    const blades: Blade[] = [];

    for (let i = 0; i < count; i++) {
      blades.push({
        x: (i / count) * width + (Math.random() - 0.5) * 3,
        height: 40 + Math.random() * 140,
        width: 1.2 + Math.random() * 2.5,
        phase: Math.random() * Math.PI * 2,
        speed: 0.8 + Math.random() * 1.2,
        hue: 100 + Math.random() * 40,
        lightness: 18 + Math.random() * 22,
      });
    }

    // Sort by height for depth effect (shorter in front)
    blades.sort((a, b) => b.height - a.height);
    bladesRef.current = blades;
  }, []);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    const blades = bladesRef.current;
    const t = timeRef.current;

    ctx.clearRect(0, 0, w, h);

    for (let i = 0; i < blades.length; i++) {
      const b = blades[i];

      // Wind sway: combination of waves for natural look
      const sway1 = Math.sin(t * b.speed + b.phase) * 12;
      const sway2 = Math.sin(t * b.speed * 0.7 + b.phase * 1.3) * 6;
      const sway3 = Math.cos(t * 0.4 + b.x * 0.01) * 4;
      const totalSway = sway1 + sway2 + sway3;

      const baseX = b.x;
      const baseY = h;
      const tipX = baseX + totalSway;
      const tipY = h - b.height;

      // Control point for the curve (creates a natural bend)
      const cpX = baseX + totalSway * 0.6;
      const cpY = h - b.height * 0.55;

      // Draw blade as a quadratic curve with varying width
      ctx.beginPath();
      ctx.moveTo(baseX - b.width / 2, baseY);

      // Left edge
      ctx.quadraticCurveTo(
        cpX - b.width * 0.3,
        cpY,
        tipX,
        tipY
      );

      // Right edge (back down)
      ctx.quadraticCurveTo(
        cpX + b.width * 0.3,
        cpY,
        baseX + b.width / 2,
        baseY
      );

      ctx.closePath();

      // Color: darker at base, lighter at tip
      const grad = ctx.createLinearGradient(baseX, baseY, tipX, tipY);
      const darkL = Math.max(8, b.lightness - 12);
      const brightL = b.lightness + 8;
      grad.addColorStop(0, `hsl(${b.hue}, 65%, ${darkL}%)`);
      grad.addColorStop(0.4, `hsl(${b.hue}, 60%, ${b.lightness}%)`);
      grad.addColorStop(1, `hsl(${b.hue - 5}, 55%, ${brightL}%)`);

      ctx.fillStyle = grad;
      ctx.fill();
    }
  }, []);

  const animate = useCallback(() => {
    timeRef.current += 0.016;
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
