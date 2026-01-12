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

export default function DashboardLanding() {
  return (
    <main className="w-full bg-black text-white">
      {/* Reuse the full landing experience on /dashboard */}
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
