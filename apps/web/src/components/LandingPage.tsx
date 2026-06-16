"use client";
import React, { useState, useEffect, useRef } from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
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
import { SiKaspa as _SiKaspa } from 'react-icons/si';
const SiKaspa = FaGlobe; // SiKaspa not available in this react-icons version

const FLOW_STEPS = [
  {
    number: "1",
    title: "Connect Wallet",
    description: "Link your Kaspa wallet with one click. No passwords, no security risks.",
    icon: FaWallet
  },
  {
    number: "2",
    title: "Enter The Gauntlet",
    description: "Face 10 rapid-fire questions across any category. 15 seconds per question.",
    icon: FaGamepad
  },
  {
    number: "3",
    title: "Prove Your Knowledge",
    description: "Answer correctly. Beat the clock. Show the world your expertise.",
    icon: FaBrain
  },
  {
    number: "4",
    title: "Earn $GEEK",
    description: "Get rewarded instantly. Sub-6 second settlement. No waiting, no intermediaries.",
    icon: FaCoins
  },
  {
    number: "5",
    title: "Climb Leaderboards",
    description: "Build your XP, maintain winning streaks, and compete globally.",
    icon: FaTrophy
  },
  {
    number: "6",
    title: "Build Reputation",
    description: "Your on-chain achievements are permanent. Portable. Verifiable.",
    icon: FaStar
  }
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


const PCBBackground = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let W, H, nodes = [], edges = [], pulses = [];
    const CELL = 80;

    const resize = () => {
      W = canvas.width = window.innerWidth;
      H = canvas.height = window.innerHeight;
    };

    const genNodes = () => {
      nodes = [];
      const cols = Math.ceil(W/CELL) + 2;
      const rows = Math.ceil(H/CELL) + 2;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          nodes.push({
            x: c*CELL + (Math.random() - 0.5) * CELL * 0.35,
            y: r*CELL + (Math.random() - 0.5) * CELL * 0.35,
            pad: Math.random() < 0.28,
            via: Math.random() < 0.1,
            ic: Math.random() < 0.035
          });
        }
      }
    };

    const genEdges = () => {
      edges = [];
      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i];
        let nbrs = [];
        for (let j = i+1; j < nodes.length; j++) {
          const b = nodes[j];
          const d = Math.hypot(b.x - a.x, b.y - a.y);
          if (d < CELL * 1.55) nbrs.push({j, d});
        }
        nbrs.sort((x, y) => x.d - y.d);
        const cnt = 1 + Math.floor(Math.random() * 2);
        for (let k = 0; k < Math.min(cnt, nbrs.length); k++) {
          if (Math.random() < 0.5) edges.push([i, nbrs[k].j, Math.random() < 0.5]);
        }
      }
    };

    const initPulses = () => {
      pulses = [];
      for (let i = 0; i < 22; i++) addPulse();
    };

    const addPulse = () => {
      if (!edges.length) return;
      pulses.push({
        edge: edges[Math.floor(Math.random() * edges.length)],
        t: Math.random(),
        speed: 0.0012 + Math.random() * 0.003,
        color: Math.random() < 0.5 ? '#cc44ff' : '#b87333',
        size: 2 + Math.random() * 2
      });
    };

    const drawStatic = () => {
      ctx.strokeStyle = '#2a1a3a';
      ctx.lineWidth = 1.5;
      for (const [i, j, horiz] of edges) {
        const a = nodes[i], b = nodes[j];
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        if (horiz) {
          ctx.lineTo(b.x, a.y);
          ctx.lineTo(b.x, b.y);
        } else {
          ctx.lineTo(a.x, b.y);
          ctx.lineTo(b.x, b.y);
        }
        ctx.stroke();
      }

      for (const n of nodes) {
        if (n.ic) {
          const w = 38 + Math.random() * 28;
          const h = 24 + Math.random() * 18;
          ctx.fillStyle = '#0e140e';
          ctx.fillRect(n.x - w/2, n.y - h/2, w, h);
          ctx.strokeStyle = '#1e2e1e';
          ctx.lineWidth = 1;
          ctx.strokeRect(n.x - w/2, n.y - h/2, w, h);
          const pins = Math.floor(w / 7);
          ctx.fillStyle = '#b87333';
          for (let p = 0; p < pins; p++) {
            const px = n.x - w/2 + 4 + p * (w / pins);
            ctx.fillRect(px - 1.5, n.y - h/2 - 3, 3, 3);
            ctx.fillRect(px - 1.5, n.y + h/2, 3, 3);
          }
        } else if (n.via) {
          ctx.beginPath();
          ctx.arc(n.x, n.y, 4, 0, Math.PI * 2);
          ctx.fillStyle = '#2a1a3a';
          ctx.fill();
          ctx.strokeStyle = '#c0c0a0';
          ctx.lineWidth = 1;
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(n.x, n.y, 1.5, 0, Math.PI * 2);
          ctx.fillStyle = '#060c06';
          ctx.fill();
        } else if (n.pad) {
          ctx.beginPath();
          ctx.arc(n.x, n.y, 5, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(212,192,96,0.3)';
          ctx.fill();
        }
      }
    };

    const drawPulses = () => {
      for (const p of pulses) {
        const [i, j, horiz] = p.edge;
        if (!nodes[i] || !nodes[j]) continue;
        const a = nodes[i], b = nodes[j];
        let x, y;
        if (p.t < 0.5) {
          const tt = p.t / 0.5;
          x = a.x + (b.x - a.x) * tt;
          y = a.y;
        } else {
          const tt = (p.t - 0.5) / 0.5;
          x = b.x;
          y = a.y + (b.y - a.y) * tt;
        }
        const g = ctx.createRadialGradient(x, y, 0, x, y, p.size * 3.5);
        g.addColorStop(0, p.color);
        g.addColorStop(1, 'transparent');
        ctx.beginPath();
        ctx.arc(x, y, p.size * 3.5, 0, Math.PI * 2);
        ctx.fillStyle = g;
        ctx.globalAlpha = 0.55;
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.beginPath();
        ctx.arc(x, y, p.size * 0.65, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();
        p.t += p.speed;
        if (p.t > 1) {
          p.t = 0;
          p.edge = edges[Math.floor(Math.random() * edges.length)] || p.edge;
          p.color = Math.random() < 0.5 ? '#cc44ff' : '#b87333';
        }
      }
    };

    const frame = () => {
      ctx.clearRect(0, 0, W, H);
      drawStatic();
      drawPulses();
      requestAnimationFrame(frame);
    };

    resize();
    genNodes();
    genEdges();
    initPulses();
    frame();

    window.addEventListener('resize', () => {
      resize();
      genNodes();
      genEdges();
      initPulses();
    });

    return () => {
      window.removeEventListener('resize', resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="fixed top-0 left-0 w-full h-full pointer-events-none opacity-50 z-0" />;
};

const Scanlines = () => {
  return (
    <div className="fixed top-0 left-0 w-full h-full pointer-events-none z-[1] bg-repeat-y" 
         style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.18) 2px, rgba(0,0,0,0.18) 4px)' }} />
  );
};


const PCBDivider = () => {
  return (
    <div className="w-full h-[2px] bg-[#2a1a3a] relative overflow-hidden">
      <div className="absolute left-0 top-0 h-full w-0 bg-[#b87333] animate-[traceFlow_3s_ease-in-out_infinite]" />
      <style>{`
        @keyframes traceFlow {
          0% { width: 0; opacity: 1; }
          80% { width: 100%; opacity: 1; }
          100% { width: 100%; opacity: 0; }
        }
      `}</style>
    </div>
  );
};

const SectionLabel = ({ children }) => {
  return (
    <div className="flex items-center gap-3 font-mono text-xs tracking-widest text-[#b87333] mb-5">
      <span className="w-6 h-px bg-[#b87333]"></span>
      {children}
      <span className="w-6 h-px bg-[#b87333]"></span>
    </div>
  );
};

const ScrollReveal = ({ children, delay = 0, className = '' }) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.12 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, []);

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      } ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
};

