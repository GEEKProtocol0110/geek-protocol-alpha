"use client";
import React, { useState, useEffect, useRef } from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { GigaMascot, AceMascot } from '@/components/GeekMascots';
import { WavyDivider } from '@/components/WavyDivider';
import { Marquee } from '@/components/Marquee';
import { useScrollProgress, useCountUp, useParallax, useTilt, useMagnetic } from '@/lib/scrollFx';
import {
  FaGamepad,
  FaCoins,
  FaChartLine,
  FaLock,
  FaClock,
  FaGlobe,
  FaLightbulb,
  FaBullseye,
  FaBolt,
  FaStar,
  FaWallet,
  FaTrophy,
  FaBrain,
  FaRocket,
  FaUsers,
  FaGithub,
  FaTwitter,
  FaTelegram,
  FaLink,
  FaBook,
  FaCog,
  FaUser,
  FaExternalLinkAlt
} from 'react-icons/fa';
const SiKaspa = FaGlobe;

const HOW_IT_WORKS = [
  {
    icon: FaWallet,
    tile: "#eee6ff",
    title: "Connect",
    description: "Link your Kaspa wallet in one click. No passwords, no signups, no central database holding your data.",
  },
  {
    icon: FaGamepad,
    tile: "#ffe3b0",
    title: "Play",
    description: "Face 10 rapid-fire questions across any of 8 categories. 15 seconds each. Server-side scoring keeps it fair.",
  },
  {
    icon: FaCoins,
    tile: "#d4f2e3",
    title: "Earn",
    description: "Get paid in $GEEK the moment you finish. Settlement lands on Kaspa in under 6 seconds — no waiting around.",
  },
];

const FEATURES = [
  {
    icon: FaGamepad,
    title: "The Gauntlet",
    description: "10 rounds of 10 questions (100 total) with progressing difficulty. 15 seconds each. Server-side validation prevents cheating. Real players, real rewards.",
    details: ["Server-side scoring", "HMAC attempt tokens", "Anti-cheat orchestration"]
  },
  {
    icon: FaCoins,
    title: "$GEEK Rewards",
    description: "Native KRC-20 token earned through gameplay. No play-to-earn fatigue. Transparent, auditable payouts via Redis queue.",
    details: ["Redis worker automation", "Sub-6 second settlements", "Wallet-level payouts"]
  },
  {
    icon: FaChartLine,
    title: "Live Leaderboards",
    description: "Real-time rankings. Track your XP, win streaks, and performance. Compare globally. Compete fairly.",
    details: ["Instant rank updates", "XP tracking", "Detailed analytics"]
  },
  {
    icon: FaLock,
    title: "Kasware Auth",
    description: "Sign in with your Kaspa wallet. No passwords. No central database. Your identity, your data, your control.",
    details: ["Schnorr signature verification", "Nonce challenges", "JWT sessions"]
  },
  {
    icon: FaClock,
    title: "Sub-6 Second Settlements",
    description: "Proof of signal hits your wallet faster than you can reload the page. This is instant settlement in practice.",
    details: ["Real-time queue monitoring", "Worker heartbeat tracking", "Instant confirmation"]
  },
  {
    icon: FaGlobe,
    title: "Built on Kaspa",
    description: "Fastest smart contract blockchain. Sub-second block times. Scalability that doesn't compromise security. This is where it lives.",
    details: ["KRC-20 integration", "Kaspa wallets", "Fee-efficient payouts"]
  }
];

const CATEGORIES = [
  { icon: FaGamepad, name: "Video Games" },
  { icon: FaCoins, name: "Technology" },
  { icon: FaRocket, name: "Science Fiction" },
  { icon: FaBolt, name: "Movies" },
  { icon: FaBrain, name: "Anime" },
  { icon: FaBook, name: "Comics" },
  { icon: FaGlobe, name: "History" },
  { icon: FaUsers, name: "Pop Culture" }
];

const IMPACT_ITEMS = [
  {
    icon: FaLightbulb,
    title: "Your Knowledge Has Value",
    description: "Stop giving away your expertise for free. Every answer you provide proves your knowledge. Every correct response generates real, verifiable signal that gets rewarded immediately.",
    points: [
      "Monetize your geek knowledge instantly",
      "No middleman taking a cut",
      "Direct rewards to your wallet"
    ],
    accent: "cyan"
  },
  {
    icon: FaBullseye,
    title: "Compete Without Gatekeeping",
    description: "Leaderboards are global. Competition is fair. Everyone plays by the same rules. Your ranking is determined by skill and speed, not money or connections.",
    points: [
      "Fair, transparent ranking system",
      "Real-time leaderboards show your position",
      "Compete against geeks worldwide"
    ],
    accent: "emerald"
  },
  {
    icon: FaBolt,
    title: "Instant Rewards, Real Settlement",
    description: "You don't wait days for your earnings. Rewards settle in under 6 seconds. The blockchain doesn't lie. Your token hits your wallet almost before the game ends.",
    points: [
      "Sub-6 second settlement times",
      "No waiting for manual payouts",
      "Cryptographically verified rewards"
    ],
    accent: "cyan"
  },
  {
    icon: FaStar,
    title: "Build Your On-Chain Reputation",
    description: "Every achievement is recorded. Your skill profile is permanent. Your reputation isn't deleted by algorithm changes. It lives on the blockchain—forever.",
    points: [
      "Permanent on-chain proof of knowledge",
      "Portable reputation across platforms",
      "XP streaks and achievement tracking"
    ],
    accent: "emerald"
  }
];

const RESOURCES = [
  {
    icon: FaRocket,
    title: "v0.1.0-alpha Release",
    description: "Our first Alpha release is live! Check out what's new.",
    href: "https://github.com/GEEKProtocol0110/geek-protocol-alpha/releases/tag/v0.1.0-alpha",
    external: true,
    status: "Live",
    featured: true
  },
  {
    icon: FaBook,
    title: "Changelog",
    description: "Complete version history and feature updates",
    href: "https://github.com/GEEKProtocol0110/geek-protocol-alpha/blob/main/CHANGELOG.md",
    external: true,
    status: "Live"
  },
  {
    icon: FaCog,
    title: "Architecture",
    description: "System design, data flows, and technical diagrams",
    href: "https://github.com/GEEKProtocol0110/geek-protocol-alpha/blob/main/docs/ARCHITECTURE.md",
    external: true,
    status: "Live"
  },
  {
    icon: FaCoins,
    title: "Grant Proposal",
    description: "Our Kaspa DAO funding proposal and roadmap",
    href: "https://github.com/GEEKProtocol0110/geek-protocol-alpha/blob/main/docs/funding/GRANT_PROPOSAL.md",
    external: true,
    status: "Live"
  },
  {
    icon: FaBook,
    title: "Litepaper",
    description: "Deep technical dive into how Geek Protocol works",
    href: "/litepaper",
    status: "Coming Soon"
  },
  {
    icon: FaGithub,
    title: "GitHub Repository",
    description: "Open-source code. Full transparency. MIT licensed.",
    href: "https://github.com/GEEKProtocol0110/geek-protocol-alpha",
    external: true,
    status: "Live"
  },
  {
    icon: SiKaspa,
    title: "Kaspa Official",
    description: "Learn about the blockchain powering Geek Protocol",
    href: "https://kaspa.org",
    external: true,
    status: "Live"
  },
  {
    icon: FaGamepad,
    title: "Play the Game",
    description: "Enter the Geek Gauntlet and start earning",
    href: "/play",
    status: "Alpha"
  },
  {
    icon: FaUsers,
    title: "Community",
    description: "Join geeks building the future together",
    href: "https://t.me/GEEKonKAScommunity",
    external: true,
    status: "Live"
  },
  {
    icon: FaTwitter,
    title: "Follow Updates",
    description: "Stay informed about launches and milestones",
    href: "https://x.com/geekonkas",
    external: true,
    status: "Live"
  }
];

