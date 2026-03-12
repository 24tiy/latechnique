import { useEffect, useRef } from 'react';
import HeroCanvas from '@/components/3d/HeroCanvas';
import CloudCanvas from '@/components/3d/CloudScene';

const HeroSection = () => {
  const cloudRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let ticking = false;

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const heroEl = document.getElementById('hero-scroll');
        if (heroEl && cloudRef.current) {
          const rect = heroEl.getBoundingClientRect();
          const totalScroll = heroEl.offsetHeight - window.innerHeight;
          if (totalScroll > 0) {
            const progress = Math.min(Math.max(-rect.top / totalScroll, 0), 1);
            // Start fading at 60% scroll, fully gone at 100%
            const opacity = 1 - Math.min(Math.max((progress - 0.6) / 0.4, 0), 1);
            cloudRef.current.style.opacity = String(opacity);
            cloudRef.current.style.visibility = opacity < 0.01 ? 'hidden' : 'visible';
          }
        }
        ticking = false;
      });
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <section id="hero-scroll" className="relative h-[200vh]">
      {/* Volumetric clouds — fade out when scrolling past hero */}
      <div
        ref={cloudRef}
        className="fixed inset-0 h-screen w-full z-10 pointer-events-none"
        style={{ willChange: 'opacity', transition: 'opacity 0.15s ease-out' }}
      >
        <CloudCanvas />
      </div>
      {/* Fixed 3D canvas so it stays on screen forever and acts as the navbar logo */}
      <div className="fixed inset-0 h-screen w-full z-40 pointer-events-none">
        <HeroCanvas />
      </div>
    </section>
  );
};

export default HeroSection;
