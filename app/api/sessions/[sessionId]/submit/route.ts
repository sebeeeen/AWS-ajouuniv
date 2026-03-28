import { NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentUser } from "@/lib/auth";
import { SELF_ASSESSMENTS } from "@/lib/app-constants";
import { submitSession } from "@/lib/services/sessions";

const schema = z.object({
  answers: z.array(
    z.object({
      questionId: z.string(),
      selectedChoiceId: z.string().optional(),
      selfAssessment: z.enum(SELF_ASSESSMENTS).optional(),
      elapsedSeconds: z.number().int().min(0),
      memo: z.string().optional()
    })
  )
});

export async function POST(
  request: Request,
  context: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await context.params;
    const body = await request.json();
    const payload = schema.parse(body);
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
    }

    const result = await submitSession(sessionId, user.id, payload);

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
