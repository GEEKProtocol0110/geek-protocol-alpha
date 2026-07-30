import Link from "next/link";
import type { Metadata } from "next";
import { Navbar } from "@/components/Navbar";
import AlphaStats from "@/components/AlphaStats";

export const metadata: Metadata = {
  title: "Litepaper · Geek Protocol",
  description:
    "How Geek Protocol turns demonstrated knowledge into on-chain rewards on Kaspa: proof of learning, the reward pipeline, the creator economy, and what is and isn't built yet.",
};

const REPO = "https://github.com/GEEKProtocol0110/geek-protocol-alpha";

const SECTIONS = [
  { id: "summary", label: "Summary" },
  { id: "alpha", label: "Live alpha" },
  { id: "proof", label: "Proof of learning" },
  { id: "rewards", label: "Reward pipeline" },
  { id: "creator", label: "Creator economy" },
  { id: "integrity", label: "Integrity & anti-abuse" },
  { id: "status", label: "What's built" },
  { id: "risks", label: "Risks" },
];

function Section({
  id,
  n,
  title,
  children,
}: {
  id: string;
  n: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24 mb-16">
      <div className="flex items-baseline gap-3 mb-4">
        <span className="text-[var(--brand-accent)] font-extrabold text-sm tabular-nums">{n}</span>
        <h2 className="text-2xl md:text-3xl font-extrabold text-[var(--text-1)]">{title}</h2>
      </div>
      <div className="space-y-4 text-[var(--text-2)] leading-relaxed">{children}</div>
    </section>
  );
}

