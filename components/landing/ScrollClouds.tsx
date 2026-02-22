'use client';

import React, { useEffect, useRef, useCallback } from 'react';

/* =============================================
   SCROLL CLOUDS — Fixed: subtle, not dominant
   
   KEY FIXES:
   - Opacity reduced from 0.35-0.55 to 0.06-0.12
   - Cloud textures rendered with lower internal alpha
   - Smaller base sizes
   - These should be barely-noticeable atmosphere,
     NOT bright white blobs covering the screen
   ============================================= */

interface CloudDef {
  id: number;
  side: 'left' | 'right';
  triggerY: number;
  y: number;
  baseScale: number;
  speed: number;
  opacity: number;  // MAX opacity — now very low
  zIndex: number;
  seed: number;
}

const CLOUDS: CloudDef[] = [
  { id: 0, side: 'left',  triggerY: 0.05, y: 12, baseScale: 0.7,  speed: 0.4,  opacity: 0.10, zIndex: 1, seed: 42 },
  { id: 1, side: 'right', triggerY: 0.12, y: 25, baseScale: 0.55, speed: 0.35, opacity: 0.08, zIndex: 2, seed: 17 },
  { id: 2, side: 'left',  triggerY: 0.22, y: 8,  baseScale: 0.5,  speed: 0.45, opacity: 0.07, zIndex: 3, seed: 83 },
  { id: 3, side: 'right', triggerY: 0.30, y: 35, baseScale: 0.65, speed: 0.3,  opacity: 0.09, zIndex: 1, seed: 56 },
  { id: 4, side: 'left',  triggerY: 0.40, y: 18, baseScale: 0.8,  speed: 0.28, opacity: 0.11, zIndex: 1, seed: 91 },
  { id: 5, side: 'right', triggerY: 0.50, y: 6,  baseScale: 0.5,  speed: 0.5,  opacity: 0.06, zIndex: 2, seed: 29 },
  { id: 6, side: 'left',  triggerY: 0.58, y: 40, baseScale: 0.6,  speed: 0.35, opacity: 0.08, zIndex: 2, seed: 64 },
  { id: 7, side: 'right', triggerY: 0.65, y: 15, baseScale: 0.7,  speed: 0.3,  opacity: 0.10, zIndex: 1, seed: 73 },
];

function seededRandom(seed: number) {
  let s = seed;
  return () => { s = (s * 16807 + 0) % 2147483647; return (s - 1) / 2147483646; };
}

/*
 * Cloud texture with MUCH lower internal opacity.
 * Old code had puff alphas of 0.65-0.9. Now 0.15-0.35.
 */
function renderCloudTexture(seed: number, scale: number): string {
  const rng = seededRandom(seed);
  const baseW = 400;
  const baseH = 180;
  const w = Math.round(baseW * scale);
  const h = Math.round(baseH * scale);
  const c = document.createElement('canvas');
  c.width = w * 2; c.height = h * 2;
  const ctx = c.getContext('2d')!;
  ctx.scale(2, 2);

  const cx = w / 2, cy = h / 2;
  const numPuffs = 25 + Math.floor(rng() * 15);

  for (let i = 0; i < numPuffs; i++) {
    const angle = (i / numPuffs) * Math.PI * 2 + rng() * 0.5;
    const dist = (0.15 + rng() * 0.25) * w * 0.4;
    const px = cx + Math.cos(angle) * dist + (rng() - 0.5) * w * 0.04;
    const py = cy + Math.sin(angle) * dist * 0.45 - h * 0.06 + (rng() - 0.5) * h * 0.03;
    const r = h * 0.18 + rng() * h * 0.2;

    const grad = ctx.createRadialGradient(px, py - r * 0.08, 0, px, py, r * 1.1);
    const b = 250 + Math.floor(rng() * 5);
    // KEY FIX: Much lower alpha values
    grad.addColorStop(0, `rgba(${b}, ${b}, ${b + 2}, ${0.18 + rng() * 0.12})`);
    grad.addColorStop(0.4, `rgba(${b - 3}, ${b - 2}, ${b}, ${0.08 + rng() * 0.05})`);
    grad.addColorStop(0.75, `rgba(${b - 8}, ${b - 6}, ${b - 2}, ${0.02 + rng() * 0.02})`);
    grad.addColorStop(1, 'rgba(248, 252, 255, 0)');

    ctx.beginPath();
    ctx.arc(px, py, r, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();
  }

  // Very subtle highlights
  for (let i = 0; i < 6; i++) {
    const angle = rng() * Math.PI * 2;
    const dist = rng() * w * 0.08;
    const px = cx + Math.cos(angle) * dist;
    const py = cy - h * 0.1 + Math.sin(angle) * dist * 0.2;
    const r = h * 0.08 + rng() * h * 0.08;
    const grad = ctx.createRadialGradient(px, py, 0, px, py, r);
    grad.addColorStop(0, `rgba(255, 255, 255, ${0.1 + rng() * 0.08})`);
    grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.beginPath();
    ctx.arc(px, py, r, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();
  }

  return c.toDataURL();
}

export const ScrollClouds: React.FC = () => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const cloudEls = useRef<(HTMLDivElement | null)[]>([]);
  const texturesRef = useRef<string[]>([]);
  const rafRef = useRef(0);
  const timeRef = useRef(0);
  const lastTimeRef = useRef(0);

  useEffect(() => {
    texturesRef.current = CLOUDS.map(c => renderCloudTexture(c.seed, c.baseScale));
    for (let i = 0; i < CLOUDS.length; i++) {
      const el = cloudEls.current[i];
      if (!el || !texturesRef.current[i]) continue;
      const c = CLOUDS[i];
      el.style.width = `${400 * c.baseScale}px`;
      el.style.height = `${180 * c.baseScale}px`;
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

      const localProgress = Math.max(0, (progress - c.triggerY) * 3.0);

      let alpha = 0;
      if (localProgress > 0 && localProgress <= 0.5) {
        alpha = localProgress / 0.5;
        alpha = alpha * alpha * (3 - 2 * alpha); // smoothstep
      } else if (localProgress > 0.5 && localProgress < 2.0) {
        alpha = 1;
      } else if (localProgress >= 2.0 && localProgress < 2.8) {
        alpha = 1 - (localProgress - 2.0) / 0.8;
        alpha = alpha * alpha * (3 - 2 * alpha);
      }

      const driftX = localProgress * c.speed * window.innerWidth * 0.25;
      const vertDrift = Math.sin(t * 0.1 + c.seed * 0.3) * 6;
      const scalePulse = 1 + Math.sin(t * 0.06 + c.seed) * 0.02;

      if (c.side === 'left') {
        el.style.left = '0px'; el.style.right = 'auto';
        el.style.transform = `translate(${-200 + driftX}px, ${vertDrift}px) scale(${scalePulse})`;
      } else {
        el.style.right = '0px'; el.style.left = 'auto';
        el.style.transform = `translate(${200 - driftX}px, ${vertDrift}px) scale(${scalePulse})`;
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
