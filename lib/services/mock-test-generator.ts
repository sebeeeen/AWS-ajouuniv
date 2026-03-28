import { QuestionType, SessionMode, SessionStatus, SelfAssessment } from "@prisma/client";

import { prisma } from "@/lib/prisma";

const RECENT_ATTEMPT_HOURS = 24;

const MODE_CONFIG: Record<
  SessionMode,
  {
    title: string;
    perTypeCount: number;
    defaultTimeSeconds: number;
    wrongFocused: boolean;
  }
> = {
  FULL_MOCK: {
    title: "전체 SKCT 실전 모드",
    perTypeCount: 3,
    defaultTimeSeconds: 75,
    wrongFocused: false
  },
  FULL_WRONG: {
    title: "전체 오답 모의고사",
    perTypeCount: 3,
    defaultTimeSeconds: 45,
    wrongFocused: true
  },
  MINI_WRONG: {
    title: "미니 오답 모의고사",
    perTypeCount: 1,
    defaultTimeSeconds: 45,
    wrongFocused: true
  },
  WEAK_TYPE_WRONG: {
    title: "약점 유형 집중 모드",
    perTypeCount: 4,
    defaultTimeSeconds: 45,
    wrongFocused: true
  }
};

type GenerateInput = {
  userId: string;
  mode: SessionMode;
  weakTypeKey?: string;
};

function getRecentThreshold() {
  return new Date(Date.now() - RECENT_ATTEMPT_HOURS * 60 * 60 * 1000);
}

function scoreHistory(history: {
  wrongCount: number;
  unsureCount: number;
  correctCount: number;
  strengthScore: number;
  lastAttemptedAt: Date | null;
}) {
  const ageFactor = history.lastAttemptedAt
    ? Math.min(
        2,
        (Date.now() - history.lastAttemptedAt.getTime()) / (1000 * 60 * 60 * 24 * 7)
      )
    : 2;

  return history.strengthScore + history.wrongCount * 1.8 + history.unsureCount * 0.8 - history.correctCount * 0.6 + ageFactor;
}

function buildTypeSummary(
  histories: Array<{
    questionTypeId: string;
    wrongCount: number;
    unsureCount: number;
    strengthScore: number;
  }>
) {
  const map = new Map<string, number>();

  for (const history of histories) {
    const current = map.get(history.questionTypeId) ?? 0;
    map.set(
      history.questionTypeId,
      current + history.wrongCount * 2 + history.unsureCount + history.strengthScore
    );
  }

  return map;
}

function orderTypes(types: QuestionType[], selectedTypeId?: string) {
  if (!selectedTypeId) {
    return types;
  }

  return types.filter((type) => type.id === selectedTypeId);
}

