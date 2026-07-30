import { FastifyInstance } from "fastify";
import { z } from "zod";
import { logger } from "../lib/logger";
import {
  APPROVAL_THRESHOLD,
  REJECTION_THRESHOLD,
  MIN_LEVEL,
  MIN_REVIEW_SECONDS,
  REVIEW_REWARD_GEEK,
  cappedCreatorIds,
  getReviewEligibility,
  recomputeReviewerAccuracy,
} from "../lib/reviewIntegrity";

const SubmitSchema = z.object({
  question: z.string().min(10).max(500),
  option1: z.string().min(1).max(200),
  option2: z.string().min(1).max(200),
  option3: z.string().min(1).max(200),
  option4: z.string().min(1).max(200),
  correctOption: z.number().int().min(1).max(4),
  difficulty: z.enum(["easy", "medium", "hard"]),
  topicId: z.number().int().positive(),
  subtopic: z.string().max(100).optional(),
  funFact: z.string().max(500).optional(),
  sourceLink: z.string().url().optional().or(z.literal("")),
});

const ReviewSchema = z.object({
  questionId: z.number().int().positive(),
  action: z.enum(["approve", "reject"]),
  detailedFeedback: z.string().max(500).optional(),
  /** Seconds the reviewer spent on this question, from the review UI. */
  reviewTime: z.number().min(0).max(3600).optional(),
});

