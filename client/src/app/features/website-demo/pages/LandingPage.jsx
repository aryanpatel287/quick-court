import Hero from '../components/Hero';
import Features from '../components/Features';
import Pricing from '../components/Pricing';
import Testimonials from '../components/Testimonials';
import CTASection from '../components/CTASection';
import '../styles/landing-page.scss';

export default function LandingPage() {
    return (
        <div className="website-demo-landing">
            {/* Phase 3: Hero Section */}
            <Hero />

            {/* Phase 4: Features Grid */}
            <Features />

            {/* Phase 5: Pricing Section */}
            <Pricing />

            {/* Phase 6: Testimonials Section */}
            <Testimonials />

            {/* Phase 7: Final CTA Section */}
            <CTASection />
        </div>
    );
}
