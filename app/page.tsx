import Navbar from "@/components/navbar"
import HeroSection from "@/components/hero-section"
import TrustBadges from "@/components/trust-badges"
import ProductShowcase from "@/components/product-showcase"
import FeaturesGrid from "@/components/features-grid"
import HowItWorks from "@/components/how-it-works"
import StatsSection from "@/components/stats-section"
import CTASection from "@/components/cta-section"
import Footer from "@/components/footer"

export default function Home() {
  return (
    <>
      <Navbar />
      <main className="relative overflow-hidden">
        <HeroSection />
        <TrustBadges />
        <ProductShowcase />
        <FeaturesGrid />
        <HowItWorks />
        <StatsSection />
        <CTASection />
      </main>
      <Footer />
    </>
  )
}
