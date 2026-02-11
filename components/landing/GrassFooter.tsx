'use client';

import React, { useEffect, useRef, useCallback } from 'react';

/* =============================================
   TYPES
   ============================================= */

interface Blade {
  x: number;
  depth: number;
  height: number;
  width: number;
  phase: number;
  speed: number;
  hue: number;
  lightness: number;
  saturation: number;
  bendFactor: number;
  angle: number;
}

interface Mushroom {
  x: number;
  depth: number;
  scale: number;
  lean: number;
  capHue: number;
  stemHeight: number;
  capWidth: number;
  capHeight: number;
  spots: { rx: number; ry: number; r: number }[];
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  pulse: number;
  pulseSpeed: number;
  hue: number;
}

/* =============================================
   GRASS FOOTER COMPONENT
   ============================================= */

export const GrassFooter: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const bladesRef = useRef<Blade[]>([]);
  const mushroomsRef = useRef<Mushroom[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const rafRef = useRef(0);
  const timeRef = useRef(0);
  const lastTimeRef = useRef(0);

  /* ---------- Init blades ---------- */
  const initBlades = useCallback((width: number, height: number) => {
    // Very dense — 1 blade per ~0.4px
    const count = Math.floor(width / 0.4);
    const blades: Blade[] = [];

    for (let i = 0; i < count; i++) {
      const x = (i / count) * width + (Math.random() - 0.5) * 2;
      const depth = Math.random();

      // Tall lush grass: 80-200px depending on depth
      const baseHeight = 80 + Math.random() * 120;
      const h = baseHeight * (0.6 + depth * 0.6);

      blades.push({
        x,
        depth,
        height: h,
        width: 2.5 + Math.random() * 4.0,
        phase: Math.random() * Math.PI * 2,
        speed: 0.2 + Math.random() * 0.3,
        // Rich greens
        hue: 95 + Math.random() * 35,
        saturation: 55 + Math.random() * 30,
        lightness: 22 + Math.random() * 28,
        bendFactor: 0.6 + Math.random() * 0.6,
        angle: (Math.random() - 0.5) * 0.25,
      });
    }

    blades.sort((a, b) => a.depth - b.depth);
    bladesRef.current = blades;
  }, []);

  /* ---------- Init mushrooms ---------- */
  const initMushrooms = useCallback((width: number, _height: number) => {
    const count = 4 + Math.floor(Math.random() * 4); // 4-7 mushrooms
    const mushrooms: Mushroom[] = [];
    const spacing = width / (count + 1);

    for (let i = 0; i < count; i++) {
      const x = spacing * (i + 1) + (Math.random() - 0.5) * spacing * 0.6;
      const scale = 0.6 + Math.random() * 0.6;
      const capWidth = (18 + Math.random() * 14) * scale;
      const capHeight = (12 + Math.random() * 8) * scale;

      // Generate spots on the cap
      const spotCount = 3 + Math.floor(Math.random() * 5);
      const spots: { rx: number; ry: number; r: number }[] = [];
      for (let s = 0; s < spotCount; s++) {
        spots.push({
          rx: (Math.random() - 0.5) * 0.7,
          ry: Math.random() * 0.6 - 0.1,
          r: 1.5 + Math.random() * 2.5,
        });
      }

      mushrooms.push({
        x,
        depth: 0.5 + Math.random() * 0.5, // front half
        scale,
        lean: (Math.random() - 0.5) * 0.15,
        capHue: 0 + Math.random() * 10, // red
        stemHeight: (14 + Math.random() * 10) * scale,
        capWidth,
        capHeight,
        spots,
      });
    }

    mushrooms.sort((a, b) => a.depth - b.depth);
    mushroomsRef.current = mushrooms;
  }, []);

  /* ---------- Init particles ---------- */
  const initParticles = useCallback((width: number, height: number) => {
    const count = 25 + Math.floor(Math.random() * 20);
    const particles: Particle[] = [];

    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height * 0.85,
        vx: (Math.random() - 0.5) * 0.3,
        vy: -0.1 - Math.random() * 0.4,
        size: 1 + Math.random() * 2.5,
        opacity: 0.3 + Math.random() * 0.5,
        pulse: Math.random() * Math.PI * 2,
        pulseSpeed: 0.8 + Math.random() * 1.5,
        hue: 50 + Math.random() * 100, // golden to green
      });
    }

    particlesRef.current = particles;
  }, []);

  /* ---------- Draw ---------- */
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio, 2);
    const w = canvas.width / dpr;
    const h = canvas.height / dpr;
    const blades = bladesRef.current;
    const mushrooms = mushroomsRef.current;
    const particles = particlesRef.current;
    const t = timeRef.current;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    /* --- Draw back blades (depth < 0.5) --- */
    for (let i = 0; i < blades.length; i++) {
      const b = blades[i];
      if (b.depth >= 0.5) break;
      drawBlade(ctx, b, w, h, t);
    }

    /* --- Draw mushrooms interleaved with mid-depth grass --- */
    let mIdx = 0;
    for (let i = 0; i < blades.length; i++) {
      const b = blades[i];
      if (b.depth < 0.5) continue;

      // Draw any mushroom whose depth is <= this blade's depth
      while (mIdx < mushrooms.length && mushrooms[mIdx].depth <= b.depth) {
        drawMushroom(ctx, mushrooms[mIdx], w, h, t);
        mIdx++;
      }

      drawBlade(ctx, b, w, h, t);
    }
    // Any remaining mushrooms
    while (mIdx < mushrooms.length) {
      drawMushroom(ctx, mushrooms[mIdx], w, h, t);
      mIdx++;
    }

    /* --- Draw particles --- */
    for (let i = 0; i < particles.length; i++) {
      drawParticle(ctx, particles[i], w, h, t);
    }

    /* --- Update particles --- */
    const dt = 1 / 60;
    for (const p of particles) {
      p.x += p.vx;
      p.y += p.vy;
      p.pulse += p.pulseSpeed * dt;
      // Wrap around
      if (p.y < -5) { p.y = h * 0.8; p.x = Math.random() * w; }
      if (p.x < -5) p.x = w + 5;
      if (p.x > w + 5) p.x = -5;
    }
  }, []);

  return (
    <div className="grass-footer">
      <canvas
        ref={canvasRef}
        style={{ display: 'block', width: '100%', height: '100%' }}
      />
      <CanvasManager
        canvasRef={canvasRef}
        initBlades={initBlades}
        initMushrooms={initMushrooms}
        initParticles={initParticles}
        draw={draw}
        timeRef={timeRef}
        lastTimeRef={lastTimeRef}
        rafRef={rafRef}
      />
    </div>
  );
};

