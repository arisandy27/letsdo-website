import Header from "@/components/letsdo/homepage/Header";
import HeroSection from "@/components/letsdo/homepage/HeroSection";
import TrustStrip from "@/components/letsdo/homepage/TrustStrip";
import ProblemSection from "@/components/letsdo/homepage/ProblemSection";
import ApproachSection from "@/components/letsdo/homepage/ApproachSection";
import SolutionsSection from "@/components/letsdo/homepage/SolutionsSection";
import ServicesSection from "@/components/letsdo/homepage/ServicesSection";
import WhyLetsDoSection from "@/components/letsdo/homepage/WhyLetsDoSection";
import FounderSection from "@/components/letsdo/homepage/FounderSection";
import ReadinessSection from "@/components/letsdo/homepage/ReadinessSection";
import LabSection from "@/components/letsdo/homepage/LabSection";
import FooterSection from "@/components/letsdo/homepage/FooterSection";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Header />
      <main>
        <HeroSection />
        <TrustStrip />
        <ProblemSection />
        <ApproachSection />
        <SolutionsSection />
        <ServicesSection />
        <WhyLetsDoSection />
        <FounderSection />
        <ReadinessSection />
        <LabSection />
      </main>
      <FooterSection />
    </div>
  );
}
