import {
  ImportedWrongQuestionStatus,
  ReviewState,
  SelfAssessment
} from "@prisma/client";

import { generateVisionCompletion } from "@/lib/ai/client";
import { prisma } from "@/lib/prisma";

type ParsedChoice = {
  label: string;
  content: string;
};

export function extractJsonBlock(content: string) {
  const fenced = content.match(/```json\s*([\s\S]*?)```/i)?.[1];
  if (fenced) {
    return fenced.trim();
  }

  const objectText = content.match(/\{[\s\S]*\}/)?.[0];
  return objectText?.trim() ?? "";
}

function normalizeChoiceLabel(rawLabel: string) {
  const value = rawLabel.trim().replace(/[.)]/g, "").toUpperCase();

  if (["1", "①", "A"].includes(value)) return "A";
  if (["2", "②", "B"].includes(value)) return "B";
  if (["3", "③", "C"].includes(value)) return "C";
  if (["4", "④", "D"].includes(value)) return "D";
  if (["5", "⑤", "E"].includes(value)) return "E";

  return value;
}

export function parseQuestionText(content: string) {
  const normalized = content
    .replace(/\r/g, "")
    .replace(/([①②③④⑤])/g, "\n$1 ")
    .replace(/(?:^|\s)([1-5])([.)])/g, "\n$1$2")
    .replace(/(?:^|\s)([A-Ea-e])([.)])/g, "\n$1$2")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const choices: ParsedChoice[] = [];
  const bodyLines: string[] = [];

  for (const line of normalized) {
    const match = line.match(/^([A-Ea-e]|[1-5]|①|②|③|④|⑤)[\s.)-]*(.+)$/);

    if (match) {
      choices.push({
        label: normalizeChoiceLabel(match[1]),
        content: match[2].trim()
      });
      continue;
    }

    if (choices.length > 0) {
      const lastChoice = choices.at(-1);
      if (lastChoice) {
        lastChoice.content = `${lastChoice.content} ${line}`.trim();
      }
      continue;
    }

    bodyLines.push(line);
  }

  const promptLines = bodyLines;
  const passageLines = promptLines.length > 1 ? promptLines.slice(0, -1) : [];

  return {
    prompt: promptLines.at(-1) ?? "",
    passage: passageLines.join("\n") || "",
    choices: choices
      .filter((choice, index, array) => array.findIndex((item) => item.label === choice.label) === index)
      .slice(0, 5)
  };
}

async function generateImportedQuestionCode() {
  const count = await prisma.question.count({
    where: {
      code: {
        startsWith: "IMP-"
      }
    }
  });

  return `IMP-${String(count + 1).padStart(4, "0")}`;
}

export async function runWrongQuestionOcr(params: {
  userId: string;
  imageDataUrl: string;
}) {
  const created = await prisma.importedWrongQuestion.create({
    data: {
      userId: params.userId,
      sourceImageData: params.imageDataUrl,
      status: ImportedWrongQuestionStatus.OCR_PENDING
    }
  });

  const fallback = {
    title: "OCR 결과를 확인해 주세요",
    extractedText:
      "[OCR 자동 추출을 사용하려면 서버에 OPENAI_API_KEY가 필요합니다.]\n\n아래 칸에 문제 지문과 선지를 직접 붙여넣거나 입력해 주세요.\n예시:\n문제 설명...\n① ...\n② ...\n③ ...\n④ ...\n⑤ ...",
    suggestedTypeKey: "verbal-reasoning",
    hasVisual: false,
    visualType: null as string | null
  };

  try {
    const ai = await generateVisionCompletion({
      imageDataUrl: params.imageDataUrl,
      instruction: [
        "이 이미지는 SKCT 오답 문제 캡처입니다.",
        "아래 JSON 형식만 반환하세요.",
        "먼저 그래프, 표, 도형, 차트, 좌표평면처럼 시각 자료가 있는지 판단하세요.",
        "시각 자료가 있으면 hasVisual을 true로 두고 visualType에 graph, table, chart, diagram 중 하나를 넣으세요.",
        "시각 자료가 있더라도 extractedText에는 문제 지문과 보기 텍스트만 정리해서 넣으세요.",
        "그래프 축 값, 표 셀 값, 도형 내부 숫자를 억지로 전부 옮기지 마세요.",
        "시각 자료 내용이 풀이에 필요하면 extractedText 마지막에 '[시각 자료 참고: 원본 이미지 유지]' 한 줄만 추가하세요.",
        '{',
        '  "title": "문제 제목 또는 첫 줄 요약",',
        '  "extractedText": "문제 본문, 보기, 메모를 최대한 줄바꿈 유지해서 추출",',
        '  "suggestedTypeKey": "quantitative-reasoning | verbal-reasoning | data-interpretation",',
        '  "hasVisual": true,',
        '  "visualType": "graph | table | chart | diagram | null"',
        '}',
        "JSON 외의 설명은 쓰지 마세요."
      ].join("\n")
    });

    const parsed = ai?.content ? JSON.parse(extractJsonBlock(ai.content)) : fallback;
    const hasVisual = typeof parsed.hasVisual === "boolean" ? parsed.hasVisual : fallback.hasVisual;
    const visualType =
      typeof parsed.visualType === "string" && parsed.visualType.trim()
        ? parsed.visualType.trim().toLowerCase()
        : fallback.visualType;

    return prisma.importedWrongQuestion.update({
      where: { id: created.id },
      data: {
        title: typeof parsed.title === "string" ? parsed.title : fallback.title,
        hasVisual,
        visualType,
        extractedText:
          typeof parsed.extractedText === "string" ? parsed.extractedText : fallback.extractedText,
        suggestedTypeKey:
          typeof parsed.suggestedTypeKey === "string"
            ? parsed.suggestedTypeKey
            : fallback.suggestedTypeKey,
        status: ImportedWrongQuestionStatus.OCR_COMPLETED
      }
    });
  } catch {
    return prisma.importedWrongQuestion.update({
      where: { id: created.id },
      data: {
        title: fallback.title,
        hasVisual: fallback.hasVisual,
        visualType: fallback.visualType,
        extractedText: fallback.extractedText,
        suggestedTypeKey: fallback.suggestedTypeKey,
        status: ImportedWrongQuestionStatus.OCR_COMPLETED
      }
    });
  }
}

