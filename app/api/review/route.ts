import { NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentUser } from "@/lib/auth";
import { buildQuestionReview } from "@/lib/ai/review";

const schema = z.object({
  questionId: z.string(),
  selectedChoiceId: z.string().optional(),
  sessionId: z.string().optional()
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const input = schema.parse(body);
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
    }

    const review = await buildQuestionReview({
      userId: user.id,
      questionId: input.questionId,
      selectedChoiceId: input.selectedChoiceId,
      sessionId: input.sessionId
    });

    return NextResponse.json(review);
  } catch (error) {
    const message = error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
