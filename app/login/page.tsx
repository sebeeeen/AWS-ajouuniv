import { redirect } from "next/navigation";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth";

import { LoginForm } from "@/components/auth/login-form";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const user = await getCurrentUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <main className="min-h-screen px-4 py-8 md:px-8">
      <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-[1fr_420px]">
        <section className="rounded-[2rem] border bg-card p-8 shadow-sm">
          <div className="inline-flex rounded-full bg-accent px-4 py-2 text-sm font-semibold">
            SKCT 준비 서비스
          </div>
          <h1 className="mt-5 font-[var(--font-display)] text-5xl font-bold leading-tight">
            전화번호와 비밀번호로 바로 시작하는 간단 로그인
          </h1>
          <p className="mt-4 max-w-2xl text-muted-foreground">
            복잡한 인증 없이 회원을 구분할 수 있도록 최소한의 로그인만 붙였습니다.
            회원가입 후 바로 대시보드에서 문제 풀이와 오답 훈련을 시작할 수 있습니다.
          </p>
        </section>

        <Card>
          <CardHeader>
            <CardTitle>로그인 / 회원가입</CardTitle>
            <CardDescription>
              전화번호와 비밀번호만 입력하면 됩니다.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LoginForm />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
