import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";

import { createUserSession, registerUser, setSessionCookie } from "@/lib/auth";

const schema = z.object({
  phone: z.string().min(8).max(20),
  password: z.string().min(4).max(50)
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const input = schema.parse(body);

    const user = await registerUser(input);
    const session = await createUserSession(user.id);
    const response = NextResponse.json({ ok: true, userId: user.id }, { status: 201 });

    setSessionCookie(response, {
      token: session.rawToken,
      expiresAt: session.expiresAt
    });

    return response;
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { error: "이미 가입된 전화번호입니다. 로그인으로 진행해 주세요." },
        { status: 400 }
      );
    }

    const message = error instanceof Error ? error.message : "회원가입 처리 중 오류가 발생했습니다.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
