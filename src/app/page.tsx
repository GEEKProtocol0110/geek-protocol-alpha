import Image from "next/image";

export default function Home() {
  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-6xl px-6 py-14">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-white/10 border border-white/10 grid place-items-center overflow-hidden">
  <Image
    src="/logo.png"
    alt="Geek Protocol"
    width={40}
    height={40}
    className="h-10 w-10 object-contain"
    priority
  />
</div>

            <div className="leading-tight">
              <div className="font-semibold tracking-tight">Geek Protocol</div>
              <div className="text-xs text-white/60">Your Knowledge is Now an Asset</div>
            </div>
          </div>

          <nav className="hidden sm:flex items-center gap-3 text-sm">
            <a
              className="rounded-lg border border-white/10 px-3 py-2 hover:bg-white/5"
              href="https://kaspa-lens.com/krc20-tokens/details/?ticker=GEEK"
              target="_blank"
              rel="noreferrer"
            >
              $GEEK Token
            </a>
            <a
              className="rounded-lg border border-white/10 px-3 py-2 hover:bg-white/5"
              href="https://kaspa.com/tokens/marketplace/token/GEEK"
              target="_blank"
              rel="noreferrer"
            >
              Marketplace
            </a>
            <a
              className="rounded-lg border border-white/10 px-3 py-2 hover:bg-white/5"
              href="https://x.com/geekonkas"
              target="_blank"
              rel="noreferrer"
            >
              X
            </a>
            <a
              className="rounded-lg border border-white/10 px-3 py-2 hover:bg-white/5"
              href="https://t.me/GEEKonKAScommunity"
              target="_blank"
              rel="noreferrer"
            >
              Telegram
            </a>
          </nav>
        </header>

        <section className="mt-14 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-white/70">
              <span className="h-2 w-2 rounded-full bg-green-400" />
              Alpha Starter • Local build running
            </p>

            <h1 className="mt-5 text-4xl md:text-6xl font-semibold tracking-tight">
              Learn. Compete. Earn. Collect.
            </h1>

            <p className="mt-5 text-base md:text-lg text-white/70 max-w-xl">
              Geek Protocol is a gamified Web3 ecosystem on Kaspa powered by <b>$GEEK (KRC-20)</b>.
              Turn knowledge into progression — and progression into an economy.
            </p>

            <p className="mt-3 text-sm text-white/60">
              <b>Mantra:</b> All hope, no hype.
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <a
                href="/play"
                className="rounded-xl bg-white text-black px-5 py-3 font-medium hover:opacity-90"
              >
                Start Alpha (Play)
              </a>

              <a
                href="https://kaspa-lens.com/krc20-tokens/details/?ticker=GEEK"
                target="_blank"
                rel="noreferrer"
                className="rounded-xl border border-white/15 px-5 py-3 font-medium hover:bg-white/5"
              >
                View $GEEK
              </a>

              <a
                href="https://t.me/GEEKonKAScommunity"
                target="_blank"
                rel="noreferrer"
                className="rounded-xl border border-white/15 px-5 py-3 font-medium hover:bg-white/5"
              >
                Join Telegram
              </a>
            </div>

            <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Feature title="Quiz2Earn" desc="Short quiz runs, scoring, and reward logic (testnet MVP)." />
              <Feature title="A.C.E." desc="The AI mind of the protocol — guides, verifies, and explains." />
              <Feature title="Built on Kaspa" desc="Fast, scalable foundation with KRC-20 token utility." />
            </div>
          </div>

          <div className="relative">
            <div className="rounded-3xl border border-white/10 bg-gradient-to-b from-white/10 to-white/5 p-6 overflow-hidden">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold">Geek Protocol Preview</div>
                <div className="text-xs text-white/60">Alpha</div>
              </div>

              <div className="mt-5 grid grid-cols-1 gap-4">
                <CardLine label="Mode" value="Geek Gauntlet (Alpha)" />
                <CardLine label="Run" value="10 Questions • Timed" />
                <CardLine label="Rewards" value="Testnet (coming)" />
                <CardLine label="Wallet" value="Kasware (soon)" />
              </div>

              <div className="mt-6 rounded-2xl border border-white/10 bg-black/30 p-4">
                <div className="text-xs text-white/60">A.C.E. Status</div>
                <div className="mt-2 font-medium">
                  “Knowledge verified. Progression authorized.”
                </div>
              </div>
            </div>

            <div className="pointer-events-none absolute -top-6 -right-6 h-28 w-28 rounded-full bg-white/10 blur-2xl" />
            <div className="pointer-events-none absolute -bottom-6 -left-6 h-28 w-28 rounded-full bg-white/10 blur-2xl" />
          </div>
        </section>

        <footer className="mt-16 border-t border-white/10 pt-8 text-xs text-white/50 flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
          <div>© {new Date().getFullYear()} Geek Protocol</div>
          <div className="flex gap-3">
            <a className="hover:text-white/80" href="https://x.com/geekonkas" target="_blank" rel="noreferrer">X</a>
            <a className="hover:text-white/80" href="https://t.me/GEEKonKAScommunity" target="_blank" rel="noreferrer">Telegram</a>
            <a className="hover:text-white/80" href="https://kaspa-lens.com/krc20-tokens/details/?ticker=GEEK" target="_blank" rel="noreferrer">$GEEK</a>
          </div>
        </footer>
      </div>
    </main>
  );
}

function Feature({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="font-semibold text-sm">{title}</div>
      <div className="mt-2 text-xs text-white/70">{desc}</div>
    </div>
  );
}

function CardLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3">
      <div className="text-xs text-white/60">{label}</div>
      <div className="text-sm font-medium">{value}</div>
    </div>
  );
}
