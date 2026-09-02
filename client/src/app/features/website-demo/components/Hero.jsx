import { Link } from 'react-router';
import {
    Sparkles,
    ArrowRight,
    Zap,
    ShieldCheck,
    Bot,
    Activity,
    Code2,
    CheckCircle2,
} from 'lucide-react';
import Button from '@/components/Shared/Buttons/Button/Button';
import '../styles/hero.scss';

export default function Hero() {
    return (
        <section className="website-hero" aria-labelledby="hero-main-title">
            {/* Ambient Background Glow Orbs */}
            <div className="hero-glow-bg" aria-hidden="true">
                <div className="glow-orb-primary" />
                <div className="glow-orb-secondary" />
            </div>

            <div className="hero-container">
                {/* Left Column: Value Proposition & High-Converting CTAs */}
                <div className="hero-content">
                    <div className="hero-badge">
                        <Sparkles size={14} className="badge-icon" aria-hidden="true" />
                        <span>Apex Template v2.0 • Public Website Architecture</span>
                    </div>

                    <h1 id="hero-main-title" className="hero-title">
                        Build Full-Stack Applications{' '}
                        <span className="title-gradient-accent">10x Faster</span>
                    </h1>

                    <p className="hero-subtitle">
                        Production-ready React 19 + Express template featuring modern glassmorphism
                        design, AI copilot streaming, and 50+ battle-tested UI components. Launch in
                        days, not months.
                    </p>

                    <div className="hero-actions">
                        <Link to="/register" className="action-link">
                            <Button variant="primary" size="lg" className="primary-cta-btn">
                                Get Started Free
                            </Button>
                        </Link>
                        <a href="#features" className="action-link">
                            <Button
                                variant="secondary"
                                size="lg"
                                icon={<ArrowRight size={16} />}
                                className="secondary-cta-btn"
                            >
                                Explore Features
                            </Button>
                        </a>
                    </div>

                    {/* Trust Indicators */}
                    <div className="hero-trust-bar">
                        <div className="trust-item">
                            <Zap size={15} className="trust-icon" aria-hidden="true" />
                            <span>50+ SCSS Components</span>
                        </div>
                        <div className="trust-item">
                            <ShieldCheck size={15} className="trust-icon" aria-hidden="true" />
                            <span>JWT & Redis Auth</span>
                        </div>
                        <div className="trust-item">
                            <Bot size={15} className="trust-icon" aria-hidden="true" />
                            <span>Native AI RAG Pipeline</span>
                        </div>
                    </div>
                </div>

                {/* Right Column: Layered Glassmorphism Mockup Card */}
                <div className="hero-visual" aria-hidden="true">
                    {/* Top Floating Badge */}
                    <div className="floating-badge floating-badge-top">
                        <Activity size={14} className="badge-indicator" />
                        <span>99.9% Lighthouse Score</span>
                    </div>

                    {/* Main Mockup Frame */}
                    <div className="mockup-frame">
                        {/* Mockup Window Header */}
                        <div className="mockup-header">
                            <div className="window-controls">
                                <span className="control-dot dot-close" />
                                <span className="control-dot dot-minimize" />
                                <span className="control-dot dot-expand" />
                            </div>

                            <div className="tab-pills">
                                <span className="tab-pill active">
                                    <Code2 size={12} />
                                    ApexLanding.jsx
                                </span>
                                <span className="tab-pill">
                                    <Bot size={12} />
                                    Copilot.jsx
                                </span>
                                <span className="tab-pill">schema.ts</span>
                            </div>

                            <div className="live-status">
                                <span className="status-pulse" />
                                <span>Live Engine</span>
                            </div>
                        </div>

                        {/* Mockup Interior Body */}
                        <div className="mockup-body">
                            {/* Stats Highlights */}
                            <div className="mockup-stats-row">
                                <div className="stat-mini-card">
                                    <span className="stat-label">API Latency</span>
                                    <span className="stat-value">18ms</span>
                                </div>
                                <div className="stat-mini-card">
                                    <span className="stat-label">Build Time</span>
                                    <span className="stat-value">1.2s</span>
                                </div>
                                <div className="stat-mini-card">
                                    <span className="stat-label">Bundle Size</span>
                                    <span className="stat-value">42 KB</span>
                                </div>
                            </div>

                            {/* Code Architecture Preview */}
                            <div className="mockup-code-card">
                                <div className="code-line">
                                    <span className="line-num">1</span>
                                    <span className="code-text">
                                        <span className="kw">import</span> &#123; createApexApp
                                        &#125; <span className="kw">from</span>{' '}
                                        <span className="str">'@apex/core'</span>;
                                    </span>
                                </div>
                                <div className="code-line">
                                    <span className="line-num">2</span>
                                    <span className="code-text">
                                        <span className="kw">import</span> &#123; PublicLayout,
                                        GlassCard &#125; <span className="kw">from</span>{' '}
                                        <span className="str">'@apex/ui'</span>;
                                    </span>
                                </div>
                                <div className="code-line">
                                    <span className="line-num">3</span>
                                    <span className="code-text">
                                        <span className="cm">
                                            // Instant full-stack boilerplate with AI copilot
                                        </span>
                                    </span>
                                </div>
                                <div className="code-line">
                                    <span className="line-num">4</span>
                                    <span className="code-text">
                                        <span className="kw">export const</span> app ={' '}
                                        <span className="fn">createApexApp</span>(&#123;{' '}
                                        <span className="fn">theme</span>:{' '}
                                        <span className="str">'glass'</span>,{' '}
                                        <span className="fn">ai</span>:{' '}
                                        <span className="kw">true</span> &#125;);
                                    </span>
                                </div>
                            </div>

                            {/* AI Copilot Status Row */}
                            <div className="mockup-copilot-row">
                                <div className="copilot-info">
                                    <Bot size={16} className="copilot-icon" />
                                    <span className="copilot-text">
                                        LangChain & Pinecone Streaming SSE
                                    </span>
                                </div>
                                <span className="copilot-tag">Ready</span>
                            </div>
                        </div>
                    </div>

                    {/* Bottom Floating Badge */}
                    <div className="floating-badge floating-badge-bottom">
                        <CheckCircle2 size={14} className="badge-indicator" />
                        <span>Zero !important SCSS Tokens</span>
                    </div>
                </div>
            </div>
        </section>
    );
}
