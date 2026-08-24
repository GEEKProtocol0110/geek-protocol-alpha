import Link from "next/link";

export const metadata = { title: "Report a problem — Geek Protocol" };

const REPO = "https://github.com/GEEKProtocol0110/geek-protocol-alpha";

const ROUTES = [
  {
    title: "A bug, or something that looks wrong",
    body: "Wrong score, a balance that does not add up, a page that will not load, a question with the wrong answer.",
    action: "Open a GitHub issue",
    href: `${REPO}/issues/new`,
    note: "Include what you did, what you expected, and what happened. A screenshot helps.",
  },
  {
    title: "A security vulnerability",
    body: "Anything that could let someone access another account, mint GEEK, or bypass anti-cheat.",
    action: "Read the security policy",
    href: `${REPO}/blob/main/SECURITY.md`,
    note: "Please report privately, not in a public issue. Do not access other users' data while investigating.",
  },
  {
    title: "A reward or account decision you want to contest",
    body: "A held or reversed reward, or a suspended account.",
    action: "Open a GitHub issue",
    href: `${REPO}/issues/new`,
    note: "Include your username and the approximate time. Do not post your email address or private key.",
  },
  {
    title: "A question that is plagiarised, wrong, or offensive",
    body: "Community Content Engine submissions are user-generated and reviewed by other players.",
    action: "Open a GitHub issue",
    href: `${REPO}/issues/new`,
    note: "Include the question text so it can be found.",
  },
];

export default function ReportPage() {
  return (
    <div className="mx-auto max-w-[900px] px-4 py-12 md:px-8">
      <Link href="/" className="text-sm text-[var(--text-3)] hover:text-[var(--brand-primary)]">
        ← Back to Geek Protocol
      </Link>

      <h1 className="mt-6 text-3xl font-extrabold text-[var(--text-1)]">Report a problem</h1>
      <p className="mt-3 text-[var(--text-2)]">
        This is Alpha software and we would rather hear about a problem than not. Pick whichever
        route fits.
      </p>

      <div className="mt-8 space-y-4">
        {ROUTES.map((r) => (
          <div key={r.title} className="flat-card p-6">
            <h2 className="font-bold text-[var(--text-1)]">{r.title}</h2>
            <p className="mt-1 text-sm text-[var(--text-2)]">{r.body}</p>
            <a
              href={r.href}
              target="_blank"
              rel="noopener noreferrer"
              className="flat-btn mt-4 inline-block px-4 py-2 text-sm font-bold"
            >
              {r.action}
            </a>
            <p className="mt-3 text-xs text-[var(--text-3)]">{r.note}</p>
          </div>
        ))}
      </div>

      <div className="flat-card mt-8 p-6">
        <h2 className="font-bold text-[var(--text-1)]">Never share these</h2>
        <p className="mt-2 text-sm text-[var(--text-2)]">
          No one from GEEK Protocol will ever ask for your wallet seed phrase, your private key, or
          your password. Anyone who does is trying to steal from you.
        </p>
      </div>
    </div>
  );
}
