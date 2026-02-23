'use client';

import React, { useRef, useEffect, useState } from 'react';

const lines = [
  { text: 'НЕ ТЕРЯЙТЕ', italic: false },
  { text: 'хорошие идеи', italic: true },
  { text: 'В ПЛОХИХ', italic: false },
  { text: 'СИСТЕМАХ', italic: false },
];

export const StatementSection: React.FC = () => {
  const ref = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.15 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <section className="statement-section" ref={ref}>
      <div className="statement-bg" />
      <div className="container" style={{ position: 'relative', zIndex: 2 }}>
        <div className="statement-content">
          {lines.map((line, i) => (
            <div
              key={i}
              className={`statement-line${visible ? ' statement-visible' : ''}`}
              style={{ transitionDelay: `${i * 0.14}s` }}
            >
              {line.italic ? (
                <em className="statement-italic">{line.text}</em>
              ) : (
                <span>{line.text}</span>
              )}
            </div>
          ))}

          <div
            className={`statement-sub${visible ? ' statement-visible' : ''}`}
            style={{ transitionDelay: '0.65s' }}
          >
            <p>
              Держите все посты под контролем — автоматически и без лишних усилий.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
