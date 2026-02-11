'use client';

import React from 'react';
import { GrassFooter } from './GrassFooter';

export const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer style={{ background: 'transparent', position: 'relative' }}>
      {/* Grass canvas — transparent background, blades grow up from bottom */}
      <GrassFooter />

      {/* Copyright text — white, floating above grass */}
      <div
        className="text-center py-4"
        style={{
          position: 'absolute',
          bottom: '0',
          left: '0',
          right: '0',
          background: 'transparent',
          zIndex: 10,
        }}
      >
        <p className="body-xs" style={{ color: '#ffffff', textShadow: '0 1px 3px rgba(0,0,0,0.3)' }}>
          © {currentYear} LaTechNique
        </p>
      </div>
    </footer>
  );
};
