"use client";

import { CheckCircle2, CircleDashed, HelpCircle, XCircle } from "lucide-react";

import { cn } from "@/lib/utils";

type OMRSheetProps = {
  total: number;
  currentIndex: number;
  answers: Record<string, { selectedChoiceId?: string; selfAssessment?: string }>;
  questionIds: string[];
  choiceLabelsByQuestion: Record<string, Record<string, string>>;
};

const labels = ["A", "B", "C", "D", "E"];

export function OMRSheet({
  total,
  currentIndex,
  answers,
  questionIds,
  choiceLabelsByQuestion
}: OMRSheetProps) {
  return (
    <div className="rounded-[1.5rem] border border-stone-300 bg-card p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <div className="font-[var(--font-display)] text-lg font-semibold">OMR 진행표</div>
        <div className="text-xs text-muted-foreground">이전 번호 복귀 불가</div>
      </div>
      <div className="space-y-2">
        {Array.from({ length: total }, (_, index) => {
          const questionId = questionIds[index];
          const answer = answers[questionId];
          const isCurrent = index === currentIndex;
          const statusIcon = !answer?.selectedChoiceId ? (
            <CircleDashed className="h-4 w-4 text-stone-400" />
          ) : answer.selfAssessment === "CORRECT" ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          ) : answer.selfAssessment === "WRONG" ? (
            <XCircle className="h-4 w-4 text-red-500" />
          ) : (
            <HelpCircle className="h-4 w-4 text-amber-500" />
          );

          return (
            <div
              key={questionId}
              className={cn(
                "grid w-full grid-cols-[44px_1fr_28px] items-center gap-2 rounded-xl border px-3 py-2 text-left",
                isCurrent ? "border-primary bg-accent/70 shadow-focus" : "border-stone-200 bg-white"
              )}
            >
              <div className="font-semibold">{String(index + 1).padStart(2, "0")}</div>
              <div className="flex gap-2">
                {labels.map((label) => {
                  const selectedLabel = answer?.selectedChoiceId
                    ? choiceLabelsByQuestion[questionId]?.[answer.selectedChoiceId]
                    : undefined;
                  const active = selectedLabel === label;

                  return (
                    <span
                      key={label}
                      className={cn(
                        "flex h-7 w-7 items-center justify-center rounded-full border text-xs font-bold",
                        active
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-stone-300 bg-white text-muted-foreground"
                      )}
                    >
                      {label}
                    </span>
                  );
                })}
              </div>
              <div>{statusIcon}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
