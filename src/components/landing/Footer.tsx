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
    <footer className="relative z-20">
      {/* ─── Meadow Container ─── */}
      <div className="relative w-full" style={{ height: 'clamp(400px, 55vh, 650px)' }}>

        {/* Sky-to-green gradient overlay — blends page background into meadow */}
        <div
          className="absolute top-0 left-0 right-0 z-[3] pointer-events-none"
          style={{
            height: '50%',
            background: `linear-gradient(
              180deg,
              hsl(206, 50%, 84%) 0%,
              hsla(206, 50%, 84%, 0.85) 20%,
              hsla(170, 30%, 65%, 0.5) 50%,
              hsla(130, 35%, 40%, 0.2) 80%,
              transparent 100%
            )`,
          }}
        />

        {/* Three.js Meadow — fills entire container */}
        <div className="absolute inset-0 z-[1]">
          <MeadowScene />
        </div>

        {/* Bottom blend into links bar */}
        <div
          className="absolute bottom-0 left-0 right-0 h-[20%] z-[2] pointer-events-none"
          style={{
            background: 'linear-gradient(180deg, transparent 0%, rgba(20, 52, 16, 0.7) 100%)',
          }}
        />

        {/* Floating brand watermark */}
        <div className="absolute inset-0 z-[4] flex items-center justify-center pointer-events-none">
          <h2
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-serif italic text-white/15 select-none"
            style={{ textShadow: '0 2px 30px rgba(255,255,255,0.08)', letterSpacing: '-0.02em' }}
          >
            LaTechNique
          </h2>
        </div>
      </div>

      {/* ─── Footer Links ─── */}
      <div className="relative z-20 px-6 py-6" style={{ backgroundColor: '#14360f' }}>
        <div className="max-w-[1200px] mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            {navLinks.map((link) => (
              <a key={link} href="#" className="text-sm text-white/55 hover:text-white/85 transition-colors duration-200 font-medium">{link}</a>
            ))}
          </div>
          <div className="flex items-center gap-5">
            {socials.map((s) => (
              <a key={s.name} href="#" className="text-white/35 hover:text-white/70 transition-colors duration-200 text-xs font-medium tracking-wide" aria-label={s.name}>{s.label}</a>
            ))}
          </div>
        </div>
        <div className="max-w-[1200px] mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mt-4 pt-4 border-t border-white/8">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            {legalLinks.map((link) => (
              <a key={link} href="#" className="text-xs text-white/25 hover:text-white/50 transition-colors duration-200">{link}</a>
            ))}
          </div>
          <p className="text-xs text-white/20">LaTechNique © {new Date().getFullYear()} All rights reserved</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
