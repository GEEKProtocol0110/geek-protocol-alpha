import { PrismaClient } from "@prisma/client";

export class QuizService {
  constructor(private prisma: PrismaClient) {}

  async getGauntletQuestions(category: string) {
    // Logic for 10-round Geek Gauntlet
    return this.prisma.question.findMany({
      where: { category, active: true },
      take: 10,
    });
  }
}
