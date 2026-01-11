"use client";

import { useWallet } from "@/components/WalletProvider";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { getCurrentUser, getUserRewards, type CurrentUser, type RewardRecord } from "@/lib/api";

export default function DashboardPage() {
  const { address, sessionVersion } = useWallet();
  const router = useRouter();
  const [sessionUser, setSessionUser] = useState<CurrentUser | null>(null);
  const [rewardHistory, setRewardHistory] = useState<RewardRecord[]>([]);
  const [rewardsLoading, setRewardsLoading] = useState(false);
  const [rewardsError, setRewardsError] = useState<string | null>(null);
  
  // Mock player stats
  const [playerStats] = useState({
    balance: 1250,
    currentRound: 3,
    sessionWinnings: 450,
    canCashOut: true,
    highestRound: 7,
    totalWins: 23,
    winRate: 76
  });

  // Round progression costs (Round 1 is FREE)
  const roundCosts = [0, 50, 100, 200, 400, 800, 1600, 3200, 6400, 12800];
  const roundRewards = [50, 100, 200, 400, 800, 1600, 3200, 6400, 12800, 25000];

  useEffect(() => {
    if (!address) {
      router.push("/");
    }
  }, [address, router]);

  useEffect(() => {
    let mounted = true;

    if (!address) {
      setSessionUser(null);
      setRewardHistory([]);
      setRewardsError(null);
      setRewardsLoading(false);
      return;
    }

    setRewardsLoading(true);
    setRewardsError(null);

    (async () => {
      try {
        const user = await getCurrentUser();
        if (!mounted) return;

        if (!user) {
          setSessionUser(null);
          setRewardHistory([]);
          setRewardsError("Complete the KasWare signature to enable Earn Mode rewards.");
          return;
        }

        setSessionUser(user);
        const rewards = await getUserRewards(user.id);
        if (!mounted) return;
        setRewardHistory(rewards);
      } catch (err) {
        if (!mounted) return;
        setSessionUser(null);
        setRewardHistory([]);
        setRewardsError(err instanceof Error ? err.message : "Failed to load rewards");
      } finally {
        if (mounted) {
          setRewardsLoading(false);
        }
      }
    })();

    return () => {
      mounted = false;
    };
  }, [address, sessionVersion]);

  if (!address) return null;

  return (
    <main className="w-full min-h-screen bg-black text-white pb-12 relative overflow-hidden">
      {/* Cyberpunk grid background */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(20,184,166,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(34,197,94,0.03)_1px,transparent_1px)] bg-[size:50px_50px] [mask-image:radial-gradient(ellipse_at_center,black_50%,transparent_100%)]" />

      <div className="relative z-10 mx-auto max-w-7xl px-6 pt-8">
        {/* Header Section - Enhanced Game Show Style */}
        <div className="mb-8 text-center relative">
          {/* Spotlight effect */}
          <div className="absolute inset-0 bg-gradient-to-b from-cyan-400/5 via-transparent to-transparent blur-2xl" />
          
          <div className="relative">
            <div className="inline-flex items-center gap-2 rounded-full border border-teal-400/30 bg-gradient-to-r from-teal-400/10 to-emerald-400/10 px-4 py-2 text-xs text-teal-300 mb-4 animate-pulse">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping absolute" />
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              <span className="font-bold font-mono">⚡ LIVE</span> • The Ultimate Challenge
            </div>
            
            <h1 className="text-6xl md:text-7xl font-black tracking-tighter mb-4 animate-in font-mono">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 via-emerald-400 to-cyan-400 drop-shadow-[0_0_30px_rgba(20,184,166,0.5)]">
                GEEK GAUNTLET
              </span>
            </h1>
            <div className="flex items-center justify-center gap-3 mb-4">
              <span className="text-3xl text-teal-400">★</span>
              <span className="text-3xl text-emerald-400">★</span>
              <span className="text-3xl text-cyan-400">★</span>
            </div>
            <p className="text-xl text-white/70 max-w-2xl mx-auto mb-2">
              10 Rounds. 100 Questions. One Champion.
            </p>
            <p className="text-sm text-emerald-300/60 font-mono">
              // Survive • Earn • Ascend
            </p>
          </div>
        </div>

        {/* User Stats Bar - Enhanced */}
        <div className="mb-8 grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard icon="💰" label="Your Balance" value={`${playerStats.balance.toLocaleString()} $GEEK`} trend="+12%" color="emerald" />
          <StatCard icon="🎯" label="Current Round" value={`Round ${playerStats.currentRound}/10`} trend={playerStats.canCashOut ? "Can Cash Out" : undefined} color="teal" />
          <StatCard icon="🏆" label="Highest Round" value={`Round ${playerStats.highestRound}`} trend={`${playerStats.totalWins} Wins`} color="cyan" />
          <StatCard icon="📊" label="Win Rate" value={`${playerStats.winRate}%`} trend="+3%" color="emerald" />
        </div>

        {/* Main Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Side - The Gauntlet */}
          <div className="lg:col-span-2 space-y-6">
            {/* Mode Description */}
            <div className="rounded-2xl glass p-6 border-2 border-teal-500/30 shadow-[0_0_40px_rgba(20,184,166,0.15)]">
              <div className="flex items-start gap-4 mb-4">
                <div className="text-5xl">🎯</div>
                <div className="flex-1">
                  <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-emerald-400 mb-2">
                    The Geek Gauntlet
                  </h2>
                  <p className="text-white/70 leading-relaxed">
                    The ultimate test of knowledge and nerve. Face 10 progressive rounds with 10 questions each. 
                    Round 1 is <span className="text-emerald-400 font-bold">FREE</span>, but each subsequent round requires an entry fee from your winnings.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 p-4 rounded-xl bg-gradient-to-r from-teal-500/5 to-emerald-500/5 border border-teal-400/20">
                <div className="text-center">
                  <div className="text-2xl mb-1">⏱️</div>
                  <div className="text-xs text-white/50 mb-1 font-mono">TIMER</div>
                  <div className="text-sm font-bold text-emerald-300">15 seconds</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl mb-1">❓</div>
                  <div className="text-xs text-white/50 mb-1 font-mono">TOTAL Q's</div>
                  <div className="text-sm font-bold text-teal-300">100 Questions</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl mb-1">💎</div>
                  <div className="text-xs text-white/50 mb-1 font-mono">MAX PRIZE</div>
                  <div className="text-sm font-bold text-cyan-300">25,000 $GEEK</div>
                </div>
              </div>
            </div>

            {/* Round Progression Table */}
            <div className="rounded-2xl glass p-6 border border-white/20">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <span>📊</span> Round Progression
              </h3>
              
              <div className="space-y-2">
                {roundCosts.map((cost, index) => {
                  const roundNum = index + 1;
                  const reward = roundRewards[index];
                  const isCurrentRound = roundNum === playerStats.currentRound;
                  const isPassed = roundNum < playerStats.currentRound;
                  const isLocked = roundNum > playerStats.currentRound;
                  
                  return (
                    <div
                      key={roundNum}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        isCurrentRound
                          ? "bg-gradient-to-r from-teal-500/10 to-emerald-500/10 border-teal-500/50 shadow-lg shadow-teal-500/20"
                          : isPassed
                          ? "bg-gradient-to-r from-emerald-500/5 to-cyan-500/5 border-emerald-400/30"
                          : "bg-white/5 border-white/20 opacity-60"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`text-2xl font-black font-mono ${
                            isCurrentRound ? "text-teal-400" : isPassed ? "text-emerald-400" : "text-white/40"
                          }`}>
                            {isPassed ? "✓" : isCurrentRound ? "▶" : roundNum}
                          </div>
                          <div>
                            <div className="text-sm font-bold text-white">
                              Round {roundNum}
                              {roundNum === 1 && <span className="ml-2 px-2 py-0.5 rounded-full bg-emerald-400/20 text-emerald-400 text-xs font-mono">FREE</span>}
                              {isCurrentRound && <span className="ml-2 px-2 py-0.5 rounded-full bg-fuchsia-400/20 text-fuchsia-400 text-xs font-mono">ACTIVE</span>}
                            </div>
                            <div className="text-xs text-white/50 font-mono">10 Questions • 15s each</div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-6">
                          <div className="text-right">
                            <div className="text-xs text-white/50 mb-1 font-mono">ENTRY FEE</div>
                            <div className={`text-sm font-bold ${cost === 0 ? "text-emerald-400" : "text-orange-400"}`}>
                              {cost === 0 ? "FREE" : `${cost.toLocaleString()} $GEEK`}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-xs text-white/50 mb-1 font-mono">REWARD</div>
                            <div className="text-sm font-bold text-teal-400">
                              {reward.toLocaleString()} $GEEK
                            </div>
                          </div>
                          {isLocked && (
                            <div className="text-2xl opacity-30">🔒</div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {playerStats.canCashOut && playerStats.currentRound > 1 && (
                <button
                  onClick={() => {
                    // Cash out logic
                  }}
                  className="py-4 rounded-xl bg-gradient-to-r from-emerald-400/20 to-green-400/20 border-2 border-emerald-400/50 text-emerald-300 font-black text-lg hover:shadow-[0_0_30px_rgba(16,185,129,0.4)] transition-all"
                >
                  💰 Cash Out ({playerStats.sessionWinnings} $GEEK)
                </button>
              )}
              
              <button
                onClick={() => {
                  router.push("/play?mode=gauntlet");
                }}
                className="py-4 rounded-xl bg-gradient-to-r from-teal-500 via-emerald-500 to-cyan-400 text-black font-black text-lg hover:shadow-[0_0_40px_rgba(20,184,166,0.6)] transition-all transform hover:scale-[1.02]"
              >
                {playerStats.currentRound === 1 ? "🎮 Start Gauntlet" : `▶️ Continue Round ${playerStats.currentRound}`}
              </button>
            </div>
          </div>

          {/* Right Sidebar - Info Panel */}
          <div className="space-y-6">
            {/* Start Gauntlet CTA */}
            <div className="relative rounded-2xl glass p-6 border-2 border-teal-500/30 shadow-[0_0_40px_rgba(20,184,166,0.15)] overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-teal-400/5 via-emerald-400/5 to-cyan-400/5 animate-pulse" />
              
              <div className="relative text-center space-y-4">
                <div className="text-5xl animate-bounce">⚡</div>
                <h3 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-teal-400 via-emerald-400 to-cyan-400">
                  START GAUNTLET
                </h3>
                <p className="text-sm text-white/70 leading-relaxed">
                  Begin your journey through 10 rounds of ultimate knowledge testing
                </p>
                <div className="space-y-2 text-xs text-white/60">
                  <div className="flex items-center justify-between px-3 py-1 rounded bg-gradient-to-r from-emerald-500/5 to-teal-500/5 border border-emerald-400/20">
                    <span className="font-mono">Round 1</span>
                    <span className="text-emerald-400 font-bold font-mono">FREE ENTRY</span>
                  </div>
                  <div className="flex items-center justify-between px-3 py-1 rounded bg-gradient-to-r from-teal-500/5 to-cyan-500/5 border border-teal-400/20">
                    <span className="font-mono">15s per question</span>
                    <span className="text-teal-400">⏱️</span>
                  </div>
                  <div className="flex items-center justify-between px-3 py-1 rounded bg-gradient-to-r from-cyan-500/5 to-emerald-500/5 border border-cyan-400/20">
                    <span className="font-mono">Cash out anytime</span>
                    <span className="text-cyan-400">💰</span>
                  </div>
                </div>
                <Link
                  href="/play?mode=gauntlet"
                  className="block w-full py-4 rounded-xl bg-gradient-to-r from-teal-500/30 via-emerald-500/30 to-cyan-400/30 border-2 border-teal-500/50 font-black text-lg hover:from-teal-500/40 hover:via-emerald-500/40 hover:to-cyan-400/40 hover:shadow-[0_0_30px_rgba(20,184,166,0.4)] transition-all transform hover:scale-105"
                >
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-emerald-400">
                    PLAY NOW →
                  </span>
                </Link>
              </div>
            </div>

            <RewardHistoryPanel
              loading={rewardsLoading}
              error={rewardsError}
              rewards={rewardHistory}
              hasSession={Boolean(sessionUser)}
            />

            {/* Round Rewards Preview */}
            <div className="rounded-2xl glass p-6 border-2 border-cyan-400/30 bg-gradient-to-br from-cyan-400/5 via-teal-400/5 to-emerald-400/5">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-white">🏆 Grand Prize</h3>
                  <span className="px-2 py-1 rounded-full bg-gradient-to-r from-cyan-400/20 to-fuchsia-400/20 text-cyan-400 text-xs font-bold font-mono">
                    ROUND 10
                  </span>
                </div>
                <div className="text-center py-4">
                  <div className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-400 to-emerald-400 mb-2">
                    25,000 $GEEK
                  </div>
                  <p className="text-xs text-white/50">
                    Complete all 10 rounds to claim the ultimate prize
                  </p>
                </div>
                
                <div className="space-y-1 pt-3 border-t border-white/10">
                  <div className="text-xs text-white/50 mb-2 font-mono">KEY MILESTONES:</div>
                  {[
                    { round: 5, reward: "800 $GEEK", color: "emerald" },
                    { round: 7, reward: "3,200 $GEEK", color: "teal" },
                    { round: 9, reward: "12,800 $GEEK", color: "cyan" }
                  ].map((item) => (
                    <div key={item.round} className={`flex justify-between text-xs px-2 py-1 rounded bg-gradient-to-r from-${item.color}-500/5 to-cyan-500/5 border border-${item.color}-400/20`}>
                      <span className="text-white/60 font-mono">Round {item.round}</span>
                      <span className={`text-${item.color}-400 font-bold`}>{item.reward}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Practice Mode */}
            <div className="rounded-2xl glass p-6 border border-white/20">
              <div className="text-center space-y-4">
                <div className="text-4xl">🎯</div>
                <h3 className="text-xl font-bold text-white">Practice Mode</h3>
                <p className="text-sm text-white/60 leading-relaxed">
                  Test your knowledge without risking $GEEK. Perfect for warming up!
                </p>
                <Link
                  href="/play?mode=practice"
                  className="block w-full py-3 rounded-xl bg-white/5 border-2 border-white/20 text-white font-bold hover:bg-white/10 hover:border-white/30 transition-all"
                >
                  Practice Now
                </Link>
              </div>
            </div>

            {/* Leaderboard Preview */}
            <div className="rounded-2xl glass p-6 border border-purple-400/20">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-white">🏆 Top Players</h3>
                  <Link href="/leaderboard" className="text-xs text-cyan-400 hover:text-cyan-300">
                    View All →
                  </Link>
                </div>
                <div className="space-y-2">
                  {[
                    { rank: 1, name: "CryptoKing", score: "15.2K", icon: "👑" },
                    { rank: 2, name: "QuizMaster", score: "14.8K", icon: "🥈" },
                    { rank: 3, name: "BrainBox", score: "14.1K", icon: "🥉" },
                  ].map((player) => (
                    <div key={player.rank} className="flex items-center justify-between p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-all">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{player.icon}</span>
                        <div>
                          <div className="text-sm font-semibold text-white">{player.name}</div>
                          <div className="text-xs text-white/40">Rank #{player.rank}</div>
                        </div>
                      </div>
                      <div className="text-sm font-bold text-cyan-300">{player.score}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* How It Works */}
            <div className="rounded-2xl glass p-6 border border-white/10">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <span>📋</span> How It Works
              </h3>
              <ul className="space-y-3 text-sm text-white/70">
                <li className="flex items-start gap-3 p-2 rounded-lg hover:bg-white/5 transition-all">
                  <span className="text-cyan-400 font-black text-base mt-0.5">1</span>
                  <span>Round 1 is FREE to enter—start your journey risk-free</span>
                </li>
                <li className="flex items-start gap-3 p-2 rounded-lg hover:bg-white/5 transition-all">
                  <span className="text-cyan-400 font-black text-base mt-0.5">2</span>
                  <span>Answer 10 questions per round in 15 seconds each</span>
                </li>
                <li className="flex items-start gap-3 p-2 rounded-lg hover:bg-white/5 transition-all">
                  <span className="text-cyan-400 font-black text-base mt-0.5">3</span>
                  <span>Use your winnings to pay for the next round's entry fee</span>
                </li>
                <li className="flex items-start gap-3 p-2 rounded-lg hover:bg-white/5 transition-all">
                  <span className="text-cyan-400 font-black text-base mt-0.5">4</span>
                  <span>Cash out after any completed round to secure your earnings</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

function StatCard({ icon, label, value, trend, color = "emerald" }: { icon: string; label: string; value: string; trend?: string; color?: "emerald" | "teal" | "cyan" }) {
  const colorMap = {
    emerald: "from-emerald-400/0 to-emerald-400/0 group-hover:from-emerald-400/5 group-hover:to-emerald-400/5 border-emerald-400/30",
    teal: "from-teal-400/0 to-teal-400/0 group-hover:from-teal-400/5 group-hover:to-teal-400/5 border-teal-400/30",
    cyan: "from-cyan-400/0 to-cyan-400/0 group-hover:from-cyan-400/5 group-hover:to-cyan-400/5 border-cyan-400/30"
  };
  
  const textColorMap = {
    emerald: "text-emerald-300",
    teal: "text-teal-300",
    cyan: "text-cyan-300"
  };
  
  return (
    <div className="relative rounded-xl glass p-5 text-center border border-white/10 hover:border-teal-400/30 transition-all group overflow-hidden">
      <div className={`absolute inset-0 bg-gradient-to-br ${colorMap[color]} transition-all`} />
      <div className="relative">
        <div className="text-3xl mb-2">{icon}</div>
        <div className="text-xs text-white/50 uppercase tracking-wide mb-1 font-mono">{label}</div>
        <div className={`text-xl font-black ${textColorMap[color]}`}>{value}</div>
        {trend && (
          <div className={`text-xs font-semibold mt-1 ${trend.startsWith('+') || trend.startsWith('↑') ? 'text-emerald-400' : 'text-fuchsia-400'}`}>
            {trend}
          </div>
        )}
      </div>
    </div>
  );
}

function RewardHistoryPanel({
  loading,
  error,
  rewards,
  hasSession,
}: {
  loading: boolean;
  error: string | null;
  rewards: RewardRecord[];
  hasSession: boolean;
}) {
  return (
    <div className="rounded-2xl glass p-6 border border-emerald-400/30 bg-black/30">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-white">💎 Reward Activity</h3>
        {loading && <span className="text-xs text-white/60">Syncing…</span>}
      </div>

      {error ? (
        <p className="text-sm text-red-400">{error}</p>
      ) : !hasSession ? (
        <p className="text-sm text-white/60">
          Connect and sign the KasWare prompt to unlock Earn Mode rewards.
        </p>
      ) : rewards.length === 0 ? (
        <p className="text-sm text-white/60">No rewards yet — finish a run to see payouts.</p>
      ) : (
        <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
          {rewards.map((reward) => (
            <RewardRow key={reward.id} reward={reward} />
          ))}
        </div>
      )}
    </div>
  );
}

function RewardRow({ reward }: { reward: RewardRecord }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-white">{formatRewardAmount(reward.amount)}</p>
          <p className="text-xs text-white/50">
            {new Date(reward.createdAt).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
          </p>
        </div>
        <div className="text-right">
          <span className={`text-[11px] font-semibold px-3 py-1 rounded-full ${getStatusBadgeColor(reward.status)}`}>
            {reward.status}
          </span>
          {reward.txid && (
            <p className="mt-1 text-[10px] text-white/50 font-mono">{reward.txid.slice(0, 10)}…</p>
          )}
        </div>
      </div>
      {reward.error && <p className="mt-1 text-xs text-red-400">{reward.error}</p>}
    </div>
  );
}

function formatRewardAmount(amount: string) {
  const numeric = Number(amount);
  if (!Number.isFinite(numeric)) {
    return `${amount} sats`;
  }
  return `${numeric.toLocaleString()} sats`;
}

function getStatusBadgeColor(status: RewardRecord["status"]) {
  const palette: Record<RewardRecord["status"], string> = {
    PENDING: "border-yellow-500/40 bg-yellow-500/10 text-yellow-200",
    SENT: "border-cyan-400/40 bg-cyan-400/10 text-cyan-200",
    CONFIRMED: "border-emerald-500/40 bg-emerald-500/10 text-emerald-200",
    FAILED: "border-red-500/40 bg-red-500/10 text-red-200",
  };
  return palette[status] || "border-white/20 bg-white/10 text-white";
}
