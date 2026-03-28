"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AppSelfAssessment } from "@/lib/app-constants";
import { cn } from "@/lib/utils";

export function QuestionView({
  question,
  questionNumber,
  totalQuestions,
  selectedChoiceId,
  selfAssessment,
  onSelectChoice,
  onSetAssessment
}: {
  question: {
    id: string;
    code: string;
    typeName: string;
    prompt: string;
    passage: string | null;
    choices: { id: string; label: string; content: string }[];
  };
  questionNumber: number;
  totalQuestions: number;
  selectedChoiceId?: string;
  selfAssessment?: AppSelfAssessment;
  onSelectChoice: (choiceId: string) => void;
  onSetAssessment: (assessment: AppSelfAssessment) => void;
}) {
  return (
    <Card className="overflow-hidden border-stone-300 shadow-sm">
      <CardHeader className="space-y-4 border-b border-stone-200 bg-stone-50 pb-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="bg-stone-900 text-white">{question.typeName}</Badge>
            <Badge variant="secondary" className="border border-stone-300 bg-white">
              {question.code}
            </Badge>
          </div>
          <div className="rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-semibold">
            {questionNumber} / {totalQuestions} 문항
          </div>
        </div>

        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-stone-400 bg-white font-[var(--font-display)] text-2xl font-bold">
            {questionNumber}
          </div>
          <CardTitle className="pt-1 text-[1.65rem] leading-tight">{question.prompt}</CardTitle>
        </div>
      </CardHeader>

      <CardContent className="space-y-6 bg-white p-6">
        {question.passage ? (
          <div className="rounded-2xl border border-stone-300 bg-stone-50 p-5 text-sm leading-7">
            {question.passage}
          </div>
        ) : null}

        <div className="space-y-3">
          {question.choices.map((choice) => {
            const active = selectedChoiceId === choice.id;

            return (
              <button
                key={choice.id}
                type="button"
                onClick={() => onSelectChoice(choice.id)}
                className={cn(
                  "flex w-full items-start gap-4 rounded-2xl border p-4 text-left transition",
                  active
                    ? "border-primary bg-accent shadow-focus"
                    : "border-stone-200 bg-white hover:bg-stone-50"
                )}
              >
                <div
                  className={cn(
                    "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-sm font-bold",
                    active
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-stone-300 bg-stone-50"
                  )}
                >
                  {choice.label}
                </div>
                <div className="pt-1 text-base leading-7">{choice.content}</div>
              </button>
            );
          })}
        </div>

        <div className="border-t border-dashed border-stone-300 pt-5">
          <div className="mb-3 text-sm font-semibold text-stone-700">자가 판정</div>
          <div className="grid gap-2 sm:grid-cols-3">
            {[
              {
                label: "확실했음",
                value: "CORRECT" as const,
                active: selfAssessment === "CORRECT",
                classes: "border-emerald-200 text-emerald-700"
              },
              {
                label: "애매했음",
                value: "UNSURE" as const,
                active: selfAssessment === "UNSURE",
                classes: "border-amber-200 text-amber-700"
              },
              {
                label: "오답으로 표시",
                value: "WRONG" as const,
                active: selfAssessment === "WRONG",
                classes: "border-red-200 text-red-700"
              }
            ].map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => onSetAssessment(item.value)}
                className={cn(
                  "rounded-xl border bg-white px-3 py-3 text-sm font-semibold transition hover:bg-stone-50",
                  item.active ? item.classes + " ring-2 ring-current/20" : ""
                )}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
