import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { ensureSessionStarted, getSolveSession } from "@/lib/services/sessions";

export async function GET(
  _request: Request,
  context: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await context.params;
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const session = await getSolveSession(sessionId, user.id);

  if (!session) {
    return NextResponse.json({ error: "세션을 찾을 수 없습니다." }, { status: 404 });
  }

  return NextResponse.json(session);
}

export async function PATCH(
  _request: Request,
  context: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await context.params;
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  await ensureSessionStarted(sessionId, user.id);
  return NextResponse.json({ ok: true });
}
