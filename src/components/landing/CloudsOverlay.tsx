import { useEffect, useRef } from 'react';
import cloudImg1 from '@/assets/cloud-gen-1.png';
import cloudImg2 from '@/assets/cloud-gen-2.png';
import cloudImg3 from '@/assets/cloud-gen-3.png';
import cloudImg4 from '@/assets/cloud-gen-4.png';

/*
  Air.inc-style clouds:
  - Pure CSS, no WebGL
  - Soft, blurred cloud images
  - Very slow horizontal drift via CSS animation
  - Parallax via JS scroll listener
  - Minimal, ethereal, barely-there aesthetic
*/

interface CloudDef {
  img: string;
  top: string;
  left?: string;
  right?: string;
  width: string;
  opacity: number;
  blur: number;
  speed: number;       // animation duration in seconds
  parallax: number;    // scroll multiplier
  flipX?: boolean;
  drift: number;       // horizontal drift range in vw
  delay: number;       // animation delay in seconds
}

const clouds: CloudDef[] = [
  // Hero — large atmospheric clouds
  { img: cloudImg2, top: '0%',   left: '-15%', width: '50vw', opacity: 0.55, blur: 4,  speed: 90, parallax: 0.08, drift: 2, delay: 0 },
  { img: cloudImg3, top: '-5%',  right: '-8%', width: '30vw', opacity: 0.5,  blur: 3,  speed: 100, parallax: 0.06, drift: 1.5, delay: -25 },
  { img: cloudImg4, top: '10%',  left: '25%',  width: '22vw', opacity: 0.4,  blur: 5,  speed: 110, parallax: 0.1, drift: 2.5, delay: -45 },
  { img: cloudImg1, top: '15%',  right: '5%',  width: '35vw', opacity: 0.45, blur: 4,  speed: 85, parallax: 0.07, drift: 1.8, delay: -15, flipX: true },

  // Mid — between sections  
  { img: cloudImg2, top: '28%',  left: '-10%', width: '45vw', opacity: 0.5,  blur: 3,  speed: 80, parallax: 0.12, drift: 2, delay: -35, flipX: true },
  { img: cloudImg4, top: '38%',  right: '-5%', width: '28vw', opacity: 0.4,  blur: 5,  speed: 95, parallax: 0.14, drift: 2.5, delay: -10 },

  // Features area
  { img: cloudImg3, top: '50%',  left: '-12%', width: '35vw', opacity: 0.45, blur: 4,  speed: 100, parallax: 0.16, drift: 2, delay: -50 },
  { img: cloudImg1, top: '62%',  right: '0%',  width: '40vw', opacity: 0.5,  blur: 3,  speed: 85, parallax: 0.12, drift: 1.5, delay: -30, flipX: true },

  // Footer
  { img: cloudImg2, top: '75%',  right: '-8%', width: '38vw', opacity: 0.45, blur: 4,  speed: 90, parallax: 0.18, drift: 2, delay: -20 },
  { img: cloudImg4, top: '85%',  left: '-10%', width: '30vw', opacity: 0.4,  blur: 5,  speed: 100, parallax: 0.15, drift: 2.5, delay: -55, flipX: true },
];

export default function CloudsOverlay() {
  const containerRef = useRef<HTMLDivElement>(null);
  const cloudRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    let ticking = false;

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const scrollY = window.scrollY;
        cloudRefs.current.forEach((el, i) => {
          if (!el) return;
          const parallax = clouds[i].parallax;
          el.style.transform = `translateY(${-scrollY * parallax}px)${clouds[i].flipX ? ' scaleX(-1)' : ''}`;
        });
        ticking = false;
      });
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <>
      <style>{`
        @keyframes cloud-drift {
          0%, 100% { translate: 0 0; }
          50% { translate: var(--drift) 0; }
        }
      `}</style>
      <div
        ref={containerRef}
        className="fixed inset-0 pointer-events-none z-[5] overflow-hidden"
      >
        {clouds.map((cloud, i) => (
          <div
            key={i}
            ref={(el) => { cloudRefs.current[i] = el; }}
            className="absolute will-change-transform"
            style={{
              top: cloud.top,
              ...(cloud.left !== undefined ? { left: cloud.left } : {}),
              ...(cloud.right !== undefined ? { right: cloud.right } : {}),
              width: cloud.width,
              opacity: cloud.opacity,
              filter: `blur(${cloud.blur}px)`,
              transform: cloud.flipX ? 'scaleX(-1)' : undefined,
            }}
          >
            <img
              src={cloud.img}
              alt=""
              className="w-full h-auto block"
              style={{
                animation: `cloud-drift ${cloud.speed}s ease-in-out infinite`,
                animationDelay: `${cloud.delay}s`,
                ['--drift' as string]: `${cloud.drift}vw`,
              }}
              draggable={false}
            />
          </div>
        ))}
      </div>
    </>
  );
}
