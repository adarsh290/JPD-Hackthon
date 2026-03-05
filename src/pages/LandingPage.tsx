import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { HackerBackground } from '@/components/HackerBackground';
import { useTheme } from '@/contexts/ThemeContext';
import {
    Brain, Moon, Sun, ArrowRight, ChevronRight,
    Link2, Settings2, BarChart3, Scissors,
    Activity, ShieldCheck, Zap, Globe,
    UserPlus, LogIn, Palette,
    Heart, Cpu, Eye, Lock,
} from 'lucide-react';

// ─── Helpers ─────────────────────────────────────────
function cn(...classes: (string | false | undefined)[]) {
    return classes.filter(Boolean).join(' ');
}

function ProgressBar({ label, value, color }: { label: string; value: number; color: string }) {
    const textColor =
        color === 'green' ? 'text-emerald-400' :
            color === 'yellow' ? 'text-yellow-400' : 'text-red-400';
    const barColor =
        color === 'green' ? 'bg-emerald-500' :
            color === 'yellow' ? 'bg-yellow-500' : 'bg-red-500';
    return (
        <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-mono">
                <span className="text-zinc-400">{label}</span>
                <span className={textColor}>{value}/100</span>
            </div>
            <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                <div
                    className={cn('h-full rounded-full transition-all duration-1000', barColor)}
                    style={{ width: `${value}%` }}
                />
            </div>
        </div>
    );
}

// ─── Feature Data ────────────────────────────────────
const features = [
    {
        icon: Link2,
        title: 'Smart Link Hubs',
        desc: 'Dynamically generated link pages that adapt to user context, device, and location in real-time.',
    },
    {
        icon: Settings2,
        title: 'Rule Engine',
        desc: 'Device-aware, time-gated, geo-fenced routing rules that direct visitors to the optimal URL.',
    },
    {
        icon: BarChart3,
        title: 'Advanced Analytics',
        desc: 'Real-time click, visit, and device breakdown dashboards powered by Socket.io pulse events.',
    },
    {
        icon: Scissors,
        title: 'URL Shortener',
        desc: 'Branded short URLs with customizable QR codes, click tracking, and one-click copy.',
    },
];

// ─── All Modules ─────────────────────────────────────
const modules = [
    {
        num: 1, title: 'Smart Link Hubs', subtitle: 'Context-Aware Link Pages', icon: Link2,
        status: 'ACTIVE', statusColor: 'text-emerald-400',
        details: ['Dynamic link rendering per visitor', 'Geo, device & time awareness', 'Auto-prioritized link ordering'],
    },
    {
        num: 2, title: 'Rule Engine', subtitle: 'Intelligent Routing Logic', icon: Cpu,
        status: 'ACTIVE', statusColor: 'text-emerald-400',
        details: ['Time-gated link visibility', 'Device-type targeting rules', 'Geo-fenced URL redirects'],
    },
    {
        num: 3, title: 'Pulse Analytics', subtitle: 'Real-Time Event Stream', icon: Activity,
        status: 'ACTIVE', statusColor: 'text-emerald-400',
        details: ['Socket.io live dashboard', 'Click & visit event emitters', 'Daily aggregated breakdowns'],
    },
    {
        num: 4, title: 'Gated Links', subtitle: 'Password-Protected Access', icon: Lock,
        status: 'ACTIVE', statusColor: 'text-emerald-400',
        details: ['Encrypted gate values', 'Unlock-before-reveal UX', 'AnimatePresence modals'],
    },
    {
        num: 5, title: 'Hub Health Scoring', subtitle: 'Automated Diagnostics', icon: Heart,
        status: 'SCORING', statusColor: 'text-yellow-400',
        details: ['Link performance: 85/100', 'Rule effectiveness: 65/100', 'Engagement above threshold'],
    },
    {
        num: 6, title: 'Context Detection', subtitle: 'Extreme Environment Adapt', icon: Eye,
        status: 'DETECTING', statusColor: 'text-cyan-400',
        details: ['Battery Status API (<15%)', 'Network Information API (2G)', 'Power-saver + Data-saver modes'],
    },
];

