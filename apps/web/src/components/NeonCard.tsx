import { ReactNode } from "react";

export function NeonCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-cyan-400/30 bg-white/5 p-5 shadow-[0_0_40px_rgba(0,209,255,0.10)]">
      <h2 className="mb-3 text-lg font-semibold text-cyan-200">{title}</h2>
      <div className="text-white/80">{children}</div>
    </section>
  );
}
