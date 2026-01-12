import Link from "next/link";

const STORY_SECTIONS = [
  {
    icon: "🧠",
    title: "The Problem",
    description: "Knowledge has value. Yet traditional platforms hide it behind ads and paywalls. Your expertise, your data, your edge—captured and sold, never returned.",
    highlight: "We built Geek Protocol to change that."
  },
  {
    icon: "⚡",
    title: "The Solution",
    description: "A quiz-to-earn protocol that runs on Kaspa. You answer questions. The blockchain settles rewards. No middleman. No delays. Pure signal.",
    highlight: "Your knowledge becomes an on-chain asset."
  },
  {
    icon: "🏆",
    title: "Coming Q1 2026",
    description: "The Geek Gauntlet launches soon. Answer 10 rapid-fire questions across 8 categories. Beat the clock. Beat the competition. The protocol handles scoring, validation, and payouts.",
    highlight: "From play to payout in less than 6 seconds."
  }
];

const FEATURES = [
  {
    icon: "🎮",
    title: "The Gauntlet",
    description: "10 rapid-fire questions. 15 seconds each. Server-side validation prevents cheating. Real players, real rewards.",
    details: ["Server-side scoring", "HMAC attempt tokens", "Anti-cheat orchestration"]
  },
  {
    icon: "💰",
    title: "$GEEK Rewards",
    description: "Native KRC-20 token earned through gameplay. No play-to-earn fatigue. Transparent, auditable payouts via Redis queue.",
    details: ["Redis worker automation", "Sub-6 second settlements", "Wallet-level payouts"]
  },
  {
    icon: "📊",
    title: "Live Leaderboards",
    description: "Real-time rankings. Track your XP, win streaks, and performance. Compare globally. Compete fairly.",
    details: ["Instant rank updates", "XP tracking", "Detailed analytics"]
  },
  {
    icon: "🔐",
    title: "Kasware Auth",
    description: "Sign in with your Kaspa wallet. No passwords. No central database. Your identity, your data, your control.",
    details: ["Schnorr signature verification", "Nonce challenges", "JWT sessions"]
  },
  {
    icon: "⏱️",
    title: "Sub-6 Second Settlements",
    description: "Proof of signal hits your wallet faster than you can reload the page. This is instant settlement in practice.",
    details: ["Real-time queue monitoring", "Worker heartbeat tracking", "Instant confirmation"]
  },
  {
    icon: "🌍",
    title: "Built on Kaspa",
    description: "Fastest smart contract blockchain. Sub-second block times. Scalability that doesn&rsquo;t compromise security. This is where it lives.",
    details: ["KRC-20 integration", "Kaspa wallets", "Fee-efficient payouts"]
  }
];

const CATEGORIES = [
  "🎮 Video Games",
  "💻 Technology",
  "🚀 Science Fiction",
  "🎬 Movies",
  "📺 Anime",
  "📚 Comics",
  "🏛️ History",
  "🌟 Pop Culture"
];

