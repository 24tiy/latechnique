'use client';

import React from 'react';
import { Button } from '../design-system/Button';
import { OrbsBackground } from '../design-system/OrbsBackground';
import { ArrowRight, Sparkles } from 'lucide-react';

export const Hero: React.FC = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Animated Background */}
      <OrbsBackground colors={['aurora', 'canopy', 'altitude']} />

      <div className="container relative z-10">
        <div className="grid-container">
          <div className="col-span-12 text-center animate-fadeIn">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 mb-8">
              <Sparkles className="w-4 h-4 text-aurora" />
              <span className="text-sm font-medium">
                Анализ постов из 6 социальных сетей
              </span>
            </div>

            {/* Main Title */}
            <h1 className="h1 mb-6 animate-slideUp" style={{ animationDelay: '0.1s' }}>
              Анализируйте
              <br />
              <span className="text-gradient">Статистику</span>
              <br />
              Постов
            </h1>

            {/* Subtitle */}
            <p
              className="lead max-w-2xl mx-auto mb-12 text-balance animate-slideUp"
              style={{ animationDelay: '0.2s' }}
            >
              Получайте подробную статистику постов из TikTok, Instagram, YouTube,
              VK, Telegram и Likee. Просто загрузите CSV или вставьте ссылки.
            </p>

            {/* CTA Buttons */}
            <div
              className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slideUp"
              style={{ animationDelay: '0.3s' }}
            >
              <Button variant="primary" size="lg" href="/register">
                Начать бесплатно
                <ArrowRight className="w-4 h-4" />
              </Button>
              <Button variant="secondary" size="lg" href="#how-it-works">
                Как это работает
              </Button>
            </div>

            {/* Stats */}
            <div
              className="flex flex-wrap items-center justify-center gap-8 mt-16 animate-slideUp"
              style={{ animationDelay: '0.4s' }}
            >
              <div className="text-center">
                <div className="text-3xl font-bold mb-1">6</div>
                <div className="text-sm text-muted">Платформ</div>
              </div>
              <div className="h-8 w-px bg-border-color" />
              <div className="text-center">
                <div className="text-3xl font-bold mb-1">3</div>
                <div className="text-sm text-muted">Бесплатных ссылки</div>
              </div>
              <div className="h-8 w-px bg-border-color" />
              <div className="text-center">
                <div className="text-3xl font-bold mb-1">30</div>
                <div className="text-sm text-muted">Дней хранения</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 rounded-full border-2 border-black/20 flex items-start justify-center p-2">
          <div className="w-1.5 h-1.5 rounded-full bg-black/40" />
        </div>
      </div>
    </section>
  );
};
