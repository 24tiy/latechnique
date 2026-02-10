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
              <span className="text-lg font-bold">LaTechnique</span>
            </Link>
            <p className="body-small text-muted">
              Social media analytics platform
            </p>
          </div>

          {/* Links */}
          <div className="flex items-center gap-8">
            <Link
              href="/privacy"
              className="body-small text-muted hover:text-black transition-colors"
            >
              Privacy
            </Link>
            <Link
              href="/terms"
              className="body-small text-muted hover:text-black transition-colors"
            >
              Terms
            </Link>
            <a
              href="https://twitter.com"
              target="_blank"
              rel="noopener noreferrer"
              className="body-small text-muted hover:text-black transition-colors"
            >
              Twitter
            </a>
          </div>

          {/* Copyright */}
          <p className="body-small text-muted">
            © {currentYear} LaTechnique
          </p>
        </div>
      </div>
    </footer>
  );
};
