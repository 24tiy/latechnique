'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import type { OrbsBackgroundProps } from '@/types';

export const OrbsBackground: React.FC<OrbsBackgroundProps> = ({
  colors = ['aurora', 'canopy', 'altitude'],
  className,
}) => {
  // CSS переменные для цветов орбов
  const colorVars = colors.map(color => `var(--${color})`);

  return (
    <div className={cn('absolute inset-0 -z-10 overflow-hidden', className)}>
      <div className="absolute inset-0">
        {/* Orb 1 */}
        <div
          className="absolute top-0 left-0 w-[500px] h-[500px] rounded-full blur-[120px] opacity-30 animate-spin-slow"
          style={{
            background: `radial-gradient(circle, ${colorVars[0]}, transparent 70%)`,
            animationDelay: '0s',
          }}
        />
        
        {/* Orb 2 */}
        <div
          className="absolute bottom-0 right-0 w-[600px] h-[600px] rounded-full blur-[120px] opacity-25 animate-spin-slow"
          style={{
            background: `radial-gradient(circle, ${colorVars[1]}, transparent 70%)`,
            animationDelay: '2s',
          }}
        />
        
        {/* Orb 3 */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full blur-[140px] opacity-20 animate-pulse-slow"
          style={{
            background: `radial-gradient(circle, ${colorVars[2]}, transparent 70%)`,
            animationDelay: '4s',
          }}
        />
      </div>
      
      {/* Gradient overlay for blending */}
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(circle at center, transparent 0%, var(--bg) 100%)`,
        }}
      />
    </div>
  );
};
