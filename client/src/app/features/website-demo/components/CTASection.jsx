import { Link } from 'react-router';
import { Rocket, Sparkles, Github, CheckCircle2 } from 'lucide-react';
import Button from '@/components/Shared/Buttons/Button/Button';
import '../styles/cta-section.scss';

const GUARANTEES = [
    'Free MIT Open-Source License',
    'No Credit Card Required',
    'Sub-second Hot Module Reload',
    '50+ Dart SCSS Components',
];

export default function CTASection() {
    return (
        <section className="website-cta-section" aria-labelledby="cta-main-title">
            {/* Ambient Background Glow */}
            <div className="cta-glow-bg" aria-hidden="true">
                <div className="cta-orb cta-orb-left" />
                <div className="cta-orb cta-orb-right" />
            </div>

            <div className="cta-container">
                <div className="cta-card">
                    <div className="cta-header">
                        <div className="cta-badge">
                            <Rocket size={13} aria-hidden="true" />
                            <span>Start Building Today</span>
                        </div>

                        <h2 id="cta-main-title" className="cta-title">
                            Ready to Ship Your Next Project?
                        </h2>

                        <p className="cta-subtitle">
                            Join thousands of developers and engineering teams building modern,
                            accessible, and AI-powered full-stack applications with Apex Template.
                        </p>
                    </div>

                    {/* Dual Action Buttons */}
                    <div className="cta-actions">
                        <Link to="/register" style={{ textDecoration: 'none' }}>
                            <Button
                                variant="primary"
                                size="lg"
                                className="cta-primary-btn"
                                icon={<Sparkles size={16} />}
                            >
                                Get Started Free
                            </Button>
                        </Link>

                        <a
                            href="https://github.com"
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ textDecoration: 'none' }}
                        >
                            <Button
                                variant="secondary"
                                size="lg"
                                className="cta-secondary-btn"
                                icon={<Github size={16} />}
                            >
                                View on GitHub
                            </Button>
                        </a>
                    </div>

                    {/* Value Guarantees Row */}
                    <div className="cta-guarantees" aria-label="Feature guarantees">
                        {GUARANTEES.map((item) => (
                            <div key={item} className="guarantee-item">
                                <CheckCircle2
                                    size={15}
                                    className="guarantee-icon"
                                    aria-hidden="true"
                                />
                                <span>{item}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