export async function confirmImportedWrongQuestion(params: {
  userId: string;
  id: string;
  title?: string;
  confirmedText: string;
  suggestedTypeKey?: string;
  prompt: string;
  passage?: string;
  choices: ParsedChoice[];
  correctChoiceLabel: string;
}) {
  const type = await prisma.questionType.findUnique({
    where: {
      key: params.suggestedTypeKey?.trim() || "verbal-reasoning"
    }
  });

  if (!type) {
    throw new Error("유형 정보를 찾을 수 없습니다.");
  }

  const normalizedChoices = params.choices
    .map((choice) => ({
      label: normalizeChoiceLabel(choice.label),
      content: choice.content.trim()
    }))
    .filter((choice) => choice.content);

  if (normalizedChoices.length < 2) {
    throw new Error("최소 2개 이상의 선지가 필요합니다.");
  }

  const correctChoiceLabel = normalizeChoiceLabel(params.correctChoiceLabel);
  if (!normalizedChoices.some((choice) => choice.label === correctChoiceLabel)) {
    throw new Error("정답 선지를 확인해 주세요.");
  }

  const existingImported = await prisma.importedWrongQuestion.findFirst({
    where: {
      id: params.id,
      userId: params.userId
    }
  });

  if (!existingImported) {
    throw new Error("등록된 오답 문제를 찾을 수 없습니다.");
  }

  const code = await generateImportedQuestionCode();

  return prisma.$transaction(async (tx) => {
    let questionId = existingImported.questionId;

    if (!questionId) {
      const question = await tx.question.create({
        data: {
          code,
          typeId: type.id,
          prompt: params.prompt.trim(),
          passage: params.passage?.trim() || null,
          difficulty: 2,
          explanation: "업로드한 오답 문제입니다. AI 해설과 개인 메모를 기반으로 다시 검토하세요.",
          fastStrategy: "먼저 조건과 선지를 빠르게 분리하고, 원본 이미지의 그래프나 표는 필요한 순간에만 확인하세요.",
          commonTrap: "OCR 결과만 믿고 시각 자료의 기준값을 놓치면 오답으로 이어질 수 있습니다.",
          takeaway: "직접 등록한 오답은 다음 복습 세션에서 다시 출제됩니다.",
          calculatorAllowed: true,
          tags: "imported,user-wrong",
          choices: {
            create: normalizedChoices.map((choice, index) => ({
              label: choice.label,
              content: choice.content,
              orderIndex: index,
              isCorrect: choice.label === correctChoiceLabel
            }))
          }
        }
      });

      questionId = question.id;
    }

    await tx.wrongAnswerHistory.upsert({
      where: {
        userId_questionId: {
          userId: params.userId,
          questionId
        }
      },
      update: {
        questionTypeId: type.id,
        wrongCount: { increment: 1 },
        strengthScore: 2.5,
        lastOutcome: SelfAssessment.WRONG,
        lastAttemptedAt: new Date(),
        reviewState: ReviewState.REVIEWING
      },
      create: {
        userId: params.userId,
        questionId,
        questionTypeId: type.id,
        wrongCount: 1,
        unsureCount: 0,
        correctCount: 0,
        strengthScore: 2.5,
        lastOutcome: SelfAssessment.WRONG,
        lastAttemptedAt: new Date(),
        reviewState: ReviewState.REVIEWING
      }
    });

    const imported = await tx.importedWrongQuestion.update({
      where: { id: params.id },
      data: {
        questionId,
        title: params.title?.trim() || null,
        confirmedText: params.confirmedText.trim(),
        suggestedTypeKey: params.suggestedTypeKey?.trim() || null,
        status: ImportedWrongQuestionStatus.CONFIRMED
      }
    });

    return imported;
  });
}

export async function getImportedWrongQuestions(userId: string) {
  return prisma.importedWrongQuestion.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" }
  });
}
