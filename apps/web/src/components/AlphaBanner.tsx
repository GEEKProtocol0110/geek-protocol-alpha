/**
 * The Public Alpha status banner (ECONOMY.md §19.5, §19.6).
 *
 * The text is resolved on the server so the disclosure is present in the
 * initial HTML — for search engines, for screen readers, and for anyone whose
 * scripts have not run. A status disclosure that only appears after hydration
 * is not a disclosure.
 *
 * Presentation is handed to a client child that lets a reader collapse the
 * notice once they have read it. It collapses to a one-line badge rather than
 * vanishing: §19.5 asks for a persistent status indicator, and the full text
 * stays one tap away.
 */

import { ALPHA_BANNER, fetchPublicEconomyConfig } from "@/lib/economy";
import AlphaBannerClient from "./AlphaBannerClient";

export default async function AlphaBanner() {
  const config = await fetchPublicEconomyConfig();

  // If the API is unreachable we still show the banner. Failing open here would
  // mean an outage silently removes the disclosure.
  const show = config ? config.alpha : true;
  if (!show) return null;

  const text = config?.banner ?? ALPHA_BANNER;

  return <AlphaBannerClient title={text.title} body={text.body} />;
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
