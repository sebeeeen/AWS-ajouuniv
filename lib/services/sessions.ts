import { Prisma, ReviewState, SelfAssessment, SessionStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { average, percent } from "@/lib/utils";
import type { SessionSubmissionPayload, SolveSessionData } from "@/lib/types";

function computeStrengthScore(params: {
  wrongCount: number;
  unsureCount: number;
  correctCount: number;
}) {
  return Math.max(
    0,
    Number((params.wrongCount * 1.5 + params.unsureCount * 0.8 - params.correctCount * 0.4).toFixed(2))
  );
}

export async function getSolveSession(
  sessionId: string,
  userId: string
): Promise<SolveSessionData | null> {
  const session = await prisma.mockTestSession.findFirst({
    where: { id: sessionId, userId },
    include: {
      sessionQuestions: {
        orderBy: {
          orderIndex: "asc"
        },
        include: {
          questionType: true,
          question: {
            include: {
              choices: {
                orderBy: {
                  orderIndex: "asc"
                }
              }
            }
          }
        }
      }
    }
  });

  if (!session) {
    return null;
  }

  return {
    id: session.id,
    title: session.title,
    mode: session.mode,
    status: session.status,
    startedAt: session.startedAt?.toISOString() ?? null,
    questions: session.sessionQuestions.map((item) => ({
      id: item.question.id,
      code: item.question.code,
      orderIndex: item.orderIndex,
      timeLimitSeconds: item.timeLimitSeconds,
      typeName: item.questionType.name,
      typeKey: item.questionType.key,
      prompt: item.question.prompt,
      passage: item.question.passage,
      explanation: item.question.explanation,
      fastStrategy: item.question.fastStrategy,
      commonTrap: item.question.commonTrap,
      takeaway: item.question.takeaway,
      choices: item.question.choices.map((choice) => ({
        id: choice.id,
        label: choice.label,
        content: choice.content,
        isCorrect: choice.isCorrect
      }))
    }))
  };
}

export async function ensureSessionStarted(sessionId: string, userId: string) {
  return prisma.mockTestSession.updateMany({
    where: {
      id: sessionId,
      userId,
      startedAt: null
    },
    data: {
      status: SessionStatus.IN_PROGRESS,
      startedAt: new Date()
    }
  });
}

export async function submitSession(
  sessionId: string,
  userId: string,
  payload: SessionSubmissionPayload
) {
  const session = await prisma.mockTestSession.findUnique({
    where: { id: sessionId },
    include: {
      sessionQuestions: {
        include: {
          questionType: true,
          question: {
            include: {
              choices: true
            }
          }
        }
      }
    }
  });

  if (!session) {
    throw new Error("세션을 찾을 수 없습니다.");
  }

  const answerMap = new Map(payload.answers.map((answer) => [answer.questionId, answer]));

  const transactionItems: Prisma.PrismaPromise<unknown>[] = [];
  const reviewRows: Array<{
    questionId: string;
    typeName: string;
    code: string;
    prompt: string;
    correctAnswer: string;
    selectedAnswer: string;
    isCorrect: boolean;
    elapsedSeconds: number;
    explanation: string;
    fastStrategy: string;
    commonTrap: string;
    takeaway: string;
  }> = [];

  for (const sessionQuestion of session.sessionQuestions) {
    const answer = answerMap.get(sessionQuestion.questionId);
    const correctChoice = sessionQuestion.question.choices.find((choice) => choice.isCorrect);
    const selectedChoice = sessionQuestion.question.choices.find(
      (choice) => choice.id === answer?.selectedChoiceId
    );
    const isCorrect = correctChoice?.id === selectedChoice?.id;
    const selfAssessment = answer?.selfAssessment ?? SelfAssessment.UNSURE;

    transactionItems.push(
      prisma.userAttempt.create({
        data: {
          userId,
          sessionId,
          questionId: sessionQuestion.questionId,
          selectedChoiceId: answer?.selectedChoiceId,
          selfAssessment,
          elapsedSeconds: answer?.elapsedSeconds ?? 0,
          isCorrect
        }
      })
    );

    if (answer?.memo?.trim()) {
      transactionItems.push(
        prisma.memo.upsert({
          where: {
            sessionId_questionId: {
              sessionId,
              questionId: sessionQuestion.questionId
            }
          },
          update: {
            content: answer.memo.trim()
          },
          create: {
            userId,
            sessionId,
            questionId: sessionQuestion.questionId,
            content: answer.memo.trim()
          }
        })
      );
    }

    transactionItems.push(
      prisma.wrongAnswerHistory.upsert({
        where: {
          userId_questionId: {
            userId,
            questionId: sessionQuestion.questionId
          }
        },
        update: {},
        create: {
          userId,
          questionId: sessionQuestion.questionId,
          questionTypeId: sessionQuestion.questionTypeId,
          wrongCount: 0,
          unsureCount: 0,
          correctCount: 0,
          strengthScore: 0,
          reviewState: ReviewState.NEW
        }
      })
    );

    reviewRows.push({
      questionId: sessionQuestion.questionId,
      typeName: sessionQuestion.questionType.name,
      code: sessionQuestion.question.code,
      prompt: sessionQuestion.question.prompt,
      correctAnswer: correctChoice
        ? `${correctChoice.label}. ${correctChoice.content}`
        : "-",
      selectedAnswer: selectedChoice
        ? `${selectedChoice.label}. ${selectedChoice.content}`
        : "미응답",
      isCorrect,
      elapsedSeconds: answer?.elapsedSeconds ?? 0,
      explanation: sessionQuestion.question.explanation,
      fastStrategy: sessionQuestion.question.fastStrategy,
      commonTrap: sessionQuestion.question.commonTrap,
      takeaway: sessionQuestion.question.takeaway
    });
  }

  await prisma.$transaction(transactionItems);

  for (const sessionQuestion of session.sessionQuestions) {
    const answer = answerMap.get(sessionQuestion.questionId);
    const selectedChoice = sessionQuestion.question.choices.find(
      (choice) => choice.id === answer?.selectedChoiceId
    );
    const correctChoice = sessionQuestion.question.choices.find((choice) => choice.isCorrect);
    const isCorrect = correctChoice?.id === selectedChoice?.id;
    const selfAssessment = answer?.selfAssessment ?? SelfAssessment.UNSURE;

    const existing = await prisma.wrongAnswerHistory.findUnique({
      where: {
        userId_questionId: {
          userId,
          questionId: sessionQuestion.questionId
        }
      }
    });

    const wrongCount = (existing?.wrongCount ?? 0) + (selfAssessment === SelfAssessment.WRONG || !isCorrect ? 1 : 0);
    const unsureCount = (existing?.unsureCount ?? 0) + (selfAssessment === SelfAssessment.UNSURE ? 1 : 0);
    const correctCount = (existing?.correctCount ?? 0) + (isCorrect ? 1 : 0);
    const strengthScore = computeStrengthScore({ wrongCount, unsureCount, correctCount });

    await prisma.wrongAnswerHistory.update({
      where: {
        userId_questionId: {
          userId,
          questionId: sessionQuestion.questionId
        }
      },
      data: {
        wrongCount,
        unsureCount,
        correctCount,
        strengthScore,
        lastOutcome: isCorrect ? SelfAssessment.CORRECT : selfAssessment,
        lastAttemptedAt: new Date(),
        reviewState:
          strengthScore >= 2.5
            ? ReviewState.REVIEWING
            : strengthScore >= 1.2
              ? ReviewState.IMPROVING
              : ReviewState.STABLE
      }
    });
  }

  await prisma.mockTestSession.update({
    where: { id: sessionId },
    data: {
      status: SessionStatus.COMPLETED,
      completedAt: new Date()
    }
  });

  const accuracy = percent(reviewRows.filter((row) => row.isCorrect).length, reviewRows.length);
  const averageTime = Math.round(average(reviewRows.map((row) => row.elapsedSeconds)));

  return {
    accuracy,
    averageTime,
    totalQuestions: reviewRows.length,
    reviewRows
  };
}

export async function getSessionResults(sessionId: string, userId: string) {
  const session = await prisma.mockTestSession.findFirst({
    where: { id: sessionId, userId },
    include: {
      attempts: {
        orderBy: {
          attemptedAt: "asc"
        },
        include: {
          question: {
            include: {
              type: true,
              choices: true
            }
          }
        }
      },
      memos: true
    }
  });

  if (!session) {
    return null;
  }

  const reviewRows = session.attempts.map((attempt) => {
    const correctChoice = attempt.question.choices.find((choice) => choice.isCorrect);
    const selectedChoice = attempt.question.choices.find(
      (choice) => choice.id === attempt.selectedChoiceId
    );

    return {
      questionId: attempt.questionId,
      typeName: attempt.question.type.name,
      prompt: attempt.question.prompt,
      code: attempt.question.code,
      elapsedSeconds: attempt.elapsedSeconds,
      isCorrect: attempt.isCorrect,
      selectedAnswer: selectedChoice
        ? `${selectedChoice.label}. ${selectedChoice.content}`
        : "미응답",
      correctAnswer: correctChoice
        ? `${correctChoice.label}. ${correctChoice.content}`
        : "-",
      explanation: attempt.question.explanation,
      fastStrategy: attempt.question.fastStrategy,
      commonTrap: attempt.question.commonTrap,
      takeaway: attempt.question.takeaway,
      memo:
        session.memos.find((memo) => memo.questionId === attempt.questionId)?.content ?? ""
    };
  });

  const typePerformance = Object.values(
    reviewRows.reduce<Record<string, { total: number; correct: number; time: number }>>(
      (accumulator, row) => {
        accumulator[row.typeName] ||= { total: 0, correct: 0, time: 0 };
        accumulator[row.typeName].total += 1;
        accumulator[row.typeName].correct += row.isCorrect ? 1 : 0;
        accumulator[row.typeName].time += row.elapsedSeconds;
        return accumulator;
      },
      {}
    )
  );

  const weakSections = reviewRows
    .filter((row) => !row.isCorrect)
    .reduce<Record<string, number>>((accumulator, row) => {
      accumulator[row.typeName] = (accumulator[row.typeName] ?? 0) + 1;
      return accumulator;
    }, {});

  const aiHabitSummary = buildHabitSummary(reviewRows);

  return {
    id: session.id,
    title: session.title,
    mode: session.mode,
    completedAt: session.completedAt,
    accuracy: percent(reviewRows.filter((row) => row.isCorrect).length, reviewRows.length),
    averageTime: Math.round(average(reviewRows.map((row) => row.elapsedSeconds))),
    reviewRows,
    typePerformance: Object.entries(weakSections)
      .map(([typeName, misses]) => ({
        typeName,
        misses
      }))
      .sort((a, b) => b.misses - a.misses),
    aiHabitSummary
  };
}

function buildHabitSummary(
  rows: Array<{ isCorrect: boolean; elapsedSeconds: number; typeName: string }>
) {
  const slowRows = rows.filter((row) => row.elapsedSeconds >= 40).length;
  const unsureRows = rows.filter((row) => !row.isCorrect && row.elapsedSeconds < 20).length;
  const weakestType =
    Object.entries(
      rows.reduce<Record<string, number>>((accumulator, row) => {
        if (!row.isCorrect) {
          accumulator[row.typeName] = (accumulator[row.typeName] ?? 0) + 1;
        }
        return accumulator;
      }, {})
    ).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "없음";

  const notes = [
    slowRows > rows.length / 2
      ? "많은 문항에서 시간을 오래 쓰고 있습니다. 1차 풀이에서 선지 제거 기준을 더 빨리 적용하는 편이 좋습니다."
      : "전반적인 속도는 안정적입니다. 쉬운 문항에서는 과도한 재검토를 줄여 현재 리듬을 유지하세요.",
    unsureRows >= 2
      ? "짧은 시간 안에 나온 오답이 몇 개 있어, 지식 부족보다는 성급한 확정 선택이 원인일 가능성이 큽니다."
      : "대부분의 오답은 충분한 시간을 쓴 뒤 발생했습니다. 다음에는 풀이 방식 선택을 더 빠르게 다듬는 것이 좋습니다.",
    `현재 가장 약한 영역은 ${weakestType}입니다.`
  ];

  return notes.join(" ");
}
