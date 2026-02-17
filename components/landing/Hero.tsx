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
  const progressRef = useRef(0);

  /* ═══════ GSAP ScrollTrigger ═══════ */
  useEffect(() => {
    let ctx: any;

    const initGSAP = async () => {
      const gsap = (await import('gsap')).default;
      const { ScrollTrigger } = await import('gsap/ScrollTrigger');
      gsap.registerPlugin(ScrollTrigger);

      const section = sectionRef.current;
      if (!section) return;

      ctx = gsap.context(() => {
        // Master scroll progress
        ScrollTrigger.create({
          trigger: section,
          start: 'top top',
          end: 'bottom bottom',
          scrub: true,
          onUpdate: (self) => {
            const p = self.progress;
            progressRef.current = p;
            setScrollProgress(p);
          },
        });

        // Subtitle reveal at ~65% progress
        if (subRef.current) {
          gsap.fromTo(
            subRef.current,
            { opacity: 0, y: 24 },
            {
              opacity: 1,
              y: 0,
              duration: 1,
              ease: 'power3.out',
              scrollTrigger: {
                trigger: section,
                start: '55% top',
                end: '75% top',
                scrub: 1,
              },
            }
          );
        }

        // Scroll hint fades out quickly
        if (hintRef.current) {
          gsap.to(hintRef.current, {
            opacity: 0,
            duration: 0.5,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: section,
              start: '2% top',
              end: '8% top',
              scrub: true,
            },
          });
        }
      }, section);
    };

    initGSAP();

    return () => ctx?.revert?.();
  }, []);

  // Canvas wrapper follows sticky behavior based on progress
  const isDockedToHeader = scrollProgress >= 0.65;

  return (
    <section ref={sectionRef} className="hero-scroll-section">
      <div className="hero-sticky">
        {/* Glass 3D canvas */}
        <div className="glass-canvas-wrapper"
          style={{
            position: isDockedToHeader ? 'fixed' : 'absolute',
            top: 0, left: 0, right: 0,
            height: isDockedToHeader ? 'var(--header-height)' : '100vh',
            zIndex: isDockedToHeader ? 100 : 1,
            pointerEvents: 'none',
            transition: 'height 0.4s cubic-bezier(.22, 1, .36, 1)',
          }}
        >
          <GlassScene scrollProgress={scrollProgress} />
        </div>

        <div className="hero-overlay">
          <div className="hero-sub" ref={subRef}>
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
