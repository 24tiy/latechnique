'use client';

import React, { useEffect, useRef, useCallback } from 'react';

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   REALISTIC CLOUD DEFINITIONS
   Each cloud is rendered as overlapping circles on canvas
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

interface CloudDef {
  id: number;
  side: 'left' | 'right';
  triggerY: number;
  y: number;            // vh from top
  baseScale: number;
  speed: number;
  opacity: number;
  zIndex: number;
  seed: number;         // for procedural generation
}

const CLOUDS: CloudDef[] = [
  { id: 0,  side: 'left',  triggerY: 0.03, y: 12, baseScale: 1.1,  speed: 0.5,  opacity: 0.7, zIndex: 1, seed: 42 },
  { id: 1,  side: 'right', triggerY: 0.08, y: 22, baseScale: 0.8,  speed: 0.45, opacity: 0.55, zIndex: 2, seed: 17 },
  { id: 2,  side: 'left',  triggerY: 0.16, y: 8,  baseScale: 0.65, speed: 0.55, opacity: 0.45, zIndex: 3, seed: 83 },
  { id: 3,  side: 'right', triggerY: 0.22, y: 32, baseScale: 1.0,  speed: 0.4,  opacity: 0.6,  zIndex: 1, seed: 56 },
  { id: 4,  side: 'left',  triggerY: 0.30, y: 18, baseScale: 1.3,  speed: 0.35, opacity: 0.65, zIndex: 1, seed: 91 },
  { id: 5,  side: 'right', triggerY: 0.38, y: 5,  baseScale: 0.7,  speed: 0.6,  opacity: 0.4,  zIndex: 2, seed: 29 },
  { id: 6,  side: 'left',  triggerY: 0.45, y: 38, baseScale: 0.9,  speed: 0.42, opacity: 0.55, zIndex: 2, seed: 64 },
  { id: 7,  side: 'right', triggerY: 0.52, y: 15, baseScale: 1.15, speed: 0.38, opacity: 0.6,  zIndex: 1, seed: 73 },
  { id: 8,  side: 'left',  triggerY: 0.60, y: 28, baseScale: 0.75, speed: 0.5,  opacity: 0.5,  zIndex: 3, seed: 38 },
  { id: 9,  side: 'right', triggerY: 0.68, y: 10, baseScale: 1.0,  speed: 0.36, opacity: 0.55, zIndex: 1, seed: 15 },
  { id: 10, side: 'left',  triggerY: 0.75, y: 42, baseScale: 0.85, speed: 0.48, opacity: 0.45, zIndex: 2, seed: 87 },
  { id: 11, side: 'right', triggerY: 0.82, y: 20, baseScale: 1.05, speed: 0.4,  opacity: 0.5,  zIndex: 1, seed: 52 },
];

