import Link from "next/link";

import { Button } from "@/components/ui/button";

const actions = [
  {
    label: "전체 실전 모드 시작",
    href: "/mock-tests/start?mode=FULL_MOCK",
    detail: "유형 순서를 유지한 실전형 전체 세션입니다."
  },
  {
    label: "전체 오답 모의고사",
    href: "/mock-tests/start?mode=FULL_WRONG",
    detail: "틀렸거나 약한 문항을 중심으로 복습 세트를 다시 구성합니다."
  },
  {
    label: "약점 유형 집중 모드",
    href: "/mock-tests/start?mode=WEAK_TYPE_WRONG",
    detail: "현재 가장 취약한 유형에 집중해서 다시 훈련합니다."
  },
  {
    label: "오답 등록하기",
    href: "/wrong-questions/upload",
    detail: "캡처한 문제를 올리고 OCR 결과를 확인한 뒤 개인 오답 DB에 저장합니다.",
    variant: "secondary" as const
  }
];

export function MockTestLauncher() {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {actions.map((item) => (
        <div
          key={item.label}
          className="rounded-2xl border bg-card p-4 shadow-sm transition hover:-translate-y-0.5"
        >
          <div className="mb-2 font-[var(--font-display)] text-lg font-semibold">
            {item.label}
          </div>
          <p className="mb-4 text-sm text-muted-foreground">{item.detail}</p>
          <Link href={item.href} className="block">
            <Button className="w-full" variant={item.variant ?? "default"}>
              {item.label}
            </Button>
          </Link>
        </div>
      ))}
    </div>
  );
}
