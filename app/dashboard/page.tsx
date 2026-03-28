import Link from "next/link";

import { AIReviewPanel } from "@/components/dashboard/ai-review-panel";
import { MockTestLauncher } from "@/components/dashboard/mock-test-launcher";
import { LogoutButton } from "@/components/auth/logout-button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireUser } from "@/lib/auth";
import { getDashboardData } from "@/lib/services/dashboard";
import { getGeneratorPreview } from "@/lib/services/mock-test-generator";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

function modeLabel(mode: string) {
  switch (mode) {
    case "FULL_MOCK":
      return "전체 실전 모드";
    case "FULL_WRONG":
      return "전체 오답 모의고사";
    case "MINI_WRONG":
      return "미니 오답 모의고사";
    case "WEAK_TYPE_WRONG":
      return "약점 유형 집중";
    default:
      return mode;
  }
}

function statusLabel(status: string) {
  switch (status) {
    case "READY":
      return "대기";
    case "IN_PROGRESS":
      return "진행 중";
    case "COMPLETED":
      return "완료";
    default:
      return status;
  }
}

export default async function DashboardPage() {
  const user = await requireUser();
  const [dashboard, generatorPreview] = await Promise.all([
    getDashboardData(user.id),
    getGeneratorPreview(user.id)
  ]);

  return (
    <main className="min-h-screen px-4 py-6 md:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-[2rem] border bg-card p-6 shadow-sm md:p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="text-sm font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                회원 대시보드
              </div>
              <h1 className="mt-3 font-[var(--font-display)] text-4xl font-bold">
                {(user.name ?? user.phone)}님의 SKCT 훈련 현황
              </h1>
              <p className="mt-2 max-w-3xl text-muted-foreground">
                실전 세션을 시작하고, 유형 순서 기반 오답 모의고사를 생성하고, 세션별 전략 피드백까지 바로 확인할 수 있습니다.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/">
                <Badge variant="secondary">소개로 돌아가기</Badge>
              </Link>
              <LogoutButton />
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-5">
          {[
            ["정답률", `${dashboard.stats.accuracy}%`],
            ["평균 시간", `${dashboard.stats.averageTime}초`],
            ["누적 풀이 수", String(dashboard.stats.totalAttempts)],
            ["완료한 세션", String(dashboard.stats.completedSessions)],
            ["복습 대기", String(dashboard.stats.reviewQueue)]
          ].map(([label, value]) => (
            <Card key={label}>
              <CardContent className="p-5">
                <div className="text-sm text-muted-foreground">{label}</div>
                <div className="mt-2 font-[var(--font-display)] text-3xl font-semibold">{value}</div>
              </CardContent>
            </Card>
          ))}
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <Card>
            <CardHeader>
              <CardTitle>훈련 시작</CardTitle>
              <CardDescription>
                모든 생성기는 SKCT 유형 순서를 유지하면서 약점 문항과 오답 문항을 우선 배치합니다.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4 flex justify-end">
                <Link href="/wrong-questions/upload">
                  <Badge>오답 문제 직접 등록</Badge>
                </Link>
              </div>
              <MockTestLauncher />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>약점 유형 스냅샷</CardTitle>
              <CardDescription>
                점수가 높을수록 틀리거나 애매했던 기록이 많이 쌓인 유형입니다.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {generatorPreview.map((type) => (
                <div
                  key={type.id}
                  className="flex items-center justify-between rounded-xl border bg-white px-4 py-3"
                >
                  <div className="font-medium">{type.name}</div>
                  <Badge>{type.weaknessScore.toFixed(1)}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
          <Card>
            <CardHeader>
              <CardTitle>유형별 성과</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {dashboard.typePerformance.map((type) => (
                <div key={type.name} className="rounded-xl border bg-white p-4">
                  <div className="flex items-center justify-between">
                    <div className="font-medium">{type.name}</div>
                    <Badge variant={type.accuracy >= 70 ? "success" : "destructive"}>
                      정답률 {type.accuracy}%
                    </Badge>
                  </div>
                  <div className="mt-2 text-sm text-muted-foreground">
                    평균 시간 {type.avgTime || 0}초 · 풀이 수 {type.volume}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>다시 볼 문제</CardTitle>
              <CardDescription>
                오답 기록과 약점 점수를 바탕으로 우선순위를 정한 복습 목록입니다.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {dashboard.weakQuestions.map((question) => (
                <div key={question.id} className="rounded-2xl border bg-white p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-medium">{question.code}</div>
                      <div className="mt-1 text-sm text-muted-foreground">{question.typeName}</div>
                    </div>
                    <Badge variant="destructive">약점 점수 {question.strengthScore}</Badge>
                  </div>
                  <p className="mt-3 text-sm leading-6">{question.prompt}</p>
                  <div className="mt-3">
                    <AIReviewPanel questionId={question.id} />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>

        <section>
          <Card>
            <CardHeader>
              <CardTitle>최근 세션</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {dashboard.recentSessions.length ? (
                dashboard.recentSessions.map((session) => (
                  <div
                    key={session.id}
                    className="flex flex-col gap-3 rounded-xl border bg-white p-4 md:flex-row md:items-center md:justify-between"
                  >
                    <div>
                      <div className="font-medium">{session.title}</div>
                      <div className="text-sm text-muted-foreground">
                        {modeLabel(session.mode)} · {session.questionCount}문항 · {formatDate(session.createdAt)}
                      </div>
                    </div>
                    <Badge variant={session.status === "COMPLETED" ? "success" : "secondary"}>
                      {statusLabel(session.status)}
                    </Badge>
                  </div>
                ))
              ) : (
                <div className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
                  아직 세션이 없습니다. 위에서 바로 시작해보세요.
                </div>
              )}
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  );
}
