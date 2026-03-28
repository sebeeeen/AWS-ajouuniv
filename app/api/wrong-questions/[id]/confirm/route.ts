import { NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentUser } from "@/lib/auth";
import { confirmImportedWrongQuestion } from "@/lib/services/imported-wrong-questions";

const schema = z.object({
  title: z.string().optional(),
  confirmedText: z.string().min(1),
  suggestedTypeKey: z.string().optional(),
  prompt: z.string().min(1),
  passage: z.string().optional(),
  choices: z.array(
    z.object({
      label: z.string().min(1),
      content: z.string().min(1)
    })
  ).min(2),
  correctChoiceLabel: z.string().min(1)
});

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
    }

    const { id } = await context.params;
    const body = await request.json();
    const input = schema.parse(body);
    await confirmImportedWrongQuestion({
      userId: user.id,
      id,
      title: input.title,
      confirmedText: input.confirmedText,
      suggestedTypeKey: input.suggestedTypeKey,
      prompt: input.prompt,
      passage: input.passage,
      choices: input.choices,
      correctChoiceLabel: input.correctChoiceLabel
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "오답 문제 확인 저장 중 오류가 발생했습니다.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
