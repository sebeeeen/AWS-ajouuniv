import { AlarmClockCheck, AlarmClockOff } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { formatSeconds } from "@/lib/utils";

export function TimerPanel({
  secondsRemaining,
  totalSeconds,
  modeLabel
}: {
  secondsRemaining: number;
  totalSeconds: number;
  modeLabel: string;
}) {
  const progress = totalSeconds ? (secondsRemaining / totalSeconds) * 100 : 0;
  const critical = secondsRemaining <= 10;

  return (
    <Card className={critical ? "timer-critical border-red-300 bg-red-50/60" : "border-stone-300"}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">남은 시간</CardTitle>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {critical ? (
              <AlarmClockOff className="h-4 w-4 text-red-500" />
            ) : (
              <AlarmClockCheck className="h-4 w-4" />
            )}
            {modeLabel}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="rounded-2xl border border-stone-300 bg-white px-4 py-4 text-center font-[var(--font-display)] text-5xl font-bold tracking-[0.08em]">
          {formatSeconds(secondsRemaining)}
        </div>
        <Progress value={progress} className={critical ? "bg-red-100" : ""} />
        <p className="text-xs leading-5 text-muted-foreground">
          시간이 끝나면 현재 문항은 그대로 제출되며, 오답 복습 모드에서는 다음 문항으로 자동 이동할 수 있습니다.
        </p>
      </CardContent>
    </Card>
  );
}
