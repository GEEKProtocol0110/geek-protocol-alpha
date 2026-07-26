import { ReactNode } from "react";

export function NeonCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border-2 border-[var(--border-soft)] bg-[var(--surface-1)] p-5 shadow-[var(--shadow-hard)]">
      <h2 className="mb-3 text-lg font-semibold text-cyan-200">{title}</h2>
      <div className="text-white/80">{children}</div>
    </section>
  );
}
