/**
 * The Gauntlet round table, read from the protocol.
 *
 * This replaces a hardcoded table that had drifted away from the running game:
 * the site advertised 75, 125, 200, 350, 500, 750 and 1,000 GEEK per correct
 * answer for rounds 4–10, while the backend was paying 80, 150, 280, 450, 700,
 * 1,100 and 1,800 — and the site said 15 seconds per question while the
 * Gauntlet enforced 20.
 *
 * Nothing here is a literal. Every number comes from
 * `GET /api/economy/public-config`, which reads the same runtime config the game
 * charges and pays from, so the two cannot disagree again (ECONOMY.md §19.4).
 *
 * Server component: the table is in the initial HTML, so it is visible without
 * JavaScript and indexable.
 */

import { fetchPublicEconomyConfig, type GauntletRound } from "@/lib/economy";

const DIFFICULTY_TONE: Record<string, string> = {
  easy: "var(--brand-primary)",
  "easy-medium": "var(--brand-primary)",
  medium: "var(--brand-accent)",
  "medium-hard": "var(--brand-accent)",
  hard: "var(--brand-tertiary)",
  "very-hard": "var(--brand-secondary)",
  expert: "var(--brand-secondary)",
};

function geek(n: number): string {
  return `${n.toLocaleString()} GEEK`;
}

export default async function GauntletRoundsTable() {
  const config = await fetchPublicEconomyConfig();

  // Honest unavailable state. Never a table of zeros, and never stale
  // hardcoded numbers standing in for live ones.
  if (!config) {
    return (
      <div className="flat-card p-6">
        <p className="text-sm text-[var(--text-2)]">
          The live round table is served by the protocol API and could not be reached right now.
          Entry fees and rewards are configuration, not fixed values — check the in-game Gauntlet
          screen for the current table.
        </p>
      </div>
    );
  }

  const { rounds, questionSeconds, questionsPerRound, maxRewardPerRunGeek } = config.gauntlet;

  return (
    <div className="flat-card overflow-x-auto p-2">
      <table className="w-full border-collapse text-sm">
        <caption className="px-3 pb-2 pt-1 text-left text-xs text-[var(--text-3)]">
          Live values from the protocol economy configuration · {questionsPerRound} questions per
          round · {questionSeconds} seconds per question · maximum {geek(maxRewardPerRunGeek)} per run
        </caption>
        <thead>
          <tr>
            {["Rnd", "Entry", "Reward/Q", "Max Earn", "B/E", "Diff"].map((h) => (
              <th
                key={h}
                scope="col"
                className="text-left px-3 py-2 text-[var(--text-3)] text-[10px] tracking-widest uppercase font-bold"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rounds.map((r: GauntletRound) => (
            <tr key={r.round} className="hover:bg-[var(--flat-cream)] transition">
              <td className="px-3 py-2 border-b border-[var(--border-soft)] text-[var(--brand-primary)] font-bold">
                {String(r.round).padStart(2, "0")}
              </td>
              <td className="px-3 py-2 border-b border-[var(--border-soft)]">
                {r.fee === 0 ? "Free" : geek(r.fee)}
              </td>
              <td className="px-3 py-2 border-b border-[var(--border-soft)]">{geek(r.rewardPerCorrect)}</td>
              <td className="px-3 py-2 border-b border-[var(--border-soft)]">{geek(r.maxRoundReward)}</td>
              <td className="px-3 py-2 border-b border-[var(--border-soft)]">{r.breakEvenCorrect}</td>
              <td className="px-3 py-2 border-b border-[var(--border-soft)]">
                <span
                  className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
                  style={{
                    color: DIFFICULTY_TONE[r.difficulty] ?? "var(--brand-primary)",
                    background: "var(--surface-2)",
                  }}
                >
                  {r.label}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="px-3 py-3 text-xs text-[var(--text-3)]">
        Entry fees are charged from your available Alpha GEEK balance and are settled when the round
        ends: 70% returns to the reward pool, 30% is booked to pending burn. Rewards are subject to
        daily reward budgets — if a budget is exhausted, play continues for XP.
      </p>
    </div>
  );
}