const COMING_SOON = [
  {
    icon: FaGamepad,
    title: "Play",
    description: "Enter the Geek Gauntlet. Prove your knowledge. Earn $GEEK rewards."
  },
  {
    icon: FaChartLine,
    title: "Dashboard",
    description: "Track your attempts, XP, and rewards. View your progress and history."
  },
  {
    icon: FaTrophy,
    title: "Leaderboard",
    description: "Global rankings updated in real-time. See who's dominating."
  },
  {
    icon: FaUser,
    title: "Profile",
    description: "Your personal performance page. Stats, achievements, and history."
  },
  {
    icon: FaBook,
    title: "Litepaper",
    description: "Deep dive into the protocol. How it works. Why it matters."
  },
  {
    icon: FaCog,
    title: "Admin",
    description: "Operator console. Monitor attempts, rewards, and system health."
  }
];

const ROADMAP = [
  {
    year: 1,
    title: "Year 1",
    subtitle: "2026 – Launch & Traction",
    items: [
      { status: "done", text: "Public beta on Kaspa mainnet" },
      { status: "done", text: "First major live tournament" },
      { status: "next", text: "Content velocity expansion" },
      { status: "next", text: "Telegram mini app + Geek Wallet" }
    ],
    accent: "cyan"
  },
  {
    year: 3,
    title: "Year 3",
    subtitle: "2028 – Expansion",
    items: [
      { status: "next", text: "Mobile app (iOS + Android)" },
      { status: "next", text: "Partner integrations" },
      { status: "next", text: "IRL presence & events" },
      { status: "next", text: "DAO + open-sourcing begins" }
    ],
    accent: "emerald"
  },
  {
    year: 5,
    title: "Year 5",
    subtitle: "2030 – Definitive Hub",
    items: [
      { status: "next", text: "Ecosystem hub status" },
      { status: "next", text: "A.C.E. as a Service licensing" },
      { status: "next", text: "Launchpad for geek-native projects" },
      { status: "next", text: "Legacy system complete" }
    ],
    accent: "purple"
  }
];

const ACCENT_COLORS: Record<string, string> = {
  cyan: 'var(--brand-primary)',
  emerald: 'var(--brand-secondary)',
  purple: 'var(--brand-primary-light)'
};

const SectionLabel = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flat-badge mb-5">
      {children}
    </div>
  );
};

type RevealVariant = 'fade-up' | 'fade-left' | 'fade-right' | 'scale' | 'rotate';

