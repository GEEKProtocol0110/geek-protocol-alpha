/**
 * Seeds the Kaspa question bank.
 *
 *   npm run seed:kaspa                  # add/update Kaspa topics and questions
 *   npm run seed:kaspa -- --retire-old  # also deactivate the old pop-culture topics
 *   npm run seed:kaspa -- --list-volatile
 *
 * Idempotent: re-running updates existing questions in place (matched on prompt
 * text) rather than creating duplicates, so it is safe to run on every deploy.
 *
 * Old topics are deactivated, never deleted — players have attempt history and
 * creator earnings tied to those questions, and deleting them would orphan real
 * records. Deactivating removes them from rotation while keeping history intact.
 */
import { PrismaClient } from "@prisma/client";
import { CATEGORY_META, type GeekCategory } from "@geek/shared";
import { KASPA_QUESTIONS, KASPA_CATEGORIES } from "../content/kaspaQuestions";

const prisma = new PrismaClient();

const args = process.argv.slice(2);
const RETIRE_OLD = args.includes("--retire-old");
const LIST_VOLATILE = args.includes("--list-volatile");

async function listVolatile() {
  const volatile = KASPA_QUESTIONS.filter((q) => q.volatile);
  console.log(`\n${volatile.length} question(s) whose answers can drift over time:\n`);
  for (const q of volatile) {
    console.log(`  [${q.category}] ${q.prompt}`);
    console.log(`     → ${q.options[q.correctIndex]}\n`);
  }
  console.log("Re-check these against the current state of the network periodically.\n");
}

async function main() {
  if (LIST_VOLATILE) {
    await listVolatile();
    return;
  }

  console.log("\nSeeding Kaspa content...\n");

  // 1. Topics
  const topicIds = new Map<string, number>();
  for (const name of KASPA_CATEGORIES) {
    const meta = CATEGORY_META[name as GeekCategory];
    const topic = await prisma.topic.upsert({
      where: { name },
      update: { description: meta.description, icon: meta.icon, isActive: true },
      create: { name, description: meta.description, icon: meta.icon, isActive: true },
    });
    topicIds.set(name, topic.id);
  }
  console.log(`  ✓ ${KASPA_CATEGORIES.length} Kaspa topics ready`);

  // 2. Questions — approved immediately, since these are first-party content
  //    rather than community submissions awaiting peer review.
  let created = 0;
  let updated = 0;

  for (const q of KASPA_QUESTIONS) {
    const topicId = topicIds.get(q.category);
    if (!topicId) {
      console.warn(`  ! skipping question with unknown category: ${q.category}`);
      continue;
    }

    const data = {
      question: q.prompt,
      option1: q.options[0],
      option2: q.options[1],
      option3: q.options[2],
      option4: q.options[3],
      // correctOption is 1-based in the schema; correctIndex is 0-based here.
      correctOption: q.correctIndex + 1,
      difficulty: q.difficulty,
      topicId,
      status: "approved",
      dateApproved: new Date(),
      funFact: q.funFact ?? null,
      topicTags: JSON.stringify(q.tags ?? []),
    };

    const existing = await prisma.question.findFirst({
      where: { question: q.prompt },
      select: { id: true },
    });

    if (existing) {
      await prisma.question.update({ where: { id: existing.id }, data });
      updated++;
    } else {
      await prisma.question.create({ data });
      created++;
    }
  }

  console.log(`  ✓ ${created} question(s) created, ${updated} updated`);

  // 3. Optionally retire the old off-brand topics
  if (RETIRE_OLD) {
    const kaspaNames = [...KASPA_CATEGORIES] as string[];
    const retired = await prisma.topic.updateMany({
      where: { name: { notIn: kaspaNames }, isActive: true },
      data: { isActive: false },
    });
    console.log(`  ✓ ${retired.count} legacy topic(s) deactivated (history preserved)`);

    // Take their questions out of rotation too, without deleting them.
    const legacyTopics = await prisma.topic.findMany({
      where: { name: { notIn: kaspaNames } },
      select: { id: true },
    });
    if (legacyTopics.length) {
      const pulled = await prisma.question.updateMany({
        where: {
          topicId: { in: legacyTopics.map((t) => t.id) },
          status: "approved",
        },
        data: { status: "archived" },
      });
      console.log(`  ✓ ${pulled.count} legacy question(s) archived`);
    }
  } else {
    console.log("\n  (run with --retire-old to take non-Kaspa topics out of rotation)");
  }

  // 4. Report
  const perTopic = await prisma.topic.findMany({
    where: { name: { in: [...KASPA_CATEGORIES] as string[] } },
    select: {
      name: true,
      icon: true,
      _count: { select: { questions: true } },
    },
    orderBy: { name: "asc" },
  });

  console.log("\n  Kaspa question bank:");
  for (const t of perTopic) {
    console.log(`    ${t.icon}  ${t.name.padEnd(28)} ${t._count.questions} questions`);
  }

  const volatileCount = KASPA_QUESTIONS.filter((q) => q.volatile).length;
  if (volatileCount) {
    console.log(
      `\n  ! ${volatileCount} question(s) depend on the current state of the network.` +
        `\n    Review them with: npm run seed:kaspa -- --list-volatile`
    );
  }
  console.log("");
}

main()
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