/* =============================================
   CANVAS MANAGER — isolate effects
   ============================================= */

interface CanvasManagerProps {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  initBlades: (w: number, h: number) => void;
  initMushrooms: (w: number, h: number) => void;
  initParticles: (w: number, h: number) => void;
  draw: () => void;
  timeRef: React.MutableRefObject<number>;
  lastTimeRef: React.MutableRefObject<number>;
  rafRef: React.MutableRefObject<number>;
}

const CanvasManager: React.FC<CanvasManagerProps> = ({
  canvasRef, initBlades, initMushrooms, initParticles, draw,
  timeRef, lastTimeRef, rafRef,
}) => {
  const animateRef = useRef<() => void>();

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
      initMushrooms(rect.width, rect.height);
      initParticles(rect.width, rect.height);
    };

    animateRef.current = () => {
      const now = performance.now();
      const dt = (now - lastTimeRef.current) / 1000;
      lastTimeRef.current = now;
      timeRef.current += dt;
      draw();
      rafRef.current = requestAnimationFrame(animateRef.current!);
    };

    resize();
    lastTimeRef.current = performance.now();
    rafRef.current = requestAnimationFrame(animateRef.current);

    window.addEventListener('resize', resize);
    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', resize);
    };
  }, [canvasRef, initBlades, initMushrooms, initParticles, draw, timeRef, lastTimeRef, rafRef]);

  return null;
};

/* =============================================
   DRAW HELPERS
   ============================================= */

function drawBlade(
  ctx: CanvasRenderingContext2D,
  b: Blade,
  _w: number,
  h: number,
  t: number,
) {
  const isoY = h - (b.depth * h * 0.35);

  // Multi-layered wind
  const sway1 = Math.sin(t * b.speed * 0.4 + b.phase) * 12 * b.bendFactor;
  const sway2 = Math.sin(t * b.speed * 0.22 + b.phase * 1.3) * 6 * b.bendFactor;
  const sway3 = Math.cos(t * 0.15 + b.x * 0.006) * 5 * b.bendFactor;
  const totalSway = (sway1 + sway2 + sway3) * (0.6 + b.depth * 0.4);

  const baseX = b.x;
  const baseY = isoY;
  const tipX = baseX + totalSway + b.angle * b.height;
  const tipY = isoY - b.height;

  const cp1X = baseX + (totalSway + b.angle * b.height) * 0.2;
  const cp1Y = isoY - b.height * 0.22;
  const cp2X = baseX + (totalSway + b.angle * b.height) * 0.55;
  const cp2Y = isoY - b.height * 0.62;

  ctx.beginPath();
  ctx.moveTo(baseX - b.width * 0.55, baseY);
  ctx.bezierCurveTo(cp1X - b.width * 0.28, cp1Y, cp2X - b.width * 0.12, cp2Y, tipX, tipY);
  ctx.bezierCurveTo(cp2X + b.width * 0.12, cp2Y, cp1X + b.width * 0.28, cp1Y, baseX + b.width * 0.55, baseY);
  ctx.closePath();

  // Rich gradient with depth-based shading
  const depthBright = b.depth * 10;
  const grad = ctx.createLinearGradient(baseX, baseY, tipX, tipY);
  const darkL = Math.max(8, b.lightness - 18 + depthBright * 0.3);
  const midL = b.lightness + depthBright * 0.4;
  const brightL = Math.min(68, b.lightness + 20 + depthBright * 0.5);

  grad.addColorStop(0, `hsl(${b.hue + 8}, ${b.saturation - 10}%, ${darkL}%)`);
  grad.addColorStop(0.3, `hsl(${b.hue + 3}, ${b.saturation}%, ${midL}%)`);
  grad.addColorStop(0.65, `hsl(${b.hue - 3}, ${b.saturation + 6}%, ${midL + 8}%)`);
  grad.addColorStop(1, `hsl(${b.hue - 8}, ${b.saturation + 3}%, ${brightL}%)`);

  ctx.fillStyle = grad;
  ctx.fill();
}

