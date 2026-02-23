'use client';

import React from 'react';
import { Card } from '../design-system/Card';
import { Button } from '../design-system/Button';
import { ScrollReveal } from '../design-system/ScrollReveal';
import { Check } from 'lucide-react';
import type { PricingTier } from '@/types';

const pricingTiers: PricingTier[] = [
  {
    name: 'Бесплатно',
    price: '0₽',
    description: 'Попробуйте сервис без регистрации карты',
    features: [
      '3 бесплатные ссылки',
      'Все 6 платформ',
      'Экспорт в CSV/XLSX',
      'История на 30 дней',
    ],
    cta: 'Начать бесплатно',
  },
  {
    name: 'По запросу',
    price: '100₽',
    description: 'Платите только за то, что используете',
    features: [
      '100₽ за 1 ссылку',
      'Все возможности бесплатного',
      'Без абонентской платы',
      'Оплата через ЮКасса',
    ],
    highlighted: true,
    cta: 'Начать использовать',
  },
  {
    name: 'Пакеты',
    price: 'Скоро',
    description: 'Выгодные тарифы для больших объёмов',
    features: [
      'Скидки до 30%',
      '100+ ссылок в пакете',
      'Приоритетная обработка',
      'API доступ',
    ],
    cta: 'Узнать больше',
  },
];

export const Pricing: React.FC = () => {
  return (
    <section id="pricing" className="section" style={{ background: '#fafafa' }}>
      <div className="container">
        <ScrollReveal>
          <div className="text-center mb-16">
            <h2 className="h2 mb-4">Прозрачное ценообразование</h2>
            <p className="lead max-w-2xl mx-auto text-muted">
              Выберите план, который подходит именно вам
            </p>
          </div>

          <div className="grid-container" style={{ alignItems: 'stretch' }}>
            {pricingTiers.map((tier) => (
              <div
                key={tier.name}
                className="col-span-12 md:col-span-6 lg:col-span-4 reveal-child"
              >
                {tier.highlighted ? (
                  /* Популярная карточка — поднята и акцентирована */
                  <div className="pricing-featured-wrapper">
                    <div className="pricing-featured-badge">Популярный</div>
                    <Card padding="lg" className="h-full pricing-card-featured">
                      <PricingCardContent tier={tier} highlighted />
                    </Card>
                  </div>
                ) : (
                  /* Обычные карточки — полная читаемость, без blur/scale */
                  <Card padding="lg" className="h-full pricing-card-plain">
                    <PricingCardContent tier={tier} highlighted={false} />
                  </Card>
                )}
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <p className="body-small" style={{ color: '#9aa4b8' }}>
              Все цены указаны с учётом НДС. Безопасная оплата через ЮКасса.
            </p>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
};

interface PricingCardContentProps {
  tier: PricingTier;
  highlighted?: boolean;
}

const PricingCardContent: React.FC<PricingCardContentProps> = ({ tier, highlighted }) => {
  const isComingSoon = tier.price === 'Скоро';

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="mb-6">
        <h3 className="h4 mb-2" style={{ color: '#0f1729' }}>{tier.name}</h3>
        <p className="body-small mb-4" style={{ color: '#9aa4b8' }}>
          {tier.description}
        </p>
        <div className="flex items-baseline gap-2">
          <span
            className="text-4xl font-bold"
            style={{ color: highlighted ? '#4c96f7' : '#0f1729' }}
          >
            {tier.price}
          </span>
          {!isComingSoon && tier.price !== '0₽' && (
            <span className="text-sm" style={{ color: '#9aa4b8' }}>
              /ссылка
            </span>
          )}
        </div>
      </div>

      {/* Features */}
      <ul className="space-y-3 mb-8 flex-grow">
        {tier.features.map((feature) => (
          <li key={feature} className="flex items-start gap-3">
            <div
              className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
              style={{ background: 'rgba(16, 185, 129, 0.1)' }}
            >
              <Check className="w-3 h-3" style={{ color: '#10b981' }} />
            </div>
            <span className="body-small" style={{ color: '#4a5568' }}>
              {feature}
            </span>
          </li>
        ))}
      </ul>

      {/* Иерархия кнопок:
          highlighted → primary (filled)
          free tier   → secondary (outline)
          coming soon → tertiary (ghost) */}
      <Button
        variant={highlighted ? 'primary' : isComingSoon ? 'tertiary' : 'secondary'}
        size="lg"
        href={isComingSoon ? '#' : '/register'}
        className="w-full"
      >
        {tier.cta}
      </Button>
    </div>
  );
};
