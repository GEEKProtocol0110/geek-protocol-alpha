import Link from "next/link";

const FOOTER_LINKS = [
  {
    title: "Product",
    links: [
      { label: "Geek Gauntlet", href: "/play" },
      { label: "Features", href: "#features" },
      { label: "Leaderboard", href: "/leaderboard" },
    ],
  },
  {
    title: "Protocol",
    links: [
      { label: "$GEEK Token", href: "https://kaspa-lens.com/krc20-tokens/details/?ticker=GEEK", external: true },
      { label: "Litepaper", href: "/litepaper" },
      { label: "Implementation", href: "/litepaper" },
    ],
  },
  {
    title: "Community",
    links: [
      { label: "X (Twitter)", href: "https://x.com/geekonkas", external: true },
      { label: "Telegram", href: "https://t.me/GEEKonKAScommunity", external: true },
      { label: "Kaspa", href: "https://kaspa.org", external: true },
    ],
  },
];

export function LandingFooter() {
  return (
    <footer className="relative border-t border-white/5 bg-[rgba(0,0,0,0.7)] py-16">
      <div className="pointer-events-none absolute inset-0 opacity-30" aria-hidden>
        <div className="grid-overlay" />
      </div>
      <div className="relative z-10 mx-auto max-w-6xl px-6">
        <div className="grid gap-10 md:grid-cols-[1.2fr_1fr_1fr_1fr]">
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <div className="grid size-12 place-items-center rounded-3xl border border-white/10 bg-white/5 text-sm font-bold text-[var(--brand-primary)]">
                GP
              </div>
              <div>
                <p className="text-lg font-semibold text-white">Geek Protocol</p>
                <p className="text-xs uppercase tracking-[0.3em] text-white/50">All hope, no hype.</p>
              </div>
            </div>
            <p className="text-sm text-white/65">
              A Kaspa-native play layer converting knowledge into programmable, measurable rewards. Built for founders, creators, and the ecosystems they galvanize.
            </p>
            <div className="flex gap-3">
              <a
                href="https://x.com/geekonkas"
                target="_blank"
                rel="noreferrer"
                className="rounded-full border border-white/15 px-4 py-2 text-xs uppercase tracking-wide text-white/70 transition hover:bg-white/5"
              >
                X
              </a>
              <a
                href="https://t.me/GEEKonKAScommunity"
                target="_blank"
                rel="noreferrer"
                className="rounded-full border border-white/15 px-4 py-2 text-xs uppercase tracking-wide text-white/70 transition hover:bg-white/5"
              >
                Telegram
              </a>
            </div>
          </div>

          {FOOTER_LINKS.map((column) => (
            <div key={column.title} className="space-y-4">
              <h4 className="text-sm font-semibold uppercase tracking-wide text-white/60">{column.title}</h4>
              <ul className="space-y-2 text-sm text-white/70">
                {column.links.map((link) => (
                  <li key={link.label}>
                    {link.external ? (
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noreferrer"
                        className="transition hover:text-white"
                      >
                        {link.label}
                      </a>
                    ) : (
                      <Link href={link.href} className="transition hover:text-white">
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t border-white/10 pt-6 text-sm text-white/60 md:flex-row md:items-center md:justify-between">
          <div>© {new Date().getFullYear()} Geek Protocol. All rights reserved.</div>
          <div className="flex flex-wrap gap-4">
            <Link href="/" className="hover:text-white">
              Terms
            </Link>
            <Link href="/" className="hover:text-white">
              Privacy
            </Link>
            <span className="text-white/40">Kaspa mainnet ready</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
