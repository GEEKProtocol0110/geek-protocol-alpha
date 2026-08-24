/**
 * The Public Alpha status banner (ECONOMY.md §19.5, §19.6).
 *
 * Server component with no client JavaScript, so the disclosure is present in
 * the initial HTML — for search engines, for screen readers, and for anyone
 * whose scripts have not run. A status disclosure that only appears after
 * hydration is not a disclosure.
 */

import { ALPHA_BANNER, fetchPublicEconomyConfig } from "@/lib/economy";

export default async function AlphaBanner() {
  const config = await fetchPublicEconomyConfig();

  // If the API is unreachable we still show the banner. Failing open here would
  // mean an outage silently removes the disclosure.
  const show = config ? config.alpha : true;
  if (!show) return null;

  const text = config?.banner ?? ALPHA_BANNER;

  return (
    <aside
      role="status"
      aria-label="Platform status"
      className="w-full border-b-2 border-[var(--ink)] bg-[var(--surface-2)] px-4 py-3 text-[var(--text-1)]"
    >
      <div className="mx-auto flex max-w-[1400px] flex-col gap-1 sm:flex-row sm:items-baseline sm:gap-3">
        <span className="flat-badge shrink-0 font-bold uppercase tracking-wide">{text.title}</span>
        <p className="text-sm leading-snug opacity-90">{text.body}</p>
      </div>
    </aside>
  );
}

/**
 * Inline variant for pages that show a balance. Wherever a GEEK number appears,
 * the reader should be able to tell what kind of number it is.
 */
export function AlphaBalanceNote({ className = "" }: { className?: string }) {
  return (
    <p className={`text-xs text-[var(--text-3)] ${className}`}>
      Internal Alpha balance. Not an on-chain KRC-20 token balance; withdrawals are not enabled yet.
    </p>
  );
}