export default function LitepaperPage() {
  return (
    <div className="min-h-screen text-[var(--text-1)]">
      <Navbar />

      <main className="max-w-[1100px] mx-auto px-4 md:px-8 py-12 md:py-20">
        <header className="mb-12">
          <span className="flat-badge">Litepaper · Alpha</span>
          <h1 className="font-extrabold text-4xl md:text-6xl mt-4 text-[var(--text-1)]">
            Knowledge, made liquid.
          </h1>
          <p className="text-lg md:text-xl text-[var(--text-2)] mt-4 max-w-[720px]">
            Geek Protocol pays people for what they actually know. Answer correctly, under
            time pressure, and the protocol settles $GEEK to your Kaspa wallet. This
            document explains how that works, and is honest about what is still unfinished.
          </p>
        </header>

        {/* Contents */}
        <nav aria-label="Contents" className="flat-card p-6 mb-16">
          <h2 className="text-sm font-bold uppercase tracking-widest text-[var(--text-3)] mb-4">
            Contents
          </h2>
          <ol className="grid sm:grid-cols-2 gap-x-8 gap-y-2">
            {SECTIONS.map((s, i) => (
              <li key={s.id} className="flex gap-3">
                <span className="text-[var(--text-3)] tabular-nums text-sm">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <a
                  href={`#${s.id}`}
                  className="text-[var(--text-2)] hover:text-[var(--brand-primary)] font-medium"
                >
                  {s.label}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <Section id="summary" n="01" title="Summary">
          <p>
            Most quiz apps reward luck, persistence, or attention — you tap, you earn, and
            the payout has nothing to do with whether you knew anything. Geek Protocol
            makes the reward a direct function of demonstrated knowledge: correct answers,
            answered quickly, verified on a server the player does not control, settled on
            Kaspa.
          </p>
          <p>
            Three properties carry the design. Answers never reach the browser, so they
            cannot be read out of the page. Scoring happens server-side against a signed
            attempt token, so a player cannot report their own result. And payouts are
            queued and idempotent, so the same attempt cannot be paid twice.
          </p>
        </Section>

        <Section id="alpha" n="02" title="Live alpha">
          <p>
            The numbers below are read live from the alpha database every 60 seconds. They
            are real aggregates, including when they are small — a project asking you to
            connect a wallet should not be inventing its own traction.
          </p>
          <div className="mt-6">
            <AlphaStats />
          </div>
        </Section>

        <Section id="proof" n="03" title="Proof of learning">
          <p>
            When a player starts a round, the server selects the questions, shuffles the
            options for that attempt specifically, and issues an{" "}
            <strong className="text-[var(--text-1)]">attempt token</strong> — an HMAC-signed
            payload holding the question set, the post-shuffle correct indices, and the
            server&apos;s own issue timestamp.
          </p>
          <p>
            The client receives the questions and options. It never receives the answers.
            On submission the server verifies the token signature in constant time, scores
            the answers against the copy inside the token, and validates the timing against
            its own clock rather than the client&apos;s claim.
          </p>
          <div className="flat-card p-6">
            <h3 className="font-bold text-[var(--text-1)] mb-3">Four conditions for a payout</h3>
            <ol className="space-y-2 list-decimal list-inside">
              <li>The wallet is authenticated against a server-issued challenge.</li>
              <li>The attempt is scored server-side from a valid, unexpired token.</li>
              <li>The payout job is enqueued and processed by the reward worker.</li>
              <li>The transaction is confirmed and the status is shown to the player.</li>
            </ol>
          </div>
        </Section>

        <Section id="rewards" n="04" title="Reward pipeline">
          <p>
            Settlement runs through a sharded queue. Payouts are distributed across
            independent lanes, each with its own worker and concurrency, so throughput
            scales with lanes multiplied by per-lane concurrency rather than being pinned
            to one transaction at a time.
          </p>
          <p>
            Lane assignment is deterministic on the payout key. The same attempt always
            lands on the same lane, so a retry can never race the original on a different
            worker, and payouts for one player stay ordered relative to each other.
          </p>
          <div className="flat-card p-6">
            <h3 className="font-bold text-[var(--text-1)] mb-3">Double-spend protection</h3>
            <p>
              Three independent layers, because paying twice is worse than paying late: a
              deterministic job id so a duplicate enqueue is dropped by the queue itself, a
              Redis lock held for 24 hours after success, and unique database constraints
              on the attempt id. Any one of them alone would stop a double payout.
            </p>
          </div>
          <p className="text-sm text-[var(--text-3)]">
            Per-lane queue depth is exposed at <code>/health/payouts</code> for monitoring.
          </p>
        </Section>

        <Section id="creator" n="05" title="Creator economy">
          <p>
            From Level 10, players can write questions and review other people&apos;s.
            Approved questions enter the live rotation and earn their author a share each
            time they are served; reviewers earn a smaller amount per review.
          </p>
          <p>
            This is the part of the protocol with the most obvious attack surface, since it
            pays people to produce and approve content. The safeguards are described below
            rather than glossed over.
          </p>
        </Section>

        <Section id="integrity" n="06" title="Integrity & anti-abuse">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="flat-card p-6">
              <h3 className="font-bold text-[var(--text-1)] mb-3">Against automation</h3>
              <ul className="space-y-2 text-sm">
                <li>Correct answers are never sent to the client.</li>
                <li>Options are reshuffled per attempt, so answer positions can&apos;t be memorised.</li>
                <li>Question text is rendered to canvas, not selectable DOM text.</li>
                <li>
                  Speed bonuses are bounded by the server&apos;s clock, so under-reporting
                  your own answer times earns nothing.
                </li>
                <li>Submissions faster than a human could read are rejected outright.</li>
                <li>Interaction telemetry flags suspicious attempts for review.</li>
              </ul>
            </div>
            <div className="flat-card p-6">
              <h3 className="font-bold text-[var(--text-1)] mb-3">Against review collusion</h3>
              <ul className="space-y-2 text-sm">
                <li>Reviewers can&apos;t choose what they review — questions are served at random.</li>
                <li>Authorship is hidden from reviewers.</li>
                <li>You must win real games before you may vote at all.</li>
                <li>A hard daily review cap bounds what any one account can earn.</li>
                <li>A weekly per-author cap stops a ring waving through its own submissions.</li>
                <li>
                  Agreement with final consensus is tracked, and persistent
                  rubber-stamping suspends the account from reviewing.
                </li>
              </ul>
            </div>
          </div>
          <p className="text-sm">
            One honest caveat: canvas rendering and behavioural signals raise the cost of a
            naive bot, but neither is a wall. Canvas is still glyphs and OCR reads it;
            telemetry is client-reported and therefore forgeable. They are treated as
            signals that flag an attempt for review, never as gates that withhold a payout,
            because a false positive there means refusing to pay a real player. The
            load-bearing defences are the server-side ones.
          </p>
        </Section>

        <Section id="status" n="07" title="What's built, and what isn't">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="flat-card p-6">
              <h3 className="font-bold text-[var(--text-1)] mb-3">Working today</h3>
              <ul className="space-y-2 text-sm">
                <li>Server-side scored quiz, gauntlet and daily modes</li>
                <li>Wallet login via single-use signed challenge</li>
                <li>Sharded, idempotent payout pipeline with health metrics</li>
                <li>Creator submission, randomised peer review, leaderboards</li>
                <li>Stickers, streaks, XP and levelling</li>
              </ul>
            </div>
            <div className="flat-card p-6">
              <h3 className="font-bold text-[var(--text-1)] mb-3">Not done yet</h3>
              <ul className="space-y-2 text-sm">
                <li>Third-party security audit — not yet started</li>
                <li>Mainnet $GEEK deployment (alpha runs on testnet)</li>
                <li>On-chain confirmation polling rather than post-broadcast settlement</li>
                <li>Tournament infrastructure at scale</li>
                <li>Mobile applications</li>
              </ul>
            </div>
          </div>
        </Section>

        <Section id="risks" n="08" title="Risks">
          <div className="flat-card p-6">
            <h3 className="font-bold text-[var(--text-1)] mb-3">Read this part</h3>
            <ul className="space-y-3 text-sm">
              <li>
                <strong className="text-[var(--text-1)]">Pre-audit software.</strong> No
                third-party security audit has been completed. Treat the alpha accordingly.
              </li>
              <li>
                <strong className="text-[var(--text-1)]">Testnet phase.</strong> The alpha
                runs against Kaspa testnet. Testnet tokens have no monetary value.
              </li>
              <li>
                <strong className="text-[var(--text-1)]">Custodial wallets.</strong>{" "}
                Accounts created with email receive a protocol-generated wallet whose key is
                held encrypted by the protocol. Connecting your own KasWare wallet avoids
                this.
              </li>
              <li>
                <strong className="text-[var(--text-1)]">Economic parameters are not final.</strong>{" "}
                Reward rates, caps and thresholds are tuned during alpha and will change.
              </li>
              <li>
                <strong className="text-[var(--text-1)]">Not financial advice.</strong>{" "}
                Nothing here is an offer, a solicitation, or a promise of future value.
              </li>
            </ul>
          </div>
        </Section>

        <footer className="flat-card p-8 text-center">
          <h2 className="text-2xl font-extrabold text-[var(--text-1)] mb-2">
            Read the source
          </h2>
          <p className="text-[var(--text-2)] mb-6">
            Everything described here is open source and MIT licensed.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <a
              href={REPO}
              target="_blank"
              rel="noopener noreferrer"
              className="flat-btn flat-btn-primary px-6 py-3 font-bold"
            >
              GitHub repository
            </a>
            <Link href="/gauntlet/setup" className="flat-btn px-6 py-3 font-bold">
              Play the alpha
            </Link>
          </div>
          <p className="text-xs text-[var(--text-3)] mt-6">
            Alpha litepaper · subject to change as the protocol develops.
          </p>
        </footer>
      </main>
    </div>
  );
}
