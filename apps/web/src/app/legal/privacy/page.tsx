export const metadata = { title: "Privacy Policy — Geek Protocol" };

const EFFECTIVE = "17 August 2026";

export default function PrivacyPage() {
  return (
    <>
      <h1 className="text-3xl font-extrabold text-[var(--text-1)]">Privacy Policy</h1>
      <p className="text-sm text-[var(--text-3)]">Effective {EFFECTIVE} · Public Alpha</p>

      <h2 className="pt-4 text-xl font-bold text-[var(--text-1)]">What we collect</h2>
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr>
            <th className="border-b border-[var(--ink)] px-2 py-2 text-left font-bold text-[var(--text-1)]">Data</th>
            <th className="border-b border-[var(--ink)] px-2 py-2 text-left font-bold text-[var(--text-1)]">Why</th>
          </tr>
        </thead>
        <tbody>
          {[
            ["Email address and password hash", "To create and secure your account. Passwords are hashed, never stored in plain text."],
            ["Username", "To identify you on leaderboards and in the Community Content Engine."],
            ["Kaspa wallet address", "To link your account to a wallet, and to enforce one rewarded play per wallet per day."],
            ["Encrypted custodial private key (email accounts only)", "To operate a protocol-managed wallet for you. Stored encrypted. See the custodial disclosure below."],
            ["Gameplay records: answers, timings, scores, XP, streaks", "To score your play, calculate rewards, and detect cheating."],
            ["Behavioural signals: input timing and focus patterns during a quiz", "Anti-cheat only. Used to score the likelihood that an attempt was automated."],
            ["IP address and device fingerprint", "Security, rate limiting, and detecting multi-account farming."],
            ["Economy ledger entries", "A permanent record of every GEEK movement affecting your account. Required for solvency accounting."],
            ["Support correspondence", "To answer you."],
          ].map(([what, why]) => (
            <tr key={what}>
              <td className="border-b border-[var(--border-soft)] px-2 py-2 align-top font-semibold text-[var(--text-1)]">{what}</td>
              <td className="border-b border-[var(--border-soft)] px-2 py-2 align-top">{why}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2 className="pt-4 text-xl font-bold text-[var(--text-1)]">What we do not collect</h2>
      <p>
        We do not collect identity documents. KYC collection is currently disabled and will only be
        enabled alongside withdrawals, with its own notice at the point of collection.
      </p>

      <h2 className="pt-4 text-xl font-bold text-[var(--text-1)]">Custodial wallet disclosure</h2>
      <p>
        If you register with an email address, GEEK Protocol generates a Kaspa wallet on your behalf
        and stores its private key encrypted with a key held by the service. This means the service
        can technically act on that wallet. We do not use it other than to operate the features you
        request. If you want sole custody, connect your own wallet instead.
      </p>

      <h2 className="pt-4 text-xl font-bold text-[var(--text-1)]">Sharing</h2>
      <p>
        We do not sell personal data. We share it only with infrastructure providers needed to run
        the service (hosting, database, queueing, error monitoring), and where legally required.
      </p>
      <p>
        Your username, level, XP, streak and public leaderboard position are visible to other users.
        Your email address and wallet balance are not.
      </p>

      <h2 className="pt-4 text-xl font-bold text-[var(--text-1)]">Blockchain data</h2>
      <p>
        Anything that is eventually written to the Kaspa blockchain is public and permanent, and is
        outside our control. During Alpha, no user reward or balance is written on-chain.
      </p>

      <h2 className="pt-4 text-xl font-bold text-[var(--text-1)]">Retention</h2>
      <ul className="ml-5 list-disc space-y-1">
        <li>Account data: for as long as your account exists.</li>
        <li>Economy ledger entries: retained even after account deletion, in anonymised form, because the ledger must continue to reconcile.</li>
        <li>Anti-abuse signals: up to 24 months.</li>
        <li>Server logs: up to 90 days.</li>
      </ul>

      <h2 className="pt-4 text-xl font-bold text-[var(--text-1)]">Your rights</h2>
      <p>
        Depending on where you live, you may have the right to access, correct, export or delete your
        personal data, and to object to certain processing. Contact us to exercise these rights. Note
        that deleting an account does not remove the anonymised ledger entries described above.
      </p>

      <h2 className="pt-4 text-xl font-bold text-[var(--text-1)]">Security</h2>
      <p>
        Passwords are hashed with bcrypt. Custodial keys are encrypted with AES-256. Sessions are
        signed JWTs. No system is perfectly secure, and this one has not yet had an external security
        audit &mdash; a fact you should weigh before storing anything of value here.
      </p>

      <h2 className="pt-4 text-xl font-bold text-[var(--text-1)]">Contact</h2>
      <p>Use the <a className="underline" href="/support/report">Report a problem</a> link or the contact details in the project repository.</p>
    </>
  );
}
