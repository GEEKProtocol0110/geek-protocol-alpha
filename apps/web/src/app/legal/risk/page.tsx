export const metadata = { title: "Alpha Risk Disclosure — Geek Protocol" };

export default function RiskPage() {
  const RISKS = [
    ["Your GEEK balance is not on-chain", "During Alpha, balances are records in the GEEK Protocol database. The KRC-20 transfer path is not finished. You cannot withdraw, transfer, or sell an Alpha balance."],
    ["Balances may be reset", "This is pre-release software. Economic parameters, and in the worst case balances themselves, may be reset before Beta. Do not treat an Alpha balance as savings."],
    ["No security audit", "Neither the application nor the economy has completed an external security audit. Bugs that affect balances are possible."],
    ["Reward parameters are not final", "Reward rates, entry fees, caps and budgets are tunable configuration and are actively being tested. What you earn today is not a guide to what you will earn later."],
    ["Rewards can be refused or reversed", "Rewards are subject to budgets, per-user caps and anti-cheat checks. A reward can be granted in part, withheld, or reversed if the activity behind it is found to be fraudulent."],
    ["Custodial wallet risk", "Email accounts use a wallet whose private key the service holds, encrypted. A compromise of the service could expose it."],
    ["No investment", "GEEK is not offered as an investment, a security, or a claim on the project. There is no guarantee of price, liquidity, or future value. There is no staking system."],
    ["Token price risk", "If GEEK ever becomes transferable to you, its market value may be volatile and may be zero."],
    ["Regulatory risk", "Rules governing tokens and play-to-earn products differ by jurisdiction and are changing. Features may be restricted or withdrawn in your country."],
    ["Third-party dependency", "The protocol depends on Kaspa, on Kasplex and compatible indexers, and on hosting providers. Failures there can interrupt the service."],
  ];

  return (
    <>
      <h1 className="text-3xl font-extrabold text-[var(--text-1)]">Alpha Risk Disclosure</h1>
      <p className="text-sm text-[var(--text-3)]">Read this before you spend time or money here.</p>

      <div className="flat-card p-5">
        <p className="text-[var(--text-1)]">
          <strong>The short version.</strong> GEEK Protocol is unaudited Alpha software. Your GEEK
          balance is an internal database record, not a token in your wallet. You cannot withdraw it.
          Reward rules can change. Balances could be reset. Treat this as a game you are helping
          test, not as an earning opportunity.
        </p>
      </div>

      <dl className="space-y-4">
        {RISKS.map(([title, body]) => (
          <div key={title} className="flat-card p-5">
            <dt className="font-bold text-[var(--text-1)]">{title}</dt>
            <dd className="mt-1 text-sm">{body}</dd>
          </div>
        ))}
      </dl>

      <h2 className="pt-4 text-xl font-bold text-[var(--text-1)]">What we do to limit the risk</h2>
      <ul className="ml-5 list-disc space-y-1">
        <li>Every GEEK movement is written to an immutable ledger and reconciled against stored balances.</li>
        <li>Treasury balances, total user liabilities and remaining reward capacity are published publicly.</li>
        <li>Rewards stop rather than being created unfunded when a budget or the reserve is exhausted.</li>
        <li>Withdrawals and fiat purchases stay disabled until the transfer path is implemented and externally audited.</li>
        <li>No burn is recorded as confirmed without a real on-chain transaction.</li>
      </ul>
    </>
  );
}
