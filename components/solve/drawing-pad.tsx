"use client";

import { useEffect, useRef, useState } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function DrawingPad() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [drawing, setDrawing] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const context = canvas.getContext("2d");
    if (!context) {
      return;
    }

    context.lineWidth = 2;
    context.lineCap = "round";
    context.strokeStyle = "#7c3f16";
  }, []);

  function getPoint(event: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas) {
      return null;
    }

    const rect = canvas.getBoundingClientRect();

    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    };
  }

  function handlePointerDown(event: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    const point = getPoint(event);

    if (!canvas || !context || !point) {
      return;
    }

    setDrawing(true);
    context.beginPath();
    context.moveTo(point.x, point.y);
  }

  function handlePointerMove(event: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawing) {
      return;
    }

    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    const point = getPoint(event);

    if (!canvas || !context || !point) {
      return;
    }

    context.lineTo(point.x, point.y);
    context.stroke();
  }

  function stopDrawing() {
    setDrawing(false);
  }

  function clearCanvas() {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");

    if (!canvas || !context) {
      return;
    }

    context.clearRect(0, 0, canvas.width, canvas.height);
  }

  return (
    <Card className="border-stone-300">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base">그림판</CardTitle>
        <button
          type="button"
          onClick={clearCanvas}
          className="rounded-lg border border-dashed border-stone-300 px-3 py-1 text-xs text-muted-foreground transition hover:bg-stone-50"
        >
          지우기
        </button>
      </CardHeader>
      <CardContent>
        <canvas
          ref={canvasRef}
          width={560}
          height={260}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={stopDrawing}
          onPointerLeave={stopDrawing}
          className="w-full rounded-2xl border border-stone-300 bg-white touch-none"
        />
      </CardContent>
    </Card>
  );
}
