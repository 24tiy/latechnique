'use client';

import React from 'react';
import { Button } from '../design-system/Button';
import { OrbsBackground } from '../design-system/OrbsBackground';

export const Hero: React.FC = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Animated Background */}
      <OrbsBackground colors={['aurora', 'canopy', 'altitude']} />

      <div className="container relative z-10">
        <div className="grid-container">
          <div className="col-span-12 text-center animate-fadeIn">
            {/* Main Title with Glass 3D Effect */}
            <h1 className="glass-title animate-slideUp" style={{ animationDelay: '0.1s' }}>
              La TechNique
            </h1>

            {/* Subtitle */}
            <p
              className="text-2xl md:text-3xl max-w-3xl mx-auto mb-16 text-balance animate-slideUp font-light"
              style={{ animationDelay: '0.2s' }}
            >
              Analyze social media posts from 6 platforms
            </p>

            {/* CTA Buttons */}
            <div
              className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slideUp"
              style={{ animationDelay: '0.3s' }}
            >
              <Button variant="primary" size="lg" href="/register">
                Get started
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 rounded-full border-2 border-black/20 flex items-start justify-center p-2">
          <div className="w-1.5 h-1.5 rounded-full bg-black/40" />
        </div>
      </div>
    </section>
  );
};
