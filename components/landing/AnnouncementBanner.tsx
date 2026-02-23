'use client';

import React, { useState } from 'react';
import { X, ArrowRight } from 'lucide-react';

export const AnnouncementBanner: React.FC = () => {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div className="announcement-banner" role="banner">
      <div className="announcement-inner">
        <span className="announcement-badge">Новое</span>
        <p className="announcement-text">
          Добавлена поддержка Likee и массовый экспорт до 1000 ссылок
        </p>
        <a href="#features" className="announcement-link">
          Узнать больше <ArrowRight className="w-3 h-3" />
        </a>
      </div>
      <button
        className="announcement-close"
        onClick={() => setDismissed(true)}
        aria-label="Закрыть"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
