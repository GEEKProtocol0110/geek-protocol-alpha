import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Legal — Geek Protocol",
  description:
    "Terms of Use, Privacy Policy, Alpha Risk Disclosure, and related policies for GEEK Protocol.",
};

const PAGES = [
  { href: "/legal/terms", label: "Terms of Use" },
  { href: "/legal/privacy", label: "Privacy Policy" },
  { href: "/legal/risk", label: "Alpha Risk Disclosure" },
  { href: "/legal/acceptable-use", label: "Acceptable Use" },
  { href: "/legal/community-content", label: "Community Content Terms" },
  { href: "/legal/cookies", label: "Cookies" },
];

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-[1100px] px-4 py-12 md:px-8">
      <nav aria-label="Legal documents" className="mb-10">
        <Link href="/" className="text-sm text-[var(--text-3)] hover:text-[var(--brand-primary)]">
          ← Back to Geek Protocol
        </Link>
        <div className="mt-4 flex flex-wrap gap-2">
          {PAGES.map((p) => (
            <Link key={p.href} href={p.href} className="flat-badge hover:opacity-80">
              {p.label}
            </Link>
          ))}
        </div>
      </nav>

      {/* These documents describe the product honestly, but they have not yet
          been reviewed by a lawyer. That fact is disclosed rather than hidden,
          and purchases, withdrawals and KYC stay disabled until it changes. */}
      <div className="flat-card mb-10 p-5">
        <p className="text-sm text-[var(--text-2)]">
          <strong className="text-[var(--text-1)]">Alpha notice.</strong> These documents are
          published so that anyone using the Alpha can see the terms they are operating under. They
          have not yet completed external legal review. Fiat purchases, withdrawals and KYC
          collection remain disabled until that review is complete.
        </p>
      </div>

      <article className="legal-prose space-y-6 text-[var(--text-2)]">{children}</article>
    </div>
  );
}
