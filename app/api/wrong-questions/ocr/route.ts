import { NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentUser } from "@/lib/auth";
import { runWrongQuestionOcr } from "@/lib/services/imported-wrong-questions";

const schema = z.object({
  imageDataUrl: z.string().min(20)
});

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
    }

    const body = await request.json();
    const input = schema.parse(body);
    const imported = await runWrongQuestionOcr({
      userId: user.id,
      imageDataUrl: input.imageDataUrl
    });

    return NextResponse.json(imported);
  } catch (error) {
    const message = error instanceof Error ? error.message : "OCR 처리 중 오류가 발생했습니다.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
