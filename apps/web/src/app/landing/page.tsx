"use client";

import { LandingFooter } from "@/components/LandingFooter";
import { LandingHero } from "@/components/LandingHero";


export default function LandingPage() {
  return (
    <main className="w-full bg-black text-white">
      {/* Dedicated landing alias at /landing */}
      <LandingHero />

    </main>
  );
}
