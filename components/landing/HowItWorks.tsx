'use client';

import React from 'react';
import { Card } from '../design-system/Card';
import { ScrollReveal } from '../design-system/ScrollReveal';
import { Upload, Search, Download } from 'lucide-react';

const steps = [
  {
    icon: Upload,
    number: '01',
    title: 'Загрузите ссылки',
    description:
      'Вставьте URL вручную или загрузите CSV/XLSX файл с до 1000 ссылок на посты.',
    color: '#4c96f7',
    bg: 'rgba(76, 150, 247, 0.1)',
  },
  {
    icon: Search,
    number: '02',
    title: 'Получите анализ',
    description:
      'Система автоматически парсит метрики: просмотры, лайки, комментарии, репосты и вычисляет ER%.',
    color: '#6366f1',
    bg: 'rgba(99, 102, 241, 0.1)',
  },
  {
    icon: Download,
    number: '03',
    title: 'Экспортируйте данные',
    description:
      'Скачайте готовую таблицу с результатами в CSV или XLSX для дальнейшей работы.',
    color: '#10b981',
    bg: 'rgba(16, 185, 129, 0.1)',
  },
];

const platforms = [
  { name: 'TikTok', emoji: '🎵' },
  { name: 'Instagram', emoji: '📸' },
  { name: 'YouTube', emoji: '▶️' },
  { name: 'VK', emoji: '🌐' },
  { name: 'Telegram', emoji: '✈️' },
  { name: 'Likee', emoji: '⭐' },
];

// Тройное дублирование для бесшовного marquee
const marqueeItems = [...platforms, ...platforms, ...platforms];

export const HowItWorks: React.FC = () => {
  return (
    <section id="how-it-works" className="section" style={{ background: '#f4f7fb' }}>
      <div className="container">
        <ScrollReveal>
          <div className="text-center mb-16">
            <h2 className="h2 mb-4">Как это работает</h2>
            <p className="lead max-w-2xl mx-auto text-muted">
              Получите детальную статистику всего в 3 шага
            </p>
          </div>

          <div className="grid-container">
            {steps.map((step) => (
              <div key={step.number} className="col-span-12 lg:col-span-4 reveal-child">
                <Card padding="lg" className="h-full">
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-4">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center"
                        style={{ background: step.bg }}
                      >
                        <step.icon className="w-6 h-6" style={{ color: step.color }} />
                      </div>
                      <span
                        className="text-5xl font-bold tabular-nums"
                        style={{ color: 'rgba(15, 23, 41, 0.07)', lineHeight: 1 }}
                      >
                        {step.number}
                      </span>
                    </div>
                    <h3 className="h4" style={{ color: '#0f1729' }}>
                      {step.title}
                    </h3>
                    <p className="body-small" style={{ color: '#9aa4b8' }}>
                      {step.description}
                    </p>
                  </div>
                </Card>
              </div>
            ))}
          </div>
        </ScrollReveal>
      </div>

      {/* Бесконечная лента платформ */}
      <div className="platforms-marquee-wrapper">
        <p className="platforms-marquee-label">Поддерживаемые платформы</p>
        <div className="platforms-marquee">
          <div className="platforms-marquee-track">
            {marqueeItems.map((p, i) => (
              <div key={i} className="platforms-marquee-item">
                <span className="platforms-emoji">{p.emoji}</span>
                <span className="platforms-name">{p.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
