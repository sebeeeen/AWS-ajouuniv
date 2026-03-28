import { NextResponse } from "next/server";
import { z } from "zod";

import { createUserSession, loginUser, setSessionCookie } from "@/lib/auth";

const schema = z.object({
  phone: z.string().min(8).max(20),
  password: z.string().min(4).max(50)
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const input = schema.parse(body);
    const user = await loginUser(input);

    if (!user) {
      return NextResponse.json(
        { error: "전화번호 또는 비밀번호가 올바르지 않습니다." },
        { status: 401 }
      );
    }

    const session = await createUserSession(user.id);
    const response = NextResponse.json({ ok: true, userId: user.id });

    setSessionCookie(response, {
      token: session.rawToken,
      expiresAt: session.expiresAt
    });

    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "로그인 처리 중 오류가 발생했습니다.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
