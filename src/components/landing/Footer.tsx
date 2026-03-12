import FooterCanvas from "@/components/3d/FooterCanvas";
import MeadowScene from "@/components/3d/MeadowScene";

const footerLinks = ["Pricing", "Resources", "About", "Careers", "Terms"];
const footerLinks2 = ["Status ↗", "Help Center ↗", "Manage Cookies"];

const Footer = () => {
  return (
    <footer className="relative overflow-hidden z-20">
      {/* Full-viewport meadow scene */}
      <div className="relative h-screen">
        {/* Three.js Meadow — grass, mushrooms, butterflies, pollen */}
        <div className="absolute inset-0 z-[1]">
          <MeadowScene />
        </div>

        {/* 3D Glass text floating above meadow */}
        <div className="absolute inset-0 z-[6]">
          <FooterCanvas />
        </div>

        {/* Sky gradient overlay at top for smooth transition from page */}
        <div
          className="absolute top-0 left-0 right-0 h-[30%] z-[2] pointer-events-none"
          style={{
            background: 'linear-gradient(180deg, hsl(206, 50%, 84%) 0%, transparent 100%)',
          }}
        />

        {/* Solid green fill at the very bottom to blend with links bar */}
        <div className="absolute bottom-0 left-0 right-0 h-[6%] bg-[#1a5c10] z-[2]" />
      </div>

      {/* Footer links bar */}
      <div className="relative z-20 bg-[#1a4a14] px-6 py-6">
        <div className="max-w-[1200px] mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            {footerLinks.map((link) => (
              <a key={link} href="#" className="text-sm text-white/70 hover:text-white transition-colors font-medium">
                {link}
              </a>
            ))}
          </div>
          <div className="flex items-center gap-5">
            {['TikTok', 'Instagram', 'X', 'LinkedIn', 'YouTube'].map((s) => (
              <a key={s} href="#" className="text-white/50 hover:text-white transition-colors text-xs font-medium tracking-wide">
                {s === 'X' ? '𝕏' : s.charAt(0)}
              </a>
            ))}
          </div>
        </div>
        <div className="max-w-[1200px] mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mt-4 pt-4 border-t border-white/10">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            {footerLinks2.map((link) => (
              <a key={link} href="#" className="text-xs text-white/40 hover:text-white/60 transition-colors">
                {link}
              </a>
            ))}
          </div>
          <p className="text-xs text-white/30">
            LaTechNique © {new Date().getFullYear()} All rights reserved
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
