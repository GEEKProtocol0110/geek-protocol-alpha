import type { Metadata } from "next";
import BattleClient from "@/components/battle/BattleClient";

export const metadata: Metadata = {
  title: "Space Fighter — GEEK Protocol",
  description:
    "Answer to attack. A quiz battle prototype where your knowledge controls the fight.",
};

export default function BattlePage() {
  return <BattleClient />;
}
