'use client';

import React, { useEffect, useRef, useCallback } from 'react';
import { Button } from '../design-system/Button';

export const Hero: React.FC = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const shadowRef = useRef<HTMLDivElement>(null);
  const specularRef = useRef<HTMLDivElement>(null);
  const refractionRef = useRef<HTMLDivElement>(null);
  const chromaRRef = useRef<HTMLDivElement>(null);
  const chromaBRef = useRef<HTMLDivElement>(null);
  const causticsRef = useRef<HTMLDivElement>(null);
  const subRef = useRef<HTMLDivElement>(null);
  const hintRef = useRef<HTMLDivElement>(null);

  const mouseRef = useRef({ x: 0.5, y: 0.5 });

  const MAX_BLUR = 24;

  const ease = (t: number, power: number) => 1 - Math.pow(1 - t, power);

  const handleScroll = useCallback(() => {
    const section = sectionRef.current;
    const wrapper = wrapperRef.current;
    if (!section || !wrapper) return;

    const rect = section.getBoundingClientRect();
    const sH = section.offsetHeight;
    const scrolled = -rect.top;
    const total = sH - window.innerHeight;
    if (total <= 0) return;

    const raw = scrolled / total;
    const progress = Math.max(0, Math.min(1, raw));
    const e = ease(progress, 2.4);

    // Blur — glass comes into focus
    const blur = MAX_BLUR * (1 - e);
    wrapper.style.filter = `blur(${blur}px)`;

    // Opacity — glass materializes
    wrapper.style.opacity = String(0.25 + 0.75 * e);

    // Shadow intensifies as glass solidifies
    if (shadowRef.current) {
      shadowRef.current.style.opacity = String(0.5 + 0.5 * e);
    }

    // Specular highlight shifts with scroll + mouse
    if (specularRef.current) {
      const specX = 25 + 20 * e + (mouseRef.current.x - 0.5) * 10;
      const specY = 20 + 15 * e + (mouseRef.current.y - 0.5) * 8;
      specularRef.current.style.setProperty('--spec-x', specX + '%');
      specularRef.current.style.setProperty('--spec-y', specY + '%');
      specularRef.current.style.opacity = String(0.3 + 0.6 * e);
    }

    // Refraction color bands intensify
    if (refractionRef.current) {
      refractionRef.current.style.opacity = String(0.15 + 0.55 * e);
    }

    // Chromatic aberration decreases as glass sharpens
    const chromaShift = 1.5 * (1 - e * 0.6);
    if (chromaRRef.current) {
      const inner = chromaRRef.current.querySelector('.glass-layer') as HTMLElement;
      if (inner) inner.style.transform = `translate(${chromaShift}px, ${chromaShift * 0.3}px)`;
      chromaRRef.current.style.opacity = String(0.08 + 0.12 * e);
    }
    if (chromaBRef.current) {
      const inner = chromaBRef.current.querySelector('.glass-layer') as HTMLElement;
      if (inner) inner.style.transform = `translate(${-chromaShift}px, ${-chromaShift * 0.3}px)`;
      chromaBRef.current.style.opacity = String(0.06 + 0.1 * e);
    }

    // Caustics appear on background
    if (causticsRef.current) {
      causticsRef.current.style.opacity = String(Math.max(0, (e - 0.3) / 0.7) * 0.6);
    }

    // Subtle 3D tilt perspective
    const tiltY = 2 * (1 - e);
    wrapper.style.transform = `perspective(1200px) rotateX(${tiltY}deg) translateZ(0)`;

    // Subtitle fade in
    if (subRef.current) {
      const subE = Math.max(0, (e - 0.65) / 0.35);
      const subBlur = Math.max(0, 6 * (1 - subE));
      subRef.current.style.opacity = String(subE);
      subRef.current.style.transform = `translateY(${10 * (1 - subE)}px)`;
      subRef.current.style.filter = `blur(${subBlur}px)`;
    }

    // Scroll hint fades out
    if (hintRef.current) {
      hintRef.current.style.opacity = String(Math.max(0, 1 - progress * 5));
    }
  }, []);

  const handleMouseMove = useCallback((ev: MouseEvent) => {
    mouseRef.current.x = ev.clientX / window.innerWidth;
    mouseRef.current.y = ev.clientY / window.innerHeight;
  }, []);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll);
    document.addEventListener('mousemove', handleMouseMove);
    handleScroll();
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
      document.removeEventListener('mousemove', handleMouseMove);
    };
  }, [handleScroll, handleMouseMove]);

  const GlassText = () => (
    <div className="glass-layer">
      <span className="la">La </span>
      <span className="tn">TechNique</span>
    </div>
  );

  return (
    <section ref={sectionRef} className="hero-scroll-section">
      <div className="hero-sticky">
        {/* Studio-lit environment */}
        <div className="hero-env" />
        <div className="hero-caustics" ref={causticsRef} />

        <div className="hero-content">
          {/* ═══ 3D GLASS TITLE — 10 composited layers ═══ */}
          <div className="glass-title-wrapper" ref={wrapperRef}>
            {/* L0: Shadow / ground plane */}
            <div className="glass-shadow" ref={shadowRef}><GlassText /></div>
            {/* L1: Bevel / inner dark edge */}
            <div className="glass-bevel"><GlassText /></div>
            {/* L2: Chromatic aberration — red */}
            <div className="glass-chroma-r" ref={chromaRRef}><GlassText /></div>
            {/* L3: Chromatic aberration — blue */}
            <div className="glass-chroma-b" ref={chromaBRef}><GlassText /></div>
            {/* L4: Main glass body */}
            <div className="glass-body"><GlassText /></div>
            {/* L5: Internal refraction colors */}
            <div className="glass-refraction" ref={refractionRef}><GlassText /></div>
            {/* L6: Bright edge highlight */}
            <div className="glass-edge"><GlassText /></div>
            {/* L7: Specular hotspot */}
            <div className="glass-specular" ref={specularRef}><GlassText /></div>
            {/* L8: Frosted noise texture */}
            <div className="glass-frost"><GlassText /></div>
            {/* L9: Reflected text on surface */}
            <div className="glass-reflection"><GlassText /></div>
          </div>

          {/* Subtitle & CTA */}
          <div className="hero-sub" ref={subRef}>
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
          <span className="hero-scroll-text">Scroll</span>
        </div>
      </div>
    </section>
  );
};
