'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from './Button';

export const Header: React.FC = () => {
  const [scrolled, setScrolled] = useState(false);
  const [logoVisible, setLogoVisible] = useState(true);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      setScrolled(scrollY > 20);

      // Скрываем текстовый логотип, когда 3D-логотип «паркуется» в хедер
      const heroSection = document.querySelector(
        '.hero-scroll-section'
      ) as HTMLElement;
      if (heroSection) {
        const heroScrollable = heroSection.offsetHeight - window.innerHeight;
        const progress = heroScrollable > 0 ? Math.min(1, scrollY / heroScrollable) : 0;
        setLogoVisible(progress < 0.58);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className="fixed left-0 right-0 z-50"
      style={{
        top: 0,
        height: 'var(--header-height)',
        background: scrolled ? 'rgba(250, 250, 250, 0.92)' : 'transparent',
        backdropFilter: scrolled ? 'blur(16px) saturate(180%)' : 'none',
        WebkitBackdropFilter: scrolled ? 'blur(16px) saturate(180%)' : 'none',
        borderBottom: scrolled
          ? '1px solid rgba(15, 23, 41, 0.06)'
          : 'none',
        transition:
          'background 0.4s cubic-bezier(0.22, 1, 0.36, 1), border-color 0.4s cubic-bezier(0.22, 1, 0.36, 1)',
      }}
    >
      <div className="container h-full">
        <div className="flex items-center justify-between h-full gap-6">
          {/* ── Логотип (левый) ── */}
          <div
            style={{
              opacity: logoVisible ? 1 : 0,
              transition: 'opacity 0.45s cubic-bezier(0.22, 1, 0.36, 1)',
              flexShrink: 0,
              pointerEvents: logoVisible ? 'auto' : 'none',
            }}
          >
            <Link href="/" style={{ textDecoration: 'none' }}>
              <span
                style={{
                  fontFamily: "'Dancing Script', cursive",
                  fontSize: '1.5rem',
                  fontWeight: 700,
                  color: '#0f1729',
                  letterSpacing: '-0.01em',
                  lineHeight: 1,
                  display: 'block',
                }}
              >
                LaTechNique
              </span>
            </Link>
          </div>

          {/* ── Навигация (центр) ── */}
          <nav className="hidden md:flex items-center gap-8 flex-1 justify-center">
            <Link href="#features" className="nav-link">Возможности</Link>
            <Link href="#pricing" className="nav-link">Тарифы</Link>
            <Link href="#how-it-works" className="nav-link">Как это работает</Link>
          </nav>

          {/* ── 3 уровня CTA (правый) ── */}
          <div className="flex items-center gap-2" style={{ flexShrink: 0 }}>
            {/* Level 1 — только текст */}
            <Button variant="tertiary" size="sm" href="/login">
              Войти
            </Button>
            {/* Level 2 — outlined */}
            <Button variant="secondary" size="sm" href="/register">
              Начать бесплатно
            </Button>
            {/* Level 3 — filled (наивысший приоритет) */}
            <Button
              variant="primary"
              size="sm"
              href="/demo"
              className="hidden lg:inline-flex"
            >
              Демо
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};
