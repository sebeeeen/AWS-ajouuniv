import { SessionStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { average, percent } from "@/lib/utils";

export async function getDashboardData(userId: string) {
  const [sessions, attempts, histories, types] = await Promise.all([
    prisma.mockTestSession.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        sessionQuestions: true
      }
    }),
    prisma.userAttempt.findMany({
      where: { userId },
      include: {
        question: {
          include: {
            type: true
          }
        }
      }
    }),
    prisma.wrongAnswerHistory.findMany({
      where: { userId },
      include: {
        questionType: true,
        question: true
      },
      orderBy: {
        strengthScore: "desc"
      },
      take: 8
    }),
    prisma.questionType.findMany({
      orderBy: { sectionOrder: "asc" }
    })
  ]);

  const completedSessions = sessions.filter((session) => session.status === SessionStatus.COMPLETED);
  const correctAttempts = attempts.filter((attempt) => attempt.isCorrect).length;
  const averageTime = Math.round(average(attempts.map((attempt) => attempt.elapsedSeconds)));

  const typePerformance = types.map((type) => {
    const scoped = attempts.filter((attempt) => attempt.question.typeId === type.id);
    return {
      name: type.name,
      accuracy: percent(
        scoped.filter((attempt) => attempt.isCorrect).length,
        scoped.length
      ),
      avgTime: Math.round(average(scoped.map((attempt) => attempt.elapsedSeconds))),
      volume: scoped.length
    };
  });

  return {
    stats: {
      totalAttempts: attempts.length,
      accuracy: percent(correctAttempts, attempts.length),
      averageTime,
      completedSessions: completedSessions.length,
      reviewQueue: histories.filter((history) => history.strengthScore >= 1.5).length
    },
    typePerformance,
    weakQuestions: histories.map((history) => ({
      id: history.questionId,
      code: history.question.code,
      prompt: history.question.prompt,
      typeName: history.questionType.name,
      strengthScore: Number(history.strengthScore.toFixed(1)),
      lastOutcome: history.lastOutcome
    })),
    recentSessions: sessions.map((session) => ({
      id: session.id,
      title: session.title,
      status: session.status,
      mode: session.mode,
      questionCount: session.sessionQuestions.length,
      createdAt: session.createdAt
    }))
  };
}

