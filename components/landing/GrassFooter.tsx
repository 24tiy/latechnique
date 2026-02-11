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
  bendFactor: number;
}

export const GrassFooter: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const bladesRef = useRef<Blade[]>([]);
  const rafRef = useRef(0);
  const timeRef = useRef(0);
  const lastTimeRef = useRef(0);

  const initBlades = useCallback((width: number) => {
    // Ultra-dense grass like Zelda: ~1 blade per 0.8px
    const count = Math.floor(width / 0.8);
    const blades: Blade[] = [];

    for (let i = 0; i < count; i++) {
      const x = (i / count) * width + (Math.random() - 0.5) * 2;
      // Shorter, meadow-like grass: 40-120px
      const height = 40 + Math.random() * 80;
      blades.push({
        x,
        height,
        width: 1.5 + Math.random() * 2.5,
        phase: Math.random() * Math.PI * 2,
        speed: 0.3 + Math.random() * 0.4, // Slower wind
        hue: 85 + Math.random() * 50,        // 85-135: vibrant greens
        saturation: 55 + Math.random() * 30,  // 55-85%
        lightness: 25 + Math.random() * 25,   // 25-50%
        bendFactor: 0.7 + Math.random() * 0.6, // How much it bends
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

      // Gentle, slow wind sway (Zelda-like)
      const sway1 = Math.sin(t * b.speed * 0.5 + b.phase) * 8 * b.bendFactor;
      const sway2 = Math.sin(t * b.speed * 0.3 + b.phase * 1.3) * 4 * b.bendFactor;
      const sway3 = Math.cos(t * 0.2 + b.x * 0.01) * 3 * b.bendFactor;
      const totalSway = sway1 + sway2 + sway3;

      const baseX = b.x;
      const baseY = h;
      const tipX = baseX + totalSway;
      const tipY = h - b.height;

      // Curved blade shape with 2 control points for natural bend
      const cp1X = baseX + totalSway * 0.3;
      const cp1Y = h - b.height * 0.3;
      const cp2X = baseX + totalSway * 0.7;
      const cp2Y = h - b.height * 0.7;

      ctx.beginPath();
      ctx.moveTo(baseX - b.width / 2, baseY);
      
      // Draw one side with cubic bezier for smooth curve
      ctx.bezierCurveTo(
        cp1X - b.width * 0.2, cp1Y,
        cp2X - b.width * 0.1, cp2Y,
        tipX, tipY
      );
      
      // Draw other side back down
      ctx.bezierCurveTo(
        cp2X + b.width * 0.1, cp2Y,
        cp1X + b.width * 0.2, cp1Y,
        baseX + b.width / 2, baseY
      );
      
      ctx.closePath();

      // Rich gradient: dark earthy roots → vibrant green → lighter tip
      const grad = ctx.createLinearGradient(baseX, baseY, tipX, tipY);
      const darkL = Math.max(12, b.lightness - 18);
      const midL = b.lightness;
      const brightL = Math.min(60, b.lightness + 15);
      
      grad.addColorStop(0, `hsl(${b.hue + 8}, ${b.saturation - 15}%, ${darkL}%)`);
      grad.addColorStop(0.2, `hsl(${b.hue + 5}, ${b.saturation - 5}%, ${midL - 5}%)`);
      grad.addColorStop(0.5, `hsl(${b.hue}, ${b.saturation}%, ${midL}%)`);
      grad.addColorStop(0.8, `hsl(${b.hue - 5}, ${b.saturation + 10}%, ${midL + 8}%)`);
      grad.addColorStop(1, `hsl(${b.hue - 10}, ${b.saturation + 5}%, ${brightL}%)`);

      ctx.fillStyle = grad;
      ctx.fill();

      // Add subtle highlight on random blades
      if (Math.random() > 0.85) {
        ctx.beginPath();
        ctx.moveTo(tipX - b.width * 0.15, tipY);
        ctx.lineTo(tipX, tipY - 3);
        ctx.lineTo(tipX + b.width * 0.15, tipY);
        ctx.strokeStyle = `hsla(${b.hue - 10}, 70%, ${brightL + 10}%, 0.3)`;
        ctx.lineWidth = 0.5;
        ctx.stroke();
      }
    }
  }, []);

  const animate = useCallback(() => {
    const now = performance.now();
    const dt = (now - lastTimeRef.current) / 1000;
    lastTimeRef.current = now;
    timeRef.current += dt;
    draw();
    rafRef.current = requestAnimationFrame(animate);
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
    rafRef.current = requestAnimationFrame(animate);

    window.addEventListener('resize', resize);
    return () => {
      cancelAnimationFrame(rafRef.current);
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
