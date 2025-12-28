import Link from "next/link";

export function TopBar() {
  return (
    <header className="w-full border-b border-white/10 bg-black/20 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link href="/" className="font-semibold tracking-wide">
          <span className="text-cyan-300">GEEK</span> <span className="text-white/80">Protocol</span>
        </Link>
        <nav className="flex items-center gap-4 text-sm text-white/70">
          <Link className="hover:text-white" href="/play">Play</Link>
          <a
            className="hover:text-white"
            href="https://x.com/geekonkas"
            target="_blank"
            rel="noreferrer"
          >
            X
          </a>
          <a
            className="hover:text-white"
            href="https://t.me/GEEKonKAScommunity"
            target="_blank"
            rel="noreferrer"
          >
            Telegram
          </a>
        </nav>
      </div>
    </header>
  );
}