const ScrollReveal = ({
  children,
  delay = 0,
  className = '',
  variant = 'fade-up',
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  variant?: RevealVariant;
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.15 }
    );
    observer.observe(node);
    return () => observer.unobserve(node);
  }, []);

  return (
    <div
      ref={ref}
      className={`reveal-${variant} ${isVisible ? 'reveal-in' : 'reveal-pending'} ${className}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
};

/** Pointer-reactive 3D tilt wrapper - flat cards read like sturdy trading cards when tilted. */
const TiltCard = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => {
  const ref = useTilt<HTMLDivElement>(7);
  return (
    <div ref={ref} className={`tilt-card ${className}`}>
      {children}
    </div>
  );
};

/** A number that counts up from 0 once it scrolls into view. */
const Counter = ({ end, suffix = '', prefix = '' }: { end: number; suffix?: string; prefix?: string }) => {
  const { ref, formatted } = useCountUp<HTMLSpanElement>(end);
  return (
    <span ref={ref}>
      {prefix}
      {formatted}
      {suffix}
    </span>
  );
};

/** Anchor that gently follows the cursor within its own bounds - a tasteful magnetic-button feel. */
const MagneticLink = ({ href, className, children }: { href: string; className?: string; children: React.ReactNode }) => {
  const ref = useMagnetic<HTMLAnchorElement>(0.25);
  return (
    <a ref={ref} href={href} className={`magnetic-btn ${className ?? ''}`}>
      {children}
    </a>
  );
};

/** Reward-curve line chart that draws itself in once scrolled into view. */
const AnimatedRewardCurve = () => {
  const pathRef = useRef<SVGPathElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [drawn, setDrawn] = useState(false);
  const [length, setLength] = useState(0);

  useEffect(() => {
    if (pathRef.current) setLength(pathRef.current.getTotalLength());
  }, []);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setDrawn(true);
          observer.unobserve(node);
        }
      },
      { threshold: 0.4 }
    );
    observer.observe(node);
    return () => observer.unobserve(node);
  }, []);

  const points = [
    { x: 60, y: 26 }, { x: 100, y: 48 }, { x: 140, y: 68 }, { x: 180, y: 84 },
    { x: 220, y: 60 }, { x: 260, y: 42 }, { x: 300, y: 30 }, { x: 340, y: 22 }, { x: 380, y: 20 },
  ];

  return (
    <div ref={containerRef} className="h-[150px] w-full">
      <svg className="w-full h-full" viewBox="0 0 400 150" preserveAspectRatio="none">
        <line x1="20" y1="20" x2="20" y2="130" stroke="rgba(26,26,46,0.12)" strokeWidth="1" />
        <line x1="20" y1="130" x2="380" y2="130" stroke="rgba(26,26,46,0.12)" strokeWidth="1" />
        {[0, 1, 2, 3, 4].map((i) => {
          const y = 20 + i * 27.5;
          return <line key={i} x1="20" y1={y} x2="380" y2={y} stroke="rgba(26,26,46,0.06)" strokeWidth="0.5" />;
        })}
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => {
          const x = 20 + i * 40;
          return <line key={i} x1={x} y1="20" x2={x} y2="130" stroke="rgba(26,26,46,0.06)" strokeWidth="0.5" />;
        })}
        <path
          d="M20,130 L60,26 L100,48 L140,68 L180,84 L220,60 L260,42 L300,30 L340,22 L380,20 L380,130 L20,130 Z"
          fill="rgba(108,62,245,0.08)"
          style={{ opacity: drawn ? 1 : 0, transition: 'opacity 1s ease 0.8s' }}
        />
        <path
          ref={pathRef}
          d="M20,130 L60,26 L100,48 L140,68 L180,84 L220,60 L260,42 L300,30 L340,22 L380,20"
          fill="none"
          stroke="#6c3ef5"
          strokeWidth="2.5"
          style={
            length
              ? {
                  strokeDasharray: length,
                  strokeDashoffset: drawn ? 0 : length,
                  transition: 'stroke-dashoffset 1.5s cubic-bezier(0.16, 1, 0.3, 1)',
                }
              : undefined
          }
        />
        {points.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r="3.5"
            fill="#f04e3e"
            style={{
              opacity: drawn ? 1 : 0,
              transform: drawn ? 'scale(1)' : 'scale(0)',
              transformOrigin: `${p.x}px ${p.y}px`,
              transition: `opacity 0.3s ease ${0.2 + i * 0.1}s, transform 0.3s ease ${0.2 + i * 0.1}s`,
            }}
          />
        ))}
      </svg>
    </div>
  );
};

export default function LandingPage() {
  const scrollProgress = useScrollProgress();
  const gigaParallax = useParallax<HTMLDivElement>(0.12);
  const aceParallax = useParallax<HTMLDivElement>(-0.1);

  return (
    <div className="min-h-screen bg-[var(--surface-0)] text-[var(--text-1)] font-sans overflow-x-hidden">
      {/* Scroll progress bar - flat, thick-bordered, no gradient */}
      <div className="fixed top-0 left-0 w-full h-[5px] z-[300] bg-transparent">
        <div
          className="h-full"
          style={{ width: `${scrollProgress}%`, background: 'var(--brand-accent)', borderRight: scrollProgress > 1 ? '3px solid var(--ink)' : 'none', transition: 'width 0.1s linear' }}
        />
      </div>

      <Navbar />

      {/* ── Hero band (flat, solid color, no gradient) ─────────────────────── */}
      <section className="relative overflow-hidden" style={{ background: 'var(--brand-primary)' }}>
        <div className="max-w-[1400px] mx-auto px-4 md:px-8 pt-16 pb-20 md:pt-24 md:pb-28 grid md:grid-cols-2 gap-10 items-center">
          <ScrollReveal variant="fade-left">
            <div className="flex flex-col gap-6">
              <div className="flat-badge w-fit">
                <span className="w-1.5 h-1.5 bg-[var(--brand-secondary)] rounded-full animate-pulse" />
                Live on Kaspa · KRC-20 native
              </div>

              <h1 className="font-extrabold leading-[0.92] text-white">
                <span className="block text-6xl sm:text-7xl md:text-8xl">GEEK</span>
                <span className="block text-6xl sm:text-7xl md:text-8xl" style={{ color: 'var(--flat-yellow)' }}>PROTOCOL</span>
              </h1>
              <p className="text-xl md:text-2xl font-bold text-white">A Quiz2Earn ecosystem….kinda a whole knowledge economy.</p>
              <p className="text-base md:text-lg text-white/85 max-w-[480px]">
                Prove your knowledge across 8 categories. Answer fast, answer right, and get paid in <strong>$GEEK</strong> — settled on Kaspa in under 6 seconds. No gatekeeping, no middlemen.
              </p>

              <div className="flex flex-wrap gap-3 mt-2">
                <MagneticLink href="/auth/register" className="flat-btn flat-btn-accent text-base">
                  Get Started →
                </MagneticLink>
                <MagneticLink href="/auth/login" className="flat-btn text-base">
                  Sign In
                </MagneticLink>
              </div>
            </div>
          </ScrollReveal>

          <div className="relative flex justify-center md:justify-end">
            <div ref={gigaParallax}>
              <GigaMascot className="w-56 sm:w-64 md:w-80 flat-bob" />
            </div>
          </div>
        </div>

        <WavyDivider fill="var(--flat-yellow)" />
      </section>

      {/* ── "Future of" band (flat yellow, no gradient) ────────────────────── */}
      <section className="relative" style={{ background: 'var(--flat-yellow)' }}>
        <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-16 md:py-20 grid md:grid-cols-2 gap-10 items-center">
          <div className="flex justify-center order-2 md:order-1 relative">
            <div ref={aceParallax}>
              <AceMascot className="w-56 sm:w-64 md:w-80" />
            </div>
            <div className="hidden md:flex absolute -bottom-2 -left-6 flat-badge">
              <FaStar className="text-[var(--brand-accent)]" /> On-chain proof
            </div>
          </div>
          <ScrollReveal variant="fade-right" className="order-1 md:order-2">
            <div className="flat-badge mb-5">Protocol Entities</div>
            <h2 className="font-extrabold text-3xl md:text-5xl text-[var(--ink)] leading-tight">
              The future of proof-of-learning
            </h2>
            <p className="mt-4 text-base md:text-lg text-[var(--ink)] opacity-80 max-w-[520px]">
              Meet <strong>GIGA</strong>, the golden face of the community, and <strong>A.C.E.</strong>, the AI quizmaster who runs the Gauntlet and settles rewards on-chain. Together they turn what you already know into something worth real money.
            </p>
            <div className="flex flex-wrap gap-2 mt-5">
              <span className="flat-badge">#Community</span>
              <span className="flat-badge">#Quizmaster</span>
              <span className="flat-badge">#OnChain</span>
            </div>
          </ScrollReveal>
        </div>

        <WavyDivider fill="var(--surface-0)" />
      </section>

      {/* ── How It Works (3-card, flat, tilt-on-hover) ──────────────────────── */}
      <section className="py-20 px-4 md:px-8 max-w-[1400px] mx-auto">
        <div className="text-center mb-14">
          <div className="flat-badge mb-4 mx-auto w-fit">Getting Started</div>
          <h2 className="font-extrabold text-4xl md:text-5xl text-[var(--text-1)]">How it works</h2>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {HOW_IT_WORKS.map((step, idx) => (
            <ScrollReveal key={step.title} delay={idx * 120} variant="scale">
              <TiltCard>
                <div className="flat-card p-6 h-full flex flex-col" style={{ background: 'var(--flat-cream)' }}>
                  <div className="flat-icon-tile mb-6" style={{ background: step.tile }}>
                    <step.icon className="text-[var(--ink)]" />
                  </div>
                  <h3 className="font-extrabold text-2xl text-[var(--ink)] mb-2">{step.title}</h3>
                  <p className="text-sm text-[var(--ink)] opacity-75 leading-relaxed">{step.description}</p>
                </div>
              </TiltCard>
            </ScrollReveal>
          ))}
        </div>
      </section>

      {/* ── Quick stats (count-up on scroll) ────────────────────────────────── */}
      <section className="px-4 md:px-8 max-w-[1400px] mx-auto pb-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { end: 8, suffix: '', label: 'Knowledge Categories' },
            { end: 100, suffix: '', label: 'Questions (10 rounds)' },
            { end: 15, suffix: 's', label: 'Per Question' },
            { end: 6, suffix: 's', prefix: '<', label: 'Reward Settlement' },
          ].map((stat, idx) => (
            <ScrollReveal key={stat.label} delay={idx * 100} variant="fade-up">
              <div className="flat-card p-6 text-center">
                <div className="text-4xl md:text-5xl font-extrabold text-[var(--brand-primary)] mb-2">
                  <Counter end={stat.end} suffix={stat.suffix} prefix={stat.prefix} />
                </div>
                <div className="text-xs md:text-sm text-[var(--text-3)] font-semibold">{stat.label}</div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </section>

      {/* ── Ticker ───────────────────────────────────────────────────────────── */}
      <Marquee
        items={['#KRC-20', '#PROOF-OF-LEARNING', '#ALL-HOPE-NO-HYPE', '#SUB-6-SECOND-SETTLEMENT', '#QUIZ2EARN', '#BUILT-ON-KASPA']}
      />

      {/* Gauntlet */}
      <section className="py-16 px-4 md:px-8 max-w-[1400px] mx-auto">
        <div className="py-4">
          <SectionLabel>Challenge Module</SectionLabel>
          <h2 className="font-extrabold text-3xl md:text-4xl text-[var(--text-1)]">The Geek Gauntlet</h2>
          <p className="text-[var(--text-2)] mt-3 text-lg">10 rounds · Increasing difficulty · Real rewards</p>

          <div className="grid md:grid-cols-2 gap-8 mt-10">
            <div className="flat-card overflow-x-auto p-2">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr>
                    <th className="text-left px-3 py-2 text-[var(--text-3)] text-[10px] tracking-widest uppercase font-bold">Rnd</th>
                    <th className="text-left px-3 py-2 text-[var(--text-3)] text-[10px] tracking-widest uppercase font-bold">Entry</th>
                    <th className="text-left px-3 py-2 text-[var(--text-3)] text-[10px] tracking-widest uppercase font-bold">Reward/Q</th>
                    <th className="text-left px-3 py-2 text-[var(--text-3)] text-[10px] tracking-widest uppercase font-bold">Max Earn</th>
                    <th className="text-left px-3 py-2 text-[var(--text-3)] text-[10px] tracking-widest uppercase font-bold">B/E</th>
                    <th className="text-left px-3 py-2 text-[var(--text-3)] text-[10px] tracking-widest uppercase font-bold">Diff</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="hover:bg-[var(--flat-cream)] transition">
                    <td className="px-3 py-2 border-b border-[var(--border-soft)] text-[var(--brand-primary)] font-bold">01</td>
                    <td className="px-3 py-2 border-b border-[var(--border-soft)]">Free</td>
                    <td className="px-3 py-2 border-b border-[var(--border-soft)]">10 GEEK</td>
                    <td className="px-3 py-2 border-b border-[var(--border-soft)]">100 GEEK</td>
                    <td className="px-3 py-2 border-b border-[var(--border-soft)]">0</td>
                    <td className="px-3 py-2 border-b border-[var(--border-soft)]"><span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-[var(--brand-primary)]/10 text-[var(--brand-primary)]">Easy</span></td>
                  </tr>
                  <tr className="hover:bg-[var(--flat-cream)] transition">
                    <td className="px-3 py-2 border-b border-[var(--border-soft)] text-[var(--brand-primary)] font-bold">02</td>
                    <td className="px-3 py-2 border-b border-[var(--border-soft)]">40 GEEK</td>
                    <td className="px-3 py-2 border-b border-[var(--border-soft)]">20 GEEK</td>
                    <td className="px-3 py-2 border-b border-[var(--border-soft)]">200 GEEK</td>
                    <td className="px-3 py-2 border-b border-[var(--border-soft)]">2</td>
                    <td className="px-3 py-2 border-b border-[var(--border-soft)]"><span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-[var(--brand-primary)]/10 text-[var(--brand-primary)]">Easy+</span></td>
                  </tr>
                  <tr className="hover:bg-[var(--flat-cream)] transition">
                    <td className="px-3 py-2 border-b border-[var(--border-soft)] text-[var(--brand-primary)] font-bold">03</td>
                    <td className="px-3 py-2 border-b border-[var(--border-soft)]">100 GEEK</td>
                    <td className="px-3 py-2 border-b border-[var(--border-soft)]">40 GEEK</td>
                    <td className="px-3 py-2 border-b border-[var(--border-soft)]">400 GEEK</td>
                    <td className="px-3 py-2 border-b border-[var(--border-soft)]">3</td>
                    <td className="px-3 py-2 border-b border-[var(--border-soft)]"><span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-[var(--brand-accent)]/10 text-[var(--brand-accent)]">Medium</span></td>
                  </tr>
                  <tr className="hover:bg-[var(--flat-cream)] transition">
                    <td className="px-3 py-2 border-b border-[var(--border-soft)] text-[var(--brand-primary)] font-bold">04</td>
                    <td className="px-3 py-2 border-b border-[var(--border-soft)]">200 GEEK</td>
                    <td className="px-3 py-2 border-b border-[var(--border-soft)]">75 GEEK</td>
                    <td className="px-3 py-2 border-b border-[var(--border-soft)]">750 GEEK</td>
                    <td className="px-3 py-2 border-b border-[var(--border-soft)]">3</td>
                    <td className="px-3 py-2 border-b border-[var(--border-soft)]"><span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-[var(--brand-accent)]/10 text-[var(--brand-accent)]">Med+</span></td>
                  </tr>
                  <tr className="hover:bg-[var(--flat-cream)] transition">
                    <td className="px-3 py-2 border-b border-[var(--border-soft)] text-[var(--brand-primary)] font-bold">05</td>
                    <td className="px-3 py-2 border-b border-[var(--border-soft)]">400 GEEK</td>
                    <td className="px-3 py-2 border-b border-[var(--border-soft)]">125 GEEK</td>
                    <td className="px-3 py-2 border-b border-[var(--border-soft)]">1,250 GEEK</td>
                    <td className="px-3 py-2 border-b border-[var(--border-soft)]">4</td>
                    <td className="px-3 py-2 border-b border-[var(--border-soft)]"><span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-[var(--brand-tertiary)]/10 text-[var(--brand-tertiary)]">Hard</span></td>
                  </tr>
                  <tr className="hover:bg-[var(--flat-cream)] transition">
                    <td className="px-3 py-2 border-b border-[var(--border-soft)] text-[var(--brand-primary)] font-bold">06</td>
                    <td className="px-3 py-2 border-b border-[var(--border-soft)]">750 GEEK</td>
                    <td className="px-3 py-2 border-b border-[var(--border-soft)]">200 GEEK</td>
                    <td className="px-3 py-2 border-b border-[var(--border-soft)]">2,000 GEEK</td>
                    <td className="px-3 py-2 border-b border-[var(--border-soft)]">4</td>
                    <td className="px-3 py-2 border-b border-[var(--border-soft)]"><span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-[var(--brand-tertiary)]/10 text-[var(--brand-tertiary)]">Hard</span></td>
                  </tr>
                  <tr className="hover:bg-[var(--flat-cream)] transition">
                    <td className="px-3 py-2 border-b border-[var(--border-soft)] text-[var(--brand-primary)] font-bold">07</td>
                    <td className="px-3 py-2 border-b border-[var(--border-soft)]">1,250 GEEK</td>
                    <td className="px-3 py-2 border-b border-[var(--border-soft)]">350 GEEK</td>
                    <td className="px-3 py-2 border-b border-[var(--border-soft)]">3,500 GEEK</td>
                    <td className="px-3 py-2 border-b border-[var(--border-soft)]">4</td>
                    <td className="px-3 py-2 border-b border-[var(--border-soft)]"><span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-[var(--brand-tertiary)]/10 text-[var(--brand-tertiary)]">V.Hard</span></td>
                  </tr>
                  <tr className="hover:bg-[var(--flat-cream)] transition">
                    <td className="px-3 py-2 border-b border-[var(--border-soft)] text-[var(--brand-primary)] font-bold">08</td>
                    <td className="px-3 py-2 border-b border-[var(--border-soft)]">2,000 GEEK</td>
                    <td className="px-3 py-2 border-b border-[var(--border-soft)]">500 GEEK</td>
                    <td className="px-3 py-2 border-b border-[var(--border-soft)]">5,000 GEEK</td>
                    <td className="px-3 py-2 border-b border-[var(--border-soft)]">5</td>
                    <td className="px-3 py-2 border-b border-[var(--border-soft)]"><span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-[var(--brand-tertiary)]/10 text-[var(--brand-tertiary)]">V.Hard</span></td>
                  </tr>
                  <tr className="hover:bg-[var(--flat-cream)] transition">
                    <td className="px-3 py-2 border-b border-[var(--border-soft)] text-[var(--brand-primary)] font-bold">09</td>
                    <td className="px-3 py-2 border-b border-[var(--border-soft)]">3,500 GEEK</td>
                    <td className="px-3 py-2 border-b border-[var(--border-soft)]">750 GEEK</td>
                    <td className="px-3 py-2 border-b border-[var(--border-soft)]">7,500 GEEK</td>
                    <td className="px-3 py-2 border-b border-[var(--border-soft)]">5</td>
                    <td className="px-3 py-2 border-b border-[var(--border-soft)]"><span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-[var(--brand-primary-light)]/10 text-[var(--brand-primary-light)]">Expert</span></td>
                  </tr>
                  <tr className="hover:bg-[var(--flat-cream)] transition">
                    <td className="px-3 py-2 text-[var(--brand-primary)] font-bold">10</td>
                    <td className="px-3 py-2">6,000 GEEK</td>
                    <td className="px-3 py-2">1,000 GEEK</td>
                    <td className="px-3 py-2">10,000 GEEK</td>
                    <td className="px-3 py-2">7</td>
                    <td className="px-3 py-2"><span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-[var(--brand-primary-light)]/10 text-[var(--brand-primary-light)]">Expert</span></td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div>
              <div className="flat-card p-6">
                <div className="text-[10px] tracking-widest uppercase text-[var(--text-3)] font-bold mb-4">Reward Curve</div>
                <AnimatedRewardCurve />
              </div>

              <div className="grid grid-cols-1 gap-4 mt-4">
                <div className="flat-card p-6 text-center">
                  <FaClock className="text-[var(--brand-primary)] text-2xl mx-auto mb-3" />
                  <div className="font-bold text-[var(--text-1)]">15-Second Timer</div>
                  <p className="text-[var(--text-2)] text-sm">Speed matters. Time bonus: (15 − TimeTaken) × 10 pts</p>
                </div>
                <div className="flat-card p-6 text-center">
                  <FaLock className="text-[var(--brand-tertiary)] text-2xl mx-auto mb-3" />
                  <div className="font-bold text-[var(--text-1)]">Anti-Cheat System</div>
                  <p className="text-[var(--text-2)] text-sm">Server-side validation · Answer randomization · Session tracking</p>
                </div>
                <div className="flat-card p-6 text-center">
                  <FaChartLine className="text-[var(--brand-primary-light)] text-2xl mx-auto mb-3" />
                  <div className="font-bold text-[var(--text-1)]">XP Calculation</div>
                  <p className="text-[var(--text-2)] text-sm">(Total Correct × 10) + (Total Score ÷ 100)</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CCE */}
      <section className="py-16 px-4 md:px-8 max-w-[1400px] mx-auto">
        <div className="py-4">
          <SectionLabel>Content Engine</SectionLabel>
          <h2 className="font-extrabold text-3xl md:text-4xl text-[var(--text-1)]">Community Content Engine</h2>
          <p className="text-[var(--text-2)] mt-3 text-lg">Create knowledge. Get paid forever.</p>

          <div className="grid md:grid-cols-2 gap-8 mt-10">
            <div>
              <div className="flex flex-col">
                <div className="flex gap-4 py-5 border-b border-[var(--border-soft)]">
                  <div className="w-9 h-9 rounded-xl bg-[var(--flat-cream)] border-2 border-[var(--ink)] flex items-center justify-center text-sm font-bold text-[var(--brand-primary)] flex-shrink-0">01</div>
                  <div>
                    <h3 className="font-bold text-[var(--text-1)]">Level 10+ Unlock</h3>
                    <p className="text-[var(--text-2)] text-sm">Reach Level 10 to submit questions with topics, difficulty, and source verification.</p>
                  </div>
                </div>
                <div className="flex gap-4 py-5 border-b border-[var(--border-soft)]">
                  <div className="w-9 h-9 rounded-xl bg-[var(--flat-cream)] border-2 border-[var(--ink)] flex items-center justify-center text-sm font-bold text-[var(--brand-primary)] flex-shrink-0">02</div>
                  <div>
                    <h3 className="font-bold text-[var(--text-1)]">Peer Review System</h3>
                    <p className="text-[var(--text-2)] text-sm">Level 10+ reviewers vote Approve/Reject. 5 approvals = question accepted. Reviewers earn 1 XP + 0.1 GEEK per review.</p>
                  </div>
                </div>
                <div className="flex gap-4 py-5">
                  <div className="w-9 h-9 rounded-xl bg-[var(--flat-cream)] border-2 border-[var(--ink)] flex items-center justify-center text-sm font-bold text-[var(--brand-primary)] flex-shrink-0">03</div>
                  <div>
                    <h3 className="font-bold text-[var(--text-1)]">Passive Income</h3>
                    <p className="text-[var(--text-2)] text-sm">Earn 0.5 GEEK every time your question is served. Lifetime cap: 1,000 GEEK per question (2,000 serves). Upload unlimited questions.</p>
                  </div>
                </div>
              </div>

              <div className="flat-card p-6 mt-6">
                <div className="text-[10px] tracking-widest uppercase text-[var(--text-3)] font-bold text-center mb-4">The CCE Flywheel</div>
                <div className="flex justify-between items-center flex-wrap gap-2">
                  <span className="flat-badge">More Players</span>
                  <span className="text-[var(--text-3)]">→</span>
                  <span className="flat-badge">More Creators</span>
                  <span className="text-[var(--text-3)]">→</span>
                  <span className="flat-badge">More Questions</span>
                  <span className="text-[var(--text-3)]">→</span>
                  <span className="flat-badge">Better Challengeplay</span>
                </div>
              </div>
            </div>

            <div className="flat-card overflow-hidden">
              <div className="px-4 py-3 bg-[var(--flat-cream)] border-b-2 border-[var(--ink)] font-bold text-xs uppercase tracking-widest text-[var(--brand-primary)]">Reviewer Dashboard</div>
              <div className="p-4 border-b border-[var(--border-soft)]">
                <div className="font-semibold text-[var(--text-1)]">What is the capital of Mars Colony?</div>
                <div className="text-[10px] text-[var(--text-3)] mt-1">Topic: Sci-Fi · Difficulty: Medium</div>
                <div className="flex gap-2 mt-3">
                  <button className="px-3 py-1 text-xs font-semibold rounded-full border-2 border-[var(--ink)] text-[var(--brand-secondary)] hover:bg-[var(--brand-secondary)]/10 transition">✓ Approve</button>
                  <button className="px-3 py-1 text-xs font-semibold rounded-full border-2 border-[var(--ink)] text-[var(--brand-tertiary)] hover:bg-[var(--brand-tertiary)]/10 transition">✗ Reject</button>
                </div>
              </div>
              <div className="p-4 border-b border-[var(--border-soft)]">
                <div className="font-semibold text-[var(--text-1)]">Who invented the Babbage Engine?</div>
                <div className="text-[10px] text-[var(--text-3)] mt-1">Topic: History · Difficulty: Easy</div>
                <div className="flex gap-2 mt-3">
                  <button className="px-3 py-1 text-xs font-semibold rounded-full border-2 border-[var(--ink)] text-[var(--brand-secondary)] hover:bg-[var(--brand-secondary)]/10 transition">✓ Approve</button>
                  <button className="px-3 py-1 text-xs font-semibold rounded-full border-2 border-[var(--ink)] text-[var(--brand-tertiary)] hover:bg-[var(--brand-tertiary)]/10 transition">✗ Reject</button>
                </div>
              </div>
              <div className="px-4 py-3 bg-[var(--flat-cream)] text-center text-xs text-[var(--text-3)] font-semibold">+1 XP &nbsp;·&nbsp; +0.1 GEEK per review</div>
            </div>
          </div>
        </div>
      </section>

      {/* Token */}
      <section className="py-16 px-4 md:px-8 max-w-[1400px] mx-auto">
        <div className="py-4">
          <SectionLabel>KRC-20 Asset</SectionLabel>
          <h2 className="font-extrabold text-3xl md:text-4xl text-[var(--text-1)]">$GEEK Token</h2>
          <p className="text-[var(--text-2)] mt-3 text-lg">The value layer for Proof-of-Learning on Kaspa</p>

          <div className="grid md:grid-cols-2 gap-8 mt-10">
            <div>
              <div className="flat-badge mb-4">Token Specifications</div>
              <div className="flex flex-col divide-y divide-[var(--border-soft)]">
                <div className="flex justify-between py-3"><span className="text-xs text-[var(--text-3)] font-semibold uppercase tracking-wide">Name</span><span className="text-sm text-[var(--text-1)] font-semibold">Geek Protocol</span></div>
                <div className="flex justify-between py-3"><span className="text-xs text-[var(--text-3)] font-semibold uppercase tracking-wide">Ticker</span><span className="text-sm text-[var(--brand-tertiary)] font-semibold">$GEEK</span></div>
                <div className="flex justify-between py-3"><span className="text-xs text-[var(--text-3)] font-semibold uppercase tracking-wide">Blockchain</span><span className="text-sm text-[var(--text-1)] font-semibold">Kaspa (KRC-20)</span></div>
                <div className="flex justify-between py-3"><span className="text-xs text-[var(--text-3)] font-semibold uppercase tracking-wide">Total Supply</span><span className="text-sm text-[var(--text-1)] font-semibold">144,000,000,000 GEEK</span></div>
                <div className="flex justify-between py-3"><span className="text-xs text-[var(--text-3)] font-semibold uppercase tracking-wide">Decimals</span><span className="text-sm text-[var(--text-1)] font-semibold">8</span></div>
                <div className="flex justify-between py-3"><span className="text-xs text-[var(--text-3)] font-semibold uppercase tracking-wide">Mint Rate</span><span className="text-sm text-[var(--text-1)] font-semibold">1 KAS = 100,000 GEEK</span></div>
              </div>
            </div>

            <div>
              <div className="flat-badge mb-4">Token Allocation</div>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm font-semibold"><span>Quiz2Earn Rewards</span><span className="text-[var(--text-3)]">30% (43.2B)</span></div>
                  <div className="h-2 bg-[var(--surface-2)] rounded-full mt-1 overflow-hidden border border-[var(--ink)]"><div className="h-full" style={{ width: '30%', background: 'var(--brand-primary)' }} /></div>
                </div>
                <div>
                  <div className="flex justify-between text-sm font-semibold"><span>Staking Rewards</span><span className="text-[var(--text-3)]">20% (28.8B)</span></div>
                  <div className="h-2 bg-[var(--surface-2)] rounded-full mt-1 overflow-hidden border border-[var(--ink)]"><div className="h-full" style={{ width: '20%', background: 'var(--brand-secondary)' }} /></div>
                </div>
                <div>
                  <div className="flex justify-between text-sm font-semibold"><span>Liquidity Fund</span><span className="text-[var(--text-3)]">20% (28.8B)</span></div>
                  <div className="h-2 bg-[var(--surface-2)] rounded-full mt-1 overflow-hidden border border-[var(--ink)]"><div className="h-full" style={{ width: '20%', background: 'var(--brand-tertiary)' }} /></div>
                </div>
                <div>
                  <div className="flex justify-between text-sm font-semibold"><span>Team & Advisors</span><span className="text-[var(--text-3)]">15% (21.6B)</span></div>
                  <div className="h-2 bg-[var(--surface-2)] rounded-full mt-1 overflow-hidden border border-[var(--ink)]"><div className="h-full" style={{ width: '15%', background: 'var(--brand-accent)' }} /></div>
                </div>
                <div>
                  <div className="flex justify-between text-sm font-semibold"><span>Marketing & Ecosystem</span><span className="text-[var(--text-3)]">15% (21.6B)</span></div>
                  <div className="h-2 bg-[var(--surface-2)] rounded-full mt-1 overflow-hidden border border-[var(--ink)]"><div className="h-full" style={{ width: '15%', background: 'var(--brand-primary-light)' }} /></div>
                </div>
              </div>

              <div className="flat-card p-6 mt-6" style={{ background: 'var(--flat-cream)' }}>
                <div className="text-[10px] tracking-widest uppercase text-[var(--text-3)] font-bold text-center mb-4">70/30 Recycle & Burn Model</div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white rounded-2xl border-2 border-[var(--ink)] text-center py-4">
                    <span className="text-2xl font-extrabold text-[var(--brand-primary)] block">70%</span>
                    <span className="text-sm text-[var(--text-2)]">Back to Rewards</span>
                  </div>
                  <div className="bg-white rounded-2xl border-2 border-[var(--ink)] text-center py-4">
                    <span className="text-2xl font-extrabold text-[var(--brand-tertiary)] block">30%</span>
                    <span className="text-sm text-[var(--text-2)]">Permanently Burned</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
            <div className="flat-card p-6 text-center hover:-translate-y-1 transition">
              <FaTrophy className="text-[var(--brand-accent)] text-2xl mx-auto mb-3" />
              <div className="font-bold text-[var(--text-1)]">Earn</div>
              <div className="text-sm text-[var(--text-2)]">Quiz rewards</div>
            </div>
            <div className="flat-card p-6 text-center hover:-translate-y-1 transition">
              <FaCoins className="text-[var(--brand-tertiary)] text-2xl mx-auto mb-3" />
              <div className="font-bold text-[var(--text-1)]">Spend</div>
              <div className="text-sm text-[var(--text-2)]">Shop & lifelines</div>
            </div>
            <div className="flat-card p-6 text-center hover:-translate-y-1 transition">
              <FaChartLine className="text-[var(--brand-primary)] text-2xl mx-auto mb-3" />
              <div className="font-bold text-[var(--text-1)]">Trade</div>
              <div className="text-sm text-[var(--text-2)]">Marketplace</div>
            </div>
            <div className="flat-card p-6 text-center hover:-translate-y-1 transition">
              <FaLock className="text-[var(--brand-primary-light)] text-2xl mx-auto mb-3" />
              <div className="font-bold text-[var(--text-1)]">Stake</div>
              <div className="text-sm text-[var(--text-2)]">Yield + boosts</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4 md:px-8 max-w-[1400px] mx-auto">
        <div className="text-center mb-16">
          <h2 className="font-extrabold text-4xl md:text-5xl text-[var(--text-1)]">Core Systems</h2>
          <p className="text-[var(--text-2)] text-lg mt-3">Built for signal. Designed for scale.</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((feature, idx) => (
            <ScrollReveal key={idx} delay={(idx % 3) * 90} variant={idx % 2 === 0 ? 'fade-left' : 'fade-right'}>
              <TiltCard>
                <div className="flat-card p-8 h-full">
                  <div className="text-5xl mb-6 text-[var(--brand-primary)]">
                    <feature.icon />
                  </div>
                  <h3 className="text-2xl font-bold text-[var(--text-1)] mb-3">{feature.title}</h3>
                  <p className="text-[var(--text-2)] text-base mb-6 leading-relaxed">{feature.description}</p>
                  <ul className="space-y-2">
                    {feature.details.map((detail, didx) => (
                      <li key={didx} className="flex items-start gap-2 text-xs text-[var(--text-2)]">
                        <span className="text-[var(--brand-primary)] font-bold mt-1">•</span>
                        <span>{detail}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </TiltCard>
            </ScrollReveal>
          ))}
        </div>
      </section>

      {/* Impact */}
      <section className="py-20 px-4 md:px-8 max-w-[1400px] mx-auto">
        <div className="text-center mb-16">
          <h2 className="font-extrabold text-4xl md:text-5xl text-[var(--text-1)]">How Geek Protocol Changes Your Life</h2>
          <p className="text-[var(--text-2)] text-lg mt-3">Real impact. Measurable rewards. Lasting change.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {IMPACT_ITEMS.map((item, idx) => {
            const accent = ACCENT_COLORS[item.accent] ?? 'var(--brand-primary)';
            return (
              <ScrollReveal key={idx} delay={(idx % 2) * 120} variant={idx % 2 === 0 ? 'fade-left' : 'fade-right'}>
                <div className="flat-card p-8">
                  <div className="text-5xl mb-4" style={{ color: accent }}>
                    <item.icon />
                  </div>
                  <h3 className="text-2xl font-bold text-[var(--text-1)] mb-4">{item.title}</h3>
                  <p className="text-[var(--text-2)] leading-relaxed mb-4">{item.description}</p>
                  <ul className="space-y-3 text-[var(--text-2)]">
                    {item.points.map((point, pidx) => (
                      <li key={pidx} className="flex gap-3">
                        <span style={{ color: accent }}>✦</span>
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </ScrollReveal>
            );
          })}
        </div>
      </section>

      {/* Categories */}
      <section className="py-20 px-4 md:px-8 max-w-[1400px] mx-auto">
        <div className="text-center mb-16">
          <h2 className="font-extrabold text-4xl md:text-5xl text-[var(--text-1)]">8 Categories of Knowledge</h2>
          <p className="text-[var(--text-2)] text-lg mt-3">Master multiple domains. Earn across disciplines.</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {CATEGORIES.map((category, idx) => (
            <ScrollReveal key={idx} delay={(idx % 4) * 80} variant="rotate">
              <div className="flat-card group p-6 text-center hover:-translate-y-1 hover:rotate-2 transition duration-300">
                <div className="text-4xl md:text-5xl mb-3 text-[var(--brand-secondary)] group-hover:scale-110 transition duration-300">
                  <category.icon />
                </div>
                <p className="text-[var(--text-1)] font-bold">{category.name}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </section>

      {/* Roadmap */}
      <section className="py-20 px-4 md:px-8 max-w-[1400px] mx-auto">
        <div className="text-center mb-16">
          <h2 className="font-extrabold text-4xl md:text-5xl text-[var(--text-1)]">The Ecosystem Arc</h2>
          <p className="text-[var(--text-2)] text-lg mt-3">In-world history you&rsquo;re living. Built on hope, not hype.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {ROADMAP.map((item, ridx) => {
            const accent = ACCENT_COLORS[item.accent] ?? 'var(--brand-primary)';
            return (
              <ScrollReveal key={item.year} delay={ridx * 130} variant="fade-up">
                <div className="flat-card p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-full text-white flex items-center justify-center font-bold border-2 border-[var(--ink)]" style={{ background: accent }}>{item.year}</div>
                    <div>
                      <h3 className="text-2xl font-bold text-[var(--text-1)]">{item.title}</h3>
                      <p className="text-sm text-[var(--text-2)]">{item.subtitle}</p>
                    </div>
                  </div>
                  <ul className="space-y-3 text-[var(--text-2)] text-sm">
                    {item.items.map((sub, idx) => (
                      <li key={idx} className="flex gap-2">
                        <span style={{ color: accent, opacity: sub.status === 'done' ? 1 : 0.6 }}>
                          {sub.status === 'done' ? '✓' : '→'}
                        </span>
                        {sub.text}
                      </li>
                    ))}
                  </ul>
                </div>
              </ScrollReveal>
            );
          })}
        </div>
      </section>

      {/* Why Kaspa */}
      <section className="py-20 px-4 md:px-8 max-w-[1400px] mx-auto">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="font-extrabold text-4xl md:text-5xl text-[var(--brand-primary)] mb-8">Why Kaspa</h2>
          <p className="text-lg md:text-xl text-[var(--text-2)] leading-relaxed mb-10">
            Kaspa isn&rsquo;t the loudest blockchain. It&rsquo;s the fastest. Sub-second blocks without sacrificing decentralization or security.
            <br /><br />
            While others promise, Kaspa delivers. Which is exactly what we needed for a protocol that handles real rewards, real payouts, real stakes.
            <br /><br />
            <span className="text-[var(--brand-secondary)] font-semibold">Geek Protocol exists because Kaspa made it possible.</span>
          </p>

          <div className="grid md:grid-cols-3 gap-4 mt-8">
            <div className="flat-card p-6">
              <FaBolt className="text-4xl mx-auto mb-3 text-[var(--brand-secondary)]" />
              <h3 className="text-[var(--text-1)] font-bold mb-2">Sub-Second Blocks</h3>
              <p className="text-sm text-[var(--text-2)]">Finality in milliseconds, not minutes.</p>
            </div>
            <div className="flat-card p-6">
              <FaLock className="text-4xl mx-auto mb-3 text-[var(--brand-primary)]" />
              <h3 className="text-[var(--text-1)] font-bold mb-2">Secure & Decentralized</h3>
              <p className="text-sm text-[var(--text-2)]">No compromises on the fundamentals.</p>
            </div>
            <div className="flat-card p-6">
              <FaCoins className="text-4xl mx-auto mb-3 text-[var(--brand-secondary)]" />
              <h3 className="text-[var(--text-1)] font-bold mb-2">Affordable Fees</h3>
              <p className="text-sm text-[var(--text-2)]">Rewards aren&rsquo;t swallowed by gas costs.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Resources */}
      <section className="py-20 px-4 md:px-8 max-w-[1400px] mx-auto">
        <div className="text-center mb-16">
          <h2 className="font-extrabold text-4xl md:text-5xl text-[var(--text-1)]">Resources & Links</h2>
          <p className="text-[var(--text-2)] text-lg mt-3">Everything you need to understand and join Geek Protocol</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {RESOURCES.map((resource, idx) => (
            <ScrollReveal key={idx} delay={(idx % 3) * 90} variant="scale">
              <a
                href={resource.href}
                target={resource.external ? "_blank" : undefined}
                rel={resource.external ? "noopener noreferrer" : undefined}
                className={`flat-card group p-8 transition duration-300 hover:-translate-y-1 block h-full ${
                  resource.featured ? 'ring-4 ring-[var(--brand-accent)]' : ''
                }`}
              >
                <div className="flex items-start justify-between mb-6">
                  <div className="text-5xl text-[var(--brand-primary)] group-hover:scale-110 transition duration-300">
                    <resource.icon />
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-full border-2 border-[var(--ink)] ${
                    resource.status === "Live" ? "bg-[var(--brand-secondary)]/15 text-[var(--brand-secondary)]" :
                    resource.status === "Alpha" ? "bg-[var(--brand-primary)]/15 text-[var(--brand-primary)]" :
                    "bg-[var(--surface-2)] text-[var(--text-3)]"
                  }`}>
                    {resource.status}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-[var(--text-1)] mb-2">{resource.title}</h3>
                <p className="text-[var(--text-2)] text-sm">{resource.description}</p>
                {resource.external && (
                  <div className="mt-4 flex items-center gap-2 text-[var(--brand-primary)] text-sm font-semibold">
                    <span>Open External</span>
                    <FaExternalLinkAlt className="text-xs" />
                  </div>
                )}
              </a>
            </ScrollReveal>
          ))}
        </div>
      </section>

      {/* Coming Soon */}
      <section className="py-20 px-4 md:px-8 max-w-[1400px] mx-auto">
        <div className="text-center mb-16">
          <h2 className="font-extrabold text-4xl md:text-5xl text-[var(--text-1)]">Coming Soon</h2>
          <p className="text-[var(--text-2)] text-lg mt-3">All features launching in Q1 2026</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 opacity-90">
          {COMING_SOON.map((item, idx) => (
            <ScrollReveal key={idx} delay={(idx % 3) * 90} variant="fade-up">
              <div className="flat-card p-8">
                <div className="text-5xl mb-4 text-[var(--text-3)]">
                  <item.icon />
                </div>
                <h3 className="text-2xl font-bold text-[var(--text-1)] mb-2">{item.title}</h3>
                <p className="text-[var(--text-2)] mb-4">{item.description}</p>
                <span className="flat-badge">Coming Soon</span>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 md:px-8 max-w-[1400px] mx-auto">
        <ScrollReveal variant="scale">
        <div className="flat-card rounded-[32px] p-8 md:p-16 text-center" style={{ background: 'var(--brand-primary)' }}>
          <div className="flat-badge mb-6" style={{ background: '#fff' }}>Mission Briefing</div>
          <h2 className="font-extrabold text-4xl md:text-5xl text-white">Join the Mission</h2>
          <p className="text-white/85 text-lg italic my-4">All Hope. No Hype. Level Up. Earn On. Geek Out.</p>

          <div className="flex flex-wrap justify-center gap-4 mt-8">
            <MagneticLink href="/auth/register" className="flat-btn flat-btn-accent px-10 py-4 text-base">
              Join Now
            </MagneticLink>
            <MagneticLink href="/auth/login" className="flat-btn px-10 py-4 text-base">
              Sign In
            </MagneticLink>
          </div>

          <div className="flex justify-center gap-4 mt-10">
            <a href="https://x.com/geekonkas" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white border-2 border-[var(--ink)] flex items-center justify-center text-[var(--ink)] hover:-translate-y-0.5 transition">
              <FaTwitter />
            </a>
            <a href="https://t.me/GEEKonKAScommunity" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white border-2 border-[var(--ink)] flex items-center justify-center text-[var(--ink)] hover:-translate-y-0.5 transition">
              <FaTelegram />
            </a>
            <a href="#" className="w-10 h-10 rounded-full bg-white border-2 border-[var(--ink)] flex items-center justify-center text-[var(--ink)] hover:-translate-y-0.5 transition">
              <FaLink />
            </a>
          </div>
        </div>
        </ScrollReveal>
      </section>

      <Footer />
    </div>
  );
}
