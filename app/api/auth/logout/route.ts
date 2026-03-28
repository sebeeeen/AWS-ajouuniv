import { NextResponse } from "next/server";

import { clearCurrentSession } from "@/lib/auth";

export async function POST() {
  await clearCurrentSession();
  const response = NextResponse.json({ ok: true });
  response.cookies.set("skct_session", "", {
    path: "/",
    expires: new Date(0)
  });
  return response;
}
