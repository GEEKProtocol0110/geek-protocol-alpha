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

export default function Home() {
  return (
    <main className="w-full bg-black text-white">
      {/* Comprehensive landing page explaining everything about Geek Protocol */}
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
