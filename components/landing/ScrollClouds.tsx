'use client';

import React, { useEffect, useRef, useCallback } from 'react';

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
  billowSpeed: number;
}

const CLOUDS: CloudDef[] = [
  { id: 0,  side: 'left',  triggerY: 0.03, y: 12, baseScale: 1.1,  speed: 0.5,  opacity: 0.7, zIndex: 1, seed: 42, billowSpeed: 0.4 },
  { id: 1,  side: 'right', triggerY: 0.08, y: 22, baseScale: 0.8,  speed: 0.45, opacity: 0.55, zIndex: 2, seed: 17, billowSpeed: 0.5 },
  { id: 2,  side: 'left',  triggerY: 0.16, y: 8,  baseScale: 0.65, speed: 0.55, opacity: 0.45, zIndex: 3, seed: 83, billowSpeed: 0.35 },
  { id: 3,  side: 'right', triggerY: 0.22, y: 32, baseScale: 1.0,  speed: 0.4,  opacity: 0.6,  zIndex: 1, seed: 56, billowSpeed: 0.45 },
  { id: 4,  side: 'left',  triggerY: 0.30, y: 18, baseScale: 1.3,  speed: 0.35, opacity: 0.65, zIndex: 1, seed: 91, billowSpeed: 0.3 },
  { id: 5,  side: 'right', triggerY: 0.38, y: 5,  baseScale: 0.7,  speed: 0.6,  opacity: 0.4,  zIndex: 2, seed: 29, billowSpeed: 0.55 },
  { id: 6,  side: 'left',  triggerY: 0.45, y: 38, baseScale: 0.9,  speed: 0.42, opacity: 0.55, zIndex: 2, seed: 64, billowSpeed: 0.38 },
  { id: 7,  side: 'right', triggerY: 0.52, y: 15, baseScale: 1.15, speed: 0.38, opacity: 0.6,  zIndex: 1, seed: 73, billowSpeed: 0.42 },
  { id: 8,  side: 'left',  triggerY: 0.60, y: 28, baseScale: 0.75, speed: 0.5,  opacity: 0.5,  zIndex: 3, seed: 38, billowSpeed: 0.48 },
  { id: 9,  side: 'right', triggerY: 0.68, y: 10, baseScale: 1.0,  speed: 0.36, opacity: 0.55, zIndex: 1, seed: 15, billowSpeed: 0.32 },
];

function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

// Perlin-like noise
function noise(x: number, y: number, seed: number): number {
  const n = Math.sin(x * 12.9898 + y * 78.233 + seed) * 43758.5453;
  return n - Math.floor(n);
}

function smoothNoise(x: number, y: number, seed: number): number {
  const corners = (
    noise(x - 1, y - 1, seed) + noise(x + 1, y - 1, seed) +
    noise(x - 1, y + 1, seed) + noise(x + 1, y + 1, seed)
  ) / 16;
  const sides = (
    noise(x - 1, y, seed) + noise(x + 1, y, seed) +
    noise(x, y - 1, seed) + noise(x, y + 1, seed)
  ) / 8;
  const center = noise(x, y, seed) / 4;
  return corners + sides + center;
}

function perlin(x: number, y: number, seed: number): number {
  let total = 0;
  let amplitude = 1;
  let frequency = 1;
  for (let i = 0; i < 3; i++) {
    total += smoothNoise(x * frequency, y * frequency, seed + i) * amplitude;
    amplitude *= 0.5;
    frequency *= 2;
  }
  return total;
}

