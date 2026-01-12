"use client";

import { LandingFooter } from "@/components/LandingFooter";
import { LandingHero } from "@/components/LandingHero";
import {
  StorySection,
  CategoriesSection,
  RoadmapSection,
  KaspaHonorSection,
  CTASection,
  NavLinks,
} from "@/components/LandingPage";

export default function Home() {
  return (
    <main className="w-full bg-black text-white">
      {/* Narrative landing composed for excitement + clarity */}
      <LandingHero />
      <StorySection />
      <CategoriesSection />
      <RoadmapSection />
      <KaspaHonorSection />
      <NavLinks />
      <CTASection />
      <LandingFooter />
    </main>
  );
}
