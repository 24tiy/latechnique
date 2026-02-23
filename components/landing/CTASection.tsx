'use client';

import React, { useState } from 'react';
import { ArrowRight } from 'lucide-react';

export const CTASection: React.FC = () => {
  const [email, setEmail] = useState('');

  return (
    <section className="cta-section">
      <div className="cta-bg" />
      <div className="container" style={{ position: 'relative', zIndex: 2 }}>
        <div className="cta-content">
          <div className="cta-text-block">
            <p className="cta-eyebrow">Начните сегодня</p>
            <h2 className="cta-heading">
              Дайте своим идеям{' '}
              <em className="cta-italic">пространство</em>{' '}
              для роста
            </h2>
            <p className="cta-subtext">
              3 ссылки бесплатно. Без регистрации карты. Без обязательств.
            </p>
          </div>

          <form
            className="cta-form"
            onSubmit={(e) => {
              e.preventDefault();
              window.location.href = '/register';
            }}
          >
            <div className="cta-input-wrapper">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Введите ваш email"
                className="cta-input"
                required
              />
              <button type="submit" className="cta-btn">
                Начать бесплатно
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
            <p className="cta-disclaimer">
              Нажимая кнопку, вы соглашаетесь с{' '}
              <a href="/terms" className="cta-disclaimer-link">
                условиями использования
              </a>
            </p>
          </form>
        </div>
      </div>
    </section>
  );
};
