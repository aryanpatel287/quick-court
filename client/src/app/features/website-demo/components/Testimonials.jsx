import { Star, MessageSquareQuote, CheckCircle2, TrendingUp, Users, Award } from 'lucide-react';
import '../styles/testimonials.scss';

const TESTIMONIALS_DATA = [
    {
        id: 'sarah-chen',
        name: 'Sarah Chen',
        role: 'Founder & CTO',
        company: 'Novalyze AI',
        initials: 'SC',
        avatarColor: 'avatar-teal',
        rating: 5,
        quote: 'Apex Template helped us launch our AI startup MVP in 2 weeks instead of 2 months. The pre-configured RAG pipeline, SSE token streaming, and clean SCSS architecture saved us countless hours of foundational engineering.',
        tag: 'Startup Founder',
        verified: true,
    },
    {
        id: 'marcus-rodriguez',
        name: 'Marcus Rodriguez',
        role: 'Lead Full-Stack Engineer',
        company: 'CloudScale Systems',
        initials: 'MR',
        avatarColor: 'avatar-violet',
        rating: 5,
        quote: 'The best full-stack template in the React ecosystem. Having zero !important declarations, unified light/dark theme tokens, and clean Drizzle DAOs made code reviews a joy. Highly recommended for production applications.',
        tag: 'Senior Engineer',
        verified: true,
    },
    {
        id: 'emily-watson',
        name: 'Emily Watson',
        role: 'VP of Product',
        company: 'Vanguard Tech',
        initials: 'EW',
        avatarColor: 'avatar-pink',
        rating: 5,
        quote: 'Our hackathon team went from zero to a live working demo in 48 hours and won first place. The component library, responsive navigation drawers, and polished glassmorphism effects work seamlessly out of the box.',
        tag: 'Product Leader',
        verified: true,
    },
];

const TRUST_METRICS = [
    {
        id: 'projects',
        value: '10,000+',
        label: 'Projects Created',
        icon: Users,
    },
    {
        id: 'uptime',
        value: '99.9%',
        label: 'Lighthouse & Uptime',
        icon: TrendingUp,
    },
    {
        id: 'rating',
        value: '4.9 / 5',
        label: 'Developer Rating',
        icon: Award,
    },
    {
        id: 'components',
        value: '50+',
        label: 'SCSS Components',
        icon: CheckCircle2,
    },
];

export default function Testimonials() {
    return (
        <section
            id="testimonials"
            className="website-testimonials"
            aria-labelledby="testimonials-section-title"
        >
            <div className="testimonials-container">
                {/* Section Header */}
                <div className="section-header">
                    <div className="section-badge">
                        <Star size={13} className="badge-star-icon" aria-hidden="true" />
                        <span>Social Proof</span>
                    </div>

                    <h2 id="testimonials-section-title" className="section-title">
                        Loved by Developers & Teams
                    </h2>

                    <p className="section-subtitle">
                        See how engineering leaders, founders, and indie hackers build high-velocity
                        applications with Apex Template.
                    </p>
                </div>

                {/* 3-Column Responsive Testimonials Grid */}
                <div className="testimonials-grid">
                    {TESTIMONIALS_DATA.map((item) => (
                        <article
                            key={item.id}
                            className="testimonial-card"
                            aria-label={`Testimonial from ${item.name}`}
                        >
                            <div className="card-top">
                                {/* 5-Star Rating Row */}
                                <div
                                    className="rating-stars"
                                    aria-label={`Rated ${item.rating} out of 5 stars`}
                                >
                                    {[...Array(item.rating)].map((_, i) => (
                                        <Star
                                            key={i}
                                            size={16}
                                            className="star-filled"
                                            aria-hidden="true"
                                        />
                                    ))}
                                </div>

                                <span className="testimonial-tag">{item.tag}</span>
                            </div>

                            {/* Quote Body */}
                            <blockquote className="testimonial-quote">
                                <MessageSquareQuote
                                    size={20}
                                    className="quote-icon"
                                    aria-hidden="true"
                                />
                                <p>&ldquo;{item.quote}&rdquo;</p>
                            </blockquote>

                            {/* Author Info Footer */}
                            <div className="testimonial-author">
                                <div
                                    className={`author-avatar ${item.avatarColor}`}
                                    aria-hidden="true"
                                >
                                    <span>{item.initials}</span>
                                </div>

                                <div className="author-details">
                                    <div className="author-name-row">
                                        <span className="author-name">{item.name}</span>
                                        {item.verified && (
                                            <span
                                                className="verified-badge"
                                                title="Verified Developer"
                                                aria-label="Verified Developer"
                                            >
                                                <CheckCircle2 size={13} />
                                            </span>
                                        )}
                                    </div>
                                    <span className="author-role">
                                        {item.role} • {item.company}
                                    </span>
                                </div>
                            </div>
                        </article>
                    ))}
                </div>

                {/* Trust Metrics Bar */}
                <div className="trust-metrics-bar" aria-label="Key Performance Indicators">
                    <div className="metrics-grid">
                        {TRUST_METRICS.map((metric) => {
                            const MetricIcon = metric.icon;
                            return (
                                <div key={metric.id} className="metric-item">
                                    <div className="metric-icon-wrapper" aria-hidden="true">
                                        <MetricIcon size={20} />
                                    </div>
                                    <div className="metric-content">
                                        <span className="metric-value">{metric.value}</span>
                                        <span className="metric-label">{metric.label}</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </section>
    );
}
