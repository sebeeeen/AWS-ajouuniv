import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AIReviewPanel } from "@/components/dashboard/ai-review-panel";
import { requireUser } from "@/lib/auth";
import { getSessionResults } from "@/lib/services/sessions";
import { notFound } from "next/navigation";

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

export default async function SessionResultsPage({
  params
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;
  const user = await requireUser();
  const results = await getSessionResults(sessionId, user.id);

  if (!results) {
    notFound();
  }

  return (
    <main className="min-h-screen px-4 py-6 md:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-[2rem] border bg-card p-6 shadow-sm md:p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="text-sm font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                세션 결과
              </div>
              <h1 className="mt-3 font-[var(--font-display)] text-4xl font-bold">
                {results.title}
              </h1>
              <p className="mt-2 max-w-3xl text-muted-foreground">
                AI 코칭은 정답 설명보다도 빠른 풀이 전략, 함정 회피, 다음 유사 문항에서 기억할 포인트에 초점을 맞춥니다.
              </p>
            </div>
            <Badge>{modeLabel(results.mode)}</Badge>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {[
            ["정답률", `${results.accuracy}%`],
            ["평균 풀이 시간", `${results.averageTime}초`],
            ["리뷰 문항 수", String(results.reviewRows.length)]
          ].map(([label, value]) => (
            <Card key={label}>
              <CardContent className="p-5">
                <div className="text-sm text-muted-foreground">{label}</div>
                <div className="mt-2 font-[var(--font-display)] text-3xl font-semibold">{value}</div>
              </CardContent>
            </Card>
          ))}
        </section>

        <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <Card>
            <CardHeader>
              <CardTitle>약한 영역</CardTitle>
              <CardDescription>
                이번 세션에서 오답이 많이 나온 유형입니다.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {results.typePerformance.length ? (
                results.typePerformance.map((section) => (
                  <div
                    key={section.typeName}
                    className="flex items-center justify-between rounded-xl border bg-white px-4 py-3"
                  >
                    <div className="font-medium">{section.typeName}</div>
                    <Badge variant="destructive">오답 {section.misses}개</Badge>
                  </div>
                ))
              ) : (
                <div className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
                  이번 세션에서는 약한 영역이 두드러지지 않았습니다.
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>AI 풀이 습관 요약</CardTitle>
              <CardDescription>
                완료한 세션의 속도와 정답 패턴을 바탕으로 생성한 요약입니다.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-2xl border bg-accent/50 p-5 text-sm leading-7">
                {results.aiHabitSummary}
              </div>
            </CardContent>
          </Card>
        </section>

        <section>
          <Card>
            <CardHeader>
              <CardTitle>문항별 리뷰</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {results.reviewRows.map((row) => (
                <div key={row.questionId} className="rounded-[1.25rem] border bg-white p-5">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <div className="font-medium">
                        {row.code} · {row.typeName}
                      </div>
                      <p className="mt-2 text-sm leading-7">{row.prompt}</p>
                    </div>
                    <Badge variant={row.isCorrect ? "success" : "destructive"}>
                      {row.isCorrect ? "정답" : "재복습"}
                    </Badge>
                  </div>

                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    <div className="rounded-xl border bg-muted/40 p-4 text-sm">
                      <div>
                        <strong>내 답:</strong> {row.selectedAnswer}
                      </div>
                      <div className="mt-2">
                        <strong>정답:</strong> {row.correctAnswer}
                      </div>
                      <div className="mt-2">
                        <strong>풀이 시간:</strong> {row.elapsedSeconds}초
                      </div>
                      {row.memo ? (
                        <div className="mt-2">
                          <strong>메모:</strong> {row.memo}
                        </div>
                      ) : null}
                    </div>

                    <div className="rounded-xl border bg-accent/40 p-4 text-sm">
                      <div>
                        <strong>설명:</strong> {row.explanation}
                      </div>
                      <div className="mt-2">
                        <strong>빠른 풀이 전략:</strong> {row.fastStrategy}
                      </div>
                      <div className="mt-2">
                        <strong>함정:</strong> {row.commonTrap}
                      </div>
                      <div className="mt-2">
                        <strong>한 줄 포인트:</strong> {row.takeaway}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4">
                    <AIReviewPanel questionId={row.questionId} sessionId={results.id} />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  );
}
