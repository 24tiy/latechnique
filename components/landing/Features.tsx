'use client';

import React from 'react';
import { Card } from '../design-system/Card';
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

export const Features: React.FC = () => {
  return (
    <section id="features" className="section">
      <div className="container">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="h2 mb-4">Всё что нужно для анализа</h2>
          <p className="lead max-w-2xl mx-auto text-muted">
            Мощные инструменты для работы со статистикой социальных сетей
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid-container">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="col-span-12 md:col-span-6 lg:col-span-4"
              style={{
                animation: 'slideUp var(--duration-medium) var(--ease) backwards',
                animationDelay: `${index * 0.1}s`,
              }}
            >
              <Card hover padding="lg" className="h-full">
                <div className="flex flex-col gap-4">
                  {/* Icon */}
                  <div className="w-12 h-12 rounded-lg bg-haze flex items-center justify-center">
                    <feature.icon className="w-6 h-6" />
                  </div>

                  {/* Title */}
                  <h3 className="h4">{feature.title}</h3>

                  {/* Description */}
                  <p className="body-small text-muted">{feature.description}</p>
                </div>
              </Card>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
