import LandingPage from "@/components/LandingPage";
import GauntletRoundsTable from "@/components/GauntletRoundsTable";

export default function Home() {
  // The round table is a server component rendered here and passed into the
  // client landing page as a slot, so the live economy numbers are in the
  // initial HTML rather than fetched after hydration.
  return <LandingPage gauntletTable={<GauntletRoundsTable />} />;
}