export function StorySection() {
  return (
    <section className="relative py-24 px-6 bg-black">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-0 left-1/3 h-[400px] w-[400px] rounded-full bg-cyan-500/10 blur-[80px]" />
        <div className="absolute bottom-0 right-1/3 h-[400px] w-[400px] rounded-full bg-emerald-500/10 blur-[80px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-6xl">
        {/* Story sections */}
        <div className="mb-24 space-y-12">
          {STORY_SECTIONS.map((section, idx) => (
            <div key={idx} className="grid md:grid-cols-[100px_1fr] gap-6 md:gap-12 items-start">
              <div className="text-4xl">{section.icon}</div>
              <div className="space-y-4">
                <h3 className="text-3xl md:text-4xl font-bold text-white">{section.title}</h3>
                <p className="text-lg text-white/70 leading-relaxed">{section.description}</p>
                <p className="text-lg font-semibold text-cyan-400">{section.highlight}</p>
              </div>
            </div>
          ))}
        </div>

        {/* The Philosophy */}
        <div className="my-24 p-8 md:p-12 rounded-2xl border border-cyan-500/30 bg-gradient-to-br from-cyan-500/5 to-emerald-500/5 backdrop-blur-sm">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">All Hope, No Hype</h2>
          <p className="text-lg text-white/70 leading-relaxed mb-6">
            Geek Protocol isn&rsquo;t built on promises of 10,000x gains or locked liquidity pools. It&rsquo;s built on <span className="text-white font-semibold">signal</span>—measurable, verifiable knowledge.
          </p>
          <p className="text-lg text-white/70 leading-relaxed mb-6">
            Kaspa gave us a blockchain that actually works. Sub-second blocks. No compromise on decentralization. A foundation of solid engineering instead of marketing hype.
          </p>
          <p className="text-lg text-white/70 leading-relaxed">
            Geek Protocol mirrors that philosophy. Clear mechanics. Transparent rewards. Real-time settlements. No dark arts. No hidden yield farming. Just a protocol that does what it promises, backed by the blockchain that makes it possible.
          </p>
        </div>

        {/* Core Features */}
        <div>
          <div className="mb-16 text-center">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">Core Systems</h2>
            <p className="text-lg text-white/60">Built for signal. Designed for scale.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((feature, idx) => (
              <div 
                key={idx}
                className="p-6 rounded-xl border border-white/10 hover:border-cyan-500/30 bg-white/2 hover:bg-white/5 transition-all duration-300 group"
              >
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-bold text-white mb-2">{feature.title}</h3>
                <p className="text-white/70 text-sm mb-4">{feature.description}</p>
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
        </div>
      </div>
    </section>
  );
}

export function CategoriesSection() {
  return (
    <section className="relative py-24 px-6 bg-gradient-to-b from-black to-[#0a0e27]">
      <div className="relative z-10 mx-auto max-w-6xl">
        <div className="mb-16 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">8 Categories of Knowledge</h2>
          <p className="text-lg text-white/60">Master multiple domains. Earn across disciplines.</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {CATEGORIES.map((category, idx) => (
            <div
              key={idx}
              className="p-6 rounded-xl border border-white/10 hover:border-emerald-400/60 bg-white/2 hover:bg-emerald-500/5 transition-all duration-300 text-center"
            >
              <p className="text-2xl mb-2">{category.split(" ")[0]}</p>
              <p className="text-white font-semibold text-sm">{category.substring(2)}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function RoadmapSection() {
  return (
    <section className="relative py-24 px-6 bg-black">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute bottom-0 right-1/4 h-[400px] w-[400px] rounded-full bg-emerald-500/10 blur-[80px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-6xl">
        <div className="mb-16 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">The Path Forward</h2>
          <p className="text-lg text-white/60">From alpha to economy. Built on hope, not hype.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Phase 0 */}
          <div className="p-8 rounded-xl border-2 border-cyan-500/60 bg-gradient-to-br from-cyan-500/10 to-transparent">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-cyan-500 text-black flex items-center justify-center font-bold">0</div>
              <div>
                <h3 className="text-2xl font-bold text-white">Alpha</h3>
                <p className="text-sm text-white/60">Now Live</p>
              </div>
            </div>
            <ul className="space-y-3 text-white/70 text-sm">
              <li className="flex gap-2">
                <span className="text-cyan-400">✓</span> Quiz2Earn MVP
              </li>
              <li className="flex gap-2">
                <span className="text-cyan-400">✓</span> Kasware auth
              </li>
              <li className="flex gap-2">
                <span className="text-cyan-400">✓</span> Reward queue
              </li>
              <li className="flex gap-2">
                <span className="text-cyan-400">✓</span> Live leaderboards
              </li>
            </ul>
          </div>

          {/* Phase 1 */}
          <div className="p-8 rounded-xl border-2 border-emerald-500/40 bg-gradient-to-br from-emerald-500/5 to-transparent">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full border-2 border-emerald-500/60 text-emerald-400 flex items-center justify-center font-bold">1</div>
              <div>
                <h3 className="text-2xl font-bold text-white">Signal</h3>
                <p className="text-sm text-white/60">Q1 2026</p>
              </div>
            </div>
            <ul className="space-y-3 text-white/70 text-sm">
              <li className="flex gap-2">
                <span className="text-emerald-400">→</span> Advanced telemetry
              </li>
              <li className="flex gap-2">
                <span className="text-emerald-400">→</span> XP streaks
              </li>
              <li className="flex gap-2">
                <span className="text-emerald-400">→</span> Health dashboards
              </li>
              <li className="flex gap-2">
                <span className="text-emerald-400">→</span> Category curator tools
              </li>
            </ul>
          </div>

          {/* Phase 2 */}
          <div className="p-8 rounded-xl border-2 border-white/20 bg-gradient-to-br from-white/5 to-transparent">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full border-2 border-white/30 text-white/70 flex items-center justify-center font-bold">2</div>
              <div>
                <h3 className="text-2xl font-bold text-white">Economy</h3>
                <p className="text-sm text-white/60">H2 2026</p>
              </div>
            </div>
            <ul className="space-y-3 text-white/70 text-sm">
              <li className="flex gap-2">
                <span className="text-white/50">→</span> Treasury-backed pools
              </li>
              <li className="flex gap-2">
                <span className="text-white/50">→</span> Token staking
              </li>
              <li className="flex gap-2">
                <span className="text-white/50">→</span> Governance
              </li>
              <li className="flex gap-2">
                <span className="text-white/50">→</span> On-chain verification
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

export function NavLinks() {
  return (
    <section className="relative py-24 px-6 bg-gradient-to-b from-[#0a0e27] to-black">
      <div className="relative z-10 mx-auto max-w-6xl">
        <div className="mb-16 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">Coming Soon</h2>
          <p className="text-lg text-white/60">All features launching in Q1 2026</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 opacity-60">
          <div className="p-8 rounded-xl border border-white/10 bg-white/2">
            <div className="text-5xl mb-4">🎮</div>
            <h3 className="text-2xl font-bold text-white mb-2">Play</h3>
            <p className="text-white/70 mb-4">Enter the Geek Gauntlet. Prove your knowledge. Earn $GEEK rewards.</p>
            <span className="text-white/40 font-semibold text-sm">Coming Soon</span>
          </div>

          <div className="p-8 rounded-xl border border-white/10 bg-white/2">
            <div className="text-5xl mb-4">📊</div>
            <h3 className="text-2xl font-bold text-white mb-2">Dashboard</h3>
            <p className="text-white/70 mb-4">Track your attempts, XP, and rewards. View your progress and history.</p>
            <span className="text-white/40 font-semibold text-sm">Coming Soon</span>
          </div>

          <div className="p-8 rounded-xl border border-white/10 bg-white/2">
            <div className="text-5xl mb-4">🏆</div>
            <h3 className="text-2xl font-bold text-white mb-2">Leaderboard</h3>
            <p className="text-white/70 mb-4">Global rankings updated in real-time. See who&rsquo;s dominating.</p>
            <span className="text-white/40 font-semibold text-sm">Coming Soon</span>
          </div>

          <div className="p-8 rounded-xl border border-white/10 bg-white/2">
            <div className="text-5xl mb-4">👤</div>
            <h3 className="text-2xl font-bold text-white mb-2">Profile</h3>
            <p className="text-white/70 mb-4">Your personal performance page. Stats, achievements, and history.</p>
            <span className="text-white/40 font-semibold text-sm">Coming Soon</span>
          </div>

          <div className="p-8 rounded-xl border border-white/10 bg-white/2">
            <div className="text-5xl mb-4">📋</div>
            <h3 className="text-2xl font-bold text-white mb-2">Litepaper</h3>
            <p className="text-white/70 mb-4">Deep dive into the protocol. How it works. Why it matters.</p>
            <span className="text-white/40 font-semibold text-sm">Coming Soon</span>
          </div>

          <div className="p-8 rounded-xl border border-white/10 bg-white/2">
            <div className="text-5xl mb-4">⚙️</div>
            <h3 className="text-2xl font-bold text-white mb-2">Admin</h3>
            <p className="text-white/70 mb-4">Operator console. Monitor attempts, rewards, and system health.</p>
            <span className="text-white/40 font-semibold text-sm">Coming Soon</span>
          </div>
        </div>
      </div>
    </section>
  );
}

export function KaspaHonorSection() {
  return (
    <section className="relative py-24 px-6 bg-black border-y border-cyan-500/20">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(34,197,94,0.02)_0%,rgba(20,184,166,0.02)_100%)]" />
      </div>

      <div className="relative z-10 mx-auto max-w-4xl text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">Why Kaspa</h2>
          <p className="text-lg text-white/70 leading-relaxed mb-8">
            Kaspa isn&rsquo;t the loudest blockchain. It&rsquo;s the fastest. Sub-second blocks without sacrificing decentralization or security. 
          <br />
          <br />
          While others promise, Kaspa delivers. Which is exactly what we needed for a protocol that handles real rewards, real payouts, real stakes. 
          <br />
          <br />
          <span className="text-emerald-400 font-semibold">Geek Protocol exists because Kaspa made it possible.</span>
        </p>

        <div className="grid md:grid-cols-3 gap-6 mt-12">
          <div className="p-6 rounded-lg border border-emerald-500/30 bg-emerald-500/5">
            <div className="text-4xl mb-3">⚡</div>
            <h3 className="text-white font-bold mb-2">Sub-Second Blocks</h3>
            <p className="text-sm text-white/70">Finality in milliseconds, not minutes.</p>
          </div>
          <div className="p-6 rounded-lg border border-cyan-500/30 bg-cyan-500/5">
            <div className="text-4xl mb-3">🔐</div>
            <h3 className="text-white font-bold mb-2">Secure & Decentralized</h3>
            <p className="text-sm text-white/70">No compromises on the fundamentals.</p>
          </div>
          <div className="p-6 rounded-lg border border-emerald-500/30 bg-emerald-500/5">
            <div className="text-4xl mb-3">💰</div>
            <h3 className="text-white font-bold mb-2">Affordable Fees</h3>
            <p className="text-sm text-white/70">Rewards aren&rsquo;t swallowed by gas costs.</p>
          </div>
        </div>
      </div>
    </section>
  );
}

export function CTASection() {
  return (
    <section className="relative py-24 px-6 bg-gradient-to-b from-black via-[#0a0e27] to-black">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-1/2 -translate-y-1/2 left-1/2 -translate-x-1/2 h-[500px] w-[500px] rounded-full bg-gradient-to-r from-cyan-500/20 via-emerald-500/20 to-cyan-500/20 blur-[100px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-4xl text-center">
        <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Join the Early Community</h2>
        <p className="text-xl text-white/70 mb-12">
          Be part of the first wave. Get notified when we launch in Q1 2026.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href="https://x.com/geekonkas"
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex items-center justify-center px-10 py-5 text-lg font-bold uppercase tracking-widest text-white rounded-xl border-2 border-white/30 hover:border-cyan-400/60 transition-all duration-300"
          >
            <span>Follow on X →</span>
          </a>

          <a
            href="https://t.me/GEEKonKAScommunity"
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex items-center justify-center px-10 py-5 text-lg font-bold uppercase tracking-widest text-white rounded-xl border-2 border-emerald-400/40 hover:border-emerald-400/70 transition-all duration-300"
          >
            <span>Join Community →</span>
          </a>
        </div>

        <div className="mt-12 pt-12 border-t border-white/10">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
            <div>
              <p className="text-xs uppercase tracking-widest text-white/40 mb-2">Infrastructure</p>
              <p className="text-white/90 font-semibold">Kaspa Layer 1 • KRC-20</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-widest text-white/40 mb-2">Security</p>
              <p className="text-white/90 font-semibold">Cryptographic Validation</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-widest text-white/40 mb-2">Settlement</p>
              <p className="text-white/90 font-semibold">Sub-Second Finality</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
