import Link from "next/link";

export default function Litepaper() {
  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-4xl px-6 py-16">
        {/* Header */}
        <div className="mb-16">
          <Link href="/" className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors mb-8">
            ← Back to Home
          </Link>
          <h1 className="text-5xl md:text-6xl font-bold mb-4">
            Geek Protocol
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">
              Litepaper
            </span>
          </h1>
          <p className="text-xl text-white/70">
            A gamified Web3 ecosystem powered by knowledge and competition
          </p>
        </div>

        {/* Table of Contents */}
        <div className="mb-16 glass rounded-2xl p-8 border border-cyan-400/20">
          <h2 className="text-2xl font-bold mb-6">Table of Contents</h2>
          <ul className="space-y-2 text-white/80">
            <li><a href="#vision" className="hover:text-cyan-400 transition-colors">1. Vision & Mandate</a></li>
            <li><a href="#problem" className="hover:text-cyan-400 transition-colors">2. The Problem</a></li>
            <li><a href="#solution" className="hover:text-cyan-400 transition-colors">3. The Solution</a></li>
            <li><a href="#features" className="hover:text-cyan-400 transition-colors">4. Core Features</a></li>
            <li><a href="#tokenomics" className="hover:text-cyan-400 transition-colors">5. Tokenomics</a></li>
            <li><a href="#roadmap" className="hover:text-cyan-400 transition-colors">6. Roadmap</a></li>
          </ul>
        </div>

        {/* Sections */}
        <div className="space-y-16">
          {/* Vision */}
          <Section id="vision" title="Vision & Mandate">
            <p className="mb-4">
              <strong>Geek Protocol</strong> is built on a simple but powerful mandate: <em>&ldquo;All hope, no hype.&rdquo;</em>
            </p>
            <p className="mb-4">
              We believe that knowledge should be rewarded, learning should be competitive, and the blockchain should serve the community—not vice versa. Our mission is to create a transparent, community-driven ecosystem where knowledge becomes an asset.
            </p>
            <p>
              Through gamified quizzes, AI-powered verification, and native tokenomics, Geek Protocol empowers learners and builders to earn real value from what they know.
            </p>
          </Section>

          {/* Problem */}
          <Section id="problem" title="The Problem">
            <p className="mb-4">
              Traditional learning platforms offer little incentive beyond certificates. Existing crypto projects are often hype-driven with unclear utility. There&rsquo;s a gap in the market for:
            </p>
            <ul className="space-y-3 mb-6">
              <li className="flex gap-3">
                <span className="text-cyan-400 font-bold">•</span>
                <span>A transparent way to monetize knowledge and competitive gaming</span>
              </li>
              <li className="flex gap-3">
                <span className="text-cyan-400 font-bold">•</span>
                <span>Real blockchain integration that adds utility, not complexity</span>
              </li>
              <li className="flex gap-3">
                <span className="text-cyan-400 font-bold">•</span>
                <span>Community ownership in the project&rsquo;s success</span>
              </li>
            </ul>
          </Section>

          {/* Solution */}
          <Section id="solution" title="The Solution">
            <p className="mb-4">
              Geek Protocol combines three core pillars:
            </p>
            <div className="space-y-6">
              <SolutionBlock
                title="1. Quiz2Earn"
                description="A gamified quiz platform where users compete in timed challenges and earn $GEEK tokens based on performance. Transparent scoring, real rewards, no gatekeeping."
              />
              <SolutionBlock
                title="2. A.C.E. Intelligence"
                description="An AI system that verifies answers, explains mistakes, and personalizes learning paths. Fair, consistent, and transparent across the entire protocol."
              />
              <SolutionBlock
                title="3. Kaspa Network"
                description="Built on Kaspa&rsquo;s fast, scalable blockchain. $GEEK is a KRC-20 token with real liquidity and utility across the ecosystem."
              />
            </div>
          </Section>

          {/* Features */}
          <Section id="features" title="Core Features">
            <div className="space-y-6">
              <FeatureBlock title="Transparent Rewards" description="All scoring and reward calculations are verifiable on-chain. No hidden mechanics." />
              <FeatureBlock title="Competitive Leaderboards" description="Real-time rankings incentivize improvement and community engagement." />
              <FeatureBlock title="Knowledge Verification" description="A.C.E. ensures answer authenticity and learning progression." />
              <FeatureBlock title="Community Governance" description="$GEEK holders participate in protocol decisions and feature voting." />
              <FeatureBlock title="Kaspa Integration" description="Fast, low-cost transactions enable real micro-rewards." />
            </div>
          </Section>

          {/* Tokenomics */}
          <Section id="tokenomics" title="Tokenomics">
            <p className="mb-6">
              <strong>$GEEK</strong> is the native token of Geek Protocol. It serves as:
            </p>
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <TokenomicsItem label="Earning Reward" value="40%" desc="Distributed to Quiz2Earn participants" />
              <TokenomicsItem label="Community" value="30%" desc="Treasury for development and events" />
              <TokenomicsItem label="Founders" value="20%" desc="Team incentives and vesting" />
              <TokenomicsItem label="Reserves" value="10%" desc="Liquidity and partnerships" />
            </div>
            <p className="text-white/70">
              All allocations are locked and vested according to published schedules. Full transparency on blockchain.
            </p>
          </Section>

          {/* Roadmap */}
          <Section id="roadmap" title="Roadmap">
            <div className="space-y-6">
              <RoadmapItem phase="Phase 1: Alpha" timeline="Q1 2025" items={[
                "Quiz2Earn testnet launch",
                "A.C.E. beta integration",
                "Community feedback gathering"
              ]} />
              <RoadmapItem phase="Phase 2: Beta" timeline="Q2 2025" items={[
                "Mainnet token launch",
                "Real rewards distribution",
                "Leaderboard system"
              ]} />
              <RoadmapItem phase="Phase 3: Launch" timeline="Q3 2025" items={[
                "Public mainnet release",
                "DEX listing",
                "Community events"
              ]} />
              <RoadmapItem phase="Phase 4: Expansion" timeline="Q4 2025+" items={[
                "Additional quiz categories",
                "Governance system",
                "Partner integrations"
              ]} />
            </div>
          </Section>

          {/* Closing */}
          <Section title="Join Us">
            <p className="mb-6 text-lg">
              Geek Protocol is more than a game—it&rsquo;s a movement. We&rsquo;re building a community of learners, competitors, and believers in fair, transparent protocols.
            </p>
            <div className="flex flex-wrap gap-4">
              <a href="/play" className="px-6 py-3 bg-gradient-to-r from-cyan-400 to-blue-400 text-black font-bold rounded-lg hover:shadow-[0_0_30px_rgba(0,209,255,0.3)] transition-all">
                Start Playing
              </a>
              <a href="https://t.me/GEEKonKAScommunity" target="_blank" rel="noreferrer" className="px-6 py-3 border border-cyan-400/50 text-cyan-300 font-bold rounded-lg hover:bg-cyan-400/10 transition-all">
                Join Telegram
              </a>
              <a href="https://x.com/geekonkas" target="_blank" rel="noreferrer" className="px-6 py-3 border border-white/20 text-white font-bold rounded-lg hover:border-white/50 transition-all">
                Follow on X
              </a>
            </div>
          </Section>
        </div>

        {/* Footer */}
        <footer className="mt-20 border-t border-white/10 pt-8 text-center text-sm text-white/50">
          <p>© {new Date().getFullYear()} Geek Protocol. All hope, no hype.</p>
        </footer>
      </div>
    </main>
  );
}

