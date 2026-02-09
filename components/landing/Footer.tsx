import React from 'react';
import Link from 'next/link';

export const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-black/10 py-12">
      <div className="container">
        <div className="grid-container">
          {/* Brand */}
          <div className="col-span-12 md:col-span-4 mb-8 md:mb-0">
            <Link href="/" className="inline-block mb-4">
              <span className="text-xl font-bold">LaTechnique</span>
            </Link>
            <p className="body-small text-muted max-w-xs">
              Профессиональный анализ статистики постов из социальных сетей
            </p>
          </div>

          {/* Links */}
          <div className="col-span-6 md:col-span-2">
            <h4 className="font-semibold mb-4">Продукт</h4>
            <ul className="space-y-3">
              <li>
                <Link
                  href="#features"
                  className="body-small text-muted hover:text-black transition-colors"
                >
                  Возможности
                </Link>
              </li>
              <li>
                <Link
                  href="#pricing"
                  className="body-small text-muted hover:text-black transition-colors"
                >
                  Тарифы
                </Link>
              </li>
              <li>
                <Link
                  href="#how-it-works"
                  className="body-small text-muted hover:text-black transition-colors"
                >
                  Как работает
                </Link>
              </li>
            </ul>
          </div>

          <div className="col-span-6 md:col-span-2">
            <h4 className="font-semibold mb-4">Компания</h4>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/about"
                  className="body-small text-muted hover:text-black transition-colors"
                >
                  О нас
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="body-small text-muted hover:text-black transition-colors"
                >
                  Контакты
                </Link>
              </li>
              <li>
                <Link
                  href="/blog"
                  className="body-small text-muted hover:text-black transition-colors"
                >
                  Блог
                </Link>
              </li>
            </ul>
          </div>

          <div className="col-span-6 md:col-span-2">
            <h4 className="font-semibold mb-4">Правовая информация</h4>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/privacy"
                  className="body-small text-muted hover:text-black transition-colors"
                >
                  Конфиденциальность
                </Link>
              </li>
              <li>
                <Link
                  href="/terms"
                  className="body-small text-muted hover:text-black transition-colors"
                >
                  Условия использования
                </Link>
              </li>
              <li>
                <Link
                  href="/cookies"
                  className="body-small text-muted hover:text-black transition-colors"
                >
                  Cookies
                </Link>
              </li>
            </ul>
          </div>

          <div className="col-span-6 md:col-span-2">
            <h4 className="font-semibold mb-4">Поддержка</h4>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/help"
                  className="body-small text-muted hover:text-black transition-colors"
                >
                  Справка
                </Link>
              </li>
              <li>
                <Link
                  href="/api"
                  className="body-small text-muted hover:text-black transition-colors"
                >
                  API документация
                </Link>
              </li>
              <li>
                <Link
                  href="/status"
                  className="body-small text-muted hover:text-black transition-colors"
                >
                  Статус сервиса
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-12 pt-8 border-t border-black/10">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="body-small text-muted">
              © {currentYear} LaTechnique. Все права защищены.
            </p>
            <div className="flex items-center gap-6">
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="body-small text-muted hover:text-black transition-colors"
              >
                Twitter
              </a>
              <a
                href="https://telegram.org"
                target="_blank"
                rel="noopener noreferrer"
                className="body-small text-muted hover:text-black transition-colors"
              >
                Telegram
              </a>
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="body-small text-muted hover:text-black transition-colors"
              >
                GitHub
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
