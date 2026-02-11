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
    <section id="how-it-works" className="section" style={{ background: 'transparent' }}>
      <div className="container">
        <ScrollReveal>
          {/* Section Header */}
          <div className="text-center mb-16">
            <h2 className="h2 mb-4">Как это работает</h2>
            <p className="lead max-w-2xl mx-auto text-muted">
              Получите детальную статистику всего в 3 шага
            </p>
          </div>

          {/* Steps */}
          <div className="grid-container">
            {steps.map((step) => (
              <div
                key={step.number}
                className="col-span-12 lg:col-span-4 reveal-child"
              >
                <Card padding="lg" className="h-full">
                  <div className="flex flex-col gap-4">
                    {/* Icon & Number */}
                    <div className="flex items-center gap-4">
                      <div
                        className="w-12 h-12 rounded-lg flex items-center justify-center"
                        style={{ background: 'rgba(99,102,241,0.2)' }}
                      >
                        <step.icon className="w-6 h-6 text-white" />
                      </div>
                      <span
                        className="text-5xl font-bold"
                        style={{ color: 'rgba(255,255,255,0.08)' }}
                      >
                        {step.number}
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className="h4">{step.title}</h3>

                    {/* Description */}
                    <p className="body-small text-muted">{step.description}</p>
                  </div>
                </Card>
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
                    className="px-6 py-3 rounded-lg font-medium text-sm text-white"
                    style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}
                  >
                    {platform}
                  </div>
                )
              )}
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
};
