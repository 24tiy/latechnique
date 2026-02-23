import { Header } from '@/components/design-system/Header';
import { AnnouncementBanner } from '@/components/landing/AnnouncementBanner';
import { Hero } from '@/components/landing/Hero';
import { Features } from '@/components/landing/Features';
import { StatementSection } from '@/components/landing/StatementSection';
import { HowItWorks } from '@/components/landing/HowItWorks';
import { Pricing } from '@/components/landing/Pricing';
import { CTASection } from '@/components/landing/CTASection';
import { Footer } from '@/components/landing/Footer';
import { ScrollClouds } from '@/components/landing/ScrollClouds';

export default function Home() {
  return (
    <main>
      <ScrollClouds />
      <Header />
      <Hero />
      <Features />
      <StatementSection />
      <HowItWorks />
      <Pricing />
      <CTASection />
      <Footer />
      <AnnouncementBanner />
    </main>
  );
}
