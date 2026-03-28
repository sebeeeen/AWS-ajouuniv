import { randomBytes, scryptSync, timingSafeEqual, createHash } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";

const SESSION_COOKIE = "skct_session";
const SESSION_TTL_DAYS = 30;

function normalizePhone(phone: string) {
  return phone.replace(/\D/g, "");
}

function shouldUseSecureCookie() {
  return process.env.COOKIE_SECURE === "true";
}

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const derived = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${derived}`;
}

export function verifyPassword(password: string, storedHash: string) {
  const [salt, hash] = storedHash.split(":");

  if (!salt || !hash) {
    return false;
  }

  const derived = scryptSync(password, salt, 64);
  const original = Buffer.from(hash, "hex");

  if (derived.length !== original.length) {
    return false;
  }

  return timingSafeEqual(derived, original);
}

export async function registerUser({
  phone,
  password
}: {
  phone: string;
  password: string;
}) {
  return prisma.user.create({
    data: {
      phone: normalizePhone(phone),
      passwordHash: hashPassword(password)
    }
  });
}

export async function loginUser({
  phone,
  password
}: {
  phone: string;
  password: string;
}) {
  const user = await prisma.user.findUnique({
    where: { phone: normalizePhone(phone) }
  });

  if (!user || !verifyPassword(password, user.passwordHash)) {
    return null;
  }

  return user;
}

export async function createUserSession(userId: string) {
  const rawToken = randomBytes(32).toString("hex");
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + SESSION_TTL_DAYS * 24 * 60 * 60 * 1000);

  await prisma.authSession.create({
    data: {
      userId,
      tokenHash,
      expiresAt
    }
  });

  return {
    rawToken,
    expiresAt
  };
}

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (!token) {
    return null;
  }

  const session = await prisma.authSession.findUnique({
    where: {
      tokenHash: hashToken(token)
    },
    include: {
      user: true
    }
  });

  if (!session) {
    return null;
  }

  if (session.expiresAt.getTime() < Date.now()) {
    await prisma.authSession.delete({
      where: {
        id: session.id
      }
    });
    return null;
  }

  return session.user;
}

export async function requireUser() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}

export function setSessionCookie(response: import("next/server").NextResponse, params: {
  token: string;
  expiresAt: Date;
}) {
  response.cookies.set(SESSION_COOKIE, params.token, {
    httpOnly: true,
    sameSite: "lax",
    secure: shouldUseSecureCookie(),
    expires: params.expiresAt,
    path: "/"
  });
}

export async function clearCurrentSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (!token) {
    return;
  }

  await prisma.authSession.deleteMany({
    where: {
      tokenHash: hashToken(token)
    }
  });
}
