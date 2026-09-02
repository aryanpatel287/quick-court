import { useState } from 'react';
import { Link } from 'react-router';
import { Check, Sparkles, Zap, Shield, ArrowRight } from 'lucide-react';
import Button from '@/components/Shared/Buttons/Button/Button';
import '../styles/pricing.scss';

const PRICING_TIERS = [
    {
        id: 'starter',
        name: 'Starter',
        badge: null,
        description: 'Perfect for indie hackers and developers building MVPs and side projects.',
        monthlyPrice: 0,
        annualPrice: 0,
        periodText: 'forever free',
        buttonText: 'Start Free',
        buttonVariant: 'secondary',
        buttonLink: '/register',
        popular: false,
        icon: Zap,
        features: [
            'Up to 5 active projects',
            'Community Discord support',
            '30+ Standard SCSS components',
            'Public GitHub repository access',
            'Full MIT open-source license',
            'Basic responsive layouts',
        ],
    },
    {
        id: 'pro',
        name: 'Pro',
        badge: 'Most Popular',
        description: 'For growing teams and professional developers shipping production apps.',
        monthlyPrice: 29,
        annualPrice: 20,
        periodText: 'per month',
        buttonText: 'Start Free Trial',
        buttonVariant: 'primary',
        buttonLink: '/register',
        popular: true,
        icon: Sparkles,
        features: [
            'Unlimited active projects',
            'All 50+ SCSS Glassmorphism components',
            'Native AI Copilot & RAG pipeline',
            'Priority email & Discord support',
            'Private GitHub repository access',
            'Automated PDF generation module',
            'JWT + Redis token blacklist auth',
            'Zero !important CSS token system',
        ],
    },
    {
        id: 'enterprise',
        name: 'Enterprise',
        badge: null,
        description: 'Custom solutions, dedicated SLA, and bespoke architecture for organizations.',
        monthlyPrice: null,
        annualPrice: null,
        periodText: 'tailored pricing',
        buttonText: 'Contact Sales',
        buttonVariant: 'secondary',
        buttonLink: '/login',
        popular: false,
        icon: Shield,
        features: [
            'Everything in Pro tier included',
            'Custom SLA & 24/7 dedicated support',
            'White-labeling & custom theme tokens',
            'Custom PostgreSQL DAOs & schemas',
            'On-premise / VPC cloud deployment',
            '1-on-1 Architecture & security review',
            'Dedicated account engineering manager',
        ],
    },
];

export default function Pricing() {
    const [billingCycle, setBillingCycle] = useState('annual'); // 'monthly' | 'annual'

    return (
        <section id="pricing" className="website-pricing" aria-labelledby="pricing-section-title">
            <div className="pricing-container">
                {/* Section Header */}
                <div className="section-header">
                    <div className="section-badge">
                        <Zap size={13} aria-hidden="true" />
                        <span>Flexible Plans</span>
                    </div>

                    <h2 id="pricing-section-title" className="section-title">
                        Simple, Transparent Pricing
                    </h2>

                    <p className="section-subtitle">
                        Choose the ideal plan for your stack. Transparent pricing with zero hidden
                        fees, free updates, and no credit card required to start.
                    </p>

                    {/* Interactive Billing Cycle Toggle */}
                    <div className="billing-toggle-wrapper">
                        <div
                            className="billing-toggle"
                            role="group"
                            aria-label="Billing cycle selection"
                        >
                            <button
                                type="button"
                                className={`toggle-option ${billingCycle === 'monthly' ? 'is-active' : ''}`}
                                onClick={() => setBillingCycle('monthly')}
                                aria-pressed={billingCycle === 'monthly'}
                            >
                                Monthly Billing
                            </button>

                            <button
                                type="button"
                                className={`toggle-option ${billingCycle === 'annual' ? 'is-active' : ''}`}
                                onClick={() => setBillingCycle('annual')}
                                aria-pressed={billingCycle === 'annual'}
                            >
                                <span>Annual Billing</span>
                                <span className="discount-pill">Save 25%</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* 3-Column Responsive Grid */}
                <div className="pricing-grid">
                    {PRICING_TIERS.map((tier) => {
                        const isPro = tier.popular;
                        const IconComponent = tier.icon;
                        const displayPrice =
                            tier.monthlyPrice === null
                                ? 'Custom'
                                : billingCycle === 'annual'
                                  ? `$${tier.annualPrice}`
                                  : `$${tier.monthlyPrice}`;

                        const billingNote =
                            tier.monthlyPrice === null
                                ? 'Billed annually or custom terms'
                                : tier.monthlyPrice === 0
                                  ? 'Free forever'
                                  : billingCycle === 'annual'
                                    ? `$${tier.annualPrice * 12}/year billed annually`
                                    : 'Billed monthly, cancel anytime';

                        return (
                            <article
                                key={tier.id}
                                className={`pricing-card ${isPro ? 'is-popular' : ''}`}
                                aria-label={`${tier.name} Plan`}
                            >
                                {isPro && (
                                    <div className="popular-badge" aria-label="Most Popular plan">
                                        <Sparkles size={12} aria-hidden="true" />
                                        <span>Most Popular</span>
                                    </div>
                                )}

                                <div className="card-header">
                                    <div className="tier-icon-wrapper" aria-hidden="true">
                                        <IconComponent size={20} />
                                    </div>
                                    <h3 className="tier-name">{tier.name}</h3>
                                    <p className="tier-description">{tier.description}</p>
                                </div>

                                <div className="card-price-box">
                                    <div className="price-value-row">
                                        <span className="price-amount">{displayPrice}</span>
                                        {tier.monthlyPrice !== null && (
                                            <span className="price-period">/ mo</span>
                                        )}
                                    </div>
                                    <span className="price-subtext">{billingNote}</span>
                                </div>

                                <div className="card-cta">
                                    <Link
                                        to={tier.buttonLink}
                                        style={{ textDecoration: 'none', width: '100%' }}
                                    >
                                        <Button
                                            variant={tier.buttonVariant}
                                            size="md"
                                            fullWidth
                                            className={isPro ? 'pro-cta-btn' : ''}
                                            icon={isPro ? <ArrowRight size={15} /> : null}
                                        >
                                            {tier.buttonText}
                                        </Button>
                                    </Link>
                                </div>

                                <div className="card-features">
                                    <span className="features-label">Included capabilities:</span>
                                    <ul
                                        className="features-list"
                                        aria-label={`${tier.name} plan features`}
                                    >
                                        {tier.features.map((feature) => (
                                            <li key={feature} className="feature-item">
                                                <div
                                                    className="check-icon-wrapper"
                                                    aria-hidden="true"
                                                >
                                                    <Check size={14} className="check-icon" />
                                                </div>
                                                <span>{feature}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </article>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
