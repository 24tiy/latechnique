'use client';

import React, { useEffect, useRef, useCallback } from 'react';

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   REALISTIC BILLOWING CLOUD DEFINITIONS
   Clouds rendered with noise-based billowing animation
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

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
  billowScale: number;
}

const CLOUDS: CloudDef[] = [
  { id: 0,  side: 'left',  triggerY: 0.03, y: 12, baseScale: 1.1,  speed: 0.5,  opacity: 0.7, zIndex: 1, seed: 42, billowSpeed: 0.4, billowScale: 0.8 },
  { id: 1,  side: 'right', triggerY: 0.08, y: 22, baseScale: 0.8,  speed: 0.45, opacity: 0.55, zIndex: 2, seed: 17, billowSpeed: 0.5, billowScale: 1.0 },
  { id: 2,  side: 'left',  triggerY: 0.16, y: 8,  baseScale: 0.65, speed: 0.55, opacity: 0.45, zIndex: 3, seed: 83, billowSpeed: 0.35, billowScale: 0.7 },
  { id: 3,  side: 'right', triggerY: 0.22, y: 32, baseScale: 1.0,  speed: 0.4,  opacity: 0.6,  zIndex: 1, seed: 56, billowSpeed: 0.45, billowScale: 0.9 },
  { id: 4,  side: 'left',  triggerY: 0.30, y: 18, baseScale: 1.3,  speed: 0.35, opacity: 0.65, zIndex: 1, seed: 91, billowSpeed: 0.3, billowScale: 1.1 },
  { id: 5,  side: 'right', triggerY: 0.38, y: 5,  baseScale: 0.7,  speed: 0.6,  opacity: 0.4,  zIndex: 2, seed: 29, billowSpeed: 0.55, billowScale: 0.75 },
  { id: 6,  side: 'left',  triggerY: 0.45, y: 38, baseScale: 0.9,  speed: 0.42, opacity: 0.55, zIndex: 2, seed: 64, billowSpeed: 0.38, billowScale: 0.85 },
  { id: 7,  side: 'right', triggerY: 0.52, y: 15, baseScale: 1.15, speed: 0.38, opacity: 0.6,  zIndex: 1, seed: 73, billowSpeed: 0.42, billowScale: 0.95 },
  { id: 8,  side: 'left',  triggerY: 0.60, y: 28, baseScale: 0.75, speed: 0.5,  opacity: 0.5,  zIndex: 3, seed: 38, billowSpeed: 0.48, billowScale: 0.8 },
  { id: 9,  side: 'right', triggerY: 0.68, y: 10, baseScale: 1.0,  speed: 0.36, opacity: 0.55, zIndex: 1, seed: 15, billowSpeed: 0.32, billowScale: 1.0 },
  { id: 10, side: 'left',  triggerY: 0.75, y: 42, baseScale: 0.85, speed: 0.48, opacity: 0.45, zIndex: 2, seed: 87, billowSpeed: 0.44, billowScale: 0.9 },
  { id: 11, side: 'right', triggerY: 0.82, y: 20, baseScale: 1.05, speed: 0.4,  opacity: 0.5,  zIndex: 1, seed: 52, billowSpeed: 0.36, billowScale: 0.88 },
];

/* ━━━ Simplex-style noise for organic billowing ━━━ */
function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function noise2D(x: number, y: number, seed: number): number {
  const rng = seededRandom(seed + Math.floor(x * 12.9898 + y * 78.233));
  return rng() * 2 - 1;
}

function smoothNoise(x: number, y: number, seed: number): number {
  const corners = (
    noise2D(x - 1, y - 1, seed) +
    noise2D(x + 1, y - 1, seed) +
    noise2D(x - 1, y + 1, seed) +
    noise2D(x + 1, y + 1, seed)
  ) / 16;
  const sides = (
    noise2D(x - 1, y, seed) +
    noise2D(x + 1, y, seed) +
    noise2D(x, y - 1, seed) +
    noise2D(x, y + 1, seed)
  ) / 8;
  const center = noise2D(x, y, seed) / 4;
  return corners + sides + center;
}

function interpolatedNoise(x: number, y: number, seed: number): number {
  const intX = Math.floor(x);
  const fracX = x - intX;
  const intY = Math.floor(y);
  const fracY = y - intY;

  const v1 = smoothNoise(intX, intY, seed);
  const v2 = smoothNoise(intX + 1, intY, seed);
  const v3 = smoothNoise(intX, intY + 1, seed);
  const v4 = smoothNoise(intX + 1, intY + 1, seed);

  const i1 = v1 * (1 - fracX) + v2 * fracX;
  const i2 = v3 * (1 - fracX) + v4 * fracX;

  return i1 * (1 - fracY) + i2 * fracY;
}

function perlinNoise(x: number, y: number, seed: number): number {
  let total = 0;
  let amplitude = 1;
  let frequency = 1;
  const octaves = 4;

  for (let i = 0; i < octaves; i++) {
    total += interpolatedNoise(x * frequency, y * frequency, seed + i) * amplitude;
    amplitude *= 0.5;
    frequency *= 2;
  }

  return total;
}

