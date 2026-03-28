"use client";

import { useState } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const keys = ["7", "8", "9", "/", "4", "5", "6", "*", "1", "2", "3", "-", "0", ".", "=", "+"];

export function CalculatorPanel() {
  const [expression, setExpression] = useState("");

  function applyKey(key: string) {
    if (key === "=") {
      try {
        const result = Function(`"use strict"; return (${expression || "0"})`)();
        setExpression(String(result));
      } catch {
        setExpression("계산 오류");
      }
      return;
    }

    setExpression((current) => (current === "계산 오류" ? key : current + key));
  }

  return (
    <Card className="border-stone-300">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">계산기</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Input
          value={expression}
          onChange={(event) => setExpression(event.target.value)}
          placeholder="빠른 계산"
        />
        <div className="grid grid-cols-4 gap-2">
          {keys.map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => applyKey(key)}
              className="rounded-xl border border-stone-300 bg-white py-2 text-sm font-semibold transition hover:bg-stone-50"
            >
              {key}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setExpression("")}
          className="w-full rounded-xl border border-dashed border-stone-300 py-2 text-sm text-muted-foreground transition hover:bg-stone-50"
        >
          지우기
        </button>
      </CardContent>
    </Card>
  );
}
