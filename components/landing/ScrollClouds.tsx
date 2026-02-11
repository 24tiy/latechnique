'use client';

import React, { useEffect, useRef, useCallback } from 'react';

/* =============================================
   CLOUD DEFINITIONS
   ============================================= */

interface CloudDef {
  id: number;
  side: 'left' | 'right';
  triggerY: number;
  y: number;
  baseScale: number;
  speed: number;
  opacity: number;
  zIndex: number;
  seed: number;
}

const CLOUDS: CloudDef[] = [
  { id: 0,  side: 'left',  triggerY: 0.02, y: 10, baseScale: 1.1,  speed: 0.5,  opacity: 0.55, zIndex: 1, seed: 42 },
  { id: 1,  side: 'right', triggerY: 0.08, y: 22, baseScale: 0.8,  speed: 0.45, opacity: 0.45, zIndex: 2, seed: 17 },
  { id: 2,  side: 'left',  triggerY: 0.16, y: 8,  baseScale: 0.65, speed: 0.55, opacity: 0.35, zIndex: 3, seed: 83 },
  { id: 3,  side: 'right', triggerY: 0.22, y: 32, baseScale: 1.0,  speed: 0.4,  opacity: 0.5,  zIndex: 1, seed: 56 },
  { id: 4,  side: 'left',  triggerY: 0.30, y: 18, baseScale: 1.3,  speed: 0.35, opacity: 0.5,  zIndex: 1, seed: 91 },
  { id: 5,  side: 'right', triggerY: 0.38, y: 5,  baseScale: 0.7,  speed: 0.6,  opacity: 0.35, zIndex: 2, seed: 29 },
  { id: 6,  side: 'left',  triggerY: 0.45, y: 38, baseScale: 0.9,  speed: 0.42, opacity: 0.45, zIndex: 2, seed: 64 },
  { id: 7,  side: 'right', triggerY: 0.52, y: 15, baseScale: 1.15, speed: 0.38, opacity: 0.5,  zIndex: 1, seed: 73 },
  { id: 8,  side: 'left',  triggerY: 0.60, y: 28, baseScale: 0.75, speed: 0.5,  opacity: 0.4,  zIndex: 3, seed: 38 },
  { id: 9,  side: 'right', triggerY: 0.68, y: 10, baseScale: 1.0,  speed: 0.36, opacity: 0.45, zIndex: 1, seed: 15 },
];

/* =============================================
   SEEDED RNG
   ============================================= */

function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

/* =============================================
   RENDER A STATIC CLOUD TEXTURE (called once)
   ============================================= */