export default function LandingPage() {
  const [user, setUser] = useState(null);


  return (
    <div className="min-h-screen bg-[#0a0e0a] text-[#d8c8ff] font-sans overflow-x-hidden">
      <PCBBackground />
      <Scanlines />
      <Navbar />

      <div className="relative z-10">
        {/* Hero */}
        <section className="min-h-[95vh] grid md:grid-cols-2 gap-8 items-center px-4 md:px-8 py-12 max-w-[1400px] mx-auto">
          <div className="flex flex-col gap-6">
            <div className="flex items-center gap-2 border border-[#b87333] px-3 py-1.5 w-fit font-mono text-xs text-[#b87333] relative overflow-hidden">
              <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-pulse"></span>
              LIVE ON KASPA · KRC-20 NATIVE
              <div className="absolute top-0 left-[-100%] w-full h-full bg-[#b87333]/10 animate-[badgeSweep_3s_ease-in-out_infinite]" />
            </div>

            <div className="font-bebas tracking-widest font-bold text-4xl sm:text-5xl md:text-6xl lg:text-7xl leading-[1.05]">
              <div className="overflow-hidden">
                <span className="block animate-[revealUp_0.9s_cubic-bezier(0.16,1,0.3,1)_both]">PROOF-OF-</span>
              </div>
              <div className="overflow-hidden">
                <span className="block text-purple-400 animate-[revealUp_0.9s_cubic-bezier(0.16,1,0.3,1)_both] [animation-delay:120ms]">LEARNING</span>
              </div>
              <div className="overflow-hidden">
                <span className="block text-2xl sm:text-3xl text-pink-600 animate-[revealUp_0.9s_cubic-bezier(0.16,1,0.3,1)_both] [animation-delay:240ms]">ON KASPA</span>
              </div>
            </div>

            <p className="text-lg text-white/80 max-w-[520px] font-light">
              The first decentralized <strong className="text-cyan-400 font-semibold">Quiz2Earn ecosystem</strong> where knowledge is proven through performance, not claims. Earn <strong className="text-pink-500 font-semibold">$GEEK tokens</strong> by demonstrating your expertise.
            </p>

            <div className="flex flex-wrap gap-2">
              <span className="font-mono text-[10px] tracking-wider px-2 py-1 border border-[#2a1a3a] text-white/40">ALL HOPE. NO HYPE.</span>
              <span className="font-mono text-[10px] tracking-wider px-2 py-1 border border-[#2a1a3a] text-white/40">KRC-20</span>
              <span className="font-mono text-[10px] tracking-wider px-2 py-1 border border-[#2a1a3a] text-white/40">QUIZ2EARN</span>
              <span className="font-mono text-[10px] tracking-wider px-2 py-1 border border-[#2a1a3a] text-white/40">PROOF-OF-LEARNING</span>
            </div>

            <div className="flex flex-wrap gap-3">
              <a href="/auth/register" className="bg-pink-600 hover:bg-pink-700 text-white px-8 py-3 font-bebas tracking-widest font-bold text-xs tracking-wider relative overflow-hidden transition-shadow hover:shadow-[0_0_24px_rgba(255,45,120,0.5)] group">
                <span className="relative z-10">Get Started</span>
                <div className="absolute inset-0 bg-cyan-400 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
              </a>
              <a href="/auth/login" className="border border-cyan-400 text-cyan-400 px-8 py-3 font-bebas tracking-widest font-bold text-xs tracking-wider hover:bg-cyan-400/10 transition">
                Sign In
              </a>
            </div>
          </div>

          <ScrollReveal delay={100}>
            <div className="relative">
              <div className="border border-[#2a1a3a] bg-[#0d120d] p-6 relative">
                <div className="absolute top-[-1px] left-[-1px] w-5 h-5 border-t-2 border-l-2 border-[#b87333]"></div>
                <div className="absolute top-[-1px] right-[-1px] w-5 h-5 border-t-2 border-r-2 border-[#b87333]"></div>
                <div className="absolute bottom-[-1px] right-[-1px] w-5 h-5 border-b-2 border-r-2 border-[#b87333]"></div>
                <div className="absolute bottom-[-1px] left-[-1px] w-5 h-5 border-b-2 border-l-2 border-[#b87333]"></div>

                <div className="absolute top-[-14px] right-5 font-mono text-xs px-3 py-1 border bg-pink-600 border-pink-600 text-white font-bold animate-[float_3s_ease-in-out_infinite]">
                  LIVE ON KASPA
                </div>
                <div className="absolute bottom-[-14px] left-5 font-mono text-xs px-3 py-1 border bg-cyan-400 border-cyan-400 text-[#0a0e0a] font-bold animate-[float_3s_ease-in-out_infinite] [animation-delay:0.5s]">
                  KRC-20
                </div>

                <div className="flex justify-between items-center mb-4 pb-4 border-b border-[#2a1a3a]">
                  <span className="font-mono text-xs text-white/40">// SYS_PANEL_001 · GEEK_PROTOCOL</span>
                  <span className="flex items-center gap-1.5 font-mono text-xs text-purple-400">
                    <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-[blink_1.2s_ease-in-out_infinite]"></span>
                    ONLINE
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-px bg-[#2a1a3a]">
                  <div className="bg-[#0a0e0a] p-4 text-center relative overflow-hidden group">
                    <span className="font-mono text-xl block text-pink-500">144B</span>
                    <span className="font-mono text-[10px] tracking-widest text-white/40 uppercase">Total Supply</span>
                    <div className="absolute bottom-0 left-0 h-[2px] w-0 bg-[#b87333] group-hover:w-full transition-all duration-400" />
                  </div>
                  <div className="bg-[#0a0e0a] p-4 text-center relative overflow-hidden group">
                    <span className="font-mono text-xl block text-cyan-400">30%</span>
                    <span className="font-mono text-[10px] tracking-widest text-white/40 uppercase">Quiz Rewards</span>
                    <div className="absolute bottom-0 left-0 h-[2px] w-0 bg-[#b87333] group-hover:w-full transition-all duration-400" />
                  </div>
                  <div className="bg-[#0a0e0a] p-4 text-center relative overflow-hidden group">
                    <span className="font-mono text-xl block text-purple-400">10</span>
                    <span className="font-mono text-[10px] tracking-widest text-white/40 uppercase">Gauntlet Rounds</span>
                    <div className="absolute bottom-0 left-0 h-[2px] w-0 bg-[#b87333] group-hover:w-full transition-all duration-400" />
                  </div>
                  <div className="bg-[#0a0e0a] p-4 text-center relative overflow-hidden group">
                    <span className="font-mono text-xl block text-amber-400">1KAS</span>
                    <span className="font-mono text-[10px] tracking-widest text-white/40 uppercase">= 100K GEEK</span>
                    <div className="absolute bottom-0 left-0 h-[2px] w-0 bg-[#b87333] group-hover:w-full transition-all duration-400" />
                  </div>
                </div>

                <div className="flex flex-col divide-y divide-[#2a1a3a] bg-[#2a1a3a] mt-px">
                  <div className="bg-[#0a0e0a] flex justify-between items-center px-4 py-3">
                    <span className="font-semibold text-white/80">Round 10 Max Earnings</span>
                    <span className="font-mono text-pink-500">10,000 GEEK</span>
                  </div>
                  <div className="bg-[#0a0e0a] flex justify-between items-center px-4 py-3">
                    <span className="font-semibold text-white/80">Creator Earnings</span>
                    <span className="font-mono text-cyan-400">0.5 GEEK / Q</span>
                  </div>
                  <div className="bg-[#0a0e0a] flex justify-between items-center px-4 py-3">
                    <span className="font-semibold text-white/80">Lifetime Cap / Question</span>
                    <span className="font-mono text-purple-400">1,000 GEEK</span>
                  </div>
                </div>

                <div className="mt-px bg-[#0a0e0a] p-4 border-t border-[#2a1a3a]">
                  <div className="font-mono text-[10px] tracking-widest text-white/40 mb-3">// YOUR_PROGRESS</div>
                  <div className="grid grid-cols-4 gap-px bg-[#2a1a3a]">
                    <div className="bg-[#0d120d] text-center py-2.5 px-1">
                      <span className="font-mono text-base block text-pink-500">1</span>
                      <span className="font-mono text-[9px] tracking-widest text-white/40 uppercase">Level</span>
                    </div>
                    <div className="bg-[#0d120d] text-center py-2.5 px-1">
                      <span className="font-mono text-base block text-cyan-400">0</span>
                      <span className="font-mono text-[9px] tracking-widest text-white/40 uppercase">XP</span>
                    </div>
                    <div className="bg-[#0d120d] text-center py-2.5 px-1">
                      <span className="font-mono text-base block text-amber-400">0</span>
                      <span className="font-mono text-[9px] tracking-widest text-white/40 uppercase">Streak</span>
                    </div>
                    <div className="bg-[#0d120d] text-center py-2.5 px-1">
                      <span className="font-mono text-base block text-purple-400">0.00</span>
                      <span className="font-mono text-[9px] tracking-widest text-white/40 uppercase">GEEK</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </section>

        <PCBDivider />

        {/* Characters */}
        <section className="py-16 px-4 md:px-8 max-w-[1400px] mx-auto border-t border-[#2a1a3a]">
          <div className="py-12">
            <SectionLabel>PROTOCOL_ENTITIES</SectionLabel>
            <h2 className="font-bebas tracking-widest font-bold text-3xl md:text-4xl text-white/90">MEET THE PROTOCOL</h2>
            <p className="text-white/60 mt-3 text-lg">Two entities, one mission: verify knowledge, reward expertise</p>

            <div className="grid md:grid-cols-2 gap-px bg-[#2a1a3a] mt-10">
              <div className="bg-[#0d120d] p-8 md:p-10 flex flex-col md:flex-row gap-6 hover:bg-[#111811] transition relative overflow-hidden group">
                <div className="absolute bottom-0 left-0 h-[2px] w-0 bg-amber-400 group-hover:w-full transition-all duration-400" />
                <div className="w-24 h-24 border border-[#2a1a3a] flex-shrink-0 overflow-hidden relative">
                  <div className="w-full h-full bg-gradient-to-br from-amber-400/20 to-amber-400/5 flex items-center justify-center text-4xl">🤖</div>
                  <div className="absolute inset-0 border-2 border-transparent group-hover:border-amber-400/50 transition-all duration-300" />
                </div>
                <div>
                  <div className="font-bebas tracking-widest font-bold text-xl text-amber-400">GIGA</div>
                  <div className="font-mono text-xs text-[#b87333] tracking-widest">// THE COMMUNITY MASCOT</div>
                  <p className="text-white/60 text-sm mt-3">The friendly, golden face of Geek Protocol. GIGA represents our community culture, announces events, and builds brand identity across the ecosystem.</p>
                  <div className="flex gap-2 mt-4">
                    <span className="font-mono text-[10px] tracking-wider px-2 py-0.5 border border-[#2a1a3a] text-white/40">#Community</span>
                    <span className="font-mono text-[10px] tracking-wider px-2 py-0.5 border border-[#2a1a3a] text-white/40">#Mascot</span>
                  </div>
                </div>
              </div>

              <div className="bg-[#0d120d] p-8 md:p-10 flex flex-col md:flex-row gap-6 hover:bg-[#111811] transition relative overflow-hidden group">
                <div className="absolute bottom-0 left-0 h-[2px] w-0 bg-cyan-400 group-hover:w-full transition-all duration-400" />
                <div className="w-24 h-24 border border-[#2a1a3a] flex-shrink-0 overflow-hidden relative">
                  <div className="w-full h-full bg-gradient-to-br from-cyan-400/20 to-cyan-400/5 flex items-center justify-center text-4xl">🧠</div>
                  <div className="absolute inset-0 border-2 border-transparent group-hover:border-cyan-400/50 transition-all duration-300" />
                </div>
                <div>
                  <div className="font-bebas tracking-widest font-bold text-xl text-cyan-400">A.C.E.</div>
                  <div className="font-mono text-xs text-pink-500 tracking-widest">// AUTOMATED CEREBRAL EMULATOR</div>
                  <p className="text-white/60 text-sm mt-3">The AI Quizmaster and challenge host. A.C.E. presents challenges, guides players through the Gauntlet, and tracks Proof-of-Learning on-chain.</p>
                  <div className="flex gap-2 mt-4">
                    <span className="font-mono text-[10px] tracking-wider px-2 py-0.5 border border-[#2a1a3a] text-white/40">#Quizmaster</span>
                    <span className="font-mono text-[10px] tracking-wider px-2 py-0.5 border border-[#2a1a3a] text-white/40">#AI</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <PCBDivider />

        {/* Gauntlet */}
        <section className="py-16 px-4 md:px-8 max-w-[1400px] mx-auto border-t border-[#2a1a3a]">
          <div className="py-12">
            <SectionLabel>CHALLENGE_MODULE_001</SectionLabel>
            <h2 className="font-bebas tracking-widest font-bold text-3xl md:text-4xl text-white/90">THE GEEK GAUNTLET</h2>
            <p className="text-white/60 mt-3 text-lg">10 rounds · Increasing difficulty · Real rewards</p>

            <div className="grid md:grid-cols-2 gap-8 mt-10">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse font-mono text-sm">
                  <thead>
                    <tr>
                      <th className="text-left px-3 py-2 text-[#b87333] text-[10px] tracking-widest border-b border-[#b87333] bg-[#0d120d]">RND</th>
                      <th className="text-left px-3 py-2 text-[#b87333] text-[10px] tracking-widest border-b border-[#b87333] bg-[#0d120d]">ENTRY</th>
                      <th className="text-left px-3 py-2 text-[#b87333] text-[10px] tracking-widest border-b border-[#b87333] bg-[#0d120d]">REWARD/Q</th>
                      <th className="text-left px-3 py-2 text-[#b87333] text-[10px] tracking-widest border-b border-[#b87333] bg-[#0d120d]">MAX EARN</th>
                      <th className="text-left px-3 py-2 text-[#b87333] text-[10px] tracking-widest border-b border-[#b87333] bg-[#0d120d]">B/E</th>
                      <th className="text-left px-3 py-2 text-[#b87333] text-[10px] tracking-widest border-b border-[#b87333] bg-[#0d120d]">DIFF</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="hover:bg-[#111811] transition">
                      <td className="px-3 py-2 border-b border-[#2a1a3a] text-purple-400 font-bold">01</td>
                      <td className="px-3 py-2 border-b border-[#2a1a3a]">Free</td>
                      <td className="px-3 py-2 border-b border-[#2a1a3a]">10 GEEK</td>
                      <td className="px-3 py-2 border-b border-[#2a1a3a]">100 GEEK</td>
                      <td className="px-3 py-2 border-b border-[#2a1a3a]">0</td>
                      <td className="px-3 py-2 border-b border-[#2a1a3a]"><span className="text-[10px] px-1.5 py-0.5 border border-purple-400 text-purple-400 bg-purple-400/10">Easy</span></td>
                    </tr>
                    <tr className="hover:bg-[#111811] transition">
                      <td className="px-3 py-2 border-b border-[#2a1a3a] text-purple-400 font-bold">02</td>
                      <td className="px-3 py-2 border-b border-[#2a1a3a]">40 GEEK</td>
                      <td className="px-3 py-2 border-b border-[#2a1a3a]">20 GEEK</td>
                      <td className="px-3 py-2 border-b border-[#2a1a3a]">200 GEEK</td>
                      <td className="px-3 py-2 border-b border-[#2a1a3a]">2</td>
                      <td className="px-3 py-2 border-b border-[#2a1a3a]"><span className="text-[10px] px-1.5 py-0.5 border border-purple-400 text-purple-400 bg-purple-400/10">Easy+</span></td>
                    </tr>
                    <tr className="hover:bg-[#111811] transition">
                      <td className="px-3 py-2 border-b border-[#2a1a3a] text-purple-400 font-bold">03</td>
                      <td className="px-3 py-2 border-b border-[#2a1a3a]">100 GEEK</td>
                      <td className="px-3 py-2 border-b border-[#2a1a3a]">40 GEEK</td>
                      <td className="px-3 py-2 border-b border-[#2a1a3a]">400 GEEK</td>
                      <td className="px-3 py-2 border-b border-[#2a1a3a]">3</td>
                      <td className="px-3 py-2 border-b border-[#2a1a3a]"><span className="text-[10px] px-1.5 py-0.5 border border-amber-400 text-amber-400 bg-amber-400/10">Medium</span></td>
                    </tr>
                    <tr className="hover:bg-[#111811] transition">
                      <td className="px-3 py-2 border-b border-[#2a1a3a] text-purple-400 font-bold">04</td>
                      <td className="px-3 py-2 border-b border-[#2a1a3a]">200 GEEK</td>
                      <td className="px-3 py-2 border-b border-[#2a1a3a]">75 GEEK</td>
                      <td className="px-3 py-2 border-b border-[#2a1a3a]">750 GEEK</td>
                      <td className="px-3 py-2 border-b border-[#2a1a3a]">3</td>
                      <td className="px-3 py-2 border-b border-[#2a1a3a]"><span className="text-[10px] px-1.5 py-0.5 border border-amber-400 text-amber-400 bg-amber-400/10">Med+</span></td>
                    </tr>
                    <tr className="hover:bg-[#111811] transition">
                      <td className="px-3 py-2 border-b border-[#2a1a3a] text-purple-400 font-bold">05</td>
                      <td className="px-3 py-2 border-b border-[#2a1a3a]">400 GEEK</td>
                      <td className="px-3 py-2 border-b border-[#2a1a3a]">125 GEEK</td>
                      <td className="px-3 py-2 border-b border-[#2a1a3a]">1,250 GEEK</td>
                      <td className="px-3 py-2 border-b border-[#2a1a3a]">4</td>
                      <td className="px-3 py-2 border-b border-[#2a1a3a]"><span className="text-[10px] px-1.5 py-0.5 border border-orange-500 text-orange-500 bg-orange-500/10">Hard</span></td>
                    </tr>
                    <tr className="hover:bg-[#111811] transition">
                      <td className="px-3 py-2 border-b border-[#2a1a3a] text-purple-400 font-bold">06</td>
                      <td className="px-3 py-2 border-b border-[#2a1a3a]">750 GEEK</td>
                      <td className="px-3 py-2 border-b border-[#2a1a3a]">200 GEEK</td>
                      <td className="px-3 py-2 border-b border-[#2a1a3a]">2,000 GEEK</td>
                      <td className="px-3 py-2 border-b border-[#2a1a3a]">4</td>
                      <td className="px-3 py-2 border-b border-[#2a1a3a]"><span className="text-[10px] px-1.5 py-0.5 border border-orange-500 text-orange-500 bg-orange-500/10">Hard</span></td>
                    </tr>
                    <tr className="hover:bg-[#111811] transition">
                      <td className="px-3 py-2 border-b border-[#2a1a3a] text-purple-400 font-bold">07</td>
                      <td className="px-3 py-2 border-b border-[#2a1a3a]">1,250 GEEK</td>
                      <td className="px-3 py-2 border-b border-[#2a1a3a]">350 GEEK</td>
                      <td className="px-3 py-2 border-b border-[#2a1a3a]">3,500 GEEK</td>
                      <td className="px-3 py-2 border-b border-[#2a1a3a]">4</td>
                      <td className="px-3 py-2 border-b border-[#2a1a3a]"><span className="text-[10px] px-1.5 py-0.5 border border-pink-500 text-pink-500 bg-pink-500/10">V.Hard</span></td>
                    </tr>
                    <tr className="hover:bg-[#111811] transition">
                      <td className="px-3 py-2 border-b border-[#2a1a3a] text-purple-400 font-bold">08</td>
                      <td className="px-3 py-2 border-b border-[#2a1a3a]">2,000 GEEK</td>
                      <td className="px-3 py-2 border-b border-[#2a1a3a]">500 GEEK</td>
                      <td className="px-3 py-2 border-b border-[#2a1a3a]">5,000 GEEK</td>
                      <td className="px-3 py-2 border-b border-[#2a1a3a]">5</td>
                      <td className="px-3 py-2 border-b border-[#2a1a3a]"><span className="text-[10px] px-1.5 py-0.5 border border-pink-500 text-pink-500 bg-pink-500/10">V.Hard</span></td>
                    </tr>
                    <tr className="hover:bg-[#111811] transition">
                      <td className="px-3 py-2 border-b border-[#2a1a3a] text-purple-400 font-bold">09</td>
                      <td className="px-3 py-2 border-b border-[#2a1a3a]">3,500 GEEK</td>
                      <td className="px-3 py-2 border-b border-[#2a1a3a]">750 GEEK</td>
                      <td className="px-3 py-2 border-b border-[#2a1a3a]">7,500 GEEK</td>
                      <td className="px-3 py-2 border-b border-[#2a1a3a]">5</td>
                      <td className="px-3 py-2 border-b border-[#2a1a3a]"><span className="text-[10px] px-1.5 py-0.5 border border-purple-500 text-purple-500 bg-purple-500/10">Expert</span></td>
                    </tr>
                    <tr className="hover:bg-[#111811] transition">
                      <td className="px-3 py-2 border-b border-[#2a1a3a] text-purple-400 font-bold">10</td>
                      <td className="px-3 py-2 border-b border-[#2a1a3a]">6,000 GEEK</td>
                      <td className="px-3 py-2 border-b border-[#2a1a3a]">1,000 GEEK</td>
                      <td className="px-3 py-2 border-b border-[#2a1a3a]">10,000 GEEK</td>
                      <td className="px-3 py-2 border-b border-[#2a1a3a]">7</td>
                      <td className="px-3 py-2 border-b border-[#2a1a3a]"><span className="text-[10px] px-1.5 py-0.5 border border-purple-500 text-purple-500 bg-purple-500/10">Expert</span></td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div>
                <div className="border border-[#2a1a3a] bg-[#0a0e0a] p-6">
                  <div className="font-mono text-[10px] tracking-widest text-white/40 mb-4">// REWARD_CURVE · OSCILLOSCOPE_VIEW</div>
                  <div className="h-[150px] w-full bg-[#0a0e0a]">
                    {/* Oscilloscope visualization - simplified with CSS */}
                    <div className="w-full h-full relative">
                      <div className="absolute inset-0">
                        <svg className="w-full h-full" viewBox="0 0 400 150" preserveAspectRatio="none">
                          <line x1="20" y1="20" x2="20" y2="130" stroke="#2a1a3a" strokeWidth="1" />
                          <line x1="20" y1="130" x2="380" y2="130" stroke="#2a1a3a" strokeWidth="1" />
                          {[0,1,2,3,4].map(i => {
                            const y = 20 + i * 27.5;
                            return <line key={i} x1="20" y1={y} x2="380" y2={y} stroke="#2a1a3a" strokeWidth="0.5" />;
                          })}
                          {[0,1,2,3,4,5,6,7,8,9].map(i => {
                            const x = 20 + i * 40;
                            return <line key={i} x1={x} y1="20" x2={x} y2="130" stroke="#2a1a3a" strokeWidth="0.5" />;
                          })}
                          <path d="M20,130 L60,26 L100,48 L140,68 L180,84 L220,60 L260,42 L300,30 L340,22 L380,20 L380,130 L20,130 Z" fill="rgba(184,115,51,0.08)" />
                          <path d="M20,130 L60,26 L100,48 L140,68 L180,84 L220,60 L260,42 L300,30 L340,22 L380,20" fill="none" stroke="#b87333" strokeWidth="2" />
                          {[
                            { x: 60, y: 26 },
                            { x: 100, y: 48 },
                            { x: 140, y: 68 },
                            { x: 180, y: 84 },
                            { x: 220, y: 60 },
                            { x: 260, y: 42 },
                            { x: 300, y: 30 },
                            { x: 340, y: 22 },
                            { x: 380, y: 20 }
                          ].map((p, i) => (
                            <circle key={i} cx={p.x} cy={p.y} r="3" fill="#cc44ff" />
                          ))}
                          <line x1="200" y1="20" x2="200" y2="130" stroke="rgba(204,68,255,0.08)" strokeWidth="1" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-px bg-[#2a1a3a] mt-px">
                  <div className="bg-[#0d120d] p-6 text-center">
                    <FaClock className="text-cyan-400 text-2xl mx-auto mb-3" />
                    <div className="font-bold text-white/90">15-Second Timer</div>
                    <p className="text-white/60 text-sm">Speed matters. Time bonus: (15 − TimeTaken) × 10 pts</p>
                  </div>
                  <div className="bg-[#0d120d] p-6 text-center">
                    <FaLock className="text-pink-500 text-2xl mx-auto mb-3" />
                    <div className="font-bold text-white/90">Anti-Cheat System</div>
                    <p className="text-white/60 text-sm">Server-side validation · Answer randomization · Session tracking</p>
                  </div>
                  <div className="bg-[#0d120d] p-6 text-center">
                    <FaChartLine className="text-purple-400 text-2xl mx-auto mb-3" />
                    <div className="font-bold text-white/90">XP Calculation</div>
                    <p className="text-white/60 text-sm">(Total Correct × 10) + (Total Score ÷ 100)</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <PCBDivider />

        {/* CCE */}
        <section className="py-16 px-4 md:px-8 max-w-[1400px] mx-auto border-t border-[#2a1a3a]">
          <div className="py-12">
            <SectionLabel>CONTENT_ENGINE_V2</SectionLabel>
            <h2 className="font-bebas tracking-widest font-bold text-3xl md:text-4xl text-white/90">COMMUNITY CONTENT ENGINE</h2>
            <p className="text-white/60 mt-3 text-lg">Create knowledge. Get paid forever.</p>

            <div className="grid md:grid-cols-2 gap-8 mt-10">
              <div>
                <div className="flex flex-col">
                  <div className="flex gap-4 py-5 border-b border-[#2a1a3a] group">
                    <div className="w-9 h-9 border border-[#2a1a3a] flex items-center justify-center font-mono text-sm text-[#b87333] flex-shrink-0 group-hover:border-purple-400 group-hover:text-purple-400 transition">01</div>
                    <div>
                      <h3 className="font-bold text-white/90">Level 10+ Unlock</h3>
                      <p className="text-white/60 text-sm">Reach Level 10 to submit questions with topics, difficulty, and source verification.</p>
                    </div>
                  </div>
                  <div className="flex gap-4 py-5 border-b border-[#2a1a3a] group">
                    <div className="w-9 h-9 border border-[#2a1a3a] flex items-center justify-center font-mono text-sm text-[#b87333] flex-shrink-0 group-hover:border-purple-400 group-hover:text-purple-400 transition">02</div>
                    <div>
                      <h3 className="font-bold text-white/90">Peer Review System</h3>
                      <p className="text-white/60 text-sm">Level 10+ reviewers vote Approve/Reject. 5 approvals = question accepted. Reviewers earn 1 XP + 0.1 GEEK per review.</p>
                    </div>
                  </div>
                  <div className="flex gap-4 py-5 group">
                    <div className="w-9 h-9 border border-[#2a1a3a] flex items-center justify-center font-mono text-sm text-[#b87333] flex-shrink-0 group-hover:border-purple-400 group-hover:text-purple-400 transition">03</div>
                    <div>
                      <h3 className="font-bold text-white/90">Passive Income</h3>
                      <p className="text-white/60 text-sm">Earn 0.5 GEEK every time your question is served. Lifetime cap: 1,000 GEEK per question (2,000 serves). Upload unlimited questions.</p>
                    </div>
                  </div>
                </div>

                <div className="border border-[#2a1a3a] bg-[#0a0e0a] p-6 mt-6">
                  <div className="font-mono text-xs text-amber-400 tracking-widest text-center mb-4">// THE CCE FLYWHEEL</div>
                  <div className="flex justify-between items-center flex-wrap gap-2">
                    <span className="font-mono text-xs text-cyan-400 px-3 py-1.5 border border-cyan-400/20">More Players</span>
                    <span className="text-[#2a1a3a]">→</span>
                    <span className="font-mono text-xs text-cyan-400 px-3 py-1.5 border border-cyan-400/20">More Creators</span>
                    <span className="text-[#2a1a3a]">→</span>
                    <span className="font-mono text-xs text-cyan-400 px-3 py-1.5 border border-cyan-400/20">More Questions</span>
                    <span className="text-[#2a1a3a]">→</span>
                    <span className="font-mono text-xs text-cyan-400 px-3 py-1.5 border border-cyan-400/20">Better Challengeplay</span>
                  </div>
                </div>
              </div>

              <div className="border border-[#2a1a3a] bg-[#0a0e0a]">
                <div className="px-4 py-3 bg-[#0d120d] border-b border-[#2a1a3a] font-bebas tracking-widest text-xs text-cyan-400">REVIEWER DASHBOARD</div>
                <div className="p-4 border-b border-[#2a1a3a]">
                  <div className="font-semibold text-white/90">What is the capital of Mars Colony?</div>
                  <div className="font-mono text-[10px] text-white/40 mt-1">Topic: Sci-Fi · Difficulty: Medium</div>
                  <div className="flex gap-2 mt-3">
                    <button className="px-3 py-1 font-mono text-xs border border-purple-400 text-purple-400 hover:bg-purple-400/10 transition">✓ Approve</button>
                    <button className="px-3 py-1 font-mono text-xs border border-pink-500 text-pink-500 hover:bg-pink-500/10 transition">✗ Reject</button>
                  </div>
                </div>
                <div className="p-4 border-b border-[#2a1a3a]">
                  <div className="font-semibold text-white/90">Who invented the Babbage Engine?</div>
                  <div className="font-mono text-[10px] text-white/40 mt-1">Topic: History · Difficulty: Easy</div>
                  <div className="flex gap-2 mt-3">
                    <button className="px-3 py-1 font-mono text-xs border border-purple-400 text-purple-400 hover:bg-purple-400/10 transition">✓ Approve</button>
                    <button className="px-3 py-1 font-mono text-xs border border-pink-500 text-pink-500 hover:bg-pink-500/10 transition">✗ Reject</button>
                  </div>
                </div>
                <div className="px-4 py-3 bg-[#0d120d] text-center font-mono text-xs text-white/40">+1 XP &nbsp;·&nbsp; +0.1 GEEK per review</div>
              </div>
            </div>
          </div>
        </section>

        <PCBDivider />

        {/* Token */}
        <section className="py-16 px-4 md:px-8 max-w-[1400px] mx-auto border-t border-[#2a1a3a]">
          <div className="py-12">
            <SectionLabel>KRC20_ASSET</SectionLabel>
            <h2 className="font-bebas tracking-widest font-bold text-3xl md:text-4xl text-white/90">$GEEK TOKEN</h2>
            <p className="text-white/60 mt-3 text-lg">The value layer for Proof-of-Learning on Kaspa</p>

            <div className="grid md:grid-cols-2 gap-8 mt-10">
              <div>
                <div className="font-mono text-[10px] tracking-widest text-[#b87333] mb-4">// TOKEN_SPECIFICATIONS</div>
                <div className="flex flex-col divide-y divide-[#2a1a3a]">
                  <div className="flex justify-between py-3"><span className="font-mono text-xs text-white/40">NAME</span><span className="font-mono text-sm text-white/80">Geek Protocol</span></div>
                  <div className="flex justify-between py-3"><span className="font-mono text-xs text-white/40">TICKER</span><span className="font-mono text-sm text-pink-500">$GEEK</span></div>
                  <div className="flex justify-between py-3"><span className="font-mono text-xs text-white/40">BLOCKCHAIN</span><span className="font-mono text-sm text-white/80">Kaspa (KRC-20)</span></div>
                  <div className="flex justify-between py-3"><span className="font-mono text-xs text-white/40">TOTAL SUPPLY</span><span className="font-mono text-sm text-white/80">144,000,000,000 GEEK</span></div>
                  <div className="flex justify-between py-3"><span className="font-mono text-xs text-white/40">DECIMALS</span><span className="font-mono text-sm text-white/80">8</span></div>
                  <div className="flex justify-between py-3"><span className="font-mono text-xs text-white/40">MINT RATE</span><span className="font-mono text-sm text-white/80">1 KAS = 100,000 GEEK</span></div>
                </div>
              </div>

              <div>
                <div className="font-mono text-[10px] tracking-widest text-[#b87333] mb-4">// TOKEN_ALLOCATION</div>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm font-semibold"><span>Quiz2Earn Rewards</span><span className="font-mono text-white/40">30% (43.2B)</span></div>
                    <div className="h-1 bg-[#2a1a3a] mt-1"><div className="h-1 bg-[#b87333] animate-[fillBar_1.5s_ease-out_both]" style={{ width: '30%' }} /></div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm font-semibold"><span>Staking Rewards</span><span className="font-mono text-white/40">20% (28.8B)</span></div>
                    <div className="h-1 bg-[#2a1a3a] mt-1"><div className="h-1 bg-cyan-400 animate-[fillBar_1.5s_ease-out_both]" style={{ width: '20%' }} /></div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm font-semibold"><span>Liquidity Fund</span><span className="font-mono text-white/40">20% (28.8B)</span></div>
                    <div className="h-1 bg-[#2a1a3a] mt-1"><div className="h-1 bg-pink-500 animate-[fillBar_1.5s_ease-out_both] [animation-delay:0.2s]" style={{ width: '20%' }} /></div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm font-semibold"><span>Team & Advisors</span><span className="font-mono text-white/40">15% (21.6B)</span></div>
                    <div className="h-1 bg-[#2a1a3a] mt-1"><div className="h-1 bg-amber-400 animate-[fillBar_1.5s_ease-out_both] [animation-delay:0.4s]" style={{ width: '15%' }} /></div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm font-semibold"><span>Marketing & Ecosystem</span><span className="font-mono text-white/40">15% (21.6B)</span></div>
                    <div className="h-1 bg-[#2a1a3a] mt-1"><div className="h-1 bg-purple-400 animate-[fillBar_1.5s_ease-out_both] [animation-delay:0.6s]" style={{ width: '15%' }} /></div>
                  </div>
                </div>

                <div className="border border-[#2a1a3a] bg-[#0a0e0a] p-6 mt-6">
                  <div className="font-mono text-xs text-amber-400 tracking-widest text-center mb-4">// 70/30 RECYCLE & BURN MODEL</div>
                  <div className="grid grid-cols-2 gap-px bg-[#2a1a3a]">
                    <div className="bg-[#0d120d] text-center py-4">
                      <span className="font-mono text-2xl font-bold text-purple-400 block">70%</span>
                      <span className="text-sm text-white/60">Back to Rewards</span>
                    </div>
                    <div className="bg-[#0d120d] text-center py-4">
                      <span className="font-mono text-2xl font-bold text-pink-500 block">30%</span>
                      <span className="text-sm text-white/60">Permanently Burned</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-[#2a1a3a] mt-8">
              <div className="bg-[#0d120d] p-6 text-center hover:bg-[#111811] transition">
                <FaTrophy className="text-amber-400 text-2xl mx-auto mb-3" />
                <div className="font-bold text-white/90">Earn</div>
                <div className="text-sm text-white/60">Quiz rewards</div>
              </div>
              <div className="bg-[#0d120d] p-6 text-center hover:bg-[#111811] transition">
                <FaCoins className="text-pink-500 text-2xl mx-auto mb-3" />
                <div className="font-bold text-white/90">Spend</div>
                <div className="text-sm text-white/60">Shop & lifelines</div>
              </div>
              <div className="bg-[#0d120d] p-6 text-center hover:bg-[#111811] transition">
                <FaChartLine className="text-cyan-400 text-2xl mx-auto mb-3" />
                <div className="font-bold text-white/90">Trade</div>
                <div className="text-sm text-white/60">Marketplace</div>
              </div>
              <div className="bg-[#0d120d] p-6 text-center hover:bg-[#111811] transition">
                <FaLock className="text-purple-400 text-2xl mx-auto mb-3" />
                <div className="font-bold text-white/90">Stake</div>
                <div className="text-sm text-white/60">Yield + boosts</div>
              </div>
            </div>
          </div>
        </section>

        <PCBDivider />

        {/* How It Works */}
        <section className="py-20 px-4 md:px-8 max-w-[1400px] mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-bebas tracking-widest font-bold text-4xl md:text-5xl text-white/90">How It Works</h2>
            <p className="text-white/60 text-lg mt-3">Six simple steps from wallet to rewards</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {FLOW_STEPS.map((step, idx) => (
              <div key={idx} className="relative group">
                {idx < FLOW_STEPS.length - 1 && (
                  <div className="hidden lg:block absolute top-16 left-[calc(100%+8px)] w-[calc(100%-16px)] h-px bg-gradient-to-r from-purple-400/50 to-emerald-400/50 group-hover:from-purple-400 group-hover:to-emerald-400 transition" />
                )}
                <div className="relative p-6 rounded-xl border border-purple-400/30 hover:border-cyan-400/60 bg-gradient-to-br from-purple-400/5 to-transparent hover:from-purple-400/10 transition duration-300">
                  <div className="absolute -top-4 -left-4 w-8 h-8 rounded-full bg-gradient-to-r from-purple-400 to-emerald-400 flex items-center justify-center text-black font-bold text-sm">
                    {step.number}
                  </div>
                  <div className="text-4xl mb-4 group-hover:scale-125 transition duration-300">
                    <step.icon />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2 group-hover:text-cyan-400 transition">{step.title}</h3>
                  <p className="text-sm text-white/60">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <PCBDivider />

        {/* Features */}
        <section className="py-20 px-4 md:px-8 max-w-[1400px] mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-bebas tracking-widest font-bold text-4xl md:text-5xl text-white/90">Core Systems</h2>
            <p className="text-white/60 text-lg mt-3">Built for signal. Designed for scale.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((feature, idx) => (
              <div key={idx} className="relative p-8 rounded-2xl border border-white/10 hover:border-purple-400/50 bg-gradient-to-br from-white/5 to-transparent hover:from-purple-400/10 hover:to-emerald-400/5 transition-all duration-500 group hover:scale-[1.02] hover:shadow-[0_0_40px_rgba(34,197,94,0.2)] cursor-pointer">
                <div className="text-5xl mb-6 transition-transform duration-500 group-hover:scale-125 group-hover:rotate-12">
                  <feature.icon />
                </div>
                <h3 className="text-2xl font-bold text-white group-hover:text-cyan-400 mb-3 transition">{feature.title}</h3>
                <p className="text-white/70 group-hover:text-white/90 text-base mb-6 leading-relaxed transition">{feature.description}</p>
                <ul className="space-y-2">
                  {feature.details.map((detail, didx) => (
                    <li key={didx} className="flex items-start gap-2 text-xs text-white/60">
                      <span className="text-cyan-400 font-bold mt-1">•</span>
                      <span>{detail}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        <PCBDivider />

        {/* Impact */}
        <section className="py-20 px-4 md:px-8 max-w-[1400px] mx-auto bg-gradient-to-b from-black to-[#0a0e27]">
          <div className="text-center mb-16">
            <h2 className="font-bebas tracking-widest font-bold text-4xl md:text-5xl text-white/90">How Geek Protocol Changes Your Life</h2>
            <p className="text-white/60 text-lg mt-3">Real impact. Measurable rewards. Lasting change.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {IMPACT_ITEMS.map((item, idx) => (
              <div key={idx} className={`p-8 rounded-xl border border-${item.accent}-500/30 bg-gradient-to-br from-${item.accent}-500/5 to-transparent`}>
                <div className="text-5xl mb-4">
                  <item.icon />
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">{item.title}</h3>
                <p className="text-white/70 leading-relaxed mb-4">{item.description}</p>
                <ul className="space-y-3 text-white/70">
                  {item.points.map((point, pidx) => (
                    <li key={pidx} className="flex gap-3">
                      <span className={`text-${item.accent}-400`}>✦</span>
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        <PCBDivider />

        {/* Categories */}
        <section className="py-20 px-4 md:px-8 max-w-[1400px] mx-auto bg-gradient-to-b from-black to-[#0a0e27]">
          <div className="text-center mb-16">
            <h2 className="font-bebas tracking-widest font-bold text-4xl md:text-5xl text-white/90">8 Categories of Knowledge</h2>
            <p className="text-white/60 text-lg mt-3">Master multiple domains. Earn across disciplines.</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {CATEGORIES.map((category, idx) => (
              <div key={idx} className="group p-6 rounded-2xl border border-white/10 hover:border-emerald-400/60 bg-gradient-to-br from-white/5 to-transparent hover:from-emerald-400/10 transition-all duration-500 text-center cursor-pointer hover:scale-105 hover:shadow-[0_0_40px_rgba(20,184,166,0.2)]">
                <div className="text-4xl md:text-5xl mb-3 transition-transform duration-500 group-hover:scale-125 group-hover:rotate-12">
                  <category.icon />
                </div>
                <p className="text-white group-hover:text-emerald-400 font-bold transition">{category.name}</p>
              </div>
            ))}
          </div>
        </section>

        <PCBDivider />

        {/* Roadmap */}
        <section className="py-20 px-4 md:px-8 max-w-[1400px] mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-bebas tracking-widest font-bold text-4xl md:text-5xl text-white/90">The Ecosystem Arc</h2>
            <p className="text-white/60 text-lg mt-3">In-world history you're living. Built on hope, not hype.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {ROADMAP.map((item) => (
              <div key={item.year} className={`p-8 rounded-xl border-2 border-${item.accent}-500/60 bg-gradient-to-br from-${item.accent}-500/10 to-transparent`}>
                <div className="flex items-center gap-3 mb-6">
                  <div className={`w-10 h-10 rounded-full bg-${item.accent}-500 text-black flex items-center justify-center font-bold`}>{item.year}</div>
                  <div>
                    <h3 className="text-2xl font-bold text-white">{item.title}</h3>
                    <p className="text-sm text-white/60">{item.subtitle}</p>
                  </div>
                </div>
                <ul className="space-y-3 text-white/70 text-sm">
                  {item.items.map((sub, idx) => (
                    <li key={idx} className="flex gap-2">
                      <span className={sub.status === 'done' ? `text-${item.accent}-400` : `text-${item.accent}-400/60`}>
                        {sub.status === 'done' ? '✓' : '→'}
                      </span>
                      {sub.text}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        <PCBDivider />

        {/* Why Kaspa */}
        <section className="py-20 px-4 md:px-8 max-w-[1400px] mx-auto border-y border-purple-400/20 bg-black">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="font-bebas tracking-widest font-bold text-4xl md:text-5xl text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-emerald-400 to-cyan-400 mb-8">Why Kaspa</h2>
            <p className="text-lg md:text-xl text-white/80 leading-relaxed mb-10">
              Kaspa isn't the loudest blockchain. It's the fastest. Sub-second blocks without sacrificing decentralization or security.
              <br /><br />
              While others promise, Kaspa delivers. Which is exactly what we needed for a protocol that handles real rewards, real payouts, real stakes.
              <br /><br />
              <span className="text-emerald-400 font-semibold">Geek Protocol exists because Kaspa made it possible.</span>
            </p>

            <div className="grid md:grid-cols-3 gap-4 mt-8">
              <div className="p-6 rounded-lg border border-emerald-500/30 bg-emerald-500/5">
                <FaBolt className="text-4xl mx-auto mb-3" />
                <h3 className="text-white font-bold mb-2">Sub-Second Blocks</h3>
                <p className="text-sm text-white/70">Finality in milliseconds, not minutes.</p>
              </div>
              <div className="p-6 rounded-lg border border-cyan-500/30 bg-cyan-500/5">
                <FaLock className="text-4xl mx-auto mb-3" />
                <h3 className="text-white font-bold mb-2">Secure & Decentralized</h3>
                <p className="text-sm text-white/70">No compromises on the fundamentals.</p>
              </div>
              <div className="p-6 rounded-lg border border-emerald-500/30 bg-emerald-500/5">
                <FaCoins className="text-4xl mx-auto mb-3" />
                <h3 className="text-white font-bold mb-2">Affordable Fees</h3>
                <p className="text-sm text-white/70">Rewards aren't swallowed by gas costs.</p>
              </div>
            </div>
          </div>
        </section>

        <PCBDivider />

        {/* Resources */}
        <section className="py-20 px-4 md:px-8 max-w-[1400px] mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-bebas tracking-widest font-bold text-4xl md:text-5xl text-white/90">Resources & Links</h2>
            <p className="text-white/60 text-lg mt-3">Everything you need to understand and join Geek Protocol</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {RESOURCES.map((resource, idx) => (
              <a
                key={idx}
                href={resource.href}
                target={resource.external ? "_blank" : undefined}
                rel={resource.external ? "noopener noreferrer" : undefined}
                className={`group p-8 rounded-2xl border hover:border-purple-400/50 bg-gradient-to-br from-white/5 to-transparent hover:from-purple-400/10 transition-all duration-500 cursor-pointer hover:scale-[1.02] hover:shadow-[0_0_40px_rgba(34,197,94,0.2)] ${
                  resource.featured ? 'border-purple-400/40 shadow-[0_0_30px_rgba(34,197,94,0.15)]' : 'border-white/10'
                }`}
              >
                <div className="flex items-start justify-between mb-6">
                  <div className="text-5xl transition-transform duration-500 group-hover:scale-125 group-hover:rotate-12">
                    <resource.icon />
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${
                    resource.status === "Live" ? "bg-emerald-500/20 text-emerald-400" :
                    resource.status === "Alpha" ? "bg-cyan-500/20 text-cyan-400" :
                    "bg-white/10 text-white/60"
                  }`}>
                    {resource.status}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-white mb-2 group-hover:text-cyan-400 transition">{resource.title}</h3>
                <p className="text-white/70 text-sm">{resource.description}</p>
                {resource.external && (
                  <div className="mt-4 flex items-center gap-2 text-cyan-400 text-sm font-semibold">
                    <span>Open External</span>
                    <FaExternalLinkAlt className="text-xs" />
                  </div>
                )}
              </a>
            ))}
          </div>
        </section>

        <PCBDivider />

        {/* Coming Soon */}
        <section className="py-20 px-4 md:px-8 max-w-[1400px] mx-auto bg-gradient-to-b from-[#0a0e27] to-black">
          <div className="text-center mb-16">
            <h2 className="font-bebas tracking-widest font-bold text-4xl md:text-5xl text-white/90">Coming Soon</h2>
            <p className="text-white/60 text-lg mt-3">All features launching in Q1 2026</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 opacity-60">
            {COMING_SOON.map((item, idx) => (
              <div key={idx} className="p-8 rounded-xl border border-white/10 bg-white/5">
                <div className="text-5xl mb-4">
                  <item.icon />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">{item.title}</h3>
                <p className="text-white/70 mb-4">{item.description}</p>
                <span className="text-white/40 font-semibold text-sm">Coming Soon</span>
              </div>
            ))}
          </div>
        </section>

        <PCBDivider />

        {/* CTA */}
        <section className="py-20 px-4 md:px-8 max-w-[1400px] mx-auto">
          <div className="border border-[#2a1a3a] bg-[#0d120d] p-8 md:p-16 text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-14 h-14 border-t-2 border-l-2 border-[#b87333]"></div>
            <div className="absolute bottom-0 right-0 w-14 h-14 border-b-2 border-r-2 border-[#b87333]"></div>
            
            <div className="font-mono text-xs text-[#b87333] tracking-widest mb-6">// MISSION_BRIEFING</div>
            <h2 className="font-bebas tracking-widest font-bold text-4xl md:text-5xl text-white/90">JOIN THE MISSION</h2>
            <p className="text-white/60 text-lg italic my-4">All Hope. No Hype. Level Up. Earn On. Geek Out.</p>

            <div className="flex flex-wrap justify-center gap-4 mt-8">
              <a href="/auth/register" className="bg-pink-600 hover:bg-pink-700 text-white px-10 py-4 font-bebas tracking-widest font-bold text-xs tracking-wider relative overflow-hidden transition-shadow hover:shadow-[0_0_24px_rgba(255,45,120,0.5)] group">
                <span className="relative z-10">Join Now</span>
                <div className="absolute inset-0 bg-cyan-400 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
              </a>
              <a href="/auth/login" className="border border-cyan-400 text-cyan-400 px-10 py-4 font-bebas tracking-widest font-bold text-xs tracking-wider hover:bg-cyan-400/10 transition">
                Sign In
              </a>
            </div>

            <div className="flex justify-center gap-4 mt-10">
              <a href="https://x.com/geekonkas" target="_blank" rel="noopener noreferrer" className="w-10 h-10 border border-[#2a1a3a] flex items-center justify-center text-white/40 hover:border-cyan-400 hover:text-cyan-400 transition">
                <FaTwitter />
              </a>
              <a href="https://t.me/GEEKonKAScommunity" target="_blank" rel="noopener noreferrer" className="w-10 h-10 border border-[#2a1a3a] flex items-center justify-center text-white/40 hover:border-cyan-400 hover:text-cyan-400 transition">
                <FaTelegram />
              </a>
              <a href="#" className="w-10 h-10 border border-[#2a1a3a] flex items-center justify-center text-white/40 hover:border-cyan-400 hover:text-cyan-400 transition">
                <FaLink />
              </a>
            </div>
          </div>
        </section>

        {/* Footer */}
      </div>

      <style>{`
        @keyframes badgeSweep {
          0% { left: -100%; }
          50% { left: 100%; }
          100% { left: 100%; }
        }
        @keyframes revealUp {
          from { transform: translateY(105%); }
          to { transform: translateY(0); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
        @keyframes blink {
          0%, 100% { opacity: 1; box-shadow: 0 0 4px #cc44ff; }
          50% { opacity: 0.3; box-shadow: none; }
        }
        @keyframes fillBar {
          from { width: 0; }
        }
        @keyframes traceFlow {
          0% { width: 0; opacity: 1; }
          80% { width: 100%; opacity: 1; }
          100% { width: 100%; opacity: 0; }
        }
      `}</style>
      <Footer />
    </div>
  );
}