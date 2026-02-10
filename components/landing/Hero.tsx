'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { Button } from '../design-system/Button';

// Dynamic import — Three.js only runs client-side
const GlassScene = dynamic(() => import('./GlassScene'), {
  ssr: false,
  loading: () => (
    <div className="glass-loader">
      <span>Loading 3D…</span>
    </div>
  ),
});

export const Hero: React.FC = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const subRef = useRef<HTMLDivElement>(null);
  const hintRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);

  const ease = (t: number, pow: number) => 1 - Math.pow(1 - t, pow);

  const handleScroll = useCallback(() => {
    const section = sectionRef.current;
    if (!section) return;

    const rect = section.getBoundingClientRect();
    const total = section.offsetHeight - window.innerHeight;
    if (total <= 0) return;

    const raw = -rect.top / total;
    const progress = Math.max(0, Math.min(1, raw));
    setScrollProgress(progress);

    const e = ease(progress, 2.4);

    // Subtitle fade
    if (subRef.current) {
      const subE = Math.max(0, (e - 0.6) / 0.4);
      const subBlur = 8 * (1 - subE);
      subRef.current.style.opacity = String(subE);
      subRef.current.style.transform = `translateY(${12 * (1 - subE)}px)`;
      subRef.current.style.filter = subE < 0.99 ? `blur(${subBlur}px)` : 'none';
    }

    // Scroll hint fade
    if (hintRef.current) {
      hintRef.current.style.opacity = String(Math.max(0, 1 - progress * 5));
    }
  }, []);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  return (
    <section ref={sectionRef} className="hero-scroll-section">
      <div className="hero-sticky">
        {/* Three.js 3D Glass Canvas */}
        <GlassScene scrollProgress={scrollProgress} />

        {/* Overlay content */}
        <div className="hero-overlay">
          <div className="hero-sub" ref={subRef} style={{ opacity: 0 }}>
            <p className="hero-subtitle">
              Analyze social media posts from 6 platforms
            </p>
            <div className="hero-cta">
              <Button variant="primary" size="lg" href="/register">
                Get started
              </Button>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="hero-scroll-hint" ref={hintRef}>
          <div className="hero-scroll-track">
            <div className="hero-scroll-dot" />
          </div>
          <span className="hero-scroll-label">Scroll</span>
        </div>
      </div>
    </section>
  );
};
