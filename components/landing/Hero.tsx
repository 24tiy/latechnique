'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Button } from '../design-system/Button';

export const Hero: React.FC = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);

  const handleScroll = useCallback(() => {
    if (!sectionRef.current) return;

    const rect = sectionRef.current.getBoundingClientRect();
    const sectionHeight = sectionRef.current.offsetHeight;

    // Calculate how far we've scrolled through the section
    // progress 0 = top of section is at top of viewport
    // progress 1 = bottom of section reaches top of viewport
    const scrolled = -rect.top;
    const totalScrollable = sectionHeight - window.innerHeight;

    if (totalScrollable <= 0) {
      setScrollProgress(0);
      return;
    }

    const raw = scrolled / totalScrollable;
    const clamped = Math.max(0, Math.min(1, raw));

    setScrollProgress(clamped);
  }, []);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    // Initialize on mount
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  // Map scroll progress to blur value
  // At scroll 0: max blur (20px)
  // At scroll 1: no blur (0px)
  // Using a subtle easing curve for natural feel
  const eased = 1 - Math.pow(1 - scrollProgress, 2.2);
  const maxBlur = 20;
  const blurValue = maxBlur * (1 - eased);

  // Opacity also shifts subtly
  const textOpacity = 0.3 + 0.7 * eased;

  // Subtle letter-spacing tightening as it comes into focus
  const letterSpacing = -0.03 + (-0.01 * eased);

  return (
    <section
      ref={sectionRef}
      className="hero-scroll-section"
    >
      {/* Sticky container that stays in viewport while scrolling */}
      <div className="hero-sticky">
        {/* Minimal background — very light, clean */}
        <div className="hero-bg" />

        <div className="hero-content">
          {/* The animated title */}
          <h1
            className="hero-title"
            style={{
              filter: `blur(${blurValue}px)`,
              opacity: textOpacity,
              letterSpacing: `${letterSpacing}em`,
              willChange: 'filter, opacity',
            }}
          >
            <span className="hero-title-la">La</span>
            {' '}
            <span className="hero-title-technique">TechNique</span>
          </h1>

          {/* Subtitle and CTA fade in only when text is nearly sharp */}
          <div
            className="hero-sub"
            style={{
              opacity: Math.max(0, (eased - 0.6) / 0.4),
              transform: `translateY(${8 * (1 - Math.max(0, (eased - 0.5) / 0.5))}px)`,
              filter: `blur(${Math.max(0, 4 * (1 - Math.max(0, (eased - 0.5) / 0.5)))}px)`,
              willChange: 'opacity, transform, filter',
            }}
          >
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

        {/* Scroll indicator — visible only at the beginning */}
        <div
          className="hero-scroll-hint"
          style={{
            opacity: Math.max(0, 1 - scrollProgress * 4),
          }}
        >
          <div className="hero-scroll-dot-track">
            <div className="hero-scroll-dot" />
          </div>
          <span className="hero-scroll-label">Scroll</span>
        </div>
      </div>
    </section>
  );
};