function drawMushroom(
  ctx: CanvasRenderingContext2D,
  m: Mushroom,
  _w: number,
  h: number,
  t: number,
) {
  const baseY = h - (m.depth * h * 0.35);
  const sway = Math.sin(t * 0.3 + m.x * 0.01) * 2 * m.scale;

  ctx.save();
  ctx.translate(m.x + sway, baseY);
  ctx.rotate(m.lean);

  // Stem
  const stemW = 5 * m.scale;
  const stemH = m.stemHeight;
  const stemGrad = ctx.createLinearGradient(0, 0, 0, -stemH);
  stemGrad.addColorStop(0, '#e8ddd0');
  stemGrad.addColorStop(0.5, '#f5efe8');
  stemGrad.addColorStop(1, '#faf6f0');

  ctx.beginPath();
  ctx.moveTo(-stemW, 0);
  ctx.bezierCurveTo(-stemW * 1.1, -stemH * 0.3, -stemW * 0.8, -stemH * 0.7, -stemW * 0.6, -stemH);
  ctx.lineTo(stemW * 0.6, -stemH);
  ctx.bezierCurveTo(stemW * 0.8, -stemH * 0.7, stemW * 1.1, -stemH * 0.3, stemW, 0);
  ctx.closePath();
  ctx.fillStyle = stemGrad;
  ctx.fill();

  // Cap — rounded dome
  const capY = -stemH;
  const cw = m.capWidth;
  const ch = m.capHeight;

  const capGrad = ctx.createRadialGradient(0, capY - ch * 0.3, 0, 0, capY - ch * 0.1, cw * 1.1);
  capGrad.addColorStop(0, `hsl(${m.capHue}, 80%, 55%)`);
  capGrad.addColorStop(0.5, `hsl(${m.capHue}, 75%, 48%)`);
  capGrad.addColorStop(0.8, `hsl(${m.capHue}, 70%, 40%)`);
  capGrad.addColorStop(1, `hsl(${m.capHue}, 65%, 35%)`);

  ctx.beginPath();
  ctx.ellipse(0, capY, cw, ch, 0, Math.PI, 0);
  ctx.closePath();
  ctx.fillStyle = capGrad;
  ctx.fill();

  // Cap highlight (glossy)
  const hlGrad = ctx.createRadialGradient(-cw * 0.2, capY - ch * 0.5, 0, -cw * 0.1, capY - ch * 0.3, cw * 0.5);
  hlGrad.addColorStop(0, 'rgba(255, 255, 255, 0.35)');
  hlGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
  ctx.beginPath();
  ctx.ellipse(-cw * 0.15, capY - ch * 0.4, cw * 0.4, ch * 0.5, -0.2, 0, Math.PI * 2);
  ctx.fillStyle = hlGrad;
  ctx.fill();

  // White spots
  for (const spot of m.spots) {
    const sx = spot.rx * cw;
    const sy = capY - ch * spot.ry;
    // Only draw if within the cap ellipse
    const nx = sx / cw;
    const ny = (sy - capY) / ch;
    if (nx * nx + ny * ny < 1.0) {
      ctx.beginPath();
      ctx.arc(sx, sy, spot.r * m.scale, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 240, 0.85)';
      ctx.fill();
    }
  }

  // Rim under cap
  ctx.beginPath();
  ctx.ellipse(0, capY, cw * 0.85, ch * 0.15, 0, 0, Math.PI);
  ctx.fillStyle = 'rgba(230, 220, 200, 0.5)';
  ctx.fill();

  ctx.restore();
}

function drawParticle(
  ctx: CanvasRenderingContext2D,
  p: Particle,
  _w: number,
  _h: number,
  t: number,
) {
  const glow = 0.5 + 0.5 * Math.sin(t * p.pulseSpeed + p.pulse);
  const alpha = p.opacity * glow;

  // Outer glow
  const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 4);
  grad.addColorStop(0, `hsla(${p.hue}, 80%, 80%, ${alpha * 0.6})`);
  grad.addColorStop(0.4, `hsla(${p.hue}, 70%, 75%, ${alpha * 0.2})`);
  grad.addColorStop(1, `hsla(${p.hue}, 60%, 70%, 0)`);
  ctx.beginPath();
  ctx.arc(p.x, p.y, p.size * 4, 0, Math.PI * 2);
  ctx.fillStyle = grad;
  ctx.fill();

  // Bright core
  ctx.beginPath();
  ctx.arc(p.x, p.y, p.size * 0.6, 0, Math.PI * 2);
  ctx.fillStyle = `hsla(${p.hue}, 90%, 95%, ${alpha * 0.9})`;
  ctx.fill();
}
