import Link from "next/link";
import { ArrowRight, Camera, Clock3, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const features = [
  {
    title: "실전형 풀이 화면",
    description:
      "문항 영역, 제한 시간, 메모, 계산기, OMR 마킹을 한 화면에서 집중해서 풀 수 있습니다.",
    icon: Clock3
  },
  {
    title: "실전 흐름 유지",
    description:
      "문제는 한 문항씩 보이고 이전으로 돌아가지 않는 방식으로 긴장감 있는 흐름을 유지합니다.",
    icon: Clock3
  },
  {
    title: "AI 속도 코칭",
    description:
      "정답 설명뿐 아니라 빠른 풀이 루트, 자주 걸리는 함정, 다음에 기억할 핵심까지 제공합니다.",
    icon: Sparkles
  },
  {
    title: "오답 업로드 + OCR 확인",
    description:
      "캡처한 오답 문제를 올리면 텍스트를 읽고, 사용자가 한 번 더 확인한 뒤 저장할 수 있습니다.",
    icon: Camera
  }
];

export default function HomePage() {
  return (
    <main className="min-h-screen px-4 py-6 md:px-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <section className="overflow-hidden rounded-[2rem] border bg-card px-6 py-10 shadow-sm md:px-10">
          <div className="grid gap-10 md:grid-cols-[1.2fr_0.8fr] md:items-end">
            <div className="space-y-5">
              <div className="inline-flex rounded-full bg-accent px-4 py-2 text-sm font-semibold">
                SKCT 실전 시뮬레이터 + 오답 훈련 + AI 전략 코치
              </div>
              <h1 className="max-w-3xl font-[var(--font-display)] text-5xl font-bold leading-tight md:text-6xl">
                실제 시험처럼 풀고, 오답은 더 효율적으로 다시 푸세요.
              </h1>
              <p className="max-w-2xl text-lg text-muted-foreground">
                이 MVP는 실전형 풀이 흐름을 재현하고, 유형 순서 기반 오답 모의고사를 다시 만들며, 다음에는 더 빨리 풀 수 있도록 전략 중심 피드백을 제공합니다.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link href="/login">
                  <Button size="lg">
                    로그인하고 시작하기
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>

            <Card className="bg-stone-950 text-stone-50">
              <CardContent className="space-y-4 p-6">
                <div className="font-[var(--font-display)] text-2xl font-semibold">
                  오답 복습의 끊김을 줄였습니다
                </div>
                <div className="space-y-3 text-sm text-stone-300">
                  <p>짧은 타이머 복습 모드는 문제마다 타이머를 다시 누를 필요 없이 자동으로 다음 문항으로 넘어갑니다.</p>
                  <p>문항별로 확실함, 애매함, 오답을 표시해 세션 후 다시 재배치할 수 있습니다.</p>
                  <p>결과 화면에서는 약한 유형, 평균 풀이 속도, 풀이 습관까지 한 번에 확인할 수 있습니다.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <Card key={feature.title}>
                <CardContent className="space-y-4 p-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent">
                    <Icon className="h-6 w-6" />
                  </div>
                  <div className="font-[var(--font-display)] text-xl font-semibold">
                    {feature.title}
                  </div>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </section>
      </div>
    </main>
  );
}