export async function cceRoutes(fastify: FastifyInstance) {
  // GET /api/cce/dashboard — creator stats for the current user
  fastify.get("/dashboard", { preHandler: fastify.authenticate }, async (req, reply) => {
    const userId = req.jwtUser!.userId;
    const user = await fastify.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: {
        level: true,
        questionsSubmitted: true,
        questionsApproved: true,
        questionsRejected: true,
        reviewsCompleted: true,
        reviewAccuracy: true,
        totalEarnedGeek: true,
        geekBalance: true,
      },
    });

    if (user.level < MIN_LEVEL) {
      return reply.code(403).send({ error: `CCE requires Level ${MIN_LEVEL} or higher.` });
    }

    // Top 5 earning questions
    const topQuestions = await fastify.prisma.question.findMany({
      where: { createdBy: userId },
      orderBy: { totalEarned: "desc" },
      take: 5,
      select: {
        id: true,
        question: true,
        totalEarned: true,
        totalServes: true,
        status: true,
        topic: { select: { name: true } },
      },
    });

    // Is there a question in the review queue NOT created by this user?
    const reviewAvailable = await fastify.prisma.reviewQueue.findFirst({
      where: { question: { createdBy: { not: userId }, status: "pending" } },
      select: { id: true },
    });

    const approvalRate =
      user.questionsSubmitted > 0
        ? Math.round((user.questionsApproved / user.questionsSubmitted) * 100)
        : 0;

    return reply.send({
      data: {
        level: user.level,
        questionsSubmitted: user.questionsSubmitted,
        questionsApproved: user.questionsApproved,
        questionsRejected: user.questionsRejected,
        approvalRate,
        reviewsCompleted: user.reviewsCompleted,
        reviewAccuracy: Math.round(user.reviewAccuracy),
        totalEarnedGeek: user.totalEarnedGeek,
        geekBalance: user.geekBalance,
        topQuestions,
        reviewAvailable: !!reviewAvailable,
      },
    });
  });

  // GET /api/cce/topics — list of topics
  fastify.get("/topics", { preHandler: fastify.authenticate }, async (_req, reply) => {
    const topics = await fastify.prisma.topic.findMany({
      where: { isActive: true },
      select: { id: true, name: true, icon: true },
      orderBy: { name: "asc" },
    });
    return reply.send({ data: topics });
  });

  // POST /api/cce/submit — submit a new question
  fastify.post("/submit", { preHandler: fastify.authenticate }, async (req, reply) => {
    const userId = req.jwtUser!.userId;
    const user = await fastify.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { level: true },
    });
    if (user.level < MIN_LEVEL) {
      return reply.code(403).send({ error: `CCE requires Level ${MIN_LEVEL}.` });
    }

    const parse = SubmitSchema.safeParse(req.body);
    if (!parse.success) return reply.code(400).send({ error: parse.error.flatten() });

    const d = parse.data;
    const question = await fastify.prisma.question.create({
      data: {
        question: d.question,
        option1: d.option1,
        option2: d.option2,
        option3: d.option3,
        option4: d.option4,
        correctOption: d.correctOption,
        difficulty: d.difficulty,
        topicId: d.topicId,
        subtopic: d.subtopic,
        funFact: d.funFact,
        sourceLink: d.sourceLink || null,
        createdBy: userId,
        status: "pending",
      },
    });

    // Add to review queue
    await fastify.prisma.reviewQueue.create({ data: { questionId: question.id } });

    // Increment user counter
    await fastify.prisma.user.update({
      where: { id: userId },
      data: { questionsSubmitted: { increment: 1 } },
    });

    return reply.code(201).send({ data: question });
  });

  // GET /api/cce/eligibility — why the user can or can't review right now
  fastify.get("/eligibility", { preHandler: fastify.authenticate }, async (req, reply) => {
    const eligibility = await getReviewEligibility(fastify.prisma, req.jwtUser!.userId);
    return reply.send({ data: eligibility });
  });

  // GET /api/cce/review/next — serve a RANDOM question from the eligible pool.
  // Reviewers cannot choose what they review, so a ring cannot steer itself
  // toward its own submissions.
  fastify.get("/review/next", { preHandler: fastify.authenticate }, async (req, reply) => {
    const userId = req.jwtUser!.userId;

    const eligibility = await getReviewEligibility(fastify.prisma, userId);
    if (!eligibility.eligible) {
      return reply.code(403).send({ error: eligibility.reasons.join(" "), data: eligibility });
    }

    // Already reviewed by this user?
    const reviewed = await fastify.prisma.questionValidation.findMany({
      where: { validatorId: userId },
      select: { questionId: true },
    });
    const reviewedIds = reviewed.map((r) => r.questionId);

    // Creators this reviewer has already voted on too often this week.
    const blockedCreators = await cappedCreatorIds(fastify.prisma, userId);

    const where = {
      question: {
        status: "pending",
        createdBy: {
          not: userId,
          ...(blockedCreators.length ? { notIn: blockedCreators } : {}),
        },
        ...(reviewedIds.length ? { id: { notIn: reviewedIds } } : {}),
      },
    };

    const candidates = await fastify.prisma.reviewQueue.count({ where });
    if (candidates === 0) return reply.send({ data: null, eligibility });

    // Random offset into the eligible pool rather than a deterministic
    // priority ordering — two colluding accounts hitting this endpoint at the
    // same moment no longer receive the same question.
    const skip = Math.floor(Math.random() * candidates);

    const entry = await fastify.prisma.reviewQueue.findFirst({
      where,
      skip,
      include: {
        question: {
          include: {
            topic: { select: { name: true } },
          },
        },
      },
    });

    if (!entry) return reply.send({ data: null, eligibility });

    await fastify.prisma.reviewQueue.update({
      where: { id: entry.id },
      data: { lastShown: new Date() },
    });

    // Hide correct answer and author from the reviewer. Concealing the author
    // means a colluder cannot recognise a partner's submission even if one
    // reaches them.
    const { correctOption: _hidden, createdBy: _author, ...safeQ } = entry.question;
    void _hidden;
    void _author;
    return reply.send({ data: safeQ, eligibility });
  });

  // POST /api/cce/review — submit a review decision
  fastify.post("/review", { preHandler: fastify.authenticate }, async (req, reply) => {
    const userId = req.jwtUser!.userId;

    // Re-check every gate at vote time. The serving endpoint's check is only a
    // UI convenience; this is the one that actually protects the reward pool.
    const eligibility = await getReviewEligibility(fastify.prisma, userId);
    if (!eligibility.eligible) {
      return reply.code(403).send({ error: eligibility.reasons.join(" "), data: eligibility });
    }

    const parse = ReviewSchema.safeParse(req.body);
    if (!parse.success) return reply.code(400).send({ error: parse.error.flatten() });

    const { questionId, action, detailedFeedback, reviewTime } = parse.data;

    if (reviewTime !== undefined && reviewTime < MIN_REVIEW_SECONDS) {
      return reply.code(429).send({
        error: `Please spend at least ${MIN_REVIEW_SECONDS}s reviewing before voting.`,
      });
    }

    const question = await fastify.prisma.question.findUnique({ where: { id: questionId } });
    if (!question) return reply.code(404).send({ error: "Question not found" });
    if (question.createdBy === userId) return reply.code(403).send({ error: "Cannot review own question" });
    if (question.status !== "pending") return reply.code(409).send({ error: "Question already reviewed" });

    // Weekly per-creator cap — the rule that stops a ring waving through
    // everything its own members submit.
    const blockedCreators = await cappedCreatorIds(fastify.prisma, userId);
    if (question.createdBy != null && blockedCreators.includes(question.createdBy)) {
      logger.warn(
        { userId, creatorId: question.createdBy, questionId },
        "Review blocked: weekly per-creator cap reached"
      );
      return reply.code(403).send({
        error: "You have reviewed too many questions from this creator this week.",
      });
    }

    // Check not double-reviewing
    const already = await fastify.prisma.questionValidation.findFirst({
      where: { questionId, validatorId: userId },
    });
    if (already) return reply.code(409).send({ error: "Already reviewed this question" });

    const geekReward = REVIEW_REWARD_GEEK;

    await fastify.prisma.questionValidation.create({
      data: {
        questionId,
        validatorId: userId,
        action,
        geekAwarded: geekReward,
        reviewTime: reviewTime ?? 0,
        detailedFeedback: detailedFeedback || null,
      },
    });

    // Update question vote counts
    const updatedQ = await fastify.prisma.question.update({
      where: { id: questionId },
      data: {
        approvalsCount: action === "approve" ? { increment: 1 } : undefined,
        rejectionsCount: action === "reject" ? { increment: 1 } : undefined,
        totalReviews: { increment: 1 },
      },
    });

    // Auto-approve/reject once quorum is reached. APPROVAL_THRESHOLD is 5, not
    // 3 — publishing on three votes meant three sock puppets were a quorum.
    let finalStatus = updatedQ.status;
    let resolved = false;
    if (updatedQ.approvalsCount >= APPROVAL_THRESHOLD) {
      await fastify.prisma.question.update({
        where: { id: questionId },
        data: { status: "approved", dateApproved: new Date() },
      });
      await fastify.prisma.reviewQueue.deleteMany({ where: { questionId } });
      // Reward creator
      if (updatedQ.createdBy) {
        await fastify.prisma.user.update({
          where: { id: updatedQ.createdBy },
          data: { questionsApproved: { increment: 1 } },
        });
      }
      finalStatus = "approved";
      resolved = true;
    } else if (updatedQ.rejectionsCount >= REJECTION_THRESHOLD) {
      await fastify.prisma.question.update({
        where: { id: questionId },
        data: { status: "rejected" },
      });
      await fastify.prisma.reviewQueue.deleteMany({ where: { questionId } });
      if (updatedQ.createdBy) {
        await fastify.prisma.user.update({
          where: { id: updatedQ.createdBy },
          data: { questionsRejected: { increment: 1 } },
        });
      }
      finalStatus = "rejected";
      resolved = true;
    }

    // Reward reviewer
    await fastify.prisma.user.update({
      where: { id: userId },
      data: {
        reviewsCompleted: { increment: 1 },
        geekBalance: { increment: geekReward },
        totalEarnedGeek: { increment: geekReward },
      },
    });

    // On resolution, re-score everyone who voted on it. reviewAccuracy was
    // previously stored but never computed, so it gated nothing; now it is the
    // number that suspends rubber-stampers.
    if (resolved) {
      const voters = await fastify.prisma.questionValidation.findMany({
        where: { questionId },
        select: { validatorId: true },
      });
      const uniqueVoters = [...new Set(voters.map((v) => v.validatorId))];
      await Promise.all(
        uniqueVoters.map((id) => recomputeReviewerAccuracy(fastify.prisma, id))
      );
    }

    const after = await getReviewEligibility(fastify.prisma, userId);
    return reply.send({
      data: {
        status: finalStatus,
        geekAwarded: geekReward,
        reviewsRemainingToday: after.reviewsRemainingToday,
        accuracyPct: after.accuracyPct,
      },
    });
  });

  // GET /api/cce/my-questions — paginated list of user's submitted questions
  fastify.get("/my-questions", { preHandler: fastify.authenticate }, async (req, reply) => {
    const userId = req.jwtUser!.userId;
    const { page = "1", status } = req.query as { page?: string; status?: string };
    const pageNum = Math.max(1, parseInt(page));
    const take = 10;
    const skip = (pageNum - 1) * take;

    const where: Record<string, unknown> = { createdBy: userId };
    if (status && ["pending", "approved", "rejected"].includes(status)) where.status = status;

    const [questions, total] = await Promise.all([
      fastify.prisma.question.findMany({
        where,
        orderBy: { dateCreated: "desc" },
        skip,
        take,
        select: {
          id: true,
          question: true,
          status: true,
          difficulty: true,
          dateCreated: true,
          totalServes: true,
          totalEarned: true,
          approvalsCount: true,
          rejectionsCount: true,
          topic: { select: { name: true } },
        },
      }),
      fastify.prisma.question.count({ where }),
    ]);

    return reply.send({ data: questions, total, page: pageNum, pages: Math.ceil(total / take) });
  });

  // GET /api/cce/leaderboard — top creators by earnings
  fastify.get("/leaderboard", { preHandler: fastify.authenticate }, async (_req, reply) => {
    const creators = await fastify.prisma.user.findMany({
      where: { questionsApproved: { gt: 0 } },
      orderBy: { totalEarnedGeek: "desc" },
      take: 50,
      select: {
        id: true,
        username: true,
        level: true,
        questionsApproved: true,
        questionsSubmitted: true,
        totalEarnedGeek: true,
        reviewsCompleted: true,
        reviewAccuracy: true,
      },
    });

    return reply.send({
      data: creators.map((u, i) => ({
        rank: i + 1,
        ...u,
        approvalRate:
          u.questionsSubmitted > 0
            ? Math.round((u.questionsApproved / u.questionsSubmitted) * 100)
            : 0,
      })),
    });
  });
}
