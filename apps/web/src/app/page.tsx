import { Hero } from "@/components/Hero";
import { Features } from "@/components/Features";
import { LandingFooter } from "@/components/LandingFooter";

export default function Home() {
  return (
    <main className="w-full bg-black text-white">
      <Hero />
      <Features />
      <LandingFooter />
    </main>
  );
}
