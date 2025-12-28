import { NextResponse } from "next/server";
import { mvpQuestions } from "@/lib/questions";

type SubmitPayload = {
  walletAddress?: string;
  answers: Array<{ id: string; choiceIndex: number }>;
};

export async function POST(req: Request) {
  let body: SubmitPayload;
  try {
    body = (await req.json()) as SubmitPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!Array.isArray(body.answers) || body.answers.length === 0) {
    return NextResponse.json({ error: "No answers submitted" }, { status: 400 });
  }

  const answerMap = new Map(body.answers.map((a) => [a.id, a.choiceIndex]));
  let score = 0;
  for (const q of mvpQuestions) {
    const choice = answerMap.get(q.id);
    if (typeof choice === "number" && choice === q.answerIndex) score += 1;
  }

  const total = mvpQuestions.length;

  // MVP reward stub: you will replace this with a Kaspa Testnet KRC-20 send
  // triggered by the backend after quiz completion.
  const rewardPerCorrect = Number(process.env.REWARD_PER_CORRECT ?? "10");
  const rewardAmount = score * rewardPerCorrect;

  const txStatus = "stub";

  return NextResponse.json({
    walletAddress: body.walletAddress ?? null,
    score,
    total,
    rewardAmount,
    txStatus,
    message:
      txStatus === "stub"
        ? "Scored successfully. Reward sending not wired yet (stub)."
        : "Reward sent.",
  });
}
