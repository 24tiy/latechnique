import { Header } from '@/components/design-system/Header';
import { Hero } from '@/components/landing/Hero';
import { Features } from '@/components/landing/Features';
import { HowItWorks } from '@/components/landing/HowItWorks';
import { Pricing } from '@/components/landing/Pricing';
import { Footer } from '@/components/landing/Footer';

export default function Home() {
  return (
    <main>
      <Header />
      <Hero />
      <Features />
      <HowItWorks />
      <Pricing />
      <Footer />
    </main>
  );
}
