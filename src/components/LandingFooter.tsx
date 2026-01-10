import Link from "next/link";
import Image from "next/image";

export function LandingFooter() {
  return (
    <footer className="relative border-t border-white/10 bg-black/50 py-16 md:py-20">
      <div className="mx-auto max-w-6xl px-6">
        {/* Main footer content */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-8 w-8 rounded-lg bg-white/10 border border-cyan-400/30 grid place-items-center">
                <span className="text-cyan-400 font-bold">GP</span>
              </div>
              <div>
                <h3 className="font-bold text-white">Geek Protocol</h3>
                <p className="text-xs text-white/50">Alpha</p>
              </div>
            </div>
            <p className="text-sm text-white/60">
              Knowledge is power. Turn it into assets on Kaspa.
            </p>
          </div>

          {/* Product */}
          <div className="space-y-4">
            <h4 className="font-semibold text-white">Product</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="/play" className="text-white/70 hover:text-cyan-300 transition-colors">
                  Play (Quiz2Earn)
                </a>
              </li>
              <li>
                <a href="#features" className="text-white/70 hover:text-cyan-300 transition-colors">
                  Features
                </a>
              </li>
              <li>
                <a href="https://kaspa-lens.com/krc20-tokens/details/?ticker=GEEK" target="_blank" rel="noreferrer" className="text-white/70 hover:text-cyan-300 transition-colors">
                  $GEEK Token
                </a>
              </li>
            </ul>
          </div>

          {/* Community */}
          <div className="space-y-4">
            <h4 className="font-semibold text-white">Community</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="https://x.com/geekonkas" target="_blank" rel="noreferrer" className="text-white/70 hover:text-cyan-300 transition-colors">
                  Twitter/X
                </a>
              </li>
              <li>
                <a href="https://t.me/GEEKonKAScommunity" target="_blank" rel="noreferrer" className="text-white/70 hover:text-cyan-300 transition-colors">
                  Telegram
                </a>
              </li>
              <li>
                <a href="https://kaspa-lens.com" target="_blank" rel="noreferrer" className="text-white/70 hover:text-cyan-300 transition-colors">
                  Kaspa Lens
                </a>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div className="space-y-4">
            <h4 className="font-semibold text-white">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#" className="text-white/70 hover:text-cyan-300 transition-colors">
                  Terms of Service
                </a>
              </li>
              <li>
                <a href="#" className="text-white/70 hover:text-cyan-300 transition-colors">
                  Privacy Policy
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/10 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-sm text-white/50">
            © {new Date().getFullYear()} Geek Protocol. All rights reserved.
          </div>

          <div className="flex items-center gap-6">
            <a
              href="https://x.com/geekonkas"
              target="_blank"
              rel="noreferrer"
              className="text-white/50 hover:text-cyan-300 transition-colors text-sm"
            >
              X
            </a>
            <a
              href="https://t.me/GEEKonKAScommunity"
              target="_blank"
              rel="noreferrer"
              className="text-white/50 hover:text-cyan-300 transition-colors text-sm"
            >
              Telegram
            </a>
            <a
              href="https://kaspa.com"
              target="_blank"
              rel="noreferrer"
              className="text-white/50 hover:text-cyan-300 transition-colors text-sm"
            >
              Kaspa
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
