import React from 'react';
import Link from 'next/link';

export const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-black/10 py-8">
      <div className="container">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          {/* Brand */}
          <div className="text-center md:text-left">
            <Link href="/" className="inline-block mb-2">
              <span className="text-lg font-bold italic">LaTechNique</span>
            </Link>
            <p className="body-small text-muted">
              Платформа аналитики социальных сетей
            </p>
          </div>

          {/* Links */}
          <div className="flex items-center gap-8">
            <Link
              href="/privacy"
              className="body-small text-muted hover:text-black transition-colors"
            >
              Конфиденциальность
            </Link>
            <Link
              href="/terms"
              className="body-small text-muted hover:text-black transition-colors"
            >
              Условия
            </Link>
            <a
              href="https://t.me/latechnique_support"
              target="_blank"
              rel="noopener noreferrer"
              className="body-small text-muted hover:text-black transition-colors"
            >
              Telegram
            </a>
          </div>

          {/* Copyright */}
          <p className="body-small text-muted">
            © {currentYear} LaTechNique
          </p>
        </div>
      </div>
    </footer>
  );
};
