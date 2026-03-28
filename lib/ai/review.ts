import { prisma } from "@/lib/prisma";
import { generateChatCompletion } from "@/lib/ai/client";

function extractSection(text: string, label: string) {
  const pattern = new RegExp(`${label}:\\s*([\\s\\S]*?)(?=\\n[^\\n]+:|$)`);
  return text.match(pattern)?.[1]?.trim() ?? "";
}

export async function buildQuestionReview({
  questionId,
  selectedChoiceId,
  sessionId,
  userId
}: {
  questionId: string;
  selectedChoiceId?: string;
  sessionId?: string;
  userId: string;
}) {
  const question = await prisma.question.findUnique({
    where: { id: questionId },
    include: {
      type: true,
      choices: {
        orderBy: {
          orderIndex: "asc"
        }
      }
    }
  });

  if (!question) {
    throw new Error("문항을 찾을 수 없습니다.");
  }

  const correctChoice = question.choices.find((choice) => choice.isCorrect);
  const selectedChoice = question.choices.find((choice) => choice.id === selectedChoiceId);

  if (!correctChoice) {
    throw new Error("문항에 정답 선지가 없습니다.");
  }

  const fallback = {
    correctAnswer: `${correctChoice.label}. ${correctChoice.content}`,
    conciseExplanation: question.explanation,
    fastStrategy: question.fastStrategy,
    commonTrap: question.commonTrap,
    takeaway: question.takeaway,
    provider: "기본 코칭",
    model: "deterministic"
  };

  const prompt = [
    "당신은 SKCT 전략 코치입니다.",
    "아래 형식을 정확히 지켜서 각 항목을 한 줄 이상으로 작성하세요.",
    "핵심 설명:",
    "빠른 풀이 전략:",
    "자주 걸리는 함정:",
    "한 줄 포인트:",
    "",
    `문항 유형: ${question.type.name}`,
    `문항: ${question.prompt}`,
    question.passage ? `지문: ${question.passage}` : "",
    `정답: ${correctChoice.label}. ${correctChoice.content}`,
    selectedChoice ? `사용자 선택: ${selectedChoice.label}. ${selectedChoice.content}` : "사용자 선택: 미응답",
    `저장된 설명: ${question.explanation}`,
    `저장된 빠른 전략: ${question.fastStrategy}`,
    `저장된 함정: ${question.commonTrap}`,
    `저장된 포인트: ${question.takeaway}`,
    "답변은 한국어로, 짧고 실전적으로 작성하세요. 교과서식 장문 설명은 피하세요."
  ]
    .filter(Boolean)
    .join("\n");

  const started = Date.now();

  try {
    const ai = await generateChatCompletion([
      {
        role: "system",
        content:
          "당신은 SKCT 오답 리뷰용 코치입니다. 다음 번에 더 빨리 풀 수 있는 방법을 한국어로 짧게 설명하세요."
      },
      {
        role: "user",
        content: prompt
      }
    ]);

    if (!ai?.content) {
      return fallback;
    }

    await prisma.aIReviewLog.create({
      data: {
        userId,
        questionId,
        sessionId,
        provider: "openai-compatible",
        model: ai.model,
        prompt,
        response: ai.content,
        latencyMs: Date.now() - started
      }
    });

    return {
      correctAnswer: `${correctChoice.label}. ${correctChoice.content}`,
      conciseExplanation:
        extractSection(ai.content, "핵심 설명") || fallback.conciseExplanation,
      fastStrategy: extractSection(ai.content, "빠른 풀이 전략") || fallback.fastStrategy,
      commonTrap: extractSection(ai.content, "자주 걸리는 함정") || fallback.commonTrap,
      takeaway: extractSection(ai.content, "한 줄 포인트") || fallback.takeaway,
      provider: "AI 코칭",
      model: ai.model
    };
  } catch {
    return fallback;
  }
}
