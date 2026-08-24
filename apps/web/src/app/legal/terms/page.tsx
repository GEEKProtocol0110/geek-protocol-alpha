export const metadata = { title: "Terms of Use — Geek Protocol" };

const EFFECTIVE = "17 August 2026";

export default function TermsPage() {
  return (
    <>
      <h1 className="text-3xl font-extrabold text-[var(--text-1)]">Terms of Use</h1>
      <p className="text-sm text-[var(--text-3)]">Effective {EFFECTIVE} · Public Alpha</p>

      <h2 className="pt-4 text-xl font-bold text-[var(--text-1)]">1. What GEEK Protocol is</h2>
      <p>
        GEEK Protocol is a knowledge-based game (&ldquo;Proof-of-Learning&rdquo;) built around the
        Kaspa blockchain. You answer questions; the protocol scores them server-side and credits XP
        and an internal GEEK balance.
      </p>
      <p>
        <strong className="text-[var(--text-1)]">
          During Alpha, your GEEK balance is an internal record in the GEEK Protocol database.
        </strong>{" "}
        It is not a KRC-20 token balance held by your wallet, it is not transferable, and it cannot
        be withdrawn. On-chain settlement is still being built.
      </p>

      <h2 className="pt-4 text-xl font-bold text-[var(--text-1)]">2. Eligibility</h2>
      <ul className="ml-5 list-disc space-y-1">
        <li>You must be at least 18 years old, or the age of majority where you live, whichever is higher.</li>
        <li>You must not be resident in, or accessing the service from, a jurisdiction where participation would be unlawful.</li>
        <li>You must not be subject to sanctions that would prohibit us from providing the service.</li>
        <li>One account per person. Operating multiple accounts to increase rewards is prohibited.</li>
      </ul>

      <h2 className="pt-4 text-xl font-bold text-[var(--text-1)]">3. Accounts and wallets</h2>
      <p>
        You may sign in with a Kaspa wallet (KasWare) using a signature challenge, or create an
        account with an email address and password.
      </p>
      <p>
        <strong className="text-[var(--text-1)]">Custodial wallet disclosure.</strong> If you create
        an email account, GEEK Protocol generates a Kaspa wallet for you and stores its private key
        encrypted on our servers. This is a custodial arrangement: we hold the key, and we can
        therefore be compelled to act on it, and a compromise of our systems could expose it. If you
        want sole control of your keys, connect your own wallet instead. Do not store value in a
        protocol-managed wallet that you are not willing to lose.
      </p>

      <h2 className="pt-4 text-xl font-bold text-[var(--text-1)]">4. Rewards</h2>
      <ul className="ml-5 list-disc space-y-1">
        <li>Rewards are discretionary and are subject to daily and monthly budgets, per-user caps, and anti-abuse controls.</li>
        <li>Reward rates, entry fees, prices and limits are configuration values and may change at any time. The current values are published by the protocol API and shown in the product.</li>
        <li>A reward may be granted in part, or not at all, when a budget is exhausted. Gameplay continues and XP is still awarded.</li>
        <li>Rewards may be held in a pending state during a validation period, and may be reversed if the underlying activity is found to be fraudulent.</li>
        <li>Nothing in the product is a promise of future monetary value.</li>
      </ul>

      <h2 className="pt-4 text-xl font-bold text-[var(--text-1)]">5. Entry fees and in-game purchases</h2>
      <p>
        Some game modes charge a GEEK entry fee, and some items (power-ups, sticker packs) cost GEEK.
        These are spent from your internal Alpha balance. Entry fees are consumed when the round
        settles: 70% returns to the reward pool and 30% is recorded as a pending burn. Fees are not
        refundable except where these terms or the game rules explicitly provide a refund.
      </p>
      <p>
        Geek Dust is a non-transferable crafting resource. It cannot be converted into GEEK and
        cannot be withdrawn.
      </p>

      <h2 className="pt-4 text-xl font-bold text-[var(--text-1)]">6. Prohibited conduct</h2>
      <p>See the <a className="underline" href="/legal/acceptable-use">Acceptable Use Policy</a>. In summary: no automation, no multiple accounts, no answer sharing, no review collusion, no self-dealing, no attempts to bypass anti-cheat or rate limits.</p>

      <h2 className="pt-4 text-xl font-bold text-[var(--text-1)]">7. Suspension and forfeiture</h2>
      <p>
        We may suspend an account&rsquo;s economic activity, hold pending rewards, or reverse rewards
        where we reasonably believe these terms have been breached. Where we do, we will tell you the
        reason and you may contest it by contacting us.
      </p>

      <h2 className="pt-4 text-xl font-bold text-[var(--text-1)]">8. Purchases and withdrawals</h2>
      <p>
        Fiat purchases and on-chain withdrawals are currently <strong className="text-[var(--text-1)]">disabled</strong>.
        If they are enabled in future, additional terms &mdash; including identity verification for
        amounts above a published threshold, limits, fees, and a settlement hold on purchased GEEK
        &mdash; will apply and will be published before the feature is available.
      </p>

      <h2 className="pt-4 text-xl font-bold text-[var(--text-1)]">9. No investment, no guarantee</h2>
      <p>
        GEEK Protocol does not offer an investment product. GEEK is not offered as a security, and
        nothing here is financial advice. See the{" "}
        <a className="underline" href="/legal/risk">Alpha Risk Disclosure</a>.
      </p>

      <h2 className="pt-4 text-xl font-bold text-[var(--text-1)]">10. Changes to the service</h2>
      <p>
        This is Alpha software. Features may change or be removed, data may be reset, and economic
        parameters may be adjusted. Material changes to these terms will be posted here with a new
        effective date.
      </p>

      <h2 className="pt-4 text-xl font-bold text-[var(--text-1)]">11. Liability</h2>
      <p>
        The service is provided &ldquo;as is&rdquo;. To the fullest extent permitted by law, GEEK
        Protocol is not liable for indirect or consequential loss, for loss of internal Alpha
        balances, or for loss arising from a third-party wallet, blockchain, or indexer. Nothing
        excludes liability that cannot lawfully be excluded.
      </p>

      <h2 className="pt-4 text-xl font-bold text-[var(--text-1)]">12. Contact</h2>
      <p>
        Questions about these terms, or a decision you want to contest: use the{" "}
        <a className="underline" href="/support/report">Report a problem</a> link, or the contact
        details published in the project repository.
      </p>
    </>
  );
}