/* ━━━ Procedural cloud shape generator ━━━ */
function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function renderCloudCanvas(seed: number, scale: number): HTMLCanvasElement {
  const rng = seededRandom(seed);
  const baseW = 360;
  const baseH = 180;
  const w = Math.round(baseW * scale);
  const h = Math.round(baseH * scale);
  const c = document.createElement('canvas');
  c.width = w * 2;  // 2x for retina
  c.height = h * 2;
  const ctx = c.getContext('2d')!;
  ctx.scale(2, 2);

  // Build cloud from overlapping circles (cumulus puffs)
  const numPuffs = 18 + Math.floor(rng() * 12);
  const cx = w / 2;
  const cy = h / 2;

  // Main body puffs
  for (let i = 0; i < numPuffs; i++) {
    const angle = rng() * Math.PI * 2;
    const dist = rng() * w * 0.28;
    const px = cx + Math.cos(angle) * dist * (0.6 + rng() * 0.8);
    const py = cy + Math.sin(angle) * dist * 0.45 - rng() * h * 0.1;
    const r = (h * 0.18) + rng() * (h * 0.28);

    const grad = ctx.createRadialGradient(px, py - r * 0.15, 0, px, py, r);
    const brightness = 245 + Math.floor(rng() * 10);
    grad.addColorStop(0, `rgba(${brightness},${brightness},${brightness + 3}, ${0.5 + rng() * 0.3})`);
    grad.addColorStop(0.4, `rgba(${brightness - 5},${brightness - 3},${brightness}, ${0.3 + rng() * 0.2})`);
    grad.addColorStop(0.7, `rgba(${brightness - 10},${brightness - 8},${brightness - 5}, ${0.1 + rng() * 0.1})`);
    grad.addColorStop(1, 'rgba(240,242,248,0)');

    ctx.beginPath();
    ctx.arc(px, py, r, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();
  }

  // Bright highlights on top
  for (let i = 0; i < 6; i++) {
    const px = cx + (rng() - 0.5) * w * 0.4;
    const py = cy - h * 0.15 + (rng() - 0.5) * h * 0.15;
    const r = h * 0.12 + rng() * h * 0.15;

    const grad = ctx.createRadialGradient(px, py, 0, px, py, r);
    grad.addColorStop(0, `rgba(255,255,255,${0.35 + rng() * 0.2})`);
    grad.addColorStop(0.5, 'rgba(255,255,255,0.1)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');

    ctx.beginPath();
    ctx.arc(px, py, r, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();
  }

  // Subtle shadow underneath
  for (let i = 0; i < 4; i++) {
    const px = cx + (rng() - 0.5) * w * 0.3;
    const py = cy + h * 0.12 + rng() * h * 0.08;
    const r = h * 0.15 + rng() * h * 0.12;

    const grad = ctx.createRadialGradient(px, py, 0, px, py, r);
    grad.addColorStop(0, `rgba(180,195,215,${0.12 + rng() * 0.08})`);
    grad.addColorStop(1, 'rgba(180,195,215,0)');

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
  const canvasCache = useRef<HTMLCanvasElement[]>([]);
  const rafRef = useRef(0);
  const timeRef = useRef(0);
  const lastFrameRef = useRef(0);

  // Pre-render cloud canvases on mount
  useEffect(() => {
    canvasCache.current = CLOUDS.map(c => renderCloudCanvas(c.seed, c.baseScale));
    
    // Apply rendered canvases as background images
    canvasCache.current.forEach((canvas, i) => {
      const el = cloudEls.current[i];
      if (!el) return;
      el.style.width = `${canvas.width / 2}px`;
      el.style.height = `${canvas.height / 2}px`;
      el.style.backgroundImage = `url(${canvas.toDataURL()})`;
      el.style.backgroundSize = 'contain';
      el.style.backgroundRepeat = 'no-repeat';
    });
  }, []);

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
      
      // Smooth fade: in over 0..0.6, visible 0.6..2.2, out 2.2..3
      let alpha = 0;
      if (localProgress > 0 && localProgress <= 0.6) {
        alpha = localProgress / 0.6;
        alpha = alpha * alpha * (3 - 2 * alpha); // smoothstep
      } else if (localProgress > 0.6 && localProgress < 2.2) {
        alpha = 1;
      } else if (localProgress >= 2.2 && localProgress < 3) {
        alpha = 1 - (localProgress - 2.2) / 0.8;
        alpha = alpha * alpha * (3 - 2 * alpha);
      }

      const driftX = localProgress * c.speed * window.innerWidth * 0.35;
      
      // Subtle billowing: slow scale oscillation + slight vertical drift
      const billow = 1 + Math.sin(t * 0.3 + c.seed) * 0.03 + Math.sin(t * 0.17 + c.seed * 1.7) * 0.02;
      const vertDrift = Math.sin(t * 0.25 + c.seed * 0.5) * 5;

      if (c.side === 'left') {
        el.style.left = '0px';
        el.style.right = 'auto';
        el.style.transform = `translate(${-200 + driftX}px, ${vertDrift}px) scale(${c.baseScale * billow})`;
      } else {
        el.style.right = '0px';
        el.style.left = 'auto';
        el.style.transform = `translate(${200 - driftX}px, ${vertDrift}px) scale(${c.baseScale * billow})`;
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
