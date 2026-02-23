'use client';

import React from 'react';
import Link from 'next/link';
import { GrassFooter } from './GrassFooter';

const nav = {
  product: {
    title: 'Продукт',
    links: [
      { label: 'Возможности', href: '#features' },
      { label: 'Тарифы', href: '#pricing' },
      { label: 'Как это работает', href: '#how-it-works' },
      { label: 'API документация', href: '/docs' },
    ],
  },
  platforms: {
    title: 'Платформы',
    links: [
      { label: 'TikTok', href: '/platforms/tiktok' },
      { label: 'Instagram', href: '/platforms/instagram' },
      { label: 'YouTube', href: '/platforms/youtube' },
      { label: 'VK', href: '/platforms/vk' },
      { label: 'Telegram', href: '/platforms/telegram' },
    ],
  },
  company: {
    title: 'Компания',
    links: [
      { label: 'О нас', href: '/about' },
      { label: 'Блог', href: '/blog' },
      { label: 'Карьера', href: '/careers' },
      { label: 'Контакты', href: '/contact' },
    ],
  },
  support: {
    title: 'Поддержка',
    links: [
      { label: 'Справочный центр', href: '/help' },
      { label: 'Статус сервисов', href: '/status' },
      { label: 'Конфиденциальность', href: '/privacy' },
      { label: 'Условия', href: '/terms' },
    ],
  },
};

export const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer style={{ background: '#fafafa', position: 'relative' }}>
      {/* ── Навигационная секция ── */}
      <div className="footer-nav-section">
        <div className="container">
          <div className="footer-grid">
            {/* Бренд */}
            <div className="footer-brand-col">
              <div className="footer-brand-name">LaTechNique</div>
              <p className="footer-brand-desc">
                Профессиональный анализ статистики постов из социальных сетей
              </p>
              <div className="footer-socials">
                {/* Telegram */}
                
                  href="https://t.me/latechnique"
                  className="footer-social-link"
                  aria-label="Telegram"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.248-2.012 9.483c-.148.68-.537.847-1.087.527l-3-2.21-1.447 1.393c-.16.16-.294.294-.604.294l.214-3.035 5.53-4.997c.24-.214-.052-.333-.372-.119L6.896 13.6l-2.947-.921c-.64-.2-.653-.64.133-.948l11.515-4.44c.533-.194 1-.12.965.957z" />
                  </svg>
                </a>
                {/* VK */}
                
                  href="https://vk.com/latechnique"
                  className="footer-social-link"
                  aria-label="VK"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M15.684 0H8.316C1.592 0 0 1.592 0 8.316v7.368C0 22.408 1.592 24 8.316 24h7.368C22.408 24 24 22.408 24 15.684V8.316C24 1.592 22.391 0 15.684 0zm3.692 17.123h-1.744c-.66 0-.862-.523-2.049-1.713-1.033-1.009-1.49-1.147-1.744-1.147-.356 0-.458.102-.458.593v1.566c0 .422-.135.677-1.252.677-1.846 0-3.896-1.12-5.339-3.202C4.708 11.14 4.155 9.244 4.155 8.822c0-.254.102-.49.593-.49h1.744c.44 0 .61.203.779.677.863 2.49 2.303 4.675 2.896 4.675.22 0 .322-.102.322-.66V10.95c-.068-1.186-.695-1.287-.695-1.71 0-.203.17-.407.44-.407h2.744c.373 0 .508.203.508.643v3.473c0 .372.17.508.271.508.22 0 .407-.136.813-.542 1.252-1.406 2.151-3.574 2.151-3.574.119-.254.305-.49.745-.49h1.744c.525 0 .644.27.525.643-.22 1.017-2.354 4.031-2.354 4.031-.186.305-.254.44 0 .78.186.254.796.779 1.202 1.252.745.847 1.32 1.558 1.473 2.049.17.49-.085.745-.576.745z" />
                  </svg>
                </a>
                {/* GitHub */}
                
                  href="https://github.com/latechnique"
                  className="footer-social-link"
                  aria-label="GitHub"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
                  </svg>
                </a>
              </div>
            </div>

            {/* Навигационные колонки */}
            {Object.values(nav).map((col) => (
              <div key={col.title} className="footer-nav-col">
                <h4 className="footer-col-title">{col.title}</h4>
                <ul className="footer-col-links">
                  {col.links.map((link) => (
                    <li key={link.label}>
                      <Link href={link.href} className="footer-link">
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Нижняя полоска */}
          <div className="footer-bottom">
            <p className="footer-copyright">
              © {currentYear} LaTechNique. Все права защищены.
            </p>
            <div className="footer-bottom-links">
              <Link href="/privacy" className="footer-bottom-link">
                Конфиденциальность
              </Link>
              <Link href="/terms" className="footer-bottom-link">
                Условия
              </Link>
              <Link href="/cookies" className="footer-bottom-link">
                Cookies
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ── Трава + надпись ── */}
      <div style={{ position: 'relative' }}>
        <GrassFooter />
        <div
          className="text-center"
          style={{
            position: 'absolute',
            bottom: '8px',
            left: 0,
            right: 0,
            zIndex: 10,
          }}
        >
          <p
            className="body-xs"
            style={{
              color: 'rgba(255,255,255,0.65)',
              textShadow: '0 1px 4px rgba(0,0,0,0.4)',
            }}
          >
            Сделано с ❤️ в России
          </p>
        </div>
      </div>
    </footer>
  );
};