function Section({ id, title, children }: { id?: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-20">
      <h2 className="text-3xl md:text-4xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">
        {title}
      </h2>
      <div className="glass rounded-2xl p-8 border border-cyan-400/20 text-white/90 leading-relaxed space-y-4">
        {children}
      </div>
    </section>
  );
}

function SolutionBlock({ title, description }: { title: string; description: string }) {
  return (
    <div className="p-6 rounded-lg bg-white/5 border border-cyan-400/30 hover:border-cyan-400/50 transition-all">
      <h3 className="font-bold text-cyan-300 mb-2">{title}</h3>
      <p className="text-white/80">{description}</p>
    </div>
  );
}

function FeatureBlock({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex gap-4">
      <div className="w-2 h-2 rounded-full bg-cyan-400 mt-2 flex-shrink-0" />
      <div>
        <h4 className="font-bold text-white mb-1">{title}</h4>
        <p className="text-white/70">{description}</p>
      </div>
    </div>
  );
}

function TokenomicsItem({ label, value, desc }: { label: string; value: string; desc: string }) {
  return (
    <div className="p-4 rounded-lg bg-white/5 border border-cyan-400/30">
      <div className="flex items-center justify-between mb-2">
        <span className="font-bold text-white">{label}</span>
        <span className="text-xl font-bold text-cyan-400">{value}</span>
      </div>
      <p className="text-sm text-white/60">{desc}</p>
    </div>
  );
}

function RoadmapItem({ phase, timeline, items }: { phase: string; timeline: string; items: string[] }) {
  return (
    <div className="p-6 rounded-lg bg-gradient-to-r from-cyan-400/10 to-blue-400/10 border border-cyan-400/30">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-xl font-bold text-white">{phase}</h4>
        <span className="px-3 py-1 rounded-full bg-cyan-400/20 text-cyan-300 text-sm font-medium">{timeline}</span>
      </div>
      <ul className="space-y-2">
        {items.map((item, idx) => (
          <li key={idx} className="flex gap-3 text-white/80">
            <span className="text-cyan-400">✓</span>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
