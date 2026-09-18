import { FloatingNav } from "@/components/landing/floating-nav";
import { HeroSection } from "@/components/landing/hero-section";
import { MultiAgentPipeline } from "@/components/landing/multi-agent-pipeline";
import { FeatureSections } from "@/components/landing/feature-sections";
import { ComparisonSection } from "@/components/landing/comparison-section";
import { ProductShowcase } from "@/components/landing/product-showcase";
import { CTASection, Footer } from "@/components/landing/cta-section";
import { AuroraBackground } from "@/components/backgrounds/aurora-background";

export default function LandingPage() {
  return (
    <div className="relative min-h-screen bg-[#090909]">
      <FloatingNav />
      <HeroSection />
      <div className="relative">
        <AuroraBackground className="fixed" />
        <MultiAgentPipeline />
        <FeatureSections />
        <ComparisonSection />
        <ProductShowcase />
        <CTASection />
      </div>
      <Footer />
    </div>
  );
}
