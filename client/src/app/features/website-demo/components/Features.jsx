import { Zap, Palette, ShieldCheck, Bot, Smartphone, Rocket, Check, Sparkles } from 'lucide-react';
import '../styles/features.scss';

const FEATURES_DATA = [
    {
        id: 'fast-setup',
        icon: Zap,
        iconTheme: 'icon-blue',
        tag: 'React 19 + Express',
        title: 'Lightning Fast Setup',
        description:
            'Start building in minutes with pre-configured React 19, Express 5, and instant Vite hot-module reloading.',
        points: ['Sub-second HMR dev server', 'ESM module architecture', 'Zero boilerplate setup'],
    },
    {
        id: 'ui-components',
        icon: Palette,
        iconTheme: 'icon-pink',
        tag: 'Dart SCSS Tokens',
        title: 'Beautiful UI Components',
        description:
            '50+ modular SCSS components crafted with glassmorphism, responsive tokens, and zero hardcoded styles.',
        points: ['Light & dark theme tokens', 'Zero !important CSS', 'Accessible design system'],
    },
    {
        id: 'auth-ready',
        icon: ShieldCheck,
        iconTheme: 'icon-teal',
        tag: 'Redis + JWT',
        title: 'Enterprise Auth Ready',
        description:
            'Complete JWT authentication, Redis-backed rate limiting, token blacklisting, and role-based access control.',
        points: ['Secure cookie handling', 'Redis token blacklist', 'Granular route guards'],
    },
    {
        id: 'ai-integration',
        icon: Bot,
        iconTheme: 'icon-violet',
        tag: 'LangChain + RAG',
        title: 'Native AI Integration',
        description:
            'Complete RAG pipeline with LangChain, Pinecone vector storage, and SSE real-time streaming tokens.',
        points: [
            'Multi-LLM orchestrations',
            'Live streaming SSE tokens',
            'Pinecone vector indexing',
        ],
    },
    {
        id: 'mobile-first',
        icon: Smartphone,
        iconTheme: 'icon-blue',
        tag: 'WCAG 2.2 AA',
        title: 'Mobile-First & Accessible',
        description:
            'Fluid responsive layouts, WCAG-compliant contrast ratios, and touch-optimized navigation drawers.',
        points: [
            '375px to 1440px support',
            'Full keyboard navigation',
            'ARIA screen reader support',
        ],
    },
    {
        id: 'production-ready',
        icon: Rocket,
        iconTheme: 'icon-success',
        tag: 'PostgreSQL + Drizzle',
        title: 'Production Ready Architecture',
        description:
            'Drizzle ORM with PostgreSQL, Docker containerization, serverless PDF generation, and test suites.',
        points: [
            'Type-safe Drizzle DAOs',
            'Lightweight PDF generation',
            'Full test suite configured',
        ],
    },
];

export default function Features() {
    return (
        <section
            id="features"
            className="website-features"
            aria-labelledby="features-section-title"
        >
            <div className="features-container">
                {/* Section Header */}
                <div className="section-header">
                    <div className="section-badge">
                        <Sparkles size={13} aria-hidden="true" />
                        <span>Core Capabilities</span>
                    </div>

                    <h2 id="features-section-title" className="section-title">
                        Everything You Need to Ship in Record Time
                    </h2>

                    <p className="section-subtitle">
                        Stop rebuilding boilerplate from scratch. Apex Template provides a cohesive,
                        production-grade full-stack architecture with battle-tested tooling.
                    </p>
                </div>

                {/* 3-Column Responsive Grid */}
                <div className="features-grid">
                    {FEATURES_DATA.map((feature) => {
                        const IconComponent = feature.icon;
                        return (
                            <article key={feature.id} className="feature-card">
                                <div className="card-top">
                                    <div
                                        className={`feature-icon-wrapper ${feature.iconTheme}`}
                                        aria-hidden="true"
                                    >
                                        <IconComponent size={24} />
                                    </div>
                                    <span className="feature-tag">{feature.tag}</span>
                                </div>

                                <div className="card-body">
                                    <h3 className="feature-title">{feature.title}</h3>
                                    <p className="feature-description">{feature.description}</p>
                                </div>

                                <ul
                                    className="card-points"
                                    aria-label={`${feature.title} highlights`}
                                >
                                    {feature.points.map((point) => (
                                        <li key={point} className="point-item">
                                            <Check
                                                size={14}
                                                className="point-bullet"
                                                aria-hidden="true"
                                            />
                                            <span>{point}</span>
                                        </li>
                                    ))}
                                </ul>
                            </article>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
