'use client';

import React from 'react';
import { Card } from '../design-system/Card';
import { Upload, Search, Download } from 'lucide-react';

const steps = [
  {
    icon: Upload,
    number: '01',
    title: 'Загрузите ссылки',
    description:
      'Вставьте URL вручную или загрузите CSV/XLSX файл с до 1000 ссылок на посты.',
  },
  {
    icon: Search,
    number: '02',
    title: 'Получите анализ',
    description:
      'Система автоматически парсит метрики: просмотры, лайки, комментарии, репосты и вычисляет ER%.',
  },
  {
    icon: Download,
    number: '03',
    title: 'Экспортируйте данные',
    description:
      'Скачайте готовую таблицу с результатами в CSV или XLSX для дальнейшей работы.',
  },
];

export const HowItWorks: React.FC = () => {
  return (
    <section id="how-it-works" className="section">
      <div className="container">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="h2 mb-4">Как это работает</h2>
          <p className="lead max-w-2xl mx-auto text-muted">
            Получите детальную статистику всего в 3 шага
          </p>
        </div>

        {/* Steps */}
        <div className="grid-container">
          {steps.map((step, index) => (
            <div
              key={step.number}
              className="col-span-12 lg:col-span-4"
              style={{
                animation: 'slideUp var(--duration-medium) var(--ease) backwards',
                animationDelay: `${index * 0.15}s`,
              }}
            >
              <Card padding="lg" className="h-full">
                <div className="flex flex-col gap-4">
                  {/* Icon & Number */}
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-altitude/10 flex items-center justify-center">
                      <step.icon className="w-6 h-6 text-altitude" />
                    </div>
                    <span className="text-5xl font-bold text-haze">
                      {step.number}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="h4">{step.title}</h3>

                  {/* Description */}
                  <p className="body-small text-muted">{step.description}</p>
                </div>
              </Card>

              {/* Arrow (only between cards, not after last) */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-1/2 -right-12 -translate-y-1/2">
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    className="text-dust"
                  >
                    <path
                      d="M5 12h14m0 0l-6-6m6 6l-6 6"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Supported Platforms */}
        <div className="mt-20 text-center">
          <p className="body-small text-muted mb-8">Поддерживаемые платформы:</p>
          <div className="flex flex-wrap items-center justify-center gap-6">
            {['TikTok', 'Instagram', 'YouTube', 'VK', 'Telegram', 'Likee'].map(
              (platform) => (
                <div
                  key={platform}
                  className="px-6 py-3 rounded-lg bg-haze font-medium text-sm"
                >
                  {platform}
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
