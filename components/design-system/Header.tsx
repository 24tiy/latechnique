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
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        scrolled
          ? 'bg-white/80 backdrop-blur-md border-b border-black/10'
          : 'bg-transparent'
      )}
      style={{ height: 'var(--header-height)' }}
    >
      <div className="container h-full">
        <div className="flex items-center justify-between h-full">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl font-bold tracking-tight">LaTechnique</span>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <Link
              href="#features"
              className="text-sm font-medium hover:opacity-70 transition-opacity"
            >
              Возможности
            </Link>
            <Link
              href="#pricing"
              className="text-sm font-medium hover:opacity-70 transition-opacity"
            >
              Тарифы
            </Link>
            <Link
              href="#how-it-works"
              className="text-sm font-medium hover:opacity-70 transition-opacity"
            >
              Как это работает
            </Link>
          </nav>

          {/* CTA Buttons */}
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
