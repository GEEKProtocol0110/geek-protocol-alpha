import Link from "next/link";

const FLOW_STEPS = [
  {
    number: "1",
    title: "Connect Wallet",
    description: "Link your Kaspa wallet with one click. No passwords, no security risks.",
    icon: "🔗"
  },
  {
    number: "2",
    title: "Enter The Gauntlet",
    description: "Face 10 rapid-fire questions across any category. 15 seconds per question.",
    icon: "🎮"
  },
  {
    number: "3",
    title: "Prove Your Knowledge",
    description: "Answer correctly. Beat the clock. Show the world your expertise.",
    icon: "🧠"
  },
  {
    number: "4",
    title: "Earn $GEEK",
    description: "Get rewarded instantly. Sub-6 second settlement. No waiting, no intermediaries.",
    icon: "💰"
  },
  {
    number: "5",
    title: "Climb Leaderboards",
    description: "Build your XP, maintain winning streaks, and compete globally.",
    icon: "🏆"
  },
  {
    number: "6",
    title: "Build Reputation",
    description: "Your on-chain achievements are permanent. Portable. Verifiable.",
    icon: "⭐"
  }
];

const STORY_SECTIONS = [
  {
    icon: "🌐",
    title: "The Old Net (The Fall)",
    description: "The Old Net decayed into misinformation, distraction algorithms, and entropy—the Age of Noise, where truth lost authority and knowledge lost value. Your expertise became noise, captured and sold, never returned.",
    highlight: "The collapse demanded a new foundation."
  },
  {
    icon: "⚡",
    title: "The Kaspa Foundation",
    description: "From the collapse emerged the Kaspa Graph—the Velocity Layer of the New Net: fast, fair, scalable, resistant to stagnation. A protocol that runs on proof, not promises.",
    highlight: "Speed without compromise. Truth without intermediaries."
  },
  {
    icon: "🏙️",
    title: "The Omniscient Grid",
    description: "Geek Protocol exists inside the Omniscient Grid—a neon, Kaspa-blue City of Light where XP flows like energy, knowledge nodes glow, and every correct answer strengthens reality. The Gauntlet is your gateway.",
    highlight: "Enter as a Seeker. Prove yourself. Become Cognoscenti."
  }
];