function renderCloudTexture(seed: number, scale: number): string {
  const rng = seededRandom(seed);
  const baseW = 500;
  const baseH = 220;
  const w = Math.round(baseW * scale);
  const h = Math.round(baseH * scale);
  const c = document.createElement('canvas');
  c.width = w * 2;
  c.height = h * 2;
  const ctx = c.getContext('2d')!;
  ctx.scale(2, 2);

  const cx = w / 2;
  const cy = h / 2;

  // Main body — many overlapping soft circles
  const numPuffs = 35 + Math.floor(rng() * 20);
  for (let i = 0; i < numPuffs; i++) {
    const angle = (i / numPuffs) * Math.PI * 2 + rng() * 0.5;
    const dist = (0.2 + rng() * 0.3) * w * 0.45;
    const px = cx + Math.cos(angle) * dist + (rng() - 0.5) * w * 0.06;
    const py = cy + Math.sin(angle) * dist * 0.5 - h * 0.08 + (rng() - 0.5) * h * 0.04;
    const r = h * 0.22 + rng() * h * 0.25;

    const grad = ctx.createRadialGradient(px, py - r * 0.1, 0, px, py, r * 1.15);
    const b = 250 + Math.floor(rng() * 5);
    grad.addColorStop(0, `rgba(${b}, ${b}, ${b + 2}, ${0.65 + rng() * 0.25})`);
    grad.addColorStop(0.4, `rgba(${b - 3}, ${b - 2}, ${b}, ${0.4 + rng() * 0.15})`);
    grad.addColorStop(0.75, `rgba(${b - 10}, ${b - 8}, ${b - 3}, ${0.15 + rng() * 0.08})`);
    grad.addColorStop(1, 'rgba(248, 252, 255, 0)');

    ctx.beginPath();
    ctx.arc(px, py, r, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();
  }

  // Top highlights (soft bright)
  for (let i = 0; i < 12; i++) {
    const angle = rng() * Math.PI * 2;
    const dist = rng() * w * 0.12;
    const px = cx + Math.cos(angle) * dist;
    const py = cy - h * 0.15 + Math.sin(angle) * dist * 0.25;
    const r = h * 0.1 + rng() * h * 0.12;

    const grad = ctx.createRadialGradient(px, py, 0, px, py, r);
    grad.addColorStop(0, `rgba(255, 255, 255, ${0.45 + rng() * 0.2})`);
    grad.addColorStop(0.5, 'rgba(255, 255, 255, 0.15)');
    grad.addColorStop(1, 'rgba(255, 255, 255, 0)');

    ctx.beginPath();
    ctx.arc(px, py, r, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();
  }

  // Subtle bottom shadow
  for (let i = 0; i < 5; i++) {
    const px = cx + (rng() - 0.5) * w * 0.25;
    const py = cy + h * 0.2 + rng() * h * 0.05;
    const r = h * 0.15 + rng() * h * 0.1;

    const grad = ctx.createRadialGradient(px, py, 0, px, py, r);
    grad.addColorStop(0, `rgba(190, 200, 218, ${0.12 + rng() * 0.06})`);
    grad.addColorStop(1, 'rgba(190, 200, 218, 0)');

    ctx.beginPath();
    ctx.arc(px, py, r, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();
  }

  return c.toDataURL();
}

/* =============================================
   COMPONENT
   ============================================= */

export const ScrollClouds: React.FC = () => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const cloudEls = useRef<(HTMLDivElement | null)[]>([]);
  const texturesRef = useRef<string[]>([]);
  const rafRef = useRef(0);
  const timeRef = useRef(0);
  const lastTimeRef = useRef(0);

  // Pre-render cloud textures once
  useEffect(() => {
    texturesRef.current = CLOUDS.map(c => renderCloudTexture(c.seed, c.baseScale));
    // Apply textures to elements
    for (let i = 0; i < CLOUDS.length; i++) {
      const el = cloudEls.current[i];
      if (!el || !texturesRef.current[i]) continue;
      const c = CLOUDS[i];
      const baseW = 500 * c.baseScale;
      const baseH = 220 * c.baseScale;
      el.style.width = `${baseW}px`;
      el.style.height = `${baseH}px`;
      el.style.backgroundImage = `url(${texturesRef.current[i]})`;
      el.style.backgroundSize = 'contain';
      el.style.backgroundRepeat = 'no-repeat';
    }
  }, []);

  const update = useCallback(() => {
    const now = performance.now();
    const dt = (now - lastTimeRef.current) / 1000;
    lastTimeRef.current = now;
    timeRef.current += dt;

    const scrollY = window.scrollY;
    const docH = document.documentElement.scrollHeight - window.innerHeight;
    const progress = docH > 0 ? scrollY / docH : 0;
    const t = timeRef.current;

    for (let i = 0; i < CLOUDS.length; i++) {
      const c = CLOUDS[i];
      const el = cloudEls.current[i];
      if (!el) continue;

      const localProgress = Math.max(0, (progress - c.triggerY) * 3.5);

      // Smooth fade in/out
      let alpha = 0;
      if (localProgress > 0 && localProgress <= 0.6) {
        alpha = localProgress / 0.6;
        alpha = alpha * alpha * (3 - 2 * alpha);
      } else if (localProgress > 0.6 && localProgress < 2.2) {
        alpha = 1;
      } else if (localProgress >= 2.2 && localProgress < 3) {
        alpha = 1 - (localProgress - 2.2) / 0.8;
        alpha = alpha * alpha * (3 - 2 * alpha);
      }

      const driftX = localProgress * c.speed * window.innerWidth * 0.3;
      const vertDrift = Math.sin(t * 0.12 + c.seed * 0.3) * 8;
      // Subtle scale pulsing
      const scalePulse = 1 + Math.sin(t * 0.08 + c.seed) * 0.03;

      if (c.side === 'left') {
        el.style.left = '0px';
        el.style.right = 'auto';
        el.style.transform = `translate(${-280 + driftX}px, ${vertDrift}px) scale(${scalePulse})`;
      } else {
        el.style.right = '0px';
        el.style.left = 'auto';
        el.style.transform = `translate(${280 - driftX}px, ${vertDrift}px) scale(${scalePulse})`;
      }

      el.style.opacity = String(alpha * c.opacity);
      el.style.top = `${c.y}vh`;
    }

    rafRef.current = requestAnimationFrame(update);
  }, []);

  useEffect(() => {
    lastTimeRef.current = performance.now();
    rafRef.current = requestAnimationFrame(update);
    return () => cancelAnimationFrame(rafRef.current);
  }, [update]);

  return (
    <div ref={wrapperRef} className="scroll-clouds-wrapper">
      {CLOUDS.map((c, i) => (
        <div
          key={c.id}
          ref={(el) => { cloudEls.current[i] = el; }}
          style={{
            position: 'absolute',
            opacity: 0,
            willChange: 'transform, opacity',
            pointerEvents: 'none',
            zIndex: c.zIndex,
          }}
        />
      ))}
    </div>
  );
};
