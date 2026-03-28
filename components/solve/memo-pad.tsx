"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

export function MemoPad({
  value,
  onChange
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <Card className="panel-grid border-stone-300">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">메모장</CardTitle>
      </CardHeader>
      <CardContent>
        <Textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="계산 흔적, 조건 정리, 선지 제거 포인트를 적어두세요..."
          className="min-h-52 bg-white/90"
        />
      </CardContent>
    </Card>
  );
}
