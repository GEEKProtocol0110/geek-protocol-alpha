/**
 * The Kaspa question bank.
 *
 * Every question here is about Kaspa or the concepts needed to understand it.
 * The quiz doubles as onboarding: someone who clears all eight categories has a
 * working mental model of the chain they are being paid on.
 *
 * ACCURACY NOTE — please read before launch.
 * These were written against knowledge current to roughly mid-2026. Protocol
 * facts (GHOSTDAG, the fair launch, kHeavyHash, the emission curve, the sompi)
 * are stable and safe. Anything about *current* state — block rates, live L2s,
 * ecosystem tooling, market data — drifts. Questions whose answers can change
 * over time are tagged `volatile: true` so you can re-check them on a schedule.
 * Run `npm run seed:kaspa -- --list-volatile` to print just those.
 */

export type Difficulty = "easy" | "medium" | "hard";

export interface KaspaQuestion {
  category: string;
  prompt: string;
  options: string[];
  /** 0-based index into `options`. */
  correctIndex: number;
  difficulty: Difficulty;
  funFact?: string;
  tags?: string[];
  /** True when the answer could change as the network evolves. */
  volatile?: boolean;
}

export const KASPA_QUESTIONS: KaspaQuestion[] = [
  // ── Kaspa Origins ──────────────────────────────────────────────────────────
  {
    category: "Kaspa Origins",
    prompt: "Who is the researcher credited with founding Kaspa?",
    options: ["Vitalik Buterin", "Yonatan Sompolinsky", "Charles Hoskinson", "Gavin Wood"],
    correctIndex: 1,
    difficulty: "easy",
    funFact:
      "Sompolinsky's earlier research on the GHOST protocol was cited in Ethereum's own whitepaper.",
    tags: ["founder", "history"],
  },
  {
    category: "Kaspa Origins",
    prompt: "In what year did Kaspa launch its mainnet?",
    options: ["2019", "2020", "2021", "2023"],
    correctIndex: 2,
    difficulty: "easy",
    funFact: "Kaspa went live on 7 November 2021 with no premine and no pre-sale.",
    tags: ["launch"],
  },
  {
    category: "Kaspa Origins",
    prompt: "What does it mean that Kaspa had a 'fair launch'?",
    options: [
      "Early investors received a discount round",
      "No premine, no pre-sale and no allocation to founders or VCs",
      "The team held 10% for development",
      "Tokens were airdropped to Bitcoin holders",
    ],
    correctIndex: 1,
    difficulty: "medium",
    funFact:
      "Every KAS in existence was mined — nobody, including the founders, was allocated coins at genesis.",
    tags: ["fair-launch", "distribution"],
  },
  {
    category: "Kaspa Origins",
    prompt:
      "Sompolinsky co-authored a 2013 paper whose ideas influenced Ethereum's handling of orphaned blocks. What was that protocol called?",
    options: ["GHOST", "CASPER", "RAIDEN", "PLASMA"],
    correctIndex: 0,
    difficulty: "hard",
    funFact:
      "GHOST — Greedy Heaviest Observed Sub-Tree — led to Ethereum's uncle/ommer rewards.",
    tags: ["research", "ghost"],
  },
  {
    category: "Kaspa Origins",
    prompt: "Which academic protocol is GHOSTDAG a practical, greedy implementation of?",
    options: ["PHANTOM", "AVALANCHE", "TENDERMINT", "HASHGRAPH"],
    correctIndex: 0,
    difficulty: "hard",
    funFact: "The PHANTOM paper defines the ideal ordering; GHOSTDAG approximates it efficiently.",
    tags: ["research", "phantom"],
  },
  {
    category: "Kaspa Origins",
    prompt: "What is Kaspa's ticker symbol?",
    options: ["KSP", "KAS", "KPA", "KSA"],
    correctIndex: 1,
    difficulty: "easy",
    tags: ["basics"],
  },
  {
    category: "Kaspa Origins",
    prompt:
      "The original Kaspa full node was written in one language, then rewritten for performance in another. Which rewrite is known as 'rusty-kaspa'?",
    options: ["Python to C++", "Go to Rust", "Java to Go", "C to Zig"],
    correctIndex: 1,
    difficulty: "medium",
    funFact:
      "The original node (kaspad) was written in Go; the Rust rewrite unlocked much higher block rates.",
    tags: ["engineering"],
  },
  {
    category: "Kaspa Origins",
    prompt: "What is the name of the proposed next-generation successor protocol to GHOSTDAG?",
    options: ["DAGKnight", "GHOSTNET", "PHANTOM II", "KaspaX"],
    correctIndex: 0,
    difficulty: "hard",
    funFact:
      "DAGKnight is designed to be parameterless — it adapts to real network conditions instead of assuming a fixed delay.",
    tags: ["research", "dagknight"],
  },

  // ── GHOSTDAG & BlockDAG ────────────────────────────────────────────────────
  {
    category: "GHOSTDAG & BlockDAG",
    prompt: "What does DAG stand for in 'blockDAG'?",
    options: [
      "Distributed Access Gateway",
      "Directed Acyclic Graph",
      "Dynamic Allocation Grid",
      "Decentralised Autonomous Group",
    ],
    correctIndex: 1,
    difficulty: "easy",
    tags: ["basics", "dag"],
  },
  {
    category: "GHOSTDAG & BlockDAG",
    prompt:
      "In a traditional blockchain, what happens when two miners find a valid block at the same time?",
    options: [
      "Both blocks are kept and ordered",
      "One block wins and the other is orphaned and discarded",
      "The blocks are merged into one",
      "The network halts until miners agree",
    ],
    correctIndex: 1,
    difficulty: "medium",
    funFact:
      "Discarding that work is exactly the waste GHOSTDAG was designed to eliminate.",
    tags: ["comparison"],
  },
  {
    category: "GHOSTDAG & BlockDAG",
    prompt: "What does Kaspa do with blocks that are mined in parallel?",
    options: [
      "Discards all but the longest chain",
      "Includes them all in the DAG and orders them by consensus",
      "Stores them off-chain for later",
      "Refunds the miners and deletes them",
    ],
    correctIndex: 1,
    difficulty: "medium",
    funFact:
      "No honest work is thrown away — this is the core idea that lets Kaspa raise block rates safely.",
    tags: ["ghostdag"],
  },
  {
    category: "GHOSTDAG & BlockDAG",
    prompt: "In GHOSTDAG terminology, what are 'blue' blocks?",
    options: [
      "Blocks that paid the highest fees",
      "Blocks that are well-connected to the DAG and considered part of the honest cluster",
      "Blocks mined by ASIC hardware",
      "Blocks containing no transactions",
    ],
    correctIndex: 1,
    difficulty: "hard",
    funFact:
      "Poorly-connected blocks are coloured 'red' — still recorded, but treated as outside the honest set.",
    tags: ["ghostdag", "blue-set"],
  },
  {
    category: "GHOSTDAG & BlockDAG",
    prompt: "Why can a blockDAG safely support far higher block rates than a single chain?",
    options: [
      "It uses a faster hashing algorithm",
      "Parallel blocks are ordered rather than discarded, so orphan rate stops being a limit",
      "It reduces the number of miners",
      "It skips validation for most blocks",
    ],
    correctIndex: 1,
    difficulty: "hard",
    tags: ["scaling"],
  },
  {
    category: "GHOSTDAG & BlockDAG",
    prompt: "Does GHOSTDAG give every transaction a single agreed order?",
    options: [
      "No, ordering is left to each node",
      "Yes, it produces one consensus ordering across the whole DAG",
      "Only for transactions in blue blocks",
      "Only once per day at a checkpoint",
    ],
    correctIndex: 1,
    difficulty: "medium",
    funFact:
      "A total order matters — without it you cannot reliably decide which of two conflicting spends came first.",
    tags: ["ordering"],
  },
  {
    category: "GHOSTDAG & BlockDAG",
    prompt: "Kaspa is best described as which of the following?",
    options: [
      "A proof-of-stake smart contract platform",
      "A proof-of-work blockDAG",
      "A permissioned enterprise ledger",
      "A Bitcoin sidechain",
    ],
    correctIndex: 1,
    difficulty: "easy",
    tags: ["basics"],
  },
  {
    category: "GHOSTDAG & BlockDAG",
    prompt: "What problem does high block rate cause in a classic blockchain that GHOSTDAG solves?",
    options: [
      "Wallets stop syncing",
      "Rising orphan rates waste hash power and weaken security",
      "Transaction fees become negative",
      "Blocks exceed the maximum file size",
    ],
    correctIndex: 1,
    difficulty: "hard",
    tags: ["security", "scaling"],
  },

  // ── Mining & Consensus ─────────────────────────────────────────────────────
  {
    category: "Mining & Consensus",
    prompt: "Which consensus mechanism secures Kaspa?",
    options: ["Proof of Stake", "Proof of Work", "Proof of Authority", "Proof of History"],
    correctIndex: 1,
    difficulty: "easy",
    tags: ["basics", "pow"],
  },
  {
    category: "Mining & Consensus",
    prompt: "What is the name of Kaspa's proof-of-work hashing algorithm?",
    options: ["SHA-256", "Ethash", "kHeavyHash", "Scrypt"],
    correctIndex: 2,
    difficulty: "medium",
    funFact:
      "kHeavyHash was designed with optical mining hardware in mind — a bet on a very different future for mining efficiency.",
    tags: ["mining", "kheavyhash"],
  },
  {
    category: "Mining & Consensus",
    prompt: "What did Kaspa's block rate start at when the network launched?",
    options: ["1 block per second", "1 block per minute", "10 blocks per second", "1 block per 10 minutes"],
    correctIndex: 0,
    difficulty: "medium",
    funFact:
      "One block per second was already extraordinary — Bitcoin targets one every ten minutes.",
    tags: ["block-rate"],
  },
  {
    category: "Mining & Consensus",
    prompt: "What was the Crescendo upgrade designed to do?",
    options: [
      "Switch Kaspa to proof of stake",
      "Raise the block rate to ten blocks per second",
      "Introduce a founder's reward",
      "Reduce the maximum supply",
    ],
    correctIndex: 1,
    difficulty: "medium",
    volatile: true,
    tags: ["upgrade", "crescendo"],
  },
  {
    category: "Mining & Consensus",
    prompt: "Roughly how long does Bitcoin target between blocks, for comparison with Kaspa?",
    options: ["1 second", "1 minute", "10 minutes", "1 hour"],
    correctIndex: 2,
    difficulty: "easy",
    tags: ["comparison", "bitcoin"],
  },
  {
    category: "Mining & Consensus",
    prompt: "What secures a proof-of-work network against an attacker rewriting history?",
    options: [
      "A council of validators",
      "The cost of redoing the accumulated computational work",
      "Government registration of miners",
      "Encrypting every block with a private key",
    ],
    correctIndex: 1,
    difficulty: "medium",
    tags: ["security"],
  },
  {
    category: "Mining & Consensus",
    prompt: "Why does faster confirmation matter for a network used to pay people in real time?",
    options: [
      "It reduces the total coin supply",
      "Users learn their transaction is settled in seconds rather than minutes",
      "It removes the need for mining",
      "It makes transactions free",
    ],
    correctIndex: 1,
    difficulty: "easy",
    tags: ["ux"],
  },
  {
    category: "Mining & Consensus",
    prompt: "In Kaspa, are blocks mined in parallel by different miners wasted?",
    options: [
      "Yes, only one survives",
      "No, they are all incorporated into the DAG",
      "Only blocks over 1MB survive",
      "They are queued for the next epoch",
    ],
    correctIndex: 1,
    difficulty: "easy",
    tags: ["ghostdag"],
  },

  // ── Tokenomics ─────────────────────────────────────────────────────────────
  {
    category: "Tokenomics",
    prompt: "Approximately what is Kaspa's maximum supply?",
    options: ["21 million", "100 million", "28.7 billion", "1 trillion"],
    correctIndex: 2,
    difficulty: "medium",
    funFact: "The precise cap is 28,704,026,601 KAS.",
    tags: ["supply"],
  },
  {
    category: "Tokenomics",
    prompt: "What is the smallest unit of KAS called?",
    options: ["satoshi", "sompi", "wei", "gwei"],
    correctIndex: 1,
    difficulty: "medium",
    funFact: "The sompi is named after Yonatan Sompolinsky. One KAS is 100,000,000 sompi.",
    tags: ["units"],
  },
  {
    category: "Tokenomics",
    prompt: "How many sompi make up one KAS?",
    options: ["1,000", "1,000,000", "100,000,000", "1,000,000,000"],
    correctIndex: 2,
    difficulty: "medium",
    tags: ["units"],
  },
  {
    category: "Tokenomics",
    prompt: "What is distinctive about Kaspa's 'chromatic halving' emission schedule?",
    options: [
      "Rewards halve abruptly every four years",
      "Rewards decrease smoothly every month, halving over the course of a year",
      "Rewards increase over time",
      "Rewards are fixed forever",
    ],
    correctIndex: 1,
    difficulty: "hard",
    funFact:
      "Each month the reward is multiplied by the twelfth root of one half, so a full halving takes a year without a sudden cliff.",
    tags: ["emission", "halving"],
  },
  {
    category: "Tokenomics",
    prompt: "How much of Kaspa's supply was allocated to founders and investors at launch?",
    options: ["None", "5%", "15%", "30%"],
    correctIndex: 0,
    difficulty: "easy",
    funFact: "No premine, no pre-sale, no VC allocation — all coins entered circulation through mining.",
    tags: ["fair-launch"],
  },
  {
    category: "Tokenomics",
    prompt: "Why does a smooth monthly emission reduction differ from a sudden halving?",
    options: [
      "It avoids the abrupt shock to miner revenue that a cliff creates",
      "It increases the total supply",
      "It lets the team mint extra coins",
      "It stops mining entirely",
    ],
    correctIndex: 0,
    difficulty: "hard",
    tags: ["emission"],
  },
  {
    category: "Tokenomics",
    prompt: "Is Kaspa's supply inflationary without limit?",
    options: [
      "Yes, new coins are minted forever at a fixed rate",
      "No, emission decreases over time toward a hard cap",
      "Yes, supply doubles annually",
      "Supply is set by governance vote",
    ],
    correctIndex: 1,
    difficulty: "easy",
    tags: ["supply"],
  },
  {
    category: "Tokenomics",
    prompt: "What happens to a Kaspa miner's block reward over time?",
    options: [
      "It grows with network usage",
      "It shrinks on a predetermined schedule",
      "It stays constant forever",
      "It is decided by miners each month",
    ],
    correctIndex: 1,
    difficulty: "easy",
    tags: ["emission"],
  },

  // ── Wallets & Addresses ────────────────────────────────────────────────────
  {
    category: "Wallets & Addresses",
    prompt: "What prefix does a Kaspa mainnet address start with?",
    options: ["kas1:", "kaspa:", "0x", "bc1"],
    correctIndex: 1,
    difficulty: "easy",
    funFact: "Testnet addresses use the kaspatest: prefix instead.",
    tags: ["addresses"],
  },
  {
    category: "Wallets & Addresses",
    prompt: "Which accounting model does Kaspa use?",
    options: [
      "Account/balance, like Ethereum",
      "UTXO, like Bitcoin",
      "A permissioned ledger table",
      "Off-chain state channels only",
    ],
    correctIndex: 1,
    difficulty: "medium",
    funFact:
      "UTXO means your balance is the sum of unspent outputs you control, not a single stored number.",
    tags: ["utxo"],
  },
  {
    category: "Wallets & Addresses",
    prompt: "What does UTXO stand for?",
    options: [
      "Universal Transaction Exchange Output",
      "Unspent Transaction Output",
      "Unified Token Extension Object",
      "User Transfer Operation",
    ],
    correctIndex: 1,
    difficulty: "medium",
    tags: ["utxo"],
  },
  {
    category: "Wallets & Addresses",
    prompt: "Which browser extension wallet is commonly used with Kaspa applications?",
    options: ["MetaMask", "KasWare", "Phantom", "Keplr"],
    correctIndex: 1,
    difficulty: "easy",
    volatile: true,
    tags: ["wallets"],
  },
  {
    category: "Wallets & Addresses",
    prompt: "If you lose your wallet's seed phrase and have no backup, what happens to your funds?",
    options: [
      "Support can restore them with ID verification",
      "They are permanently inaccessible",
      "They return to the treasury after a year",
      "Miners can recover them for a fee",
    ],
    correctIndex: 1,
    difficulty: "easy",
    funFact: "No one can reissue your keys. Self-custody means the backup is genuinely your job.",
    tags: ["security", "custody"],
  },
  {
    category: "Wallets & Addresses",
    prompt: "What is the safest way to store a seed phrase?",
    options: [
      "A screenshot in your photo library",
      "Offline, physically, somewhere only you can access",
      "A note in your email drafts",
      "A public gist as a backup",
    ],
    correctIndex: 1,
    difficulty: "easy",
    tags: ["security"],
  },
  {
    category: "Wallets & Addresses",
    prompt:
      "A Kaspa address contains a checksum. What does that protect against?",
    options: [
      "Someone stealing your private key",
      "Funds being sent to an address you mistyped",
      "Double spending",
      "Network congestion",
    ],
    correctIndex: 1,
    difficulty: "medium",
    funFact:
      "Change a single character and the checksum fails, so the wallet rejects it before any funds move.",
    tags: ["addresses", "safety"],
  },
  {
    category: "Wallets & Addresses",
    prompt: "What does 'signing a message' with your wallet prove?",
    options: [
      "That you control the private key for that address",
      "That you have a positive balance",
      "That you paid a transaction fee",
      "That your node is fully synced",
    ],
    correctIndex: 0,
    difficulty: "medium",
    funFact: "This is exactly how logging in with a wallet works — no password required.",
    tags: ["signatures", "auth"],
  },

  // ── KRC-20 & Smart Contracts ───────────────────────────────────────────────
  {
    category: "KRC-20 & Smart Contracts",
    prompt: "What is KRC-20?",
    options: [
      "A Kaspa mining pool protocol",
      "A token standard for issuing fungible tokens on Kaspa",
      "A hardware wallet model",
      "A block explorer",
    ],
    correctIndex: 1,
    difficulty: "easy",
    tags: ["krc20", "tokens"],
  },
  {
    category: "KRC-20 & Smart Contracts",
    prompt: "Which Ethereum standard is KRC-20 most analogous to?",
    options: ["ERC-721", "ERC-20", "ERC-1155", "ERC-4337"],
    correctIndex: 1,
    difficulty: "easy",
    funFact: "ERC-20 and KRC-20 both describe fungible tokens — interchangeable units, like currency.",
    tags: ["krc20", "comparison"],
  },
  {
    category: "KRC-20 & Smart Contracts",
    prompt: "KRC-20 tokens are created using which mechanism?",
    options: [
      "Deploying bytecode to a virtual machine",
      "Inscribing structured data into transactions, tracked by an indexer",
      "Registering with a central authority",
      "Staking KAS in a contract",
    ],
    correctIndex: 1,
    difficulty: "hard",
    funFact:
      "Because it's inscription-based, an indexer is what reconstructs token balances from the chain's history.",
    tags: ["krc20", "inscriptions"],
  },
  {
    category: "KRC-20 & Smart Contracts",
    prompt: "What role does an indexer play for KRC-20 tokens?",
    options: [
      "It mines the tokens",
      "It reads the chain and computes token balances and transfers",
      "It sets the token's price",
      "It stores private keys",
    ],
    correctIndex: 1,
    difficulty: "hard",
    tags: ["krc20", "indexer"],
  },
  {
    category: "KRC-20 & Smart Contracts",
    prompt: "What does 'fungible' mean when describing a token?",
    options: [
      "Each unit is unique and non-interchangeable",
      "Every unit is identical and interchangeable with any other",
      "It can only be traded once",
      "It expires after a fixed period",
    ],
    correctIndex: 1,
    difficulty: "medium",
    tags: ["concepts"],
  },
  {
    category: "KRC-20 & Smart Contracts",
    prompt: "What is a token 'ticker' in the KRC-20 context?",
    options: [
      "The short symbol identifying the token",
      "The transaction fee",
      "The block time",
      "The wallet address",
    ],
    correctIndex: 0,
    difficulty: "easy",
    tags: ["krc20"],
  },
  {
    category: "KRC-20 & Smart Contracts",
    prompt:
      "Why does adding a programmable layer increase the security burden on a network?",
    options: [
      "It slows down block production",
      "Programmable value introduces bugs and exploits that simple transfers do not",
      "It requires more miners by law",
      "It removes proof of work",
    ],
    correctIndex: 1,
    difficulty: "hard",
    tags: ["security", "smart-contracts"],
  },
  {
    category: "KRC-20 & Smart Contracts",
    prompt: "What is a Layer 2 in blockchain terms?",
    options: [
      "A backup copy of the blockchain",
      "A separate system that handles execution while relying on the base chain for security",
      "The second half of a block",
      "A type of wallet",
    ],
    correctIndex: 1,
    difficulty: "medium",
    tags: ["l2", "concepts"],
  },

  // ── Kaspa Ecosystem ────────────────────────────────────────────────────────
  {
    category: "Kaspa Ecosystem",
    prompt: "What is a block explorer used for?",
    options: [
      "Mining new blocks",
      "Viewing transactions, addresses and blocks on the network",
      "Storing your private keys",
      "Setting transaction fees network-wide",
    ],
    correctIndex: 1,
    difficulty: "easy",
    tags: ["tools"],
  },
  {
    category: "Kaspa Ecosystem",
    prompt: "Kaspa's core development is notable for which of the following?",
    options: [
      "Being run by a single corporation",
      "Being open source with a relatively small group of contributors",
      "Being closed source",
      "Requiring a licence fee to build on",
    ],
    correctIndex: 1,
    difficulty: "medium",
    funFact:
      "A small contributor base is a real consideration when you build on any chain — fewer maintainers means fewer ready-made tools.",
    tags: ["community"],
  },
  {
    category: "Kaspa Ecosystem",
    prompt: "What does it mean that Kaspa is open source?",
    options: [
      "Anyone can read, audit and contribute to the code",
      "The code is owned by a foundation and kept private",
      "Only miners can view the code",
      "It costs money to access",
    ],
    correctIndex: 0,
    difficulty: "easy",
    tags: ["open-source"],
  },
  {
    category: "Kaspa Ecosystem",
    prompt: "Why do developers run their own node rather than trusting a public API?",
    options: [
      "It is cheaper to mine that way",
      "It removes reliance on a third party for the truth about the chain",
      "It increases their token balance",
      "It is legally required",
    ],
    correctIndex: 1,
    difficulty: "medium",
    tags: ["nodes"],
  },
  {
    category: "Kaspa Ecosystem",
    prompt: "What is a testnet used for?",
    options: [
      "Trading tokens at a discount",
      "Testing applications with valueless coins before deploying to mainnet",
      "Mining faster than mainnet",
      "Storing backups of mainnet",
    ],
    correctIndex: 1,
    difficulty: "easy",
    funFact: "Testnet coins have no monetary value by design — that is what makes them safe to experiment with.",
    tags: ["testnet"],
  },
  {
    category: "Kaspa Ecosystem",
    prompt: "What is a mining pool?",
    options: [
      "A group of miners combining hash power and sharing rewards",
      "A liquidity pool for trading",
      "A staking contract",
      "A storage system for blocks",
    ],
    correctIndex: 0,
    difficulty: "medium",
    tags: ["mining"],
  },
  {
    category: "Kaspa Ecosystem",
    prompt: "Why is it risky to rely on a single third-party service for on-chain data?",
    options: [
      "It makes transactions slower",
      "If it goes down or reports wrongly, your application inherits that failure",
      "It increases mining difficulty",
      "It reduces your token supply",
    ],
    correctIndex: 1,
    difficulty: "hard",
    tags: ["architecture"],
  },
  {
    category: "Kaspa Ecosystem",
    prompt: "What does 'decentralised' mean in the context of a network like Kaspa?",
    options: [
      "No single party controls the network's operation",
      "The network has no rules",
      "All users must be anonymous",
      "It runs on a single powerful server",
    ],
    correctIndex: 0,
    difficulty: "easy",
    tags: ["concepts"],
  },

  // ── Crypto Fundamentals ────────────────────────────────────────────────────
  {
    category: "Crypto Fundamentals",
    prompt: "What is a cryptographic hash function?",
    options: [
      "A reversible encryption method",
      "A one-way function mapping any input to a fixed-size output",
      "A way to compress files losslessly",
      "A random number generator",
    ],
    correctIndex: 1,
    difficulty: "medium",
    tags: ["cryptography"],
  },
  {
    category: "Crypto Fundamentals",
    prompt: "What is a 'double spend'?",
    options: [
      "Paying twice the network fee",
      "Spending the same coins in two conflicting transactions",
      "Sending funds to two addresses at once",
      "Buying and selling in one block",
    ],
    correctIndex: 1,
    difficulty: "medium",
    funFact: "Preventing double spends without a central authority is the original problem Bitcoin solved.",
    tags: ["security"],
  },
  {
    category: "Crypto Fundamentals",
    prompt: "What is the relationship between a private key and a public address?",
    options: [
      "The address is derived from the key, and the derivation cannot be reversed",
      "They are the same value in different formats",
      "The key is derived from the address",
      "They are unrelated and assigned by the network",
    ],
    correctIndex: 0,
    difficulty: "hard",
    tags: ["cryptography", "keys"],
  },
  {
    category: "Crypto Fundamentals",
    prompt: "What does 'immutable' mean when describing a confirmed blockchain transaction?",
    options: [
      "It can be edited by the sender",
      "It cannot practically be altered or removed once settled",
      "It expires after a year",
      "It is hidden from other users",
    ],
    correctIndex: 1,
    difficulty: "easy",
    tags: ["concepts"],
  },
  {
    category: "Crypto Fundamentals",
    prompt: "What is a 51% attack?",
    options: [
      "When one party controls a majority of hash power and can reorder recent history",
      "When 51% of users sell at once",
      "When fees rise above half the transaction value",
      "When half the nodes go offline",
    ],
    correctIndex: 0,
    difficulty: "hard",
    tags: ["security"],
  },
  {
    category: "Crypto Fundamentals",
    prompt: "Why is 'not your keys, not your coins' a common warning?",
    options: [
      "Custodial services hold the keys, so you depend on them to honour your balance",
      "Keys expire after a set period",
      "Coins lose value in a wallet",
      "Exchanges charge more than wallets",
    ],
    correctIndex: 0,
    difficulty: "medium",
    tags: ["custody", "security"],
  },
  {
    category: "Crypto Fundamentals",
    prompt: "What is a transaction fee for?",
    options: [
      "Paying the network's operators for including and securing your transaction",
      "A government tax",
      "Insurance against loss",
      "Buying the token itself",
    ],
    correctIndex: 0,
    difficulty: "easy",
    tags: ["fees"],
  },
  {
    category: "Crypto Fundamentals",
    prompt: "What does 'finality' mean in a blockchain context?",
    options: [
      "The point at which a transaction is considered irreversible",
      "The last block ever produced",
      "The end of a mining epoch",
      "When a wallet is closed",
    ],
    correctIndex: 0,
    difficulty: "hard",
    tags: ["concepts"],
  },
];

/** Categories that actually appear in the bank, in display order. */
export const KASPA_CATEGORIES = [
  "Kaspa Origins",
  "GHOSTDAG & BlockDAG",
  "Mining & Consensus",
  "Tokenomics",
  "Wallets & Addresses",
  "KRC-20 & Smart Contracts",
  "Kaspa Ecosystem",
  "Crypto Fundamentals",
] as const;
