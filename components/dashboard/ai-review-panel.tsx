"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function AIReviewPanel({
  questionId,
  sessionId
}: {
  questionId: string;
  sessionId?: string;
}) {
  const [review, setReview] = useState<null | {
    conciseExplanation: string;
    fastStrategy: string;
    commonTrap: string;
    takeaway: string;
    correctAnswer: string;
    provider: string;
    model: string;
  }>(null);
  const [loading, setLoading] = useState(false);

  async function loadReview() {
    setLoading(true);
    const response = await fetch("/api/review", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ questionId, sessionId })
    });
    const data = await response.json();
    setLoading(false);
    if (response.ok) {
      setReview(data);
    }
  }

  if (!review) {
    return (
      <Button variant="secondary" size="sm" onClick={() => void loadReview()} disabled={loading}>
        {loading ? "생성 중..." : "AI 코칭 보기"}
      </Button>
    );
  }

  return (
    <Card className="border-dashed bg-accent/50">
      <CardContent className="space-y-3 p-4 text-sm">
        <div>
          <strong>정답:</strong> {review.correctAnswer}
        </div>
        <div>
          <strong>핵심 설명:</strong> {review.conciseExplanation}
        </div>
        <div>
          <strong>빠른 풀이 전략:</strong> {review.fastStrategy}
        </div>
        <div>
          <strong>자주 걸리는 함정:</strong> {review.commonTrap}
        </div>
        <div>
          <strong>한 줄 포인트:</strong> {review.takeaway}
        </div>
        <div className="text-xs text-muted-foreground">
          생성 정보: {review.provider} / {review.model}
        </div>
      </CardContent>
    </Card>
  );
}
