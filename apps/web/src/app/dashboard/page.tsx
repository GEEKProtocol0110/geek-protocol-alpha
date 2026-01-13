"use client";

import { LandingFooter } from "@/components/LandingFooter";

export default function DashboardLanding() {
  return (
    <main className="w-full min-h-screen bg-black text-white">
      {/* Hero Section with Lore */}
      <section className="relative overflow-hidden border-b border-purple-500/20">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-black to-cyan-900/20"></div>
        <div className="relative max-w-6xl mx-auto px-6 py-24">
          <div className="text-center space-y-6">
            <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
              Welcome, Geek
            </h1>
            <p className="text-2xl md:text-3xl text-purple-200 font-light">
              Your Knowledge Arsenal
            </p>
            <div className="h-1 w-32 mx-auto bg-gradient-to-r from-purple-500 to-cyan-500 rounded-full"></div>
          </div>
        </div>
      </section>

      {/* Lore Section */}
      <section className="relative py-20 border-b border-purple-500/20">
        <div className="max-w-5xl mx-auto px-6 space-y-12">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-4xl font-bold text-purple-300">The Legend Begins</h2>
            <div className="h-1 w-24 mx-auto bg-gradient-to-r from-purple-500 to-cyan-500 rounded-full"></div>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Lore Card 1 */}
            <div className="group relative bg-gradient-to-br from-purple-950/50 to-cyan-950/50 p-8 rounded-2xl border border-purple-500/20 hover:border-purple-400/40 transition-all duration-300">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/0 to-cyan-500/0 group-hover:from-purple-500/10 group-hover:to-cyan-500/10 rounded-2xl transition-all duration-300"></div>
              <div className="relative space-y-4">
                <div className="text-4xl mb-4">⚡</div>
                <h3 className="text-2xl font-bold text-purple-300">The Awakening</h3>
                <p className="text-gray-300 leading-relaxed">
                  In the digital age, knowledge became fragmented—scattered across endless feeds, buried in noise. 
                  But the wise knew: true power lies not in what you scroll, but in what you <span className="text-purple-400 font-semibold">master</span>.
                </p>
                <p className="text-gray-400 italic text-sm">
                  "The first Geeks emerged not from schools, but from late-night wikis, from speedruns, from Easter eggs hidden in forgotten code."
                </p>
              </div>
            </div>

            {/* Lore Card 2 */}
            <div className="group relative bg-gradient-to-br from-pink-950/50 to-purple-950/50 p-8 rounded-2xl border border-pink-500/20 hover:border-pink-400/40 transition-all duration-300">
              <div className="absolute inset-0 bg-gradient-to-br from-pink-500/0 to-purple-500/0 group-hover:from-pink-500/10 group-hover:to-purple-500/10 rounded-2xl transition-all duration-300"></div>
              <div className="relative space-y-4">
                <div className="text-4xl mb-4">🎮</div>
                <h3 className="text-2xl font-bold text-pink-300">The Gauntlet</h3>
                <p className="text-gray-300 leading-relaxed">
                  Legends speak of the <span className="text-pink-400 font-semibold">Geek Gauntlet</span>—ten trials of wit, 
                  where only those who truly know can claim their reward. Each category a realm, each question a boss fight.
                </p>
                <p className="text-gray-400 italic text-sm">
                  "Speed matters. Accuracy is king. But wisdom? Wisdom is what separates the casual from the legendary."
                </p>
              </div>
            </div>

            {/* Lore Card 3 */}
            <div className="group relative bg-gradient-to-br from-cyan-950/50 to-blue-950/50 p-8 rounded-2xl border border-cyan-500/20 hover:border-cyan-400/40 transition-all duration-300">
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/0 to-blue-500/0 group-hover:from-cyan-500/10 group-hover:to-blue-500/10 rounded-2xl transition-all duration-300"></div>
              <div className="relative space-y-4">
                <div className="text-4xl mb-4">💎</div>
                <h3 className="text-2xl font-bold text-cyan-300">The Protocol</h3>
                <p className="text-gray-300 leading-relaxed">
                  Built on Kaspa's lightning foundation, the <span className="text-cyan-400 font-semibold">Geek Protocol</span> transforms 
                  neurons into tokens. Your mind becomes your treasury. Your knowledge, liquid.
                </p>
                <p className="text-gray-400 italic text-sm">
                  "In the old world, you studied for grades. In the new world, you earn while you master the lore."
                </p>
              </div>
            </div>

            {/* Lore Card 4 */}
            <div className="group relative bg-gradient-to-br from-purple-950/50 to-pink-950/50 p-8 rounded-2xl border border-purple-500/20 hover:border-purple-400/40 transition-all duration-300">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/0 to-pink-500/0 group-hover:from-purple-500/10 group-hover:to-pink-500/10 rounded-2xl transition-all duration-300"></div>
              <div className="relative space-y-4">
                <div className="text-4xl mb-4">🏆</div>
                <h3 className="text-2xl font-bold text-purple-300">Your Legacy</h3>
                <p className="text-gray-300 leading-relaxed">
                  Every correct answer writes your name in the ledger. Every streak builds your legend. 
                  The <span className="text-purple-400 font-semibold">leaderboard</span> remembers. The blockchain never forgets.
                </p>
                <p className="text-gray-400 italic text-sm">
                  "They say the top Geeks don't just play for rewards—they play for immortality. Their scores,永遠に eternal."
                </p>
              </div>
            </div>
          </div>

          {/* Quote Section */}
          <div className="mt-16 text-center space-y-6 p-12 bg-gradient-to-r from-purple-900/20 via-pink-900/20 to-cyan-900/20 rounded-3xl border border-purple-500/30">
            <div className="text-6xl mb-4">🌟</div>
            <blockquote className="text-2xl md:text-3xl font-light text-purple-200 leading-relaxed">
              "In the age of information,<br />
              <span className="text-transparent bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text font-semibold">
                knowledge is the only true currency.
              </span>"
            </blockquote>
            <p className="text-cyan-400 text-sm tracking-widest uppercase">— The Geek Manifesto</p>
          </div>

          {/* CTA */}
          <div className="text-center pt-12">
            <a
              href="/play"
              className="inline-block px-12 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white text-xl font-bold rounded-full transition-all duration-300 shadow-lg hover:shadow-purple-500/50 hover:scale-105"
            >
              Enter the Gauntlet
            </a>
            <p className="mt-4 text-gray-400 text-sm">Your legend awaits.</p>
          </div>
        </div>
      </section>

      <LandingFooter />
    </main>
  );
}
