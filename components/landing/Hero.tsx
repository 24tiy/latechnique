'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { Button } from '../design-system/Button';

const GlassScene = dynamic(() => import('./GlassScene'), {
  ssr: false,
  loading: () => (
    <div className="glass-loader">
      <span>Загрузка 3D…</span>
    </div>
  ),
});

export const Hero: React.FC = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const subRef = useRef<HTMLDivElement>(null);
  const hintRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);

  const handleScroll = useCallback(() => {
    const section = sectionRef.current;
    if (!section) return;

    const rect = section.getBoundingClientRect();
    const total = section.offsetHeight - window.innerHeight;
    if (total <= 0) return;

    const raw = -rect.top / total;
    const progress = Math.max(0, Math.min(1, raw));
    setScrollProgress(progress);

    // Subtitle appears at ~70% scroll
    if (subRef.current) {
      const subT = Math.max(0, (progress - 0.65) / 0.35);
      subRef.current.style.opacity = String(subT);
      subRef.current.style.transform = `translateY(${16 * (1 - subT)}px)`;
    }

    // Scroll hint fades out quickly
    if (hintRef.current) {
      hintRef.current.style.opacity = String(Math.max(0, 1 - progress * 6));
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
        <GlassScene scrollProgress={scrollProgress} />

        <div className="hero-overlay">
          <div className="hero-sub" ref={subRef} style={{ opacity: 0 }}>
            <p className="hero-subtitle">
              Анализ статистики постов из 6 социальных платформ
            </p>
            <div className="hero-cta">
              <Button variant="primary" size="lg" href="/register">
                Начать бесплатно
              </Button>
            </div>
          </div>
        </div>

        <div className="hero-scroll-hint" ref={hintRef}>
          <div className="hero-scroll-track">
            <div className="hero-scroll-dot" />
          </div>
          <span className="hero-scroll-label">Листайте</span>
        </div>
      </div>
    </section>
  );
};
