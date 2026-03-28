import Link from "next/link";

import { WrongQuestionUploadForm } from "@/components/wrong-questions/upload-form";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireUser } from "@/lib/auth";
import { getImportedWrongQuestions } from "@/lib/services/imported-wrong-questions";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

function statusLabel(status: string) {
  switch (status) {
    case "OCR_PENDING":
      return "OCR 처리 중";
    case "OCR_COMPLETED":
      return "확인 대기";
    case "CONFIRMED":
      return "저장 완료";
    default:
      return status;
  }
}

function visualLabel(visualType: string | null) {
  switch (visualType) {
    case "graph":
      return "그래프 포함";
    case "table":
      return "표 포함";
    case "chart":
      return "차트 포함";
    case "diagram":
      return "도형 포함";
    default:
      return "시각 자료 포함";
  }
}

export default async function WrongQuestionUploadPage() {
  const user = await requireUser();
  const imported = await getImportedWrongQuestions(user.id);

  return (
    <main className="min-h-screen px-4 py-6 md:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-[2rem] border bg-card p-6 shadow-sm md:p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="text-sm font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                오답 등록
              </div>
              <h1 className="mt-3 font-[var(--font-display)] text-4xl font-bold">
                오답 문제를 올리고 OCR 결과를 확인하세요
              </h1>
              <p className="mt-2 max-w-3xl text-muted-foreground">
                이미지 업로드 후 OCR로 텍스트를 추출합니다. 그래프나 표가 감지되면 원본 이미지는 유지하고 텍스트는 문제와 선지만 중심으로 정리합니다.
              </p>
            </div>
            <Link href="/dashboard">
              <Badge variant="secondary">대시보드로 돌아가기</Badge>
            </Link>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
          <Card>
            <CardHeader>
              <CardTitle>오답 업로드</CardTitle>
              <CardDescription>
                OCR 결과는 100% 정확하지 않을 수 있으니 반드시 한 번 확인해 주세요.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <WrongQuestionUploadForm />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>최근 등록 내역</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {imported.length ? (
                imported.map((item: (typeof imported)[number]) => (
                  <div key={item.id} className="rounded-xl border bg-white p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="font-medium">{item.title ?? "제목 없음"}</div>
                      <div className="flex items-center gap-2">
                        {item.hasVisual ? (
                          <Badge
                            variant="secondary"
                            className="border border-amber-200 bg-amber-50 text-amber-900"
                          >
                            {visualLabel(item.visualType)}
                          </Badge>
                        ) : null}
                        <Badge variant={item.status === "CONFIRMED" ? "success" : "secondary"}>
                          {statusLabel(item.status)}
                        </Badge>
                      </div>
                    </div>
                    <div className="mt-2 text-sm text-muted-foreground">
                      {formatDate(item.createdAt)}
                    </div>
                    <p className="mt-3 line-clamp-5 text-sm leading-6">
                      {item.confirmedText ?? item.extractedText ?? "아직 추출된 텍스트가 없습니다."}
                    </p>
                  </div>
                ))
              ) : (
                <div className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
                  아직 등록한 오답 문제가 없습니다.
                </div>
              )}
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  );
}
