import FooterCanvas from "@/components/3d/FooterCanvas";
import MeadowScene from "@/components/3d/MeadowScene";

const footerLinks = ["Pricing", "Resources", "About", "Careers", "Terms"];
const footerLinks2 = ["Status ↗", "Help Center ↗", "Manage Cookies"];

const Footer = () => {
  return (
    <footer className="relative z-20">
      {/* 
        The entire footer is ONE section.
        Top = sky with glass text.
        Bottom = meadow grass that goes to the absolute page edge.
        Footer links float over the grass.
      */}
      <div className="relative h-screen">
        {/* Sky gradient — top half sky, bottom half transitions to green */}
        <div
          className="absolute inset-0 z-[0]"
          style={{
            background: `linear-gradient(180deg,
              hsl(206, 50%, 84%) 0%,
              hsl(200, 55%, 78%) 25%,
              hsl(150, 40%, 55%) 55%,
              hsl(125, 50%, 30%) 80%,
              hsl(125, 55%, 18%) 100%
            )`,
          }}
        />

        {/* 3D Glass text — floats in sky */}
        <div className="absolute inset-0 z-[6]">
          <FooterCanvas />
        </div>

        {/* Meadow — bottom 50%, grass tips visible, roots hidden below edge */}
        <div className="absolute bottom-0 left-0 right-0 h-[50%] z-[3]">
          <MeadowScene />
        </div>

        {/* Footer links — floating over grass at very bottom */}
        <div className="absolute bottom-0 left-0 right-0 z-[10] px-6 pb-5 pt-3"
          style={{ background: 'linear-gradient(0deg, rgba(15,50,10,0.85) 0%, rgba(15,50,10,0.5) 60%, transparent 100%)' }}
        >
          <div className="max-w-[1200px] mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
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
          <div className="max-w-[1200px] mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mt-3 pt-3 border-t border-white/10">
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
      </div>
    </footer>
  );
};

export default Footer;
