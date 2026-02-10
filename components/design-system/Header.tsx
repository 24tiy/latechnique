'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from './Button';
import { cn } from '@/lib/utils';

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
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-500',
        scrolled
          ? 'header-scrolled border-b border-black/5'
          : 'bg-transparent'
      )}
      style={{ height: 'var(--header-height)' }}
    >
      <div className="container h-full">
        <div className="flex items-center justify-between h-full">
          {/* Navigation — Left */}
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

          {/* Center space — 3D logo shows through here */}
          <div className="flex-1" />

          {/* CTA Buttons — Right */}
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
