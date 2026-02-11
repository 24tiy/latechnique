'use client';

import React, { useEffect, useRef, useCallback } from 'react';

interface Cloud {
  id: number;
  side: 'left' | 'right';
  triggerY: number;       // scroll Y where cloud activates
  baseX: number;          // starting X offset (off-screen)
  y: number;              // vertical position (vh)
  width: number;          // cloud width
  height: number;         // cloud height
  speed: number;          // how fast it drifts across
  blur: number;
  opacity: number;
  scale: number;
  zIndex: number;
}

const CLOUD_DEFS: Cloud[] = [
  { id: 0, side: 'left',  triggerY: 0.05, baseX: -320, y: 15, width: 280, height: 120, speed: 0.6, blur: 6, opacity: 0.25, scale: 1.0, zIndex: 1 },
  { id: 1, side: 'right', triggerY: 0.10, baseX: -260, y: 25, width: 220, height: 90, speed: 0.5, blur: 8, opacity: 0.20, scale: 0.9, zIndex: 2 },
  { id: 2, side: 'left',  triggerY: 0.18, baseX: -300, y: 35, width: 260, height: 100, speed: 0.4, blur: 5, opacity: 0.22, scale: 1.1, zIndex: 1 },
  { id: 3, side: 'right', triggerY: 0.25, baseX: -240, y: 20, width: 200, height: 80, speed: 0.55, blur: 10, opacity: 0.18, scale: 0.8, zIndex: 3 },
  { id: 4, side: 'left',  triggerY: 0.33, baseX: -340, y: 45, width: 300, height: 130, speed: 0.35, blur: 7, opacity: 0.20, scale: 1.2, zIndex: 1 },
  { id: 5, side: 'right', triggerY: 0.40, baseX: -220, y: 12, width: 180, height: 70, speed: 0.65, blur: 12, opacity: 0.15, scale: 0.7, zIndex: 2 },
  { id: 6, side: 'left',  triggerY: 0.48, baseX: -280, y: 55, width: 240, height: 100, speed: 0.45, blur: 6, opacity: 0.22, scale: 1.0, zIndex: 1 },
  { id: 7, side: 'right', triggerY: 0.55, baseX: -300, y: 30, width: 260, height: 110, speed: 0.4, blur: 8, opacity: 0.18, scale: 0.95, zIndex: 2 },
  { id: 8, side: 'left',  triggerY: 0.63, baseX: -250, y: 40, width: 210, height: 85, speed: 0.5, blur: 9, opacity: 0.16, scale: 0.85, zIndex: 3 },
  { id: 9, side: 'right', triggerY: 0.70, baseX: -320, y: 18, width: 280, height: 120, speed: 0.38, blur: 7, opacity: 0.20, scale: 1.1, zIndex: 1 },
  { id: 10, side: 'left',  triggerY: 0.78, baseX: -260, y: 50, width: 230, height: 95, speed: 0.48, blur: 10, opacity: 0.17, scale: 0.9, zIndex: 2 },
  { id: 11, side: 'right', triggerY: 0.85, baseX: -290, y: 22, width: 250, height: 105, speed: 0.42, blur: 6, opacity: 0.19, scale: 1.0, zIndex: 1 },
];

export const ScrollClouds: React.FC = () => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const cloudEls = useRef<(HTMLDivElement | null)[]>([]);
  const rafRef = useRef(0);

  const update = useCallback(() => {
    const scrollY = window.scrollY;
    const docH = document.documentElement.scrollHeight - window.innerHeight;
    const progress = docH > 0 ? scrollY / docH : 0;

    for (let i = 0; i < CLOUD_DEFS.length; i++) {
      const c = CLOUD_DEFS[i];
      const el = cloudEls.current[i];
      if (!el) continue;

      const localProgress = Math.max(0, (progress - c.triggerY) * 4);
      const driftX = localProgress * c.speed * window.innerWidth * 0.4;
      const isActive = localProgress > 0 && localProgress < 3;

      // Fade in from 0..0.5, fade out from 2..3
      let alpha = 0;
      if (localProgress > 0 && localProgress <= 0.5) {
        alpha = localProgress / 0.5;
      } else if (localProgress > 0.5 && localProgress < 2) {
        alpha = 1;
      } else if (localProgress >= 2 && localProgress < 3) {
        alpha = 1 - (localProgress - 2);
      }

      if (c.side === 'left') {
        el.style.transform = `translateX(${c.baseX + driftX}px) scale(${c.scale})`;
        el.style.left = '0px';
        el.style.right = 'auto';
      } else {
        el.style.transform = `translateX(${-c.baseX - driftX}px) scale(${c.scale})`;
        el.style.right = '0px';
        el.style.left = 'auto';
      }

      el.style.opacity = String(alpha * c.opacity);
      el.style.top = `${c.y}vh`;
    }

    rafRef.current = requestAnimationFrame(update);
  }, []);

  useEffect(() => {
    rafRef.current = requestAnimationFrame(update);
    return () => cancelAnimationFrame(rafRef.current);
  }, [update]);

  return (
    <div ref={wrapperRef} className="scroll-clouds-wrapper">
      {CLOUD_DEFS.map((c, i) => (
        <div
          key={c.id}
          ref={(el) => { cloudEls.current[i] = el; }}
          style={{
            position: 'absolute',
            width: c.width,
            height: c.height,
            borderRadius: '50%',
            background: `radial-gradient(ellipse at center,
              rgba(255,255,255,0.5) 0%,
              rgba(255,255,255,0.25) 25%,
              rgba(255,255,255,0.08) 50%,
              transparent 70%)`,
            filter: `blur(${c.blur}px)`,
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
