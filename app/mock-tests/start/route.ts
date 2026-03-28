import { NextRequest, NextResponse } from "next/server";

import { SESSION_MODES } from "@/lib/app-constants";
import { getCurrentUser } from "@/lib/auth";
import { generateMockTest } from "@/lib/services/mock-test-generator";

function toPublicUrl(request: NextRequest, pathname: string) {
  const protocol =
    request.headers.get("x-forwarded-proto") ?? request.nextUrl.protocol.replace(":", "");
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? request.nextUrl.host;

  return new URL(pathname, `${protocol}://${host}`);
}

export async function GET(request: NextRequest) {
  const mode = request.nextUrl.searchParams.get("mode");
  const weakTypeKey = request.nextUrl.searchParams.get("weakTypeKey") ?? undefined;
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.redirect(toPublicUrl(request, "/login"));
  }

  if (!mode || !SESSION_MODES.includes(mode as (typeof SESSION_MODES)[number])) {
    return NextResponse.redirect(toPublicUrl(request, "/dashboard"));
  }

  const session = await generateMockTest({
    userId: user.id,
    mode: mode as (typeof SESSION_MODES)[number],
    weakTypeKey
  });

  return NextResponse.redirect(toPublicUrl(request, `/solve/${session.id}`));
}
