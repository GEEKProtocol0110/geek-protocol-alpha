/**
 * Prototype question bank.
 *
 * Ten questions per battle, drawn by boss level so difficulty climbs with the
 * ladder. In production these come from the API; the prototype keeps them
 * local so the loop can be tuned without a backend round-trip.
 */

import type { Question } from "./types";

const BANK: Record<number, Question[]> = {
  1: [
    {
      id: "q1-1",
      prompt: "Which SQL command is used to retrieve data from a database?",
      options: ["INSERT", "SELECT", "UPDATE", "DELETE"],
      correctIndex: 1,
      explanation: "SELECT reads rows. INSERT writes new ones, UPDATE modifies existing rows, DELETE removes them.",
      category: "DATABASES",
    },
    {
      id: "q1-2",
      prompt: "What does HTML stand for?",
      options: [
        "Hyperlink Text Markup Language",
        "HyperText Markup Language",
        "High Transfer Markup Language",
        "Hyper Tool Markup Logic",
      ],
      correctIndex: 1,
      explanation: "HyperText Markup Language — the markup layer that structures a web document.",
      category: "WEB",
    },
    {
      id: "q1-3",
      prompt: "In binary, what is the decimal number 8?",
      options: ["1000", "0100", "1100", "0010"],
      correctIndex: 0,
      explanation: "8 = 2^3, so the fourth bit from the right is set: 1000.",
      category: "FUNDAMENTALS",
    },
    {
      id: "q1-4",
      prompt: "Which data structure uses First In, First Out ordering?",
      options: ["Stack", "Queue", "Tree", "Hash map"],
      correctIndex: 1,
      explanation: "A queue is FIFO. A stack is the opposite — Last In, First Out.",
      category: "DATA STRUCTURES",
    },
    {
      id: "q1-5",
      prompt: "What does CSS control on a web page?",
      options: ["Server logic", "Database schema", "Presentation and layout", "Network routing"],
      correctIndex: 2,
      explanation: "CSS is the presentation layer — layout, colour, typography and spacing.",
      category: "WEB",
    },
    {
      id: "q1-6",
      prompt: "Which of these is NOT a programming language?",
      options: ["Python", "Rust", "HTTP", "Go"],
      correctIndex: 2,
      explanation: "HTTP is a transfer protocol, not a language you write programs in.",
      category: "FUNDAMENTALS",
    },
    {
      id: "q1-7",
      prompt: "What is the time complexity of binary search on a sorted array?",
      options: ["O(n)", "O(log n)", "O(n log n)", "O(1)"],
      correctIndex: 1,
      explanation: "Each comparison halves the search space, giving logarithmic time.",
      category: "ALGORITHMS",
    },
    {
      id: "q1-8",
      prompt: "In Git, which command creates a new branch and switches to it?",
      options: ["git branch -n", "git checkout -b", "git switch --make", "git new-branch"],
      correctIndex: 1,
      explanation: "git checkout -b <name> creates and checks out in one step. Modern Git also offers git switch -c.",
      category: "TOOLING",
    },
    {
      id: "q1-9",
      prompt: "What does API stand for?",
      options: [
        "Applied Program Interaction",
        "Application Programming Interface",
        "Automated Protocol Integration",
        "Abstract Process Invocation",
      ],
      correctIndex: 1,
      explanation: "An Application Programming Interface is the contract one piece of software exposes to another.",
      category: "FUNDAMENTALS",
    },
    {
      id: "q1-10",
      prompt: "Which HTTP status code means 'Not Found'?",
      options: ["301", "403", "404", "500"],
      correctIndex: 2,
      explanation: "404 is Not Found. 403 is Forbidden, 500 is a server error, 301 is a permanent redirect.",
      category: "WEB",
    },
  ],
  2: [
    {
      id: "q2-1",
      prompt: "What does the 'S' in HTTPS provide?",
      options: ["Speed", "An encrypted transport layer", "Server caching", "Session storage"],
      correctIndex: 1,
      explanation: "TLS encrypts the connection, protecting it from eavesdropping and tampering.",
      category: "SECURITY",
    },
    {
      id: "q2-2",
      prompt: "In JavaScript, what does '===' compare?",
      options: [
        "Value only, with coercion",
        "Value and type, without coercion",
        "Reference identity only",
        "Type only",
      ],
      correctIndex: 1,
      explanation: "=== is strict equality: no type coercion, so 1 === '1' is false.",
      category: "LANGUAGES",
    },
    {
      id: "q2-3",
      prompt: "What is a race condition?",
      options: [
        "A CPU running above its rated clock",
        "Behaviour that depends on uncontrolled timing between operations",
        "A network packet arriving out of order",
        "A loop that never terminates",
      ],
      correctIndex: 1,
      explanation: "The outcome depends on the interleaving of concurrent operations, so it varies run to run.",
      category: "CONCURRENCY",
    },
    {
      id: "q2-4",
      prompt: "Which structure gives average O(1) lookup by key?",
      options: ["Linked list", "Hash map", "Binary tree", "Array (unsorted)"],
      correctIndex: 1,
      explanation: "Hashing jumps straight to a bucket, so average lookup is constant time.",
      category: "DATA STRUCTURES",
    },
    {
      id: "q2-5",
      prompt: "What does 'idempotent' mean for an API request?",
      options: [
        "It can only be called once",
        "Repeating it produces the same result as calling it once",
        "It always returns cached data",
        "It runs asynchronously",
      ],
      correctIndex: 1,
      explanation: "Repeating an idempotent call has no additional effect — the basis of safe retries.",
      category: "ARCHITECTURE",
    },
    {
      id: "q2-6",
      prompt: "In Big-O terms, what is a nested loop over the same n-element list?",
      options: ["O(n)", "O(2n)", "O(n^2)", "O(log n)"],
      correctIndex: 2,
      explanation: "n iterations each running n times gives quadratic growth.",
      category: "ALGORITHMS",
    },
    {
      id: "q2-7",
      prompt: "What is the purpose of an index in a database?",
      options: [
        "To enforce foreign keys",
        "To speed up lookups at the cost of write throughput and storage",
        "To compress table data",
        "To encrypt sensitive columns",
      ],
      correctIndex: 1,
      explanation: "Indexes trade write speed and disk for much faster reads on the indexed columns.",
      category: "DATABASES",
    },
    {
      id: "q2-8",
      prompt: "Which of these is a symmetric encryption algorithm?",
      options: ["RSA", "AES", "ECDSA", "Diffie-Hellman"],
      correctIndex: 1,
      explanation: "AES uses one shared key. RSA and ECDSA are asymmetric; Diffie-Hellman is key exchange.",
      category: "SECURITY",
    },
    {
      id: "q2-9",
      prompt: "What does a 'pure function' guarantee?",
      options: [
        "It runs faster than an impure one",
        "Same inputs give same outputs, with no side effects",
        "It cannot throw an exception",
        "It is always recursive",
      ],
      correctIndex: 1,
      explanation: "Determinism plus no side effects — which is what makes pure functions trivially testable.",
      category: "LANGUAGES",
    },
    {
      id: "q2-10",
      prompt: "In TCP, what is the three-way handshake?",
      options: ["GET, POST, PUT", "SYN, SYN-ACK, ACK", "OPEN, READ, CLOSE", "PING, PONG, ACK"],
      correctIndex: 1,
      explanation: "SYN, SYN-ACK, ACK establishes sequence numbers before any data flows.",
      category: "NETWORKING",
    },
  ],
};

/** Ten questions for the given boss level, falling back to the last tier. */
export function getQuestions(level: number): Question[] {
  const keys = Object.keys(BANK).map(Number).sort((a, b) => a - b);
  const tier = keys.includes(level) ? level : keys[keys.length - 1];
  return BANK[tier];
}

export const QUESTIONS_PER_BATTLE = 10;
