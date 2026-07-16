export interface RoundConfig {
  entryCost: number;
  rewardPerQuestion: number;
  maxEarn: number;
}

export const QUIZ_REWARD_TABLE: Record<number, RoundConfig> = {
  1: { entryCost: 0, rewardPerQuestion: 10, maxEarn: 100 },
  2: { entryCost: 5, rewardPerQuestion: 20, maxEarn: 200 },
  3: { entryCost: 10, rewardPerQuestion: 30, maxEarn: 300 },
  4: { entryCost: 20, rewardPerQuestion: 40, maxEarn: 400 },
  5: { entryCost: 30, rewardPerQuestion: 50, maxEarn: 500 },
  6: { entryCost: 50, rewardPerQuestion: 75, maxEarn: 750 },
  7: { entryCost: 75, rewardPerQuestion: 100, maxEarn: 1000 },
  8: { entryCost: 100, rewardPerQuestion: 150, maxEarn: 1500 },
  9: { entryCost: 150, rewardPerQuestion: 200, maxEarn: 2000 },
  10: { entryCost: 200, rewardPerQuestion: 300, maxEarn: 3000 },
};
