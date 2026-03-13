import MeadowScene from "@/components/3d/MeadowScene";

const navLinks = ["Pricing", "Resources", "About", "Careers", "Terms"];
const legalLinks = ["Status ↗", "Help Center ↗", "Manage Cookies"];
const socials = [
  { name: "TikTok", label: "T" },
  { name: "Instagram", label: "I" },
  { name: "X", label: "𝕏" },
  { name: "LinkedIn", label: "L" },
  { name: "YouTube", label: "Y" },
];

const Footer = () => {
  return (
    <footer className="relative overflow-hidden z-20">
      {/* ─── Meadow Scene Container ─── */}
      <div className="relative" style={{ height: '70vh', minHeight: '450px' }}>

        {/* Sky-to-meadow gradient — dissolves page background into the green */}
        <div
          className="absolute top-0 left-0 right-0 z-[3] pointer-events-none"
          style={{
            height: '45%',
            background: `linear-gradient(
              180deg,
              hsl(206, 50%, 84%) 0%,
              hsl(206, 50%, 84%, 0.95) 15%,
              hsl(160, 35%, 72%, 0.7) 40%,
              hsl(130, 30%, 55%, 0.3) 70%,
              transparent 100%
            )`,
          }}
        />

        {/* Three.js Meadow Canvas */}
        <div className="absolute inset-0 z-[1]">
          <MeadowScene />
        </div>

        {/* Soft green tint at bottom for link bar blending */}
        <div
          className="absolute bottom-0 left-0 right-0 h-[15%] z-[2] pointer-events-none"
          style={{
            background: 'linear-gradient(180deg, transparent 0%, rgba(22, 58, 18, 0.6) 100%)',
          }}
        />

        {/* Centered brand text floating over meadow */}
        <div className="absolute inset-0 z-[5] flex items-center justify-center pointer-events-none">
          <h2
            className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-serif italic text-white/20 select-none"
            style={{
              textShadow: '0 2px 40px rgba(255,255,255,0.1)',
              letterSpacing: '-0.02em',
            }}
          >
            LaTechNique
          </h2>
        </div>
      </div>

      {/* ─── Footer Links Bar ─── */}
      <div className="relative z-20 px-6 py-6" style={{ backgroundColor: '#163a14' }}>
        <div className="max-w-[1200px] mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          {/* Nav links */}
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            {navLinks.map((link) => (
              <a
                key={link}
                href="#"
                className="text-sm text-white/60 hover:text-white/90 transition-colors duration-200 font-medium"
              >
                {link}
              </a>
            ))}
          </div>

          {/* Social links */}
          <div className="flex items-center gap-5">
            {socials.map((s) => (
              <a
                key={s.name}
                href="#"
                className="text-white/40 hover:text-white/80 transition-colors duration-200 text-xs font-medium tracking-wide"
                aria-label={s.name}
              >
                {s.label}
              </a>
            ))}
          </div>
        </div>

        {/* Divider + legal */}
        <div className="max-w-[1200px] mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mt-4 pt-4 border-t border-white/8">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            {legalLinks.map((link) => (
              <a
                key={link}
                href="#"
                className="text-xs text-white/30 hover:text-white/55 transition-colors duration-200"
              >
                {link}
              </a>
            ))}
          </div>
          <p className="text-xs text-white/25">
            LaTechNique © {new Date().getFullYear()} All rights reserved
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