// Fallback health metrics (used when API is not available)
const defaultHealthMetrics = [
    { label: 'Link Performance', value: 85, color: 'green' as const },
    { label: 'Rule Effectiveness', value: 65, color: 'yellow' as const },
    { label: 'Hub Engagement', value: 92, color: 'green' as const },
    { label: 'Analytics Coverage', value: 48, color: 'red' as const },
];

interface PlatformStats {
    hubs: number;
    links: number;
    clicks: number;
    rules: number;
    users: number;
    uptime: { percentage: string; hours: number; days: number };
    health: {
        overall: number;
        linkPerformance: number;
        ruleEffectiveness: number;
        engagement: number;
        analyticsCoverage: number;
    };
}

function formatStat(n: number): string {
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M+`;
    if (n >= 1000) return `${(n / 1000).toFixed(1)}K+`;
    return n.toString();
}

function scoreColor(v: number): 'green' | 'yellow' | 'red' {
    if (v >= 70) return 'green';
    if (v >= 40) return 'yellow';
    return 'red';
}

// ─── Main Component ──────────────────────────────────
export default function LandingPage() {
    const { theme, toggleTheme } = useTheme();
    const dark = theme === 'dark';
    const [activeTab, setActiveTab] = useState<'overview' | 'metrics'>('overview');
    const [stats, setStats] = useState<PlatformStats | null>(null);
    const navigate = useNavigate();

    const cardBg = dark ? 'bg-zinc-900/70 border-green-500/20' : 'bg-white/90 border-zinc-300';
    const mutedText = dark ? 'text-zinc-400' : 'text-zinc-500';

    // Fetch live stats from the backend
    useEffect(() => {
        const API_URL = import.meta.env.VITE_API_URL || '/api';
        fetch(`${API_URL}/stats`)
            .then(r => r.json())
            .then(data => { if (data.success) setStats(data.data); })
            .catch(() => { }); // Silently fail — fallback to static values
    }, []);

    // Derived stats for the hero section
    const heroStats = [
        { label: 'Hubs Created', value: stats ? formatStat(stats.hubs) : '—' },
        { label: 'Links Tracked', value: stats ? formatStat(stats.clicks) : '—' },
        { label: 'Uptime', value: stats?.uptime.percentage ? `${stats.uptime.percentage}%` : '—' },
    ];

    // Derived health metrics from live data
    const healthMetrics = stats ? [
        { label: 'Link Performance', value: stats.health.linkPerformance, color: scoreColor(stats.health.linkPerformance) },
        { label: 'Rule Effectiveness', value: stats.health.ruleEffectiveness, color: scoreColor(stats.health.ruleEffectiveness) },
        { label: 'Hub Engagement', value: stats.health.engagement, color: scoreColor(stats.health.engagement) },
        { label: 'Analytics Coverage', value: stats.health.analyticsCoverage, color: scoreColor(stats.health.analyticsCoverage) },
    ] : defaultHealthMetrics;

    const overallHealth = stats?.health.overall ?? 73;

    return (
        <div className="min-h-screen scanlines">
            {/* Matrix rain background — same as login page */}
            <HackerBackground />

            {/* All content above the canvas */}
            <div className="relative z-10">

                {/* ─── NAVBAR ─────────────────────────────────── */}
                <nav className={cn(
                    'sticky top-0 z-50 backdrop-blur-xl border-b transition-colors duration-500',
                    dark ? 'border-green-500/10 bg-zinc-950/80' : 'border-zinc-200 bg-white/80'
                )}>
                    <div className="max-w-7xl mx-auto flex items-center justify-between px-4 sm:px-6 lg:px-8 h-16">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 rounded-lg bg-emerald-500/10">
                                <Brain className="w-5 h-5 text-emerald-500" />
                            </div>
                            <span className="font-display font-bold text-lg tracking-tight">
                                Smart<span className="text-emerald-500">Link</span>Hub
                            </span>
                            <span className={cn(
                                'ml-1 text-[10px] font-mono px-1.5 py-0.5 rounded',
                                dark ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-100 text-emerald-700'
                            )}>v2.0</span>
                        </div>
                        <button
                            aria-label="Toggle theme"
                            onClick={toggleTheme}
                            className={cn(
                                'flex items-center gap-2 text-sm font-mono px-3 py-1.5 rounded-lg transition-colors',
                                dark
                                    ? 'bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300'
                                    : 'bg-zinc-200 hover:bg-zinc-300 text-zinc-700'
                            )}
                        >
                            {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                            <span className="hidden sm:inline">{dark ? 'Light Mode' : 'Dark Mode'}</span>
                        </button>
                    </div>
                </nav>

                {/* ─── HERO SECTION ──────────────────────────── */}
                <section className="relative overflow-hidden">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

                    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 sm:pt-28 pb-16 text-center relative">
                        <div className={cn(
                            'inline-flex items-center gap-2 text-xs font-mono px-3 py-1 rounded-full mb-6 border',
                            dark ? 'bg-zinc-900/60 border-emerald-500/30 text-emerald-400' : 'bg-emerald-50 border-emerald-200 text-emerald-700'
                        )}>
                            <Zap className="w-3 h-3" />
                            v2.0 — AI-Powered Context Awareness
                        </div>

                        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-bold leading-tight mb-6">
                            <span className="text-emerald-500">Intelligent</span>{' '}
                            Link Management{' '}
                            <br className="hidden sm:block" />
                            Platform
                        </h1>

                        <p className={cn('text-base sm:text-lg max-w-2xl mx-auto mb-10 leading-relaxed', mutedText)}>
                            Create smart link hubs that dynamically adapt to users, context, and
                            performance — with real-time analytics, rule-based routing, and
                            branded QR codes built-in.
                        </p>

                        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                            <button
                                onClick={() => navigate('/')}
                                className="group flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-display font-bold px-6 py-3 rounded-lg transition-all duration-300 shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:scale-[1.02]"
                            >
                                Get Started Now
                                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                            </button>
                            <a
                                href="#features"
                                className={cn(
                                    'flex items-center gap-2 px-6 py-3 rounded-lg font-display font-bold border transition-all duration-300 hover:scale-[1.02]',
                                    dark
                                        ? 'border-zinc-700 text-zinc-300 hover:border-emerald-500/50 hover:text-emerald-400'
                                        : 'border-zinc-300 text-zinc-600 hover:border-emerald-500 hover:text-emerald-600'
                                )}
                            >
                                Explore Features
                                <ChevronRight className="w-4 h-4" />
                            </a>
                        </div>

                        {/* Stats row — LIVE from /api/stats */}
                        <div className="mt-16 grid grid-cols-3 gap-4 max-w-lg mx-auto">
                            {heroStats.map((s) => (
                                <div key={s.label} className="text-center">
                                    <div className="text-2xl font-display font-bold text-emerald-500">{s.value}</div>
                                    <div className={cn('text-xs font-mono mt-1', mutedText)}>{s.label}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ─── START YOUR JOURNEY ────────────────────── */}
                <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    <div className={cn(
                        'border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center transition-colors duration-500',
                        dark ? 'border-emerald-500/30 bg-emerald-500/[0.02]' : 'border-emerald-500/40 bg-emerald-50/50'
                    )}>
                        <h2 className="text-xl sm:text-2xl font-display font-bold mb-2">
                            {'>'} Start Your <span className="text-emerald-500">Journey</span>
                        </h2>
                        <p className={cn('text-sm mb-6', mutedText)}>
                            Choose your path to get started with SmartLinkHub
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                            <button
                                onClick={() => navigate('/')}
                                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-display font-bold px-6 py-2.5 rounded-lg transition-all shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40"
                            >
                                <UserPlus className="w-4 h-4" />
                                Sign Up Free
                            </button>
                            <button
                                onClick={() => navigate('/')}
                                className={cn(
                                    'w-full sm:w-auto flex items-center justify-center gap-2 font-display font-semibold px-5 py-2.5 rounded-lg border transition-all',
                                    dark
                                        ? 'border-zinc-700 text-zinc-300 hover:border-emerald-500/40 hover:text-emerald-400'
                                        : 'border-zinc-300 text-zinc-600 hover:border-emerald-500 hover:text-emerald-600'
                                )}
                            >
                                <LogIn className="w-4 h-4" />
                                Login as User
                            </button>
                            <button
                                onClick={() => navigate('/')}
                                className={cn(
                                    'w-full sm:w-auto flex items-center justify-center gap-2 font-display font-semibold px-5 py-2.5 rounded-lg border transition-all',
                                    dark
                                        ? 'border-zinc-700 text-zinc-300 hover:border-emerald-500/40 hover:text-emerald-400'
                                        : 'border-zinc-300 text-zinc-600 hover:border-emerald-500 hover:text-emerald-600'
                                )}
                            >
                                <Palette className="w-4 h-4" />
                                Login as Creator
                            </button>
                        </div>
                    </div>
                </section>

                {/* ─── FEATURES GRID ─────────────────────────── */}
                <section id="features" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                    <div className="text-center mb-12">
                        <h2 className="text-2xl sm:text-3xl font-display font-bold mb-3">
                            Core <span className="text-emerald-500">Features</span>
                        </h2>
                        <p className={cn('text-sm max-w-lg mx-auto', mutedText)}>
                            Everything you need to manage, track, and optimize your link ecosystem
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
                        {features.map((f) => (
                            <div
                                key={f.title}
                                className={cn(
                                    'group rounded-xl border p-5 sm:p-6 transition-all duration-300',
                                    'hover:-translate-y-1',
                                    cardBg,
                                    dark
                                        ? 'hover:border-emerald-500/40 hover:shadow-lg hover:shadow-emerald-500/5'
                                        : 'hover:border-emerald-500/60 hover:shadow-lg hover:shadow-emerald-500/10'
                                )}
                            >
                                <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center mb-4 group-hover:bg-emerald-500/20 transition-colors">
                                    <f.icon className="w-5 h-5 text-emerald-500" />
                                </div>
                                <h3 className="font-display font-bold text-sm mb-2">{f.title}</h3>
                                <p className={cn('text-xs leading-relaxed', mutedText)}>{f.desc}</p>
                            </div>
                        ))}
                    </div>

                    <div className="flex flex-wrap justify-center gap-2 mt-10">
                        {[
                            { icon: Globe, label: 'Geo Routing' },
                            { icon: Activity, label: 'Real-Time Pulse' },
                            { icon: ShieldCheck, label: 'Gated Links' },
                            { icon: Zap, label: 'Context Detection' },
                        ].map((p) => (
                            <span
                                key={p.label}
                                className={cn(
                                    'flex items-center gap-1.5 text-xs font-mono px-3 py-1.5 rounded-full border transition-colors',
                                    dark
                                        ? 'border-zinc-800 text-zinc-400 hover:border-emerald-500/30 hover:text-emerald-400'
                                        : 'border-zinc-200 text-zinc-500 hover:border-emerald-400 hover:text-emerald-600'
                                )}
                            >
                                <p.icon className="w-3 h-3" />
                                {p.label}
                            </span>
                        ))}
                    </div>
                </section>

                {/* ─── ALL MODULES ─────────────────────────────── */}
                <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                    <div className="text-center mb-10">
                        <span className={cn(
                            'text-xs font-mono px-3 py-1 rounded-full border inline-block mb-4',
                            dark ? 'border-emerald-500/30 text-emerald-400' : 'border-emerald-200 text-emerald-700'
                        )}>
                            SYSTEM ARCHITECTURE
                        </span>
                        <h2 className="text-2xl sm:text-3xl font-display font-bold mb-2">
                            Platform <span className="text-emerald-500">Modules</span>
                        </h2>
                        <p className={cn('text-sm', mutedText)}>
                            Six integrated modules powering the intelligent link infrastructure
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {modules.map((m) => (
                            <div
                                key={m.num}
                                className={cn(
                                    'group rounded-xl border p-5 transition-all duration-300 hover:-translate-y-0.5',
                                    cardBg,
                                    dark
                                        ? 'hover:border-emerald-500/40 hover:shadow-lg hover:shadow-emerald-500/5'
                                        : 'hover:border-emerald-500/60 hover:shadow-md'
                                )}
                            >
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <span className={cn(
                                            'text-[10px] font-mono font-bold px-1.5 py-0.5 rounded',
                                            dark ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-100 text-emerald-700'
                                        )}>
                                            M{m.num}
                                        </span>
                                        <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center group-hover:bg-emerald-500/20 transition-colors">
                                            <m.icon className="w-3.5 h-3.5 text-emerald-500" />
                                        </div>
                                    </div>
                                    <span className={cn('text-[10px] font-mono font-bold', m.statusColor)}>
                                        [{m.status}]
                                    </span>
                                </div>

                                <h3 className="font-display font-bold text-sm mb-0.5">{m.title}</h3>
                                <p className={cn('text-[11px] font-mono mb-3', mutedText)}>{m.subtitle}</p>

                                <div className="space-y-1">
                                    {m.details.map((d, i) => (
                                        <div key={i} className="flex items-start gap-2 text-xs">
                                            <span className="text-emerald-500/60 mt-0.5">›</span>
                                            <span className={mutedText}>{d}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* ─── LIVE DASHBOARD PREVIEW ──────────────────── */}
                <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                    <div className="text-center mb-8">
                        <span className={cn(
                            'text-xs font-mono px-3 py-1 rounded-full border inline-block mb-4',
                            dark ? 'border-emerald-500/30 text-emerald-400' : 'border-emerald-200 text-emerald-700'
                        )}>
                            INTERACTIVE PREVIEW
                        </span>
                        <h2 className="text-2xl sm:text-3xl font-display font-bold mb-2">
                            Hub <span className="text-emerald-500">Health</span> Dashboard
                        </h2>
                        <p className={cn('text-sm', mutedText)}>
                            Live diagnostic feed across all modules
                        </p>
                    </div>

                    <div className={cn(
                        'flex justify-center gap-1 p-1 rounded-lg w-fit mx-auto mb-6',
                        dark ? 'bg-zinc-900/80' : 'bg-zinc-200'
                    )}>
                        {[
                            { key: 'overview', label: 'Overview' },
                            { key: 'metrics', label: 'Live Feed' },
                        ].map((t) => (
                            <button
                                key={t.key}
                                onClick={() => setActiveTab(t.key as 'overview' | 'metrics')}
                                className={cn(
                                    'px-4 py-1.5 rounded-md text-xs font-mono transition-all',
                                    activeTab === t.key
                                        ? 'bg-emerald-500 text-zinc-950 font-bold'
                                        : dark ? 'text-zinc-400 hover:text-zinc-200' : 'text-zinc-500 hover:text-zinc-800'
                                )}
                            >
                                {t.label}
                            </button>
                        ))}
                    </div>

                    <div className={cn(
                        'rounded-xl border overflow-hidden transition-colors duration-500',
                        cardBg
                    )}>
                        <div className={cn(
                            'flex items-center gap-2 px-4 py-2.5 border-b',
                            dark ? 'bg-zinc-900/50 border-green-500/10' : 'bg-zinc-100 border-zinc-200'
                        )}>
                            <div className="flex gap-1.5">
                                <span className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                                <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
                                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                            </div>
                            <span className={cn('text-[11px] font-mono ml-2', mutedText)}>
                                hub_health_v2.dashboard
                            </span>
                            <span className="ml-auto text-[10px] font-mono text-emerald-400 animate-pulse">● LIVE</span>
                        </div>

                        <div className="p-5 sm:p-6">
                            {activeTab === 'overview' ? (
                                <div className="space-y-6">
                                    <div className="text-center py-4">
                                        <div className="text-5xl font-display font-bold text-emerald-500 mb-1">{overallHealth}<span className="text-2xl text-zinc-500">/100</span></div>
                                        <div className={cn('text-xs font-mono', mutedText)}>OVERALL HUB HEALTH SCORE {stats && <span className="text-emerald-400 ml-1">● LIVE</span>}</div>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {healthMetrics.map((m) => (
                                            <ProgressBar key={m.label} {...m} />
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="font-mono text-xs space-y-2">
                                        {[
                                            { ts: '11:04:32', src: 'M5', msg: `link_perf: ${stats?.health.linkPerformance ?? 85} — ${(stats?.health.linkPerformance ?? 85) >= 70 ? 'all rules passing' : 'needs attention'}`, c: (stats?.health.linkPerformance ?? 85) >= 70 ? 'text-emerald-400' : 'text-yellow-400' },
                                            { ts: '11:04:28', src: 'M2', msg: `rule_engine: ${stats?.health.ruleEffectiveness ?? 65} — ${stats?.rules ?? 0} rules active`, c: (stats?.health.ruleEffectiveness ?? 65) >= 70 ? 'text-emerald-400' : 'text-yellow-400' },
                                            { ts: '11:04:22', src: 'M3', msg: `pulse_event: ${stats?.clicks ?? 0} total clicks tracked`, c: 'text-cyan-400' },
                                            { ts: '11:04:18', src: 'M5', msg: `analytics_coverage: ${stats?.health.analyticsCoverage ?? 48}/100`, c: (stats?.health.analyticsCoverage ?? 48) >= 40 ? 'text-yellow-400' : 'text-red-400' },
                                            { ts: '11:04:14', src: 'M4', msg: `gate_system: online — ${stats?.links ?? 0} links monitored`, c: 'text-emerald-400' },
                                            { ts: '11:04:10', src: 'M6', msg: 'context_detector: battery_api OK', c: 'text-emerald-400' },
                                            { ts: '11:04:06', src: 'M1', msg: `hub_resolve: ${stats?.hubs ?? 0} hubs active`, c: 'text-emerald-400' },
                                            { ts: '11:04:01', src: 'M3', msg: `uptime: ${stats?.uptime.hours ?? 0}h ${stats?.uptime.days ?? 0}d — ${stats?.users ?? 0} users`, c: 'text-emerald-400' },
                                        ].map((l, i) => (
                                            <div key={i} className="flex gap-3">
                                                <span className={dark ? 'text-zinc-600' : 'text-zinc-400'}>[{l.ts}]</span>
                                                <span className={cn(
                                                    'text-[10px] font-bold px-1 rounded',
                                                    dark ? 'bg-zinc-800 text-zinc-400' : 'bg-zinc-200 text-zinc-500'
                                                )}>{l.src}</span>
                                                <span className={l.c}>{l.msg}</span>
                                            </div>
                                        ))}
                                    </div>
                                    <div className={cn('text-[10px] font-mono text-right', mutedText)}>
                                        last_scan: 2 min ago · next_scan: 8 min · modules: 6/6 online
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </section>

                {/* ─── FOOTER ────────────────────────────────── */}
                <footer className={cn(
                    'border-t py-8 transition-colors duration-500',
                    dark ? 'border-zinc-800/50' : 'border-zinc-200'
                )}>
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                            <Brain className="w-4 h-4 text-emerald-500" />
                            <span className="font-display font-bold text-sm">SmartLinkHub</span>
                        </div>
                        <p className={cn('text-xs font-mono', mutedText)}>
                            © 2026 SmartLinkHub — Intelligent Link Infrastructure
                        </p>
                    </div>
                </footer>

            </div>
        </div>
    );
}
