'use client';

import React from 'react';
import { GrassFooter } from './GrassFooter';

export const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer style={{ background: 'transparent', position: 'relative' }}>
      <GrassFooter />
      <div
        className="text-center py-4"
        style={{
          background: 'linear-gradient(180deg, rgba(10,40,10,0.85) 0%, rgba(5,25,5,0.95) 100%)',
        }}
      >
        <p className="body-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
          © {currentYear} LaTechNique
        </p>
      </div>
    </footer>
  );
};
