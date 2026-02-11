'use client';

import React, { useEffect, useRef, useCallback } from 'react';

interface Blade {
  x: number;
  depth: number;  // for isometric depth
  height: number;
  width: number;
  phase: number;
  speed: number;
  hue: number;
  lightness: number;
  saturation: number;
  bendFactor: number;
  angle: number;  // random lean angle
}

export const GrassFooter: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const bladesRef = useRef<Blade[]>([]);
  const rafRef = useRef(0);
  const timeRef = useRef(0);
  const lastTimeRef = useRef(0);

  const initBlades = useCallback((width: number, height: number) => {
    // Ultra-dense isometric grass
    const count = Math.floor(width / 0.6);
    const blades: Blade[] = [];

    for (let i = 0; i < count; i++) {
      const x = (i / count) * width + (Math.random() - 0.5) * 1.5;
      const depth = Math.random(); // 0 = back, 1 = front
      
      // Taller grass for lush look: 60-140px
      const baseHeight = 60 + Math.random() * 80;
      // Grass in front is taller (perspective)
      const height = baseHeight * (0.7 + depth * 0.5);
      
      blades.push({
        x,
        depth,
        height,
        width: 2.0 + Math.random() * 3.0,
        phase: Math.random() * Math.PI * 2,
        speed: 0.25 + Math.random() * 0.35,
        hue: 90 + Math.random() * 40,
        saturation: 60 + Math.random() * 25,
        lightness: 28 + Math.random() * 22,
        bendFactor: 0.8 + Math.random() * 0.5,
        angle: (Math.random() - 0.5) * 0.3, // slight lean
      });
    }

    // Sort by depth (back to front)
    blades.sort((a, b) => a.depth - b.depth);
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

      // Isometric perspective: grass at back is higher on canvas
      const isoY = h - (b.depth * h * 0.3);
      
      // Gentle wind sway
      const sway1 = Math.sin(t * b.speed * 0.45 + b.phase) * 10 * b.bendFactor;
      const sway2 = Math.sin(t * b.speed * 0.25 + b.phase * 1.4) * 5 * b.bendFactor;
      const sway3 = Math.cos(t * 0.18 + b.x * 0.008) * 4 * b.bendFactor;
      const totalSway = (sway1 + sway2 + sway3) * (0.7 + b.depth * 0.3);

      const baseX = b.x;
      const baseY = isoY;
      const tipX = baseX + totalSway + b.angle * b.height;
      const tipY = isoY - b.height;

      // Smooth curved blade with multiple control points
      const cp1X = baseX + (totalSway + b.angle * b.height) * 0.25;
      const cp1Y = isoY - b.height * 0.25;
      const cp2X = baseX + (totalSway + b.angle * b.height) * 0.6;
      const cp2Y = isoY - b.height * 0.65;

      ctx.beginPath();
      ctx.moveTo(baseX - b.width * 0.6, baseY);
      
      ctx.bezierCurveTo(
        cp1X - b.width * 0.3, cp1Y,
        cp2X - b.width * 0.15, cp2Y,
        tipX, tipY
      );
      
      ctx.bezierCurveTo(
        cp2X + b.width * 0.15, cp2Y,
        cp1X + b.width * 0.3, cp1Y,
        baseX + b.width * 0.6, baseY
      );
      
      ctx.closePath();

      // Rich gradient with depth-based lighting
      const depthDarken = b.depth * 8; // front is brighter
      const grad = ctx.createLinearGradient(baseX, baseY, tipX, tipY);
      const darkL = Math.max(10, b.lightness - 20 - depthDarken);
      const midL = b.lightness - depthDarken * 0.5;
      const brightL = Math.min(65, b.lightness + 18 - depthDarken * 0.3);
      
      grad.addColorStop(0, `hsl(${b.hue + 10}, ${b.saturation - 12}%, ${darkL}%)`);
      grad.addColorStop(0.15, `hsl(${b.hue + 6}, ${b.saturation - 6}%, ${midL - 6}%)`);
      grad.addColorStop(0.4, `hsl(${b.hue + 2}, ${b.saturation}%, ${midL}%)`);
      grad.addColorStop(0.7, `hsl(${b.hue - 4}, ${b.saturation + 8}%, ${midL + 10}%)`);
      grad.addColorStop(1, `hsl(${b.hue - 10}, ${b.saturation + 4}%, ${brightL}%)`);

      ctx.fillStyle = grad;
      ctx.fill();

      // Random highlights on front grass
      if (b.depth > 0.6 && Math.random() > 0.82) {
        ctx.beginPath();
        const highlightY = tipY + b.height * 0.15;
        ctx.moveTo(tipX - b.width * 0.2, highlightY);
        ctx.lineTo(tipX, tipY);
        ctx.lineTo(tipX + b.width * 0.2, highlightY);
        ctx.strokeStyle = `hsla(${b.hue - 15}, 75%, ${brightL + 12}%, 0.4)`;
        ctx.lineWidth = 0.8;
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
      initBlades(rect.width, rect.height);
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
