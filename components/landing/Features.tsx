'use client';

import React from 'react';
import { Card } from '../design-system/Card';
import { ScrollReveal } from '../design-system/ScrollReveal';
import {
  Upload,
  BarChart3,
  Download,
  Clock,
  Shield,
  Zap,
} from 'lucide-react';
import type { Feature } from '@/types';

const features: Feature[] = [
  {
    icon: Upload,
    title: 'Массовая загрузка',
    description:
      'Загружайте до 1000 ссылок за раз через CSV/XLSX файлы или вставляйте вручную.',
  },
  {
    icon: BarChart3,
    title: 'Детальная статистика',
    description:
      'Просмотры, лайки, комментарии, репосты, избранное и автоматический расчет ER%.',
  },
  {
    icon: Download,
    title: 'Экспорт данных',
    description:
      'Скачивайте результаты в CSV или XLSX формате для дальнейшей работы.',
  },
  {
    icon: Clock,
    title: 'История запросов',
    description:
      'Все ваши анализы хранятся 30 дней с возможностью повторного просмотра.',
  },
  {
    icon: Shield,
    title: 'Безопасность',
    description:
      'Ваши данные защищены и не передаются третьим лицам. Полная конфиденциальность.',
  },
  {
    icon: Zap,
    title: 'Быстрая обработка',
    description:
      'Результаты готовы за секунды благодаря умному кэшированию и параллельной обработке.',
  },
];

// Brand icon accent colors for light theme
const iconColors = [
  { bg: 'rgba(76, 150, 247, 0.1)', color: '#4c96f7' },
  { bg: 'rgba(99, 102, 241, 0.1)', color: '#6366f1' },
  { bg: 'rgba(16, 185, 129, 0.1)', color: '#10b981' },
  { bg: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' },
  { bg: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6' },
  { bg: 'rgba(20, 184, 166, 0.1)', color: '#14b8a6' },
];

export const Features: React.FC = () => {
  return (
    <section id="features" className="section" style={{ background: '#fafafa' }}>
      <div className="container">
        <ScrollReveal>
          {/* Section Header */}
          <div className="text-center mb-16">
            <h2 className="h2 mb-4">Всё что нужно для анализа</h2>
            <p className="lead max-w-2xl mx-auto text-muted">
              Мощные инструменты для работы со статистикой социальных сетей
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid-container">
            {features.map((feature, idx) => {
              const ic = iconColors[idx % iconColors.length];
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className="col-span-12 md:col-span-6 lg:col-span-4 reveal-child"
                >
                  <Card hover padding="lg" className="h-full">
                    <div className="flex flex-col gap-4">
                      {/* Icon */}
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center"
                        style={{ background: ic.bg, color: ic.color }}
                      >
                        <Icon className="w-6 h-6" />
                      </div>

                      {/* Title */}
                      <h3 className="h4" style={{ color: '#0f1729' }}>{feature.title}</h3>

                      {/* Description */}
                      <p className="body-small" style={{ color: '#9aa4b8' }}>
                        {feature.description}
                      </p>
                    </div>
                  </Card>
                </div>
              );
            })}
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
};
