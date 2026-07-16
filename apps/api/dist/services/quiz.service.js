export class QuizService {
    constructor(prisma) {
        Object.defineProperty(this, "prisma", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: prisma
        });
    }
    async getGauntletQuestions(category) {
        // Logic for 10-round Geek Gauntlet
        return this.prisma.question.findMany({
            where: { topic: { name: category }, status: "approved" },
            include: { topic: true },
            take: 10,
        });
    }
}
