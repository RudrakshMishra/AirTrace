import { Hero } from "@/components/Hero";
import {
  HeroSection,
  LiveStatsStrip,
  ProblemSection,
  HowItWorksPinned,
  FeatureGrid,
  PSKeywordsSection,
  TrustSection,
  CtaSection,
} from "@/components/landing";

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* 1. RIVR Fluid Asset Streams Hero Section */}
      <Hero />

      {/* 2. Live Stats Strip */}
      <LiveStatsStrip />

      {/* 3. The Problem (3 Cards) */}
      <ProblemSection />

      {/* 4. How It Works (Sticky 4-step algorithmic pipeline) */}
      <HowItWorksPinned />

      {/* 5. Feature Grid (6 Core Capabilities) */}
      <FeatureGrid />

      {/* 6. Four Problem Statement Keywords Mapped to Features */}
      <PSKeywordsSection />

      {/* 7. Trust & Transparency Section */}
      <TrustSection />

      {/* 8. Call To Action */}
      <CtaSection />
    </div>
  );
}