export async function generateMockTest(input: GenerateInput) {
  const config = MODE_CONFIG[input.mode];
  const recentThreshold = getRecentThreshold();

  const [types, histories, recentAttempts] = await Promise.all([
    prisma.questionType.findMany({
      orderBy: {
        sectionOrder: "asc"
      }
    }),
    prisma.wrongAnswerHistory.findMany({
      where: {
        userId: input.userId
      },
      include: {
        question: {
          include: {
            type: true
          }
        }
      }
    }),
    prisma.userAttempt.findMany({
      where: {
        userId: input.userId,
        attemptedAt: {
          gte: recentThreshold
        }
      },
      select: {
        questionId: true
      }
    })
  ]);

  const recentQuestionIds = new Set(recentAttempts.map((attempt) => attempt.questionId));
  const typeSummary = buildTypeSummary(histories);

  let weakTypeId = types[0]?.id;

  if (input.weakTypeKey) {
    weakTypeId = types.find((type) => type.key === input.weakTypeKey)?.id ?? weakTypeId;
  } else if (input.mode === SessionMode.WEAK_TYPE_WRONG) {
    weakTypeId = [...typeSummary.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? weakTypeId;
  }

  const orderedTypes = orderTypes(types, input.mode === SessionMode.WEAK_TYPE_WRONG ? weakTypeId : undefined);
  const selectedQuestions: Array<{
    questionId: string;
    questionTypeId: string;
    timeLimitSeconds: number;
  }> = [];
  const usedQuestionIds = new Set<string>();

  for (const type of orderedTypes) {
    const targetCount = config.perTypeCount;
    const typeHistories = histories
      .filter((history) => history.questionTypeId === type.id)
      .sort((a, b) => scoreHistory(b) - scoreHistory(a));

    const prioritizedHistoryIds = typeHistories
      .map((history) => history.questionId)
      .filter((questionId) => !recentQuestionIds.has(questionId) && !usedQuestionIds.has(questionId));

    const fillFromHistory = prioritizedHistoryIds.slice(0, targetCount);

    for (const questionId of fillFromHistory) {
      usedQuestionIds.add(questionId);
      selectedQuestions.push({
        questionId,
        questionTypeId: type.id,
        timeLimitSeconds: config.defaultTimeSeconds || type.defaultTimeSeconds
      });
    }

    if (selectedQuestions.filter((question) => question.questionTypeId === type.id).length >= targetCount) {
      continue;
    }

    const fallbackPool = await prisma.question.findMany({
      where: {
        typeId: type.id,
        ...(config.wrongFocused
          ? {
              OR: [
                {
                  wrongAnswerHistory: {
                    some: {
                      userId: input.userId,
                      lastOutcome: {
                        in: [SelfAssessment.WRONG, SelfAssessment.UNSURE]
                      }
                    }
                  }
                },
                {
                  attempts: {
                    none: {
                      userId: input.userId,
                      attemptedAt: {
                        gte: recentThreshold
                      }
                    }
                  }
                }
              ]
            }
          : {})
      },
      include: {
        wrongAnswerHistory: {
          where: {
            userId: input.userId
          }
        }
      },
      orderBy: [
        {
          difficulty: "asc"
        },
        {
          code: "asc"
        }
      ]
    });

    for (const question of fallbackPool) {
      if (usedQuestionIds.has(question.id) || recentQuestionIds.has(question.id)) {
        continue;
      }

      usedQuestionIds.add(question.id);
      selectedQuestions.push({
        questionId: question.id,
        questionTypeId: type.id,
        timeLimitSeconds: config.defaultTimeSeconds || type.defaultTimeSeconds
      });

      if (selectedQuestions.filter((item) => item.questionTypeId === type.id).length >= targetCount) {
        break;
      }
    }
  }

  const session = await prisma.mockTestSession.create({
    data: {
      userId: input.userId,
      mode: input.mode,
      status: SessionStatus.READY,
      title:
        input.mode === SessionMode.WEAK_TYPE_WRONG && weakTypeId
          ? `${config.title} · ${types.find((type) => type.id === weakTypeId)?.name ?? "집중 훈련"}`
          : config.title,
      config: {
        weakTypeId: input.mode === SessionMode.WEAK_TYPE_WRONG ? weakTypeId : null,
        generatedAt: new Date().toISOString()
      },
      sessionQuestions: {
        create: selectedQuestions.map((question, index) => ({
          orderIndex: index,
          questionId: question.questionId,
          questionTypeId: question.questionTypeId,
          timeLimitSeconds: question.timeLimitSeconds
        }))
      }
    },
    include: {
      sessionQuestions: true
    }
  });

  return session;
}

export async function getGeneratorPreview(userId: string) {
  const [types, histories] = await Promise.all([
    prisma.questionType.findMany({
      orderBy: { sectionOrder: "asc" }
    }),
    prisma.wrongAnswerHistory.findMany({
      where: { userId }
    })
  ]);

  const typeSummary = buildTypeSummary(histories);

  return types.map((type) => ({
    id: type.id,
    key: type.key,
    name: type.name,
    weaknessScore: Number((typeSummary.get(type.id) ?? 0).toFixed(1))
  }));
}
