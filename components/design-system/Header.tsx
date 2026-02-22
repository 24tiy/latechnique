'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from './Button';

export const Header: React.FC = () => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50"
      style={{
        height: 'var(--header-height)',
        background: scrolled ? 'rgba(250, 250, 250, 0.92)' : 'transparent',
        backdropFilter: scrolled ? 'blur(12px)' : 'none',
        WebkitBackdropFilter: scrolled ? 'blur(12px)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(15, 23, 41, 0.06)' : 'none',
        transition: 'background 0.4s cubic-bezier(0.22, 1, 0.36, 1), border-color 0.4s cubic-bezier(0.22, 1, 0.36, 1)',
      }}
    >
      <div className="container h-full">
        <div className="flex items-center justify-between h-full">
          {/* Left nav */}
          <nav className="hidden md:flex items-center gap-8">
            <Link href="#features" className="nav-link">
              Возможности
            </Link>
            <Link href="#pricing" className="nav-link">
              Тарифы
            </Link>
            <Link href="#how-it-works" className="nav-link">
              Как это работает
            </Link>
          </nav>

          {/* Center space for 3D text to dock into */}
          <div className="flex-1" />

          {/* Right buttons */}
          <div className="flex items-center gap-3">
            <Button variant="tertiary" size="sm" href="/login">
              Войти
            </Button>
            <Button variant="primary" size="sm" href="/register">
              Начать
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};
