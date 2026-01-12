"use client";

import { LandingHero } from "@/components/LandingHero";
import { StorySection, CategoriesSection, RoadmapSection, KaspaHonorSection } from "@/components/LandingPage";
import { LandingFooter } from "@/components/LandingFooter";

export default function ComingSoonDetails() {
  return (
    <main className="w-full bg-black text-white">

      {/* Full landing page content */}
      <LandingHero />
      <StorySection />
      <CategoriesSection />
      <RoadmapSection />
      <KaspaHonorSection />
      <LandingFooter />
    </main>
  );
}
