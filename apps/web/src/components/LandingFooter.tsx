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
    <footer className="relative border-t border-[var(--border-soft)] bg-white py-16">
      <div className="relative z-10 mx-auto max-w-6xl px-6">
        <div className="grid gap-10 md:grid-cols-[1.2fr_1fr_1fr_1fr]">
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <div className="grid size-12 place-items-center rounded-3xl bg-[var(--brand-primary)] text-sm font-bold text-white">
                GP
              </div>
              <div>
                <p className="text-lg font-extrabold text-[var(--text-1)]">Geek Protocol</p>
                <p className="text-xs uppercase tracking-[0.2em] text-[var(--text-3)]">All hope, no hype.</p>
              </div>
            </div>
            <p className="text-sm text-[var(--text-3)]">
              A Kaspa-native play layer converting knowledge into programmable, measurable rewards. Built for founders, creators, and the ecosystems they galvanize.
            </p>
            <div className="flex gap-3">
              <a
                href="https://x.com/geekonkas"
                target="_blank"
                rel="noreferrer"
                className="rounded-full border border-[var(--border-soft)] px-4 py-2 text-xs uppercase tracking-wide text-[var(--text-2)] transition hover:bg-[var(--surface-2)]"
              >
                X
              </a>
              <a
                href="https://t.me/GEEKonKAScommunity"
                target="_blank"
                rel="noreferrer"
                className="rounded-full border border-[var(--border-soft)] px-4 py-2 text-xs uppercase tracking-wide text-[var(--text-2)] transition hover:bg-[var(--surface-2)]"
              >
                Telegram
              </a>
            </div>
          </div>

          {FOOTER_LINKS.map((column) => (
            <div key={column.title} className="space-y-4">
              <h4 className="text-sm font-bold uppercase tracking-wide text-[var(--brand-primary)]">{column.title}</h4>
              <ul className="space-y-2 text-sm text-[var(--text-3)]">
                {column.links.map((link) => (
                  <li key={link.label}>
                    {link.external ? (
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noreferrer"
                        className="transition hover:text-[var(--brand-primary)]"
                      >
                        {link.label}
                      </a>
                    ) : (
                      <Link href={link.href} className="transition hover:text-[var(--brand-primary)]">
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t border-[var(--border-soft)] pt-6 text-sm text-[var(--text-3)] md:flex-row md:items-center md:justify-between">
          <div>© {new Date().getFullYear()} Geek Protocol. All rights reserved.</div>
          <div className="flex flex-wrap gap-4">
            <Link href="/" className="hover:text-[var(--brand-primary)]">
              Terms
            </Link>
            <Link href="/" className="hover:text-[var(--brand-primary)]">
              Privacy
            </Link>
            <span className="text-[var(--brand-secondary)] font-semibold">Kaspa mainnet ready</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
