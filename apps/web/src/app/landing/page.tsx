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
  ImpactSection,
  ResourcesSection,
} from "@/components/LandingPage";

export default function LandingPage() {
  return (
    <main className="w-full bg-black text-white">
      {/* Dedicated landing alias at /landing */}
      <LandingHero />
      <StorySection />
      <ImpactSection />
      <CategoriesSection />
      <RoadmapSection />
      <KaspaHonorSection />
      <ResourcesSection />
      <NavLinks />
      <CTASection />
      <LandingFooter />
    </main>
  );
}
