import FooterCanvas from "@/components/3d/FooterCanvas";
import MeadowScene from "@/components/3d/MeadowScene";

const footerLinks = ["Pricing", "Resources", "About", "Careers", "Terms"];
const footerLinks2 = ["Status ↗", "Help Center ↗", "Manage Cookies"];

const Footer = () => {
  return (
    <footer className="relative overflow-hidden z-20">
      <div className="relative h-screen">
        {/* Sky gradient background — matches page sky at top, transitions to green at bottom */}
        <div
          className="absolute inset-0 z-[0]"
          style={{
            background: `linear-gradient(180deg,
              hsl(206, 50%, 84%) 0%,
              hsl(200, 55%, 78%) 20%,
              hsl(140, 40%, 60%) 55%,
              hsl(120, 45%, 35%) 80%,
              hsl(120, 50%, 20%) 100%
            )`,
          }}
        />

        {/* 3D Glass text — in the sky area (upper portion) */}
        <div className="absolute inset-0 z-[6]">
          <FooterCanvas />
        </div>

        {/* Meadow canvas — bottom 45% of the footer viewport */}
        <div className="absolute bottom-0 left-0 right-0 h-[45%] z-[3]">
          <MeadowScene />
        </div>

        {/* Green fill at very bottom to blend into links bar */}
        <div className="absolute bottom-0 left-0 right-0 h-[3%] bg-[#1a5510] z-[4]" />
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