const FEATURES = [
  {
    icon: "🎮",
    title: "The Gauntlet",
    description: "10 rounds of 10 questions (100 total) with progressing difficulty. 15 seconds each. Server-side validation prevents cheating. Real players, real rewards.",
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
        <div className="mb-24 space-y-8">
          {STORY_SECTIONS.map((section, idx) => (
            <div key={idx} className="group grid md:grid-cols-[120px_1fr] gap-6 md:gap-12 items-start p-8 rounded-2xl border border-white/5 hover:border-cyan-500/30 bg-gradient-to-br from-white/2 to-transparent hover:from-cyan-500/5 transition-all duration-500 hover:shadow-[0_0_40px_rgba(34,197,94,0.1)]">
              <div className="text-5xl md:text-6xl transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6">{section.icon}</div>
              <div className="space-y-4">
                <h3 className="text-3xl md:text-5xl font-black text-white group-hover:text-cyan-400 transition-colors duration-300">{section.title}</h3>
                <p className="text-lg md:text-xl text-white/70 leading-relaxed group-hover:text-white/90 transition-colors">{section.description}</p>
                <p className="text-lg md:text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-emerald-400">{section.highlight}</p>
              </div>
            </div>
          ))}
        </div>

        {/* The Core Law & Characters */}
        <div className="my-24 space-y-12">
          {/* Core Law */}
          <div className="p-10 md:p-16 rounded-3xl border-2 border-cyan-500/40 bg-gradient-to-br from-cyan-500/10 via-emerald-500/5 to-purple-500/10 backdrop-blur-sm relative overflow-hidden group hover:border-cyan-400/60 transition-all duration-500 hover:shadow-[0_0_60px_rgba(34,197,94,0.3)]">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000 animate-shimmer" />
            <h2 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-emerald-400 mb-8 relative z-10">All Hope, No Hype</h2>
            <p className="text-lg text-white/70 leading-relaxed mb-6">
              This isn&rsquo;t a tagline. It&rsquo;s an operating rule. No empty promises. No manipulation. No artificial scarcity. No click-to-earn deception.
            </p>
            <p className="text-lg text-white/70 leading-relaxed mb-6">
              Only: <span className="text-cyan-400 font-bold">learning → proof → progress → truth</span>
            </p>
            <p className="text-lg text-white/70 leading-relaxed">
              Kaspa gave us a blockchain that actually works. Sub-second blocks. No compromise on decentralization. Geek Protocol mirrors that philosophy. Clear mechanics. Transparent rewards. Real-time settlements. Just a protocol that does what it promises.
            </p>
          </div>

          {/* The Foundational Beings */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* GIGA */}
            <div className="p-8 rounded-2xl border-2 border-yellow-500/40 bg-gradient-to-br from-yellow-500/10 to-transparent hover:border-yellow-400/60 transition-all duration-500 hover:shadow-[0_0_40px_rgba(234,179,8,0.2)]">
              <div className="text-5xl mb-4">🤖</div>
              <h3 className="text-3xl font-black text-yellow-400 mb-4">GIGA — The Heart</h3>
              <p className="text-white/70 leading-relaxed mb-4">
                The golden, glitchy welcoming force. Optimism, onboarding, identity, and community warmth.
              </p>
              <p className="text-yellow-300 italic text-sm">
                &ldquo;Where systems grow cold, GIGA stays warm.&rdquo;
              </p>
            </div>

            {/* A.C.E. */}
            <div className="p-8 rounded-2xl border-2 border-cyan-500/40 bg-gradient-to-br from-cyan-500/10 to-transparent hover:border-cyan-400/60 transition-all duration-500 hover:shadow-[0_0_40px_rgba(34,197,94,0.2)]">
              <div className="text-5xl mb-4">🔷</div>
              <h3 className="text-3xl font-black text-cyan-400 mb-4">A.C.E. — The Mind</h3>
              <p className="text-white/70 leading-relaxed mb-4">
                The cold precision. Adjudication, analytics, difficulty, legitimacy, and permanent memory.
              </p>
              <p className="text-cyan-300 italic text-sm">
                &ldquo;Emerged from corrupted trivia files. Haunts the Gauntlet. Adapts to intellect.&rdquo;
              </p>
            </div>
          </div>

          {/* The Prime Directive */}
          <div className="text-center p-12 rounded-2xl border border-white/20 bg-gradient-to-b from-white/5 to-transparent">
            <p className="text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-emerald-400 to-purple-400">
              &ldquo;Rebuild the collective mind. Reward the knowing.&rdquo;
            </p>
            <p className="text-white/50 mt-4 text-sm uppercase tracking-wider">The Prime Directive</p>
          </div>
        </div>

        {/* Core Features */}
        <div>
          <div className="mb-20 text-center">
            <h2 className="text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-100 to-white mb-6">Core Systems</h2>
            <p className="text-xl md:text-2xl text-white/70 font-light">Built for signal. Designed for scale.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {FEATURES.map((feature, idx) => (
              <div 
                key={idx}
                className="relative p-8 rounded-2xl border border-white/10 hover:border-cyan-500/50 bg-gradient-to-br from-white/5 to-transparent hover:from-cyan-500/10 hover:to-emerald-500/5 transition-all duration-500 group hover:scale-105 hover:shadow-[0_0_40px_rgba(34,197,94,0.2)] cursor-pointer"
              >
                <div className="text-5xl mb-6 transition-transform duration-500 group-hover:scale-125 group-hover:rotate-12">{feature.icon}</div>
                <h3 className="text-2xl font-black text-white group-hover:text-cyan-400 mb-3 transition-colors">{feature.title}</h3>
                <p className="text-white/70 group-hover:text-white/90 text-base mb-6 leading-relaxed transition-colors">{feature.description}</p>
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
        <div className="mb-20 text-center">
          <h2 className="text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-emerald-100 to-white mb-6">8 Categories of Knowledge</h2>
          <p className="text-xl md:text-2xl text-white/70 font-light">Master multiple domains. Earn across disciplines.</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {CATEGORIES.map((category, idx) => (
            <div
              key={idx}
              className="group p-8 rounded-2xl border border-white/10 hover:border-emerald-400/60 bg-gradient-to-br from-white/5 to-transparent hover:from-emerald-500/10 transition-all duration-500 text-center cursor-pointer hover:scale-105 hover:shadow-[0_0_40px_rgba(20,184,166,0.2)]"
            >
              <p className="text-4xl md:text-5xl mb-4 transition-transform duration-500 group-hover:scale-125 group-hover:rotate-12">{category.split(" ")[0]}</p>
              <p className="text-white group-hover:text-emerald-400 font-bold text-base transition-colors">{category.substring(2)}</p>
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
        <div className="mb-20 text-center">
          <h2 className="text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-100 to-white mb-6">The Ecosystem Arc</h2>
          <p className="text-xl md:text-2xl text-white/70 font-light">In-world history you&rsquo;re living. Built on hope, not hype.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Year 1 */}
          <div className="p-8 rounded-xl border-2 border-cyan-500/60 bg-gradient-to-br from-cyan-500/10 to-transparent">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-cyan-500 text-black flex items-center justify-center font-bold">1</div>
              <div>
                <h3 className="text-2xl font-bold text-white">Year 1</h3>
                <p className="text-sm text-white/60">2026 – Launch & Traction</p>
              </div>
            </div>
            <ul className="space-y-3 text-white/70 text-sm">
              <li className="flex gap-2">
                <span className="text-cyan-400">✓</span> Public beta on Kaspa mainnet
              </li>
              <li className="flex gap-2">
                <span className="text-cyan-400">✓</span> First major live tournament
              </li>
              <li className="flex gap-2">
                <span className="text-cyan-400">→</span> Content velocity expansion
              </li>
              <li className="flex gap-2">
                <span className="text-cyan-400">→</span> Telegram mini app + Geek Wallet
              </li>
            </ul>
          </div>

          {/* Year 3 */}
          <div className="p-8 rounded-xl border-2 border-emerald-500/40 bg-gradient-to-br from-emerald-500/5 to-transparent">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full border-2 border-emerald-500/60 text-emerald-400 flex items-center justify-center font-bold">3</div>
              <div>
                <h3 className="text-2xl font-bold text-white">Year 3</h3>
                <p className="text-sm text-white/60">2028 – Expansion</p>
              </div>
            </div>
            <ul className="space-y-3 text-white/70 text-sm">
              <li className="flex gap-2">
                <span className="text-emerald-400">→</span> Mobile app (iOS + Android)
              </li>
              <li className="flex gap-2">
                <span className="text-emerald-400">→</span> Partner integrations
              </li>
              <li className="flex gap-2">
                <span className="text-emerald-400">→</span> IRL presence & events
              </li>
              <li className="flex gap-2">
                <span className="text-emerald-400">→</span> DAO + open-sourcing begins
              </li>
            </ul>
          </div>

          {/* Year 5 */}
          <div className="p-8 rounded-xl border-2 border-purple-500/40 bg-gradient-to-br from-purple-500/5 to-transparent">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full border-2 border-purple-500/60 text-purple-400 flex items-center justify-center font-bold">5</div>
              <div>
                <h3 className="text-2xl font-bold text-white">Year 5</h3>
                <p className="text-sm text-white/60">2030 – Definitive Hub</p>
              </div>
            </div>
            <ul className="space-y-3 text-white/70 text-sm">
              <li className="flex gap-2">
                <span className="text-purple-400">→</span> Ecosystem hub status
              </li>
              <li className="flex gap-2">
                <span className="text-purple-400">→</span> A.C.E. as a Service licensing
              </li>
              <li className="flex gap-2">
                <span className="text-purple-400">→</span> Launchpad for geek-native projects
              </li>
              <li className="flex gap-2">
                <span className="text-purple-400">→</span> Legacy system complete
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
        <h2 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-emerald-400 to-cyan-400 mb-8">Why Kaspa</h2>
          <p className="text-lg md:text-xl text-white/80 leading-relaxed mb-10">
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

export function ImpactSection() {
  return (
    <section className="relative py-24 px-6 bg-gradient-to-b from-black to-[#0a0e27]">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-1/4 left-1/4 h-[400px] w-[400px] rounded-full bg-cyan-500/10 blur-[80px]" />
        <div className="absolute bottom-1/4 right-1/4 h-[400px] w-[400px] rounded-full bg-emerald-500/10 blur-[80px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-6xl">
        <div className="mb-20 text-center">
          <h2 className="text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-emerald-100 to-white mb-6">How Geek Protocol Changes Your Life</h2>
          <p className="text-xl md:text-2xl text-white/70 font-light">Real impact. Measurable rewards. Lasting change.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="p-8 rounded-xl border border-cyan-500/30 bg-gradient-to-br from-cyan-500/5 to-transparent">
            <div className="text-5xl mb-4">💡</div>
            <h3 className="text-2xl font-bold text-white mb-4">Your Knowledge Has Value</h3>
            <p className="text-white/70 leading-relaxed mb-4">
              Stop giving away your expertise for free. Every answer you provide proves your knowledge. Every correct response generates real, verifiable signal that gets rewarded immediately.
            </p>
            <ul className="space-y-3 text-white/70">
              <li className="flex gap-3">
                <span className="text-cyan-400">✦</span>
                <span>Monetize your geek knowledge instantly</span>
              </li>
              <li className="flex gap-3">
                <span className="text-cyan-400">✦</span>
                <span>No middleman taking a cut</span>
              </li>
              <li className="flex gap-3">
                <span className="text-cyan-400">✦</span>
                <span>Direct rewards to your wallet</span>
              </li>
            </ul>
          </div>

          <div className="p-8 rounded-xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/5 to-transparent">
            <div className="text-5xl mb-4">🎯</div>
            <h3 className="text-2xl font-bold text-white mb-4">Compete Without Gatekeeping</h3>
            <p className="text-white/70 leading-relaxed mb-4">
              Leaderboards are global. Competition is fair. Everyone plays by the same rules. Your ranking is determined by skill and speed, not money or connections.
            </p>
            <ul className="space-y-3 text-white/70">
              <li className="flex gap-3">
                <span className="text-emerald-400">✦</span>
                <span>Fair, transparent ranking system</span>
              </li>
              <li className="flex gap-3">
                <span className="text-emerald-400">✦</span>
                <span>Real-time leaderboards show your position</span>
              </li>
              <li className="flex gap-3">
                <span className="text-emerald-400">✦</span>
                <span>Compete against geeks worldwide</span>
              </li>
            </ul>
          </div>

          <div className="p-8 rounded-xl border border-cyan-500/30 bg-gradient-to-br from-cyan-500/5 to-transparent">
            <div className="text-5xl mb-4">⚡</div>
            <h3 className="text-2xl font-bold text-white mb-4">Instant Rewards, Real Settlement</h3>
            <p className="text-white/70 leading-relaxed mb-4">
              You don&rsquo;t wait days for your earnings. Rewards settle in under 6 seconds. The blockchain doesn&rsquo;t lie. Your token hits your wallet almost before the game ends.
            </p>
            <ul className="space-y-3 text-white/70">
              <li className="flex gap-3">
                <span className="text-cyan-400">✦</span>
                <span>Sub-6 second settlement times</span>
              </li>
              <li className="flex gap-3">
                <span className="text-cyan-400">✦</span>
                <span>No waiting for manual payouts</span>
              </li>
              <li className="flex gap-3">
                <span className="text-cyan-400">✦</span>
                <span>Cryptographically verified rewards</span>
              </li>
            </ul>
          </div>

          <div className="p-8 rounded-xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/5 to-transparent">
            <div className="text-5xl mb-4">🌟</div>
            <h3 className="text-2xl font-bold text-white mb-4">Build Your On-Chain Reputation</h3>
            <p className="text-white/70 leading-relaxed mb-4">
              Every achievement is recorded. Your skill profile is permanent. Your reputation isn&rsquo;t deleted by algorithm changes. It lives on the blockchain—forever.
            </p>
            <ul className="space-y-3 text-white/70">
              <li className="flex gap-3">
                <span className="text-emerald-400">✦</span>
                <span>Permanent on-chain proof of knowledge</span>
              </li>
              <li className="flex gap-3">
                <span className="text-emerald-400">✦</span>
                <span>Portable reputation across platforms</span>
              </li>
              <li className="flex gap-3">
                <span className="text-emerald-400">✦</span>
                <span>XP streaks and achievement tracking</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

export function ResourcesSection() {
  const resources = [
    {
      icon: "📖",
      title: "Litepaper",
      description: "Deep technical dive into how Geek Protocol works",
      href: "/litepaper",
      status: "Coming Soon"
    },
    {
      icon: "🔗",
      title: "Kaspa Official",
      description: "Learn about the blockchain powering Geek Protocol",
      href: "https://kaspa.org",
      external: true,
      status: "Live"
    },
    {
      icon: "💻",
      title: "GitHub Repository",
      description: "Open-source code. Full transparency.",
      href: "https://github.com/GEEKProtocol0110/geek-protocol-alpha",
      external: true,
      status: "Live"
    },
    {
      icon: "🎮",
      title: "Play the Game",
      description: "Enter the Geek Gauntlet and start earning",
      href: "/play",
      status: "Coming Soon"
    },
    {
      icon: "👥",
      title: "Community",
      description: "Join geeks building the future together",
      href: "https://t.me/GEEKonKAScommunity",
      external: true,
      status: "Live"
    },
    {
      icon: "🐦",
      title: "Follow Updates",
      description: "Stay informed about launches and milestones",
      href: "https://x.com/geekonkas",
      external: true,
      status: "Live"
    }
  ];

  return (
    <section className="relative py-24 px-6 bg-black">
      <div className="relative z-10 mx-auto max-w-6xl">
        <div className="mb-20 text-center">
          <h2 className="text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-100 to-white mb-6">Resources & Links</h2>
          <p className="text-xl md:text-2xl text-white/70 font-light">Everything you need to understand and join Geek Protocol</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {resources.map((resource, idx) => (
            <a
              key={idx}
              href={resource.href}
              target={resource.external ? "_blank" : undefined}
              rel={resource.external ? "noopener noreferrer" : undefined}
              className="group p-10 rounded-2xl border border-white/10 hover:border-cyan-500/50 bg-gradient-to-br from-white/5 to-transparent hover:from-cyan-500/10 transition-all duration-500 cursor-pointer hover:scale-105 hover:shadow-[0_0_40px_rgba(34,197,94,0.2)]"
            >
              <div className="flex items-start justify-between mb-6">
                <div className="text-6xl transition-transform duration-500 group-hover:scale-125 group-hover:rotate-12">{resource.icon}</div>
                <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                  resource.status === "Live" 
                    ? "bg-emerald-500/20 text-emerald-400" 
                    : "bg-white/10 text-white/60"
                }`}>
                  {resource.status}
                </span>
              </div>
              <h3 className="text-xl font-bold text-white mb-2 group-hover:text-cyan-400 transition-colors">
                {resource.title}
              </h3>
              <p className="text-white/70 text-sm">{resource.description}</p>
              {resource.external && (
                <div className="mt-4 flex items-center gap-2 text-cyan-400 text-sm font-semibold">
                  <span>Open External</span>
                  <span>↗</span>
                </div>
              )}
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

export function HowItWorksSection() {
  return (
    <section className="relative py-32 px-6 bg-black">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-0 left-1/4 h-[400px] w-[400px] rounded-full bg-cyan-500/10 blur-[80px]" />
        <div className="absolute bottom-0 right-1/4 h-[400px] w-[400px] rounded-full bg-emerald-500/10 blur-[80px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-6xl">
        <div className="mb-24 text-center">
          <h2 className="text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-100 to-white mb-6">How It Works</h2>
          <p className="text-xl md:text-2xl text-white/70 font-light">Six simple steps from wallet to rewards</p>
        </div>

        {/* Flow visualization */}
        <div className="mb-20">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {FLOW_STEPS.map((step, idx) => (
              <div key={idx} className="relative group">
                {/* Connection line */}
                {idx < FLOW_STEPS.length - 1 && (
                  <div className="hidden lg:block absolute top-16 left-[calc(100%+8px)] w-[calc(100%-16px)] h-1 bg-gradient-to-r from-cyan-500/50 to-emerald-500/50 group-hover:from-cyan-400 group-hover:to-emerald-400 transition-all" />
                )}

                <div className="relative p-6 rounded-xl border border-cyan-500/30 hover:border-cyan-400/60 bg-gradient-to-br from-cyan-500/5 to-transparent hover:from-cyan-500/10 transition-all duration-300 group">
                  {/* Step number */}
                  <div className="absolute -top-4 -left-4 w-8 h-8 rounded-full bg-gradient-to-r from-cyan-400 to-emerald-400 flex items-center justify-center text-black font-bold text-sm">
                    {step.number}
                  </div>

                  {/* Icon */}
                  <div className="text-4xl mb-4 group-hover:scale-125 transition-transform duration-300">
                    {step.icon}
                  </div>

                  {/* Content */}
                  <h3 className="text-lg font-bold text-white mb-2 group-hover:text-cyan-400 transition-colors">
                    {step.title}
                  </h3>
                  <p className="text-sm text-white/60">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Timeline visualization for mobile */}
        <div className="lg:hidden space-y-4">
          {FLOW_STEPS.map((step, idx) => (
            <div key={idx} className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-cyan-400 to-emerald-400 flex items-center justify-center text-black font-bold flex-shrink-0">
                  {step.number}
                </div>
                {idx < FLOW_STEPS.length - 1 && (
                  <div className="w-1 h-12 bg-gradient-to-b from-cyan-500/50 to-transparent mt-2" />
                )}
              </div>
              <div className="flex-1 pt-1">
                <h3 className="font-bold text-white text-lg">{step.title}</h3>
                <p className="text-white/60 text-sm mt-1">{step.description}</p>
              </div>
            </div>
          ))}
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
        <h2 className="text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-100 to-white mb-8">Join the Geek Revolution</h2>
        <p className="text-2xl md:text-3xl text-white/80 mb-16 font-light leading-relaxed">
          Your knowledge. Your edge. Your rewards. <br />Be part of the protocol changing how geeks earn.
        </p>

        <div className="flex flex-col sm:flex-row gap-6 justify-center mb-16">
          <a
            href="https://x.com/geekonkas"
            target="_blank"
            rel="noopener noreferrer"
            className="group relative inline-flex items-center justify-center px-12 py-6 text-xl font-black uppercase tracking-widest text-white rounded-2xl border-2 border-white/30 hover:border-cyan-400/60 bg-white/5 hover:bg-cyan-500/10 transition-all duration-300 hover:scale-105 hover:shadow-[0_0_40px_rgba(34,197,94,0.3)]"
          >
            <span className="relative z-10">Follow on X →</span>
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-cyan-500/20 to-emerald-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </a>

          <a
            href="https://t.me/GEEKonKAScommunity"
            target="_blank"
            rel="noopener noreferrer"
            className="group relative inline-flex items-center justify-center px-12 py-6 text-xl font-black uppercase tracking-widest text-white rounded-2xl border-2 border-emerald-400/40 hover:border-emerald-400/70 bg-emerald-500/5 hover:bg-emerald-500/10 transition-all duration-300 hover:scale-105 hover:shadow-[0_0_40px_rgba(20,184,166,0.3)]"
          >
            <span className="relative z-10">Join Community →</span>
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </a>
        </div>

        <p className="text-xl text-white/60 mb-16 font-medium">Coming to www.geekprotocol.xyz in Q1 2026</p>

        <div className="pt-12 border-t border-white/10">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
            <div>
              <p className="text-xs uppercase tracking-widest text-white/40 mb-2">Infrastructure</p>
              <p className="text-white/90 font-semibold">Kaspa Layer 1 • KRC-20</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-widest text-white/40 mb-2">Security</p>
              <p className="text-white/90 font-semibold">Schnorr Signatures • HMAC Tokens</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-widest text-white/40 mb-2">Settlement</p>
              <p className="text-white/90 font-semibold">Sub-6 Second Finality</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
