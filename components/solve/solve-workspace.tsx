"use client";

import { ChevronRight, Keyboard, Send } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { CalculatorPanel } from "@/components/solve/calculator-panel";
import { DrawingPad } from "@/components/solve/drawing-pad";
import { MemoPad } from "@/components/solve/memo-pad";
import { OMRSheet } from "@/components/solve/omr-sheet";
import { QuestionView } from "@/components/solve/question-view";
import { TimerPanel } from "@/components/solve/timer-panel";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useSolveStore } from "@/lib/stores/solve-store";
import type { SolveSessionData } from "@/lib/types";

export function SolveWorkspace({ session }: { session: SolveSessionData }) {
  const router = useRouter();
  const {
    currentIndex,
    autoAdvance,
    answers,
    hydrate,
    setCurrentIndex,
    setAutoAdvance,
    selectChoice,
    setAssessment,
    setElapsedSeconds,
    setMemo,
    reset
  } = useSolveStore();
  const [secondsRemaining, setSecondsRemaining] = useState(
    session.questions[currentIndex]?.timeLimitSeconds ?? 0
  );
  const [submitting, setSubmitting] = useState(false);
  const questionIds = useMemo(() => session.questions.map((question) => question.id), [session.questions]);
  const choiceLabelsByQuestion = useMemo(
    () =>
      session.questions.reduce<Record<string, Record<string, string>>>((accumulator, item) => {
        accumulator[item.id] = item.choices.reduce<Record<string, string>>((choiceMap, choice) => {
          choiceMap[choice.id] = choice.label;
          return choiceMap;
        }, {});
        return accumulator;
      }, {}),
    [session.questions]
  );
  const question = session.questions[currentIndex];
  const answer = answers[question?.id];
  const progressPercent = session.questions.length
    ? ((currentIndex + 1) / session.questions.length) * 100
    : 0;

  useEffect(() => {
    hydrate({
      sessionId: session.id,
      mode: session.mode,
      questionIds
    });
  }, [hydrate, questionIds, session.id, session.mode]);

  useEffect(() => {
    if (!question) {
      return;
    }

    setSecondsRemaining(question.timeLimitSeconds);
  }, [question]);

  async function handleSubmit() {
    if (submitting) {
      return;
    }

    setSubmitting(true);

    const response = await fetch(`/api/sessions/${session.id}/submit`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        answers: session.questions.map((item) => ({
          questionId: item.id,
          selectedChoiceId: answers[item.id]?.selectedChoiceId,
          selfAssessment: answers[item.id]?.selfAssessment,
          elapsedSeconds: answers[item.id]?.elapsedSeconds ?? 0,
          memo: answers[item.id]?.memo ?? ""
        }))
      })
    });

    const data = await response.json();
    setSubmitting(false);

    if (!response.ok) {
      alert(data.error ?? "세션 제출에 실패했습니다.");
      return;
    }

    reset();
    router.push(`/sessions/${session.id}/results`);
  }

  function moveNext() {
    if (currentIndex >= session.questions.length - 1) {
      void handleSubmit();
      return;
    }

    setCurrentIndex(currentIndex + 1);
  }

  useEffect(() => {
    if (!question) {
      return;
    }

    const interval = window.setInterval(() => {
      setSecondsRemaining((current) => {
        if (current <= 1) {
          window.clearInterval(interval);
          setElapsedSeconds(question.id, question.timeLimitSeconds);

          if (
            (session.mode === "MINI_WRONG" ||
              session.mode === "FULL_WRONG" ||
              session.mode === "WEAK_TYPE_WRONG") &&
            autoAdvance
          ) {
            if (currentIndex === session.questions.length - 1) {
              void handleSubmit();
            } else {
              setCurrentIndex(currentIndex + 1);
            }
          }

          return 0;
        }

        const elapsed = question.timeLimitSeconds - (current - 1);
        setElapsedSeconds(question.id, elapsed);
        return current - 1;
      });
    }, 1000);

    return () => window.clearInterval(interval);
  }, [question, autoAdvance, currentIndex, session.mode]);

  useEffect(() => {
    async function markStarted() {
      await fetch(`/api/sessions/${session.id}`, {
        method: "PATCH"
      });
    }

    void markStarted();
  }, [session.id]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (!question) {
        return;
      }

      const target = event.target as HTMLElement | null;
      const isEditable =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        Boolean(target?.closest("input, textarea, [contenteditable='true']"));

      if (isEditable) {
        return;
      }

      if (["1", "2", "3", "4", "5"].includes(event.key)) {
        const choice = question.choices[Number(event.key) - 1];
        if (choice) {
          selectChoice(question.id, choice.id);
        }
      }

      if (event.key === "ArrowRight") {
        moveNext();
      }

      if (event.key.toLowerCase() === "c") {
        setAssessment(question.id, "CORRECT");
      }

      if (event.key.toLowerCase() === "u") {
        setAssessment(question.id, "UNSURE");
      }

      if (event.key.toLowerCase() === "w") {
        setAssessment(question.id, "WRONG");
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [question, currentIndex, session.questions.length, selectChoice, setAssessment, setCurrentIndex]);

  if (!question) {
    return null;
  }

  const unansweredCount = session.questions.filter(
    (item) => !answers[item.id]?.selectedChoiceId
  ).length;
  const isWrongMode =
    session.mode === "MINI_WRONG" ||
    session.mode === "FULL_WRONG" ||
    session.mode === "WEAK_TYPE_WRONG";

  return (
    <div className="min-h-screen bg-[#f6f1e8] px-3 py-4 md:px-6 md:py-6">
      <div className="mx-auto flex max-w-[1560px] flex-col gap-4">
        <Card className="overflow-hidden border-stone-300 bg-white shadow-sm">
          <CardContent className="grid gap-4 p-0 md:grid-cols-[1.35fr_0.85fr]">
            <div>
              <div className="border-b border-stone-200 px-5 py-4">
                <div className="font-[var(--font-display)] text-2xl font-bold tracking-tight md:text-3xl">
                  {session.title}
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  {currentIndex + 1} / {session.questions.length}번 문항 · 미응답 {unansweredCount}개
                </p>
              </div>
              <div className="h-2 w-full bg-stone-100">
                <div
                  className="h-full bg-primary transition-all"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            <div className="space-y-3 px-5 py-4">
              <div className="flex flex-wrap items-center justify-end gap-3 text-sm text-muted-foreground">
                <div className="flex items-center gap-2 rounded-full border border-stone-300 bg-stone-50 px-3 py-2">
                  <Keyboard className="h-4 w-4" />
                  `1-5` 선택, `C/U/W` 표시, `→` 다음 문항
                </div>
                {isWrongMode ? (
                  <label className="flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-2 text-foreground">
                    <input
                      type="checkbox"
                      checked={autoAdvance}
                      onChange={(event) => setAutoAdvance(event.target.checked)}
                    />
                    시간 종료 시 자동 이동
                  </label>
                ) : null}
              </div>
              <div className="rounded-2xl border border-stone-300 bg-stone-50 px-4 py-3 text-sm leading-6 text-stone-700">
                실전 모드에서는 이전 문항으로 돌아갈 수 없습니다. 답안을 선택한 뒤 다음 문항으로만 진행됩니다.
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_320px_360px]">
          <div className="space-y-4">
            <QuestionView
              question={question}
              questionNumber={currentIndex + 1}
              totalQuestions={session.questions.length}
              selectedChoiceId={answer?.selectedChoiceId}
              selfAssessment={answer?.selfAssessment}
              onSelectChoice={(choiceId) => selectChoice(question.id, choiceId)}
              onSetAssessment={(assessment) => setAssessment(question.id, assessment)}
            />

            <div className="flex flex-wrap items-center justify-end gap-3 rounded-[1.5rem] border border-stone-300 bg-white p-4 shadow-sm">
              <Button variant="secondary" onClick={moveNext}>
                {currentIndex === session.questions.length - 1 ? "끝내고 제출" : "다음 문항"}
                <ChevronRight className="h-4 w-4" />
              </Button>

              <Button onClick={() => void handleSubmit()} disabled={submitting}>
                <Send className="h-4 w-4" />
                {submitting ? "제출 중..." : "세션 종료"}
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            <TimerPanel
              secondsRemaining={secondsRemaining}
              totalSeconds={question.timeLimitSeconds}
              modeLabel={isWrongMode ? "짧은 타이머 복습" : "실전 모드"}
            />
            <OMRSheet
              total={session.questions.length}
              currentIndex={currentIndex}
              answers={answers}
              questionIds={questionIds}
              choiceLabelsByQuestion={choiceLabelsByQuestion}
            />
          </div>

          <div className="space-y-4">
            <MemoPad value={answer?.memo ?? ""} onChange={(value) => setMemo(question.id, value)} />
            <DrawingPad />
            <CalculatorPanel />
          </div>
        </div>
      </div>
    </div>
  );
}
