'use client';

import React from 'react';
import { GrassFooter } from './GrassFooter';

export const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer style={{ background: 'transparent', position: 'relative' }}>
      {/* Grass canvas — transparent background, blades grow up from bottom */}
      <GrassFooter />

      {/* Thin ground strip + copyright — blends from green earth to dark */}
      <div
        className="text-center py-3"
        style={{
          background: 'linear-gradient(180deg, hsl(120,40%,14%) 0%, hsl(120,35%,8%) 100%)',
        }}
      >
        <p className="body-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
          © {currentYear} LaTechNique
        </p>
      </div>
    </footer>
  );
};
