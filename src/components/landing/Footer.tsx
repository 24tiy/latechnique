import FooterCanvas from "@/components/3d/FooterCanvas";
import MeadowScene from "@/components/3d/MeadowScene";

const Footer = () => {
  return (
    <footer className="relative z-20 h-screen overflow-hidden">
      {/* Sky gradient */}
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

      {/* Glass text */}
      <div className="absolute inset-0 z-[6]">
        <FooterCanvas />
      </div>

      {/* 
        Meadow canvas — occupies bottom 55% but pushed DOWN 30% 
        so roots overflow below the footer edge (hidden by overflow-hidden).
        Only grass tips + mid-section visible.
      */}
      <div
        className="absolute left-0 right-0 h-[55%] z-[3]"
        style={{ bottom: '-25%' }}
      >
        <MeadowScene />
      </div>
    </footer>
  );
};

export default Footer;