/* ━━━ Render billowing cloud with animated noise ━━━ */
function renderBillowingCloud(
  seed: number,
  scale: number,
  time: number,
  billowSpeed: number,
  billowScale: number
): HTMLCanvasElement {
  const rng = seededRandom(seed);
  const baseW = 400;
  const baseH = 200;
  const w = Math.round(baseW * scale);
  const h = Math.round(baseH * scale);
  const c = document.createElement('canvas');
  c.width = w * 2;
  c.height = h * 2;
  const ctx = c.getContext('2d')!;
  ctx.scale(2, 2);

  // Build cloud from many small puffs with noise-based displacement
  const numPuffs = 24 + Math.floor(rng() * 16);
  const cx = w / 2;
  const cy = h / 2;

  for (let i = 0; i < numPuffs; i++) {
    const angle = rng() * Math.PI * 2;
    const dist = rng() * w * 0.3;
    
    // Apply perlin noise to position for organic billowing
    const noiseX = perlinNoise(i * 0.3, time * billowSpeed * 0.5, seed) * w * 0.15 * billowScale;
    const noiseY = perlinNoise(i * 0.3 + 100, time * billowSpeed * 0.5, seed + 50) * h * 0.1 * billowScale;
    
    const px = cx + Math.cos(angle) * dist * (0.7 + rng() * 0.6) + noiseX;
    const py = cy + Math.sin(angle) * dist * 0.5 - rng() * h * 0.12 + noiseY;
    
    // Radius also affected by noise
    const noiseScale = 1 + perlinNoise(i * 0.5, time * billowSpeed, seed + 200) * 0.2 * billowScale;
    const r = ((h * 0.2) + rng() * (h * 0.25)) * noiseScale;

    const grad = ctx.createRadialGradient(px, py - r * 0.12, 0, px, py, r);
    const brightness = 248 + Math.floor(rng() * 7);
    grad.addColorStop(0, `rgba(${brightness},${brightness},${brightness + 5}, ${0.55 + rng() * 0.25})`);
    grad.addColorStop(0.35, `rgba(${brightness - 3},${brightness - 2},${brightness + 2}, ${0.35 + rng() * 0.15})`);
    grad.addColorStop(0.65, `rgba(${brightness - 8},${brightness - 6},${brightness - 2}, ${0.15 + rng() * 0.08})`);
    grad.addColorStop(1, 'rgba(245,248,252,0)');

    ctx.beginPath();
    ctx.arc(px, py, r, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();
  }

  // Bright highlights with noise-based movement
  for (let i = 0; i < 8; i++) {
    const noiseX = perlinNoise(i * 0.8, time * billowSpeed * 0.3, seed + 300) * w * 0.1;
    const noiseY = perlinNoise(i * 0.8 + 200, time * billowSpeed * 0.3, seed + 400) * h * 0.08;
    
    const px = cx + (rng() - 0.5) * w * 0.35 + noiseX;
    const py = cy - h * 0.18 + (rng() - 0.5) * h * 0.12 + noiseY;
    const r = h * 0.14 + rng() * h * 0.12;

    const grad = ctx.createRadialGradient(px, py, 0, px, py, r);
    grad.addColorStop(0, `rgba(255,255,255,${0.4 + rng() * 0.2})`);
    grad.addColorStop(0.4, 'rgba(255,255,255,0.15)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');

    ctx.beginPath();
    ctx.arc(px, py, r, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();
  }

  // Soft shadows underneath
  for (let i = 0; i < 5; i++) {
    const noiseX = perlinNoise(i * 1.2, time * billowSpeed * 0.25, seed + 500) * w * 0.08;
    const px = cx + (rng() - 0.5) * w * 0.25 + noiseX;
    const py = cy + h * 0.14 + rng() * h * 0.06;
    const r = h * 0.16 + rng() * h * 0.1;

    const grad = ctx.createRadialGradient(px, py, 0, px, py, r);
    grad.addColorStop(0, `rgba(190,205,220,${0.14 + rng() * 0.06})`);
    grad.addColorStop(1, 'rgba(190,205,220,0)');

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
  const lastFrameRef = useRef(0);

  const update = useCallback(() => {
    const now = performance.now();
    const dt = (now - lastFrameRef.current) / 1000;
    lastFrameRef.current = now;
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
      
      // Smooth fade
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

      // Re-render cloud with billowing animation
      if (alpha > 0.01) {
        const canvas = renderBillowingCloud(c.seed, c.baseScale, t, c.billowSpeed, c.billowScale);
        el.style.width = `${canvas.width / 2}px`;
        el.style.height = `${canvas.height / 2}px`;
        el.style.backgroundImage = `url(${canvas.toDataURL()})`;
        el.style.backgroundSize = 'contain';
        el.style.backgroundRepeat = 'no-repeat';
      }

      const driftX = localProgress * c.speed * window.innerWidth * 0.35;
      const vertDrift = Math.sin(t * 0.2 + c.seed * 0.4) * 8;

      if (c.side === 'left') {
        el.style.left = '0px';
        el.style.right = 'auto';
        el.style.transform = `translate(${-220 + driftX}px, ${vertDrift}px) scale(${c.baseScale})`;
      } else {
        el.style.right = '0px';
        el.style.left = 'auto';
        el.style.transform = `translate(${220 - driftX}px, ${vertDrift}px) scale(${c.baseScale})`;
      }

      el.style.opacity = String(alpha * c.opacity);
      el.style.top = `${c.y}vh`;
    }

    rafRef.current = requestAnimationFrame(update);
  }, []);

  useEffect(() => {
    lastFrameRef.current = performance.now();
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
