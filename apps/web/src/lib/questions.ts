export type Question = {
  id: string;
  category: string;
  prompt: string;
  options: string[];
  answerIndex: number; // server-side truth for MVP
};

// MVP: single category, 10 questions (as described in the Testnet MVP scope)
// Replace with DB-backed question bank later.
export const MVP_CATEGORY = "General Geek";

export const mvpQuestions: Question[] = [
  {
    id: "q1",
    category: MVP_CATEGORY,
    prompt: "Which planet is known as the Red Planet?",
    options: ["Venus", "Mars", "Jupiter", "Mercury"],
    answerIndex: 1,
  },
  {
    id: "q2",
    category: MVP_CATEGORY,
    prompt: "In programming, what does 'HTTP' stand for?",
    options: [
      "HyperText Transfer Protocol",
      "High Transfer Text Program",
      "Hyperlink Text Transport Process",
      "Host Transfer Type Protocol",
    ],
    answerIndex: 0,
  },
  {
    id: "q3",
    category: MVP_CATEGORY,
    prompt: "Which language is primarily used for styling web pages?",
    options: ["HTML", "CSS", "Java", "SQL"],
    answerIndex: 1,
  },
  {
    id: "q4",
    category: MVP_CATEGORY,
    prompt: "What does 'GPU' commonly stand for?",
    options: [
      "General Processing Unit",
      "Graphical Performance Utility",
      "Graphics Processing Unit",
      "Grid Processing Unit",
    ],
    answerIndex: 2,
  },
  {
    id: "q5",
    category: MVP_CATEGORY,
    prompt: "In Star Wars, what is the name of Han Solo’s ship?",
    options: ["Star Destroyer", "Millennium Falcon", "X-wing", "Naboo Starfighter"],
    answerIndex: 1,
  },
  {
    id: "q6",
    category: MVP_CATEGORY,
    prompt: "Which company created the PlayStation brand?",
    options: ["Nintendo", "Sega", "Sony", "Microsoft"],
    answerIndex: 2,
  },
  {
    id: "q7",
    category: MVP_CATEGORY,
    prompt: "What is the name of the primary smart contract token standard on Kaspa used by $GEEK?",
    options: ["ERC-20", "KRC-20", "BEP-20", "SPL"],
    answerIndex: 1,
  },
  {
    id: "q8",
    category: MVP_CATEGORY,
    prompt: "In chess, which piece can move in an L-shape?",
    options: ["Bishop", "Knight", "Rook", "Queen"],
    answerIndex: 1,
  },
  {
    id: "q9",
    category: MVP_CATEGORY,
    prompt: "What is the common file extension for a TypeScript file?",
    options: [".js", ".ts", ".py", ".rb"],
    answerIndex: 1,
  },
  {
    id: "q10",
    category: MVP_CATEGORY,
    prompt: "What is Geek Protocol’s core loop centered around?",
    options: [
      "Mining",
      "Quiz2Earn gameplay",
      "NFT lending",
      "Yield farming only",
    ],
    answerIndex: 1,
  },
];

export function getMvpRound() {
  // In production, randomize and pull from DB.
  return mvpQuestions.map(({ answerIndex, ...clientSafe }) => clientSafe);
}