function renderRoundCloud(
  seed: number,
  scale: number,
  time: number,
  billowSpeed: number
): HTMLCanvasElement {
  const rng = seededRandom(seed);
  const baseW = 450;
  const baseH = 180;
  const w = Math.round(baseW * scale);
  const h = Math.round(baseH * scale);
  const c = document.createElement('canvas');
  c.width = w * 2;
  c.height = h * 2;
  const ctx = c.getContext('2d')!;
  ctx.scale(2, 2);

  const cx = w / 2;
  const cy = h / 2;
  const numPuffs = 28 + Math.floor(rng() * 18);

  // Draw soft rounded puffs
  for (let i = 0; i < numPuffs; i++) {
    const angle = (i / numPuffs) * Math.PI * 2 + rng() * 0.5;
    const dist = (0.3 + rng() * 0.25) * w * 0.5;
    
    const noiseX = perlin(i * 0.2, time * billowSpeed * 0.3, seed) * w * 0.08;
    const noiseY = perlin(i * 0.2 + 50, time * billowSpeed * 0.3, seed + 30) * h * 0.06;
    
    const px = cx + Math.cos(angle) * dist + noiseX;
    const py = cy + Math.sin(angle) * dist * 0.55 + noiseY - h * 0.08;
    
    const noiseScale = 1 + perlin(i * 0.3, time * billowSpeed * 0.5, seed + 100) * 0.15;
    const r = (h * 0.28 + rng() * h * 0.22) * noiseScale;

    const grad = ctx.createRadialGradient(px, py - r * 0.1, 0, px, py, r * 1.2);
    const brightness = 250 + Math.floor(rng() * 5);
    
    grad.addColorStop(0, `rgba(${brightness}, ${brightness}, ${brightness + 3}, ${0.7 + rng() * 0.2})`);
    grad.addColorStop(0.35, `rgba(${brightness - 5}, ${brightness - 3}, ${brightness}, ${0.5 + rng() * 0.15})`);
    grad.addColorStop(0.7, `rgba(${brightness - 12}, ${brightness - 10}, ${brightness - 5}, ${0.2 + rng() * 0.1})`);
    grad.addColorStop(1, 'rgba(248, 252, 255, 0)');

    ctx.beginPath();
    ctx.arc(px, py, r, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();
  }

  // Bright highlights
  for (let i = 0; i < 10; i++) {
    const angle = rng() * Math.PI * 2;
    const dist = rng() * w * 0.15;
    const px = cx + Math.cos(angle) * dist;
    const py = cy - h * 0.15 + Math.sin(angle) * dist * 0.3;
    const r = h * 0.12 + rng() * h * 0.1;

    const grad = ctx.createRadialGradient(px, py, 0, px, py, r);
    grad.addColorStop(0, `rgba(255, 255, 255, ${0.5 + rng() * 0.25})`);
    grad.addColorStop(0.5, 'rgba(255, 255, 255, 0.2)');
    grad.addColorStop(1, 'rgba(255, 255, 255, 0)');

    ctx.beginPath();
    ctx.arc(px, py, r, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();
  }

  // Soft bottom shadows
  for (let i = 0; i < 6; i++) {
    const px = cx + (rng() - 0.5) * w * 0.3;
    const py = cy + h * 0.18 + rng() * h * 0.05;
    const r = h * 0.18 + rng() * h * 0.12;

    const grad = ctx.createRadialGradient(px, py, 0, px, py, r);
    grad.addColorStop(0, `rgba(200, 210, 225, ${0.15 + rng() * 0.08})`);
    grad.addColorStop(1, 'rgba(200, 210, 225, 0)');

    ctx.beginPath();
    ctx.arc(px, py, r, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();
  }

  return c;
}

export const ScrollClouds: React.FC = () => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const cloudEls = useRef<(HTMLDivElement | null)[]>([]);
  const rafRef = useRef(0);
  const timeRef = useRef(0);
  const lastTimeRef = useRef(0);

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

      if (alpha > 0.01) {
        const canvas = renderRoundCloud(c.seed, c.baseScale, t, c.billowSpeed);
        el.style.width = `${canvas.width / 2}px`;
        el.style.height = `${canvas.height / 2}px`;
        el.style.backgroundImage = `url(${canvas.toDataURL()})`;
        el.style.backgroundSize = 'contain';
        el.style.backgroundRepeat = 'no-repeat';
      }

      const driftX = localProgress * c.speed * window.innerWidth * 0.35;
      const vertDrift = Math.sin(t * 0.15 + c.seed * 0.3) * 10;

      if (c.side === 'left') {
        el.style.left = '0px';
        el.style.right = 'auto';
        el.style.transform = `translate(${-250 + driftX}px, ${vertDrift}px) scale(${c.baseScale})`;
      } else {
        el.style.right = '0px';
        el.style.left = 'auto';
        el.style.transform = `translate(${250 - driftX}px, ${vertDrift}px) scale(${c.baseScale})`;
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
