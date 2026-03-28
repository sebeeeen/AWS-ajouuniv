import { NextResponse } from "next/server";
import { z } from "zod";

import { SESSION_MODES } from "@/lib/app-constants";
import { getCurrentUser } from "@/lib/auth";
import { generateMockTest } from "@/lib/services/mock-test-generator";

const schema = z.object({
  mode: z.enum(SESSION_MODES),
  weakTypeKey: z.string().optional()
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const input = schema.parse(body);
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
    }

    const session = await generateMockTest({
      userId: user.id,
      mode: input.mode,
      weakTypeKey: input.weakTypeKey
    });

    return NextResponse.json({
      sessionId: session.id
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
