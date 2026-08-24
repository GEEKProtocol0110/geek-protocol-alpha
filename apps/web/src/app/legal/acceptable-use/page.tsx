export const metadata = { title: "Acceptable Use Policy — Geek Protocol" };

export default function AcceptableUsePage() {
  return (
    <>
      <h1 className="text-3xl font-extrabold text-[var(--text-1)]">Acceptable Use Policy</h1>

      <h2 className="pt-4 text-xl font-bold text-[var(--text-1)]">Prohibited</h2>
      <ul className="ml-5 list-disc space-y-1">
        <li>Automating gameplay: bots, scripts, macros, or any tool that answers on your behalf.</li>
        <li>Operating more than one account, or coordinating accounts to increase rewards.</li>
        <li>Sharing, harvesting, or publishing answer keys.</li>
        <li>Colluding on Community Content Engine reviews, including approving a partner&rsquo;s submissions.</li>
        <li>Self-dealing in the sticker marketplace &mdash; trading with yourself or an account you control.</li>
        <li>Attempting to bypass rate limits, anti-cheat checks, entry fees, or reward caps.</li>
        <li>Submitting plagiarised, misleading, offensive, or deliberately incorrect questions.</li>
        <li>Probing, scanning, or attacking the service, other than as permitted by a published security policy.</li>
        <li>Using the service where it is unlawful for you to do so.</li>
      </ul>

      <h2 className="pt-4 text-xl font-bold text-[var(--text-1)]">Consequences</h2>
      <p>
        Depending on severity, we may hold pending rewards, reverse rewards, suspend an
        account&rsquo;s economic activity, or close the account. We will state the reason, and you can
        contest it.
      </p>

      <h2 className="pt-4 text-xl font-bold text-[var(--text-1)]">Security research</h2>
      <p>
        Good-faith reporting of vulnerabilities is welcome. Report privately using the details in
        SECURITY.md in the project repository. Do not access other users&rsquo; data, and do not
        exploit a finding beyond what is needed to demonstrate it.
      </p>
    </>
  );
}
