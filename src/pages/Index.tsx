import SmoothScroll from "@/components/SmoothScroll";
import Navbar from "@/components/landing/Navbar";
import HeroSection from "@/components/landing/HeroSection";
import ProductSection from "@/components/landing/ProductSection";
import FeaturesSection from "@/components/landing/FeaturesSection";
import ShowcaseSection from "@/components/landing/ShowcaseSection";
import Footer from "@/components/landing/Footer";

const Index = () => {
  return (
    <SmoothScroll>
      <div className="min-h-screen sky-scene">
        <Navbar />
        <HeroSection />
        <ProductSection />
        <FeaturesSection />
        <ShowcaseSection />
        <Footer />
      </div>
    </SmoothScroll>
  );
};

export default Index;
