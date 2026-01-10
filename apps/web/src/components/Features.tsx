import Image from "next/image";

interface FeatureProps {
  icon: string;
  title: string;
  description: string;
  details?: string[];
}

export function Features() {
  return (
    <section id="features" className="relative py-20 md:py-32 bg-gradient-to-b from-black to-black/50">
      {/* Background effects */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-96 w-96 rounded-full bg-cyan-500/5 blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto max-w-6xl px-6">
        {/* Section header */}
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
            How It Works
          </h2>
          <p className="text-xl text-white/60 max-w-2xl mx-auto">
            A complete ecosystem for knowledge seekers, competitive gamers, and crypto enthusiasts
          </p>
        </div>

        {/* Features grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <FeatureCard
            icon="🧠"
            title="Quiz2Earn"
            description="Test your knowledge through gamified quizzes"
            details={[
              "10-question runs with timers",
              "Real-time scoring",
              "Earn $GEEK tokens",
              "Leaderboard rankings"
            ]}
          />

          <FeatureCard
            icon="🤖"
            title="A.C.E. Intelligence"
            description="AI-powered verification and guidance system"
            details={[
              "Answer verification",
              "Explanation engine",
              "Real-time feedback",
              "Smart analytics"
            ]}
          />

          <FeatureCard
            icon="⚡"
            title="Kaspa Network"
            description="Built on a fast, scalable blockchain"
            details={[
              "KRC-20 token standard",
              "Instant transactions",
              "Low fees",
              "High throughput"
            ]}
          />
        </div>

        {/* Additional info */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-8">
          <InfoBlock
            title="$GEEK Token"
            description="The native currency of Geek Protocol"
            points={[
              "Earn through Quiz2Earn gameplay",
              "Trade on DEXs and marketplaces",
              "Stake for exclusive features",
              "Governance participation"
            ]}
          />

          <InfoBlock
            title="Why Geek Protocol?"
            description="The future of knowledge-based gaming"
            points={[
              "All hope, no hype philosophy",
              "Community-driven development",
              "Transparent tokenomics",
              "Real utility for learners"
            ]}
          />
        </div>
      </div>
    </section>
  );
}

function FeatureCard({ icon, title, description, details }: FeatureProps) {
  return (
    <div className="group relative glass rounded-2xl p-8 h-full hover:border-cyan-400/50 transition-all duration-300 hover:shadow-[0_0_30px_rgba(0,209,255,0.2)]">
      <div className="space-y-4">
        <div className="text-5xl">{icon}</div>
        <h3 className="text-2xl font-bold text-white">{title}</h3>
        <p className="text-white/70">{description}</p>

        {details && (
          <ul className="space-y-2 pt-4 border-t border-white/10">
            {details.map((detail, idx) => (
              <li key={idx} className="flex items-center gap-2 text-sm text-white/60">
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
                {detail}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function InfoBlock({ title, description, points }: { title: string; description: string; points: string[] }) {
  return (
    <div className="glass rounded-2xl p-8 border border-cyan-400/20 hover:border-cyan-400/50 transition-all duration-300">
      <h3 className="text-2xl font-bold text-cyan-300 mb-2">{title}</h3>
      <p className="text-white/70 mb-6">{description}</p>
      <ul className="space-y-3">
        {points.map((point, idx) => (
          <li key={idx} className="flex items-start gap-3">
            <span className="mt-1 h-2 w-2 rounded-full bg-cyan-400 flex-shrink-0" />
            <span className="text-white/80">{point}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
